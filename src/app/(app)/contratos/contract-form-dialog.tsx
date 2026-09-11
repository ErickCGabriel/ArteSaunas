"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2Icon, PaperclipIcon, XIcon } from "lucide-react";

import { createContract, updateContract, uploadContractFile } from "./actions";
import { toLocalDateKey } from "@/lib/timezone";
import { formatBytes } from "@/lib/bytes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ContactOption = { id: string; name: string };

type UserOption = { id: string; name: string };

type BudgetOption = {
  id: string;
  number: string;
  title: string;
  contactId: string;
  contactName: string | null;
  totalCents: number;
};

type ContractData = {
  id: string;
  contactId: string;
  budgetId: string | null;
  contractDate: Date;
  totalCents: number;
  notes: string | null;
  assignedToId: string | null;
};

export function ContractFormDialog({
  contract,
  contacts,
  budgets,
  users,
  currentUserId,
  trigger,
  defaultBudgetId,
  defaultOpen,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  contract?: ContractData;
  contacts: ContactOption[];
  budgets: BudgetOption[];
  users: UserOption[];
  currentUserId: string;
  trigger?: ReactNode;
  /** Pré-seleciona um orçamento ao abrir para criar um contrato novo (vindo do orçamento). */
  defaultBudgetId?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const [error, setError] = useState<string>();

  const initialBudgetId = contract?.budgetId ?? defaultBudgetId ?? "";
  const initialBudget = budgets.find((b) => b.id === initialBudgetId);

  const [budgetId, setBudgetId] = useState(initialBudgetId);
  const [contactId, setContactId] = useState(
    contract?.contactId ?? initialBudget?.contactId ?? ""
  );
  const [total, setTotal] = useState(
    contract
      ? (contract.totalCents / 100).toFixed(2).replace(".", ",")
      : initialBudget
        ? (initialBudget.totalCents / 100).toFixed(2).replace(".", ",")
        : ""
  );
  const [totalTouched, setTotalTouched] = useState(Boolean(contract));
  const [assignedToId, setAssignedToId] = useState(
    contract?.assignedToId ?? currentUserId
  );
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleBudgetChange(nextBudgetId: string) {
    setBudgetId(nextBudgetId);
    const budget = budgets.find((b) => b.id === nextBudgetId);
    if (budget) {
      setContactId(budget.contactId);
      if (!totalTouched) setTotal((budget.totalCents / 100).toFixed(2).replace(".", ","));
    }
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    setStagedFiles((prev) => [...prev, ...Array.from(files)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeStagedFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = contract
        ? await updateContract(contract.id, {}, formData)
        : await createContract({}, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setError(undefined);

      if (!contract && result.id && stagedFiles.length > 0) {
        const failures: string[] = [];
        for (const file of stagedFiles) {
          const fileFormData = new FormData();
          fileFormData.set("file", file);
          const uploadResult = await uploadContractFile(result.id, {}, fileFormData);
          if (uploadResult.error) failures.push(file.name);
        }
        if (failures.length > 0) {
          toast.error(`Contrato registrado, mas falha ao enviar: ${failures.join(", ")}`);
        } else {
          toast.success("Contrato registrado e arquivos enviados.");
        }
      } else {
        toast.success(contract ? "Contrato atualizado." : "Contrato registrado.");
      }
      setOpen(false);
      setStagedFiles([]);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contract ? "Editar contrato" : "Novo contrato"}</DialogTitle>
          <DialogDescription>
            {contract
              ? "O número do contrato não muda depois de criado."
              : "O número do contrato é gerado automaticamente."}
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="contactId" value={contactId} />
          <input type="hidden" name="budgetId" value={budgetId} />
          <input type="hidden" name="assignedToId" value={assignedToId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="contactId-trigger">Cliente *</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger id="contactId-trigger">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {contacts.map((contact) => (
                  <SelectItem key={contact.id} value={contact.id}>
                    {contact.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budgetId-trigger">Orçamento de origem (opcional)</Label>
            <Select value={budgetId} onValueChange={handleBudgetChange}>
              <SelectTrigger id="budgetId-trigger">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {budgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.number} — {budget.title}
                    {budget.contactName ? ` (${budget.contactName})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="assignedToId-trigger">Responsável</Label>
            <Select value={assignedToId} onValueChange={setAssignedToId}>
              <SelectTrigger id="assignedToId-trigger">
                <SelectValue placeholder="Selecione um responsável" />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contractDate">Data *</Label>
              <Input
                id="contractDate"
                name="contractDate"
                type="date"
                required
                defaultValue={
                  contract ? toLocalDateKey(contract.contractDate) : toLocalDateKey(new Date())
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="total">Valor (R$) *</Label>
              <Input
                id="total"
                name="total"
                required
                inputMode="decimal"
                value={total}
                onChange={(e) => {
                  setTotalTouched(true);
                  setTotal(e.target.value);
                }}
                placeholder="0,00"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={contract?.notes ?? ""}
              placeholder="Condições, prazos, detalhes do acordo"
            />
          </div>

          {!contract && (
            <div className="flex flex-col gap-1.5">
              <Label>Arquivos (opcional)</Label>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PaperclipIcon className="size-4" />
                  Anexar arquivos
                </Button>
              </div>
              {stagedFiles.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {stagedFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-3"
                    >
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatBytes(file.size)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeStagedFile(index)}
                      >
                        <XIcon className="size-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending || !contactId}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

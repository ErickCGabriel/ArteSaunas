"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, PaperclipIcon, UserIcon, XIcon } from "lucide-react";

import { createBudget, updateBudget, uploadBudgetFile } from "./actions";
import { BudgetItemsEditor, type BudgetItemInput } from "./budget-items-editor";
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
import { formatCentsToBRL } from "@/lib/currency";
import { formatBytes } from "@/lib/bytes";

type ContactOption = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
};

type BudgetData = {
  id: string;
  title: string;
  contactId: string;
  requesterName: string | null;
  requesterPhone: string | null;
  addressStreet: string | null;
  addressNumber: string | null;
  addressNeighborhood: string | null;
  addressCity: string | null;
  addressState: string | null;
  roomLength: number | null;
  roomWidth: number | null;
  roomHeight: number | null;
  hasGlassAndStones: boolean | null;
  technicalSpecs: string | null;
  notes: string | null;
  items: { description: string; quantity: number; unitPriceCents: number }[];
};

function numberToInput(value: number | null) {
  return value === null ? "" : String(value).replace(".", ",");
}

export function BudgetForm({
  contacts,
  budget,
}: {
  contacts: ContactOption[];
  budget?: BudgetData;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const [contactId, setContactId] = useState(budget?.contactId ?? "");
  const [addressStreet, setAddressStreet] = useState(budget?.addressStreet ?? "");
  const [addressTouched, setAddressTouched] = useState(Boolean(budget?.addressStreet));
  const [requesterName, setRequesterName] = useState(budget?.requesterName ?? "");
  const [requesterPhone, setRequesterPhone] = useState(budget?.requesterPhone ?? "");
  const [hasGlassAndStones, setHasGlassAndStones] = useState(
    budget?.hasGlassAndStones === true
      ? "sim"
      : budget?.hasGlassAndStones === false
        ? "nao"
        : ""
  );
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleContactChange(nextContactId: string) {
    setContactId(nextContactId);
    if (!addressTouched) {
      const contact = contacts.find((c) => c.id === nextContactId);
      if (contact?.address) setAddressStreet(contact.address);
    }
  }

  function useClientAsRequester() {
    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;
    setRequesterName(contact.name);
    setRequesterPhone(contact.phone ?? "");
  }

  const initialItems: BudgetItemInput[] | undefined = budget?.items.map(
    (item) => ({
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: formatCentsToBRL(item.unitPriceCents).replace(/[^\d,.-]/g, ""),
    })
  );

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = budget
        ? await updateBudget(budget.id, {}, formData)
        : await createBudget({}, formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setError(undefined);

      if (budget) {
        toast.success("Orçamento atualizado.");
        router.push(`/orcamentos/${budget.id}`);
        return;
      }

      const newId = result.id!;
      if (stagedFiles.length > 0) {
        const failures: string[] = [];
        for (const file of stagedFiles) {
          const fileFormData = new FormData();
          fileFormData.set("file", file);
          const uploadResult = await uploadBudgetFile(newId, {}, fileFormData);
          if (uploadResult.error) failures.push(file.name);
        }
        if (failures.length > 0) {
          toast.error(`Orçamento criado, mas falha ao enviar: ${failures.join(", ")}`);
        } else {
          toast.success("Orçamento criado e arquivos enviados.");
        }
      } else {
        toast.success("Orçamento criado.");
      }
      router.push(`/orcamentos/${newId}`);
    });
  }

  function handleFilesSelected(files: FileList | null) {
    if (!files) return;
    setStagedFiles((prev) => [...prev, ...Array.from(files)]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeStagedFile(index: number) {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="contactId" value={contactId} />
      <input type="hidden" name="hasGlassAndStones" value={hasGlassAndStones} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="contactId-trigger">Cliente *</Label>
          <Select value={contactId} onValueChange={handleContactChange}>
            <SelectTrigger id="contactId-trigger">
              <SelectValue placeholder="Selecione um cliente" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  {contact.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {contacts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Cadastre um contato antes de criar um orçamento.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={budget?.title}
            placeholder="Ex: Sauna a vapor residencial"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="requesterName">Solicitante</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!contactId}
            onClick={useClientAsRequester}
          >
            <UserIcon className="size-3.5" />
            Usar dados do cliente
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="requesterName"
            name="requesterName"
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            placeholder="Nome de quem solicitou"
          />
          <Input
            name="requesterPhone"
            value={requesterPhone}
            onChange={(e) => setRequesterPhone(e.target.value)}
            placeholder="Telefone"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Preencha só se for diferente do cliente.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Endereço da instalação</Label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px]">
          <Input
            name="addressStreet"
            value={addressStreet}
            onChange={(e) => {
              setAddressTouched(true);
              setAddressStreet(e.target.value);
            }}
            placeholder="Rua / Avenida"
          />
          <Input name="addressNumber" defaultValue={budget?.addressNumber ?? ""} placeholder="Número" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_80px]">
          <Input
            name="addressNeighborhood"
            defaultValue={budget?.addressNeighborhood ?? ""}
            placeholder="Bairro"
          />
          <Input name="addressCity" defaultValue={budget?.addressCity ?? ""} placeholder="Cidade" />
          <Input
            name="addressState"
            defaultValue={budget?.addressState ?? ""}
            placeholder="UF"
            maxLength={2}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Dimensões do ambiente (metros)</Label>
        <div className="grid grid-cols-3 gap-4 sm:max-w-md">
          <Input
            name="roomLength"
            defaultValue={numberToInput(budget?.roomLength ?? null)}
            inputMode="decimal"
            placeholder="Compr."
          />
          <Input
            name="roomWidth"
            defaultValue={numberToInput(budget?.roomWidth ?? null)}
            inputMode="decimal"
            placeholder="Larg."
          />
          <Input
            name="roomHeight"
            defaultValue={numberToInput(budget?.roomHeight ?? null)}
            inputMode="decimal"
            placeholder="Alt."
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 sm:w-64">
        <Label htmlFor="glassStones-trigger">Projeto possui vidros e pedras?</Label>
        <Select value={hasGlassAndStones} onValueChange={setHasGlassAndStones}>
          <SelectTrigger id="glassStones-trigger">
            <SelectValue placeholder="Não informado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sim">Sim</SelectItem>
            <SelectItem value="nao">Não</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="technicalSpecs">Especificações técnicas</Label>
        <Textarea
          id="technicalSpecs"
          name="technicalSpecs"
          rows={6}
          defaultValue={budget?.technicalSpecs ?? ""}
          placeholder={"Uma especificação por linha, ex:\nRevestimento vertical em lambris de madeira perobinha\nIsolamento térmico atrás do revestimento\nForno de 6kw bifásico, painel smart wifi"}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Itens do orçamento *</Label>
        <BudgetItemsEditor name="items" initialItems={initialItems} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes">Observações</Label>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={budget?.notes ?? ""}
          placeholder="Observações internas ou condições do orçamento"
        />
      </div>

      {!budget && (
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

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={isPending || !contactId}
        >
          {isPending && <Loader2Icon className="animate-spin" />}
          {budget ? "Salvar alterações" : "Criar orçamento"}
        </Button>
      </div>
    </form>
  );
}

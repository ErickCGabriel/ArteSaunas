"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { createInvoice, updateInvoice } from "./actions";
import { toLocalDateKey } from "@/lib/timezone";
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

type BudgetOption = {
  id: string;
  number: string;
  title: string;
  contactName: string | null;
  totalCents: number;
};

type InvoiceData = {
  id: string;
  number: string;
  budgetId: string;
  issueDate: Date;
  totalCents: number;
  notes: string | null;
};

export function InvoiceFormDialog({
  invoice,
  budgets,
  trigger,
  defaultBudgetId,
  defaultOpen,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  invoice?: InvoiceData;
  budgets: BudgetOption[];
  trigger?: ReactNode;
  /** Pré-seleciona um orçamento ao abrir para criar uma nota nova (vindo do orçamento). */
  defaultBudgetId?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen ?? false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const [error, setError] = useState<string>();
  const [budgetId, setBudgetId] = useState(invoice?.budgetId ?? defaultBudgetId ?? "");
  const [total, setTotal] = useState(
    invoice ? (invoice.totalCents / 100).toFixed(2).replace(".", ",") : ""
  );
  const [totalTouched, setTotalTouched] = useState(Boolean(invoice));
  const [isPending, startTransition] = useTransition();

  function handleBudgetChange(nextBudgetId: string) {
    setBudgetId(nextBudgetId);
    if (!totalTouched) {
      const budget = budgets.find((b) => b.id === nextBudgetId);
      if (budget) setTotal((budget.totalCents / 100).toFixed(2).replace(".", ","));
    }
  }

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = invoice
        ? await updateInvoice(invoice.id, {}, formData)
        : await createInvoice({}, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setError(undefined);
      toast.success(invoice ? "Nota fiscal atualizada." : "Nota fiscal registrada.");
      setOpen(false);
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
          <DialogTitle>{invoice ? "Editar nota fiscal" : "Nova nota fiscal"}</DialogTitle>
          <DialogDescription>
            Registro interno da nota fiscal emitida no seu sistema fiscal, vinculada a
            um orçamento.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="budgetId" value={budgetId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budgetId-trigger">Orçamento *</Label>
            <Select value={budgetId} onValueChange={handleBudgetChange}>
              <SelectTrigger id="budgetId-trigger">
                <SelectValue placeholder="Selecione o orçamento" />
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="number">Número da NF *</Label>
              <Input
                id="number"
                name="number"
                required
                defaultValue={invoice?.number}
                placeholder="Ex: 1234"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="issueDate">Emissão *</Label>
              <Input
                id="issueDate"
                name="issueDate"
                type="date"
                required
                defaultValue={invoice ? toLocalDateKey(invoice.issueDate) : toLocalDateKey(new Date())}
              />
            </div>
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={invoice?.notes ?? ""}
              placeholder="Detalhes adicionais"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending || !budgetId}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


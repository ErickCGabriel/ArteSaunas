"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2Icon, Trash2Icon } from "lucide-react";

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
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createMaintenanceRecord, deleteMaintenanceRecord } from "./history-actions";
import { APP_TIME_ZONE, toLocalDateKey } from "@/lib/timezone";

type BudgetOption = { id: string; number: string; title: string };

type MaintenanceData = {
  id: string;
  description: string;
  occurredAt: Date;
  budgetId: string | null;
  createdByName: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  dateStyle: "long",
});

export function MaintenanceRecords({
  contactId,
  records,
  budgetOptions,
  canDelete,
}: {
  contactId: string;
  records: MaintenanceData[];
  budgetOptions: BudgetOption[];
  canDelete: boolean;
}) {
  const [description, setDescription] = useState("");
  const [occurredAt, setOccurredAt] = useState(toLocalDateKey(new Date()));
  const [budgetId, setBudgetId] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createMaintenanceRecord(contactId, {}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setDescription("");
      setBudgetId("");
      toast.success("Registro adicionado.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={handleSubmit} className="flex flex-col gap-3">
        <input type="hidden" name="budgetId" value={budgetId} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="occurredAt">Data</Label>
            <Input
              id="occurredAt"
              name="occurredAt"
              type="date"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="budgetId-trigger">Orçamento relacionado (opcional)</Label>
            <Select value={budgetId} onValueChange={setBudgetId}>
              <SelectTrigger id="budgetId-trigger">
                <SelectValue placeholder="Nenhum" />
              </SelectTrigger>
              <SelectContent>
                {budgetOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.number} — {b.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Textarea
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="O que aconteceu / o que foi feito"
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending || !description.trim()}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Adicionar registro
          </Button>
        </div>
      </form>

      {records.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma manutenção ou problema registrado ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {records.map((record) => {
            const budget = budgetOptions.find((b) => b.id === record.budgetId);
            return (
              <li key={record.id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {dateFormatter.format(record.occurredAt)}
                    </p>
                    <p className="whitespace-pre-wrap text-sm">{record.description}</p>
                    {budget && (
                      <Link
                        href={`/orcamentos/${budget.id}`}
                        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                      >
                        Orçamento: {budget.number} — {budget.title}
                      </Link>
                    )}
                  </div>
                  {canDelete && (
                    <ConfirmDeleteButton
                      id={record.id}
                      action={deleteMaintenanceRecord}
                      title="Excluir registro"
                      description="Tem certeza que deseja excluir esse registro de manutenção/problema? Essa ação não pode ser desfeita."
                      trigger={
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <Trash2Icon className="size-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      }
                    />
                  )}
                </div>
                {record.createdByName && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Registrado por {record.createdByName}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

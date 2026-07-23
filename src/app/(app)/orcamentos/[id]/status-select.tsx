"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateBudgetStatus } from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Budget } from "@/db/schema";

const OPTIONS: { value: Budget["status"]; label: string }[] = [
  { value: "rascunho", label: "Rascunho" },
  { value: "enviado", label: "Enviado" },
  { value: "aprovado", label: "Aprovado" },
  { value: "recusado", label: "Recusado" },
];

export function StatusSelect({
  budgetId,
  status,
}: {
  budgetId: string;
  status: Budget["status"];
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await updateBudgetStatus(budgetId, next);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Status atualizado.");
    });
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={isPending}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

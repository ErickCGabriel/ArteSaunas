"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { updateContractStatus } from "../actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Contract } from "@/db/schema";

const OPTIONS: { value: Contract["status"]; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "assinado", label: "Assinado" },
  { value: "cancelado", label: "Cancelado" },
];

export function StatusSelect({
  contractId,
  status,
}: {
  contractId: string;
  status: Contract["status"];
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(next: string) {
    startTransition(async () => {
      const result = await updateContractStatus(contractId, next);
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

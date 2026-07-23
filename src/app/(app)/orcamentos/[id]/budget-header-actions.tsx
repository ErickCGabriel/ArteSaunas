"use client";

import { useRouter } from "next/navigation";
import { DownloadIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { deleteBudget } from "../actions";
import { StatusSelect } from "./status-select";
import type { Budget } from "@/db/schema";

export function BudgetHeaderActions({
  budgetId,
  number,
  status,
}: {
  budgetId: string;
  number: string;
  status: Budget["status"];
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusSelect budgetId={budgetId} status={status} />
      <Button variant="outline" asChild>
        <a href={`/api/orcamentos/${budgetId}/pdf`} download>
          <DownloadIcon className="size-4" />
          Baixar PDF
        </a>
      </Button>
      <ConfirmDeleteButton
        id={budgetId}
        action={deleteBudget}
        title="Excluir orçamento"
        description={`Tem certeza que deseja excluir o orçamento ${number}? Essa ação não pode ser desfeita.`}
        onSuccess={() => router.push("/orcamentos")}
        trigger={
          <Button variant="outline">
            <Trash2Icon className="size-4" />
            Excluir
          </Button>
        }
      />
    </div>
  );
}

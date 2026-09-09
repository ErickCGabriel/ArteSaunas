"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PencilIcon, PowerIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { InvoiceFormDialog } from "../invoice-form-dialog";
import { deleteInvoice, updateInvoiceStatus } from "../actions";
import type { Invoice } from "@/db/schema";

type ContactOption = { id: string; name: string };

type BudgetOption = {
  id: string;
  number: string;
  title: string;
  contactId: string;
  contactName: string | null;
  totalCents: number;
};

type InvoiceData = {
  id: string;
  number: string;
  contactId: string;
  budgetId: string | null;
  issueDate: Date;
  totalCents: number;
  notes: string | null;
};

export function InvoiceHeaderActions({
  invoice,
  status,
  contacts,
  budgets,
}: {
  invoice: InvoiceData;
  status: Invoice["status"];
  contacts: ContactOption[];
  budgets: BudgetOption[];
}) {
  const router = useRouter();
  const [isTogglePending, startToggleTransition] = useTransition();

  function handleToggleStatus() {
    startToggleTransition(async () => {
      const next = status === "emitida" ? "cancelada" : "emitida";
      const result = await updateInvoiceStatus(invoice.id, next);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(next === "cancelada" ? "Nota fiscal cancelada." : "Nota fiscal reativada.");
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <InvoiceFormDialog
        invoice={invoice}
        contacts={contacts}
        budgets={budgets}
        trigger={
          <Button variant="outline">
            <PencilIcon className="size-4" />
            Editar
          </Button>
        }
      />
      <Button variant="outline" disabled={isTogglePending} onClick={handleToggleStatus}>
        <PowerIcon className="size-4" />
        {status === "emitida" ? "Cancelar" : "Reativar"}
      </Button>
      <ConfirmDeleteButton
        id={invoice.id}
        action={deleteInvoice}
        title="Excluir nota fiscal"
        description={`Tem certeza que deseja excluir o registro da nota fiscal ${invoice.number}? Essa ação não pode ser desfeita.`}
        onSuccess={() => router.push("/notas-fiscais")}
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

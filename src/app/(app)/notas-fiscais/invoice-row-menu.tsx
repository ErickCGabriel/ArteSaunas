"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontalIcon, PencilIcon, PowerIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { InvoiceFormDialog } from "./invoice-form-dialog";
import { deleteInvoice, updateInvoiceStatus } from "./actions";
import type { Invoice } from "@/db/schema";

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

type InvoiceData = {
  id: string;
  number: string;
  contactId: string;
  budgetId: string | null;
  issueDate: Date;
  totalCents: number;
  notes: string | null;
  assignedToId: string | null;
  status: Invoice["status"];
};

export function InvoiceRowMenu({
  invoice,
  contacts,
  budgets,
  users,
  currentUserId,
  canDelete,
}: {
  invoice: InvoiceData;
  contacts: ContactOption[];
  budgets: BudgetOption[];
  users: UserOption[];
  currentUserId: string;
  canDelete: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isTogglePending, startToggleTransition] = useTransition();

  function handleToggleStatus() {
    startToggleTransition(async () => {
      const next = invoice.status === "emitida" ? "cancelada" : "emitida";
      const result = await updateInvoiceStatus(invoice.id, next);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(next === "cancelada" ? "Nota fiscal cancelada." : "Nota fiscal reativada.");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontalIcon className="size-4" />
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <PencilIcon className="size-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isTogglePending} onSelect={handleToggleStatus}>
            <PowerIcon className="size-4" />
            {invoice.status === "emitida" ? "Cancelar" : "Reativar"}
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
                <Trash2Icon className="size-4" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <InvoiceFormDialog
        invoice={invoice}
        contacts={contacts}
        budgets={budgets}
        users={users}
        currentUserId={currentUserId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {canDelete && (
        <ConfirmDeleteButton
          id={invoice.id}
          action={deleteInvoice}
          title="Excluir nota fiscal"
          description={`Tem certeza que deseja excluir o registro da nota fiscal ${invoice.number}? Essa ação não pode ser desfeita.`}
          trigger={false}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}

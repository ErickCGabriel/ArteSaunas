"use client";

import { useState } from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ContractFormDialog } from "./contract-form-dialog";
import { deleteContract } from "./actions";

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
  number: string;
  contactId: string;
  budgetId: string | null;
  contractDate: Date;
  totalCents: number;
  notes: string | null;
  assignedToId: string | null;
};

export function ContractRowMenu({
  contract,
  contacts,
  budgets,
  users,
  currentUserId,
  canDelete,
}: {
  contract: ContractData;
  contacts: ContactOption[];
  budgets: BudgetOption[];
  users: UserOption[];
  currentUserId: string;
  canDelete: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

      <ContractFormDialog
        contract={contract}
        contacts={contacts}
        budgets={budgets}
        users={users}
        currentUserId={currentUserId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {canDelete && (
        <ConfirmDeleteButton
          id={contract.id}
          action={deleteContract}
          title="Excluir contrato"
          description={`Tem certeza que deseja excluir o contrato ${contract.number}? Essa ação não pode ser desfeita.`}
          trigger={false}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}

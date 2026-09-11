"use client";

import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ContractFormDialog } from "../contract-form-dialog";
import { deleteContract } from "../actions";
import { StatusSelect } from "./status-select";
import type { Contract } from "@/db/schema";

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

export function ContractHeaderActions({
  contract,
  status,
  contacts,
  budgets,
  users,
  currentUserId,
  canDelete,
}: {
  contract: ContractData;
  status: Contract["status"];
  contacts: ContactOption[];
  budgets: BudgetOption[];
  users: UserOption[];
  currentUserId: string;
  canDelete: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <StatusSelect contractId={contract.id} status={status} />
      <ContractFormDialog
        contract={contract}
        contacts={contacts}
        budgets={budgets}
        users={users}
        currentUserId={currentUserId}
        trigger={
          <Button variant="outline">
            <PencilIcon className="size-4" />
            Editar
          </Button>
        }
      />
      {canDelete && (
        <ConfirmDeleteButton
          id={contract.id}
          action={deleteContract}
          title="Excluir contrato"
          description={`Tem certeza que deseja excluir o contrato ${contract.number}? Essa ação não pode ser desfeita.`}
          onSuccess={() => router.push("/contratos")}
          trigger={
            <Button variant="outline">
              <Trash2Icon className="size-4" />
              Excluir
            </Button>
          }
        />
      )}
    </div>
  );
}

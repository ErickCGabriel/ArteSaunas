"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PowerIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { UserFormDialog } from "./user-form-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { deleteUser, toggleUserActive } from "./actions";

type UserData = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "admin" | "operador";
  active: boolean;
};

export function UserRowMenu({
  user,
  isSelf,
}: {
  user: UserData;
  isSelf: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isTogglePending, startToggleTransition] = useTransition();

  function handleToggleActive() {
    startToggleTransition(async () => {
      const result = await toggleUserActive(user.id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(user.active ? "Usuário desativado." : "Usuário ativado.");
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
          <DropdownMenuItem onSelect={() => setResetOpen(true)}>
            <KeyRoundIcon className="size-4" />
            Redefinir senha
          </DropdownMenuItem>
          {!isSelf && (
            <DropdownMenuItem
              disabled={isTogglePending}
              onSelect={handleToggleActive}
            >
              <PowerIcon className="size-4" />
              {user.active ? "Desativar" : "Ativar"}
            </DropdownMenuItem>
          )}
          {!isSelf && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2Icon className="size-4" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserFormDialog user={user} open={editOpen} onOpenChange={setEditOpen} />

      <ResetPasswordDialog
        userId={user.id}
        userName={user.name}
        open={resetOpen}
        onOpenChange={setResetOpen}
      />

      {!isSelf && (
        <ConfirmDeleteButton
          id={user.id}
          action={deleteUser}
          title="Excluir usuário"
          description={`Tem certeza que deseja excluir "${user.name}"? Essa ação não pode ser desfeita.`}
          trigger={false}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}

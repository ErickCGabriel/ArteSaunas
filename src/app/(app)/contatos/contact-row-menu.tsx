"use client";

import { useState } from "react";
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { ContactFormDialog } from "./contact-form-dialog";
import { deleteContact } from "./actions";

type ContactData = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export function ContactRowMenu({ contact }: { contact: ContactData }) {
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
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2Icon className="size-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ContactFormDialog
        contact={contact}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDeleteButton
        id={contact.id}
        action={deleteContact}
        title="Excluir contato"
        description={`Tem certeza que deseja excluir "${contact.name}"? Essa ação não pode ser desfeita.`}
        trigger={false}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}

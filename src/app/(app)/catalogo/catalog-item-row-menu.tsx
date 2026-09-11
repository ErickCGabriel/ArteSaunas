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
import { CatalogItemFormDialog } from "./catalog-item-form-dialog";
import { deleteCatalogItem } from "./actions";

type CatalogItemData = {
  id: string;
  description: string;
  defaultUnitPriceCents: number;
};

export function CatalogItemRowMenu({
  item,
  canDelete,
}: {
  item: CatalogItemData;
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
            <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
              <Trash2Icon className="size-4" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <CatalogItemFormDialog item={item} open={editOpen} onOpenChange={setEditOpen} />

      {canDelete && (
        <ConfirmDeleteButton
          id={item.id}
          action={deleteCatalogItem}
          title="Excluir item do catálogo"
          description={`Tem certeza que deseja excluir "${item.description}" do catálogo? Orçamentos que já usam essa descrição não são afetados.`}
          trigger={false}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
        />
      )}
    </>
  );
}

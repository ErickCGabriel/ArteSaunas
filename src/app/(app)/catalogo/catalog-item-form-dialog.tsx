"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { createCatalogItem, updateCatalogItem } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CatalogItemData = {
  id: string;
  description: string;
  defaultUnitPriceCents: number;
};

export function CatalogItemFormDialog({
  item,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  item?: CatalogItemData;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = item
        ? await updateCatalogItem(item.id, {}, formData)
        : await createCatalogItem({}, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setError(undefined);
      toast.success(item ? "Item atualizado." : "Item adicionado ao catálogo.");
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError(undefined);
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Editar item do catálogo" : "Novo item no catálogo"}</DialogTitle>
          <DialogDescription>
            Itens salvos aqui aparecem como sugestão ao adicionar itens num orçamento —
            não impedem digitar qualquer outra coisa.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição *</Label>
            <Input
              id="description"
              name="description"
              required
              defaultValue={item?.description}
              placeholder="Ex: Forno de 6kw bifásico, painel smart wifi"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="defaultUnitPrice">Valor unitário padrão</Label>
            <Input
              id="defaultUnitPrice"
              name="defaultUnitPrice"
              inputMode="decimal"
              defaultValue={
                item ? (item.defaultUnitPriceCents / 100).toFixed(2).replace(".", ",") : ""
              }
              placeholder="0,00"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2Icon className="animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

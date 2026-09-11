"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { createContact, updateContact } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ContactData = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export function ContactFormDialog({
  contact,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  contact?: ContactData;
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
      const result = contact
        ? await updateContact(contact.id, {}, formData)
        : await createContact({}, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setError(undefined);
      toast.success(contact ? "Contato atualizado." : "Contato criado.");
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
          <DialogTitle>
            {contact ? "Editar contato" : "Novo contato"}
          </DialogTitle>
          <DialogDescription>
            Dados de clientes e outros contatos da Arte Saunas.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={contact?.name}
              placeholder="Nome completo ou empresa"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={contact?.phone ?? ""}
                placeholder="(11) 90000-0000"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={contact?.email ?? ""}
                placeholder="cliente@exemplo.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="address">Endereço</Label>
            <Input
              id="address"
              name="address"
              defaultValue={contact?.address ?? ""}
              placeholder="Endereço para instalação/visita"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Observação</Label>
            <Textarea
              id="notes"
              name="notes"
              defaultValue={contact?.notes ?? ""}
              placeholder="Observações internas sobre o contato"
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

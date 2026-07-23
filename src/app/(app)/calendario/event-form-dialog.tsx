"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

import { createEvent, updateEvent } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Option = { id: string; label: string };

type EventData = {
  id: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  contactId: string | null;
  budgetId: string | null;
};

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function toTimeInput(date: Date) {
  return date.toTimeString().slice(0, 5);
}

export function EventFormDialog({
  event,
  contacts,
  budgets,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: {
  event?: EventData;
  contacts: Option[];
  budgets: Option[];
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const [error, setError] = useState<string>();
  const [contactId, setContactId] = useState(event?.contactId ?? "");
  const [budgetId, setBudgetId] = useState(event?.budgetId ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = event
        ? await updateEvent(event.id, {}, formData)
        : await createEvent({}, formData);

      if (result.error) {
        setError(result.error);
        return;
      }

      setError(undefined);
      toast.success(event ? "Evento atualizado." : "Evento criado.");
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
          <DialogTitle>{event ? "Editar evento" : "Novo evento"}</DialogTitle>
          <DialogDescription>
            Evento criado no Google Calendar da empresa.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input type="hidden" name="contactId" value={contactId} />
          <input type="hidden" name="budgetId" value={budgetId} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={event?.title}
              placeholder="Ex: Visita técnica"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                name="date"
                type="date"
                required
                defaultValue={event ? toDateInput(event.startAt) : undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="startTime">Início *</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                required
                defaultValue={event ? toTimeInput(event.startAt) : "09:00"}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="endTime">Término *</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                required
                defaultValue={event ? toTimeInput(event.endAt) : "10:00"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactId-trigger">Contato (opcional)</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger id="contactId-trigger">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="budgetId-trigger">Orçamento (opcional)</Label>
              <Select value={budgetId} onValueChange={setBudgetId}>
                <SelectTrigger id="budgetId-trigger">
                  <SelectValue placeholder="Nenhum" />
                </SelectTrigger>
                <SelectContent>
                  {budgets.map((budget) => (
                    <SelectItem key={budget.id} value={budget.id}>
                      {budget.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={event?.description ?? ""}
              placeholder="Detalhes do compromisso"
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

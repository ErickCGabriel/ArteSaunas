"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  FileTextIcon,
  UserIcon,
  MapPinIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { EventFormDialog } from "./event-form-dialog";
import { deleteEvent } from "./actions";
import { APP_TIME_ZONE } from "@/lib/timezone";

type Option = { id: string; label: string; address?: string | null };

type EventData = {
  id: string;
  title: string;
  description: string | null;
  address: string | null;
  startAt: Date;
  endAt: Date;
  contactId: string | null;
  budgetId: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

export function EventRow({
  event,
  contacts,
  budgets,
}: {
  event: EventData;
  contacts: Option[];
  budgets: Option[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const contact = contacts.find((c) => c.id === event.contactId);
  const budget = budgets.find((b) => b.id === event.budgetId);

  return (
    <div className="flex items-start gap-4 rounded-lg border border-border p-4">
      <div className="flex w-20 flex-col items-center rounded-md bg-muted px-2 py-2 text-center">
        <span className="text-xs uppercase text-muted-foreground">
          {dateFormatter.format(event.startAt)}
        </span>
        <span className="text-sm font-medium">
          {timeFormatter.format(event.startAt)}–{timeFormatter.format(event.endAt)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium">{event.title}</p>
        {event.description && (
          <p className="text-sm text-muted-foreground">{event.description}</p>
        )}
        {event.address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(event.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <MapPinIcon className="size-3" />
            {event.address}
          </a>
        )}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {contact && (
            <span className="flex items-center gap-1">
              <UserIcon className="size-3" />
              {contact.label}
            </span>
          )}
          {budget && (
            <Link
              href={`/orcamentos/${budget.id}`}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <FileTextIcon className="size-3" />
              {budget.label}
            </Link>
          )}
        </div>
      </div>

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

      <EventFormDialog
        event={event}
        contacts={contacts}
        budgets={budgets}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDeleteButton
        id={event.id}
        action={deleteEvent}
        title="Excluir evento"
        description={`Tem certeza que deseja excluir "${event.title}" do Google Calendar?`}
        trigger={false}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

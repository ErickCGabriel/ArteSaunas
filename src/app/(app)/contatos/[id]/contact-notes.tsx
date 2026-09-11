"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { createContactNote, deleteContactNote } from "./history-actions";
import { APP_TIME_ZONE } from "@/lib/timezone";

type NoteData = {
  id: string;
  body: string;
  createdAt: Date;
  createdByName: string | null;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function ContactNotes({
  contactId,
  notes,
  canDelete,
}: {
  contactId: string;
  notes: NoteData[];
  canDelete: boolean;
}) {
  const [body, setBody] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createContactNote(contactId, {}, formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setBody("");
      toast.success("Anotação adicionada.");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={handleSubmit} className="flex flex-col gap-2">
        <Textarea
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Registre aqui algo que aconteceu com esse cliente..."
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={isPending || !body.trim()}>
            {isPending && <Loader2Icon className="animate-spin" />}
            Adicionar anotação
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhuma anotação registrada ainda.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-border p-3">
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                {canDelete && (
                  <ConfirmDeleteButton
                    id={note.id}
                    action={deleteContactNote}
                    title="Excluir anotação"
                    description="Tem certeza que deseja excluir essa anotação? Essa ação não pode ser desfeita."
                    trigger={
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <Trash2Icon className="size-4" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    }
                  />
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {dateFormatter.format(note.createdAt)}
                {note.createdByName ? ` · ${note.createdByName}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

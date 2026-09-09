"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Loader2Icon,
  FileIcon,
  FileTextIcon,
  ImageIcon,
  DownloadIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { APP_TIME_ZONE } from "@/lib/timezone";
import { formatBytes } from "@/lib/bytes";

export type AttachedFile = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
};

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: APP_TIME_ZONE,
  dateStyle: "short",
  timeStyle: "short",
});


function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <ImageIcon className="size-5" />;
  if (mimeType === "application/pdf" || mimeType === "text/xml" || mimeType === "application/xml")
    return <FileTextIcon className="size-5" />;
  return <FileIcon className="size-5" />;
}

export function FileAttachments({
  files,
  uploadAction,
  deleteAction,
  downloadHref,
  emptyMessage = "Nenhum arquivo enviado ainda.",
}: {
  files: AttachedFile[];
  uploadAction: (formData: FormData) => Promise<{ error?: string }>;
  deleteAction: (fileId: string) => Promise<{ error?: string } | void>;
  downloadHref: (fileId: string) => string;
  emptyMessage?: string;
}) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await uploadAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      toast.success("Arquivo enviado.");
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        ref={formRef}
        action={handleSubmit}
        className="flex flex-wrap items-center gap-2"
      >
        <Input type="file" name="file" required className="max-w-xs" />
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <UploadIcon className="size-4" />
          )}
          Enviar arquivo
        </Button>
      </form>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <FileTypeIcon mimeType={file.mimeType} />
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{file.originalName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(file.sizeBytes)} · {dateFormatter.format(file.createdAt)}
                </p>
              </div>
              <Button variant="ghost" size="icon" asChild>
                <a href={downloadHref(file.id)} download>
                  <DownloadIcon className="size-4" />
                  <span className="sr-only">Baixar</span>
                </a>
              </Button>
              <ConfirmDeleteButton
                id={file.id}
                action={deleteAction}
                title="Excluir arquivo"
                description={`Tem certeza que deseja excluir "${file.originalName}"?`}
                trigger={
                  <Button variant="ghost" size="icon">
                    <Trash2Icon className="size-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

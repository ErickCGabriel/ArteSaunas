"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2Icon, UploadIcon } from "lucide-react";

import { importContactsCsv, type ImportContactsState } from "./actions";
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

export function ContactImportDialog({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<ImportContactsState["result"]>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const state = await importContactsCsv({}, formData);
      if (state.error) {
        setError(state.error);
        setResult(undefined);
        return;
      }

      setError(undefined);
      setResult(state.result);
      formRef.current?.reset();

      if (state.result) {
        toast.success(
          `${state.result.created} contato(s) importado(s)${
            state.result.skipped > 0 ? `, ${state.result.skipped} ignorado(s)` : ""
          }.`
        );
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setError(undefined);
          setResult(undefined);
        }
      }}
    >
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar contatos</DialogTitle>
          <DialogDescription>
            Envie um arquivo CSV com as colunas Nome, Telefone, Email, Endereço e
            Observações. Só a coluna Nome é obrigatória. Contatos com telefone ou
            e-mail já cadastrado são ignorados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="file">Arquivo CSV</Label>
            <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {result && (
            <div className="flex flex-col gap-1 rounded-md border bg-muted/40 p-3 text-sm">
              <p>
                <span className="font-medium">{result.created}</span> contato(s)
                importado(s)
                {result.skipped > 0 && (
                  <>
                    , <span className="font-medium">{result.skipped}</span>{" "}
                    ignorado(s)
                  </>
                )}
                .
              </p>
              {result.errors.length > 0 && (
                <ul className="list-inside list-disc text-muted-foreground">
                  {result.errors.map((message, i) => (
                    <li key={i}>{message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <UploadIcon className="size-4" />
              )}
              Importar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { Trash2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type DeleteActionResult = { error?: string } | void;

export function ConfirmDeleteButton({
  id,
  action,
  title,
  description,
  triggerLabel = "Excluir",
  trigger = true,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  onSuccess,
}: {
  id: string;
  action: (id: string) => Promise<DeleteActionResult>;
  title: string;
  description: string;
  triggerLabel?: string;
  trigger?: boolean | ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await action(id);
      if (result && "error" in result && result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Excluído com sucesso.");
      setOpen(false);
      onSuccess?.();
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {trigger === true && (
        <AlertDialogTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2 text-left"
          >
            <Trash2Icon className="size-4" />
            {triggerLabel}
          </button>
        </AlertDialogTrigger>
      )}
      {trigger && trigger !== true && (
        <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={isPending} onClick={handleConfirm}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

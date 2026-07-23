"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CalendarCheckIcon, Loader2Icon, UnlinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { disconnectGoogleCalendar } from "./actions";

export function GoogleConnectionCard({
  accountEmail,
}: {
  accountEmail: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDisconnect() {
    startTransition(async () => {
      const result = await disconnectGoogleCalendar();
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Google Calendar desconectado.");
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <CalendarCheckIcon className="size-5 text-success" />
        <div>
          <p className="text-sm font-medium">Google Calendar conectado</p>
          {accountEmail && (
            <p className="text-xs text-muted-foreground">{accountEmail}</p>
          )}
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={handleDisconnect}
      >
        {isPending ? (
          <Loader2Icon className="animate-spin" />
        ) : (
          <UnlinkIcon className="size-4" />
        )}
        Desconectar
      </Button>
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { syncCalendar } from "./actions";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();

  function handleSync() {
    startTransition(async () => {
      const result = await syncCalendar();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        `Calendário sincronizado (${result.count ?? 0} evento${result.count === 1 ? "" : "s"}).`
      );
    });
  }

  return (
    <Button variant="outline" onClick={handleSync} disabled={isPending}>
      <RefreshCwIcon className={cn("size-4", isPending && "animate-spin")} />
      Sincronizar
    </Button>
  );
}

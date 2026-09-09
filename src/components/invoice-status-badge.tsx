import { Badge } from "@/components/ui/badge";
import type { Invoice } from "@/db/schema";

const STATUS_CONFIG: Record<
  Invoice["status"],
  { label: string; variant: "success" | "destructive" }
> = {
  emitida: { label: "Emitida", variant: "success" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

export function InvoiceStatusBadge({ status }: { status: Invoice["status"] }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

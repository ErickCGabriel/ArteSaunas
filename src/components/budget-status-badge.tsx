import { Badge } from "@/components/ui/badge";
import type { Budget } from "@/db/schema";

const STATUS_CONFIG: Record<
  Budget["status"],
  { label: string; variant: "outline" | "warning" | "success" | "destructive" }
> = {
  rascunho: { label: "Rascunho", variant: "outline" },
  enviado: { label: "Enviado", variant: "warning" },
  aprovado: { label: "Aprovado", variant: "success" },
  recusado: { label: "Recusado", variant: "destructive" },
};

export function BudgetStatusBadge({ status }: { status: Budget["status"] }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

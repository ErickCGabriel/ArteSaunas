import { Badge } from "@/components/ui/badge";
import type { Contract } from "@/db/schema";

const STATUS_CONFIG: Record<
  Contract["status"],
  { label: string; variant: "warning" | "success" | "destructive" }
> = {
  pendente: { label: "Pendente", variant: "warning" },
  assinado: { label: "Assinado", variant: "success" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export function ContractStatusBadge({ status }: { status: Contract["status"] }) {
  const config = STATUS_CONFIG[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

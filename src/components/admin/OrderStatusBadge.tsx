import { Badge } from "./ui";

export function OrderStatusBadge({ status }: { status: string }) {
  if (status === "void") return <Badge tone="danger">Dibatalkan</Badge>;
  if (status === "pending") return <Badge tone="warning">Menunggu</Badge>;
  return <Badge tone="success">Lunas</Badge>;
}

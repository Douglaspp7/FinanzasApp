import { ShoppingCart, UserPlus, CreditCard, AlertTriangle, Server } from "lucide-react";
import { actividades, type Actividad } from "@/lib/mock-data";
import { relativeTime } from "@/lib/utils";

const iconMap = {
  venta: { icon: ShoppingCart, cls: "bg-primary-muted text-primary" },
  cliente: { icon: UserPlus, cls: "bg-success-muted text-success" },
  pago: { icon: CreditCard, cls: "bg-info/10 text-info" },
  alerta: { icon: AlertTriangle, cls: "bg-warning-muted text-warning" },
  sistema: { icon: Server, cls: "bg-surface-2 text-fg-muted" },
} as const;

export function ActivityFeed({ items = actividades }: { items?: Actividad[] }) {
  return (
    <div className="space-y-1">
      {items.map((a) => {
        const { icon: Icon, cls } = iconMap[a.tipo];
        return (
          <div key={a.id} className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2">
            <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cls}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{a.titulo}</p>
              <p className="truncate text-xs text-fg-muted">{a.detalle}</p>
            </div>
            <span className="shrink-0 text-xs text-fg-subtle">{relativeTime(a.fecha)}</span>
          </div>
        );
      })}
    </div>
  );
}

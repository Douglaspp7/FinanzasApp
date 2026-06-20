"use client";

import { X, ShoppingCart, UserPlus, CreditCard, AlertTriangle, Server, CheckCheck } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { actividades } from "@/lib/mock-data";
import { relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const iconMap = {
  venta: { icon: ShoppingCart, cls: "bg-primary-muted text-primary" },
  cliente: { icon: UserPlus, cls: "bg-success-muted text-success" },
  pago: { icon: CreditCard, cls: "bg-info/10 text-info" },
  alerta: { icon: AlertTriangle, cls: "bg-warning-muted text-warning" },
  sistema: { icon: Server, cls: "bg-surface-2 text-fg-muted" },
} as const;

export function NotificationCenter() {
  const { notificationsOpen, setNotificationsOpen } = useUIStore();
  if (!notificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-[90]" onClick={() => setNotificationsOpen(false)}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />
      <div
        className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-border bg-surface shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <h2 className="text-sm font-semibold text-fg">Notificaciones</h2>
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-fg-muted hover:bg-surface-2 hover:text-fg">
              <CheckCheck className="h-3.5 w-3.5" /> Marcar leídas
            </button>
            <button onClick={() => setNotificationsOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-1">
            {[...actividades, ...actividades].map((a, i) => {
              const { icon: Icon, cls } = iconMap[a.tipo];
              return (
                <div key={i} className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-surface-2">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{a.titulo}</p>
                    <p className="text-xs text-fg-muted">{a.detalle}</p>
                    <p className="mt-0.5 text-[11px] text-fg-subtle">{relativeTime(a.fecha)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border p-3">
          <Button variant="secondary" className="w-full">Ver todas</Button>
        </div>
      </div>
    </div>
  );
}

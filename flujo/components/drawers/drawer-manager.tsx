"use client";

import { X, Mail, Phone, MapPin, Calendar, TrendingUp, Receipt } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { Avatar } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Cliente, Transaccion } from "@/lib/mock-data";

function Shell({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const { closeDrawer } = useUIStore();
  return (
    <div className="fixed inset-0 z-[90]" onClick={closeDrawer}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" />
      <div
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <button onClick={closeDrawer} className="flex h-7 w-7 items-center justify-center rounded-md text-fg-muted hover:bg-surface-2 hover:text-fg">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer && <div className="border-t border-border p-4">{footer}</div>}
      </div>
    </div>
  );
}

const statusVariant = { activo: "success", inactivo: "default", moroso: "danger", nuevo: "primary" } as const;

function CustomerDrawer({ cliente }: { cliente: Cliente }) {
  return (
    <Shell
      title="Perfil del cliente"
      footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1">Editar</Button><Button className="flex-1">Nueva venta</Button></div>}
    >
      <div className="flex flex-col items-center text-center">
        <Avatar name={cliente.nombre} className="h-16 w-16 text-lg" />
        <h3 className="mt-3 text-base font-semibold text-fg">{cliente.nombre}</h3>
        <p className="text-sm text-fg-muted">{cliente.id}</p>
        <div className="mt-2 flex gap-2">
          <Badge variant={statusVariant[cliente.status]}>{cliente.status}</Badge>
          <Badge variant="primary">{cliente.segmento}</Badge>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <Metric label="LTV" value={formatCurrency(cliente.ltv)} icon={TrendingUp} />
        <Metric label="Compras" value={String(cliente.totalCompras)} icon={Receipt} />
      </div>

      <div className="mt-6 space-y-3">
        <Row icon={Mail} label="Email" value={cliente.email} />
        <Row icon={Phone} label="Teléfono" value={cliente.telefono} />
        <Row icon={MapPin} label="Ciudad" value={cliente.ciudad} />
        <Row icon={Calendar} label="Última compra" value={formatDate(cliente.ultimaCompra)} />
        <Row icon={Calendar} label="Cliente desde" value={formatDate(cliente.ingreso)} />
      </div>

      <div className="mt-6">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-subtle">Programa de fidelización</h4>
        <div className="rounded-lg border border-border bg-surface-2 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-fg-muted">Puntos acumulados</span>
            <span className="text-lg font-semibold text-primary">{cliente.puntos.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function FinancialDrawer({ trx }: { trx: Transaccion }) {
  return (
    <Shell
      title="Detalle de transacción"
      footer={<div className="flex gap-2"><Button variant="secondary" className="flex-1">Editar</Button><Button className="flex-1">Conciliar</Button></div>}
    >
      <div className="rounded-xl border border-border bg-surface-2 p-5 text-center">
        <p className="text-xs font-medium text-fg-muted">{trx.tipo === "ingreso" ? "Ingreso" : "Egreso"}</p>
        <p className={`mt-1 text-3xl font-semibold tracking-tight ${trx.tipo === "ingreso" ? "text-success" : "text-danger"}`}>
          {trx.tipo === "ingreso" ? "+" : "−"}{formatCurrency(trx.monto)}
        </p>
        <Badge variant={trx.estado === "conciliado" ? "success" : "warning"} className="mt-2">{trx.estado}</Badge>
      </div>

      <div className="mt-6 space-y-3">
        <Row icon={Receipt} label="ID" value={trx.id} />
        <Row icon={Calendar} label="Fecha" value={formatDate(trx.fecha)} />
        <Row icon={TrendingUp} label="Categoría" value={trx.categoria} />
        <Row icon={Receipt} label="Centro de costo" value={trx.centroCosto} />
        <Row icon={Receipt} label="Método" value={trx.metodo} />
        {trx.cliente && <Row icon={Mail} label="Cliente" value={trx.cliente} />}
      </div>
      <p className="mt-6 text-sm text-fg-muted">{trx.descripcion}</p>
    </Shell>
  );
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Mail }) {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex items-center gap-1.5 text-fg-subtle"><Icon className="h-3.5 w-3.5" /><span className="text-xs">{label}</span></div>
      <p className="mt-1 text-base font-semibold text-fg">{value}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 shrink-0 text-fg-subtle" />
      <span className="text-sm text-fg-muted">{label}</span>
      <span className="ml-auto truncate text-sm font-medium text-fg">{value}</span>
    </div>
  );
}

export function DrawerManager() {
  const { drawer } = useUIStore();
  if (drawer.type === "customer") return <CustomerDrawer cliente={drawer.data as Cliente} />;
  if (drawer.type === "financial") return <FinancialDrawer trx={drawer.data as Transaccion} />;
  return null;
}

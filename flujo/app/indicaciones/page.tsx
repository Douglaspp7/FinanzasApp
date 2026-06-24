"use client";

import { Share2, Users, Gift, TrendingUp, Crown, Link, Copy } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { clientes } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

const referidores = clientes.slice(0, 8).map((c, i) => ({
  ...c,
  referidos:  2 + ((i * 7) % 12),
  convertidos: 1 + ((i * 3) % 7),
  recompensa:  (1 + ((i * 3) % 7)) * 250,
}));

const actividad = [
  { cliente: "María González",  contacto: "Ana Torres",   estado: "convertido", fecha: "Hace 2h" },
  { cliente: "Carlos Rodríguez", contacto: "Pedro Ruiz",   estado: "pendiente",  fecha: "Hace 5h" },
  { cliente: "Sofía López",     contacto: "Laura Vega",   estado: "convertido", fecha: "Ayer"    },
  { cliente: "Diego Ramírez",   contacto: "Marcos Díaz",  estado: "expirado",  fecha: "Hace 3d" },
];

export default function IndicacionesPage() {
  return (
    <>
      <PageHeader
        title="Programa de Referidos"
        breadcrumb="Referidos"
        description="Convierte a tus clientes en promotores con un programa de referidos medible."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total referidos"       value="84"                     change={14.2} icon={Users}      />
        <StatCard label="Tasa de conversión"    value="58.3%"                  change={6.1}  icon={TrendingUp} />
        <StatCard label="Recompensas otorgadas" value={formatCurrency(18750)}  change={22.0} icon={Gift}       />
        <StatCard label="Ingresos generados"    value={formatCurrency(142000)} change={19.8} icon={Share2}     />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Ranking de referidores</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {referidores.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
                    i === 0 ? "bg-warning-muted text-warning" : i < 3 ? "bg-primary-muted text-primary" : "text-fg-subtle"
                  }`}>
                    {i === 0 ? <Crown className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <Avatar name={c.nombre} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{c.nombre}</p>
                    <p className="text-xs text-fg-muted">{c.referidos} referidos · {c.convertidos} convertidos</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-fg">{c.convertidos} / {c.referidos}</p>
                    <p className="text-xs text-success">+{formatCurrency(c.recompensa)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Tu link de referidos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                <Link className="h-4 w-4 shrink-0 text-fg-subtle" />
                <span className="flex-1 truncate text-xs text-fg-muted">app.nexa.com/ref/empresa-01</span>
                <button className="shrink-0 text-fg-subtle transition-colors hover:text-fg">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-border bg-surface-2 p-3 text-center">
                  <p className="text-lg font-bold text-fg">84</p>
                  <p className="text-xs text-fg-muted">Clicks</p>
                </div>
                <div className="rounded-lg border border-border bg-surface-2 p-3 text-center">
                  <p className="text-lg font-bold text-success">49</p>
                  <p className="text-xs text-fg-muted">Convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {actividad.map((a, i) => (
                <div key={i} className="flex items-start gap-2.5 py-1.5">
                  <Avatar name={a.cliente} className="h-7 w-7 text-[10px]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-fg">
                      <span className="font-medium">{a.cliente}</span>{" "}
                      <span className="text-fg-muted">refirió a</span>{" "}
                      <span className="font-medium">{a.contacto}</span>
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Badge variant={
                        a.estado === "convertido" ? "success" :
                        a.estado === "pendiente"  ? "warning" : "default"
                      }>{a.estado}</Badge>
                      <span className="text-[11px] text-fg-subtle">{a.fecha}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

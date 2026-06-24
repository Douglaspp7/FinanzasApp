"use client";

import { Mail, Users, TrendingUp, BarChart2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";

const campanas = [
  { id: 1, nombre: "Black Friday Anticipado", tipo: "Email", estado: "activa", alcance: 1840, abiertos: 42.3, conversiones: 12.8, ingresos: 48200 },
  { id: 2, nombre: "Promo de Cumpleaños", tipo: "SMS", estado: "activa", alcance: 620, abiertos: 78.1, conversiones: 22.4, ingresos: 31500 },
  { id: 3, nombre: "Reactivación clientes inactivos", tipo: "Email", estado: "pausada", alcance: 340, abiertos: 28.9, conversiones: 6.2, ingresos: 9800 },
  { id: 4, nombre: "Lanzamiento temporada", tipo: "Email", estado: "programada", alcance: 2100, abiertos: 0, conversiones: 0, ingresos: 0 },
  { id: 5, nombre: "Descuento temporada alta", tipo: "SMS", estado: "finalizada", alcance: 890, abiertos: 65.4, conversiones: 18.7, ingresos: 24600 },
];

const cupones = [
  { codigo: "VERANO20", descuento: "20%", usos: 48, limite: 100, vence: "30 Jun" },
  { codigo: "VIPCLUB", descuento: "15%", usos: 130, limite: 200, vence: "31 Jul" },
  { codigo: "PRIMERA", descuento: "$50", usos: 22, limite: 50, vence: "31 Dic" },
  { codigo: "REFIERE10", descuento: "10%", usos: 64, limite: null, vence: "Siempre" },
];

const estadoMap: Record<string, { label: string; variant: "success" | "primary" | "warning" | "default" }> = {
  activa:     { label: "Activa",      variant: "success"  },
  pausada:    { label: "Pausada",     variant: "warning"  },
  programada: { label: "Programada",  variant: "primary"  },
  finalizada: { label: "Finalizada",  variant: "default"  },
};

export default function MarketingPage() {
  return (
    <>
      <PageHeader
        title="Marketing"
        breadcrumb="Marketing"
        description="Campañas, cupones, promociones y automatizaciones para impulsar tus ventas."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Alcance total"        value="5,790"                  change={18.4} icon={Users}      />
        <StatCard label="Tasa de apertura"     value="46.2%"                  change={5.1}  icon={Mail}       />
        <StatCard label="Tasa de conversión"   value="14.8%"                  change={2.3}  icon={TrendingUp} />
        <StatCard label="Ingresos atribuidos"  value={formatCurrency(114100)} change={22.7} icon={BarChart2}  />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Campañas</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-fg-subtle">
                    <th className="pb-2 font-medium">Campaña</th>
                    <th className="pb-2 font-medium">Tipo</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 text-right font-medium">Apertura</th>
                    <th className="pb-2 text-right font-medium">Conversión</th>
                    <th className="pb-2 text-right font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {campanas.map((c) => {
                    const est = estadoMap[c.estado];
                    return (
                      <tr key={c.id} className="hover:bg-surface-2">
                        <td className="py-2.5 font-medium text-fg">{c.nombre}</td>
                        <td className="py-2.5 text-fg-muted">{c.tipo}</td>
                        <td className="py-2.5"><Badge variant={est.variant}>{est.label}</Badge></td>
                        <td className="py-2.5 text-right text-fg-muted">{c.abiertos > 0 ? `${c.abiertos}%` : "—"}</td>
                        <td className="py-2.5 text-right text-fg-muted">{c.conversiones > 0 ? `${c.conversiones}%` : "—"}</td>
                        <td className="py-2.5 text-right font-medium text-fg">{c.ingresos > 0 ? formatCurrency(c.ingresos) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cupones activos</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {cupones.map((c) => (
              <div key={c.codigo} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-primary">{c.codigo}</span>
                  <Badge variant="success">{c.descuento} off</Badge>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-xs text-fg-muted">
                  <span>{c.usos} usos{c.limite ? ` / ${c.limite}` : ""}</span>
                  <span>Vence: {c.vence}</span>
                </div>
                {c.limite && (
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(c.usos / c.limite) * 100}%` }} />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

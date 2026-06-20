"use client";

import {
  DollarSign, TrendingUp, Users, ShoppingCart, Target, UserPlus,
  AlertCircle, Wallet, Percent, PiggyBank, ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart, CategoryChart, BarRevenueChart } from "@/components/dashboard/charts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { topClientes, agendamientos, transacciones } from "@/lib/mock-data";
import { useUIStore } from "@/stores/ui-store";
import { formatCurrency, formatDate } from "@/lib/utils";

const kpis = [
  { label: "Ingresos del mes", value: "$521,000", change: 11.3, icon: DollarSign },
  { label: "Ingresos del año", value: "$2.4M", change: 18.7, icon: TrendingUp },
  { label: "Ticket promedio", value: "$1,840", change: 4.2, icon: ShoppingCart },
  { label: "Conversión", value: "24.8%", change: 2.1, icon: Target },
  { label: "Clientes activos", value: "1,284", change: 6.5, icon: Users },
  { label: "Clientes nuevos", value: "143", change: 12.9, icon: UserPlus },
  { label: "Morosidad", value: "3.2%", change: -0.8, icon: AlertCircle },
  { label: "Flujo de caja", value: "$226,000", change: 9.4, icon: Wallet },
  { label: "Margen", value: "43.4%", change: 1.6, icon: Percent },
  { label: "Utilidad neta", value: "$198,400", change: 14.2, icon: PiggyBank },
];

const estadoVariant = { confirmado: "success", pendiente: "warning", cancelado: "danger", completado: "primary" } as const;

export default function DashboardPage() {
  const openDrawer = useUIStore((s) => s.openDrawer);
  const ultimas = transacciones.slice(0, 6);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Resumen ejecutivo de tu negocio · Junio 2026"
        actions={<><Button variant="secondary" size="sm">Exportar</Button><Button size="sm">Nuevo movimiento</Button></>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {kpis.map((k) => <StatCard key={k.label} {...k} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2"><RevenueChart /></div>
        <CategoryChart />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Próximas citas</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">Ver agenda <ArrowRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {agendamientos.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                <Avatar name={a.cliente} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{a.cliente}</p>
                  <p className="truncate text-xs text-fg-muted">{a.servicio}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-fg">{a.hora}</p>
                  <Badge variant={estadoVariant[a.estado]} className="mt-0.5">{a.estado}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ranking de clientes</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">Ver todos <ArrowRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent className="space-y-1">
            {topClientes.slice(0, 5).map((c, i) => (
              <button key={c.id} onClick={() => openDrawer("customer", c)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-2">
                <span className="w-4 text-center text-xs font-semibold text-fg-subtle">{i + 1}</span>
                <Avatar name={c.nombre} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{c.nombre}</p>
                  <p className="text-xs text-fg-muted">{c.totalCompras} compras</p>
                </div>
                <span className="text-sm font-semibold text-fg">{formatCurrency(c.ltv)}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader>
          <CardContent><ActivityFeed /></CardContent>
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Últimas transacciones</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs">Ver finanzas <ArrowRight className="h-3 w-3" /></Button>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {ultimas.map((t) => (
                <button key={t.id} onClick={() => openDrawer("financial", t)} className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-surface-2 -mx-2 px-2 rounded-lg">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${t.tipo === "ingreso" ? "bg-success-muted text-success" : "bg-danger-muted text-danger"}`}>
                    {t.tipo === "ingreso" ? <TrendingUp className="h-4 w-4" /> : <Wallet className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{t.descripcion}</p>
                    <p className="text-xs text-fg-muted">{formatDate(t.fecha)} · {t.categoria}</p>
                  </div>
                  <span className={`text-sm font-semibold ${t.tipo === "ingreso" ? "text-success" : "text-danger"}`}>
                    {t.tipo === "ingreso" ? "+" : "−"}{formatCurrency(t.monto)}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Resultado neto mensual</CardTitle></CardHeader>
          <CardContent><BarRevenueChart /></CardContent>
        </Card>
      </div>
    </>
  );
}

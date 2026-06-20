"use client";

import { Gift, Repeat, Clock, Trophy, Crown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { topClientes } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function FidelizacaoPage() {
  return (
    <>
      <PageHeader
        title="Fidelización" breadcrumb="Fidelización"
        description="Cashback, puntos, ranking y recurrencia de clientes."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Cashback otorgado" value={formatCurrency(38400)} change={7.2} icon={Gift} />
        <StatCard label="Tasa de retorno" value="62%" change={3.5} icon={Repeat} />
        <StatCard label="Tiempo medio retorno" value="28 días" change={-4.1} icon={Clock} />
        <StatCard label="LTV promedio" value={formatCurrency(54000)} change={3.4} icon={Trophy} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Top 10 clientes por LTV</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {topClientes.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${i === 0 ? "bg-warning-muted text-warning" : i < 3 ? "bg-primary-muted text-primary" : "text-fg-subtle"}`}>
                    {i === 0 ? <Crown className="h-3.5 w-3.5" /> : i + 1}
                  </div>
                  <Avatar name={c.nombre} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{c.nombre}</p>
                    <p className="text-xs text-fg-muted">{c.puntos.toLocaleString()} puntos · {c.totalCompras} compras</p>
                  </div>
                  <span className="text-sm font-semibold text-fg">{formatCurrency(c.ltv)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Programa de puntos</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <p className="text-xs text-fg-muted">Puntos en circulación</p>
              <p className="mt-1 text-2xl font-semibold text-fg">284,920</p>
            </div>
            <div className="rounded-lg border border-border bg-surface-2 p-4">
              <p className="text-xs text-fg-muted">Canje de cashback</p>
              <p className="mt-1 text-2xl font-semibold text-success">$12,840</p>
            </div>
            <div className="rounded-lg border border-primary/30 bg-primary-muted p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-primary">Nivel Oro</span>
                <Badge variant="primary">Activo</Badge>
              </div>
              <p className="mt-1 text-xs text-primary/80">3% cashback en todas las compras</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

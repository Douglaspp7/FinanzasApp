"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus, TrendingUp, TrendingDown, Wallet, Scale } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart, AccumulatedChart } from "@/components/dashboard/charts";
import { DataTable } from "@/components/data/data-table";
import { transacciones, type Transaccion } from "@/lib/mock-data";
import { useUIStore } from "@/stores/ui-store";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function FinancieroPage() {
  const openDrawer = useUIStore((s) => s.openDrawer);

  const columns = useMemo<ColumnDef<Transaccion>[]>(() => [
    { accessorKey: "fecha", header: "Fecha", cell: ({ row }) => <span className="text-fg-muted tabular-nums">{formatDate(row.original.fecha)}</span> },
    { accessorKey: "descripcion", header: "Descripción", cell: ({ row }) => <span className="font-medium text-fg">{row.original.descripcion}</span> },
    { accessorKey: "categoria", header: "Categoría", cell: ({ row }) => <Badge>{row.original.categoria}</Badge> },
    { accessorKey: "metodo", header: "Método", cell: ({ row }) => <span className="text-fg-muted">{row.original.metodo}</span> },
    { accessorKey: "estado", header: "Estado", cell: ({ row }) => <Badge variant={row.original.estado === "conciliado" ? "success" : "warning"}>{row.original.estado}</Badge> },
    {
      accessorKey: "monto", header: "Monto",
      cell: ({ row }) => (
        <span className={`font-semibold tabular-nums ${row.original.tipo === "ingreso" ? "text-success" : "text-danger"}`}>
          {row.original.tipo === "ingreso" ? "+" : "−"}{formatCurrency(row.original.monto)}
        </span>
      ),
    },
  ], []);

  return (
    <>
      <PageHeader title="Flujo de Caja" breadcrumb="Financiero" description="Ingresos, egresos y conciliación · Junio 2026"
        actions={<><Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Exportar</Button><Button size="sm"><Plus className="h-4 w-4" /> Nuevo movimiento</Button></>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ingresos" value={formatCurrency(521000)} change={11.3} icon={TrendingUp} />
        <StatCard label="Egresos" value={formatCurrency(295000)} change={8.4} icon={TrendingDown} />
        <StatCard label="Flujo neto" value={formatCurrency(226000)} change={9.4} icon={Wallet} />
        <StatCard label="Por conciliar" value="12" change={-15.0} icon={Scale} hint="movimientos" />
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevenueChart />
        <AccumulatedChart />
      </div>
      <h2 className="mb-3 mt-6 text-sm font-semibold text-fg">Movimientos</h2>
      <DataTable columns={columns} data={transacciones} searchKey="descripcion" searchPlaceholder="Buscar movimientos..." onRowClick={(t) => openDrawer("financial", t)} />
    </>
  );
}

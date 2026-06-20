"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, ShoppingCart, DollarSign, Receipt, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/data/data-table";
import { transacciones, type Transaccion } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VendasPage() {
  const ventas = transacciones.filter((t) => t.tipo === "ingreso");

  const columns = useMemo<ColumnDef<Transaccion>[]>(() => [
    { accessorKey: "id", header: "Comanda", cell: ({ row }) => <span className="font-mono text-xs text-fg-muted">{row.original.id}</span> },
    { accessorKey: "cliente", header: "Cliente", cell: ({ row }) => <span className="font-medium text-fg">{row.original.cliente ?? "—"}</span> },
    { accessorKey: "fecha", header: "Fecha", cell: ({ row }) => <span className="text-fg-muted tabular-nums">{formatDate(row.original.fecha)}</span> },
    { accessorKey: "metodo", header: "Pago", cell: ({ row }) => <Badge>{row.original.metodo}</Badge> },
    { accessorKey: "estado", header: "Estado", cell: ({ row }) => <Badge variant={row.original.estado === "conciliado" ? "success" : "warning"}>{row.original.estado === "conciliado" ? "pagado" : "pendiente"}</Badge> },
    { accessorKey: "monto", header: "Total", cell: ({ row }) => <span className="font-semibold tabular-nums text-fg">{formatCurrency(row.original.monto)}</span> },
  ], []);

  return (
    <>
      <PageHeader
        title="Ventas" breadcrumb="Ventas"
        description="Comandas, pedidos y pagos."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> Nueva venta</Button>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Ventas del mes" value={String(ventas.length * 8)} change={9.1} icon={ShoppingCart} />
        <StatCard label="Facturación" value={formatCurrency(521000)} change={11.3} icon={DollarSign} />
        <StatCard label="Ticket promedio" value={formatCurrency(1840)} change={4.2} icon={Receipt} />
        <StatCard label="Conversión" value="24.8%" change={2.1} icon={TrendingUp} />
      </div>
      <DataTable columns={columns} data={ventas} searchKey="cliente" searchPlaceholder="Buscar ventas..." />
    </>
  );
}

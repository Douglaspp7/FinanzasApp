"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Package, AlertTriangle, Boxes, DollarSign } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/data/data-table";
import { productos, type Producto } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function ProductosPage() {
  const columns = useMemo<ColumnDef<Producto>[]>(() => [
    { accessorKey: "nombre", header: "Producto", cell: ({ row }) => (
      <div><p className="font-medium text-fg">{row.original.nombre}</p><p className="text-xs text-fg-muted">{row.original.sku}</p></div>
    )},
    { accessorKey: "categoria", header: "Categoría", cell: ({ row }) => <Badge>{row.original.categoria}</Badge> },
    { accessorKey: "proveedor", header: "Proveedor", cell: ({ row }) => <span className="text-fg-muted">{row.original.proveedor}</span> },
    { accessorKey: "precio", header: "Precio", cell: ({ row }) => <span className="font-medium tabular-nums">{formatCurrency(row.original.precio)}</span> },
    { accessorKey: "stock", header: "Stock", cell: ({ row }) => {
      const low = row.original.stock <= row.original.stockMinimo;
      return <Badge variant={low ? "danger" : "default"}>{row.original.stock} u{low ? " · bajo" : ""}</Badge>;
    }},
  ], []);

  return (
    <>
      <PageHeader
        title="Productos" breadcrumb="Productos"
        description="Inventario, precios y proveedores."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> Nuevo producto</Button>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Productos" value={String(productos.length)} icon={Package} hint="activos" />
        <StatCard label="Valor inventario" value={formatCurrency(284000)} change={3.1} icon={DollarSign} />
        <StatCard label="Unidades" value="1,420" icon={Boxes} hint="en stock" />
        <StatCard label="Stock bajo" value={String(productos.filter((p) => p.stock <= p.stockMinimo).length)} icon={AlertTriangle} hint="alertas" />
      </div>
      <DataTable columns={columns} data={productos} searchKey="nombre" searchPlaceholder="Buscar productos..." />
    </>
  );
}

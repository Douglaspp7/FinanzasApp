"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Download, Plus, Users, UserPlus, TrendingUp, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/input";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/data/data-table";
import { clientes, type Cliente } from "@/lib/mock-data";
import { useUIStore } from "@/stores/ui-store";
import { formatCurrency, formatDate } from "@/lib/utils";

const statusVariant = { activo: "success", inactivo: "default", moroso: "danger", nuevo: "primary" } as const;
const segmentoVariant = { VIP: "primary", Frecuente: "success", Ocasional: "default", Riesgo: "warning" } as const;

export default function ClientesPage() {
  const openDrawer = useUIStore((s) => s.openDrawer);

  const columns = useMemo<ColumnDef<Cliente>[]>(() => [
    {
      accessorKey: "nombre",
      header: "Cliente",
      cell: ({ row }) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={row.original.nombre} />
          <div>
            <p className="font-medium text-fg">{row.original.nombre}</p>
            <p className="text-xs text-fg-muted">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    { accessorKey: "ciudad", header: "Ciudad", cell: ({ row }) => <span className="text-fg-muted">{row.original.ciudad}</span> },
    { accessorKey: "status", header: "Estado", cell: ({ row }) => <Badge variant={statusVariant[row.original.status]}>{row.original.status}</Badge> },
    { accessorKey: "segmento", header: "Segmento", cell: ({ row }) => <Badge variant={segmentoVariant[row.original.segmento]}>{row.original.segmento}</Badge> },
    { accessorKey: "totalCompras", header: "Compras", cell: ({ row }) => <span className="tabular-nums">{row.original.totalCompras}</span> },
    { accessorKey: "ltv", header: "LTV", cell: ({ row }) => <span className="font-medium tabular-nums">{formatCurrency(row.original.ltv)}</span> },
    { accessorKey: "ultimaCompra", header: "Última compra", cell: ({ row }) => <span className="text-fg-muted tabular-nums">{formatDate(row.original.ultimaCompra)}</span> },
  ], []);

  return (
    <>
      <PageHeader
        title="Clientes"
        breadcrumb="Clientes"
        description="Gestiona tu base de clientes y su historial."
        actions={<><Button variant="secondary" size="sm"><Download className="h-4 w-4" /> Exportar</Button><Button size="sm"><Plus className="h-4 w-4" /> Nuevo cliente</Button></>}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total clientes" value={String(clientes.length * 51)} change={6.5} icon={Users} />
        <StatCard label="Nuevos (mes)" value="143" change={12.9} icon={UserPlus} />
        <StatCard label="LTV promedio" value={formatCurrency(54000)} change={3.4} icon={TrendingUp} />
        <StatCard label="En riesgo" value="38" change={-2.1} icon={AlertCircle} />
      </div>

      <DataTable
        columns={columns}
        data={clientes}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre, email..."
        onRowClick={(c) => openDrawer("customer", c)}
      />
    </>
  );
}

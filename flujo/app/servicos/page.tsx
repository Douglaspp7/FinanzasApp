"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Scissors, Clock, DollarSign, Users } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/input";
import { StatCard } from "@/components/dashboard/stat-card";
import { DataTable } from "@/components/data/data-table";
import { servicios, type Servicio } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";

export default function ServiciosPage() {
  const columns = useMemo<ColumnDef<Servicio>[]>(() => [
    { accessorKey: "nombre", header: "Servicio", cell: ({ row }) => <span className="font-medium text-fg">{row.original.nombre}</span> },
    { accessorKey: "categoria", header: "Categoría", cell: ({ row }) => <Badge>{row.original.categoria}</Badge> },
    { accessorKey: "duracion", header: "Duración", cell: ({ row }) => <span className="text-fg-muted tabular-nums">{row.original.duracion} min</span> },
    { accessorKey: "profesional", header: "Profesional", cell: ({ row }) => (
      <div className="flex items-center gap-2"><Avatar name={row.original.profesional} className="h-6 w-6 text-[10px]" /><span className="text-fg-muted">{row.original.profesional}</span></div>
    )},
    { accessorKey: "precio", header: "Precio", cell: ({ row }) => <span className="font-medium tabular-nums">{formatCurrency(row.original.precio)}</span> },
  ], []);

  return (
    <>
      <PageHeader title="Catálogo de Servicios" breadcrumb="Servicios" description="Servicios, precios y profesionales asignados."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> Nuevo servicio</Button>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Servicios" value={String(servicios.length)} icon={Scissors} hint="activos" />
        <StatCard label="Precio promedio" value={formatCurrency(620)} change={2.4} icon={DollarSign} />
        <StatCard label="Duración media" value="56 min" icon={Clock} />
        <StatCard label="Profesionales" value="6" icon={Users} />
      </div>
      <DataTable columns={columns} data={servicios} searchKey="nombre" searchPlaceholder="Buscar servicios..." />
    </>
  );
}

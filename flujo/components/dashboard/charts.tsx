"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { flujoMensual, flujoAcumulado, gastosPorCategoria } from "@/lib/mock-data";
import { formatCompact } from "@/lib/utils";

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4"];

const axisProps = {
  stroke: "var(--color-fg-subtle)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-elevated px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-medium text-fg">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="flex items-center gap-2 text-fg-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          {p.name}: <span className="font-medium text-fg">${formatCompact(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function ChartCard({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function RevenueChart() {
  return (
    <ChartCard title="Ingresos vs. Egresos">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={flujoMensual} margin={{ left: -16, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="gIng" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gEgr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="mes" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => `$${formatCompact(v)}`} />
          <Tooltip content={<ChartTooltip />} />
          <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke="#6366f1" strokeWidth={2} fill="url(#gIng)" />
          <Area type="monotone" dataKey="egresos" name="Egresos" stroke="#ec4899" strokeWidth={2} fill="url(#gEgr)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function AccumulatedChart() {
  return (
    <ChartCard title="Flujo acumulado">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={flujoAcumulado} margin={{ left: -16, right: 8, top: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="mes" {...axisProps} />
          <YAxis {...axisProps} tickFormatter={(v) => `$${formatCompact(v)}`} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="acumulado" name="Acumulado" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: "#10b981" }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function CategoryChart() {
  return (
    <ChartCard title="Gastos por categoría">
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={gastosPorCategoria} dataKey="monto" nameKey="categoria" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={2}>
            {gastosPorCategoria.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--color-surface)" strokeWidth={2} />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {gastosPorCategoria.map((c, i) => (
          <div key={c.categoria} className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-fg-muted">{c.categoria}</span>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}

export function BarRevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={flujoMensual} margin={{ left: -16, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="mes" {...axisProps} />
        <YAxis {...axisProps} tickFormatter={(v) => `$${formatCompact(v)}`} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--color-surface-2)" }} />
        <Bar dataKey="neto" name="Neto" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

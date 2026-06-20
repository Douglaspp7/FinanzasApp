"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { agendamientos } from "@/lib/mock-data";

const dias = ["Lun", "Mar", "Mié", "Jue", "Vie"];
const horas = Array.from({ length: 10 }, (_, i) => 9 + i);
const estadoColor = {
  confirmado: "border-success/40 bg-success-muted text-success",
  pendiente: "border-warning/40 bg-warning-muted text-warning",
  completado: "border-primary/40 bg-primary-muted text-primary",
  cancelado: "border-danger/40 bg-danger-muted text-danger line-through",
} as const;

export default function AgendaPage() {
  const [view, setView] = useState<"dia" | "semana" | "mes">("semana");

  return (
    <>
      <PageHeader
        title="Agenda" breadcrumb="Agenda"
        description="Calendario de citas y recursos."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> Nueva cita</Button>}
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
          <span className="px-2 text-sm font-medium text-fg">22 – 26 Junio 2026</span>
          <Button variant="outline" size="icon"><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm">Hoy</Button>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          {(["dia", "semana", "mes"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${view === v ? "bg-primary text-primary-fg" : "text-fg-muted hover:text-fg"}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid grid-cols-[56px_repeat(5,1fr)] divide-x divide-border">
          <div className="bg-surface-2" />
          {dias.map((d, i) => (
            <div key={d} className="bg-surface-2 px-3 py-2.5 text-center">
              <p className="text-xs font-medium text-fg-muted">{d}</p>
              <p className="text-sm font-semibold text-fg">{22 + i}</p>
            </div>
          ))}

          {horas.map((h) => (
            <div key={h} className="contents">
              <div className="border-t border-border px-2 py-3 text-right text-[11px] text-fg-subtle">{h}:00</div>
              {dias.map((_, di) => {
                const cita = agendamientos.find((a) => parseInt(a.hora) === h && (agendamientos.indexOf(a) % 5) === di);
                return (
                  <div key={di} className="min-h-[52px] border-t border-border p-1">
                    {cita && (
                      <div className={`rounded-md border px-2 py-1 text-[11px] ${estadoColor[cita.estado]}`}>
                        <p className="truncate font-medium">{cita.cliente}</p>
                        <p className="truncate opacity-80">{cita.servicio}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2">
        {Object.keys(estadoColor).map((k) => (
          <Badge key={k} variant={k === "confirmado" ? "success" : k === "pendiente" ? "warning" : k === "completado" ? "primary" : "danger"}>{k}</Badge>
        ))}
      </div>
    </>
  );
}

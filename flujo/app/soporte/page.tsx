"use client";

import { LifeBuoy, MessageCircle, BookOpen, Lightbulb, ExternalLink, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const tickets = [
  { id: "TKT-001", asunto: "No puedo exportar reportes en PDF",           prioridad: "alta",  estado: "abierto",     fecha: "Hace 2h" },
  { id: "TKT-002", asunto: "La agenda no sincroniza con Google Calendar",  prioridad: "media", estado: "en progreso",  fecha: "Ayer"    },
  { id: "TKT-003", asunto: "Error al aplicar cupón VERANO20",             prioridad: "baja",  estado: "resuelto",    fecha: "Hace 3d" },
  { id: "TKT-004", asunto: "Pregunta sobre límite de usuarios en Plan Pro",prioridad: "baja",  estado: "resuelto",    fecha: "Hace 5d" },
];

const articulos = [
  "Cómo configurar tu primer cupón de descuento",
  "Importar clientes desde Excel o CSV",
  "Configurar recordatorios automáticos por WhatsApp",
  "Generar y descargar reportes financieros",
  "Gestión de permisos y roles de usuario",
];

const servicios = [
  "API principal",
  "Pagos (Mercado Pago)",
  "Notificaciones",
  "Backup automático",
];

const acciones = [
  { label: "Centro de ayuda",  desc: "Buscar artículos",    icon: BookOpen,       badge: null     },
  { label: "Nuevo ticket",     desc: "Reportar un problema", icon: LifeBuoy,       badge: null     },
  { label: "Chat en vivo",     desc: "Respuesta en < 2 min", icon: MessageCircle,  badge: "Online" },
  { label: "Solicitar función",desc: "Sugerir mejoras",      icon: Lightbulb,      badge: null     },
];

export default function SoportePage() {
  return (
    <>
      <PageHeader
        title="Soporte"
        breadcrumb="Soporte"
        description="Centro de ayuda, tickets y estado del sistema NEXA."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {acciones.map((a) => {
          const Icon = a.icon;
          return (
            <div key={a.label} className="flex cursor-pointer flex-col gap-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:bg-surface-2">
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-muted text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                {a.badge && <Badge variant="success">{a.badge}</Badge>}
              </div>
              <div>
                <p className="text-sm font-semibold text-fg">{a.label}</p>
                <p className="text-xs text-fg-muted">{a.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Mis tickets</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1">
              {tickets.map((t) => {
                const Icon =
                  t.estado === "resuelto"    ? CheckCircle2   :
                  t.estado === "en progreso" ? Clock          : AlertTriangle;
                const iconClass =
                  t.estado === "resuelto"    ? "text-success" :
                  t.estado === "en progreso" ? "text-primary" : "text-warning";
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2">
                    <Icon className={`h-4 w-4 shrink-0 ${iconClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{t.asunto}</p>
                      <p className="text-xs text-fg-muted">{t.id} · {t.fecha}</p>
                    </div>
                    <Badge variant={
                      t.prioridad === "alta"  ? "danger"  :
                      t.prioridad === "media" ? "warning" : "default"
                    }>{t.prioridad}</Badge>
                    <Badge variant={
                      t.estado === "resuelto"    ? "success" :
                      t.estado === "en progreso" ? "primary" : "warning"
                    }>{t.estado}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Estado del sistema</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="mb-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success" />
                <span className="text-sm font-medium text-success">Todos los sistemas operativos</span>
              </div>
              {servicios.map((s) => (
                <div key={s} className="flex items-center justify-between rounded-md px-2 py-1.5">
                  <span className="text-sm text-fg-muted">{s}</span>
                  <Badge variant="success">OK</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Artículos populares</CardTitle></CardHeader>
            <CardContent className="space-y-0.5">
              {articulos.map((a) => (
                <a key={a} href="#" className="flex items-start gap-2 rounded-md px-2 py-2 text-sm text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg">
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {a}
                </a>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import { Building2, Users, Bell, Shield, Plug, CreditCard, Check } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const secciones = [
  { id: "empresa",        label: "Empresa",           icon: Building2  },
  { id: "usuarios",       label: "Usuarios y roles",  icon: Users      },
  { id: "notificaciones", label: "Notificaciones",    icon: Bell       },
  { id: "seguridad",      label: "Seguridad",         icon: Shield     },
  { id: "integraciones",  label: "Integraciones",     icon: Plug       },
  { id: "plan",           label: "Plan y billing",    icon: CreditCard },
];

const usuarios = [
  { nombre: "Sofía Méndez",    email: "sofia@empresa.com",   rol: "Administrador", status: "activo"   },
  { nombre: "Javier Morales",  email: "javier@empresa.com",  rol: "Vendedor",      status: "activo"   },
  { nombre: "Camila Torres",   email: "camila@empresa.com",  rol: "Vendedor",      status: "activo"   },
  { nombre: "Rodrigo Díaz",    email: "rodrigo@empresa.com", rol: "Solo lectura",  status: "inactivo" },
];

const integraciones = [
  { nombre: "WhatsApp Business", descripcion: "Envío de recordatorios y notificaciones", conectado: true  },
  { nombre: "Mercado Pago",      descripcion: "Cobros en línea y links de pago",         conectado: true  },
  { nombre: "Google Calendar",   descripcion: "Sincronización de agenda",                conectado: false },
  { nombre: "Stripe",            descripcion: "Pagos internacionales con tarjeta",       conectado: false },
  { nombre: "Mailchimp",         descripcion: "Campañas de email marketing",             conectado: false },
];

const notificaciones = [
  { label: "Nuevas ventas",              detalle: "Aviso por cada venta realizada",              activo: true  },
  { label: "Clientes nuevos",            detalle: "Notificación al registrarse un nuevo cliente", activo: true  },
  { label: "Pagos vencidos",             detalle: "Alerta de facturas o cobros pendientes",       activo: true  },
  { label: "Stock bajo",                 detalle: "Aviso cuando un producto llega al mínimo",     activo: false },
  { label: "Resumen diario",             detalle: "Email con el resumen del día cada noche",      activo: false },
  { label: "Actualizaciones del sistema",detalle: "Novedades y mantenimientos programados",       activo: true  },
];

export default function ConfiguracionPage() {
  const [seccion, setSeccion] = useState("empresa");

  return (
    <>
      <PageHeader
        title="Configuración"
        breadcrumb="Configuración"
        description="Administra tu empresa, equipo, integraciones y plan."
      />

      <div className="flex gap-6">
        <nav className="hidden w-48 shrink-0 lg:block">
          <ul className="space-y-0.5">
            {secciones.map((s) => {
              const Icon = s.icon;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setSeccion(s.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      seccion === s.id
                        ? "bg-primary-muted text-primary"
                        : "text-fg-muted hover:bg-surface-2 hover:text-fg"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-4">
          {seccion === "empresa" && (
            <Card>
              <CardHeader><CardTitle>Datos de la empresa</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {[
                    { label: "Nombre comercial", value: "Salón Bella Vista"         },
                    { label: "Razón social",      value: "Bella Vista S.A. de C.V."  },
                    { label: "RFC / NIT",         value: "BVS230415KP2"              },
                    { label: "Teléfono",          value: "+52 55 4890 1234"          },
                    { label: "Email",             value: "contacto@bellavista.mx"    },
                    { label: "Ciudad",            value: "Ciudad de México"          },
                  ].map((f) => (
                    <div key={f.label}>
                      <label className="text-xs font-medium text-fg-subtle">{f.label}</label>
                      <p className="mt-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg">{f.value}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-medium text-fg-subtle">Dirección</label>
                  <p className="mt-1 rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-fg">
                    Av. Insurgentes Sur 1234, Col. Del Valle, CDMX
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {seccion === "usuarios" && (
            <Card>
              <CardHeader><CardTitle>Usuarios y roles</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {usuarios.map((u) => (
                    <div key={u.email} className="flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-2">
                      <Avatar name={u.nombre} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg">{u.nombre}</p>
                        <p className="text-xs text-fg-muted">{u.email}</p>
                      </div>
                      <Badge variant={u.rol === "Administrador" ? "primary" : "default"}>{u.rol}</Badge>
                      <Badge variant={u.status === "activo" ? "success" : "default"}>{u.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {seccion === "notificaciones" && (
            <Card>
              <CardHeader><CardTitle>Preferencias de notificaciones</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {notificaciones.map((n) => (
                  <div key={n.label} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-fg">{n.label}</p>
                      <p className="text-xs text-fg-muted">{n.detalle}</p>
                    </div>
                    <div className={cn(
                      "flex h-5 w-9 items-center rounded-full transition-colors",
                      n.activo ? "bg-primary" : "bg-border"
                    )}>
                      <div className={cn(
                        "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
                        n.activo ? "translate-x-4" : "translate-x-0.5"
                      )} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {seccion === "seguridad" && (
            <Card>
              <CardHeader><CardTitle>Seguridad</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Autenticación de dos factores (2FA)", detalle: "Protege tu cuenta con un segundo método de verificación", badge: "Desactivado", variant: "warning" as const },
                  { label: "Contraseña",      detalle: "Última actualización hace 42 días",  badge: "Segura",      variant: "success" as const },
                  { label: "Sesiones activas", detalle: "2 dispositivos conectados",         badge: "Ver todas",   variant: "default" as const },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-border bg-surface-2 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-fg">{item.label}</p>
                      <p className="text-xs text-fg-muted">{item.detalle}</p>
                    </div>
                    <Badge variant={item.variant}>{item.badge}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {seccion === "integraciones" && (
            <Card>
              <CardHeader><CardTitle>Integraciones</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {integraciones.map((int) => (
                  <div key={int.nombre} className="flex items-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-fg">{int.nombre}</p>
                      <p className="text-xs text-fg-muted">{int.descripcion}</p>
                    </div>
                    <Badge variant={int.conectado ? "success" : "default"}>
                      {int.conectado ? "Conectado" : "Conectar"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {seccion === "plan" && (
            <Card>
              <CardHeader><CardTitle>Plan actual</CardTitle></CardHeader>
              <CardContent>
                <div className="rounded-xl border border-primary/30 bg-primary-muted p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-bold text-fg">Plan Pro</p>
                      <p className="text-sm text-fg-muted">$799 MXN / mes · Próxima renovación: 1 Jul 2026</p>
                    </div>
                    <Badge variant="primary">Activo</Badge>
                  </div>
                  <ul className="mt-4 space-y-1.5">
                    {["Usuarios ilimitados", "Módulos completos", "Soporte prioritario", "Acceso a API", "Reportes avanzados"].map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-fg">
                        <Check className="h-4 w-4 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

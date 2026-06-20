# Flujo

**SaaS financiero moderno para PYMES de América Latina.** Inspirado en la arquitectura funcional de Livebase, con UX/UI al nivel de Stripe, Linear, Mercury y Vercel.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** (design tokens, dark/light)
- **TanStack Table** (tablas avanzadas) + **TanStack Query**
- **Recharts** (gráficos)
- **Zustand** (estado global: sidebar, command palette, drawers, modales, tema)
- **cmdk** (Command Palette ⌘K)
- **lucide-react** (iconos)

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de producción
```

> Nota: este proyecto vive temporalmente en la carpeta `flujo/` de la rama `flujo` del repo FinanzasApp, porque la integración no pudo crear un repositorio nuevo. Mover a su propio repo `flujo` cuando esté disponible.

## Arquitectura

```
app/                  # App Router (Next.js)
  layout.tsx          # Root: Providers + AppShell
  page.tsx            # Redirect -> /dashboard
  dashboard/          # Dashboard ejecutivo (KPIs, charts, rankings)
  clientes/           # CRM + DataTable + CustomerDrawer
  financeiro/         # Flujo de caja + charts + FinancialDrawer
  agenda/ vendas/ produtos/ servicos/ fidelizacao/
  reportes/ marketing/ indicaciones/ configuracion/ soporte/
components/
  layout/             # Sidebar, Topbar, CommandPalette, NotificationCenter, AppShell
  ui/                 # Button, Card, Badge, Input, states, PageHeader, placeholder
  dashboard/          # StatCard, charts (Recharts), ActivityFeed
  data/               # DataTable (TanStack)
  drawers/            # DrawerManager (Customer + Financial)
  modals/             # ModalManager (Confirmation)
  providers.tsx       # React Query + theme init
lib/                  # utils, mock-data, navigation
stores/               # ui-store (Zustand)
```

## Estado de los módulos

| Módulo | Estado |
|---|---|
| Dashboard | ✅ KPIs (10), charts, ranking, actividad, transacciones |
| Clientes | ✅ DataTable + filtros + CustomerDrawer |
| Financiero | ✅ Flujo de caja + charts + FinancialDrawer |
| Agenda | ✅ Vista semanal tipo calendario |
| Ventas | ✅ DataTable de comandas |
| Productos | ✅ DataTable + inventario |
| Servicios | ✅ DataTable + profesionales |
| Fidelización | ✅ Ranking + puntos + cashback |
| Reportes | ✅ Grid de gráficos |
| Marketing / Referidos / Configuración / Soporte | 🚧 Landing de módulo |

Datos 100% mockeados (deterministas) en `lib/mock-data.ts`.

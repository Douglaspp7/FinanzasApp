import {
  LayoutDashboard, Users, Calendar, ShoppingCart, Wallet, Package,
  Scissors, Megaphone, Gift, Share2, BarChart3, Settings, LifeBuoy,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavChild[];
}

export const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    label: "Clientes", href: "/clientes", icon: Users,
    children: [
      { label: "Lista de Clientes", href: "/clientes" },
      { label: "Segmentación", href: "/clientes?tab=segmentacion" },
      { label: "Historial", href: "/clientes?tab=historial" },
    ],
  },
  {
    label: "Agenda", href: "/agenda", icon: Calendar,
    children: [
      { label: "Calendario", href: "/agenda" },
      { label: "Agenda Pública", href: "/agenda?tab=publica" },
      { label: "Fila de Espera", href: "/agenda?tab=fila" },
      { label: "Recursos", href: "/agenda?tab=recursos" },
    ],
  },
  {
    label: "Ventas", href: "/vendas", icon: ShoppingCart,
    children: [
      { label: "Comandas", href: "/vendas" },
      { label: "Pedidos", href: "/vendas?tab=pedidos" },
      { label: "Checkout", href: "/vendas?tab=checkout" },
      { label: "Pagos", href: "/vendas?tab=pagos" },
    ],
  },
  {
    label: "Financiero", href: "/financeiro", icon: Wallet,
    children: [
      { label: "Flujo de Caja", href: "/financeiro" },
      { label: "Ingresos", href: "/financeiro?tab=ingresos" },
      { label: "Egresos", href: "/financeiro?tab=egresos" },
      { label: "Cuentas por Cobrar", href: "/financeiro?tab=cobrar" },
      { label: "Cuentas por Pagar", href: "/financeiro?tab=pagar" },
      { label: "Conciliación", href: "/financeiro?tab=conciliacion" },
      { label: "Suscripciones", href: "/financeiro?tab=suscripciones" },
    ],
  },
  {
    label: "Productos", href: "/produtos", icon: Package,
    children: [
      { label: "Productos", href: "/produtos" },
      { label: "Categorías", href: "/produtos?tab=categorias" },
      { label: "Inventario", href: "/produtos?tab=inventario" },
      { label: "Proveedores", href: "/produtos?tab=proveedores" },
    ],
  },
  {
    label: "Servicios", href: "/servicos", icon: Scissors,
    children: [
      { label: "Catálogo", href: "/servicos" },
      { label: "Categorías", href: "/servicos?tab=categorias" },
      { label: "Profesionales", href: "/servicos?tab=profesionales" },
    ],
  },
  {
    label: "Marketing", href: "/marketing", icon: Megaphone,
    children: [
      { label: "Cupones", href: "/marketing" },
      { label: "Campañas", href: "/marketing?tab=campanas" },
      { label: "Promociones", href: "/marketing?tab=promociones" },
      { label: "Automatizaciones", href: "/marketing?tab=automatizaciones" },
    ],
  },
  {
    label: "Fidelización", href: "/fidelizacao", icon: Gift,
    children: [
      { label: "Cashback", href: "/fidelizacao" },
      { label: "Puntos", href: "/fidelizacao?tab=puntos" },
      { label: "Ranking", href: "/fidelizacao?tab=ranking" },
      { label: "Recurrencia", href: "/fidelizacao?tab=recurrencia" },
    ],
  },
  {
    label: "Referidos", href: "/indicaciones", icon: Share2,
    children: [
      { label: "Programa", href: "/indicaciones" },
      { label: "Conversiones", href: "/indicaciones?tab=conversiones" },
      { label: "Recompensas", href: "/indicaciones?tab=recompensas" },
    ],
  },
  {
    label: "Reportes", href: "/reportes", icon: BarChart3,
    children: [
      { label: "Comercial", href: "/reportes" },
      { label: "Financiero", href: "/reportes?tab=financiero" },
      { label: "Clientes", href: "/reportes?tab=clientes" },
      { label: "Productos", href: "/reportes?tab=productos" },
    ],
  },
  {
    label: "Configuración", href: "/configuracion", icon: Settings,
    children: [
      { label: "Empresa", href: "/configuracion" },
      { label: "Usuarios", href: "/configuracion?tab=usuarios" },
      { label: "Permisos", href: "/configuracion?tab=permisos" },
      { label: "Integraciones", href: "/configuracion?tab=integraciones" },
      { label: "Billing", href: "/configuracion?tab=billing" },
    ],
  },
  { label: "Soporte", href: "/soporte", icon: LifeBuoy },
];

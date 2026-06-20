export const PLANS = {
  free: {
    id: 'free', name: 'Free', price: 0,
    limits: { clients: 50, appointments_per_month: 30, services: 5 },
    features: ['Agenda básica', 'Hasta 50 clientes', 'Dashboard'],
  },
  starter: {
    id: 'starter', name: 'Starter', price: 9,
    limits: { clients: 300, appointments_per_month: 200, services: 20 },
    features: ['Todo lo del Free', 'CRM completo', 'Financiero básico', 'WhatsApp prep.'],
  },
  pro: {
    id: 'pro', name: 'Pro', price: 19,
    limits: { clients: Infinity, appointments_per_month: Infinity, services: Infinity },
    features: ['Todo lo del Starter', 'Inventario', 'Reportes avanzados', 'Exportar PDF/Excel'],
  },
  business: {
    id: 'business', name: 'Business', price: 39,
    limits: { clients: Infinity, appointments_per_month: Infinity, services: Infinity },
    features: ['Todo lo del Pro', 'Equipo (hasta 5)', 'IA insights', 'API access'],
  },
  enterprise: {
    id: 'enterprise', name: 'Enterprise', price: null,
    limits: { clients: Infinity, appointments_per_month: Infinity, services: Infinity },
    features: ['Todo lo del Business', 'Equipo ilimitado', 'SLA', 'Onboarding dedicado'],
  },
} as const

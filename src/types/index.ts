export type { Database } from './database'

export type Plan = 'free' | 'starter' | 'pro' | 'business' | 'enterprise'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
export type TransactionType = 'income' | 'expense'
export type Theme = 'light' | 'dark' | 'system'
export type Locale = 'es' | 'pt' | 'en'

export interface Profession {
  id: string; label: string; emoji: string; category: string
}

export interface Country {
  code: string; name: string; currency: string; timezone: string; locale: string
}

export interface NavItem {
  label: string; href: string; icon: string; badge?: number
}

export interface KPI {
  label: string; value: string | number; change?: number; trend?: 'up' | 'down' | 'neutral'
}

export interface SelectOption {
  value: string; label: string
}

// AI layer interfaces (future use)
export interface AIMessage {
  role: 'user' | 'assistant'; content: string; timestamp: string
}

export interface AIInsight {
  type: 'revenue' | 'clients' | 'services' | 'pricing'
  message: string; confidence: number; action?: string
}

// Notification interfaces (future use)
export interface Notification {
  id: string; type: 'push' | 'email' | 'whatsapp'
  title: string; body: string; scheduled_at?: string; sent_at?: string
}

// WhatsApp abstraction (future use)
export interface WhatsAppMessage {
  to: string; body: string; template?: string; variables?: Record<string, string>
}

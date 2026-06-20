export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; email: string; full_name: string | null; avatar_url: string | null
          phone: string | null; created_at: string; updated_at: string
        }
      }
      businesses: {
        Row: {
          id: string; owner_id: string; name: string; profession: string
          country: string; timezone: string; currency: string; primary_color: string
          logo_url: string | null; phone: string | null; address: string | null
          plan: 'free' | 'starter' | 'pro' | 'business' | 'enterprise'
          onboarding_completed: boolean; created_at: string; updated_at: string
        }
      }
      clients: {
        Row: {
          id: string; business_id: string; full_name: string; phone: string | null
          whatsapp: string | null; email: string | null; birthday: string | null
          notes: string | null; total_spent: number; last_visit: string | null
          created_at: string; updated_at: string
        }
      }
      services: {
        Row: {
          id: string; business_id: string; name: string; description: string | null
          price: number; duration_minutes: number; category: string | null
          color: string; is_active: boolean; created_at: string; updated_at: string
        }
      }
      appointments: {
        Row: {
          id: string; business_id: string; client_id: string | null
          service_id: string | null; title: string; start_at: string; end_at: string
          status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
          notes: string | null; price: number | null; created_at: string; updated_at: string
        }
      }
      products: {
        Row: {
          id: string; business_id: string; name: string; description: string | null
          price: number; cost: number | null; stock_quantity: number
          stock_alert_threshold: number; supplier: string | null
          category: string | null; is_active: boolean; created_at: string; updated_at: string
        }
      }
      transactions: {
        Row: {
          id: string; business_id: string; appointment_id: string | null
          type: 'income' | 'expense'; amount: number; description: string
          category: string; date: string; payment_method: string | null
          created_at: string; updated_at: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

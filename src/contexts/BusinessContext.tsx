import { createContext, useContext, useEffect, useState } from 'react'
import type { Database } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

type Business = Database['public']['Tables']['businesses']['Row']

interface BusinessContextValue {
  business: Business | null
  loading: boolean
  refresh: () => Promise<void>
  onboardingComplete: boolean
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBusiness = async () => {
    if (!user) { setBusiness(null); setLoading(false); return }
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .single()
    setBusiness(data as Business | null)
    setLoading(false)
  }

  useEffect(() => { fetchBusiness() }, [user])

  return (
    <BusinessContext.Provider value={{
      business, loading,
      refresh: fetchBusiness,
      onboardingComplete: business?.onboarding_completed ?? false,
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be used within BusinessProvider')
  return ctx
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'
import { useToast } from '@/components/ui/Toast'
import { supabase } from '@/lib/supabase'
import { PROFESSIONS } from '@/constants/professions'
import { LATAM_COUNTRIES } from '@/constants/countries'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

type Step = 1 | 2

export default function OnboardingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { refresh } = useBusiness()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(1)
  const [profession, setProfession] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [country, setCountry] = useState('MX')
  const [loading, setLoading] = useState(false)

  const selectedCountry = LATAM_COUNTRIES.find((c) => c.code === country)

  const handleFinish = async () => {
    if (!user || !profession || !businessName) return
    setLoading(true)
    try {
      const { error } = await supabase.from('businesses').insert({
        owner_id: user.id,
        name: businessName,
        profession,
        country,
        timezone: selectedCountry?.timezone ?? 'America/Mexico_City',
        currency: selectedCountry?.currency ?? 'MXN',
        primary_color: '#6366f1',
        plan: 'free',
        onboarding_completed: true,
      })
      if (error) throw error
      await refresh()
      toast('¡Todo listo! Bienvenido a AgendaPro.', 'success')
      navigate('/app')
    } catch {
      toast(t('auth.errors.generic'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn('h-1.5 flex-1 rounded-full transition-colors', step >= 1 ? 'bg-primary' : 'bg-muted')} />
            <div className={cn('h-1.5 flex-1 rounded-full transition-colors', step >= 2 ? 'bg-primary' : 'bg-muted')} />
          </div>
          <p className="text-xs text-muted-foreground">Paso {step} de 2</p>
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">{t('onboarding.step1Title')}</h1>
            <p className="text-sm text-muted-foreground mb-6">Esto personaliza todo el sistema para ti.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PROFESSIONS.map((p) => (
                <button key={p.id} onClick={() => setProfession(p.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
                    profession === p.id ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50 hover:bg-accent'
                  )}
                >
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="text-xs font-medium leading-tight">{p.label}</span>
                </button>
              ))}
            </div>
            <Button className="w-full mt-6" disabled={!profession} onClick={() => setStep(2)}>{t('common.next')}</Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">{t('onboarding.step2Title')}</h1>
              <p className="text-sm text-muted-foreground mb-6">Casi listo. Solo unos datos más.</p>
            </div>
            <Input label={t('onboarding.businessName')} placeholder={t('onboarding.businessNamePlaceholder')}
              value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">{t('onboarding.country')}</label>
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={country} onChange={(e) => setCountry(e.target.value)}
              >
                {LATAM_COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">{t('common.back')}</Button>
              <Button className="flex-1" disabled={!businessName} loading={loading} onClick={handleFinish}>{t('onboarding.finish')}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

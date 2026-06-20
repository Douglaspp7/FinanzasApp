import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const { resetPassword } = useAuth()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try { await resetPassword(email); setSent(true) }
    catch { toast(t('auth.errors.generic'), 'error') }
    finally { setLoading(false) }
  }

  if (sent) {
    return (
      <AuthCard title={t('auth.checkEmail')} subtitle="Te enviamos un enlace para restablecer tu contraseña.">
        <Link to="/auth/sign-in"><Button variant="outline" className="w-full">{t('common.back')}</Button></Link>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('auth.forgotPassword')} subtitle="Ingresa tu correo y te enviaremos un enlace.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input type="email" label={t('auth.email')} placeholder="tu@email.com"
          leftIcon={<Mail className="h-4 w-4" />} value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Button type="submit" loading={loading} className="w-full">{t('auth.resetPassword')}</Button>
        <Link to="/auth/sign-in" className="text-center text-xs text-muted-foreground hover:text-primary transition-colors">{t('common.back')}</Link>
      </form>
    </AuthCard>
  )
}

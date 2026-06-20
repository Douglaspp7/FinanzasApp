import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock, Wand2 } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { SocialButtons } from '@/components/auth/SocialButtons'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})
type FormData = z.infer<typeof schema>

export default function SignInPage() {
  const { t } = useTranslation()
  const { signInWithPassword, signInWithMagicLink } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkLoading, setMagicLinkLoading] = useState(false)

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await signInWithPassword(data.email, data.password)
      navigate('/app')
    } catch {
      toast(t('auth.errors.generic'), 'error')
    }
  }

  const handleMagicLink = async () => {
    const email = getValues('email')
    if (!email) { toast(t('auth.errors.invalidEmail'), 'error'); return }
    setMagicLinkLoading(true)
    try {
      await signInWithMagicLink(email)
      setMagicLinkSent(true)
    } catch {
      toast(t('auth.errors.generic'), 'error')
    } finally {
      setMagicLinkLoading(false)
    }
  }

  if (magicLinkSent) {
    return (
      <AuthCard title={t('auth.checkEmail')} subtitle={t('auth.magicLinkSent')}>
        <Button variant="outline" className="w-full" onClick={() => setMagicLinkSent(false)}>{t('common.back')}</Button>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('auth.signIn')} subtitle="Bienvenido de vuelta">
      <div className="flex flex-col gap-4">
        <SocialButtons />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o continúa con email</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input {...register('email')} type="email" label={t('auth.email')} placeholder="tu@email.com"
            leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} autoComplete="email" />
          <Input {...register('password')} type="password" label={t('auth.password')} placeholder="••••••••"
            leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message} autoComplete="current-password" />
          <div className="flex justify-end">
            <Link to="/auth/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              {t('auth.forgotPassword')}
            </Link>
          </div>
          <Button type="submit" loading={isSubmitting} className="w-full mt-1">{t('auth.signIn')}</Button>
        </form>
        <Button variant="ghost" size="sm" onClick={handleMagicLink} loading={magicLinkLoading} className="w-full text-muted-foreground">
          <Wand2 className="h-3.5 w-3.5" />{t('auth.magicLink')}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {t('auth.noAccount')}{' '}
          <Link to="/auth/sign-up" className="text-primary font-medium hover:underline">{t('auth.signUp')}</Link>
        </p>
      </div>
    </AuthCard>
  )
}

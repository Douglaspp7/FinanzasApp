import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Lock } from 'lucide-react'
import { AuthCard } from '@/components/auth/AuthCard'
import { SocialButtons } from '@/components/auth/SocialButtons'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/components/ui/Toast'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden', path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export default function SignUpPage() {
  const { t } = useTranslation()
  const { signUpWithPassword } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    try {
      await signUpWithPassword(data.email, data.password)
      toast('¡Cuenta creada! Revisa tu correo para confirmar.', 'success')
      navigate('/auth/sign-in')
    } catch {
      toast(t('auth.errors.generic'), 'error')
    }
  }

  return (
    <AuthCard title={t('auth.signUp')} subtitle="Empieza gratis, sin tarjeta.">
      <div className="flex flex-col gap-4">
        <SocialButtons />
        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">o crea tu cuenta</span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <Input {...register('email')} type="email" label={t('auth.email')} placeholder="tu@email.com"
            leftIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} required />
          <Input {...register('password')} type="password" label={t('auth.password')} placeholder="Mínimo 8 caracteres"
            leftIcon={<Lock className="h-4 w-4" />} error={errors.password?.message} required />
          <Input {...register('confirmPassword')} type="password" label={t('auth.confirmPassword')} placeholder="Repite tu contraseña"
            leftIcon={<Lock className="h-4 w-4" />} error={errors.confirmPassword?.message} required />
          <Button type="submit" loading={isSubmitting} className="w-full mt-1">{t('auth.signUp')}</Button>
        </form>
        <p className="text-center text-xs text-muted-foreground">
          {t('auth.haveAccount')}{' '}
          <Link to="/auth/sign-in" className="text-primary font-medium hover:underline">{t('auth.signIn')}</Link>
        </p>
      </div>
    </AuthCard>
  )
}

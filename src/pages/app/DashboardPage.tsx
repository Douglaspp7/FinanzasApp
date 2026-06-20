import { useTranslation } from 'react-i18next'
import { Calendar, Users, DollarSign, TrendingUp, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { KPICard } from '@/components/dashboard/KPICard'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useBusiness } from '@/contexts/BusinessContext'

export default function DashboardPage() {
  const { t } = useTranslation()
  const { business } = useBusiness()
  const navigate = useNavigate()

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Buenos días'
    if (h < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            {greeting()}{business?.name ? `, ${business.name}` : ''} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/app/agenda')}>
          <Plus className="h-4 w-4" />Nueva cita
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KPICard label={t('dashboard.todayAppointments')} value="0" icon={<Calendar className="h-4 w-4" />} />
        <KPICard label={t('dashboard.todayRevenue')} value="$0" icon={<DollarSign className="h-4 w-4" />} />
        <KPICard label={t('dashboard.monthRevenue')} value="$0" change={0} icon={<TrendingUp className="h-4 w-4" />} />
        <KPICard label={t('dashboard.newClients')} value="0" icon={<Users className="h-4 w-4" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('dashboard.upcomingAppointments')}</CardTitle></CardHeader>
          <CardContent>
            <EmptyState icon={<Calendar className="h-6 w-6" />} title={t('dashboard.noAppointmentsToday')}
              description="Las citas de hoy aparecerán aquí."
              action={{ label: 'Nueva cita', onClick: () => navigate('/app/agenda') }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>{t('dashboard.recentActivity')}</CardTitle></CardHeader>
          <CardContent>
            <EmptyState icon={<TrendingUp className="h-6 w-6" />} title="Sin actividad aún"
              description="La actividad reciente aparecerá aquí." />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('dashboard.quickActions')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Nueva cita', icon: Calendar, href: '/app/agenda' },
              { label: 'Nuevo cliente', icon: Users, href: '/app/clients' },
              { label: 'Nuevo servicio', icon: DollarSign, href: '/app/services' },
              { label: 'Ver finanzas', icon: TrendingUp, href: '/app/financial' },
            ].map(({ label, icon: Icon, href }) => (
              <button key={href} onClick={() => navigate(href)}
                className="flex flex-col items-center gap-2 rounded-xl border border-border p-4 text-sm font-medium text-muted-foreground hover:border-primary/50 hover:bg-accent hover:text-foreground transition-all">
                <Icon className="h-5 w-5" />{label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

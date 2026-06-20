import { useTranslation } from 'react-i18next'
import { Users, CreditCard, Activity, Flag, Shield } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

const adminSections = [
  { key: 'users', icon: Users, label: 'Usuarios', count: '—' },
  { key: 'subscriptions', icon: CreditCard, label: 'Suscripciones', count: '—' },
  { key: 'logs', icon: Activity, label: 'Logs', count: '—' },
  { key: 'flags', icon: Flag, label: 'Feature Flags', count: '—' },
]

export default function AdminPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold text-foreground">{t('nav.admin')}</h1>
        <Badge variant="warning">Super Admin</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {adminSections.map(({ key, icon: Icon, label, count }) => (
          <Card key={key} className="flex flex-col gap-2 cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">{count}</Badge>
            </div>
            <p className="text-sm font-medium text-foreground">{label}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Usuarios recientes</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Tabla de usuarios en construcción.</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Métricas del sistema</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Dashboard de métricas en construcción.</p></CardContent>
        </Card>
      </div>
    </div>
  )
}

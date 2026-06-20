import { useTranslation } from 'react-i18next'
import { User, Building2, Users, Globe, Palette, DollarSign, Clock, Bell, Link2, HardDrive, CreditCard } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { useBusiness } from '@/contexts/BusinessContext'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

const sections = [
  { key: 'profile', icon: User }, { key: 'business', icon: Building2 }, { key: 'team', icon: Users },
  { key: 'language', icon: Globe }, { key: 'theme', icon: Palette }, { key: 'currency', icon: DollarSign },
  { key: 'schedule', icon: Clock }, { key: 'notifications', icon: Bell }, { key: 'integrations', icon: Link2 },
  { key: 'backup', icon: HardDrive }, { key: 'plan', icon: CreditCard },
]

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { business } = useBusiness()
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <h1 className="text-xl font-bold text-foreground">{t('settings.title')}</h1>
      <Card className="flex items-center gap-4">
        <Avatar name={user?.email ?? ''} size="lg" />
        <div className="flex-1">
          <p className="font-semibold text-foreground">{business?.name ?? 'Mi Negocio'}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Badge variant="default" className="capitalize">{business?.plan ?? 'free'}</Badge>
      </Card>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {sections.map(({ key, icon: Icon }) => (
          <button key={key}
            className="flex items-center gap-3 rounded-xl border border-border p-4 text-left hover:border-primary/50 hover:bg-accent transition-all group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-foreground">{t(`settings.${key}`)}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

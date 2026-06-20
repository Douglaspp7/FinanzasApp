import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Calendar, Users, Scissors, Package,
  DollarSign, BarChart2, Settings, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBusiness } from '@/contexts/BusinessContext'

const navItems = [
  { key: 'dashboard', href: '/app', icon: LayoutDashboard, exact: true },
  { key: 'agenda', href: '/app/agenda', icon: Calendar },
  { key: 'clients', href: '/app/clients', icon: Users },
  { key: 'services', href: '/app/services', icon: Scissors },
  { key: 'products', href: '/app/products', icon: Package },
  { key: 'financial', href: '/app/financial', icon: DollarSign },
  { key: 'reports', href: '/app/reports', icon: BarChart2 },
  { key: 'settings', href: '/app/settings', icon: Settings },
]

export function Sidebar() {
  const { t } = useTranslation()
  const { business } = useBusiness()

  return (
    <aside className="hidden md:flex h-screen w-60 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-3 px-5 border-b border-border">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">A</div>
        <span className="font-semibold text-foreground">AgendaPro</span>
      </div>
      {business && (
        <div className="mx-3 mt-3 mb-1 rounded-lg bg-muted/50 px-3 py-2.5">
          <p className="text-xs font-medium text-foreground truncate">{business.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{business.profession.replace('_', ' ')}</p>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ key, href, icon: Icon, exact }) => (
            <li key={key}>
              <NavLink
                to={href}
                end={exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {t(`nav.${key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-border px-3 py-3">
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )
          }
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          {t('nav.admin')}
        </NavLink>
      </div>
    </aside>
  )
}

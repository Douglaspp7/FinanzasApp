import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Calendar, Users, DollarSign, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const mobileNav = [
  { key: 'dashboard', href: '/app', icon: LayoutDashboard, exact: true },
  { key: 'agenda', href: '/app/agenda', icon: Calendar },
  { key: 'clients', href: '/app/clients', icon: Users },
  { key: 'financial', href: '/app/financial', icon: DollarSign },
  { key: 'settings', href: '/app/settings', icon: Settings },
]

export function MobileNav() {
  const { t } = useTranslation()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden">
      <ul className="flex">
        {mobileNav.map(({ key, href, icon: Icon, exact }) => (
          <li key={key} className="flex-1">
            <NavLink
              to={href}
              end={exact}
              className={({ isActive }) =>
                cn('flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground')
              }
            >
              <Icon className="h-5 w-5" />
              {t(`nav.${key}`)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

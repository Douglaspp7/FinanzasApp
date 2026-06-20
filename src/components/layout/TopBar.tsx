import { Bell, Sun, Moon, LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'

export function TopBar() {
  const { user, signOut } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const { t } = useTranslation()
  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-4 md:px-6">
      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">A</div>
        <span className="font-semibold text-sm">AgendaPro</span>
      </div>
      <div className="hidden md:block" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon"><Bell className="h-4 w-4" /></Button>
        <div className="flex items-center gap-2 ml-1 pl-2 border-l border-border">
          <Avatar name={user?.email ?? ''} size="sm" />
          <Button variant="ghost" size="icon" onClick={signOut} title={t('auth.signOut')}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}

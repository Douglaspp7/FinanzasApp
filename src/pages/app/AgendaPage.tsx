import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

type View = 'day' | 'week' | 'month'

export default function AgendaPage() {
  const { t } = useTranslation()
  const [view, setView] = useState<View>('day')
  const [date, setDate] = useState(new Date())

  const views: { key: View; label: string }[] = [
    { key: 'day', label: t('agenda.day') },
    { key: 'week', label: t('agenda.week') },
    { key: 'month', label: t('agenda.month') },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('agenda.title')}</h1>
        <Button size="sm"><Plus className="h-4 w-4" />{t('agenda.newAppointment')}</Button>
      </div>
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDate(subDays(date, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-sm font-semibold text-foreground min-w-[140px] text-center capitalize">
              {format(date, view === 'day' ? "EEEE, d 'de' MMMM" : 'MMMM yyyy', { locale: es })}
            </h2>
            <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDate(new Date())}>{t('common.today')}</Button>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            {views.map(({ key, label }) => (
              <button key={key} onClick={() => setView(key)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent'
                }`}>{label}</button>
            ))}
          </div>
        </div>
      </Card>
      <Card className="min-h-[400px] flex items-center justify-center">
        <EmptyState icon={<Calendar className="h-6 w-6" />} title="Sin citas para este día"
          description="Crea tu primera cita para empezar."
          action={{ label: t('agenda.newAppointment'), onClick: () => {} }} />
      </Card>
    </div>
  )
}

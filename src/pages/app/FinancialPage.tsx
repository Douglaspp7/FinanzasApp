import { useTranslation } from 'react-i18next'
import { Plus, DollarSign, TrendingUp, TrendingDown, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export default function FinancialPage() {
  const { t } = useTranslation()
  const summaryCards = [
    { label: t('financial.income'), value: '$0', icon: TrendingUp, color: 'text-emerald-500' },
    { label: t('financial.expenses'), value: '$0', icon: TrendingDown, color: 'text-destructive' },
    { label: t('financial.profit'), value: '$0', icon: DollarSign, color: 'text-primary' },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('financial.title')}</h1>
        <Button size="sm"><Plus className="h-4 w-4" />{t('financial.newTransaction')}</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="flex items-center gap-4 p-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-muted ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{value}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><CardTitle>{t('financial.cashFlow')}</CardTitle></CardHeader>
        <CardContent>
          <EmptyState icon={<BarChart2 className="h-6 w-6" />} title="Sin transacciones aún"
            description="Registra ingresos y gastos para ver tu flujo de caja."
            action={{ label: t('financial.newTransaction'), onClick: () => {} }} />
        </CardContent>
      </Card>
    </div>
  )
}

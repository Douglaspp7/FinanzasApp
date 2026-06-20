import { useTranslation } from 'react-i18next'
import { BarChart2, Download } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ReportsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('reports.title')}</h1>
        <Button size="sm" variant="outline"><Download className="h-4 w-4" />{t('reports.export')}</Button>
      </div>
      <Card className="min-h-[400px] flex items-center justify-center">
        <EmptyState icon={<BarChart2 className="h-6 w-6" />} title="Sin datos para reportes"
          description="Los reportes se generarán cuando tengas citas y transacciones." />
      </Card>
    </div>
  )
}

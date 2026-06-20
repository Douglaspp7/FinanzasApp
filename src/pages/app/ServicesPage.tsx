import { useTranslation } from 'react-i18next'
import { Plus, Scissors } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ServicesPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('services.title')}</h1>
        <Button size="sm"><Plus className="h-4 w-4" />{t('services.newService')}</Button>
      </div>
      <Card className="min-h-[400px] flex items-center justify-center">
        <EmptyState icon={<Scissors className="h-6 w-6" />} title={t('services.noServices')}
          description="Define tus servicios para poder agendar citas."
          action={{ label: t('services.newService'), onClick: () => {} }} />
      </Card>
    </div>
  )
}

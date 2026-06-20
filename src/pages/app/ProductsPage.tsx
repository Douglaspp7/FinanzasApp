import { useTranslation } from 'react-i18next'
import { Plus, Package } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export default function ProductsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('products.title')}</h1>
        <Button size="sm"><Plus className="h-4 w-4" />{t('products.newProduct')}</Button>
      </div>
      <Card className="min-h-[400px] flex items-center justify-center">
        <EmptyState icon={<Package className="h-6 w-6" />} title={t('products.noProducts')}
          description="Agrega productos para controlar tu inventario."
          action={{ label: t('products.newProduct'), onClick: () => {} }} />
      </Card>
    </div>
  )
}

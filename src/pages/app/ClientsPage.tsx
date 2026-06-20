import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'

export default function ClientsPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{t('clients.title')}</h1>
        <Button size="sm"><Plus className="h-4 w-4" />{t('clients.newClient')}</Button>
      </div>
      <Input placeholder={t('clients.searchPlaceholder')} leftIcon={<Search className="h-4 w-4" />}
        value={search} onChange={(e) => setSearch(e.target.value)} />
      <Card className="min-h-[400px] flex items-center justify-center">
        <EmptyState icon={<Users className="h-6 w-6" />} title={t('clients.noClients')}
          description="Agrega tu primer cliente y empieza a construir tu base."
          action={{ label: t('clients.newClient'), onClick: () => {} }} />
      </Card>
    </div>
  )
}

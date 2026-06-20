import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'

interface KPICardProps {
  label: string; value: string | number; change?: number; icon: React.ReactNode; loading?: boolean
}

export function KPICard({ label, value, change, icon, loading }: KPICardProps) {
  if (loading) {
    return (
      <Card className="flex flex-col gap-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-3 w-16" />
      </Card>
    )
  }
  const trend = change === undefined ? null : change > 0 ? 'up' : change < 0 ? 'down' : 'neutral'
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {trend && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          trend === 'up' && 'text-emerald-500',
          trend === 'down' && 'text-destructive',
          trend === 'neutral' && 'text-muted-foreground',
        )}>
          {trend === 'up' && <TrendingUp className="h-3 w-3" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3" />}
          {trend === 'neutral' && <Minus className="h-3 w-3" />}
          {Math.abs(change!)}% vs mes anterior
        </div>
      )}
    </Card>
  )
}

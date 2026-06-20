import { cn } from '@/lib/utils'

interface AuthCardProps {
  title: string; subtitle?: string; children: React.ReactNode; className?: string
}

export function AuthCard({ title, subtitle, children, className }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className={cn('w-full max-w-sm', className)}>
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold">A</div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">AgendaPro</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

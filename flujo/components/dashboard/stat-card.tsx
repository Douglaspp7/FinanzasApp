import { ArrowUpRight, ArrowDownRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn, formatPercent } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon: LucideIcon;
  hint?: string;
}

export function StatCard({ label, value, change, icon: Icon, hint }: StatCardProps) {
  const positive = (change ?? 0) >= 0;
  return (
    <Card className="p-5 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-fg-muted">{label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-2 text-fg-muted">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-fg">{value}</div>
      <div className="mt-1.5 flex items-center gap-2">
        {change !== undefined && (
          <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", positive ? "text-success" : "text-danger")}>
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatPercent(change)}
          </span>
        )}
        <span className="text-xs text-fg-subtle">{hint ?? "vs. periodo anterior"}</span>
      </div>
    </Card>
  );
}

import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ModulePlaceholder({
  title, breadcrumb, description, icon: Icon, features,
}: {
  title: string;
  breadcrumb: string;
  description: string;
  icon: LucideIcon;
  features: string[];
}) {
  return (
    <>
      <PageHeader title={title} breadcrumb={breadcrumb} description={description} />
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-muted text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-fg">{title}</h3>
          <p className="mt-1 max-w-md text-sm text-fg-muted">{description}</p>
          <Badge variant="warning" className="mt-4">Módulo en construcción</Badge>
          <div className="mt-8 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5 text-left text-sm text-fg-muted">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </>
  );
}

import { Megaphone } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function MarketingPage() {
  return (
    <ModulePlaceholder
      title="Marketing" breadcrumb="Marketing" icon={Megaphone}
      description="Cupones, campañas, promociones y automatizaciones para impulsar tus ventas."
      features={["Cupones de descuento", "Campañas por email/SMS", "Promociones programadas", "Automatizaciones de flujo", "Segmentación de audiencia", "A/B testing"]}
    />
  );
}

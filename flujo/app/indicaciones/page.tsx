import { Share2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function IndicacionesPage() {
  return (
    <ModulePlaceholder
      title="Programa de Referidos" breadcrumb="Referidos" icon={Share2}
      description="Convierte a tus clientes en promotores con un programa de referidos medible."
      features={["Link único por cliente", "Seguimiento de conversiones", "Recompensas automáticas", "Ranking de referidores", "Invitaciones por WhatsApp", "Reportes de ROI"]}
    />
  );
}

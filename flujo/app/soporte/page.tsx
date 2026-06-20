import { LifeBuoy } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function SoportePage() {
  return (
    <ModulePlaceholder
      title="Soporte" breadcrumb="Soporte" icon={LifeBuoy}
      description="Centro de ayuda, tickets y documentación de Flujo."
      features={["Centro de ayuda", "Tickets de soporte", "Chat en vivo", "Documentación", "Estado del sistema", "Solicitar funciones"]}
    />
  );
}

import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/ui/module-placeholder";

export default function ConfiguracionPage() {
  return (
    <ModulePlaceholder
      title="Configuración" breadcrumb="Configuración" icon={Settings}
      description="Administra tu empresa, equipo, permisos, integraciones y facturación."
      features={["Datos de la empresa", "Usuarios y roles", "Permisos granulares", "Integraciones (API)", "Notificaciones", "Seguridad y 2FA", "Plan y billing", "Respaldos"]}
    />
  );
}

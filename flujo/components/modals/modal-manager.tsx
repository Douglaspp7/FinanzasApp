"use client";

import { AlertTriangle, X } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";

export function ModalManager() {
  const { modal, closeModal } = useUIStore();
  if (!modal.type) return null;

  const props = modal.props as {
    title?: string; message?: string; confirmLabel?: string; variant?: "danger" | "primary";
    onConfirm?: () => void;
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center px-4 animate-fade-in" onClick={closeModal}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-xl border border-border bg-elevated p-6 shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <button onClick={closeModal} className="absolute right-4 top-4 text-fg-subtle hover:text-fg">
          <X className="h-4 w-4" />
        </button>

        {modal.type === "confirmation" && (
          <>
            <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${props.variant === "danger" ? "bg-danger-muted text-danger" : "bg-primary-muted text-primary"}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-fg">{props.title ?? "¿Estás seguro?"}</h3>
            <p className="mt-1 text-sm text-fg-muted">{props.message ?? "Esta acción no se puede deshacer."}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>Cancelar</Button>
              <Button variant={props.variant === "danger" ? "danger" : "primary"} className="flex-1" onClick={() => { props.onConfirm?.(); closeModal(); }}>
                {props.confirmLabel ?? "Confirmar"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

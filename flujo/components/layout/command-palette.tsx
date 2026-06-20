"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search, ArrowRight, Users, Wallet, Package, Scissors, ShoppingCart } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { navigation } from "@/lib/navigation";
import { clientes, produtos, servicios } from "@/lib/mock-data";

export function CommandPalette() {
  const { commandOpen, setCommandOpen } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen(!commandOpen);
      }
      if (e.key === "Escape") setCommandOpen(false);
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [commandOpen, setCommandOpen]);

  if (!commandOpen) return null;

  const go = (href: string) => { router.push(href); setCommandOpen(false); };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4 animate-fade-in" onClick={() => setCommandOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <Command
        className="relative w-full max-w-xl overflow-hidden rounded-xl border border-border bg-elevated shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        loop
      >
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-fg-subtle" />
          <Command.Input
            autoFocus
            placeholder="Buscar clientes, productos, páginas..."
            className="h-12 flex-1 bg-transparent text-sm text-fg outline-none placeholder:text-fg-subtle"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] text-fg-muted">ESC</kbd>
        </div>

        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-fg-muted">Sin resultados.</Command.Empty>

          <Command.Group heading="Páginas" className="px-2 text-xs font-medium text-fg-subtle [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1.5">
            {navigation.map((item) => (
              <Command.Item
                key={item.href}
                value={`page ${item.label}`}
                onSelect={() => go(item.href)}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg aria-selected:bg-primary-muted aria-selected:text-primary"
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                <ArrowRight className="h-3.5 w-3.5 opacity-50" />
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Clientes" className="px-2 text-xs font-medium text-fg-subtle [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1.5">
            {clientes.slice(0, 6).map((c) => (
              <Command.Item
                key={c.id}
                value={`cliente ${c.nombre}`}
                onSelect={() => go("/clientes")}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg aria-selected:bg-primary-muted aria-selected:text-primary"
              >
                <Users className="h-4 w-4" />
                <span className="flex-1">{c.nombre}</span>
                <span className="text-xs text-fg-subtle">{c.id}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Productos y servicios" className="px-2 text-xs font-medium text-fg-subtle [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1.5">
            {produtos.slice(0, 3).map((p) => (
              <Command.Item key={p.id} value={`producto ${p.nombre}`} onSelect={() => go("/produtos")}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg aria-selected:bg-primary-muted aria-selected:text-primary">
                <Package className="h-4 w-4" /><span className="flex-1">{p.nombre}</span>
              </Command.Item>
            ))}
            {servicios.slice(0, 3).map((s) => (
              <Command.Item key={s.id} value={`servicio ${s.nombre}`} onSelect={() => go("/servicos")}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg aria-selected:bg-primary-muted aria-selected:text-primary">
                <Scissors className="h-4 w-4" /><span className="flex-1">{s.nombre}</span>
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group heading="Acciones" className="px-2 text-xs font-medium text-fg-subtle [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1.5">
            <Command.Item value="nueva venta" onSelect={() => go("/vendas")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg aria-selected:bg-primary-muted aria-selected:text-primary">
              <ShoppingCart className="h-4 w-4" /><span>Nueva venta</span>
            </Command.Item>
            <Command.Item value="nuevo movimiento" onSelect={() => go("/financeiro")}
              className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-fg aria-selected:bg-primary-muted aria-selected:text-primary">
              <Wallet className="h-4 w-4" /><span>Nuevo movimiento financiero</span>
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

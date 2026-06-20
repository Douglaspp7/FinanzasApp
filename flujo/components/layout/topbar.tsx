"use client";

import { Search, Bell, Menu, Sun, Moon, Plus } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/input";

export function Topbar() {
  const { setMobileSidebar, setCommandOpen, setNotificationsOpen, theme, toggleTheme } = useUIStore();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-4 backdrop-blur-md">
      <button className="lg:hidden text-fg-muted hover:text-fg" onClick={() => setMobileSidebar(true)}>
        <Menu className="h-5 w-5" />
      </button>

      <button
        onClick={() => setCommandOpen(true)}
        className="flex h-9 flex-1 max-w-md items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm text-fg-subtle transition-colors hover:border-border-strong"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar clientes, ventas, páginas...</span>
        <kbd className="hidden rounded border border-border bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-muted sm:inline">⌘K</kbd>
      </button>

      <div className="flex-1" />

      <Button size="sm" className="hidden sm:inline-flex">
        <Plus className="h-4 w-4" /> Nuevo
      </Button>

      <button onClick={toggleTheme} className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg">
        {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
      </button>

      <button
        onClick={() => setNotificationsOpen(true)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
      >
        <Bell className="h-[18px] w-[18px]" />
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-danger" />
      </button>

      <Avatar name="Ana Empresa" />
    </header>
  );
}

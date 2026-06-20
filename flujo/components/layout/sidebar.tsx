"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { navigation } from "@/lib/navigation";
import { useUIStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileSidebarOpen, setMobileSidebar } = useUIStore();
  const [expanded, setExpanded] = useState<string | null>(
    navigation.find((n) => n.children?.some((c) => pathname.startsWith(c.href.split("?")[0])))?.label ?? null
  );

  const collapsed = sidebarCollapsed;

  return (
    <>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden animate-fade-in" onClick={() => setMobileSidebar(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-surface transition-all duration-200 lg:static lg:z-auto",
          collapsed ? "w-[68px]" : "w-60",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center gap-2.5 border-b border-border px-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-fg">F</div>
          {!collapsed && <span className="text-[15px] font-semibold tracking-tight text-fg">Flujo</span>}
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          <ul className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              const base = item.href.split("?")[0];
              const active = pathname === base || (base !== "/dashboard" && pathname.startsWith(base));
              const isOpen = expanded === item.label;

              return (
                <li key={item.label}>
                  <div className="flex items-center">
                    <Link
                      href={item.href}
                      onClick={() => { setMobileSidebar(false); if (item.children) setExpanded(isOpen ? null : item.label); }}
                      className={cn(
                        "group flex h-9 flex-1 items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium transition-colors",
                        active ? "bg-primary-muted text-primary" : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                        collapsed && "justify-center"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                      {!collapsed && item.children && (
                        <ChevronRight className={cn("h-4 w-4 shrink-0 transition-transform", isOpen && "rotate-90")} />
                      )}
                    </Link>
                  </div>

                  {!collapsed && item.children && isOpen && (
                    <ul className="mt-0.5 space-y-0.5 pl-9 animate-slide-in-up">
                      {item.children.map((child) => (
                        <li key={child.href}>
                          <Link
                            href={child.href}
                            onClick={() => setMobileSidebar(false)}
                            className="flex h-8 items-center rounded-md px-2.5 text-[13px] text-fg-muted transition-colors hover:text-fg"
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-border p-2.5">
          <button
            onClick={toggleSidebar}
            className={cn(
              "hidden h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg lg:flex",
              collapsed && "justify-center"
            )}
          >
            {collapsed ? <PanelLeft className="h-[18px] w-[18px]" /> : <><PanelLeftClose className="h-[18px] w-[18px]" /> <span>Colapsar</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}

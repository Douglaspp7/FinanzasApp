"use client";

import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { CommandPalette } from "./command-palette";
import { NotificationCenter } from "./notification-center";
import { DrawerManager } from "@/components/drawers/drawer-manager";
import { ModalManager } from "@/components/modals/modal-manager";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
      <CommandPalette />
      <NotificationCenter />
      <DrawerManager />
      <ModalManager />
    </div>
  );
}

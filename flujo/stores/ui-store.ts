"use client";

import { create } from "zustand";
import type { ReactNode } from "react";

interface DrawerState {
  type: "customer" | "financial" | "entity" | null;
  data: unknown;
}

interface ModalState {
  type: "confirmation" | "custom" | null;
  props: Record<string, unknown>;
}

interface UIStore {
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  toggleSidebar: () => void;
  setMobileSidebar: (open: boolean) => void;
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (t: "light" | "dark") => void;
  drawer: DrawerState;
  openDrawer: (type: DrawerState["type"], data: unknown) => void;
  closeDrawer: () => void;
  modal: ModalState & { content?: ReactNode };
  openModal: (type: ModalState["type"], props?: Record<string, unknown>) => void;
  closeModal: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
  commandOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  notificationsOpen: false,
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  theme: "dark",
  toggleTheme: () => set((s) => {
    const next = s.theme === "dark" ? "light" : "dark";
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("flujo-theme", next);
    }
    return { theme: next };
  }),
  setTheme: (t) => set(() => {
    if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", t === "dark");
    return { theme: t };
  }),
  drawer: { type: null, data: null },
  openDrawer: (type, data) => set({ drawer: { type, data } }),
  closeDrawer: () => set({ drawer: { type: null, data: null } }),
  modal: { type: null, props: {} },
  openModal: (type, props = {}) => set({ modal: { type, props } }),
  closeModal: () => set({ modal: { type: null, props: {} } }),
}));

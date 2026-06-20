"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui-store";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, refetchOnWindowFocus: false } },
  }));
  const setTheme = useUIStore((s) => s.setTheme);

  useEffect(() => {
    const saved = (localStorage.getItem("flujo-theme") as "light" | "dark") ?? "dark";
    setTheme(saved);
  }, [setTheme]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

/**
 * Providers client globaux, montés une seule fois dans le RootLayout.
 * Le QueryClient est créé dans un useState pour survivre aux re-renders
 * sans être partagé entre requêtes SSR.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delay={200}>{children}</TooltipProvider>
        <Toaster position="bottom-right" richColors />
      </QueryClientProvider>
    </SessionProvider>
  );
}

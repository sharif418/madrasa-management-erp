"use client";
// App-wide client providers.
// Wraps the tree with a single TanStack Query QueryClient so that React Query
// hooks (e.g. `useStudents`, `useClasses`) used by feature modules work.
import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function Providers({ children }: { children: ReactNode }) {
  // Create the QueryClient once per component instance. `useState` keeps it
  // stable across re-renders and avoids recreating the client on every render.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 30_000,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

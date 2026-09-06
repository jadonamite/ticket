/**
 * Drop this around whatever needs wallet/contract access — e.g. in `layout.tsx` around
 * `{children}`, or scoped to just the product screens if the landing page shouldn't pay for a
 * wallet connector on every page load. Not wired in yet; see `wagmi.ts`.
 */
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "./wagmi";

const queryClient = new QueryClient();

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

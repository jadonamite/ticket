/**
 * Wallet connection config. Not wired into the app shell yet — import `wagmiConfig` into a
 * `WagmiProvider` (wrapping `QueryClientProvider`) once the product screens are ready for it, so
 * this doesn't collide with in-progress landing-page work on `layout.tsx`.
 */
import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}

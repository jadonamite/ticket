import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The repo root (one level up) also has a package-lock.json for the Hardhat/contracts
  // side of the project, which made Next.js infer the wrong workspace root and scan the
  // whole monorepo (contracts, artifacts, etc.) instead of just this app — hanging the build.
  turbopack: {
    root: path.join(__dirname),
  },
  outputFileTracingRoot: path.join(__dirname),
  webpack: (config) => {
    // wagmi/connectors' barrel file pulls in every connector implementation, but src/lib/wagmi.ts
    // only ever uses `injected()`. The others' optional peer deps aren't installed, so stub them
    // out instead of pulling in wallet SDKs this app doesn't use.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@base-org/account": false,
      "@coinbase/wallet-sdk": false,
      "@metamask/connect-evm": false,
      "@safe-global/safe-apps-sdk": false,
      "@safe-global/safe-apps-provider": false,
      "@walletconnect/ethereum-provider": false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "framerusercontent.com",
      },
    ],
  },
};

export default nextConfig;

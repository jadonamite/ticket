/**
 * The product screen: connect, claim, deposit, watch a draw, withdraw. See DemoContent.tsx's
 * sibling in `../demo/` for why this needs the same `next/dynamic({ ssr: false })` boundary —
 * the FHE SDK's WASM glue crashes if Next ever `require()`s it on the server.
 */
"use client";

import dynamic from "next/dynamic";

const AppContent = dynamic(() => import("./AppContent"), { ssr: false });

export default function AppPage() {
  return <AppContent />;
}

/**
 * Not a product screen — a diagnostic route that exercises the whole wallet/FHE wiring layer
 * (`src/lib/`) against the live Sepolia pool. See DemoContent.tsx for what it actually does.
 *
 * `next/dynamic({ ssr: false })` is load-bearing here, not a style choice: the FHE SDK's WASM
 * glue references browser-only globals at module load time, which crashes if Next ever tries to
 * `require()` it on the server (including just to collect build-time route metadata). This is
 * the only thing that keeps that whole chain out of the server bundle. Any real product screen
 * that imports `src/lib/hooks.ts` needs the same boundary.
 *
 * `ssr: false` is only legal from a Client Component, hence "use client" here too — the page
 * itself renders nothing server-side either way, so this costs nothing.
 */
"use client";

import dynamic from "next/dynamic";

const DemoContent = dynamic(() => import("./DemoContent"), { ssr: false });

export default function DemoPage() {
  return <DemoContent />;
}

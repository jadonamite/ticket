/**
 * Verify Draw — reachable in one click from any settled draw (see the draw history list on
 * `/app`). Reads only plain on-chain state (`drawOf`, event logs); no wallet connection and no
 * FHE decryption is needed to check any of it, which is the point: a stranger can load this URL
 * cold and confirm the same four claims PRD.md §4 names as the fairness promise.
 */
import VerifyContent from "./VerifyContent";

export default async function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <VerifyContent id={id} />;
}

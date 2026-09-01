/**
 * A retrying, failing-over JSON-RPC proxy for Sepolia.
 *
 * The public endpoints answer, but not reliably: a run that makes several hundred `eth_call`s
 * through the FHEVM plugin will lose one socket somewhere in the middle and take the whole test
 * with it. The failures are transport failures — `UND_ERR_SOCKET`, `ETIMEDOUT` — not chain
 * errors, and retrying the same request against a second endpoint answers it.
 *
 * So this sits in front of them: same request, tried in turn, up to a limit, and only then
 * reported as a failure. Nothing about it is Ticket-specific.
 *
 *   node scripts/rpc-proxy.mjs            # listens on 127.0.0.1:8547
 *   SEPOLIA_RPC_URL=http://127.0.0.1:8547 npx hardhat test ... --network sepolia
 */
import { createServer } from "node:http";

const PORT = Number(process.env.PROXY_PORT ?? 8547);
const UPSTREAMS = (
  process.env.PROXY_UPSTREAMS ??
  "https://ethereum-sepolia-rpc.publicnode.com,https://sepolia.gateway.tenderly.co"
).split(",");
const ATTEMPTS = Number(process.env.PROXY_ATTEMPTS ?? 6);
const TIMEOUT_MS = Number(process.env.PROXY_TIMEOUT ?? 25_000);

/** Messages that mean "not you, not now" rather than "your transaction is wrong". */
const REFUSALS = [
  "cu limit",
  "rate limit",
  "too many requests",
  "unregistered",
  "upgrade to paid",
  "free plan",
  "no longer available",
  "capacity",
  "exceeded",
];

function isProviderRefusal(text) {
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return true;
  }
  const message = String(body?.error?.message ?? body?.error ?? "").toLowerCase();
  if (!message) return false;
  if (message.includes("execution reverted")) return false;
  return REFUSALS.some((needle) => message.includes(needle));
}

let cursor = 0;
let served = 0;
let retried = 0;

async function forward(body) {
  let last;
  for (let attempt = 0; attempt < ATTEMPTS; attempt++) {
    const upstream = UPSTREAMS[(cursor + attempt) % UPSTREAMS.length];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(upstream, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
        signal: controller.signal,
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`${upstream} ${response.status}`);

      // A provider that is rate-limiting, gated or retired answers 200 with an error body. That
      // is a transport failure wearing a chain error's clothes, and failing over answers it —
      // whereas a real `execution reverted` must be handed back untouched, because the caller is
      // entitled to the revert data.
      if (isProviderRefusal(text)) throw new Error(`${upstream} refused: ${text.slice(0, 120)}`);
      if (attempt > 0) {
        retried++;
        cursor = (cursor + attempt) % UPSTREAMS.length;
      }
      return text;
    } catch (error) {
      last = error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw last;
}

createServer((req, res) => {
  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", async () => {
    const body = Buffer.concat(chunks).toString();
    served++;
    try {
      const text = await forward(body);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(text);
    } catch (error) {
      // A transport failure has to come back as a JSON-RPC error, not a dead socket, or the
      // client library reports it as "missing revert data" and the real cause is lost.
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          jsonrpc: "2.0",
          id: null,
          error: { code: -32000, message: `proxy: all upstreams failed — ${String(error)}` },
        }),
      );
    }
  });
}).listen(PORT, "127.0.0.1", () => {
  console.log(`rpc proxy on http://127.0.0.1:${PORT}`);
  console.log(`upstreams: ${UPSTREAMS.join(", ")}`);
});

setInterval(() => {
  if (served) console.log(`  ${served} requests, ${retried} needed a retry`);
}, 30_000).unref?.();

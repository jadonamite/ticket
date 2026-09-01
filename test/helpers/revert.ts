import { expect } from "chai";

/**
 * `expect(...).to.be.reverted` reads the revert out of a gas estimation, which only exists on a
 * network that simulates before it sends. On Sepolia the transaction is mined with status 0 and
 * ethers raises a plain CALL_EXCEPTION with no data, which the matcher does not recognise — so a
 * security property that holds would be reported as a failing test.
 *
 * This asserts the thing actually claimed: the call did not succeed.
 */
export async function expectRejected(action: Promise<any>, what = "call") {
  let threw = false;
  try {
    const sent = await action;
    if (sent && typeof sent.wait === "function") {
      const receipt = await sent.wait();
      if (receipt && receipt.status === 0) threw = true;
    }
  } catch {
    threw = true;
  }
  expect(threw, `${what} was expected to revert and did not`).to.equal(true);
}

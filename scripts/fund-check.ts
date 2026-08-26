/**
 * T003. Where the deployer and keeper stand on Sepolia.
 *
 * The keeper drives every step of a draw, so it runs out of gas quietly and at the worst
 * possible moment. This prints both balances and says plainly whether they are enough.
 *
 * Run: npx hardhat run scripts/fund-check.ts --network sepolia
 */
import { ethers } from "hardhat";

// A draw is 1 + 2*depth + 1 = 8 transactions at depth 3, and FHE transactions are heavy.
// These floors are deliberately generous; running dry mid-draw costs more than the ETH does.
const DEPLOYER_FLOOR = ethers.parseEther("0.05");
const KEEPER_FLOOR = ethers.parseEther("0.1");

async function main() {
  const [deployer, keeper] = await ethers.getSigners();
  const net = await ethers.provider.getNetwork();

  console.log(`\nnetwork  ${net.name} (${net.chainId})\n`);

  let short = false;
  for (const [label, signer, floor] of [
    ["deployer", deployer, DEPLOYER_FLOOR],
    ["keeper", keeper, KEEPER_FLOOR],
  ] as const) {
    const balance = await ethers.provider.getBalance(signer.address);
    const ok = balance >= floor;
    if (!ok) short = true;
    console.log(
      `${label.padEnd(9)} ${signer.address}  ${ethers.formatEther(balance).padStart(10)} ETH  ` +
        `${ok ? "ok" : `SHORT — needs ${ethers.formatEther(floor)}`}`,
    );
  }

  console.log("");
  if (short) {
    console.log("Fund the addresses above before deploying. Faucets:");
    console.log("  https://cloud.google.com/application/web3/faucet/ethereum/sepolia");
    console.log("  https://www.alchemy.com/faucets/ethereum-sepolia");
    console.log("");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

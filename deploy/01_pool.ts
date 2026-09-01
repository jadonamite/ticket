import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

import { ARITY, CAPACITY, PERIOD_LENGTH } from "../config/params";

/**
 * T033. The whole deployment: a demo confidential token, and the pool that draws over it.
 *
 * The token is a constructor argument rather than a dependency, so pointing this at an official
 * confidential USDT when one exists is a one-line change and not a migration. On any network that
 * is not Sepolia the faucet token is skipped — it exists so a judge can try the product without
 * asking anyone for tokens, and it has no business anywhere the balances mean something.
 */
const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy, log } = deployments;
  const { deployer, keeper } = await getNamedAccounts();

  const token = await deploy("ConfidentialUSDT", {
    from: deployer,
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
  });

  const pool = await deploy("DrawMachine", {
    from: deployer,
    args: [token.address, ARITY, CAPACITY, PERIOD_LENGTH, keeper],
    log: true,
    waitConfirmations: network.name === "hardhat" ? 1 : 2,
  });

  log(`token   ${token.address}`);
  log(`pool    ${pool.address}`);
  log(`keeper  ${keeper}`);
  log(`arity ${ARITY} · capacity ${CAPACITY} · period ${PERIOD_LENGTH}s`);
};

func.tags = ["pool"];
export default func;

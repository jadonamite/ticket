/**
 * T022. Deployment parameters, and the measurements that fixed them.
 *
 * Every number here was chosen by running `bench/hcu-probe.ts` and `bench/run.ts`, not by
 * arithmetic on the documentation. The reasoning is kept next to the value because a constant
 * with no recorded justification is a constant nobody can safely change later.
 */

/**
 * Children per node.
 *
 * The binding per-transaction ceiling is sequential depth (5,000,000), not global HCU
 * (20,000,000) — which is the opposite of what the sizing arithmetic suggested. At k=32 the
 * global limit binds instead and the level cannot be made to fit at all. At k=16 the level fits
 * in two transactions provided the prefix sum is a scan rather than a running total: measured
 * 73.4% of the global limit and 77.3% of the depth limit at the selection step.
 *
 * Drop to 8 if real state ever eats that headroom. It costs one extra level, so the draw grows
 * from 8 transactions to 10.
 */
export const ARITY = 16;

/**
 * Leaves, and therefore the maximum number of depositors.
 *
 * 16^3, so three levels above the leaves. Also the `Limits.MAX_SLOTS` cap, which is what keeps
 * the summed balance inside 2^44 and the integral inside 2^63.
 */
export const CAPACITY = 4096;

/** Levels between root and leaf. A draw is `1 + 2*DEPTH + 1` transactions. */
export const DEPTH = 3;

/**
 * Seconds per draw period.
 *
 * One hour for the demo, so a judge can watch a full cycle rather than read about one. The hard
 * ceiling is `Limits.MAX_PERIOD` = 2^19 seconds (~6.1 days); beyond it the integral can overflow
 * `euint64` and the constructor rejects it.
 */
export const PERIOD_LENGTH = 3600;

/** Sepolia. `ZamaEthereumConfig` selects its addresses from `block.chainid`. */
export const CHAIN_ID = 11155111;

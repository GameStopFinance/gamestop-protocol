const { stakingPools, INITIAL_GME_FOR_POOLS } = require('./pools');

// Pools
// deployed first
const GameStopToken = artifacts.require('GameStopToken')
const StakingRewardsDistributor = artifacts.require('StakingRewardsDistributor');

// ============ Main Migration ============

module.exports = async (deployer, network, accounts) => {
  const unit = web3.utils.toBN(10 ** 18);
  const initialCashAmount = unit.muln(INITIAL_GME_FOR_POOLS).toString();

  const gmeToken = await GameStopToken.deployed();
  const pools = stakingPools.map(({contractName}) => artifacts.require(contractName));

  await deployer.deploy(
    StakingRewardsDistributor,
    gmeToken.address,
    pools.map(p => p.address),
    initialCashAmount,
  );
  const distributor = await StakingRewardsDistributor.deployed();

  console.log(`Setting distributor to InitialCashDistributor (${distributor.address})`);
  for await (const poolInfo of pools) {
    const pool = await poolInfo.deployed()
    await pool.setRewardDistribution(distributor.address);
    console.log(`Set for ${poolInfo.contractName}`)
  }

  await gmeToken.mint(distributor.address, initialCashAmount);
  console.log(`Deposited ${INITIAL_GME_FOR_POOLS} GME to InitialCashDistributor.`);

  await distributor.distribute();
}

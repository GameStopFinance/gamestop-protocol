const {
  lpPools,
  INITIAL_GME_FOR_LP
} = require('./pools');

// Pools
// deployed first
const GameStopToken = artifacts.require('GameStopToken');
const LPRewardsDistributor = artifacts.require('LPRewardsDistributor');

// ============ Main Migration ============

async function migration(deployer, network, accounts) {
  const unit = web3.utils.toBN(10 ** 18);
  const totalBalance = unit.muln(INITIAL_GME_FOR_LP);

  const gmeToken = await GameStopToken.deployed();

  const lpPoolETHGME = artifacts.require(lpPools.ETHGME.contractName);;

  await deployer.deploy(
    LPRewardsDistributor,
    GameStopToken.address,
    lpPoolETHGME.address,
    totalBalance.toString()
  );
  const distributor = await LPRewardsDistributor.deployed();

  await gmeToken.mint(distributor.address, totalBalance.toString());
  console.log(`Deposited ${INITIAL_GME_FOR_LP} GME to LPRewardsDistributor.`);

  console.log(`Setting distributor to LPRewardsDistributor (${distributor.address})`);
  await lpPoolETHGME.deployed().then(pool => pool.setRewardDistribution(distributor.address));

  await distributor.distribute();
}

module.exports = migration;

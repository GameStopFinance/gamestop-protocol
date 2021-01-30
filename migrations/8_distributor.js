const Distributor = artifacts.require('Distributor');
const StakingRewardsDistributor = artifacts.require('StakingRewardsDistributor');
const LPRewardsDistributor = artifacts.require('LPRewardsDistributor');

module.exports = async (deployer, network, accounts) => {
  const distributors = await Promise.all(
    [
      StakingRewardsDistributor,
      LPRewardsDistributor,
    ].map(distributor => distributor.deployed())
  );

  await deployer.deploy(
    Distributor,
    distributors.map(contract => contract.address),
  );
  const distributor = await Distributor.deployed();

  console.log(`Distributor manager contract is ${distributor.address}`)
}

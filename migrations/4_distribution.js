const knownContracts = require('./known-contracts');
const { stakingPools, POOL_START_DATE } = require('./pools');

// Tokens
// deployed first
const GameStopToken = artifacts.require('GameStopToken');
const MockDai = artifacts.require('MockDai');

// ============ Main Migration ============
module.exports = async (deployer, network_, accounts) => {
  const network = network_ === 'mainnet-fork' ? 'mainnet' : network_
  for await (const { contractName, token } of stakingPools) {
    const tokenAddress = knownContracts[token][network] || MockDai.address;
    if (!tokenAddress) {
      // network is mainnet, so MockUSDT is not available
      throw new Error(`Address of ${token} is not registered on migrations/known-contracts.js!`);
    }

    // Start pool immediately on local
    const startTime = network === 'dev' ? Math.round(Date.now() / 1000) : POOL_START_DATE
    const contract = artifacts.require(contractName);

    // if (network === 'mainnet') {
    //   try {
    //     const deployedAddresss = contract.address
    //     console.log('Pool already deployed, skipping', deployedAddresss)
    //     continue
    //   } catch (err) {}
    // }

    await deployer.deploy(contract, GameStopToken.address, tokenAddress, startTime);
  }
};

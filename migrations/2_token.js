// ============ Contracts ============

// Token
// deployed first
const GameStopToken = artifacts.require('GameStopToken')
const MockDai = artifacts.require('MockDai');
// const MockUSDT = artifacts.require('MockUSDT');
const MockWETH = artifacts.require('MockWETH');

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([deployToken(deployer, network, accounts)])
}

module.exports = migration

// ============ Deploy Functions ============

async function deployToken(deployer, network, accounts) {
  await deployer.deploy(GameStopToken);

  if (!['mainnet', 'mainnet-fork'].includes(network)) {
    const dai = await deployer.deploy(MockDai);
    console.log(`MockDAI address: ${dai.address}`);
    // const usdt = await deployer.deploy(MockUSDT);
    // console.log(`MockUSDT address: ${usdt.address}`);
    const weth = await deployer.deploy(MockWETH);
    console.log(`MockWETH address: ${weth.address}`);
  }
}

const knownContracts = require('./known-contracts');

const GameStopToken = artifacts.require('GameStopToken');
const MockWETH = artifacts.require('MockWETH');
const UniswapUtils = artifacts.require('UniswapUtils');
const IERC20 = artifacts.require('IERC20');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapV2Router02 = artifacts.require('UniswapV2Router02');

async function migration(deployer, network_, accounts) {
  let uniswap, uniswapRouter;
  const network = network_ === 'mainnet-fork' ? 'mainnet' : network_
  if (['dev'].includes(network)) {
    console.log('Deploying uniswap on dev network.');
    await deployer.deploy(UniswapV2Factory, accounts[0]);
    uniswap = await UniswapV2Factory.deployed();

    await deployer.deploy(UniswapV2Router02, uniswap.address, accounts[0]);
    uniswapRouter = await UniswapV2Router02.deployed();
  } else {
    uniswap = await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]);
    uniswapRouter = await UniswapV2Router02.at(knownContracts.UniswapV2Router02[network]);
  }

  const weth = network === 'mainnet'
    ? await IERC20.at(knownContracts.WETH[network]) // important change to USDT
    : await MockWETH.deployed();

  const gmeToken = await GameStopToken.deployed()

  await uniswap.createPair(gmeToken.address, weth.address)

  await deployer.deploy(UniswapUtils);
}

module.exports = migration;

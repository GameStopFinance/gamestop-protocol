const knownContracts = require('./known-contracts');
const { POOL_START_DATE } = require('./pools');

const GameStopToken = artifacts.require('GameStopToken');
const UniswapUtils = artifacts.require('UniswapUtils');
const MockWETH = artifacts.require('MockWETH');
const IERC20 = artifacts.require('IERC20');

const ETHGMELPTokenSharePool = artifacts.require('ETHGMELPTokenSharePool')

const UniswapV2Factory = artifacts.require('UniswapV2Factory');

module.exports = async (deployer, network_, accounts) => {
  const network = network_ === 'mainnet-fork' ? 'mainnet' : network_
  const uniswapFactory = ['dev'].includes(network)
    ? await UniswapV2Factory.deployed()
    : await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network]);
  const weth = network === 'mainnet'
    ? await IERC20.at(knownContracts.WETH[network])
    : await MockWETH.deployed();

  const uniswapUtils = await UniswapUtils.deployed();

  const eth_gme_lpt = await uniswapUtils.pairFor(uniswapFactory.address, GameStopToken.address, weth.address);

  await deployer.deploy(ETHGMELPTokenSharePool, GameStopToken.address, eth_gme_lpt, POOL_START_DATE);
};

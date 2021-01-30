const fs = require('fs');
const path = require('path');
const util = require('util');

const GameStopToken = artifacts.require('GameStopToken');
const MockWETH = artifacts.require('MockWETH');
const knownContracts = require('./known-contracts');
const UniswapV2Factory = artifacts.require('UniswapV2Factory');
const UniswapUtils = artifacts.require('UniswapUtils');

const writeFile = util.promisify(fs.writeFile);

function distributionPoolContracts() {
    return fs.readdirSync(path.resolve(__dirname, '../contracts/distribution'))
      .filter(filename => filename.endsWith('Pool.sol'))
      .map(filename => filename.replace('.sol', ''));
}

// Deployment and ABI will be generated for contracts listed on here.
const exportedContracts = [
  'GameStopToken',
  ...distributionPoolContracts(),
];

module.exports = async (deployer, network_, accounts) => {
  const deployments = {};
  const network = network_ === 'mainnet-fork' ? 'mainnet' : network_

  if (['dev', 'rinkeby'].includes(network)) {
    exportedContracts.push('MockDai', 'MockWETH')
  }

  const uniswapUtils = await UniswapUtils.deployed();
  
  const uniswapFactory = network === 'dev' ? await UniswapV2Factory.deployed() : await UniswapV2Factory.at(knownContracts.UniswapV2Factory[network])
  const wethAddress = network === 'dev' ? MockWETH.address : knownContracts.WETH[network]

  const ETHGMELPTokenAddress = await uniswapUtils.pairFor(uniswapFactory.address, GameStopToken.address, wethAddress);

  deployments.ETHGMELPToken = {
    address: ETHGMELPTokenAddress
  }

  for (const name of exportedContracts) {
    const contract = artifacts.require(name);
    deployments[name] = {
      address: contract.address,
      abi: contract.abi,
    };
  }

  const deploymentPath = path.resolve(__dirname, `../build/deployments.${network}.json`);
  await writeFile(deploymentPath, JSON.stringify(deployments, null, 2));

  console.log(`Exported deployments into ${deploymentPath}`);
};

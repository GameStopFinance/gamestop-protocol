// https://docs.basis.cash/mechanisms/yield-farming
const INITIAL_GME_FOR_POOLS = 300000;
const INITIAL_GME_FOR_LP = 200000;

// const POOL_START_DATE = Date.parse('2020-11-30T00:00:00Z') / 1000;
const POOL_START_DATE = process.env.START_NOW ? Math.round(Date.now() / 1000) + 3600 : Date.parse('2021-01-31T04:00:00Z') / 1000;

const stakingPools = [
  { contractName: 'GMEYFIPool', token: 'YFI' },
  { contractName: 'GMELINKPool', token: 'LINK' },
  { contractName: 'GMECREAMPool', token: 'CREAM' },
  { contractName: 'GMErenDOGEPool', token: 'renDOGE' },
  { contractName: 'GMEUSDTPool', token: 'USDT' },
  { contractName: 'GMEBUSDPool', token: 'BUSD' },
  { contractName: 'GMEUSDCPool', token: 'USDC' },
  { contractName: 'GMECRVPool', token: 'CRV' },
  { contractName: 'GMECOMPPool', token: 'COMP' },
  { contractName: 'GMESUSHIPool', token: 'SUSHI' },
  { contractName: 'GMEBADGERPool', token: 'BADGER' },
  { contractName: 'GMEDSDPool', token: 'DSD' },
  { contractName: 'GMEESDPool', token: 'ESD' },
  { contractName: 'GMEFRAXPool', token: 'FRAX' },
  { contractName: 'GMEMICPool', token: 'MIC' },
  { contractName: 'GMEOGNPool', token: 'OGN' },
  { contractName: 'GMEOUSDPool', token: 'OUSD' },
  { contractName: 'GMECVPPool', token: 'CVP' },
  { contractName: 'GMEALBTPool', token: 'ALBT' },
  { contractName: 'GMESPDRPool', token: 'SPDR' },
];

const lpPools = {
  ETHGME: { contractName: 'ETHGMELPTokenSharePool', token: 'ETH_GME-UNI-LPv2' },
}

module.exports = {
  POOL_START_DATE,
  INITIAL_GME_FOR_POOLS,
  INITIAL_GME_FOR_LP,
  stakingPools,
  lpPools,
};

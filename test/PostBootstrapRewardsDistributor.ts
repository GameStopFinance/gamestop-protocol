import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { solidity } from 'ethereum-waffle';
import { Contract, ContractFactory, BigNumber, utils } from 'ethers';
import { Provider } from '@ethersproject/providers';

import { advanceTimeAndBlock } from './shared/utilities';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signer-with-address';
import { ParamType } from 'ethers/lib/utils';

chai.use(solidity);

const HOUR = 3600;
const DAY = 86400;
const ETH = utils.parseEther('1');
const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

async function latestBlocktime(provider: Provider): Promise<number> {
  const { timestamp } = await provider.getBlock('latest');
  return timestamp;
}

const waitForTimelock = async () => {
  const { provider } = ethers;
  const eta = (await latestBlocktime(provider)) + 12 * HOUR
  await advanceTimeAndBlock(
    provider,
    eta - (await latestBlocktime(provider))
  );

}
describe('PostBootstrapRewardsDistributor', () => {
  const { provider } = ethers;

  let operator: SignerWithAddress;
  let unknownSigner: SignerWithAddress;

  before('setup accounts', async () => {
    [operator, unknownSigner] = await ethers.getSigners();
  });

  let GMEToken: ContractFactory;
  let Distributor: ContractFactory;
  let MockStakingPool: ContractFactory;
  let MockLPPool: ContractFactory;
  let MockDai: ContractFactory;

  before('fetch contract factories', async () => {
    GMEToken = await ethers.getContractFactory('GameStopToken');
    Distributor = await ethers.getContractFactory('PostBootstrapRewardsDistributor');
    MockDai = await ethers.getContractFactory('MockDai');
    MockStakingPool = await ethers.getContractFactory('MockStakingPool');
    MockLPPool = await ethers.getContractFactory('MockLPPool');
  });

  let gmeToken: Contract;
  let distributor: Contract;
  let mockDai: Contract;
  let stakingPool: Contract;
  let lpPool: Contract;

  beforeEach('deploy contracts', async () => {
    gmeToken = await GMEToken.connect(operator).deploy();
    distributor = await Distributor.connect(operator).deploy(
      gmeToken.address
    );
    mockDai = await MockDai.connect(operator).deploy();
    stakingPool = await MockStakingPool.connect(operator).deploy(
      gmeToken.address,
      mockDai.address,
      (await latestBlocktime(provider)) + DAY,
      7 * DAY
    );
    lpPool = await MockLPPool.connect(operator).deploy(
      gmeToken.address,
      mockDai.address,
      (await latestBlocktime(provider)) + DAY,
      7 * DAY
    );

    await stakingPool.setRewardDistribution(distributor.address)
    await lpPool.setRewardDistribution(distributor.address)

    gmeToken.connect(operator).mint(distributor.address, ETH.mul(500000))
  });

  it('should allow rewards to be distributed', async () => {
    // 1. Propose
    await distributor.connect(operator).propose(
      stakingPool.address,
      lpPool.address
    )
    expect(await distributor.nextStakingPool()).to.equal(stakingPool.address)
    expect(await distributor.nextLPPool()).to.equal(lpPool.address)

    // 2. Wait for timelock to elapse
    await waitForTimelock()

    // 3. Update pool address
    await distributor.connect(operator).execute()

    // 4. Verify
    expect(await distributor.stakingPool()).to.equal(stakingPool.address)
    expect(await distributor.lpPool()).to.equal(lpPool.address)

    // 5. Distribute
    await distributor.connect(operator).distribute()

    // 6. Verify balance
    const distBal = parseFloat(utils.formatEther(await gmeToken.balanceOf(distributor.address)))
    const spBal = parseFloat(utils.formatEther(await gmeToken.balanceOf(stakingPool.address)))
    const lpBal = parseFloat(utils.formatEther(await gmeToken.balanceOf(lpPool.address)))
    expect(distBal).to.equal(437500)
    expect(spBal).to.equal(37500)
    expect(lpBal).to.equal(25000)
  })

  it('should revert if called before timelock', async () => {
    await distributor.connect(operator).propose(
      stakingPool.address,
      lpPool.address
    )
    expect(await distributor.nextStakingPool()).to.equal(stakingPool.address)
    expect(await distributor.nextLPPool()).to.equal(lpPool.address)
    await expect(
      distributor.connect(operator).execute()
    ).to.be.revertedWith(`Timelock hasn't elapsed`)
  })

  it('should revert if no change in address', async () => {
    await distributor.connect(operator).propose(
      ZERO_ADDR,
      ZERO_ADDR
    )

    await waitForTimelock()

    await expect(
      distributor.connect(operator).execute()
    ).to.be.revertedWith(`No next staking pool set`)
  })

  it('should revert if staking pool has already started or lasts longer than 7 days', async () => {
    const setup = async (starttime: number, duration: number, PoolContract: ContractFactory) => {
      const invalidPool = await PoolContract.connect(operator).deploy(
        gmeToken.address,
        mockDai.address,
        starttime,
        duration
      )

      const correctPool = await (PoolContract == MockLPPool ? MockStakingPool : MockLPPool).connect(operator).deploy(
        gmeToken.address,
        mockDai.address,
        (await latestBlocktime(provider)) + DAY,
        7 * DAY
      )

      await distributor.connect(operator).propose(
        PoolContract == MockStakingPool ? invalidPool.address : correctPool.address,
        PoolContract == MockLPPool ? invalidPool.address : correctPool.address
      )

      await waitForTimelock()

      await distributor.connect(operator).execute()

      return distributor.connect(operator).distribute()
    }

    await expect(
      setup(
        (await latestBlocktime(provider)),
        7 * DAY,
        MockStakingPool
      )
    ).to.be.revertedWith('Invalid staking pool')

    await expect(
      setup(
        (await latestBlocktime(provider)) + DAY,
        8 * DAY,
        MockStakingPool
      )
    ).to.be.revertedWith('Invalid staking pool')

    await expect(
      setup(
        (await latestBlocktime(provider)),
        7 * DAY,
        MockLPPool
      )
    ).to.be.revertedWith('Invalid LP pool')

    await expect(
      setup(
        (await latestBlocktime(provider)) + DAY,
        8 * DAY,
        MockLPPool
      )
    ).to.be.revertedWith('Invalid LP pool')

  })
});

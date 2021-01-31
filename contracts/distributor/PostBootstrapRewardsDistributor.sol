pragma solidity ^0.6.0;


import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '../interfaces/IDistributor.sol';
import '../interfaces/IPostBootstrapRewardDistributionRecipient.sol';

import '@openzeppelin/contracts/access/Ownable.sol';

contract PostBootstrapRewardsDistributor is IDistributor, Ownable {
    using SafeMath for uint256;

    event Distributed(address pool, uint256 gmeAmount);
    event NewLPPoolProposed(address LPPool);
    event LPPoolChanged(address LPPool);

    IERC20 public gme;
    IPostBootstrapRewardDistributionRecipient[] public pools;

    // 8 farming weeks after bootstrap
    // (500000 GME / 8) * 0.6
    uint256 public rewardsPerPoolPerWeek = 37500 ether;
    // (500000 GME / 8) * 0.4
    uint256 public lpPoolRewardsPerWeek = 25000 ether;

    uint256 public lpPoolTimelock = 12 hours;
    IPostBootstrapRewardDistributionRecipient public lpPool;
    IPostBootstrapRewardDistributionRecipient public nextLPPool;
    uint256 public lastProposalTime;

    constructor(
        IERC20 _gme,
        IPostBootstrapRewardDistributionRecipient[] memory _pools,
        IPostBootstrapRewardDistributionRecipient _lpPool
    ) public {
        require(_pools.length != 0, 'a list of GME pools are required');

        gme = _gme;
        pools = _pools;
        lpPool = _lpPool;
        nextLPPool = _lpPool;
    }

    function proposeNextLPPool(IPostBootstrapRewardDistributionRecipient lpPool_) public onlyOwner {
        lastProposalTime = block.timestamp;
        nextLPPool = lpPool_;

        emit NewLPPoolProposed(address(lpPool_));
    }

    function setNextLPPool() public onlyOwner {
        require(block.timestamp > (lastProposalTime + lpPoolTimelock), "Timelock hasn't elapsed");
        require(address(nextLPPool) != address(lpPool), "No next LP pool set");
        lpPool = IPostBootstrapRewardDistributionRecipient(nextLPPool);
        emit LPPoolChanged(address(nextLPPool));
    }

    function distribute() public onlyOwner override {
        require(gme.balanceOf(address(this)) > 0, "Zero balance");

        for (uint256 i = 0; i < pools.length; i++) {
            require(
                block.timestamp > pools[i].starttime(),
                'Pool has not started yet'
            );

            require(
                block.timestamp >= pools[i].periodFinish(),
                'On-going pool'
            );

            gme.transfer(address(pools[i]), rewardsPerPoolPerWeek);
            pools[i].notifyRewardAmount(rewardsPerPoolPerWeek);

            emit Distributed(address(pools[i]), rewardsPerPoolPerWeek);
        }

        // Don't distribute to an pool 2 that has ended
        // A new pool 2 will be deployed every week
        require(
            block.timestamp < lpPool.periodFinish(),
            'Inactive LP pool'
        );

        gme.transfer(address(lpPool), lpPoolRewardsPerWeek);
        lpPool.notifyRewardAmount(lpPoolRewardsPerWeek);

        emit Distributed(address(lpPool), lpPoolRewardsPerWeek);

    }
}

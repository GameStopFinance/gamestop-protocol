pragma solidity ^0.6.0;


import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '../interfaces/IDistributor.sol';
import '../interfaces/IPostBootstrapRewardDistributionRecipient.sol';

import '@openzeppelin/contracts/access/Ownable.sol';

contract PostBootstrapRewardsDistributor is IDistributor, Ownable {
    using SafeMath for uint256;

    event Distributed(address pool, uint256 gmeAmount);

    event Proposed(address stakingPool, address lpPool);
    event Executed(address stakingPool, address lpPool);

    IERC20 public gme;

    // 8 farming weeks after bootstrap
    // (500000 GME / 8) * 0.6
    uint256 public rewardsPerPoolPerWeek = 37500 ether;
    // (500000 GME / 8) * 0.4
    uint256 public lpPoolRewardsPerWeek = 25000 ether;

    uint256 public timelock = 12 hours;

    IPostBootstrapRewardDistributionRecipient public lpPool;
    IPostBootstrapRewardDistributionRecipient public nextLPPool;
    IPostBootstrapRewardDistributionRecipient public stakingPool;
    IPostBootstrapRewardDistributionRecipient public nextStakingPool;

    uint256 public lastProposalTime;

    constructor(
        IERC20 _gme
    ) public {
        gme = _gme;
    }

    function propose(IPostBootstrapRewardDistributionRecipient stakingPool_, IPostBootstrapRewardDistributionRecipient lpPool_) public onlyOwner {
        lastProposalTime = block.timestamp;
        nextLPPool = lpPool_;
        nextStakingPool = stakingPool_;

        emit Proposed(address(stakingPool_), address(lpPool_));
    }

    function execute() public onlyOwner {
        require(block.timestamp > (lastProposalTime + timelock), "Timelock hasn't elapsed");
        require(address(nextStakingPool) != address(stakingPool), "No next staking pool set");
        require(address(nextLPPool) != address(lpPool), "No next LP pool set");
        lpPool = IPostBootstrapRewardDistributionRecipient(nextLPPool);
        stakingPool = IPostBootstrapRewardDistributionRecipient(nextStakingPool);
        emit Executed(address(nextStakingPool), address(nextLPPool));
    }

    function distribute() public onlyOwner override {
        require(gme.balanceOf(address(this)) > 0, "Zero balance");

        // Must be a new pool that starts in future
        // Pool duration must be 7 days
        require(
            block.timestamp < stakingPool.starttime() && 
            stakingPool.DURATION() == 7 days,
            'Invalid staking pool'
        );

        require(
            block.timestamp < lpPool.starttime() && 
            lpPool.DURATION() == 7 days,
            'Invalid LP pool'
        );

        // Distribute to staking pool
        gme.transfer(address(stakingPool), rewardsPerPoolPerWeek);
        stakingPool.notifyRewardAmount(rewardsPerPoolPerWeek);
        emit Distributed(address(stakingPool), rewardsPerPoolPerWeek);

        // Distribute to LP Pool
        gme.transfer(address(lpPool), lpPoolRewardsPerWeek);
        lpPool.notifyRewardAmount(lpPoolRewardsPerWeek);
        emit Distributed(address(lpPool), lpPoolRewardsPerWeek);
    }
}

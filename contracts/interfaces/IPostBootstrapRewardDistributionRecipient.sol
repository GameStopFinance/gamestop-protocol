pragma solidity ^0.6.0;

import '@openzeppelin/contracts/access/Ownable.sol';

abstract contract IPostBootstrapRewardDistributionRecipient is Ownable {
    address public rewardDistribution;
    uint256 public starttime;
    uint256 public periodFinish;

    function notifyRewardAmount(uint256 reward) external virtual;

    modifier onlyRewardDistribution() {
        require(
            _msgSender() == rewardDistribution,
            'Caller is not reward distribution'
        );
        _;
    }

    function setRewardDistribution(address _rewardDistribution)
        external
        virtual
        onlyOwner
    {
        rewardDistribution = _rewardDistribution;
    }
}

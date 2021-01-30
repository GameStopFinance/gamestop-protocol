pragma solidity ^0.6.0;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';

import '../interfaces/IDistributor.sol';
import '../interfaces/IRewardDistributionRecipient.sol';

contract LPRewardsDistributor is IDistributor {
    using SafeMath for uint256;

    event Distributed(address pool, uint256 cashAmount);

    bool public once = true;

    IERC20 public gme;
    IRewardDistributionRecipient public lpPool;
    uint256 public totalInitialBalance;

    constructor(
        IERC20 _gme,
        IRewardDistributionRecipient _lpPool,
        uint256 _totalInitialBalance
    ) public {
        gme = _gme;
        lpPool = _lpPool;
        totalInitialBalance = _totalInitialBalance;
    }

    function distribute() public override {
        require(
            once,
            'LPRewardsDistributor: you cannot run this function twice'
        );

        gme.transfer(address(lpPool), totalInitialBalance);
        lpPool.notifyRewardAmount(totalInitialBalance);
        emit Distributed(address(lpPool), totalInitialBalance);

        once = false;
    }
}

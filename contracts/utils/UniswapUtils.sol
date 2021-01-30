pragma solidity ^0.6.0;

import '../lib/UniswapV2Library.sol';

contract UniswapUtils {
    function pairFor(
        address factory,
        address tokenA,
        address tokenB
    ) external pure returns (address lpt) {
        return UniswapV2Library.pairFor(factory, tokenA, tokenB);
    }
}
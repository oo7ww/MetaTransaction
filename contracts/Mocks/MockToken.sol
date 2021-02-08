pragma solidity ^0.5.0;

import {
    ERC20Detailed
} from "../../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
//import { ERC20Mintable } from "../../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20Mintable.sol";
import "./ERC20withMT.sol";

contract MockToken is ERC20Detailed, ERC20withMT {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _toBeMinted
    ) public ERC20Detailed(_name, _symbol, _decimals) {
        mint(msg.sender, _toBeMinted);
    }
}

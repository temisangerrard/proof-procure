// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {AgreementContract} from "./AgreementContract.sol";

contract ProofProcureFactory {
    address public immutable implementation;
    address public immutable usdc;

    mapping(bytes32 => address) public agreements;
    address[] public allAgreements;

    event AgreementCreated(bytes32 indexed agreementHash, address indexed agreementAddr);

    constructor(address _usdc) {
        require(_usdc != address(0), "Zero USDC address");
        implementation = address(new AgreementContract());
        usdc = _usdc;
    }

    function createAgreement(AgreementContract.AgreementSpec calldata spec) external returns (address) {
        require(agreements[spec.agreementHash] == address(0), "Agreement already exists");

        address clone = Clones.clone(implementation);
        AgreementContract(clone).initialize(spec, usdc);

        agreements[spec.agreementHash] = clone;
        allAgreements.push(clone);

        emit AgreementCreated(spec.agreementHash, clone);
        return clone;
    }

    function getAgreement(bytes32 agreementHash) external view returns (address) {
        return agreements[agreementHash];
    }

    function totalAgreements() external view returns (uint256) {
        return allAgreements.length;
    }
}

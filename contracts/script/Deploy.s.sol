// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ProofProcureFactory.sol";
import "../src/AgreementContract.sol";

contract DeployProofProcure is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // USDC on Base mainnet
        address usdc = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;

        // Deploy the factory
        ProofProcureFactory factory = new ProofProcureFactory(usdc);
        console.log("ProofProcureFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}

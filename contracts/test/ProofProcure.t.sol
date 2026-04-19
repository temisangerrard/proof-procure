// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {AgreementContract} from "../src/AgreementContract.sol";
import {ProofProcureFactory} from "../src/ProofProcureFactory.sol";

/// @dev Minimal mock USDC for testing
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin", "USDC") {}
    function mint(address to, uint256 amount) external { _mint(to, amount); }
}

contract ProofProcureTest is Test {
    MockUSDC usdc;
    ProofProcureFactory factory;

    address buyer = makeAddr("buyer");
    address supplier = makeAddr("supplier");
    address stranger = makeAddr("stranger");

    uint256 constant TOTAL = 1000e6; // 1000 USDC (6 decimals)
    uint256 constant CONFIRMATION_WINDOW = 3 days;
    bytes32 constant HASH = keccak256("agreement-1");

    function _defaultSpec() internal view returns (AgreementContract.AgreementSpec memory) {
        return AgreementContract.AgreementSpec({
            buyer: buyer,
            supplier: supplier,
            item: "Office Supplies",
            quantity: 100,
            pricePerUnit: 10e6,
            totalAmount: TOTAL,
            deliveryDeadline: block.timestamp + 30 days,
            confirmationWindow: CONFIRMATION_WINDOW,
            confirmationType: AgreementContract.ConfirmationType.BUYER_CONFIRMATION,
            agreementHash: HASH,
            expiryTimestamp: block.timestamp + 60 days
        });
    }

    function setUp() public {
        usdc = new MockUSDC();
        factory = new ProofProcureFactory(address(usdc));
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    function _createAndFund() internal returns (AgreementContract) {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        usdc.mint(buyer, TOTAL);
        vm.startPrank(buyer);
        usdc.approve(addr, TOTAL);
        agreement.fund();
        vm.stopPrank();

        return agreement;
    }

    function _createFundAndDeliver() internal returns (AgreementContract) {
        AgreementContract agreement = _createAndFund();
        vm.prank(supplier);
        agreement.markDelivered();
        return agreement;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TASK-04: Happy Path Tests
    // ═══════════════════════════════════════════════════════════════════════

    function test_factoryDeploysClone() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);

        assertEq(factory.getAgreement(HASH), addr);
        assertEq(factory.totalAgreements(), 1);

        AgreementContract agreement = AgreementContract(addr);
        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.DEPLOYED));
    }

    function test_happyPath_buyerApproves() public {
        AgreementContract agreement = _createFundAndDeliver();

        vm.prank(buyer);
        agreement.approve();

        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.COMPLETED));
        assertEq(usdc.balanceOf(supplier), TOTAL);
        assertEq(usdc.balanceOf(address(agreement)), 0);
    }

    function test_fund_emitsEvent() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        usdc.mint(buyer, TOTAL);
        vm.startPrank(buyer);
        usdc.approve(addr, TOTAL);

        vm.expectEmit(true, false, false, true);
        emit AgreementContract.AgreementFunded(HASH, TOTAL);
        agreement.fund();
        vm.stopPrank();

        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.FUNDED));
    }

    function test_markDelivered_emitsEvent() public {
        AgreementContract agreement = _createAndFund();

        vm.expectEmit(true, false, false, true);
        emit AgreementContract.DeliveryMarked(HASH, block.timestamp);

        vm.prank(supplier);
        agreement.markDelivered();

        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.DELIVERED_PENDING_CONFIRMATION));
        assertGt(agreement.deliveredAt(), 0);
    }

    function test_approve_emitsPaymentReleased() public {
        AgreementContract agreement = _createFundAndDeliver();

        vm.expectEmit(true, false, false, true);
        emit AgreementContract.PaymentReleased(HASH, supplier, TOTAL, "buyer_approved");

        vm.prank(buyer);
        agreement.approve();
    }

    function test_getSpec_returnsCorrectData() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        AgreementContract.AgreementSpec memory stored = agreement.getSpec();
        assertEq(stored.buyer, buyer);
        assertEq(stored.supplier, supplier);
        assertEq(stored.totalAmount, TOTAL);
        assertEq(stored.agreementHash, HASH);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TASK-05: Timeout Enforcement Tests (100% onchain)
    // ═══════════════════════════════════════════════════════════════════════

    function test_timeout_autoReleasesAfterWindow() public {
        AgreementContract agreement = _createFundAndDeliver();

        // Advance past confirmation window
        vm.warp(block.timestamp + CONFIRMATION_WINDOW + 1);

        // Anyone can call checkTimeout
        vm.prank(stranger);
        agreement.checkTimeout();

        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.COMPLETED));
        assertEq(usdc.balanceOf(supplier), TOTAL);
    }

    function test_timeout_emitsCorrectEvent() public {
        AgreementContract agreement = _createFundAndDeliver();
        vm.warp(block.timestamp + CONFIRMATION_WINDOW + 1);

        vm.expectEmit(true, false, false, true);
        emit AgreementContract.PaymentReleased(HASH, supplier, TOTAL, "timeout");

        agreement.checkTimeout();
    }

    function test_timeout_revertsBeforeWindowElapsed() public {
        AgreementContract agreement = _createFundAndDeliver();

        // Still within window
        vm.warp(block.timestamp + CONFIRMATION_WINDOW - 1);

        vm.expectRevert("Window still open");
        agreement.checkTimeout();
    }

    function test_timeout_buyerCannotBlockPayment() public {
        AgreementContract agreement = _createFundAndDeliver();

        // Buyer does nothing. Time passes.
        vm.warp(block.timestamp + CONFIRMATION_WINDOW + 1);

        // Supplier (or anyone) triggers timeout
        vm.prank(supplier);
        agreement.checkTimeout();

        assertEq(usdc.balanceOf(supplier), TOTAL);
        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.COMPLETED));
    }

    function test_timeout_exactBoundary() public {
        AgreementContract agreement = _createFundAndDeliver();

        // Exactly at window boundary — should still revert (need to be strictly past)
        vm.warp(agreement.deliveredAt() + CONFIRMATION_WINDOW);
        vm.expectRevert("Window still open");
        agreement.checkTimeout();

        // One second past — should succeed
        vm.warp(agreement.deliveredAt() + CONFIRMATION_WINDOW + 1);
        agreement.checkTimeout();
        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.COMPLETED));
    }

    function test_timeoutReached_viewHelper() public {
        AgreementContract agreement = _createFundAndDeliver();

        assertFalse(agreement.timeoutReached());

        vm.warp(block.timestamp + CONFIRMATION_WINDOW + 1);
        assertTrue(agreement.timeoutReached());
    }

    function test_buyerCanApproveBeforeTimeout() public {
        AgreementContract agreement = _createFundAndDeliver();

        // Buyer approves within window — immediate release
        vm.prank(buyer);
        agreement.approve();

        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.COMPLETED));
        assertEq(usdc.balanceOf(supplier), TOTAL);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TASK-06: Edge Case Tests
    // ═══════════════════════════════════════════════════════════════════════

    // ── Rejection Flow ───────────────────────────────────────────────────

    function test_reject_movesToExpired() public {
        AgreementContract agreement = _createFundAndDeliver();

        vm.prank(buyer);
        agreement.reject();

        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.EXPIRED));
    }

    function test_reject_thenRefund() public {
        AgreementContract agreement = _createFundAndDeliver();

        vm.prank(buyer);
        agreement.reject();

        vm.prank(buyer);
        agreement.claimRefund();

        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.REFUNDED));
        assertEq(usdc.balanceOf(buyer), TOTAL);
        assertEq(usdc.balanceOf(address(agreement)), 0);
    }

    function test_reject_revertsAfterConfirmationWindow() public {
        AgreementContract agreement = _createFundAndDeliver();

        vm.warp(block.timestamp + CONFIRMATION_WINDOW + 1);

        vm.prank(buyer);
        vm.expectRevert("Confirmation window passed");
        agreement.reject();
    }

    // ── Expiry + Refund ──────────────────────────────────────────────────

    function test_expire_fundedButNeverDelivered() public {
        AgreementContract agreement = _createAndFund();

        // Warp past expiry
        AgreementContract.AgreementSpec memory s = agreement.getSpec();
        vm.warp(s.expiryTimestamp);

        agreement.expire();
        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.EXPIRED));

        vm.prank(buyer);
        agreement.claimRefund();
        assertEq(usdc.balanceOf(buyer), TOTAL);
        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.REFUNDED));
    }

    function test_expire_deployedButNeverFunded() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        vm.warp(s.expiryTimestamp);
        agreement.expire();
        assertEq(uint256(agreement.state()), uint256(AgreementContract.State.EXPIRED));
    }

    function test_expire_revertsBeforeExpiry() public {
        AgreementContract agreement = _createAndFund();

        vm.expectRevert("Not yet expired");
        agreement.expire();
    }

    function test_expire_cannotExpireDeliveredPending() public {
        AgreementContract agreement = _createFundAndDeliver();

        AgreementContract.AgreementSpec memory s = agreement.getSpec();
        vm.warp(s.expiryTimestamp);

        vm.expectRevert("Cannot expire in current state");
        agreement.expire();
    }

    // ── Double Payment Prevention ────────────────────────────────────────

    function test_doubleFund_reverts() public {
        AgreementContract agreement = _createAndFund();

        usdc.mint(buyer, TOTAL);
        vm.startPrank(buyer);
        usdc.approve(address(agreement), TOTAL);
        vm.expectRevert("Invalid state");
        agreement.fund();
        vm.stopPrank();
    }

    function test_doubleApprove_reverts() public {
        AgreementContract agreement = _createFundAndDeliver();

        vm.prank(buyer);
        agreement.approve();

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        agreement.approve();
    }

    function test_doubleTimeout_reverts() public {
        AgreementContract agreement = _createFundAndDeliver();
        vm.warp(block.timestamp + CONFIRMATION_WINDOW + 1);

        agreement.checkTimeout();

        vm.expectRevert("Invalid state");
        agreement.checkTimeout();
    }

    function test_doubleRefund_reverts() public {
        AgreementContract agreement = _createFundAndDeliver();
        vm.prank(buyer);
        agreement.reject();

        vm.prank(buyer);
        agreement.claimRefund();

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        agreement.claimRefund();
    }

    // ── Unauthorized Caller Rejection ────────────────────────────────────

    function test_fund_onlyBuyer() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        usdc.mint(stranger, TOTAL);
        vm.startPrank(stranger);
        usdc.approve(addr, TOTAL);
        vm.expectRevert("Only buyer");
        agreement.fund();
        vm.stopPrank();
    }

    function test_markDelivered_onlySupplier() public {
        AgreementContract agreement = _createAndFund();

        vm.prank(buyer);
        vm.expectRevert("Only supplier");
        agreement.markDelivered();
    }

    function test_approve_onlyBuyer() public {
        AgreementContract agreement = _createFundAndDeliver();

        vm.prank(supplier);
        vm.expectRevert("Only buyer");
        agreement.approve();
    }

    function test_reject_onlyBuyer() public {
        AgreementContract agreement = _createFundAndDeliver();

        vm.prank(supplier);
        vm.expectRevert("Only buyer");
        agreement.reject();
    }

    function test_claimRefund_onlyBuyer() public {
        AgreementContract agreement = _createFundAndDeliver();
        vm.prank(buyer);
        agreement.reject();

        vm.prank(supplier);
        vm.expectRevert("Only buyer");
        agreement.claimRefund();
    }

    // ── Functions Called Out of Order ─────────────────────────────────────

    function test_markDelivered_beforeFunding_reverts() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        vm.prank(supplier);
        vm.expectRevert("Invalid state");
        agreement.markDelivered();
    }

    function test_approve_beforeDelivery_reverts() public {
        AgreementContract agreement = _createAndFund();

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        agreement.approve();
    }

    function test_checkTimeout_beforeDelivery_reverts() public {
        AgreementContract agreement = _createAndFund();

        vm.expectRevert("Invalid state");
        agreement.checkTimeout();
    }

    function test_claimRefund_onFunded_reverts() public {
        AgreementContract agreement = _createAndFund();

        vm.prank(buyer);
        vm.expectRevert("Invalid state");
        agreement.claimRefund();
    }

    function test_fund_afterExpiry_reverts() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        vm.warp(s.expiryTimestamp + 1);

        usdc.mint(buyer, TOTAL);
        vm.startPrank(buyer);
        usdc.approve(addr, TOTAL);
        vm.expectRevert("Agreement expired");
        agreement.fund();
        vm.stopPrank();
    }

    function test_markDelivered_pastDeadline_reverts() public {
        AgreementContract agreement = _createAndFund();
        AgreementContract.AgreementSpec memory s = agreement.getSpec();

        vm.warp(s.deliveryDeadline + 1);

        vm.prank(supplier);
        vm.expectRevert("Past delivery deadline");
        agreement.markDelivered();
    }

    // ── Initialization Edge Cases ────────────────────────────────────────

    function test_doubleInitialize_reverts() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        vm.expectRevert("Already initialized");
        agreement.initialize(s, address(usdc));
    }

    function test_initialize_zeroAddress_reverts() public {
        AgreementContract impl = new AgreementContract();
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        s.buyer = address(0);

        vm.expectRevert("Zero address");
        impl.initialize(s, address(usdc));
    }

    function test_initialize_zeroAmount_reverts() public {
        AgreementContract impl = new AgreementContract();
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        s.totalAmount = 0;

        vm.expectRevert("Zero amount");
        impl.initialize(s, address(usdc));
    }

    function test_initialize_zeroConfirmationWindow_reverts() public {
        AgreementContract impl = new AgreementContract();
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        s.confirmationWindow = 0;

        vm.expectRevert("Zero confirmation window");
        impl.initialize(s, address(usdc));
    }

    function test_initialize_pastExpiry_reverts() public {
        AgreementContract impl = new AgreementContract();
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        s.expiryTimestamp = block.timestamp - 1;

        vm.expectRevert("Already expired");
        impl.initialize(s, address(usdc));
    }

    function test_initialize_zeroHash_reverts() public {
        AgreementContract impl = new AgreementContract();
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        s.agreementHash = bytes32(0);

        vm.expectRevert("Zero hash");
        impl.initialize(s, address(usdc));
    }

    // ── Factory Edge Cases ───────────────────────────────────────────────

    function test_factory_duplicateHash_reverts() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        factory.createAgreement(s);

        vm.expectRevert("Agreement already exists");
        factory.createAgreement(s);
    }

    function test_factory_multipleAgreements() public {
        AgreementContract.AgreementSpec memory s1 = _defaultSpec();
        factory.createAgreement(s1);

        AgreementContract.AgreementSpec memory s2 = _defaultSpec();
        s2.agreementHash = keccak256("agreement-2");
        factory.createAgreement(s2);

        assertEq(factory.totalAgreements(), 2);
        assertTrue(factory.getAgreement(s1.agreementHash) != factory.getAgreement(s2.agreementHash));
    }

    function test_factory_zeroUSDC_reverts() public {
        vm.expectRevert("Zero USDC address");
        new ProofProcureFactory(address(0));
    }

    // ── Refund with zero balance ─────────────────────────────────────────

    function test_claimRefund_noBalance_reverts() public {
        AgreementContract.AgreementSpec memory s = _defaultSpec();
        address addr = factory.createAgreement(s);
        AgreementContract agreement = AgreementContract(addr);

        // Expire without funding
        vm.warp(s.expiryTimestamp);
        agreement.expire();

        vm.prank(buyer);
        vm.expectRevert("Nothing to refund");
        agreement.claimRefund();
    }
}

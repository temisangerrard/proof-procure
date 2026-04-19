// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgreementContract is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Types ────────────────────────────────────────────────────────────

    enum State {
        DRAFT,
        PROPOSED,
        RATIFIED,
        DEPLOYED,
        FUNDED,
        DELIVERED_PENDING_CONFIRMATION,
        COMPLETED,
        EXPIRED,
        REFUNDED
    }

    enum ConfirmationType {
        BUYER_CONFIRMATION,
        SHIPPING_CONFIRMATION,
        RECEIPT_UPLOAD
    }

    struct AgreementSpec {
        address buyer;
        address supplier;
        string item;
        uint256 quantity;
        uint256 pricePerUnit;
        uint256 totalAmount;
        uint256 deliveryDeadline;
        uint256 confirmationWindow; // seconds after delivery marking
        ConfirmationType confirmationType;
        bytes32 agreementHash;
        uint256 expiryTimestamp;
    }

    // ── Events ───────────────────────────────────────────────────────────

    event AgreementDeployed(bytes32 indexed agreementHash, address indexed contractAddr);
    event AgreementFunded(bytes32 indexed agreementHash, uint256 amount);
    event DeliveryMarked(bytes32 indexed agreementHash, uint256 timestamp);
    event PaymentReleased(bytes32 indexed agreementHash, address to, uint256 amount, string reason);
    event PaymentRejected(bytes32 indexed agreementHash);
    event AgreementExpired(bytes32 indexed agreementHash);
    event RefundIssued(bytes32 indexed agreementHash, address to, uint256 amount);

    // ── Storage ──────────────────────────────────────────────────────────

    AgreementSpec public spec;
    State public state;
    IERC20 public usdc;
    uint256 public deliveredAt;
    bool public initialized;

    // ── Modifiers ────────────────────────────────────────────────────────

    modifier onlyBuyer() {
        require(msg.sender == spec.buyer, "Only buyer");
        _;
    }

    modifier onlySupplier() {
        require(msg.sender == spec.supplier, "Only supplier");
        _;
    }

    modifier inState(State _state) {
        require(state == _state, "Invalid state");
        _;
    }

    // ── Initialization (proxy pattern — called once) ─────────────────────

    function initialize(AgreementSpec calldata _spec, address _usdc) external {
        require(!initialized, "Already initialized");
        require(_spec.buyer != address(0) && _spec.supplier != address(0), "Zero address");
        require(_spec.totalAmount > 0, "Zero amount");
        require(_spec.confirmationWindow > 0, "Zero confirmation window");
        require(_spec.expiryTimestamp > block.timestamp, "Already expired");
        require(_spec.agreementHash != bytes32(0), "Zero hash");

        initialized = true;
        spec = _spec;
        usdc = IERC20(_usdc);
        state = State.DEPLOYED;

        emit AgreementDeployed(_spec.agreementHash, address(this));
    }

    // ── Core Functions ───────────────────────────────────────────────────

    function fund() external onlyBuyer inState(State.DEPLOYED) nonReentrant {
        require(block.timestamp < spec.expiryTimestamp, "Agreement expired");

        usdc.safeTransferFrom(msg.sender, address(this), spec.totalAmount);
        state = State.FUNDED;

        emit AgreementFunded(spec.agreementHash, spec.totalAmount);
    }

    function markDelivered() external onlySupplier inState(State.FUNDED) nonReentrant {
        require(block.timestamp <= spec.deliveryDeadline, "Past delivery deadline");

        deliveredAt = block.timestamp;
        state = State.DELIVERED_PENDING_CONFIRMATION;

        emit DeliveryMarked(spec.agreementHash, block.timestamp);
    }

    function approve() external onlyBuyer inState(State.DELIVERED_PENDING_CONFIRMATION) nonReentrant {
        state = State.COMPLETED;
        usdc.safeTransfer(spec.supplier, spec.totalAmount);

        emit PaymentReleased(spec.agreementHash, spec.supplier, spec.totalAmount, "buyer_approved");
    }

    function reject() external onlyBuyer inState(State.DELIVERED_PENDING_CONFIRMATION) nonReentrant {
        require(block.timestamp <= deliveredAt + spec.confirmationWindow, "Confirmation window passed");

        // Rejection → expired → refundable (binary outcome per spec: no PAUSED state in V0)
        state = State.EXPIRED;
        emit PaymentRejected(spec.agreementHash);
        emit AgreementExpired(spec.agreementHash);
    }

    /// @notice Anyone can call after confirmation window elapses. 100% onchain enforcement.
    function checkTimeout() external inState(State.DELIVERED_PENDING_CONFIRMATION) nonReentrant {
        require(block.timestamp > deliveredAt + spec.confirmationWindow, "Window still open");

        state = State.COMPLETED;
        usdc.safeTransfer(spec.supplier, spec.totalAmount);

        emit PaymentReleased(spec.agreementHash, spec.supplier, spec.totalAmount, "timeout");
    }

    /// @notice Buyer claims refund after expiry (unfunded or rejected).
    function claimRefund() external onlyBuyer inState(State.EXPIRED) nonReentrant {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "Nothing to refund");

        state = State.REFUNDED;
        usdc.safeTransfer(spec.buyer, balance);

        emit RefundIssued(spec.agreementHash, spec.buyer, balance);
    }

    /// @notice Expire a funded contract that was never delivered by the deadline.
    function expire() external nonReentrant {
        require(
            state == State.FUNDED || state == State.DEPLOYED,
            "Cannot expire in current state"
        );
        require(block.timestamp >= spec.expiryTimestamp, "Not yet expired");

        state = State.EXPIRED;
        emit AgreementExpired(spec.agreementHash);
    }

    // ── View Helpers ─────────────────────────────────────────────────────

    function getSpec() external view returns (AgreementSpec memory) {
        return spec;
    }

    function timeoutReached() external view returns (bool) {
        if (state != State.DELIVERED_PENDING_CONFIRMATION) return false;
        return block.timestamp > deliveredAt + spec.confirmationWindow;
    }
}

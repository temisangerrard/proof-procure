# ProofProcure — Requirements

## 1. Product Definition

ProofProcure is an agent-first, channel-native procurement execution layer that converts informal agreements into enforceable smart contracts on Base mainnet, using programmable payment rules (approval OR timeout) to guarantee settlement without exposing users to crypto.

## 2. Functional Requirements

### FR-01: Channel Ingestion
- System MUST accept unstructured procurement agreements via Telegram bot.
- System MUST accept forwarded emails via Gmail integration.
- System MUST provide a web fallback for direct input.
- All inputs MUST be normalized to a common internal format.

### FR-02: Agreement Extraction
- System MUST use an LLM (Claude) to extract structured agreement data from unstructured input.
- Extraction MUST produce a strict schema (see FR-04).
- System MUST assign a confidence score to each extraction.
- System MUST reject incomplete or low-confidence extractions and prompt for clarification.

### FR-03: Proposal Generation
- System MUST return a structured, editable proposal to the initiating party.
- Proposal MUST highlight any missing or uncertain fields.
- User confirms or edits — never creates from scratch.

### FR-04: Agreement Data Model
Every agreement MUST include:

| Field | Type | Required |
|---|---|---|
| buyer | Party | Yes |
| supplier | Party | Yes |
| item | string | Yes |
| quantity | number | Yes |
| price | number (per unit) | Yes |
| total | number | Yes |
| currency | string (USDC) | Yes |
| delivery_window | time range | Yes |
| confirmation_type | enum | Yes |
| confirmation_window | duration | Yes |
| payment_condition | string | Yes |
| expiry | timestamp | Yes |
| agreement_hash | bytes32 | Yes |

### FR-05: Mutual Ratification
- Both buyer AND supplier MUST explicitly confirm the identical agreement spec.
- System MUST NOT deploy a contract without dual ratification.
- No unilateral deployment permitted.

### FR-06: Smart Contract Deployment
- Contract MUST deploy on Base mainnet.
- Contract MUST escrow USDC.
- Contract MUST use factory + proxy pattern.
- All state transitions MUST emit onchain events.
- Agreement hash MUST be stored onchain.

### FR-07: Funding
- Buyer MUST fund the contract in USDC.
- Wallet creation via Privy embedded/invisible wallets.
- Gas abstraction — user never sees or handles ETH.
- No crypto UX exposed to either party.

### FR-08: Delivery Confirmation
Supplier MUST be able to mark order as delivered, transitioning contract to `DELIVERED_PENDING_CONFIRMATION`.

Confirmation types supported:
- `BUYER_CONFIRMATION`
- `SHIPPING_CONFIRMATION`
- `RECEIPT_UPLOAD`

### FR-09: Payment Release Logic (CRITICAL)
After delivery marking:

1. Buyer CAN approve → payment releases immediately.
2. Buyer CAN reject → contract pauses (manual resolution, V0).
3. If buyer takes NO action within confirmation_window → payment auto-releases to supplier.

**Mandatory rule:** "If the buyer does not act, the contract does."

This logic MUST live entirely in the smart contract. The backend MUST NOT be required for timeout enforcement.

### FR-10: Refund on Expiry
If contract reaches expiry without funding or delivery, funds MUST be refundable to buyer.

### FR-11: Notifications
- System MUST push status updates back to the originating channel (Telegram/email).
- Updates MUST cover: proposal ready, ratification requests, deployment, funding, delivery, payment release, expiry.

### FR-12: Audit Trail
- All state transitions MUST emit onchain events.
- System MUST provide an exportable audit log linking channel messages to onchain state.

## 3. Non-Functional Requirements

### NFR-01: Channel-First
All user interaction happens in existing channels (Telegram, email). Web app is execution surface only.

### NFR-02: Invisible Crypto
Users never see wallet addresses, gas fees, token contracts, or transaction hashes. All crypto operations are abstracted behind Privy.

### NFR-03: Mainnet Only
No testnet deployments. V0 ships on Base mainnet.

### NFR-04: Binary Outcomes
No partial fulfillment. No partial payments. Every contract ends in one of: completed (paid), expired (refunded), or rejected (paused).

### NFR-05: Contract Correctness
Timeout and auto-release logic MUST be verifiable onchain. No reliance on backend for core enforcement.

## 4. State Model

```
DRAFT → PROPOSED → RATIFIED → DEPLOYED → FUNDED → DELIVERED_PENDING_CONFIRMATION → COMPLETED
                                                                      ↓ (reject)
                                                                   PAUSED
                                                                      ↓ (expiry)
                                                                   EXPIRED → REFUNDED
```

Every transition emits an onchain event.

## 5. Business Rules

1. No incomplete agreements proceed to deployment.
2. No unilateral deployment.
3. No payment before delivery confirmation.
4. No double payment.
5. No partial fulfillment.
6. Binary outcomes only.
7. All state transitions emit events.
8. Agreement hash stored onchain.
9. Buyer cannot block payment indefinitely.
10. Timeout must be enforced onchain.

## 6. Constraints (V0)

- Contract type: recurring replenishment POs only.
- Fixed terms, binary fulfillment, binary payment outcome.
- No disputes, no partial payments, no milestones.
- No marketplace, no ERP integration, no sourcing.
- No WhatsApp, no multi-chain, no non-USDC tokens.
- No autonomous agents (human ratification required).
- No AI-based final delivery verification.

## 7. Success Criteria

One real transaction on Base mainnet where:

1. Messy conversation used as input.
2. Structured proposal generated from it.
3. Both parties ratified the agreement.
4. Contract deployed on Base.
5. Buyer funded in USDC.
6. Supplier marked delivered.
7. Buyer approved OR timeout triggered auto-release.
8. Payment released correctly.
9. Full audit trail exists onchain.
10. No crypto UX exposed to either user.

## 8. Out of Scope

- Dispute resolution
- Partial payments
- AI final verification of delivery
- Marketplace features
- ERP integration
- WhatsApp channel
- Multi-chain deployment
- Non-USDC tokens
- Autonomous agent initiation
- Milestone-based contracts

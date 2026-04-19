# ProofProcure — Technical Design

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CHANNEL LAYER                         │
│  Telegram Bot │ Gmail Forwarder │ Web Fallback           │
└──────┬────────────────┬────────────────┬────────────────┘
       │                │                │
       ▼                ▼                ▼
┌─────────────────────────────────────────────────────────┐
│                 NORMALIZATION LAYER                      │
│  Parse channel input → common message format             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 EXTRACTION LAYER                         │
│  Claude API → structured agreement schema                │
│  Confidence scoring │ Reject incomplete                  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 PROPOSAL LAYER                           │
│  Editable agreement │ Missing field highlights           │
│  Shareable link for counterparty                        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               RATIFICATION LAYER                         │
│  Buyer confirms │ Supplier confirms                      │
│  Dual signature → identical spec enforced                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               CONTRACT LAYER                             │
│  Solidity on Base mainnet                                │
│  Factory → Proxy deployment                              │
│  USDC escrow │ Timeout enforcement │ Auto-release        │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               WALLET LAYER                               │
│  Privy embedded wallets                                  │
│  Gas abstraction (paymaster or relayer)                  │
│  Invisible to users                                      │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│               NOTIFICATION LAYER                         │
│  Push updates back to originating channel                │
│  Telegram message │ Email │ In-app                       │
└─────────────────────────────────────────────────────────┘
```

## 2. Smart Contract Design

### 2.1 ContractFactory

Deploys proxy instances per agreement.

```solidity
contract ProofProcureFactory {
    function createAgreement(AgreementSpec calldata spec) external returns (address);
    function getAgreement(bytes32 agreementHash) external view returns (address);
}
```

### 2.2 AgreementContract (per procurement agreement)

#### Storage

```solidity
struct AgreementSpec {
    address buyer;
    address supplier;
    string item;
    uint256 quantity;
    uint256 pricePerUnit;
    uint256 totalAmount;
    uint256 deliveryDeadline;
    uint256 confirmationWindow;  // seconds after delivery marking
    ConfirmationType confirmationType;
    bytes32 agreementHash;
    uint256 expiryTimestamp;
}

enum ConfirmationType { BUYER_CONFIRMATION, SHIPPING_CONFIRMATION, RECEIPT_UPLOAD }
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
```

#### State Transitions

```
DEPLOYED → fund() → FUNDED
FUNDED → markDelivered() [supplier only] → DELIVERED_PENDING_CONFIRMATION
DELIVERED_PENDING_CONFIRMATION → approve() [buyer] → COMPLETED (release payment)
DELIVERED_PENDING_CONFIRMATION → reject() [buyer] → PAUSED
DELIVERED_PENDING_CONFIRMATION → timeout check → COMPLETED (auto-release)
FUNDED/DELIVERED_PENDING_CONFIRMATION → expire() → EXPIRED → REFUNDED
```

#### Core Functions

```solidity
function fund(uint256 amount) external;                    // buyer deposits USDC
function markDelivered(bytes memory proof) external;       // supplier marks delivered
function approve() external;                               // buyer approves release
function reject() external;                                // buyer rejects → pause
function checkTimeout() external;                          // anyone can call after window
function claimRefund() external;                           // buyer claims after expiry
```

#### Payment Release Logic (ONCHAIN — NON-NEGOTIABLE)

```solidity
function checkTimeout() external {
    require(state == State.DELIVERED_PENDING_CONFIRMATION);
    require(block.timestamp > deliveredAt + confirmationWindow);
    state = State.COMPLETED;
    usdc.transfer(spec.supplier, spec.totalAmount);
    emit PaymentReleased(spec.agreementHash, spec.supplier, spec.totalAmount, "timeout");
}
```

The timeout check is callable by anyone (keeper, backend, either party). The contract itself enforces the condition — no backend trust required.

#### Events

```solidity
event AgreementDeployed(bytes32 indexed agreementHash, address indexed contractAddr);
event AgreementFunded(bytes32 indexed agreementHash, uint256 amount);
event DeliveryMarked(bytes32 indexed agreementHash, uint256 timestamp);
event PaymentReleased(bytes32 indexed agreementHash, address to, uint256 amount, string reason);
event PaymentRejected(bytes32 indexed agreementHash);
event AgreementExpired(bytes32 indexed agreementHash);
event RefundIssued(bytes32 indexed agreementHash, address to, uint256 amount);
```

### 2.3 Security Considerations

- Reentrancy guards on all payment functions (OpenZeppelin ReentrancyGuard).
- USDC approval pattern: user approves factory, contract pulls on fund().
- No ETH handling — USDC only.
- Access control: buyer/supplier roles enforced per function.
- Timeout is timestamp-based (Base block.timestamp is sufficiently reliable).
- Agreement hash verified onchain to prevent spec mutation.

## 3. Backend Architecture

### 3.1 Technology

- Node.js (TypeScript)
- Express or Fastify for API
- Bull/BullMQ for job queues
- PostgreSQL for agreement metadata
- Redis for session/cache

### 3.2 API Surface

```
POST   /api/agreements/extract      — submit raw input, get structured extraction
GET    /api/agreements/:id          — get agreement details
PATCH  /api/agreements/:id          — edit proposal before ratification
POST   /api/agreements/:id/ratify   — party confirms (buyer or supplier)
POST   /api/agreements/:id/deploy   — trigger contract deployment (after dual ratification)
POST   /api/agreements/:id/fund     — generate funding link/transaction
POST   /api/agreements/:id/deliver  — supplier marks delivered
GET    /api/agreements/:id/status   — current state + onchain verification
GET    /api/agreements/:id/audit    — export audit trail
```

### 3.3 Extraction Pipeline

```
Raw input (Telegram/email/web)
  → Normalize to text payload
  → Send to Claude with extraction prompt + schema
  → Validate against AgreementData schema
  → Score confidence
  → If confidence < threshold → reject + request clarification
  → If confidence >= threshold → create DRAFT agreement
```

### 3.4 Ratification Flow

```
Buyer confirms proposal
  → Store buyer signature + timestamp
  → Generate supplier confirmation link
  → Notify supplier via channel
Supplier confirms
  → Verify spec matches buyer's confirmed version
  → Both ratified → trigger deployment
```

## 4. Channel Layer Design

### 4.1 Telegram Bot

- Built with grammY or telegraf.
- Receives messages and forwarded conversations.
- Sends structured proposal cards with inline buttons (Confirm / Edit / Reject).
- Pushes status updates at every state transition.

### 4.2 Gmail Ingestion

- Gmail API watch on inbox or label.
- Parse incoming forwarded procurement emails.
- Extract text body (strip signatures, threads).
- Feed into extraction pipeline.

### 4.3 Web Fallback

- Minimal Next.js or static app.
- Text area for pasting conversations.
- Agreement execution surface (view, ratify, fund, confirm delivery).
- NOT a full web app — channel-first.

## 5. Wallet Layer Design

### 5.1 Privy Integration

- Embedded wallets for both buyer and supplier.
- Wallets created on first interaction (email-based or social login).
- Users never see addresses or manage keys directly.

### 5.2 Gas Abstraction

- Use Privy's gas sponsorship or a simple paymaster.
- All gas costs covered by platform (V0).
- User transactions appear as "Confirm" / "Approve" buttons — signing only.

## 6. Database Schema

### agreements table

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| buyer_id | UUID | FK to users |
| supplier_id | UUID | FK to users |
| raw_input | text | Original unstructured input |
| extracted_data | JSONB | Structured agreement fields |
| confidence_score | float | Extraction confidence |
| state | enum | Current agreement state |
| buyer_ratified_at | timestamp | Null until buyer confirms |
| supplier_ratified_at | timestamp | Null until supplier confirms |
| contract_address | text | Null until deployed |
| agreement_hash | text | Keccak256 of canonical spec |
| confirmation_window | integer | Seconds |
| delivery_deadline | timestamp | |
| expiry_timestamp | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

### users table

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | text | |
| telegram_id | text | Nullable |
| privy_did | text | Privy decentralized ID |
| wallet_address | text | Derived from Privy |
| role | enum | buyer / supplier / both |
| created_at | timestamp | |

### audit_events table

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| agreement_id | UUID | FK to agreements |
| event_type | text | State transition name |
| actor | text | Who triggered |
| onchain_tx_hash | text | Nullable until confirmed onchain |
| metadata | JSONB | Event-specific data |
| created_at | timestamp | |

## 7. Notification Design

State transitions trigger notifications to the relevant channel:

| Transition | Notify | Channel |
|---|---|---|
| Proposal generated | Buyer | Origin channel |
| Buyer ratified | Supplier | Email/Telegram |
| Both ratified → deployed | Both | Origin channels |
| Contract funded | Supplier | Origin channel |
| Delivery marked | Buyer | Origin channel |
| Payment released | Both | Origin channels |
| Payment rejected | Both | Origin channels |
| Expired | Both | Origin channels |

## 8. Keeper / Timeout Enforcement

The smart contract's timeout logic is self-contained. However, a backend keeper should periodically call `checkTimeout()` on contracts in `DELIVERED_PENDING_CONFIRMATION` state where the confirmation window has elapsed. This ensures timely execution even if neither party calls it. The contract's own logic prevents double-release.

## 9. File Structure

```
proof-procure/
├── contracts/
│   ├── ProofProcureFactory.sol
│   ├── AgreementContract.sol
│   └── test/
│       ├── AgreementContract.t.sol
│       └── ProofProcureFactory.t.sol
├── backend/
│   ├── src/
│   │   ├── api/
│   │   ├── extraction/
│   │   ├── channels/
│   │   │   ├── telegram/
│   │   │   ├── gmail/
│   │   │   └── web/
│   │   ├── contracts/
│   │   ├── wallet/
│   │   ├── notifications/
│   │   └── db/
│   ├── package.json
│   └── tsconfig.json
├── web/
│   ├── src/
│   │   ├── pages/
│   │   └── components/
│   └── package.json
├── docs/
│   ├── requirements.md
│   ├── design.md
│   └── tasks.md
└── README.md
```

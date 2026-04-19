# ProofProcure — Task Breakdown

Tasks ordered by engineering priority: contract correctness first, then extraction, then UX, then ratification, then funding/settlement, then audit.

---

## Phase 1: Smart Contracts (HIGHEST PRIORITY)

### TASK-01: Set up Solidity project
- Initialize Foundry project in `contracts/`
- Install OpenZeppelin dependencies
- Configure for Base mainnet deployment
- **Deliverable:** Compiling Foundry project with OZ imports

### TASK-02: Implement AgreementContract
- Define `AgreementSpec` struct with all fields from spec
- Implement state enum matching state model
- Implement `fund()` — buyer deposits USDC
- Implement `markDelivered()` — supplier marks delivered, records timestamp
- Implement `approve()` — buyer approves, releases USDC to supplier
- Implement `reject()` — buyer rejects, pauses contract
- Implement `checkTimeout()` — anyone callable, auto-releases after confirmation window
- Implement `claimRefund()` — buyer claims after expiry
- Add ReentrancyGuard on all payment functions
- Emit events on every state transition
- **Deliverable:** Fully functional AgreementContract.sol

### TASK-03: Implement ProofProcureFactory
- Deploy proxy instances of AgreementContract
- Track agreement hash → contract address mapping
- `createAgreement(spec)` → deploy + initialize
- `getAgreement(hash)` → lookup
- **Deliverable:** Factory contract deploying proxy instances

### TASK-04: Contract tests — happy path
- Deploy factory
- Create agreement
- Fund agreement (mock USDC)
- Mark delivered
- Buyer approves
- Verify payment released to supplier
- **Deliverable:** Passing happy path test suite

### TASK-05: Contract tests — timeout enforcement
- Deploy + fund + mark delivered
- Advance time past confirmation window
- Call checkTimeout()
- Verify auto-release to supplier
- Verify buyer CANNOT block after timeout
- **Deliverable:** Passing timeout test suite

### TASK-06: Contract tests — edge cases
- Rejection flow (pause state)
- Expiry + refund
- Double payment prevention
- Reentrancy attack prevention
- Unauthorized caller rejection
- Funding with wrong amount
- Calling functions out of order
- **Deliverable:** Passing edge case test suite

### TASK-07: Deploy contracts to Base mainnet
- Verify contracts on BaseScan
- Save deployed factory address
- Fund deployer wallet with ETH for gas
- **Deliverable:** Live factory contract on Base mainnet

---

## Phase 2: Extraction Layer

### TASK-08: Define extraction schema
- JSON schema for AgreementData matching spec data model
- Validation rules for required fields
- Confidence threshold configuration
- **Deliverable:** Extraction schema + validation module

### TASK-09: Build Claude extraction prompt
- System prompt for procurement agreement extraction
- Strict output format (JSON matching schema)
- Instructions to reject incomplete data
- Few-shot examples from procurement conversations
- **Deliverable:** Tested extraction prompt with >80% accuracy on sample inputs

### TASK-10: Build extraction pipeline
- Accept raw text input
- Send to Claude with extraction prompt
- Parse response against schema
- Score confidence
- Reject or create draft agreement
- Store raw input + extracted data
- **Deliverable:** Working extraction endpoint

---

## Phase 3: Proposal Layer

### TASK-11: Build proposal API
- Create agreement record in DRAFT state
- PATCH endpoint for editing fields
- Highlight missing/uncertain fields in response
- Generate shareable proposal link
- **Deliverable:** Proposal CRUD API

### TASK-12: Build proposal web view
- Minimal page showing structured agreement
- Editable fields for buyer
- Confirm/Reject buttons
- Shareable via link for supplier
- Mobile-friendly (Telegram in-app browser)
- **Deliverable:** Proposal confirmation page

---

## Phase 4: Ratification Layer

### TASK-13: Implement dual ratification
- Buyer ratification endpoint (stores signature + timestamp)
- Supplier ratification endpoint (stores signature + timestamp)
- Spec matching validation (both parties confirmed identical spec)
- Trigger deployment on dual ratification
- **Deliverable:** Ratification flow with spec matching

---

## Phase 5: Contract Integration

### TASK-14: Backend contract interaction
- ABI + contract address configuration
- Deploy agreement via factory from backend
- Fund agreement (trigger USDC transfer)
- Mark delivered (backend calls contract)
- Check/approve/reject (backend relays user action)
- Listen to contract events for state sync
- **Deliverable:** Backend ↔ contract integration layer

### TASK-15: Keeper service for timeout
- Poll contracts in DELIVERED_PENDING_CONFIRMATION state
- Call checkTimeout() when confirmation window elapsed
- Run on interval (every 60 seconds)
- **Deliverable:** Running keeper that auto-releases on timeout

---

## Phase 6: Wallet Layer

### TASK-16: Privy integration
- Set up Privy app for ProofProcure
- Embedded wallet creation on user registration
- Email-based login (no crypto UX)
- Gas sponsorship configuration
- **Deliverable:** Privy wallets creating invisible accounts

### TASK-17: USDC funding flow
- Generate USDC approval + deposit transaction
- Present as simple "Fund Agreement" button
- Abstract gas costs (paymaster or backend-sponsored)
- Confirm onchain funding → update agreement state
- **Deliverable:** Working fund flow with no crypto exposure

---

## Phase 7: Channel Layer — Telegram

### TASK-18: Telegram bot setup
- Create bot via BotFather
- grammY or telegraf framework
- Handle incoming messages + forwarded conversations
- Normalize to text payload
- **Deliverable:** Telegram bot receiving and normalizing messages

### TASK-19: Telegram proposal cards
- Send structured proposal as message with inline keyboard
- Confirm / Edit / Reject buttons
- Deep link to web view for full editing
- **Deliverable:** Interactive proposal cards in Telegram

### TASK-20: Telegram status notifications
- Push state transition updates as Telegram messages
- Links to agreement status page
- **Deliverable:** Notification messages for all state transitions

---

## Phase 8: Channel Layer — Gmail

### TASK-21: Gmail ingestion
- Gmail API watch on inbox/label
- Parse forwarded procurement emails
- Extract body text (strip threads/signatures)
- Feed into extraction pipeline
- **Deliverable:** Gmail forwarding triggering agreement extraction

---

## Phase 9: Web App

### TASK-22: Web app scaffold
- Next.js or minimal React app
- Routes: /agreement/:id, /agreement/:id/ratify, /agreement/:id/status
- Privy auth embedded
- **Deliverable:** Running web app with auth

### TASK-23: Agreement execution pages
- View agreement details
- Ratify (buyer and supplier views)
- Fund agreement (USDC deposit via Privy)
- Mark delivered (supplier)
- Approve/Reject delivery (buyer)
- Status + timeline view
- **Deliverable:** Functional execution surface

---

## Phase 10: Audit + Notifications

### TASK-24: Audit trail
- Record all state transitions in audit_events table
- Link onchain tx hash to each event
- Export endpoint (JSON/CSV)
- **Deliverable:** Queryable audit log with onchain references

### TASK-25: Notification orchestrator
- State transition triggers channel notification
- Route to correct channel per user preference
- Telegram message or email
- **Deliverable:** Notifications firing on all state changes

---

## Phase 11: Integration + End-to-End

### TASK-26: End-to-end test flow
- Submit messy conversation via Telegram
- Verify extraction produces valid proposal
- Buyer confirms via Telegram
- Supplier confirms via link
- Verify contract deployed on Base
- Buyer funds in USDC
- Supplier marks delivered
- Buyer approves OR let timeout trigger
- Verify payment released
- Check audit trail
- **Deliverable:** Passing end-to-end test on mainnet

### TASK-27: One real transaction
- Execute the full flow with real parties
- Real USDC on Base mainnet
- Document the transaction
- Capture screenshots/audit log as proof
- **Deliverable:** Completed real transaction meeting all success criteria

---

## Dependencies

```
TASK-01 → TASK-02 → TASK-03 → TASK-04, TASK-05, TASK-06 → TASK-07
TASK-08, TASK-09 → TASK-10
TASK-10 → TASK-11 → TASK-12
TASK-11 → TASK-13
TASK-07, TASK-13 → TASK-14 → TASK-15
TASK-14 → TASK-16 → TASK-17
TASK-10 → TASK-18 → TASK-19, TASK-20
TASK-10 → TASK-21
TASK-12, TASK-16 → TASK-22 → TASK-23
TASK-14 → TASK-24, TASK-25
ALL → TASK-26 → TASK-27
```

## Parallelization

These can run concurrently:
- Phase 1 (contracts) and Phase 2 (extraction) — independent
- Phase 7 (Telegram) and Phase 8 (Gmail) — independent channels
- Phase 10 (audit) can start once Phase 5 (contract integration) is done

## Critical Path

```
Contracts (TASK-01→07) → Contract Integration (TASK-14) → E2E (TASK-26→27)
Extraction (TASK-08→10) → Proposal (TASK-11→12) → Ratification (TASK-13) → Contract Integration
```

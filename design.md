# Proof Procure - Technical Design

## 1. Architecture Overview

Proof Procure is a stables-powered supplier payment app and procurement operating account with an embedded supplier-obligation and payment-readiness system. Stablecoin infrastructure is part of the funding and settlement backend, while the user-facing model stays simple: money in, people, bills, pay, grow.

```
+--------------------------------------------------------------+
| UX LAYER                                                     |
| Home | Guided Simple Mode | People | Bills | Pay | Grow          |
+-------------------------------+------------------------------+
                                |
                                v
+--------------------------------------------------------------+
| PROCUREMENT ACCOUNT LAYER                                    |
| Balance | Stable dollars | Available to pay                    |
+-------------------------------+------------------------------+
                                |
                                v
+--------------------------------------------------------------+
| SUPPLIER OPERATIONS LAYER                                    |
| People | Bills | Grow balance | Readiness snapshot         |
+---------------+-------------------------------+--------------+
                |                               |
                v                               v
+------------------------------+  +-----------------------------+
| CAPTURE WORKFLOWS            |  | PAYMENT WORKFLOWS           |
| Manual entry                 |  | Add stable dollars          |
| Invoice upload               |  | Initiate supplier payment   |
| Chat/email term capture      |  | Mark paid                   |
| Agreement confirmation       |  | Audit payment status        |
+---------------+--------------+  +--------------+--------------+
                |                                |
                v                                v
+--------------------------------------------------------------+
| SETTLEMENT LAYER                                             |
| Circle/Arc rails | Stablecoin balances | Cross-currency/off-ramp    |
| Guided crypto funding, no gas or trading UX                  |
+--------------------------------------------------------------+
```

The product must make procurement money feel continuously ready for supplier settlement. The implementation uses stables rails, but the primary product concepts are balance, people, bills, pay, and grow.

## 2. Domain Model

### 2.1 ProcurementAccount

Represents the business operating account used for supplier payments.

Core fields:

| Field | Notes |
|---|---|
| id | Account identifier |
| business_id | Owning business |
| settlement_currency | Main display and planning currency |
| available_balance | Procurement funds not reserved |
| reserved_balance | Funds allocated to obligations or reserve categories |
| available_to_allocate | Balance available for new reserves |
| created_at / updated_at | Audit timestamps |

### 2.2 Supplier

Represents a supplier the business pays.

Core fields:

| Field | Notes |
|---|---|
| id | Supplier identifier |
| business_id | Owning business |
| name | Supplier display name |
| country | Supplier country |
| preferred_currency | Currency supplier expects |
| payment_terms | Plain-language payment terms |
| average_invoice_size | Optional planning input |
| notes | Operator notes |

### 2.3 Obligation

Represents a supplier invoice, payment commitment, purchase agreement, or upcoming procurement payment.

Core fields:

| Field | Notes |
|---|---|
| id | Obligation identifier |
| business_id | Owning business |
| supplier_id | Supplier reference |
| amount | Payment amount |
| currency | Obligation currency |
| due_date | Supplier payment due date |
| status | Draft, due soon, ready, short, paid, cancelled |
| priority | Low, normal, high |
| reserved_amount | Funds already reserved |
| funding_gap | Amount still short |
| source | Manual, invoice upload, chat/email capture, agreement |
| source_ref | Optional link to captured agreement or document |

### 2.4 Allocation

Represents funds set aside for a bill or moved into Grow.

Core fields:

| Field | Notes |
|---|---|
| id | Allocation identifier |
| account_id | Procurement account |
| obligation_id | Optional obligation reference |
| category | Bill, freight, inventory, customs, grow, other |
| amount | Allocated amount |
| currency | Reserve currency |
| status | Active, released, applied, cancelled |
| created_by | Human user who confirmed the action |

### 2.5 ReadinessSnapshot

Represents operational liquidity health at a point in time.

Core fields:

| Field | Notes |
|---|---|
| account_id | Procurement account |
| window_days | Usually 7, 14, or 30 |
| total_obligations | Total due in the window |
| reserved_amount | Funds reserved in the window |
| funding_gap | Amount still short |
| readiness_percent | Reserved amount divided by obligations |
| due_this_week_count | Count of near-term obligations |
| underfunded_count | Count of short obligations |

### 2.6 Payment

Represents a supplier payment attempt or completed payment.

Core fields:

| Field | Notes |
|---|---|
| id | Payment identifier |
| obligation_id | Obligation being paid |
| supplier_id | Supplier being paid |
| amount | Payment amount |
| currency | Payment currency |
| status | Draft, confirmed, processing, paid, failed |
| settlement_status | Internal settlement state |
| user_visible_reference | Business-friendly reference |

## 3. Product Layers

### 3.1 Account Layer

The Account Layer owns balance display and allocation state.

Responsibilities:

- show available procurement balance
- show reserved funds
- calculate available to allocate
- prevent over-reservation
- provide account-level audit trail

User-facing labels must avoid wallet language. Use "procurement balance", "reserved", and "available to allocate".

### 3.2 Supplier Layer

The Supplier Layer keeps the supplier record simple and operational.

Responsibilities:

- store supplier details
- show supplier country and preferred currency
- summarize payment terms
- connect suppliers to obligations and payments

Supplier views should help users answer: "Who do I need to pay, when, and how ready am I?"

### 3.3 Obligation Layer

The Obligation Layer tracks money the business expects to pay.

Responsibilities:

- create obligations manually
- create obligations from invoices
- create obligations from captured supplier chats/emails
- show due dates and priority
- compute per-obligation readiness
- show whether each obligation is ready, short, due soon, or paid

### 3.4 Grow Layer

The Grow Layer is represented by the piggybank icon. It is where users see extra money not needed for immediate bills and, later, treasury opportunities.

Responsibilities:

- show money needed for bills versus extra money
- move extra money into Grow
- later present yield, card, and treasury opportunities in simple language
- prevent low-literacy users from seeing DeFi-native controls by default
- audit Grow movements and opportunity selections

Grow actions require human confirmation.

### 3.5 Readiness Layer

The Readiness Layer turns balances and obligations into operational clarity.

Responsibilities:

- calculate readiness percentage for selected windows
- show funding gaps
- detect underfunded obligations
- detect due-soon obligations
- provide simple warnings

Example output:

> 82% of next 14 days supplier obligations are funded.

### 3.6 Guided UX Layer

The Guided UX Layer is required for low-literacy and non-technical traders.

Responsibilities:

- present large status cards
- use icons and colors to support meaning
- minimize text density
- show one next action at a time
- confirm every reserve and payment action
- explain results in plain language

Required simple actions:

- See what needs money
- Put money aside
- Pay supplier
- Mark paid

### 3.7 Settlement Layer

The Settlement Layer integrates Circle/Arc and stablecoin-backed funding, payment, cross-currency, and off-ramp infrastructure.

Responsibilities:

- hold or represent settlement-ready procurement funds
- accept crypto/stables funding as the MVP funding path
- orchestrate supplier payment initiation
- support future cross-currency supplier payout
- support future off-ramp to bank or local rails
- support future crypto-backed business card flows
- update settlement status
- keep gas, transaction hashes, seed phrases, and trading controls out of primary UX
- expose only business-level payment state to the app

Internal implementations may track addresses, transaction hashes, or chain events. Primary UX may show deposit QR/copy details only inside the guided "Add stable dollars" flow.

Arc is the intended settlement chain/rail for implementation. Operator and developer tooling should verify the active chain before settlement work begins, but chain details must remain outside the primary product UX.

## 4. Capture and Agreement Workflow

The existing chat/email agreement feature remains, but it is no longer the whole product. It is a capture workflow that helps users turn messy supplier terms into an obligation.

### 4.1 Inputs

Supported inputs:

- pasted supplier chat
- forwarded email
- uploaded invoice
- uploaded purchase document
- manual form entry

### 4.2 Extraction

The capture workflow extracts:

- supplier name
- supplier contact if available
- item or invoice description
- amount
- currency
- due date or delivery window
- payment terms
- confidence score

The result becomes an editable obligation or agreement-backed obligation.

### 4.3 Confirmation

For obligations that require stronger trust, Proof Procure may support buyer and supplier confirmation of the same terms.

User-facing language:

- Confirm terms
- Send to supplier
- Supplier confirmed
- Payment ready
- Delivery confirmed
- Paid

Avoid user-facing language:

- smart contract
- onchain
- deploy
- gas
- wallet
- token

### 4.4 Payment Control

For agreement-backed obligations, controlled release rules may be used behind the scenes.

The user-facing concept is:

> Payment follows the terms both sides confirmed.

The internal settlement mechanism must remain abstracted.

## 5. Readiness Calculations

### 5.1 Account-Level Readiness

For a selected window:

```
readiness_percent = reserved_amount_for_due_obligations / total_due_obligations
funding_gap = total_due_obligations - reserved_amount_for_due_obligations
```

Clamp readiness percentage between 0 and 100.

### 5.2 Obligation-Level State

Recommended user-visible states:

| State | Meaning |
|---|---|
| Ready | Reserved amount covers the obligation |
| Short | Reserved amount is below required amount |
| Due soon | Due date is near and not paid |
| Reserved | Funds have been put aside |
| Paid | Payment has been completed or marked paid |

These states should be shown with color, icon, and short text.

## 6. Payment Flow

### 6.1 Add Stable Dollars

User outcome:

- "Money added."

Technical responsibilities:

- accept or record crypto/stables funding
- show the simplest possible deposit instruction
- support QR/copy address inside the add-money flow
- detect incoming funds
- update available procurement balance
- hide gas, transaction hash, and chain language from normal screens

### 6.2 Save for Bill

User outcome:

- "Money saved."

Technical responsibilities:

- validate sufficient available balance
- create Allocation
- update reserved and available balances
- update readiness snapshot
- record audit event

### 6.3 Initiate Supplier Payment

User outcome:

- "Supplier payment started."

Technical responsibilities:

- confirm supplier, amount, and funding source
- apply reserve if present
- create Payment
- call settlement orchestration
- update obligation state
- record audit event

### 6.4 Mark Paid

User outcome:

- "This supplier payment is paid."

Technical responsibilities:

- set obligation to paid
- release or apply relevant reserve
- update readiness snapshot
- record audit event

## 7. Backend Services

### 7.1 Account Service

Owns procurement balances and allocation invariants.

### 7.2 Supplier Service

Owns supplier profile CRUD and supplier summaries.

### 7.3 Obligation Service

Owns obligation CRUD, due-date logic, priority, and status.

### 7.4 Grow Service

Owns saved bill money, Grow balance, future yield/card opportunities, release, application, and audit events.

### 7.5 Readiness Service

Computes readiness snapshots and warning states.

### 7.6 Capture Service

Owns manual, invoice, chat, and email capture workflows. It may use LLM extraction, but the product should describe the result as term capture, not AI assistance.

### 7.7 Settlement Service

Owns Circle/Arc integration and internal stablecoin-backed funding/payment orchestration. It returns business-level states to the rest of the app.

Implementation notes:

- Use the ARC CLI from `git+https://github.com/the-canteen-dev/ARC-cli` for developer/operator chain access.
- Install the CLI with `uv tool install git+https://github.com/the-canteen-dev/ARC-cli`.
- Verify RPC connectivity and chain identity with `arc-canteen rpc eth_chainId` before settlement integration work.
- Treat the chain ID check as an operator sanity check, not a user-facing feature.
- Keep Arc RPC configuration, settlement addresses, and transaction references in server-side configuration and operations logs.
- MVP funding is stables/crypto-only.
- User-facing funding flow should be "Add stable dollars" with QR/copy support and a waiting/received state.

## 8. API Surface

Representative API groups:

```
GET    /api/account
POST   /api/account/fund

GET    /api/suppliers
POST   /api/suppliers
GET    /api/suppliers/:id
PATCH  /api/suppliers/:id

GET    /api/obligations
POST   /api/obligations
GET    /api/obligations/:id
PATCH  /api/obligations/:id

POST   /api/allocations
POST   /api/allocations/:id/release
GET    /api/grow

GET    /api/readiness

POST   /api/capture/chat
POST   /api/capture/email
POST   /api/capture/invoice

POST   /api/payments
POST   /api/obligations/:id/mark-paid
```

Existing agreement endpoints may remain during transition, but future product API naming should use account, suppliers, obligations, allocations, grow, readiness, capture, and payments.

## 9. Data Storage

The data model should support:

- businesses and users
- procurement accounts
- suppliers
- obligations
- allocations
- payments
- readiness snapshots
- Grow balances and opportunities
- captured source documents or messages
- audit events

Internal settlement fields may exist, but must be separated from user-facing response shapes unless needed for operations/admin views.

## 10. Notifications

Notifications should be operational and plain-language.

Examples:

- "Supplier payment is due soon."
- "You are short for next week."
- "Money saved for Supplier A."
- "Supplier payment is ready."
- "Payment marked paid."
- "Stable dollars received."

Notifications should avoid infrastructure terminology.

## 11. Visual and Interaction Direction

The app should feel like:

- modern fintech
- lightweight business banking
- procurement workflow software
- operational finance tooling

Design direction:

- dark navy, graphite, and muted green
- low-noise dashboards
- minimal charts
- typography-led clarity
- strong status indicators
- simple guided flows for low-literacy users

Avoid:

- crypto dashboard patterns
- trading charts
- DeFi-native language
- dense treasury analytics
- AI chat surfaces

## 12. Security and Audit

Security requirements:

- human confirmation for money movement
- audit trail for account funding, reserves, obligation edits, payment initiation, and paid states
- permission checks by business account
- internal settlement identifiers protected from primary UX
- no private keys, gas, transaction hashes, or chain transaction details exposed in primary screens
- deposit addresses or QR codes appear only inside the guided add-money flow

## 13. Future Expansion

Future features may include:

- FX optimization
- procurement margin tracking
- adaptive reserve recommendations
- supplier payment prioritization
- liquidity forecasting
- working capital analytics
- procurement credit
- invoice financing
- cross-currency payout
- local off-ramp
- crypto-backed business card
- Grow yield opportunities
- ERP integrations

These are not MVP requirements.

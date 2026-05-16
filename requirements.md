# Proof Procure - Requirements

## 1. Product Definition

Proof Procure is a procurement operating account for cross-border traders and SMBs.

The product helps importers, distributors, wholesalers, sourcing operators, ecommerce businesses, and procurement-heavy companies keep supplier payments continuously ready. It gives them one place to hold procurement float, reserve money for supplier obligations, understand upcoming payment gaps, and execute supplier settlement with less banking friction.

Proof Procure is a stables-powered supplier payment app and procurement operating account. It is not a crypto wallet, trading interface, or AI copilot. Circle/Arc stablecoin infrastructure powers funding, cross-border settlement, cross-currency movement, and future off-ramp/card flows. The user experience must still feel like modern business banking and procurement workflow software.

The product should become:

> The place where procurement money lives before supplier settlement.

## 2. Core Product Thesis

Procurement businesses struggle with:

- fragmented supplier cash
- delayed international settlement
- manual FX timing
- uncertainty around upcoming supplier payments
- operational stress before due dates

Traditional bank accounts show balances. Proof Procure must show procurement readiness:

- available procurement balance
- reserved funds
- upcoming supplier obligations
- funded and underfunded obligations
- operational liquidity health

The MVP is **Procurement Float + Supplier Readiness**.

## 3. Primary Users

Primary users are cross-border traders and SMB operators, including:

- import/export businesses
- ecommerce sourcing operators
- distributors
- wholesalers
- procurement-heavy SMBs

The product is especially for businesses buying internationally from China, Vietnam, India, Turkey, the UAE, the EU, and other supplier-heavy markets.

## 4. Non-Negotiable UX Principle

A low-literacy, non-technical trader must be able to use Proof Procure to keep supplier payments ready and benefit from global instant payments without needing to understand wallets, blockchain, gas, banking cutoffs, or payment infrastructure.

The product MUST support a Guided Simple Mode with:

- plain-language labels
- icon-led actions
- large visual status states
- minimal reading
- clear next-step prompts
- confirmation screens before money movement
- color-coded payment states
- no abstract finance or crypto terminology

Core status language should be simple and visual:

- Ready
- Short
- Due soon
- Reserved
- Paid

## 5. Core UX Principles

The app should feel:

- operational
- calm
- modern
- finance-aware
- procurement-native
- usable by busy traders under pressure

The app must not feel:

- speculative
- crypto-native
- trading-oriented
- wallet-centric
- like an AI assistant

Primary UX MUST NOT show gas, transaction hashes, private keys, trading charts, or "send token" flows. Crypto funding may be exposed only through a guided "Add stable dollars" flow with plain labels, QR/copy support, warnings, and confirmation states.

## 6. Main Product Objects

### 6.1 Procurement Balance

The main operational balance used for supplier payments.

Displayed as:

- Available procurement balance
- Reserved funds
- Upcoming obligations
- Available to allocate

Users should think: "This is procurement cash."

### 6.2 Suppliers

Supplier records include:

- supplier name
- country
- preferred currency
- payment terms
- average invoice size
- notes

### 6.3 Obligations

An obligation represents a supplier invoice, payment commitment, purchase agreement, or upcoming procurement payment.

Fields:

- supplier
- amount
- currency
- due date
- status
- reserved or unreserved
- payment priority
- optional source, such as manual entry, uploaded invoice, or captured supplier conversation

### 6.4 Reserves

Users can reserve procurement balance toward obligations or reserve categories.

Examples:

- Freight reserve
- Supplier reserve
- Inventory reserve

Reserves create operational separation, procurement discipline, and payment confidence.

### 6.5 Readiness Snapshot

The readiness snapshot explains whether upcoming supplier payments are covered.

It includes:

- readiness percentage for the next 14 days
- funded obligations
- underfunded obligations
- funding gap amount
- due-this-week exposure

Example:

> 82% of next 14 days supplier obligations are funded.

### 6.6 Payments

Payments are business-banking-style actions for moving supplier obligations from ready to paid.

Users should be able to:

- fund procurement balance
- reserve funds
- initiate supplier payment
- mark obligation as paid

For MVP, funding the procurement balance is crypto/stables-only. The product should describe this as adding stable dollars for supplier payments, not as trading or managing a crypto wallet.

## 7. MVP Features

### FR-01: Procurement Dashboard

The main screen MUST show immediate operational clarity:

- available procurement balance
- reserved procurement balance
- available to allocate
- upcoming obligations
- due this week
- fully funded obligations
- underfunded obligations
- readiness percentage

### FR-02: Supplier Obligations

Users MUST be able to create and manage supplier obligations.

Supported creation paths:

- manual entry
- uploaded invoice
- captured supplier conversation or email

The system MUST track:

- total upcoming supplier exposure
- payment readiness per obligation
- due dates and priorities
- funded versus underfunded obligations

### FR-03: Funding Readiness

The system MUST calculate:

- how much procurement liquidity is already reserved
- upcoming funding gaps
- percentage readiness for upcoming obligations
- shortfall for due-soon obligations

Funding readiness is the core product identity.

### FR-04: Procurement Reserve Allocation

Users MUST be able to allocate available procurement balance toward obligations or reserve categories.

Allocation actions MUST be confirmable, reversible before payment, and visible in the dashboard.

### FR-05: Settlement Readiness

Once procurement funds are loaded, supplier payments MUST be shown as settlement-ready when sufficient funds are available and reserved.

User-facing benefits:

- no banking cutoff delays
- no weekend payment uncertainty
- less wire dependency
- faster supplier execution

The product MUST explain this as business payment readiness, not as stablecoin or blockchain functionality.

### FR-06: Guided Simple Mode

Guided Simple Mode MUST make the core workflow usable without documentation.

The mode MUST support:

- "What needs money?" views
- "Put money aside" reserve actions
- "Pay supplier" actions
- "Mark paid" actions
- visual warnings for shortfalls
- confirmation screens before reserve or payment actions
- plain-language summaries after every action

### FR-07: Supplier Capture Workflow

The existing chat/email agreement feature remains in the product, but it MUST be framed as a way to capture supplier terms and create obligations.

The system SHOULD accept:

- pasted supplier chats
- forwarded emails
- uploaded invoices or purchase documents

The workflow SHOULD extract:

- supplier
- item or invoice description
- amount
- currency
- due date or delivery window
- payment terms

The extracted result becomes an editable obligation or supplier agreement. It is not the whole product offering.

### FR-08: Agreement Confidence and Payment Control

For obligations that need stronger payment confidence, Proof Procure MAY support dual confirmation and controlled release rules.

This workflow SHOULD remain available for supplier agreements where both parties need to confirm terms, delivery, and payment timing. It must be described in user-facing language as agreement confirmation and payment control, not smart-contract deployment.

### FR-09: Onboarding

Onboarding MUST collect enough procurement context to personalize readiness.

Step 1 - Company Basics:

- company name
- country
- industry

Step 2 - Procurement Profile:

- supplier countries
- typical invoice size
- payment frequency
- operating currencies

Step 3 - Settlement Context:

- main settlement currency
- average monthly procurement spend
- major procurement payment pain points

### FR-10: Minimal Intelligence Layer

The system MAY provide embedded operational guidance:

- reserve target suggestions
- funding warnings
- underfunded obligation alerts
- simple liquidity guidance

Examples:

- "You are short for next week supplier payments."
- "Most businesses like yours keep 14-21 days of procurement money ready."

The MVP MUST NOT include chatbots, autonomous agents, fake AI, or assistant-style UX.

### FR-11: Payments

Payment UX MUST resemble modern business banking.

Users MUST be able to:

- fund procurement balance with stable dollars
- reserve funds
- initiate supplier payment
- mark obligation as paid

Payment screens MUST clearly show:

- supplier
- amount
- due date
- reserve source
- confirmation step
- final paid state

### FR-12: Cross-Currency and Off-Ramp Direction

Proof Procure SHOULD be designed for cross-currency supplier payments and off-ramp support, even if the first implementation is limited.

Future payment capabilities include:

- pay supplier in a different currency
- convert stable dollars into local payout rails
- off-ramp to bank or local payment method
- issue or connect a crypto-backed business card

These must be presented as payment choices, not as trading or DeFi features.

### FR-13: Grow

The piggybank area of the app should become **Grow**.

Grow is where users manage extra money not needed for immediate supplier bills. It may later include:

- stable-dollar balance opportunities
- yield opportunities
- payment timing suggestions
- card access
- other treasury options

In MVP, Grow should stay simple and educational. Do not put complex DeFi controls, pool names, APY chasing, or trading UX in front of low-literacy users.

## 8. Non-Functional Requirements

### NFR-01: Invisible Infrastructure

Circle/Arc stablecoin infrastructure MUST be abstracted from normal use. Users see stable dollars, money in, bills, payment readiness, and paid states.

The intended settlement chain for implementation is Arc. Chain-specific setup, RPC checks, addresses, and transaction details are developer/operator concerns only and must not appear in primary user flows.

### NFR-02: Low-Literacy Usability

Core actions MUST be understandable through labels, icons, color, layout, and step-by-step prompts. The product must not depend on long written explanations.

### NFR-03: Operational Calm

The UI MUST prioritize low-noise dashboards, clear states, and predictable workflows over charts, complex finance terminology, or dense treasury controls.

### NFR-04: Authentication-Based Accounts

Users access Proof Procure through business accounts. The primary UX must not expose seed phrases, gas, or advanced wallet controls. Crypto deposit details may appear only when the user chooses to add stable dollars.

### NFR-05: Auditability

The system MUST keep an audit trail for reserves, obligation changes, payment actions, agreement confirmations, and settlement status updates.

Internal audit records may store settlement references and chain metadata for reconciliation and operations, but user-facing audit views should translate these into plain business events such as "money reserved", "payment started", and "payment paid".

### NFR-06: Human Control

No autonomous agents may initiate payments, reserve funds, or make binding supplier decisions in the MVP. Human confirmation is required for money movement.

## 9. Suggested Navigation

The future app redesign should use:

- Home
- People
- Bills
- Pay
- Grow
- More

Guided Simple Mode may simplify these into action-first entry points, but the underlying product areas remain the same.

## 10. Constraints for MVP

Do not build:

- autonomous AI agents
- lending
- complex yield products in MVP
- DeFi-native UX
- trading interfaces
- complex treasury automation
- advanced forecasting
- procurement credit
- invoice financing
- complex FX optimization
- crypto-native payment flows

## 11. Success Criteria

The MVP succeeds if businesses:

1. Keep recurring procurement float inside Proof Procure.
2. Track supplier obligations in the product.
3. Reserve funds before supplier due dates.
4. Use Proof Procure before making supplier payments.
5. Understand readiness, shortfalls, due-soon payments, and paid states visually.
6. Benefit from faster global settlement without needing to understand the underlying infrastructure.
7. Trust the product operationally.

## 12. Out of Scope

- Lending
- Complex yield products in MVP
- Trading
- DeFi dashboards
- Crypto wallet management
- Autonomous payment agents
- Advanced liquidity forecasting
- Procurement credit
- Invoice financing
- Marketplace sourcing
- ERP integrations for MVP
- Full dispute resolution

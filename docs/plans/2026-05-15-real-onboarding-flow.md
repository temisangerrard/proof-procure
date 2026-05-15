# Real Onboarding Flow Plan

## Goal

Make signup feel like opening a payment account, not configuring software.

The user signs in with email, gets a Circle user-controlled wallet, adds one supplier, adds one bill, sees how to add money, and can pay the first supplier.

## Principles

- Use customer words: money, supplier, bill, pay, paid.
- Do not send users to Settings to create a wallet.
- Do not show blockchain, wallet, token, gas, or DeFi language in the primary flow.
- Every money movement needs a clear confirmation screen.
- Empty states should lead to the next action, not show fake data.

## Target Flow

1. Email sign in
   - User enters email.
   - User verifies email.
   - App creates or resumes the payment account.

2. Payment account setup
   - Circle email OTP/Web SDK challenge runs inside onboarding.
   - Success state says: `Payment account ready`.
   - Failure state says: `We could not finish setup. Try again.`

3. Business basics
   - Business name.
   - Country.
   - Main money.

4. First supplier
   - Supplier name.
   - Supplier country.
   - Optional payout note.

5. First bill
   - Amount.
   - Currency.
   - Pay date.
   - Short note.

6. Add money
   - Show deposit address or funding instruction from the created account.
   - Show `Waiting for money` until funds arrive.
   - Show `Ready` when balance is enough for the bill.

7. First payment
   - User chooses the bill.
   - User sees supplier, amount, and final check.
   - Circle creates a transfer challenge.
   - User approves in Circle UI.
   - App records payment and marks bill `Paid` after confirmation.

## Required Screens

- `/login`: email entry.
- `/verify`: email verification result.
- `/app/onboarding`: payment account, business, supplier, bill, add money.
- `/app`: readiness home with real records only.
- `/app/payments`: confirm and pay bill.
- `/app/suppliers`: real supplier list.
- `/app/obligations`: real bill list.
- `/app/settings`: account details only, not primary setup.

## Backend Work

- Persist onboarding progress per user.
- Store Circle wallet ID, address, user ID, and chain.
- Add wallet funding events.
- Add payment status lifecycle:
  - `draft`
  - `confirming`
  - `sent`
  - `paid`
  - `failed`
- Sync Circle transaction status before marking a bill `Paid`.

## Acceptance Test

A new user can complete this path without docs:

`Sign in with email -> create payment account -> add Mei -> add $18,200 bill -> add money -> pay Mei -> bill shows Paid`

No fake suppliers, fake bills, fake balances, or fake Grow positions should appear during this path.

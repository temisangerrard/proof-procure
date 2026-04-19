You are not allowed to write generic B2B copy. Every headline and section must be specific to ProofProcure's thesis: procurement starts in chat, the system structures the agreement, both parties confirm, and payment execution happens without changing how users work.

You are a senior full-stack product engineer and UX designer. You are updating an existing Next.js 16 app at web/ in a ProofProcure project. The backend is in backend/. There is also an infra/ directory with Cloudflare config.

DO NOT redesign from scratch. The current web/ already has pages, layout, and components. Your job is to UPDATE them.

IMPORTANT RULES:
- No frontend slop. Clean, functional, execution surface only. No gradients, no hero sections in admin, no marketing copy inside tools.
- No visible crypto language. Use: account, agreement, confirm, ratify, fund agreement, mark delivered, confirm delivery, payment released. Avoid: wallet, gas, blockchain, smart contract, token, private key.
- The product feels like modern B2B software, not enterprise sludge, not crypto.
- Admin should follow the Peppera systemeats pattern — sidebar nav, AI ops-chat with telemetry context, tool calling, confirmation cards.

TASK 1: Replace the Vercel triangle with a custom ProofProcure logo
- Create a simple SVG logo component at web/src/components/logo.tsx
- The logo should be a geometric mark suggesting: two parties connecting / handshake / agreement / checkmark
- Clean, single-color, works at 16px and 64px
- Use it in the top nav header component and anywhere the old Next.js default logo/triangle appears
- The wordmark should be "ProofProcure" in bold, clean sans-serif

TASK 2: Wire auth to Cloudflare D1 via API routes
The database is already created. Schema is at infra/schema.sql. The Next.js app needs API routes that talk to D1.

Create web/src/lib/db.ts — a helper that calls the Cloudflare D1 HTTP API:
- Endpoint: https://api.cloudflare.com/client/v4/accounts/{account_id}/d1/database/{database_id}/query
- Auth: Bearer token from env CLOUDFLARE_D1_API_TOKEN (we'll set this later, for now use a placeholder)
- Functions: db.query(sql, params), db.run(sql, params), db.batch(statements)
- Export a d1Client instance

Update web/src/app/api/auth/send-code/route.ts:
- Generate a random 6-digit code
- Store in auth_codes table via D1 with 10 min expiry
- Send via Resend API (re_UPeLG2E4_7y8jAmkzXgK6qsqK11Gore92) to the user's email
- From: ProofProcure <noreply@proofprocure.com> (or onboarding@resend.dev as fallback)
- Return success/error

Update web/src/app/api/auth/verify-code/route.ts:
- Look up code in auth_codes table via D1
- Check not expired, not used
- Mark used
- Upsert user into users table (id = nanoid, email from code lookup)
- Set a cookie session (simple signed cookie with email + user_id, use a SESSION_SECRET env var)
- Return success with redirect to /app

Update web/src/lib/auth.ts (or create it):
- getSessionUser() reads cookie, verifies signature, returns { id, email, role }
- requireAuth() — throws/redirects if no session
- requireAdmin() — throws/redirects if not admin
- Admin detection: role === 'admin' in users table. For now, hardcode mirasettley@gmail.com as admin.

TASK 3: Wire agreements dashboard to D1
Update the /app dashboard page:
- Instead of seed data, fetch real agreements from D1 for the logged-in user
- If no agreements exist, show empty state with quick start cards
- Keep the quick start cards: Paste conversation, Forward email thread, Upload document

Create web/src/app/api/agreements/route.ts:
- GET: list agreements for current user (buyer_id = session user id)
- POST: create new draft agreement (extract from pasted text, store in D1)

Create web/src/app/api/agreements/[id]/route.ts:
- GET: single agreement with audit events
- PATCH: update agreement fields

TASK 4: Build admin panel at /admin
Follow the systemeats pattern exactly.

Create web/src/app/admin/layout.tsx:
- Sidebar nav (hidden on mobile, hamburger toggle)
- Admin pages: Dashboard, Agreements, Users, Ops Chat
- Sidebar shows: logo, nav links, user badge
- Clean, minimal, no slop

Create web/src/app/admin/page.tsx — Admin Dashboard:
- Total agreements count by status (draft, ratified, funded, delivered, payment_released)
- Recent agreements table (last 20)
- Recent users (last 10)
- System health: bot status, keeper status, last extraction time
- Quick metrics cards

Create web/src/app/admin/agreements/page.tsx:
- Full table of all agreements across all users
- Filterable by status
- Clickable rows to see detail
- Show: id, buyer, supplier, item, total, status, created date

Create web/src/app/admin/users/page.tsx:
- All users with email, role, agreement count, created date
- Ability to toggle admin role

Create web/src/app/admin/ops-chat/page.tsx:
- Chat interface (messages in, messages out)
- The AI assistant reads a TELEMETRY CONTEXT BUNDLE on every message
- Context bundle includes: agreement counts by status, recent agreements, recent users, recent audit events, any failed extractions, system health
- AI can propose actions (tool calls): update_agreement_status, toggle_admin, resend_proposal, view_agreement_details
- Actions show as confirmation cards before executing
- Use a system prompt modeled on the systemeats one but adapted for ProofProcure

Create web/src/app/api/admin/ops-chat/route.ts:
- Build telemetry context from D1
- Send to Claude/Anthropic API (use ANTHROPIC_API_KEY env)
- Parse response for tool calls
- Return either text reply or action proposal

Create web/src/app/api/admin/ops-chat/execute/route.ts:
- Execute a confirmed action from ops-chat
- Validate the action type
- Perform the D1 mutation
- Return result

TASK 5: Wallet derivation from email
Create web/src/lib/wallet.ts:
- deriveWalletFromEmail(email: string): { address: string }
- Uses ethers.js HDNodeWallet from a SEED phrase + email as path component
- The address is deterministic — same email always gets same address
- This is server-side only (API route)
- Store the derived address in users.wallet_address on first login

Create web/src/app/api/auth/wallet/route.ts:
- GET: returns the user's derived wallet address
- Called after login to show "your account is ready"

TASK 6: Environment config
Update web/src/lib/env.ts (or create):
- All env vars typed and validated
- RESEND_API_KEY
- CLOUDFLARE_ACCOUNT_ID  
- CLOUDFLARE_D1_API_TOKEN
- DATABASE_ID
- SESSION_SECRET
- ANTHROPIC_API_KEY
- DEPLOYER_PRIVATE_KEY (server only)
- BASE_RPC_URL

TASK 7: Make sure everything compiles and builds clean
Run npm run build at the end. Fix any errors.

START NOW. Build actual code, not descriptions.

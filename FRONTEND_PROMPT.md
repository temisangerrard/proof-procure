You are not allowed to write generic B2B copy. Every headline and section must be specific to ProofProcure's thesis: procurement starts in chat, the system structures the agreement, both parties confirm, and payment execution happens without changing how users work.

You are a senior full-stack product engineer, product designer, and UX writer.
Build the frontend and app shell for a product called ProofProcure.

Mission
Build a polished homepage + authentication flow + first in-app interface for ProofProcure.
ProofProcure is an agent-first, channel-native procurement execution layer. It helps users turn messy procurement conversations from Telegram, email, voice notes, and documents into structured agreements that both parties can ratify, fund, and execute. The product runs on hidden blockchain rails, but the user should not feel like they are using a crypto app.
The website is both:
the public landing page that explains and sells the product
the web entry point for users to log in and access their agreements

Critical product positioning
This is NOT:
a procurement marketplace
an ERP replacement
a sourcing platform
a crypto product
a wallet app

This IS:
a way to meet buyers and suppliers where they already are
a system that does half the work for them
a structured proposal + ratification + execution layer
a hidden settlement and enforcement engine

The homepage must clearly communicate that the product:
starts from real conversations
extracts and structures procurement terms
gets both parties to ratify
enforces payment rules
keeps users out of complex procurement software
keeps crypto invisible

Product principles
clean, modern, high-trust UI
mobile responsive
fast and lightweight
feels like modern B2B software, not enterprise sludge
no visible crypto language in the main UI
use product language like:
account
agreement
confirm
ratify
fund agreement
mark delivered
confirm delivery
payment released
Avoid language like:
wallet
gas
blockchain
smart contract
token
private key

Tech assumptions
Build with:
Next.js (App Router)
TypeScript
Tailwind CSS
shadcn/ui if useful
Resend for OTP email delivery
simple email OTP login flow
clean component structure
production-minded folder structure

What to build

1. Public Homepage
Design and implement a strong landing page for ProofProcure.

Homepage goals
The page must:
explain the product clearly
feel credible to SMEs, operators, and modern procurement teams
communicate that procurement starts in chat/email, not in ERP
position ProofProcure as the missing execution layer
make the product feel simple and inevitable
drive users to sign in with email

Homepage sections
Include at minimum:

Hero section
Strong headline and subheadline.
The headline should communicate:
procurement starts in chat
ProofProcure turns informal agreements into enforceable agreements
users do not need to change how they work
Add a primary CTA: "Get started" or "Sign in"

Problem section
Explain that real procurement starts in WhatsApp, Telegram, email, forwarded docs
And that this creates unstructured agreements, delayed reconciliation, payment disputes, poor auditability

How it works section
Simple 3-5 step visual explanation:
Forward or paste a conversation
ProofProcure extracts the terms
Both parties confirm
Payment is controlled automatically
Updates stay connected to the original workflow

Product value section
Show benefits like less manual procurement admin, faster agreement creation, clearer accountability, better supplier trust, easier payment control, audit-friendly record

Trust / use case section
Position it for SMEs, global suppliers, recurring replenishment agreements, stablecoin-enabled global trade infrastructure without forcing crypto UX

CTA footer
Repeat CTA to sign in

Copywriting direction
Keep copy sharp, modern, minimal, and confident.
Do not sound like corporate consulting.
Do not sound like crypto hype.
Write like a serious product company.

2. Auth Flow
Build a simple and elegant email OTP login flow.
Requirements:
email input form
send OTP code to email using Resend
6-digit code flow
verify code screen
success redirects to app
clean error and loading states
UX: very simple, should feel fast, copy reinforces "Sign in with your email" and "We'll send you a code", no password flow, no clutter
Use the user's email as the basis of account creation.
They enter email, receive code, enter code, they are in.
Do not overcomplicate auth.

3. First Logged-In App Interface
Build the first in-app experience — the product's command center.
Not a generic blank dashboard.

Main app layout:
Top nav with logo, signed-in email, sign out, "New agreement" CTA
Main hero block: "Turn messy procurement conversations into structured agreements"
Quick start cards: Paste conversation, Forward email thread, Upload document, Connect Telegram bot
Agreements list with sample seeded data showing statuses: Draft extracted, Awaiting supplier ratification, Fund agreement, Delivered, Payment released
Agreement detail page showing: counterparty, item/SKU, quantity, price, delivery window, payment rule, current status, timeline/activity, actions (Confirm, Send to supplier, Fund agreement, Mark delivered, Confirm delivery)
Activity/audit timeline: conversation received, terms extracted, buyer confirmed, supplier ratified, agreement funded, delivery marked, payment released

4. Design Quality
premium, trustworthy, modern, crisp
B2B SaaS but not boring
clean spacing, restrained typography, confident layout
subtle gradients or depth if tasteful
not overly dark unless it really works
avoid generic template feel
Make it look like something a real startup would ship.

5. Routes
/ → homepage
/login → email entry
/verify → OTP verification
/app → main app dashboard
/app/agreement/[id] → agreement detail

6. Deliverables
Build the actual code. Not descriptions.
Folder structure, key pages, reusable components, auth flow with Resend, seeded sample data, polished copy, responsive layout.
Do not build blockchain logic. Do not build full procurement backend. Focus on homepage, login, and first in-app surface.
Make the product story obvious from the UI.
Start now.

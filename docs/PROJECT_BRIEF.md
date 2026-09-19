# Quotebot: Project Brief

**Source of truth for Claude Code.** Loaded at the start of every session through `CLAUDE.md`.
**Last updated:** Sep 19, 2026 by Claude Code (proposed changes, waiting on Donny)
**If anything in `docs/plan/` disagrees with this file or `docs/DECISIONS.md`, these two win.** If still unclear, ask Donny. Don't guess.

---

## 1. What we're building

An AI estimate chatbot for small home service businesses.

- **Homeowner side:** describes a job (and can add photos), the bot asks short questions one at a time, and returns an **estimate range** based on that business's own signed pricing rules. Then it captures name and phone.
- **Owner side:** gets a lead alert by email with the job details, estimate, and photos.

**Core design idea: build once, configure many.** One widget, one demo page, one pricing engine, one prompt. A new client is a new folder in `clients/` (brand + pricing rules + test cases), not new code.

**The one rule that matters most:** the AI never does the math. The chatbot collects details, `engine/price.js` calculates the range, and `engine/guard.js` blocks any reply with a price the engine didn't produce.

---

## 2. Who it's for

- **Current lean for first customers:** owner-operated **handyman and drywall repair** businesses (1 to 10 people) doing residential interior repairs, in one metro area (Long Island or Buffalo, not decided).
- **Why:** flat per-task pricing, easy to describe and photograph, year-round, and no off-the-shelf tool gives homeowners a photo-based chat estimate.
- **Avoid for now:** mechanics (customers can't describe the problem), fencing (hidden ground conditions), power washing (crowded and seasonal in NY).
- **Still open:** final niche depends on Kristen's research and owner interviews. The demo client (`clients/example-drywall`) uses **fake numbers**.

---

## 3. The team

| Person | Role |
|---|---|
| **Donny** | Owns the build (runs Claude Code, approves every change), GTM strategy |
| **Ethan** | Original idea, technical design, chatbot model testing |
| **Kristen** | Niche and market research |
| **Linda, 5th member** | Mystery-shopping local businesses, booking owner interviews (roles not confirmed) |

This started as an **MBA 571 group project** at Stony Brook. Two finish lines:

1. **Class:** a working demo with a fake client, market sizing, pricing, GTM plan, validation results.
2. **Business (stretch):** 1 to 3 pilot businesses using it, then at least one paying.

The final presentation date is not set in this repo yet.

---

## 4. How it works (architecture)

- **Stack:**
  - **App:** Next.js (JavaScript) on Vercel.
  - **Data:** Supabase (Postgres, logins, photo storage).
  - **Chatbot:** Kimi through OpenRouter (`CHAT_MODEL`, swappable).
  - **Checker:** newest GPT model as the test judge (`JUDGE_MODEL`).
  - **Email:** Resend for lead alerts.
- **One system for all clients.** Each client's data is separated with Supabase Row Level Security.
- **Chat flow:**
  1. The widget calls `/api/chat`.
  2. The server loads the client's rules and calls the model.
  3. When the model asks for an estimate, the server runs the pricing engine.
  4. The guard checks the reply, and only then does it go to the customer.
- **No streaming for now.** The guard must read the whole reply first.
- **Photos:** shrunk in the browser, uploaded straight to Supabase Storage with a one-time link from `/api/upload-url`. Max 3 per chat.
- **Leads:** `/api/lead` saves to the `leads` table first, then emails the owner, then marks the alert sent.
- **Estimate outcomes:** `ok` (show range + disclaimer), `need_info` (ask the next question), `needs_review` (a person will call, no price), `out_of_area`, `out_of_scope`.
- **Testing:**
  - `npm test` for the engine and guard.
  - `npm run golden` runs each client's test cases through the engine.
  - Phase 1 adds a live test run where the chatbot plays every test case and GPT grades it with `validator/RUBRIC.md` (pass/fail).
  - Until the model keys exist, local dev runs in test mode: a scripted stand-in bot with the real engine and guard.

---

## 5. Build order

Details and "done" checks are in `docs/BUILD_PLAN.md`.

| Phase | What | Status |
|---|---|---|
| 0 | Setup: Node, Git, GitHub repo, accounts, test keys | Done |
| 1 | Bot brain: Next.js app, `/api/chat`, test chat page, live test runner | In progress: foundation merged in PR #1; the live model test waits on keys |
| 2 | Customer widget + branded demo page + real test photos | In progress |
| 3 | Supabase tables + RLS, saved chats, photo storage, lead emails, abuse limits | Not started |
| 4 | Live demo on a Vercel preview link (the MBA 571 version) | Not started |

**Not yet (don't build unless Donny says so):**

- owner login portal
- Jobber / Housecall Pro connections
- text messages
- Stripe
- admin dashboard
- multiple real clients
- satellite measurement
- phone answering

---

## 6. Business model (hypotheses, not decided)

- **Competitors:**
  - Off-the-shelf instant-quote tools cost about **$179 to $299 a month** (ResponsiBid, QuoteIQ). They are forms, not chat, and don't use homeowner photos.
  - A custom handyman photo-quote build costs **$6,000 to $14,000** (OpenClaw Consult).
- **Packages to test:**
  - **Starter:** about $99 to $149/mo.
  - **Done-for-you:** about $249 to $299/mo plus a $500 to $1,000 setup.
- **Ethan's setup-fee idea** ($2,500 to $15,000) fits custom work, not a repeatable product. Still under discussion.
- **Pilots are free for 30 days.** Month-to-month and public pricing are planned as trust advantages.
- **AI cost is small:** about $2 to $20 per client per month. Choose the chatbot model on quality, photo handling, and trust, not token price.

---

## 7. Where the full reasoning lives

| File | What's in it |
|---|---|
| `docs/DECISIONS.md` | Every decision with its date. **Read before proposing changes.** |
| `docs/BUILD_PLAN.md` | Phases, done checks, prompts |
| `docs/plan/WORKING_DOC.md` | The team's original group-chat plan and early risks |
| `docs/plan/BUILD_FRAMEWORK.md` | Why "build once, configure many", chatbot rules, design framework, model costs |
| `docs/plan/DEPLOYMENT_PLAN.md` | Every service we use and why, database tables, go-live checklist |
| `docs/plan/MARKET_RESEARCH.md` | Competitor prices and features, target market scorecard, validation plan |
| `design/DESIGN_RULES.md` | How everything should look |
| `docs/owner-interview.md`, `docs/client-pipeline.md` | Sales and onboarding steps |

Read the `docs/plan/` files only when a task needs that detail. They are long.

---

## 8. Open questions

1. Final first niche (handyman/drywall vs other)
2. Target metro (Long Island or Buffalo)
3. Pricing and setup fee
4. Kimi through OpenRouter's default route vs a US-hosted route (customer photo privacy)
5. Does Kimi handle photos well enough? (Ethan tests in Phase 1 and 2)
6. Domain name (needed before Phase 3 email)
7. MBA 571 presentation date
8. Whether the team continues after the class, and who owns what
9. Default font: keep Inter, or pick one on purpose before showing the demo page

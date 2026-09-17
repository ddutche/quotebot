# Quotebot: Build Plan (v0.1)

**Date:** Sep 16, 2026
**Builder:** Claude Code (Opus orchestrates; Sonnet and Haiku agents do the work), run by Donny
**Starting point:** the starter kit (pricing engine, reply guard, 14 tests, fake drywall client, agent files)

---

## The approach in one line

**Build the riskiest part first:** can a cheap chatbot model reliably pull job details out of a messy conversation and hand them to the pricing engine? If that doesn't work, a nice widget doesn't matter. So the order is: **bot brain → widget → saving leads → live demo.**

---

## Phase 0: Set up (one evening)

**On your computer**

1. Install Node 20 or newer, Git, and Claude Code.
2. Unzip the starter kit. Create a **private** GitHub repo (for example `quotebot`) and push the kit to it.
3. In the repo folder, run `npm test` (should show 14 passing) and `npm run golden` (11 of 11).

**Accounts (all free or prepaid for now)**

| Account | Why now | Setting to turn on right away |
|---|---|---|
| GitHub | Code lives here | Private repo, two-factor login |
| OpenRouter | Runs the Kimi chatbot (and lets you swap models later) | Add about $10 of credit; set a limit on the API key |
| OpenAI | Runs the GPT checker | Set a monthly budget of about $10 |
| Vercel (Hobby) | Preview deploys while building with fake clients | Two-factor login |
| Supabase (free) | Create one project called `quotebot-staging` (used in Phase 3) | Two-factor login |

**Wait on these:** domain + Resend (Phase 3), paid Vercel/Supabase (right before a real business uses it), Stripe and password manager (later, as decided).

**Keys:** copy `.env.example` to `.env.local` and fill in your keys there. Never paste them anywhere else.

**Check Claude Code read the rules:** open the repo in Claude Code and ask it to summarize the 10 golden rules in `CLAUDE.md`. If it can't, stop and fix that first.

---

## Phase 1: The bot brain (about a week part-time)

**Goal:** a working chat backend for the fake drywall client. No database, no real widget.

**What gets built**

- The repo becomes a **Next.js app** (so the chat server, demo page, and later the owner portal all live in one place and deploy to Vercel together).
- `/api/chat`:
  - loads the client's rules
  - calls Kimi through OpenRouter
  - runs the pricing engine when the bot asks for an estimate
  - runs the guard on every reply
- **No streaming yet.** The guard has to read the whole reply before the customer sees it. Replies are 2 to 3 sentences, so a typing indicator is enough.
- A bare **test chat page** for us (not the customer widget).
- `validator/run-live.js`:
  - plays all 11 golden cases against the real model
  - checks the fields it extracted
  - sends each transcript to the GPT checker
  - prints a pass/fail table

**Done when**

- `npm test` passes
- You can chat with the drywall client on the test page
- The live golden run passes every critical check **3 runs in a row**

**If Kimi can't hit that bar:** try one other model through OpenRouter before changing the design. The kit is built so that's a one-line change (`CHAT_MODEL`).

### Prompt to paste into Claude Code (Phase 1)

```
Read CLAUDE.md, README.md, and docs/BUILD_PLAN.md. We're starting Phase 1.
Plan first and show me the plan before you build anything.

Scope:
1. Turn this repo into a Next.js app (App Router, plain JavaScript) that deploys on
   Vercel. Keep engine/, bot/, validator/, clients/, schemas/ where they are, and keep
   npm test passing.
2. lib/rules.js: load clients/<id>/pricing-rules.json and brand.json.
3. lib/prompt.js: fill the placeholders in bot/system-prompt.md and build the
   get_estimate tool definition from the rules "fields" (see bot/get_estimate.tool.json).
4. app/api/chat/route.js: accepts { clientId, messages }. Calls the chatbot through
   OpenRouter's OpenAI-compatible API using env CHAT_MODEL. When the model calls
   get_estimate, run engine/price.js and return the result to the model. Run
   engine/guard.js on the final reply. If the guard fails, retry once with a short
   correction note; if it fails again, reply with a safe "a team member will confirm
   your price" message. No streaming. Keys only from environment variables. Cap each
   chat at 30 messages.
5. app/dev/page.js: a bare test chat page for the team (not the customer widget).
6. validator/run-live.js: play each case in clients/<id>/golden-set.jsonl against
   /api/chat, save transcripts to validator/runs/, compare the get_estimate arguments
   to expected_fields, and if OPENAI_API_KEY is set, send each transcript to the judge
   (env JUDGE_MODEL) using validator/RUBRIC.md. Print a pass/fail table.

Delegation: ui-builder for the dev page, test-writer for tests of the lib/ files,
copy-helper for boilerplate. You own the chat route, the prompt builder, and the
harness.

Don't add a database, logins, photo upload, or the real widget yet.
Done when npm test passes, the dev page works with example-drywall, and run-live
prints a report. Finish with a 3-line summary of what changed and what I should check.
```

---

## Phase 2: The widget and demo page (about a week)

**Goal:** something you can show a business owner on a phone.

**What gets built**

- The customer **chat widget**, following `design/DESIGN_RULES.md`:
  - launcher and chat panel
  - quick-reply chips
  - photo button with in-browser shrinking
  - estimate card
  - lead form
  - "a person will call you" card
  - error state
- The branded **demo page** that reads `brand.json`
- **Real test photos:** 10 or so real drywall photos (small hole, big hole, water stain, popcorn ceiling) added to the golden set, replacing the "[photo shows...]" text placeholder
- Photos stay in memory for now (storage comes in Phase 3)

**Done when**

- `design-reviewer` says PASS
- It works at phone width
- The widget runs when pasted into a plain HTML page
- The photo golden cases pass

### Prompt to paste into Claude Code (Phase 2)

```
Read CLAUDE.md, design/DESIGN_RULES.md, design/tokens.json, and docs/BUILD_PLAN.md.
We're starting Phase 2. Plan first and show me the plan.

Scope:
1. widget/: a zero-dependency web component with Shadow DOM, built into
   public/widget.js. Loaded with one script tag that has a data-client attribute.
   Parts: launcher, panel, message bubbles, quick-reply chips for enum questions,
   photo button, estimate card, lead form (name, phone, best time, consent checkbox),
   handoff card, error state. It only talks to our /api/* routes.
2. Photos: images only, max 3, resized in the browser (longest side about 1600px,
   JPEG about 80%) and sent to /api/chat as part of the message for now.
3. app/demo/[clientId]/page.js: the branded demo page from DESIGN_RULES section 4,
   reading brand.json. Hide the trust section if trust_facts are empty.
4. public/embed-test.html: a plain page with only the script tag, to prove the
   embed works.

Delegation: ui-builder builds 1 to 4. design-reviewer reviews when done, and
ui-builder fixes anything marked FAIL. You review the diff.
Done when design-reviewer says PASS and the widget works on embed-test.html at 360px
and 1280px wide. Finish with a 3-line summary.
```

---

## Phase 3: Saving leads (about a week)

**Goal:** real leads saved and emailed, safely.

**First, buy the domain** and verify it in Resend. Email alerts need it.

**What gets built** (in the `quotebot-staging` Supabase project)

- **Tables** from the Deployment Plan, with RLS on every one
- **Rules loaded from the database:** a small script uploads `pricing-rules.json` as a new rules version
- **Chats saved:** conversations, messages, and estimates, with the rules version on each estimate
- **Photo storage:** `/api/upload-url` hands out a one-time link; photos go straight to Storage
- **Leads:** `/api/lead` saves the lead first, then emails the owner through Resend, then marks it sent
- **Abuse protection:** message limits per visitor, an allowed-websites check, and the free human check (Turnstile)
- **Spending caps** set everywhere and written in the README table

**Done when**

- A test lead shows up in the table and the email arrives
- The Supabase security advisor shows no warnings
- A chat from a website not on the allowed list is refused

**Prompt:** same pattern as above. Point Claude Code to the "Deployment Plan" sections 4 and 5 and the golden rules. Ask it to plan first, and to use the Supabase advisor before calling it done.

---

## Phase 4: Live demo (a few days)

- Deploy to a Vercel preview link with staging keys
- Test on your own phone, on cell data, end to end
- Demo it to a friendly owner (your roommate is good practice even though fencing isn't a target) and to the first interviewees
- Read every chat transcript afterward

**This is the version for the MBA 571 presentation.**

---

## Not yet (don't let anyone talk you into these early)

- Owner login portal (email alerts are enough for pilots)
- Jobber / Housecall Pro connection
- Text messages, Stripe, admin dashboard
- Multiple clients (one fake client until a real one signs)
- Satellite measurement, phone answering

---

## What the rest of the team does meanwhile

| Person | Track | Output |
|---|---|---|
| **Ethan** | Model testing: run `run-live` with Kimi plus one or two other models; collect real drywall test photos; review the chatbot prompt | Model pick with pass rates and cost |
| **Kristen** | Niche check: update the scorecard; count handyman and drywall repair businesses in the target metro | Updated scorecard + local count |
| **Linda + 5th member** | Mystery-shop 20 to 30 local businesses; book 10 owner interviews | Response-time table + interview schedule |
| **Donny** | Run Claude Code phases 0 to 3; practice the interview with the roommate | Working demo |

---

## Weekly check (15 minutes)

1. Did the golden set pass this week? (number)
2. What broke?
3. What did owners or the mystery shop teach us?
4. Is anything being built that's on the "Not yet" list?

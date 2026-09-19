# Quotebot starter kit (v0.1)

A starting repo for building Quotebot with Claude Code: Opus plans and reviews, Sonnet and Haiku agents do the work.

**The one idea to remember:** build the widget, demo page, engine, and prompt **once**. Each new client is just a folder of settings in `clients/`. That's what makes it repeatable and cheap.

## How a customer chat works

```
Customer message / photo
        |
        v
  Chatbot model (Kimi, GPT, or Claude)  --- asks questions, reads photos
        |
        |  calls get_estimate with the details (JSON)
        v
  engine/price.js  --- plain code, the client's signed rules
        |
        |  status + price range (or "needs a human")
        v
  Chatbot writes the reply
        |
        v
  engine/guard.js  --- blocks any price the engine didn't produce
        |
        v
  Customer sees the estimate card, leaves name + phone
        |
        v
  Owner gets the lead (text / email, later Jobber or Housecall Pro)
```

During testing, a GPT model grades every test chat using `validator/RUBRIC.md`.

## What's in here

| Path | What it is | Status |
|---|---|---|
| `CLAUDE.md` | Orchestrator instructions for Claude Code | Ready |
| `.claude/agents/` | 6 subagents (3 Sonnet, 3 Haiku) | Ready |
| `engine/` | Pricing engine + reply guard + 14 tests | Working |
| `schemas/` | Rules file schema | Working |
| `bot/` | Chatbot prompt template + tool definition | Ready to wire up |
| `validator/` | Golden set runner + GPT judge rubric | Runner works; judge needs an API key |
| `design/` | Design tokens + design rules | Ready |
| `clients/_template/` | Blank client files | Ready |
| `clients/example-drywall/` | Fake demo client with 11 test cases | Working (fake numbers) |
| `docs/PROJECT_BRIEF.md`, `docs/DECISIONS.md` | The plan in short + dated decisions (Claude Code loads both every session) | Ready |
| `docs/` | Build plan, owner interview script, client pipeline | Ready |
| `docs/plan/` | Full planning docs: working doc, build framework, deployment plan, market research | Reference |
| `.claude/commands/` | `/plan-check` and `/log-decision` for Claude Code | Ready |
| `lib/`, `app/api/chat/` | Chat backend: rules loading, prompt builder, theme, model connection, test mode | Phase 1 |
| `app/dev/` | Team test chat page (hidden in production) | Phase 1 |
| `widget/widget.js` | Embeddable chat widget, one script tag (copied to `public/widget.js` on dev/build) | Phase 2 |
| `app/demo/[clientId]/` | Branded demo page, chat open inline | Phase 2 |
| `app/api/client/`, `app/api/lead/` | Public branding for the widget; lead form checks (saving comes in Phase 3) | Phase 2 |

## Spending caps

Fill this in as accounts are created. Every paid account needs a cap before go-live.

| Account | Cap | Set by | Date |
|---|---|---|---|
| OpenRouter / Moonshot | | | |
| OpenAI (GPT checker) | | | |
| Vercel | | | |
| Supabase | | | |
| Resend | Free tier (3,000/mo, 100/day) | | |

## Try it

```
npm install       # once
npm test          # engine, guard, and lib tests
npm run golden    # 11 drywall test cases through the engine
npm run dev       # app at http://localhost:3000, test chat at /dev,
                  # demo page at /demo/example-drywall, bare embed at /embed-test.html
npm run live      # with the app running: plays the golden set through /api/chat
```

Needs Node 22 or newer.

**Test mode.** With no `OPENROUTER_API_KEY`, local dev runs a scripted stand-in for the chatbot. It asks the questions from the client's rules one at a time and still runs the real pricing engine and guard, so the whole app can be built before the keys exist. It can't understand free text, so `npm run live` results in test mode only prove the harness works. Production never falls back to test mode.

## Where to start

Follow `docs/BUILD_PLAN.md`. It has the build order, what "done" means for each phase, and prompts to paste into Claude Code.

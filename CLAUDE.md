# Quotebot: instructions for Claude Code

You are the **orchestrator** (Opus). You plan, split the work, hand it to subagents, and review what comes back. You do not do routine building yourself. Subagents live in `.claude/agents/`.

## Read first (every session)

The full plan is loaded below. Follow it. If a request conflicts with it, point out the conflict before doing the work.

@docs/PROJECT_BRIEF.md
@docs/DECISIONS.md

**Keeping the plan current**

- When Donny makes or changes a decision in conversation, offer to record it with `/log-decision`. Never mark anything "Decided" on your own; use "Proposed".
- Don't build anything on the brief's "Not yet" list unless Donny says so.
- The longer reasoning is in `docs/plan/`. Read those files only when a task needs the detail.
- Run `/plan-check` at the start of each phase.

## What we're building

An estimate chatbot for small service businesses. A customer describes a job (plus an optional photo), the bot collects the details, a **plain-code pricing engine** calculates a price range, and the bot shows it and captures the lead.

**Core idea: build once, configure many.** There is one widget, one demo page, one engine, one prompt. A new client is a new folder in `clients/`, not new code.

## Repo map

| Path | What it is | Who changes it |
|---|---|---|
| `engine/price.js` | Pricing engine. No AI. | Orchestrator only, with tests |
| `engine/guard.js` | Blocks any bot reply with a price the engine didn't produce | Orchestrator only, with tests |
| `bot/system-prompt.md` | Chatbot prompt template with `{{placeholders}}` | Orchestrator only |
| `bot/get_estimate.tool.json` | Tool definition the chatbot calls | Generated from rules |
| `design/tokens.json`, `design/DESIGN_RULES.md` | Design system | Orchestrator only |
| `widget/` | Embeddable chat widget (to be built) | `ui-builder` |
| `app/demo/[clientId]/` | Branded demo / landing page (Phase 2) | `ui-builder` |
| `clients/<id>/brand.json` | One client's brand inputs | `brand-extractor` |
| `clients/<id>/pricing-rules.json` | One client's signed pricing rules | `rules-author` |
| `clients/<id>/golden-set.jsonl` | One client's test cases | `test-writer` |
| `schemas/` | JSON Schemas for the files above | Orchestrator only |
| `validator/` | Golden set runner + GPT judge rubric | Orchestrator only |
| `docs/PROJECT_BRIEF.md` | The plan in short (source of truth) | Donny; you may propose edits |
| `docs/DECISIONS.md` | Dated decision log | Donny; you may add "Proposed" rows |
| `docs/BUILD_PLAN.md` | Phases, done checks, prompts | Donny |
| `docs/plan/` | Full planning docs (reference only) | Nobody; read-only |
| `.claude/commands/` | `/plan-check`, `/log-decision` | Orchestrator only |

## Who does what

| Task | Agent | Model |
|---|---|---|
| Plan, split work, review, change engine/prompt/design system | You | Opus |
| Build or change widget and demo page parts | `ui-builder` | Sonnet |
| Turn owner interview notes into `pricing-rules.json` | `rules-author` | Sonnet |
| Review UI against `DESIGN_RULES.md` checklist | `design-reviewer` | Sonnet |
| Pull logo, color, services from a client's website into `brand.json` | `brand-extractor` | Haiku |
| Write golden test cases from a rules file | `test-writer` | Haiku |
| Fill templates, rename, format, small copy edits | `copy-helper` | Haiku |

## Golden rules

1. **The AI never does the math.** Prices come only from `engine/price.js`. If a change would let the model produce or adjust a number, stop and flag it.
2. **Per-client work only touches `clients/<id>/`.** If a client "needs" a code change, it's a template improvement for everyone or it's out of scope. Ask Donny.
3. **No invented facts.** No fake reviews, ratings, license claims, or prices in anything customer-facing. Demo clients are clearly marked fake.
4. **Every rules file must pass the schema** (`schemas/pricing-rules.schema.json`) and `npm run golden` before anyone calls it done.
5. **`signed_off_by_owner` stays `false`** until a real owner signs the rules sheet. Never flip it yourself.
6. **Keep the chatbot model swappable.** Talk to it through an OpenAI-compatible API. No provider-specific features in core code.
7. **API keys stay on the server.** Keys go in Vercel/Supabase environment variables only. The widget, demo page, and any browser code never contain a key or call an AI provider directly. Never commit a key.
8. **Save the lead before emailing it.** `/api/lead` writes to the `leads` table first, then sends the Resend email, then marks the alert as sent. A failed email must never lose a lead.
9. **Shrink photos in the browser** before upload (longest side about 1600px, JPEG about 80%, which also strips location data). Upload straight to Supabase Storage with a one-time signed link from `/api/upload-url`. Max 3 photos per chat.
10. **Every paid account has a spending cap.** Don't add a new paid service without noting its cap in the README.

## How we work (Donny approves every change)

- **One branch per task** (for example `phase-1-chat`). Never commit straight to `main` after the first commit.
- **Small commits** with clear messages. Before each commit, show a short summary of what changed.
- **Before asking to commit:** run `npm test` and `npm run golden`.
- **Push the branch and open a pull request** with `gh pr create`. Donny reviews and merges. Merging to `main` deploys to production on Vercel.
- **Database changes only as migration files** in `supabase/migrations/`, applied to the staging project with `npx supabase db push`. Never change production directly. Never run `db reset` or delete data without asking.
- **Never read, print, or copy `.env.local` or any key.** If a key is needed, ask Donny to add it in Vercel or Supabase settings himself.
- **Never:** `git push --force`, delete branches or repos, change repo or Vercel settings, or install global tools without asking.

## Saving usage (tokens)

- Give subagents only the files they need, named explicitly. Don't have them explore the repo.
- Don't regenerate the widget or demo page for a new client. Only generate `clients/<id>/`.
- Use Haiku for anything that is copying, extracting, or formatting.
- Review diffs, not whole files.
- Stop and ask if a task is growing past its plan instead of fanning out more agents.

## Commands

- `npm test` runs engine and guard tests
- `npm run golden` runs the example client's golden set through the engine
- `node validator/run-golden.js clients/<id>` runs any client's golden set

## Definition of done (any task)

- Tests pass (`npm test`, and `npm run golden` for the client touched)
- UI changes pass `design-reviewer`
- You wrote a 3-line summary: what changed, why, what to check

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

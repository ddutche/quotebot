# Quotebot: Decision Log

Newest first. **Only Donny adds "Decided" entries.** Claude Code may add "Proposed" entries for Donny to confirm, using `/log-decision`.

| Date | Decision | Status | Source |
|---|---|---|---|
| Sep 17, 2026 | Claude Code gets the full plan through `docs/PROJECT_BRIEF.md` (auto-loaded) and this log; long docs live in `docs/plan/` | Adopted | Donny's request |
| Sep 16, 2026 | Claude Code does the git, GitHub, and Supabase work on Donny's computer; Donny approves every command and merges every pull request | Decided | Donny |
| Sep 16, 2026 | Workflow: one branch per task, pull requests, tests before commits, database changes only as migration files to **staging** | Adopted | Setup guide |
| Sep 16, 2026 | Private GitHub repo `ddutche/quotebot` | Adopted | Setup guide |
| Sep 16, 2026 | Build order: bot brain → widget → saving leads → live demo | Adopted | Build plan, started by Donny |
| Sep 16, 2026 | Stack: Next.js (JavaScript) on Vercel + Supabase; Node 22 | Adopted | Build plan |
| Sep 16, 2026 | No streaming chat replies for now (the guard must read the full reply first) | Adopted | Build plan |
| Sep 15, 2026 | Lead alerts by email (Resend free tier); every lead saved in Supabase before emailing | Decided | Donny |
| Sep 15, 2026 | Spending caps on every paid account | Decided | Donny |
| Sep 15, 2026 | API keys only on the server, never in browser code | Decided | Donny |
| Sep 15, 2026 | Photos shrunk in the browser before upload (also strips location data) | Decided | Donny |
| Sep 15, 2026 | Stripe: later (pilots are free) | Deferred | Donny |
| Sep 15, 2026 | Shared password manager: later; until then only Donny holds production keys | Deferred | Donny |
| Sep 15, 2026 | Claude builds (Opus orchestrates, Sonnet and Haiku agents execute) | Decided | Donny |
| Sep 15, 2026 | Kimi runs the live chatbot; the newest GPT model checks the chatbot during testing | Decided | Donny |
| Sep 15, 2026 | One clean, repeatable design framework Claude can build from cheaply | Decided | Donny |
| Sep 15, 2026 | Start with trades that have small price swings and easy-to-describe damage; mechanics are out for now | Decided | Donny |
| Sep 15, 2026 | Validate the market with a static site and a free version that leads to paid | Decided | Donny |
| Sep 15, 2026 | Sell with setup fee + monthly retainer; open to SaaS or other models | Decided (amounts open) | Donny |
| Sep 15, 2026 | Product is a widget on the client's existing site, not a rebuilt website (rebuilt sites only as sales demos) | Recommended | Build framework |
| Sep 15, 2026 | First target: handyman and drywall repair businesses | Recommended | Market research |
| Sep 14, 2026 | Start with predictable-pricing services | Agreed | Group chat |
| Sep 14, 2026 | The bot gives an estimate or range, never a firm quote, with a "price can change" note | Agreed | Group chat |
| Sep 14, 2026 | Photos are a must-have | Agreed | Group chat |
| Sep 14, 2026 | The AI can be flexible in conversation but never invents prices, skips business rules, ignores safety, or assumes missing info (Ethan's 4 layers) | Agreed | Group chat |
| Sep 14, 2026 | Learn pricing from 1 or 2 real businesses; owners sign off on their rules | Agreed | Group chat |

**Status key:**

- **Decided:** Donny confirmed.
- **Adopted:** in the plan Donny is following.
- **Agreed:** group chat consensus.
- **Recommended:** proposed in research, not confirmed.
- **Deferred:** later.
- **Proposed:** waiting on Donny.

# Quotebot: Decision Log

Newest first. **Only Donny adds "Decided" entries.** Claude Code may add "Proposed" entries for Donny to confirm, using `/log-decision`.

| Date | Decision | Status | Source |
|---|---|---|---|
| Oct 25, 2026 | The company name is Scoparity (scope + clarity); the checkbox logo with the teal check is the primary mark. `/` is now the Scoparity company site instead of a redirect to the demo. | Proposed | Donny (chat) |
| Oct 25, 2026 | Sample contractor site at `/example-customer` uses a new fictional client, `brightwater-drywall` (Suffolk ZIPs, 555-01xx phone), so the demo matches the Long Island plan. | Proposed | Donny (chat) |
| Oct 25, 2026 | The widget element gets a public `open()` method so a host page's own "Get a price" button can open the chat. | Proposed | Donny (chat) |
| Sep 19, 2026 | `vercel.json` sets the framework to Next.js. The Vercel project was imported before the repo was a Next.js app. | Proposed | Donny (chat) |
| Sep 19, 2026 | Phase 2 photos go only with the message they're attached to. Later turns get a text note. Phase 3 moves photos to Supabase Storage. | Proposed | Donny (chat) |
| Sep 19, 2026 | Phase 2 lead form: demo clients get an honest "Demo: in the live version, the owner gets these details right away." Nothing is saved or sent until Phase 3. | Proposed | Donny (chat) |
| Sep 19, 2026 | Demo clients don't get a made-up logo. `logo_url` stays empty and the business name shows as text. | Proposed | Donny (chat) |
| Sep 19, 2026 | Phase 0 is done: private repo pushed, GitHub, Vercel, and Supabase set up | Proposed | Donny (chat) |
| Sep 19, 2026 | Node 22 is the minimum. `BUILD_PLAN.md` still says Node 20; this replaces that. | Proposed | Donny (chat) |
| Sep 19, 2026 | Build in test mode until the OpenRouter and OpenAI keys exist. Test mode is a scripted stand-in that still uses the real engine and guard. Production never uses it. | Proposed | Donny (chat) |
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

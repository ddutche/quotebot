# The repeatable pipeline

Same steps for every client. The model column is where the work runs, which is what keeps it cheap.

## A. Sales demo (before they're a client)

| Step | What happens | Who / model | Output |
|---|---|---|---|
| A1 | Find the business, confirm they fit the target | Person | Row in the lead sheet |
| A2 | Pull brand and services from their site | `brand-extractor` (Haiku) | `clients/<id>/brand.json` |
| A3 | Copy the trade's sample rules with **clearly fake demo prices** | `copy-helper` (Haiku) | Demo rules file |
| A4 | Open the demo page with their logo and color | Template, no AI | Link to send |
| A5 | Call or visit, show the demo | Person | Interview booked |

Target: a demo takes under 15 minutes of human time and a few cents of AI.

## B. Onboarding (they said yes to a pilot)

| Step | What happens | Who / model | Output |
|---|---|---|---|
| B1 | Owner interview (`docs/owner-interview.md`) | Person | Notes |
| B2 | Notes into rules | `rules-author` (Sonnet) | `pricing-rules.json` + questions |
| B3 | Answer the questions with the owner | Person | Updated rules |
| B4 | Owner signs the plain-English rules summary | Owner | `signed_off_by_owner: true` (set by a person) |
| B5 | Write test cases | `test-writer` (Haiku) | `golden-set.jsonl` |
| B6 | Engine check | `npm run golden` (no AI) | All pass |
| B7 | Chatbot runs every golden case, GPT judges it | Chatbot model + GPT judge | Pass rate report |
| B8 | Fix prompt wording or rules until the ship bar is met | Orchestrator (Opus) | Passing report |
| B9 | Design check | `design-reviewer` (Sonnet) | PASS |
| B10 | Install the widget on their site | Person | Live |

## C. Running (every week)

| Step | What happens | Who / model |
|---|---|---|
| C1 | Read flagged chats and judge results | Person |
| C2 | Compare estimates to final invoices for booked jobs | Person, with a simple sheet |
| C3 | Add failures to the golden set | `test-writer` (Haiku) |
| C4 | Update rules when the owner changes prices | `rules-author` (Sonnet) |
| C5 | Send the owner a short report: chats, estimates, leads, booked jobs | Template |

## What never happens

- Building a new website per client
- An Opus session for routine client setup
- Going live without a signed rules sheet and a passing golden set

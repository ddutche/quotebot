---
description: Record a decision in docs/DECISIONS.md and update the brief if needed
argument-hint: <the decision in plain words>
---

Record this decision: $ARGUMENTS

1. Add a row at the top of the table in `docs/DECISIONS.md` with today's date.
   - Status is "Decided" only if Donny said so in this conversation. Otherwise use "Proposed".
   - Source is "Donny" or wherever the decision came from.
2. If it replaces an older row, change that row's status to "Replaced (see <new date>)".
3. If it affects `docs/PROJECT_BRIEF.md` (who it's for, stack, phase status, business model, "Not yet" list, open questions), update that section and the "Last updated" line.
4. Keep the writing plain: short sentences, no em dashes.
5. Show Donny the diff and ask before saving. After approval, commit on the current branch with the message `docs: log decision`.

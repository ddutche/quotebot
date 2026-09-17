---
description: Re-read the plan and report where the project stands, without changing anything
argument-hint: [optional focus, e.g. "phase 1"]
---

Read `docs/PROJECT_BRIEF.md`, `docs/DECISIONS.md`, and `docs/BUILD_PLAN.md`. Then look at the repo: `git status`, the last 10 commits, which files for the current phase exist, and the result of `npm test`.

Focus (if given): $ARGUMENTS

Report in 15 lines or fewer:

1. Current phase and what "done" means for it
2. What's built vs still missing for this phase
3. Any conflicts: between the docs, or between the docs and the code
4. Open questions that block this phase
5. The next 3 concrete steps you propose

Don't change, create, or commit any files.

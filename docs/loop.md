# Autonomous hourly improvement loop

Last touched: 2026-06-13

Mahdy authorized an hourly loop (msg #130): "make better, fix the bug, make the
assets good, just iterate until you feel its quite good."

## What each iteration does
1. Read `index.md` → route to the relevant docs (don't re-read everything).
2. Boot the dev server (see dev-environment.md) and load it in agent-browser.
3. Pick **ONE** improvement: a roadmap item (design.md), a bug found in QA, or
   an asset/polish pass. Small, shippable, verifiable in one hour.
4. Implement it. Keep each doc < 70 lines; keep code tidy.
5. **Verify**: `tsc --noEmit` exits 0 AND the feature works in the browser
   (screenshot the change; check console has no errors; confirm no regression
   to walk/tame/party).
6. Commit + push to `main` (loop is authorized to push — ship.md).
7. Append a `log.md` entry. Update "Last touched" on edited docs.
8. Send a SHORT update to game-development: what changed + 1 screenshot.
   If nothing meaningful improved, say so briefly rather than padding.

## Guardrails
- Never push if tsc fails or the build/feature is broken — fix or revert first.
- One focused change per iteration beats a sprawling half-finished one.
- Don't regress the core loop (explore → approach → tame → party).
- Respect cost rules: image gen via Higgsfield only; no video without permission.
- If blocked or a decision needs Mahdy, ask in game-development and skip the push.

## Stopping
Keep iterating until the game feels "quite good" (Mahdy's bar). When the roadmap
is substantially done and polish is diminishing, propose pausing the loop.

# In-game help acceptance candidate

The acceptance drives the real setup and generated-game routes at both pinned viewports. It checks the original help topics and concise behavior copy, scroll and focus handling, saved match bytes, an active attack selection, and a paused computer turn. `help.module.mock.txt` and `candidate.mjs` overlay disposable UI/controller source for the mock run; there is no test-only browser injection.

Run `node docs/prototypes/help/replay.mjs docs/prototypes/help/preflight-<unique-id>` in the pinned Playwright image. The replay expects setup acceptance to fail on current source, the TypeScript build and full new suite to pass with the candidate, fail after removing help copy and computer pause independently, then pass after restoring the candidate. It restores original source bytes in `finally` and records exit codes and before/after SHA-256 hashes. Screenshots and logs remain in that unique evidence directory.

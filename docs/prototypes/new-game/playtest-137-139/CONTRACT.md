# Current playable flow: bounded playtest of issues #137–#139

Main session implements the investigation; independent MiniMax M3 reviews, as selected by the owner on 2026-10-17. This is evidence gathering before gameplay dispatch, not T33 or approval of its appearance/pacing.

Scope: reproducible browser probes and retained evidence comparing the current root and the owner-confirmed generated-game URL. Use seed 1994, four seats, one human/three computers, ordinary legal actions, real downloads/uploads and both desktop layouts. Observe selection/repeat behavior, manual Stop, capture interruption/choice, pending save/resume and visible map annotation. No runtime, historical rules/save semantics, goldens or inherited assertions may change. Do not infer the owner's exact historical attack history from a new reproduction.

Done when:
1. `python3 docs/prototypes/new-game/playtest-137-139/run.py` passes four browser probes (two flows at two layouts), retaining screenshots, raw output, URLs, saves/action histories, source hashes and immutable fresh evidence directories.
2. `npm run build` and `git diff --check` pass. The runtime and inherited tests match the parent byte-for-byte. The report separates observations from proposed design, accounts for gaps, and recommends the next scope under rule 11 without declaring T33 ready or owner-approved.

The observations are characterization, not acceptance of click-to-attack or a claim that the legacy route is fixed. Runtime correction, new interaction design and readability changes require their own agreed scope/preflight. Reviewer should independently repeat the probes and inspect screenshots and saved histories; preserve fresh review evidence before harness cleanup.

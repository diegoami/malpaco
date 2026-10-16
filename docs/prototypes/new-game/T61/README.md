# Projection regression correction

The old projection divided a dot product by `Math.hypot(dx, dy) ** 2`.
Taking a square root and squaring introduces rounding: a full coincident edge can
project just short of 1. Subtraction then emits a microscopic or zero-length
interior residual. Use the same squared components as the numerator instead.
No coordinate or area tolerance changes; positive residual intervals remain.

`residual.test.mjs` retains the chosen T60 A and published T25 boards, direct
sloped/reversed-edge controls, a slit below accumulated area tolerance, a shortened
shared edge, and tiny positive-area overlap. A fails on the original arithmetic
(eight false boundaries), while the T25 published board and synthetic controls
already passed; these are preservation controls, not claims of newly failing tests.
The original issue also cited a machine-local T25 build-M57Mvc draft: this checkout
does not contain it, so no reproduction of that particular draft is claimed.

Evidence includes original failure, mock correction with exact restoration,
acceptance, and three killed mutants: reverted projection, suppressed exposed
boundaries, and suppressed overlap. `restoration.json` records byte restoration.
Retained historical reports and hash indexes describe their original source and
are unchanged. The current cells check now accepts A; its 30 old midpoint conflicts
remain for T62 to address through an owner-approved contract.

Raw failure logs with terminal-generated trailing spaces are retained byte-for-byte
in `raw-logs.tar.gz` and in the earlier commits, and ignored as loose local files.
Inspect without altering the archive with `tar -xOzf docs/prototypes/new-game/T61/raw-logs.tar.gz evidence/baseline.txt`.
The original `hashes.json` describes the earlier capture. `hashes.v2.json` updates
the README and indexes archive bytes and every original archived member separately.
Final PR whitespace verification uses `git diff --check main...HEAD`, covering
committed changes as well as the task's working-tree command.

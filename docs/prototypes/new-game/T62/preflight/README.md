# Parent T62 acceptance preflight

Run before dispatch: `python3 docs/prototypes/new-game/T62/preflight/run.py`.
This intentionally requires the implementation files to be absent. The equality
mock only proves the test interface and fixture mutations are feasible; it is not
a geometry implementation or measured proposal. All mock sources are removed in
finally. Guard tests are parent-authored and immutable for the implementer.
The requested API is `checkConstraint(group, board)` from T62/contract.mjs,
returning an array of failures for attachment, water, traceability and preserved.
Each group must evaluate its own geometry/invariants, so another group's refusal
cannot hide a bypass. Positive A and negative inputs are paired in every group.
A subpixel route is a gap bypass; any proposed numeric minimum remains [designed].

The exact original terminal logs are losslessly archived and ignored locally;
records.json summarizes exits, hashes.json pins the preflight source and archive.
Preserve these files on implementation/reproduction; use fresh output paths.
DW6 was checked through the staged/full branch diff before dispatch.

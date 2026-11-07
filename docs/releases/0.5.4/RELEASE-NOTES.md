# Malpaco 0.5.4

Clearer turn/result controls and a scoreboard that fits a phone. Web delivery;
rules, AI, map/save identities and dependencies retain their previous behavior.

- End turn uses the owner-selected Oxygen green tick in Icons/Auto mode instead
  of the flag. Its name, tooltip, keyboard use and pending-choice safeguards stay.
  Editable source, authors and licence notices ship locally and are linked in Help.
- The completed-game popup's large primary action always says **New game**, even
  in Icons mode. It opens setup; Start still begins the next match. Ordinary
  in-game commands retain the selected label mode, and scores record once.
- Phone scoreboards show labelled entries with all six fields; wider screens
  keep the table. The rules filter has readable text and a usable touch target.
- Exact known configurable-replenishment results group under Legacy. Only
  attributable retained outcomes move from Earlier games; unknown older totals,
  overall totals, ids and history caps remain. A per-row marker prevents repeated
  reclassification and survives compatible v0.5.3 reads/writes. Filters offer only
  groups with recorded outcomes.
- The player launcher/game shows its package version at the top right. Help and
  the illustrated manual read the same package version; diagnostic views retain
  their existing appearance. Guide text and the eight selected images are maintained.
- New regressions cover Help with the opposite next-game combat setting in both
  directions. Current review instructions cite the correct numbered rules.

Both combat presets and old kept games retain their immutable rules and recorded
histories. Native delivery, AI/balance research, save-failure reliability and broad
source-suite CI policy remain separate. Compatible forward fixes are preferred;
v0.3.1 is not a routine rollback because #372 records data loss there.

Source/CI/byte receipts and review decisions belong to
[milestone #457](https://github.com/diegoami/malpaco/issues/457). These notes are
not a publication receipt. [Acceptance](ACCEPTANCE.md) defines the remaining gates;
earlier published tags and assets stay unchanged.

# Player manual maintenance

The owner requested a complete illustrated manual and current inline Help (#398).
The owner explicitly authorized selected manual screenshots in Git on 2026-10-29;
this is a narrow exception to rule 6, not a change to general artifact retention.

## Sources and outputs

- `docs/play.md`: complete player instructions, captions and screenshot references.
- `src/ui/help.ts`: short in-game instructions and the current match's objective/tie rule.
- `docs/manual-images/`: eight curated PNGs and their capture provenance.
- `tests/e2e/player-manual.spec.ts`: real UI states and Help/manual navigation checks.
- `tools/manual/render.mjs`: renders the same Markdown into `/manual/index.html` in development and builds. No separate hand-edited HTML copy.
- `artifacts/player-manual/`: portable HTML, images and provenance; generated, never committed.

## Required alongside a gameplay or UI change

1. Check the affected guide section and in-game Help against the code. Update both in the same PR; for an unaffected surface, explain why no update is needed in the PR's Docs changed section.
2. For changes to a pictured state or control, run `npm run manual:refresh`. It uses the installed Playwright browser, captures real retained-game states, replaces the curated set and builds the offline copy. The command does not deploy or modify published tags/assets.
3. Inspect every refreshed picture with its caption. Check both desktop and phone. Images show example retained games, so their rules/map differ from fresh default games; never label them as fresh default state. A browser capture does not establish physical-device or screen-reader testing or owner visual acceptance.
4. Run build/root types and the affected browser specs, including `npx playwright test tests/e2e/player-manual.spec.ts --project=1280x800`. Full extracted-playable CI must pass before merge. It checks that the manual and its images really ship in the archive, and that Help reports the actual kept rule.
5. Commit the source guide, Help changes and selected illustrations/provenance together. Keep other screenshots and proof logs in `artifacts/`. Upload a portable manual bundle through `tools/artifacts.py` when retaining a review copy; do not change historical release assets.

The provenance records the capture command, Playwright version, source commit and whether the working tree was dirty. For dirty captures, commit the corresponding source with the images; do not claim they are exact clean-head release evidence. Hashes describe the generated portable files at capture time. A later text change requires a new refresh so the bundle matches.

## Capture inventory

| Image | State / interaction |
| --- | --- |
| launcher.png | Fresh launcher, Start above five next-game settings. |
| map.png | Real human attack turn, before source/target selection. |
| attack.png | Legal adjacent pair selected without committing an exchange. |
| phone.png | The same selection at 390×844, accessible Attack icon. |
| capture.png | Pending capture, amount controls and explicit confirmation. |
| cards.png | Actual retained hand opened with Your cards while paused. |
| event.png | Storm changes before the three-second deadline. |
| results.png | Expanded Domination result, New game/Standings/Details available. |

The fixture searches and immutable recorded matches are shared with existing
behavior tests. Do not edit a saved fixture to make a prettier picture. If a state
needs replacing, produce it through legal actions and explain the change.

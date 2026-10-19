T77 review (claude-opus-high)
approve after named fixes
DW1: ran `test -s docs/plans/responsive-ui/PROPOSAL.md` and `test -s docs/plans/responsive-ui/SOURCES.md` → both exit 0. I read both files in full. The pinned manual revision and its limits are in SOURCES.md:8-41. The source-cited 0.1.1 assessment is in SOURCES.md:43-67. The recommendation and the alternative are in PROPOSAL.md:1-8 and PROPOSAL.md:214-232. Retain/change/omit is in PROPOSAL.md:40-46, and current gaps are in PROPOSAL.md:29-38. All of these are explicit. I checked the claims against the 0.1.1 source myself (see below).
DW2: ran `test -s docs/plans/responsive-ui/WIREFRAMES.md` → exit 0. Sketches exist for phone portrait (L15), phone landscape (L58), tablet portrait and landscape (L91), desktop (L126), capture with folded/paused/keyboard variants (L158), and cards/Raid target/candidate picker (L201). The arithmetic for map area, tool rows and insets checks out at every size: 390×844→374×570/526, 320×568→304×264, 844×390→476×305/261, 568×320→552×148, tablet 424×952 and 680×696, desktop 896×728 and 1536×1008. No sketch promises a readable tiny full board. One gap: on phones, where End turn and Move armies go during the attack phase is not shown (R1).
DW3: ran `test -s docs/plans/responsive-ui/ACCEPTANCE.md` and `test -s docs/plans/responsive-ui/BACKLOG.md` → both exit 0. The viewport and minimum-size matrix (L17-26) is present, along with touch, keyboard, Escape, browser zoom and game-camera zoom, safe areas, overflow and reduced motion (L35-82). State, RNG and UI invariants across resize are in L84-108. Click-driven scenarios A1–A11 are in L110-130, and owner appearance decisions in L139-146. Backlog items P1–P8 are each marked "Proposed / unscheduled" and give priority/difficulty, dependencies and measurable criteria. BACKLOG.md:3-7 and :49-52 deny any authorization.
DW4: ran `git diff --check 41621686a1584cbce826fcb6f60be8e3b819d1d8 HEAD` → exit 0, no output. Also ran `git diff --check` on the worktree → exit 0. The changed-file inventory is only the 5 owned planning files plus RUN-NOTES.md, which only has appended lines (+3 in 38600df1 by the main session, +2 in 6fbfd60a). The semantic self-audit of DW1–3 is in ACCEPTANCE.md:148-155 and RUN-NOTES. Owner decisions D1–D4 are in PROPOSAL.md:244-251 and BACKLOG.md:40-47. Validation limits are in SOURCES.md:3-6 and :69-78 and ACCEPTANCE.md:3-7. The docs claim no build, browser run or preflight.

Where I worked: worktree 196-review-1d1ce47a. HEAD = 6fbfd60ab7c8b204244602b99bd0a977e70d914a (`git rev-parse HEAD`), and the tree was clean.
- Diff base..head = 41621686..6fbfd60a: two commits (38600df1 RUN-NOTES plan entry, 6fbfd60a docs). Its sha256 a444fd9c… matches inventory.json.
- `git diff --stat 897a7a0b 41621686 -- src tests` is empty, so the worktree source is exactly the 0.1.1 release that SOURCES cites.
- The cited 0.1.1 source holds up:
  - The 350/440px sidebar is at styles.css:1180,1185, and there are no media queries other than ≥1600×1000 and reduced motion.
  - The 52px rail and 34/38px buttons are at styles.css:1436-1491.
  - clickProvince at referenceBattleGame.ts:135-157 places 1 army per tap, and an enemy tap after a source runs an immediate singleExchange unless Shift-inspecting. It is blocked while paused.
  - Key repeat is ignored (referenceBattleGame.ts:78).
  - Pause blocks human input, card actions and reward acknowledgment (battleController.ts:101, cardController.ts:71,82).
  - Discard comes before the draw (rules.ts:36,178) and HAND_LIMIT is 5.
  - Watch computers / Stop game is at victoryView.ts:33-34.
  - The five current preferences (threshold 2, speed normal, compact/detailed, top/side visibility) are in memory only, with no localStorage.
  - The battle log is complete and has a follow-latest flag (panel.ts:98-175).
  - The Escape order (surface first, then cancel/stop/deselect) is at referenceBattleGame.ts:50-55.
  - End turn and Move armies sit beside the battle controls in the attack phase (referenceBattleGame.ts:203-209).
- I fetched the pinned Pro manual files (README, guide, atlas, reference, coverage, checklist at 084c1087) read-only via `gh api …contents…?ref=084c1087…` into /tmp/opencode/mlp-review-Diusnj (kept). `gh api …/commits/main --jq .sha` → 084c1087119fcf45f0d0d2774eea7121487f1cb4, so no later correction exists. Every cited fragment resolves: atlas headings plus the explicit `<a id>` anchors interface/turns/trades/capture/persistence/country-readability. The manual claims match what SOURCES says about them:
  - seven E019-r0026 samples with one defender decrement and no capture (guide:223-239)
  - target-first attack in the static guide (guide:67, reference:99)
  - three lower panels (atlas V-O09)
  - capture, movement and card dialogs unobserved (coverage:51-69)
  - eleven checklist qualities
  - #259 and #278 as stated (reference:60, atlas:39,91, coverage:76-77)
- I found no copied Pro prose, assets or code, and the docs never describe the newly designed mobile behaviour as observed Pro behaviour.
- Mutation and rule-code checks (brief items 3 and 5) don't apply: the PR is documentation only, with no tests, rule code or randomness to mutate.

R1 (not blocking; named fix) WIREFRAMES.md:42-56 and :70-77. The phone portrait and phone landscape sketches leave out End turn and Move armies in the attack phase, though both are always shown next to the battle controls in 0.1.1 (referenceBattleGame.ts:203-209). The tablet sketch does show them (WIREFRAMES.md:113). With a source selected, the portrait dock needs a counts line, Once/Fight on/Stop/Inspect, and Move armies/End turn. That is at least two 44px button rows plus text, which doesn't fit the 88px context budget (L18, L43). So the stated 390×586 / 320×368 map stage is optimistic for the most common phase, and the owner's D4 judgement of "whether the dock leaves enough map" (ACCEPTANCE.md:143) rests on it. The actions are still reachable: the overflow rule (WIREFRAMES.md:55-56) and the flow text (PROPOSAL.md:171-173) keep them available, so this is not a blocked essential action. Fix: annotate where End turn and Move armies go on phones in the attack phase, and the map stage that results.

R2 (not blocking; named fix) PROPOSAL.md:107-115. The layout-rules table has no row for landscape screens narrower than 680px whose height is ≥320px, e.g. 640×360 and 667×375. Only 568px gets the compact 48+64 strip (PROPOSAL.md:115, WIREFRAMES.md:83-89). ACCEPTANCE.md:22 tests 667×375 as "Narrow/side-action transition" without saying which layout applies there. Using the portrait budget (56+144) at 667×375 would leave a 175px stage, and about 115px after a tool row. Fix: add a table row or rule for narrow, short landscape screens.

R3 (not blocking; named fix) PROPOSAL.md:236-241, BACKLOG.md:16-17,28-32. The bounded 0.1.2 option doesn't say what tablets get, i.e. widths ≥680px with height >500px. P6's acceptance covers portrait, functional landscape and current desktop regressions. P7 holds the tablet composition and the 768×1024–1920×1080 seams. Meanwhile 0.1.1 has no breakpoint below 1600×1000, so it shows a fixed 350px sidebar at 768px width. Tablets would fall between the two slices without a stated decision. Fix: state the tablet behaviour for the bounded option, or list it under D2.

R4 (not blocking) ACCEPTANCE.md:62 says "explicit buttons cover zoom/pan/focus", but no pan control is drawn or specified (WIREFRAMES.md:31, PROPOSAL.md:130-131). The working non-drag alternative appears to be Focus selection plus the Countries list and arrow-key navigation through countries. Fix: name the pan alternative or reword.

R5 (not blocking; wording) PROPOSAL.md:24-25. "The sampled battle distinguishes a casualty from capture" reads as observed Pro UI behaviour. The guide says only that G12 shows a defender decrement and "does not establish a capture" (guide:233, :71). Fix: credit the distinction to the manual's evidence rather than to an observed Pro screen. Low risk.

FILE: RUN-NOTES.md
FILE: docs/plans/responsive-ui/ACCEPTANCE.md
FILE: docs/plans/responsive-ui/BACKLOG.md
FILE: docs/plans/responsive-ui/PROPOSAL.md
FILE: docs/plans/responsive-ui/SOURCES.md
FILE: docs/plans/responsive-ui/WIREFRAMES.md
SCOPE: complete. I read all 6 changed files in full and checked them against the 0.1.1 source and the pinned manual. There are no executable or generated changes. I found nothing that breaks a blocking criterion: the planning-only boundary, source and unknown handling (#259/#278 still unresolved), the required orientations, a map-target or confirmation step hidden behind a sheet, and implementation authorization all hold.
Final pass done
approve after named fixes
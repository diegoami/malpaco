The six CI39262174494 geographic label failures reproduce unchanged at1280x800;
all six1920x1080 diagnostic scenes pass. The required40px input square overlaps
the T76 toolbar, not a geographic feature. At1280 the toolbar occupies
`x874,y167.375,width40,height258`. Actual hit elements are its NAV background,
Game actions/Cards buttons and their SVG children. Seed513 also has a second
obstructed province beyond the first failing canonical assertion.

The default hiding selector has lower specificity than the shared icon-button
display rule, exposing six navigation buttons instead of the intended two panel
toggles. Simply hiding the extra buttons would leave the two toggles and toolbar
background over the map, and would not address the topbar-hidden/sidebar-visible
state. The correction will place the toolbar entirely inside the visible sidebar:
the two expanded toggles beside reserved turn-heading space, or a compact row
above the turn card when the hidden topbar releases extra vertical space. The
52px collapsed-sidebar rail and exact board/map grid dimensions remain unchanged.
Parent accepted this bounded presentation correction before implementation.

Before runtime edits, the canonical six1280 corpus cases fail6/6 and the new
host/topbar-state toolbar guard fails4/4 (zero skipped/flaky). The guard checks
toolbar exclusion from the board, the intended two-toggle expanded state,
physical toolbar/sidebar command reachability and exact saved-state preservation.
The existing helper now uses already-visible save/load controls directly; compact
surfaces remain necessary when those controls are hidden. This permits the
intended expanded hiding without requiring an invisible Settings opener.

`diagnose/hit-metrics.json`, before screenshots, complete negative outputs,
commands and input hashes are retained in the diagnosis archive. Runtime source,
geographic tests and frozen acceptance are unchanged at this checkpoint.

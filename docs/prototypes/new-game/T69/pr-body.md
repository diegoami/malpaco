Closes #155

Claude CLI can now run through review.mjs using an explicitly selected claude-sonnet reviewer. It verifies the actual Claude model/session, excludes checkout-controlled settings, uses the trusted reviewer guard, retains local diff and evidence, and shares existing parsing/posting/labels and family/blocked checks. MiniMax remains the default.

Scope: tools/harness execution, selection, peek and fixture tests; harness roster; npm test includes offline guard checks; workflow documentation. No game changes. Full task: docs/tasks/T69.md. Main session implements; standing independent MiniMax reviews.

Validation in progress: offline fixture groups and shared parser/family self-tests pass; real explicit Claude backend trial, mutation controls and full unit/build verification follow. Draft only; no CI before approved final receipt.

Docs changed: docs/harness-claude.md, docs/process.md, docs/models.md, run-task procedure and RUN-NOTES.md. Reusable findings and adoption instructions will be posted on155.

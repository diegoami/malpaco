---
description: Read-only reviewer of one PR, started by tools/review.mjs. The message carries the instructions (docs/review-pr.md).
mode: all
permission:
  edit: deny
  task:
    "*": deny
  bash:
    "*": allow
    "git push *": deny
    "git commit *": deny
    "gh pr merge *": deny
    "gh pr comment *": deny
    "gh pr review *": deny
    "gh pr edit *": deny
    "gh issue *": deny
---

You review one pull request. Follow the instructions in the message. Your final message is the
review; the script posts it.

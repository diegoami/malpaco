# RUN-NOTES T06

Plan: add Inter 4.1 variable woff2 + OFL to public/fonts, @font-face (block), Inter first in stacks, fonts.ready in settle(), goldens from CI artifact.

- step 1: font, css, settle() wait. CI run 38403610993 failed on exactly the six goldens.
- step 2: goldens taken from that run's playwright-report artifact (six *-actual.png, Inter confirmed visually).

# Playable release verification

`acceptance.mjs <fresh-directory>` runs `npm run package:playable`, extracts the
archive into the supplied empty directory outside the checkout, checks the
archive and SHA-256 inventory, starts the bundled launcher on `127.0.0.1:4175`,
and requests the root plus each local HTML, CSS, and JavaScript asset reference.
`acceptance.mjs --verify-extracted <directory>` repeats the extracted-artifact
checks without rebuilding the archive.

The release Playwright config requires `PLAYABLE_EXTRACTED_DIR`, which points to
the parent directory containing `malpaco-playable/`. It starts that extracted
launcher on port 4175 with server reuse disabled. Set `PLAYABLE_EVIDENCE_DIR` to
a fresh path to send its HTML report and test results there. Both variables are
set by `verify-final.mjs` and CI.

Run the final-source verifier in the pinned Playwright image with:

```sh
TMPDIR=/artifact-evidence node docs/prototypes/playable/verify-final.mjs docs/prototypes/playable/final-<unique-run>
```

Use a persistent host mount for `/artifact-evidence` when running in Docker; the
verifier keeps the extracted package there, while logs, browser captures, and
their SHA-256 manifest go under the fresh `docs/prototypes/playable/final-*`
directory. Each run directory is exclusive and is never overwritten.

The initial baseline and disposable A/B/C candidate replay are retained under
`stage1-20261015/`. Replay directories have their own `SHA256SUMS`; do not edit
or replace them.

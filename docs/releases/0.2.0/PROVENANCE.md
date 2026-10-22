# 0.2.0 provenance

T90 (#209). This file pins exactly what is published as 0.2.0 and how to roll it back. The
published bytes are CI's own build of the reviewed tree; nothing is rebuilt for publication.

## The accepted tree

| | |
| --- | --- |
| Reviewed head | `f1aa5a104f8dd1ac9d64bf33e8e0faca04b7474a` (PR #239) |
| Merge on `main` | `cfa39ed37a4a683d4fe7441c9dfd0437da9b2405`, with the same tree as the reviewed head |
| Tree | `aba4d1f08505ff69c5bebc809e6814cbfe4dcc9b` (for both commits) |
| Tag | `v0.2.0` on `cfa39ed`, created by the release step below. This file and the release notes follow in a docs-only commit |
| Version | 0.2.0 in `package.json` and both `package-lock.json` entries |

## The archive

| | |
| --- | --- |
| Built by | CI run [39692085624](https://github.com/diegoami/malpaco/actions/runs/39692085624) on `f1aa5a1`, conclusion success |
| CI artifact | `malpaco-playable` (id 12389263419), 480,460 bytes, zip digest `sha256:89b578d66791e6df66f1014fc36426358643d83508625f0717964f1a6655daa2` |
| Contents | `malpaco-playable.tar.gz`, built with `VITE_MALPACO_RELEASE=1` (legacy views retired) |
| `BUILD.json` | `sourceCommit` must read `f1aa5a104f8dd1ac9d64bf33e8e0faca04b7474a`, `minimumNode` 22 |
| Archive SHA-256 | Taken at download and recorded in `PUBLICATION.md` and on the release as `malpaco-playable.tar.gz.sha256` |

## Evidence

- **CI on the reviewed head:** green. The same run's job "Browser tests against the extracted playable" ran the full release suite against this exact archive, including `release020-matrix.spec.ts` at the phone portrait and landscape, tablet and desktop sizes, and the A13 version-1 upload.
- **Independent reviews:** two on PR #239, "approve after named fixes" and then "approve", with the findings answered on the PR.
- **Acceptance record:** `ACCEPTANCE.md` (pinned-image runs). Device checks: `DEVICE-REPORT.md`.
- **Owner:** authorized publication on 2026-10-22 ("go ahead with T90"). The device pass (A12) and D4 stay open on the milestone issue #241, and no milestone review is wanted for 0.2.0 (owner, #241).

## Publication steps

These run on the owner's machine, where `gh` and the Netlify CLI are logged in. The cloud session
cannot reach GitHub's artifact storage, the tag and release APIs, or the Netlify site. Every
step publishes only what the previous one verified.

```sh
set -euo pipefail
mkdir -p ~/malpaco-0.2.0 && cd ~/malpaco-0.2.0
R=diegoami/malpaco SITE=4195ad92-b174-4e41-a6c4-8024619255c3

# 1. The exact CI archive, verified.
gh run download 39692085624 -R $R -n malpaco-playable          # malpaco-playable.tar.gz
sha256sum malpaco-playable.tar.gz | tee malpaco-playable.tar.gz.sha256
tar -xzf malpaco-playable.tar.gz
(cd malpaco-playable && sha256sum -c SHA256SUMS && cat BUILD.json)   # sourceCommit f1aa5a104f8d…

# 2. Netlify: draft, checked byte for byte, then production. Same site as 0.1.1, exact files, no build.
check() { (cd malpaco-playable && while read -r sum file; do
  [ "$(curl -fsS "$1/$file" | sha256sum | cut -d' ' -f1)" = "$sum" ] && echo "ok $file" || echo "MISMATCH $file"; done < SHA256SUMS); }
netlify deploy --site $SITE --dir malpaco-playable --no-build      # prints the draft URL and deploy id
check "<draft URL>"
netlify deploy --site $SITE --dir malpaco-playable --no-build --prod
check https://malpaco.netlify.app

# 3. The tag and the GitHub release on the accepted commit, with these notes and the same bytes.
gh api repos/$R/contents/docs/releases/0.2.0/RELEASE-NOTES.md -H 'Accept: application/vnd.github.raw' > notes.md
gh release create v0.2.0 malpaco-playable.tar.gz malpaco-playable.tar.gz.sha256 -R $R \
  --target cfa39ed37a4a683d4fe7441c9dfd0437da9b2405 --title "Malpaco 0.2.0" --notes-file notes.md
```

Paste the output of every step back to the main session: the hashes, `BUILD.json`, both `check`
runs and the deploy ids. It records them in `PUBLICATION.md` and updates the playable link.

## Rollback

- **Site:** 0.1.1's production deploy `6ad6041bb5d4e311f77ddf6d` stays in the site's deploy list.
  To restore it, use the dashboard (Deploys, then that deploy, then "Publish deploy") or
  `netlify api restoreSiteDeploy --data '{"site_id":"4195ad92-b174-4e41-a6c4-8024619255c3","deploy_id":"6ad6041bb5d4e311f77ddf6d"}'`.
- **Release:** mark `v0.2.0` as a pre-release, or delete the release. The `v0.1.1` release and its archive
  are untouched.
- **Saves:** 0.1.1 cannot be assumed to open saves made with 0.2.0. New games use generator v2
  and the place-name option, neither of which 0.1.1 knows. Rolling back the site does not migrate
  them; 0.1.1 saves still load in 0.2.0.

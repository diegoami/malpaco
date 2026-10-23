# 0.2.1 provenance

T99 (#248). This file pins exactly what is published as 0.2.1 and how to roll it back. The
published bytes are CI's own build of the reviewed commit; nothing is rebuilt for publication.

## The accepted commit

| | |
| --- | --- |
| Reviewed and accepted | `2b9924ef4f02a91c4c9b91a03bb29b3bd60594cd` (`main` after PR #268): milestone review #253, round 3, **AGREE** (2026-10-23), after AGREE on `6c951ed` and BLOCK on `219719e` (#266, #267, both fixed) |
| Tag | `v0.2.1` on `2b9924e`, created by the release step below. This file and the release notes follow in a docs-only commit |
| Version | 0.2.1 in `package.json` and both `package-lock.json` entries |

## The archive

| | |
| --- | --- |
| Built by | CI run [39858925242](https://github.com/diegoami/malpaco/actions/runs/39858925242), a `push` run on `main` at `2b9924e` itself, conclusion success |
| CI artifact | `malpaco-playable` (id 12461978676), 489,653 bytes, zip digest `sha256:3dbc805e6d8faf54aa88dc021ec4015995e455d03f68dce372de03c955338140` |
| Contents | `malpaco-playable.tar.gz`, built with `VITE_MALPACO_RELEASE=1` |
| `BUILD.json` | `sourceCommit` must read `2b9924ef4f02a91c4c9b91a03bb29b3bd60594cd` (a push run builds the commit itself, unlike 0.2.0's pull-request run), `minimumNode` 22 |
| Archive SHA-256 | Taken at download and recorded in `PUBLICATION.md` and on the release as `malpaco-playable.tar.gz.sha256` |

## Evidence

- **CI on the accepted commit:** green, including "Browser tests against the extracted playable" on this exact archive.
- **Milestone review:** #253, three rounds by an independent engine; the verdicts and findings are on the issue.
- **Acceptance record:** `ACCEPTANCE.md`, with the lines for T100, T101, T103 and T104.
- **Owner:** played T103 and T104 before they merged; the D4 judgment and the go-ahead for publication are on #253.

## Publication steps

These run on the owner's machine, where `gh` and the Netlify CLI are logged in. The cloud session
cannot reach GitHub's artifact storage, the tag and release APIs, or the Netlify site. Every step
publishes only what the previous one verified.

```sh
set -euo pipefail
mkdir -p ~/malpaco-0.2.1 && cd ~/malpaco-0.2.1
R=diegoami/malpaco SITE=4195ad92-b174-4e41-a6c4-8024619255c3

# 1. The exact CI archive, verified.
gh run download 39858925242 -R $R -n malpaco-playable          # malpaco-playable.tar.gz
sha256sum malpaco-playable.tar.gz | tee malpaco-playable.tar.gz.sha256
tar -xzf malpaco-playable.tar.gz
(cd malpaco-playable && sha256sum -c SHA256SUMS && cat BUILD.json)   # sourceCommit 2b9924ef4f02…

# 2. Netlify: draft, checked byte for byte, then production. Same site, exact files, no build.
check() { (cd malpaco-playable && while read -r sum file; do
  [ "$(curl -fsS "$1/$file" | sha256sum | cut -d' ' -f1)" = "$sum" ] && echo "ok $file" || echo "MISMATCH $file"; done < SHA256SUMS); }
netlify deploy --site $SITE --dir malpaco-playable --no-build      # prints the draft URL and deploy id
check "<draft URL>"
netlify deploy --site $SITE --dir malpaco-playable --no-build --prod
check https://malpaco.netlify.app

# 3. The tag and the GitHub release on the accepted commit, with these notes and the same bytes.
gh api repos/$R/contents/docs/releases/0.2.1/RELEASE-NOTES.md -H 'Accept: application/vnd.github.raw' > notes.md
gh release create v0.2.1 malpaco-playable.tar.gz malpaco-playable.tar.gz.sha256 -R $R \
  --target 2b9924ef4f02a91c4c9b91a03bb29b3bd60594cd --title "Malpaco 0.2.1" --notes-file notes.md
```

Paste the output of every step back to the main session: the hashes, `BUILD.json`, both `check`
runs and the deploy ids. It records them in `PUBLICATION.md` and updates the playable link.

## Rollback

- **Site:** 0.2.0's production deploy `6ad957b9f3e3531111decf98` stays in the site's deploy list.
  To restore it, use the dashboard (Deploys, then that deploy, then "Publish deploy") or
  `netlify api restoreSiteDeploy --data '{"site_id":"4195ad92-b174-4e41-a6c4-8024619255c3","deploy_id":"6ad957b9f3e3531111decf98"}'`.
- **Release:** mark `v0.2.1` as a pre-release, or delete the release. `v0.2.0` and its archive are
  untouched.
- **Kept games:** 0.2.1 keeps the player's game and scoreboard in the browser (`localStorage`);
  0.2.0 ignores them, so rolling back the site loses nothing it had, and returning to 0.2.1
  continues the kept game.

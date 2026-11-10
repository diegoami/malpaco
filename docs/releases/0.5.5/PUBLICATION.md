# 0.5.5 publication

Published **2026-11-09T23:20:04Z** from exact reviewed source/tag **v0.5.5**
`009e8272185d531c7d787befe5db2c2c46d0b588`, after the owner-launched
[MiniMax-M3 thinking AGREE review](https://github.com/diegoami/malpaco/issues/465#issuecomment-6710682709)
(no findings) and the owner's explicit publication authorization for the web and
Windows targets. No physical-device or screen-reader testing is inferred.

- [Play on GitHub Pages](https://diegoami.github.io/malpaco/).
- [Play on Netlify](https://malpaco.netlify.app).
- [Release and downloads](https://github.com/diegoami/malpaco/releases/tag/v0.5.5).
- Windows x64 setup and portable executables are attached to that release. Both
  are unsigned, require Microsoft Edge WebView2 Runtime, and use per-user app
  data rather than portable-folder saves.
- Web release plus Windows delivery; rules/AI, core/fixture trees, game
  save/replay identities and dependency versions unchanged.

The original successful CI archive was deployed to Netlify with **--no-build**;
both draft and production match all **27 payload files** byte for byte. The
source was promoted unchanged to `main` by PR #474: merge commit
`5787a7d83b28181895bfd0c32bee9e2d7e41ebee` has the identical reviewed tree
`6a64a9bbd029d9147ddb94270ed0f703ef0a8026`. GitHub Pages builds that same
source for `/malpaco/`, so its host-relative build is verified against its own
Pages artifact. All **23 live Pages files** match that artifact byte for byte.

| Destination | Receipt | Verification |
| --- | --- | --- |
| Netlify draft | `6af255383c42b13f063803e0` | 27 matching files |
| Netlify production | `6af255d3861ee6d1108aa33c` | 27 matching files; production ready/active |
| GitHub Pages | workflow `42719562341`, deployment `7668814812`, artifact `13718713301` | 23 matching files |
| GitHub release | `v0.5.5`, published `2026-11-09T23:20:04Z` | public assets re-downloaded and byte-identical |

The owner-launched reviewer verified the original CI archives and executable
hashes, reproduced the fullscreen Help and CRLF manual defects and their fixes,
and recorded the Windows/native limitations. The accepted
[web CI run 42429803866](https://github.com/diegoami/malpaco/actions/runs/42429803866)
and [Windows CI run 42429803894](https://github.com/diegoami/malpaco/actions/runs/42429803894)
were pull-request events associated with prep head
`0d8832a989ccf5c135e1fe45db13dd23f69aa1f7`, but actually checked out and built
the reviewed `009e827…` source. The candidate passed **1,205 units / 97 files**,
dev-watch, **6 source Help**, and **750 extracted browser cases / 414 explicit
route/project skips**; the Windows run built and exercised the setup and
portable outputs. The later automatic main run `42719562377` is a green repeat,
not the source of the sealed accepted bytes.

Playable: **2,474,119 bytes**, SHA-256
`086841117eb9c55b399f8e3538608fcc620c7d8122d338214d297d5d79fa2616`.
Windows setup: **4,340,126 bytes**, SHA-256
`ef06e08e9a175b8a14e58f39b65d79d07dda3ae5a69b2678c71c3f55ef1c1a69`.
Windows portable: **11,233,280 bytes**, SHA-256
`ab53443df92bf82b38a5c4eef47ae2686cf4a14464b10593a6fcb865022d656e`.
Separate checksum assets accompany all three downloads.

The original Windows CI archive was 10,066,260 bytes, SHA-256
`a1591d17b85ee9c04471ec0ebe73f58dac9255b23543e65379183c48c6219cb6`; the
original web CI ZIP was 2,474,888 bytes, SHA-256
`50e350172e0c6ec9eeb0d1a3e1284615f064d76293518538c3cad6c0cb6b848d`. Both were
re-downloaded and verified before publication. The released playable payload
has 27 files: all 26 manifest entries plus SHA256SUMS verify. Windows
BUILD-WINDOWS.json names the same source/version, x64 PE outputs and its five
manifest entries verify.

The native smoke ran on Windows Server 2022 / NT 10.0.20348 with WebView2
131.0.2903.86 and recorded `NotSigned`. It covered installation, shortcut
launch, an offline legal game action and exact retained save, Help geometry,
the eight local manual images, both external GitHub destinations, normal process
exits/relaunch, same-version reinstall, uninstall and portable resume. No
signed-publisher, physical Windows 10/11, SmartScreen, prior-official-version
upgrade, browser-save migration or native atomic-durability claim is made.

Local Linux publication smoke against the original extracted payload was
interrupted after 1,001 test cases by the local command timeout. It showed 716
passes, 285 explicit skips and 5 failures in unrelated existing
minimal-cards/reference-game/country-picker/computer-turn-flow cases; the new
project-link cases passed. The authoritative extracted result is the green
original CI run above. These local failures are retained as environment-local
results, not called a clean local full-suite pass; no assertion or timeout was
weakened.

See [PROVENANCE.md](PROVENANCE.md) and [milestone #465](https://github.com/diegoami/malpaco/issues/465).
Preserve the tag, exact accepted archive/Windows bytes and older releases/assets
unchanged, including v0.5.4 at `0336f41851e60570eb119dcb7ffd55476ef79c38`,
its exact tar SHA-256
`dabe68713d5ed49b780d92955e4cb3c3e46aeb15681b0afb6566865e5f0a2401` and prior
production `6aef6521d9ede522f4694a91`. Later documentation-only receipts do not
move the tag or replace the sealed bytes. Held Android persistence #315 and the
balance/personality work remain separate. Do not automatically start another
task, reviewer, tag, release or deployment, or carry this approval forward.
Prefer compatible forward fixes; #372 makes v0.3.1 an unsafe routine rollback
for newer scores/preferences.

# 0.5.5 provenance

Reviewed/published source/tag **v0.5.5** is
**`009e8272185d531c7d787befe5db2c2c46d0b588`**, tree
`6a64a9bbd029d9147ddb94270ed0f703ef0a8026`. Published
**2026-11-09T23:20:04Z** after the owner-launched MiniMax-M3 thinking AGREE
review (no findings) and the owner's explicit publication authorization.
[PUBLICATION.md](PUBLICATION.md) records the exact deployments, public
readbacks, bytes and limits; [#465](https://github.com/diegoami/malpaco/issues/465)
retains the review, implementation evidence and publication receipts. Later
documentation-only commits do not move the tag or replace the original
successful CI bytes.

Accepted web CI 42429803866 / artifact 13598835108 and Windows CI 42429803894 /
artifact 13596842395 were pull-request events associated with prep head
`0d8832a989ccf5c135e1fe45db13dd23f69aa1f7`, actually checking out and building
the full reviewed `009e827…` source. That exact commit was promoted unchanged
to `main` by PR #474: merge commit
`5787a7d83b28181895bfd0c32bee9e2d7e41ebee` has the identical reviewed tree.
The later automatic main run 42719562377 is a green repeat, not the source of
the sealed bytes.

- Original web CI ZIP: 2,474,888 bytes / SHA-256
  `50e350172e0c6ec9eeb0d1a3e1284615f064d76293518538c3cad6c0cb6b848d`.
- Published playable tar: 2,474,119 bytes / SHA-256
  `086841117eb9c55b399f8e3538608fcc620c7d8122d338214d297d5d79fa2616`.
- Original Windows CI ZIP: 10,066,260 bytes / SHA-256
  `a1591d17b85ee9c04471ec0ebe73f58dac9255b23543e65379183c48c6219cb6`.
- Windows setup: 4,340,126 bytes / SHA-256
  `ef06e08e9a175b8a14e58f39b65d79d07dda3ae5a69b2678c71c3f55ef1c1a69`.
- Windows portable: 11,233,280 bytes / SHA-256
  `ab53443df92bf82b38a5c4eef47ae2686cf4a14464b10593a6fcb865022d656e`.
- All 27 web files / 26 manifest entries, the eight source-identical manual
  images, the five preferred Oxygen source/notices files and the complete
  Windows product manifest verify. Do not substitute a local rebuild for these
  sealed bytes.

- Previous immutable tag v0.5.4:
  `0336f41851e60570eb119dcb7ffd55476ef79c38`.
- Previous exact playable SHA-256:
  `dabe68713d5ed49b780d92955e4cb3c3e46aeb15681b0afb6566865e5f0a2401`.
- Core tree remains `b61fb9adfac9e0e7bf5b19f4c2e5025180e54bba`.
- Fixture tree remains `97eb8e0703af6868a2d23c9d8e1665aa069c1222`.
- Only package/root-lock product versions change to 0.5.5; dependency records,
  rules/AI, constructors and saved-game/replay identities remain unchanged.
- Windows outputs are `NotSigned`, built on Windows Server 2022 / NT
  10.0.20348 with WebView2 131.0.2903.86. They require WebView2 and use
  per-user app data, not portable-folder saves.
- Selected Oxygen source is pinned to KDE commit
  `51b11680df7dbe91361904ad8e92193cb495f5d1`; the Windows checkout preserves
  the exact pinned bytes and verifies them before and after packaging.
- Selected illustrations and their actual source hashes remain in
  `docs/manual-images/PROVENANCE.json`. Dirty captures are explicitly disclosed
  and are not clean-head release/device evidence.

Contracts: [scope](../../plans/release-0.5.5.md), T172–T175. Evidence includes
the corrected preferred-source-byte rejection of the superseded `ca2c732`
candidate, CRLF manual-heading reproduction and fix, Help geometry/real-hit
checks, separate bundled-document windows and safe HTTPS dispatch. Failed and
superseded runs are not passes. See [acceptance](ACCEPTANCE.md) for the full
byte and owner gates and [publication](PUBLICATION.md) for the final receipts.

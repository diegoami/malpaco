# 0.5.5 provenance protocol

The authoritative candidate pin, live task labels and original CI evidence are recorded on [#465](https://github.com/diegoami/malpaco/issues/465). Preparation must complete [ACCEPTANCE.md](ACCEPTANCE.md) before a candidate can be accepted or published. This protocol does not seal an unfinished local build.

Keep distinct:

1. Task/PR head, CI event and actual checkout/merge commit. Accepted original web and Windows artifacts must name the same final product source/version; a temporary merge ref alone is not durable reachability.
2. Original web ZIP/tar SHA-256, complete payload SHA256SUMS, exact BUILD.json and original artifact metadata. Local previews/rebuilds are separate verification outputs.
3. Original Windows artifact ZIP, setup/portable executable SHA-256, BUILD-WINDOWS.json, FRONTEND-SHA256SUMS and complete native smoke report. Native outputs must be tested as delivered, and record signature/Windows/WebView2 identities.
4. Illustrated manual capture command, package version, source commit/dirty indicator, exact source hashes and eight inspected picture hashes. Curated pictures are maintained assets; browser captures are not physical-device or owner approval.
5. Independent review answer and current explicit owner publication decision. No approval carries from 0.5.4. Later publication receipts must preserve the exact accepted source and bytes.

Published v0.5.4 remains source `0336f41851e60570eb119dcb7ffd55476ef79c38`, web tar `dabe68713d5ed49b780d92955e4cb3c3e46aeb15681b0afb6566865e5f0a2401`, independent review [#457 comment 6710682709](https://github.com/diegoami/malpaco/issues/457#issuecomment-6710682709). Preserve those records, all earlier release assets and current production.

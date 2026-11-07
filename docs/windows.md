# Windows installer and portable app

The 0.5.5 scope requires **both** Windows x64 formats in GitHub Releases. Candidate builds are CI artifacts until the owner-launched review, Windows acceptance and explicit publication approval. This document does not claim an installer has already been published.

- Installer: `malpaco-<version>-windows-x64-setup.exe`, installs for the current user, creates a Malpaco Start menu shortcut and registers uninstall.
- Portable executable: `malpaco-<version>-windows-x64-portable.exe`, starts without installing Malpaco. It uses the same per-user app WebView data as the installed copy; it does not keep saves beside the executable. Avoid concurrent installed/portable instances writing the same game.
- Both embed the ordinary release game, geography worker, fonts, illustrated manual and notices. No Node installation, development server or hosted game page is required to play.
- Microsoft Edge WebView2 Runtime is required. The installer downloads Microsoft's bootstrapper if the Runtime is missing; that first installation needs internet. Portable users must supply WebView2 separately. Gameplay then works offline. See [Tauri's Windows distribution documentation](https://v2.tauri.app/distribute/windows-installer/).
- Initial candidates are unsigned. Their exact status is recorded; no paid certificate or trusted-publisher claim is assumed. Windows may display unknown-publisher/SmartScreen prompts. Signed delivery can be added only with an owner-provided signing arrangement.

Browser and app saves have different origins and are not automatically transferred. App-data deletion/clearing may erase saves and scores. The Windows test checks ordinary close/relaunch, same-version reinstall and uninstall/portable continuity; it does not adopt Android's held atomic snapshot PR #315 or promise portable-folder storage. There is no prior official Windows release to use for an upgrade test.

## Build and validation

On Windows x64 with Node 22, Rust 1.90.0 and the Microsoft C++ build tools/SDK:

```sh
npm ci
npm run windows:build
npm run windows:smoke
```

The build refuses dirty tracked source, uses the existing Tauri/Cargo locks and `--locked`, and writes both executables, instructions, frontend hashes, exact source/version metadata and `SHA256SUMS` to `artifacts/windows/<source-prefix>/`. `.github/workflows/windows.yml` builds and exercises these exact outputs on Windows 2022; it uploads artifacts only and never publishes a release. No dependencies are upgraded. The Windows config is separate from the existing Android prototype.

The smoke uses the existing Playwright dependency attached to the actual app's WebView2, through Microsoft's documented [remote debugging environment variable](https://learn.microsoft.com/en-us/microsoft-edge/webview2/how-to/debug-visual-studio-code). That variable is set only in the test launcher; no debugging switch is compiled into the product. It installs silently into a unique test folder, verifies the Start menu/uninstall registration, plays and records a real game action offline, checks Help/manual, closes/relaunches, reinstalls, uninstalls, and launches the portable copy against the same retained game. Screenshots, platform/signature/runtime identities and original failures remain in the artifact. Physical Windows 10/11 testing and SmartScreen judgment are not inferred from hosted Windows 2022.

HTTPS links open in the default browser rather than replacing the game. Bundled manuals and icon notices open in a separate unprivileged app window; their Play link focuses the existing game rather than starting a second writer. Unsupported external URL schemes are denied. This uses Windows' existing URL handler, with a literal URL argument and no command shell or new runtime plugin.

The Windows `.ico` is generated from the existing `src-tauri/icons/icon.png` using the pinned Tauri CLI (`node node_modules/@tauri-apps/cli/tauri.js icon src-tauri/icons/icon.png --output artifacts/windows-icons`); only the Windows icon is retained as a maintained application asset. No new artwork or third-party icon source was introduced.

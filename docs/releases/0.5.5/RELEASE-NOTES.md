# Malpaco 0.5.5

Windows installer and portable delivery, project/download links and a fullscreen Help correction.

- Windows x64 gets a setup executable with a Start menu shortcut/uninstall entry and a separately downloadable portable executable. Both bundle the ordinary game, worker, fonts, illustrated manual and notices. Microsoft Edge WebView2 Runtime is required; the installer downloads it if missing. Once available, gameplay needs no server or network. Initial Windows files are unsigned; no trusted-publisher claim is made.
- Portable means no Malpaco installation, not portable-folder saves. Installed and portable copies share the Windows user's app WebView data. Browser saves remain separate. Avoid concurrent copies and preserve app data when upgrading. No Android atomic snapshot changes ride this release.
- **? Help** and the illustrated manual link directly to the GitHub repository and **Releases and downloads**. Windows opens HTTPS links in the default browser and bundled documentation in a separate app window, preserving the live game.
- Help now fits the screen at 1920×1080/fullscreen. A desktop result-dialog zoom rule previously scaled it beyond the viewport, leaving only part of its close button reachable. The correction is scoped to Help; its top close target stays visible while scrolling, and Escape/focus return still work.

Rules, AI, balance, map/save/replay identities and dependency versions stay unchanged. Windows has a separate application origin; no automatic browser-save migration, portable-folder storage, signed delivery or physical Windows10/11 acceptance is implied. See [Windows instructions](../../windows.md) and the [acceptance protocol](ACCEPTANCE.md). Publication requires the original accepted CI artifacts, independent review and explicit owner approval.

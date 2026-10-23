# Android prototype

T106 (#274), 0.3 parent #271, owner decisions #272. The owner selected Android
only and approved Tauri 2. This prototype wraps the existing released frontend;
production durability, signing, update acceptance and store delivery follow it.

## Build

A fresh Linux x86-64 checkout needs Node 22+, Python 3.12+ and Rust (1.90+).
From the repository root:

```sh
npm ci
python3 tools/android/setup-linux.py --emulator
npm run android:build:debug
```

The setup downloads checksum-pinned Temurin JDK 21.0.13+9 and Android command-line
tools 23, then installs SDK 36, build-tools 37.0.0, NDK 29.0.14206865 and Rust's
ARM64/x86-64 Android targets. `--emulator` also installs the Android 16/API 36
Google APIs x86-64 emulator image. Review Google's SDK terms when installing.
Downloads, the SDK, Gradle cache and Rust compilation output stay under ignored
`artifacts/`; Rust targets use the normal rustup installation.

On another host, install the same versions and set `JAVA_HOME`, `ANDROID_HOME`
and `NDK_HOME`. The build script respects these variables. Android Studio is
optional for the command-line build; Tauri's [prerequisites](https://v2.tauri.app/start/prerequisites/#android)
describe interactive setup.

`npm run android:build:debug -- --target x86_64` builds just the emulator APK;
`--target aarch64` builds just the ARM64 phone APK. Without that option it builds
both architectures. APKs and `BUILD.json` are copied to a fresh directory under
`artifacts/T106-build/`, with source commit, APK SHA-256 and the bundled assets'
`BUILD.json`/`SHA256SUMS`.

The Tauri build runs `npm run package:playable` and embeds
`release/malpaco-playable/`, the same release-mode frontend used by the web
archive. Installed builds do not depend on Vite, Netlify, a Node launcher or a
network connection. The debug application ID is `io.github.diegoami.malpaco.debug`;
this prototype has no privileged native commands. The island launcher icon is
original SVG artwork in `src-tauri/icons/source.svg`, rasterized with Tauri's icon
tool; it is provisional and still subject to the owner's visual judgment.

## Device validation

Build success does not establish Android behavior. Use the smoke command recorded
with this task's final evidence to install on a named emulator/device, turn off
Wi-Fi and mobile data, and drive real placement/combat, pending-choice rotation,
close/relaunch and Back/background. Record API/WebView versions, 46 visible
countries, page errors, action/state continuity, screenshots and exact APK hash.
A desktop Chromium pass cannot replace these checks.

Web and app data have separate origins. Native persistence/update and Back/pause
policies are tracked in #272; do not claim browser data is imported or synchronized.
Keep the debug identity separate from any eventual signed release identity.

## Development

`npm run android:dev` uses Tauri's development server flow and requires an installed
Android toolchain. It is separate from the bundled offline acceptance build.
Generated native project sources live in `src-tauri/gen/android/`; build products,
local SDK properties, schemas, caches and signing files are ignored. Never commit
a keystore or store credentials.

## Prototype evidence and remaining work

The first complete native smoke used source `c66708de5b7d`, ARM64 + x86-64 debug APK
SHA-256 `79d264f24651b204a575fb593486c8bcfeab69f65fca7d5c56618f7abf800e13`.
Android 16/API 36, medium-phone emulator, WebView 133.0.6943.137, offline: all
46 countries loaded; real placement/combat reached a capture; rotation and
force-stop/relaunch preserved that exact pending game, with no JavaScript/console
errors in the checked flows. The source's native/web payload is unchanged by the
subsequent smoke-driver fixes. This is emulator evidence, not physical-device
acceptance or a minimum-Android-version guarantee.

Run the same flow on an already booted ADB device:

```sh
node tools/android/smoke.mjs --apk <debug-apk> --serial <adb-serial>
```

The driver uses Playwright's Android WebView API. It chooses an unused diagnostic
seed, drives controls without injecting an engine snapshot, compares exchanges
with the core, saves the pending replay and captures the device screen. It disables
Wi-Fi/mobile data for the offline check; re-enable these afterwards on a physical
test device. Evidence goes to a fresh `artifacts/T106-smoke-*/` directory. It also
records Back/background behavior without claiming that the production policy is
implemented. Use a dedicated test emulator/device profile for automated smoke.

Observed prototype gaps: Android backgrounding left the pause flag false, and Back
navigated from a seeded game to the root instead of dismissing the open menu. The
owner selected save/pause on background, explicit Resume on return, and Back that
closes/folds the current surface or backgrounds the main map. Those behaviors and
durable save/upgrade storage belong to the next native slice. Native status-bar
contrast and safe-area placement still need device judgment. Debug native symbols
make the first universal APK about 250 MiB; this is not a production-size estimate.
Signed APK download is the selected 0.3 distribution; Google Play is deferred.

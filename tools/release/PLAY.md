# Play Malpaco

This archive contains the game and its illustrated manual. You need Node.js 22
or later; no package installation or network connection is required.

Extract the archive, change into `malpaco-playable`, and run:

```sh
node serve.mjs
```

Open <http://127.0.0.1:4175> in your browser. The server accepts connections only
from your own computer.

For complete controls, rules, screenshots and troubleshooting, open the
[illustrated player manual](manual/index.html) from this folder, or visit
<http://127.0.0.1:4175/manual/index.html> while the server is running. In-game Help
also links to the manual and reports your current match's actual rules.

Choose **Start game** on a fresh visit or **Resume saved game** to continue a kept
match. On very short windows, scroll the whole launcher card; Start/Resume come
first. Taller launchers scroll their settings region. **Button labels** chooses
Text or Icons immediately; the game setup choices apply to the next match.

Games, preferences and the scoreboard are kept in this browser at this address.
Use the same browser and address to continue. Clearing site data removes that
local data; there is no account or cross-device synchronization.

To create this archive from a source checkout, run `npm run package:playable`.
It writes `release/malpaco-playable.tar.gz` and `release/malpaco-playable/`.

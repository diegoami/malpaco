# Playable build

Create a self-contained release archive from the source checkout with:

```sh
npm run package:playable
```

The command rebuilds the game and writes `release/malpaco-playable.tar.gz` and
the ready-to-run `release/malpaco-playable/` directory. The archive contains no
source checkout or npm dependencies. Recipients need Node.js 22, but do not need
to install packages or connect to the network.

Extract the archive, change into `malpaco-playable`, and run:

```sh
node serve.mjs
```

Open <http://127.0.0.1:4175> in a desktop browser. The launcher binds to the
loopback interface and serves the included files.

This development milestone uses the fixed Nine Isles reference board: nine islands
and 46 territories. Changing the seed changes the deal and dice sequence, not the
geography. Generated boards remain part of the final-game development scope.

The root page opens Nine Isles setup, defaulting to one human against three
Normal computers. Choose a seed and 2–4 seats; each seat can be Human or Computer.
Select **Start game**. During your turn, place reinforcements on your territories,
then choose **Start combat**. Select one of your territories, then click an adjacent
enemy for one exchange. Click that enemy again to repeat; Enter/Space and touch work
the same way. **Fight on** continues automatically; **Stop** pauses it. Shift-click
(or Shift-Enter/Shift-Space) selects without attacking for **Single exchange** or **Fight on**.
After capturing a territory, choose the army amount and **Confirm move-in**.
You can make one adjacent friendly move per turn. Computer turns run automatically.
**Save game** downloads a match file; **Load game** restores one, including an
unresolved capture choice. **New game** returns to setup.

The supported desktop layouts are 1280×800 and 1920×1080. Mobile layouts,
online multiplayer, and cross-device save synchronization are not supported.

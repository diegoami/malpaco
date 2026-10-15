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

In setup, choose 2–4 seats and either all-human play or one human seat against
computer-controlled opponents. Setup also provides an initial reinforcement
pool to place on your territories. During a turn, spend reinforcements on owned
territories, then choose **Start combat** before attacking. Select one of your
territories, choose an adjacent enemy territory, resolve combat, and end the
turn. Computer turns run automatically. **Help** explains the controls and game
rules. **Save** downloads a match file; **Load** opens a saved match. **New game**
returns to setup.

The supported desktop layouts are 1280×800 and 1920×1080. Mobile layouts,
online multiplayer, and cross-device save synchronization are not supported.

# Play Malpaco

Run `node serve.mjs` from this folder, then open <http://127.0.0.1:4175> in a desktop browser.

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

The supported desktop layouts are 1280×800 and 1920×1080. Mobile layouts, online play, and cross-device save synchronization are not supported.

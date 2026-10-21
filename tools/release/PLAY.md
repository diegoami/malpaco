# Play Malpaco 0.1.1

Run `node serve.mjs` from this folder, then open <http://127.0.0.1:4175> in a desktop browser.

New games use versioned generated geography: nine islands and 46 territories.
The seed fixes the geography, deal and dice sequence. The explicit
`?view=reference-game` route retains the fixed Nine Isles board, and
`?view=generated-game` retains the legacy generated-game and save path.

The root page opens generated-island setup, defaulting to one human against three
Normal computers. Choose a seed and 2–4 seats; each seat can be Human or Computer.
Select **Start game**. The map prepares before play begins. During your turn, place reinforcements on your territories,
then choose **Start combat**. Select one of your territories, then click an adjacent
enemy for one exchange. Click that enemy again to repeat; Enter/Space and touch work
the same way. **Fight on** continues automatically; **Stop** pauses it. Shift-click
(or Shift-Enter/Shift-Space) selects without attacking for **Single exchange** or **Fight on**.
After capturing a territory, choose the army amount and **Confirm move-in**.
You can make one adjacent friendly move per turn. Computer turns run automatically.
**Save game** downloads a match file; **Load game** restores one, including an
unresolved capture choice. **New game** returns to setup. If a load fails, the current game remains available.

Cards are enabled in normal games with zero or one human seat. Hands start empty.
Capture a territory and finish your turn to earn a card; use **View your hand**
to see available choices. Resolve any required card choice before continuing.
Games with two or more human seats currently play without cards.

Player totals show armies on the board. **Pause** stops play, and **Game speed**
slows computer turns. **Panel detail** switches Compact/Detailed information.
The smaller battle log scrolls while retaining its history; **Game event log**
opens the full action history, including army gains, losses and unplaced armies.

The map fills the screen and only corner icons rest on it: the menu (totals, history, the event log, speed, save and load) and **Cards** top-left, **Pause** top-right, **Fit** bottom-left, and bottom-right the information icon (objective and progress) with the legal phase action: **Start combat**, **Move armies** or the flag for **End turn**. While you place armies, the pool shows as an icon and a number at the top. A one-line notice says whose turn it is and goes away once you act. Choices appear as small cards beside the map: select a target to see the attack card, and a capture or move shows a preview with −, the amount, +, confirm and a slider. Folding a choice leaves a one-line card with a return icon. **Zoom** and **Focus** appear once you zoom or select a country. Press Escape or **Return to map** to close a card.

The supported desktop layouts are 1280×800 and 1920×1080. Mobile layouts, online play, and cross-device save synchronization are not supported.

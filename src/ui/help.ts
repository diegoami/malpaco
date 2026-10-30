import { glyph } from "./icons";
import { h } from "./dom";

const sections = [
  [
    "Seed and players",
    "Choose a seed and two to four human seats, or play against computers. The same seed and choices recreate the same generated game.",
  ],
  [
    "Map and armies",
    "Province labels show the numeric seat and army count. Land borders and sea lanes mark the explicit routes between provinces.",
  ],
  [
    "Reinforcements",
    "Place armies from your reinforcement pool on provinces you own. When the pool is empty, choose Start combat.",
  ],
  [
    "Attacking",
    "Select a source and an adjacent enemy. The source needs at least two armies. Each Attack resolves one exchange; press it again to act again.",
  ],
  [
    "Turns and victory",
    "End your turn when ready. A player with no provinces is eliminated; taking every province wins the game.",
  ],
  [
    "Computer turns",
    "Computer players take their turns automatically. Opening help pauses a computer turn until you close it.",
  ],
  [
    "Save and load",
    "Save game downloads the match and its options and history. Load game replays a saved match. New game returns to setup.",
  ],
] as const;

export function mountHelp(
  host: HTMLElement,
  pause?: () => void,
  resume?: () => void,
  buttonLabel = "How to play",
): void {
  const dialog = h(
    "dialog",
    { class: "help-dialog", "aria-labelledby": "help-title" },
    h("h2", { id: "help-title" }, "How to play"),
    ...sections.map(([title, copy]) =>
      h("section", {}, h("h3", {}, title), h("p", {}, copy)),
    ),
    h("div", { class: "help-actions" }, h("button", { type: "button" }, "Close")),
  );
  const opener = h(
    "button",
    {
      type: "button",
      class: "help-open",
      "aria-haspopup": "dialog",
      "aria-label": "How to play",
    },
    buttonLabel,
  );
  const close = dialog.querySelector("button")!;

  opener.addEventListener("click", () => {
    pause?.();
    dialog.showModal();
    close.focus();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") event.stopPropagation();
  });
  dialog.addEventListener("close", () => {
    resume?.();
    opener.focus();
  });
  const viewRoot = host.closest<HTMLElement>("#game-setup, #generated-game");
  if (viewRoot?.id === "game-setup") viewRoot.append(opener);
  else host.append(opener);
  (viewRoot ?? host).append(dialog);
}

/** T85 (R6, #61): every icon the game shows, with the one name it is announced by. Card names
 * stay out of this help: the page may show only your own or publicly spent cards. */
const ICON_NAMES: readonly (readonly [shape: string, name: string, use: string])[] = [
  ["help", "Help", "Instructions, icon names and explanations of the settings."],
  ["settings", "Settings", "The next game’s opponents, starting armies, event frequency, map size and combat rules, plus the scoreboard. New game and Help have their own top-left buttons. These commands stay available during computer play."],
  ["play", "Resume", "After an interruption, Resume appears in the turn tracker. Settings and Help pause play while open; closing them cannot release an Android background pause."],
  ["fit", "Fit", "Shows the whole map again."],
  ["countries", "Countries", "Every country by island, or only the ones you can use now."],
  ["info", "Inspect", "In the Countries list: a country's owner, armies and neighbours. On the result card, Details: the seed, options and record."],
  ["combat", "Start combat", "Ends placement once every army is placed."],
  ["move", "Move armies", "One adjacent friendly move per turn."],
  ["flag", "End turn", "Passes the turn; it also skips the friendly move."],
  ["attack", "Attack", "The Attack control beside your source country rolls one exchange; press it again to continue."],
  ["minus", "Fewer", "Lowers a move-in or move amount."],
  ["plus", "More", "Raises a move-in or move amount."],
  ["confirm", "Confirm", "The check mark confirms the chosen troop amount. Closing with X leaves that choice pending."],
  ["close", "Close", "X dismisses event and card-draw information and continues play. It never confirms a troop amount or releases an Android background pause."],
  ["return", "Return", "Reopens a pending choice."],
  ["standings", "Standings", "Countries and armies at the end of the game."],
  ["trophy", "Scoreboard", "In Settings: games played, won, lost and given up in this browser, the win rate and the last 20 games."],
  ["new-game", "New game", "Gives up this game after confirmation, then opens Settings. Press Start game to begin."],
  ["watch", "Watch computers", "After your last country falls: the computers play on."],
  ["cards", "Your cards", "Shows your own hand and card count; drag the window by its title. After a draw your whole hand is shown, with the new card marked."],
  ["fold", "Fold card", "Shrinks a card to a chip that keeps its title; tap the chip to open it again."],
  ["close", "Close", "Closes a card, cancels a choice, or dismisses a notice."],
];
const HOW_TO: readonly (readonly [string, string])[] = [
  ["Start and resume", "Press Start game above the launcher settings to begin; a fresh game counts down for three seconds. Resume saved game keeps its map, rules, armies, cards and pending choices without a new countdown. The normal game has one human seat against computers."],
  ["Map size", "Choose 46, 72 or 96 regions. Larger maps add more islands and use numbered names. The choice applies only to the next game; use zoom for a closer view on a phone."],
  ["Settings", "Game setup changes apply to the next game; Button labels apply immediately. Choose 1–3 computer opponents and starting-army ranges 1–2, 1–3 or 1–4 equally for all seats. New games use fixed territory income: one army per three countries, rounded down with a minimum of 2, plus complete-island bonuses. Kept games retain their original rules."],
  ["Production centres and disasters", "With events on, three starred countries are production centres. Harvest doubles their stacks, adding at most 10 per centre. Shift redraws the three centres. Storm affects a connected group of three or four countries, leaving every stack positive. Revolt transfers one border country, with its armies, to a bordering owner; it cannot eliminate a seat. Events do not target a leader or guarantee catch-up help."],
  ["Event frequency", "Off disables events and hides centres; Rare, Normal and Often give one chance in 21, 14 or 8 at an eligible turn change. Round one, imminent wins, the last three rounds of a round-limit game and the transition after an event are protected. An event card shows exact changes; Continue acknowledges it. Fold or Back lets you inspect the marked countries without acknowledging. Acknowledgement never resumes a background-paused game."],
  ["Placing", "Tap your countries to place armies from the pool shown at the top; combat starts when the last one is placed."],
  ["On your country", "Select your country to see Attack and Move when both are possible. You can also choose Attack from an unconfirmed transfer destination; the draft is cancelled without moving armies."],
  ["Attacking", "Tap one of your countries, then an adjacent enemy: that only chooses the target. Use Attack beside your country for one exchange; press it again to keep attacking, or select another country."],
  ["Attack rules", "Your source needs at least two armies; you may attack a larger enemy stack. Each side rolls one six-sided die and the lower roll loses one army. The current game's tie rule is shown above. Pressing Attack before choosing an enemy arms the source: your next eligible target tap fights one exchange. Attacks never repeat automatically. A source reduced to one army stays yours."],
  ["Capturing", "Choose how many armies move in with Min, −, + or Max, then Confirm. Min and Max select the legal bounds without moving troops. Until Confirm the two counts are dashed."],
  ["Friendly movement", "Choose Move on your country, then an adjacent country you own. Leave at least one army at the source. Min, Max, minus, plus and the amount field only change a draft; Confirm makes the move and ends your turn. Cancel abandons the draft. You get one adjacent friendly transfer per turn; End turn skips it."],
  ["Cards", "Your cards button at top left shows your hand count. Capture at least one country and finish the turn to earn one card. Drawing does not immediately grant armies. Draw notices disappear after three seconds of unpaused play. At the start of a turn, play at most one set of three of the same kind or Skip; up to two Any value cards can substitute, but three wilds alone are not a set."],
  ["Card effects", "Sets of 5, 8 or 15 armies add that amount to your placement pool. Double armies doubles the pool. An Army reduction set targets any enemy country, leaving a random 1 to half its armies, rounded down with minimum 1; choose the country and Confirm. Protection automatically blocks one reduction and is spent. Cards lost discards your hand when drawn. With five cards, discard one before seeing an earned draw. Required card choices do not time out."],
  ["Notices", "The turn tracker shows the active colour, public counts and your next step. Your turn begins when its arrow reaches your colour."],
  ["Computer turns", "Computers use the improved AI for attacks, defense and army transfers, including in resumed games. Watch their moves at Normal pace. Settings and Help pause play while open. After an interruption, use Resume in the turn tracker."],
  ["Seats", "You play one seat; the computers are named by their colours: Orange, Green and Purple."],
  ["Kept games", "Your game is kept in this browser: a reload, or reopening the browser, resumes it, paused if you left it paused. Each game counts once on the scoreboard, when it ends."],
  ["Map", "Pinch or scroll to zoom, drag to pan, Fit to see everything. Cards float over the map and move aside from the countries in play. A tap that touches two countries asks which one."],
  ["Button labels", "Choose Icons or Text in the launcher or Settings. Text is the default; your choice applies immediately and is kept across turns, games, reloads and screen sizes. Attack and Move follow that choice even when both actions are available. Text and padding scale down on smaller screens while buttons keep usable touch targets. Map tools, amount controls and Close keep standard symbols."],
  ["Phone and keyboard controls", "In Icons mode, play starts/resumes, flag ends the turn, crossed weapons attack and arrows move. A check mark confirms amounts. Tooltips and accessible names keep the action names. Use Tab and Enter/Space for controls; Shift activation selects without fighting an armed attack. Scroll inside launcher settings on short screens."],
  ["Victory and results", "Normal games use Domination: finish your turn holding 35 of 46, 54 of 72 or 72 of 96 countries, or conquer all countries. Help's Objective shows your current match's target. Standings and Details expand the result; fold it to a chip to see the map. If eliminated, Watch computers or Stop game. The scoreboard in Settings records each outcome once and separates combat-rule groups."],
  ["Local storage", "Games and scores belong to this browser and address. There is no account or cross-device sync; clearing site data removes them. A locally served game and the hosted game have separate saves. A paused game requires Resume. Next-game preferences never change a kept match."],
  ["Moving cards", "Drag a card by its grip or its edge to put it elsewhere; later cards open there too. Double-tap the grip, or start a new game, to put cards back in their corners."],
];

/** The in-game help: the objective, how the game plays, and every icon's name. Visible and accessible names match. */
export class GameHelp {
  readonly button = h("button", { id: "game-help-button", type: "button" }, "Help & icon names");
  readonly dialog = h("dialog", { class: "game-help", "aria-labelledby": "game-help-title" });
  /** T97: the objective and your progress, which the retired Information icon showed. */
  private readonly combatRules = h('p',{id:'game-help-combat-rules'});
  private readonly objective = h("p", { id: "game-help-objective" });
  constructor(onOpen?: () => void, player = true) {
    const icons = player ? ICON_NAMES : ICON_NAMES.flatMap(([shape, name, use]) => {
      if (shape === 'play') return [
        ['pause', 'Pause', 'Pauses play; press again to resume. The speed choice is beside it.'],
        ['fast-forward', 'Fast-forward', 'Plays computer turns without waiting until your turn.'],
      ];
      if (shape === 'attack') return [['attack', 'Fight', 'Rolls one exchange with the staged pair; press again to continue.']];
      return [[shape, name, use]];
    });
    const howTo = HOW_TO.map<readonly [string, string]>(([title, copy]) => [title,
      player ? title === 'Event frequency' ? copy.replace('Continue acknowledges it. Fold or Back lets you inspect the marked countries without acknowledging.', 'it closes automatically after three seconds of unpaused play, or close with X, Escape or Android Back to acknowledge and continue. Pausing or opening the menu stops the timeout; resuming gives a fresh three seconds.') :
        title === 'Notices' ? `${copy} Close an informational notice with X, Escape or Android Back to continue. Troop choices still require Confirm; closing them never commits armies.` : copy :
        title === 'Computer turns' ? "Choose the speed beside Pause; Fast-forward plays until your next turn." :
        title === 'Attacking' || title === 'On your country' ? "Select a source and an adjacent enemy, then use Fight on the choice card for one exchange." : copy,
    ]);
    const close = h("button", { type: "button", id: "close-game-help" }, "Close help");
    close.onclick = () => this.dialog.close();
    this.dialog.append(
      h("header", { class: "game-help-head" }, h("h2", { id: "game-help-title" }, "Help & icon names"), close),
      h("p", {}, h("a", {id:"full-player-manual",href:"/manual/index.html",target:"_blank",rel:"noopener"}, "Full player manual with screenshots")),
      h("section", {}, h("h3", {}, "Objective"), this.objective),h("section",{},h("h3",{},"Combat rules"),this.combatRules),
      ...howTo.map(([title, copy]) => h("section", {}, h("h3", {}, title), h("p", {}, copy))),
      h("h3", {}, "Icons"),
      h("ul", { class: "game-help-icons", "aria-label": "Icon names" }, ...icons.map(([shape, name, use]) =>
        h("li", { "data-icon": shape }, glyph(shape), h("strong", {}, name), h("span", {}, use)))),
    );
    this.button.onclick = () => { onOpen?.(); this.dialog.showModal(); close.focus(); };
    this.dialog.addEventListener("close", () => { if (this.button.isConnected) this.button.focus({ preventScroll: true }); });
  }
  /** The current objective line, e.g. "Domination · 7 / 23 · Round 3". */
  setObjective(text: string): void { if (this.objective.textContent !== text) this.objective.textContent = text; }
  setCombatRules(ties:'reroll'|'defender'|'attacker'):void {this.combatRules.textContent=ties==='defender'?'Defender wins tied rolls.':ties==='reroll'?'Legacy: tied rolls reroll.':'Attacker wins tied rolls.';}
  dispose(): void { this.dialog.close(); this.dialog.remove(); }
}

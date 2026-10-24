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
    "Select a source and an adjacent enemy. The source needs at least two armies and at least as many armies as the defender. Each Attack resolves one exchange; choose Continue to act again.",
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
  ["settings", "Settings", "The next game’s opponents and starting armies, its seed and the scoreboard. New game and Help have their own top-left buttons. These commands stay available during computer play."],
  ["play", "Resume", "After an interruption, Resume appears in the turn tracker. Settings and Help pause play while open; closing them cannot release an Android background pause."],
  ["fit", "Fit", "Shows the whole map again."],
  ["countries", "Countries", "Every country by island, or only the ones you can use now."],
  ["info", "Inspect", "In the Countries list: a country's owner, armies and neighbours. On the result card, Details: the seed, options and record."],
  ["combat", "Start combat", "Ends placement once every army is placed."],
  ["move", "Move armies", "One adjacent friendly move per turn."],
  ["flag", "End turn", "Passes the turn; it also skips the friendly move."],
  ["attack", "Attack", "The ATTACK button beside your source country rolls one exchange; press it again to continue."],
  ["minus", "Fewer", "Lowers a move-in or move amount."],
  ["plus", "More", "Raises a move-in or move amount."],
  ["confirm", "Confirm", "The check mark confirms the chosen troop amount. Closing with X leaves that choice pending."],
  ["close", "Close", "X dismisses event and card-draw information and continues play. It never confirms a troop amount or releases an Android background pause."],
  ["return", "Return", "Reopens a pending choice."],
  ["standings", "Standings", "Countries and armies at the end of the game."],
  ["trophy", "Scoreboard", "In Settings: games played, won, lost and given up in this browser, the win rate and the last 20 games."],
  ["new-game", "New game", "Gives up this game after confirmation, then opens Settings. Press Start game to begin."],
  ["watch", "Watch computers", "After your last country falls: the computers play on."],
  ["cards", "Your cards", "Shows the cards you hold and how many, each with a plain symbol for what it does; drag the window by its title. After each draw your whole hand is shown."],
  ["fold", "Fold card", "Shrinks a card to a chip that keeps its title; tap the chip to open it again."],
  ["close", "Close", "Closes a card, cancels a choice, or dismisses a notice."],
];
const HOW_TO: readonly (readonly [string, string])[] = [
  ["Settings", "Changes apply to the next game. Choose 1–3 computer opponents and starting-army ranges 1–2, 1–3 or 1–4 equally for all seats. New games use fixed territory income: one army per three countries, rounded down with a minimum of 2, plus complete-island bonuses. Kept games retain their original rules."],
  ["Production centres and disasters", "With events on, three starred countries are production centres. Harvest doubles their stacks, adding at most 10 per centre. Shift redraws the three centres. Storm affects a connected group of three or four countries, leaving every stack positive. Revolt transfers one border country, with its armies, to a bordering owner; it cannot eliminate a seat. Events do not target a leader or guarantee catch-up help."],
  ["Event frequency", "Off disables events and hides centres; Rare, Normal and Often give one chance in 21, 14 or 8 at an eligible turn change. Round one, imminent wins, the last three rounds of a round-limit game and the transition after an event are protected. An event card shows exact changes; Continue acknowledges it. Fold or Back lets you inspect the marked countries without acknowledging. Acknowledgement never resumes a background-paused game."],
  ["Placing", "Tap your countries to place armies from the pool shown at the top; combat starts when the last one is placed."],
  ["On your country", "The country you select shows ATTACK if it can attack, or MOVE if it can only move armies. Press ATTACK, then tap an enemy: one round; press again for another."],
  ["Attacking", "Tap one of your countries, then an adjacent enemy: that only chooses the target. The ATTACK button beside your country rolls one exchange; press it again to keep attacking, or select another country."],
  ["Capturing", "Choose how many armies move in with −, + and Confirm. Until then the two counts are dashed."],
  ["Cards", "Your cards are behind the CARDS button at top left, with their number. Army cards are labelled5,8 or15 armies; draw notices disappear after three seconds of unpaused play. Three that make a set are played at the start of your turn: its choice opens by itself, or play it from your cards. A required card choice opens by itself. A card that targets a country folds to a strip: tap a highlighted enemy or use Countries, then Confirm."],
  ["Notices", "The turn tracker shows the active colour, public counts and your next step. Your turn begins when its arrow reaches your colour."],
  ["Computer turns", "Watch the executed placements, attacks and movements at Normal pace. Settings and Help pause play while open. After an interruption, use Resume in the turn tracker."],
  ["Seats", "You play one seat; the computers are named by their colours: Orange, Green and Purple."],
  ["Kept games", "Your game is kept in this browser: a reload, or reopening the browser, resumes it, paused if you left it paused. Each game counts once on the scoreboard, when it ends."],
  ["Map", "Pinch or scroll to zoom, drag to pan, Fit to see everything. Cards float over the map and move aside from the countries in play. A tap that touches two countries asks which one."],
  ["Moving cards", "Drag a card by its grip or its edge to put it elsewhere; later cards open there too. Double-tap the grip, or start a new game, to put cards back in their corners."],
];

/** The in-game help: the objective, how the game plays, and every icon's name. Visible and accessible names match. */
export class GameHelp {
  readonly button = h("button", { id: "game-help-button", type: "button" }, "Help & icon names");
  readonly dialog = h("dialog", { class: "game-help", "aria-labelledby": "game-help-title" });
  /** T97: the objective and your progress, which the retired Information icon showed. */
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
    const howTo = HOW_TO.map(([title, copy]) => [title,
      player ? title === 'Event frequency' ? copy.replace('Continue acknowledges it. Fold or Back lets you inspect the marked countries without acknowledging.', 'close with X, Escape or Android Back to acknowledge and continue.') :
        title === 'Notices' ? `${copy} Close an informational notice with X, Escape or Android Back to continue. Troop choices still require Confirm; closing them never commits armies.` : copy :
        title === 'Computer turns' ? "Choose the speed beside Pause; Fast-forward plays until your next turn." :
        title === 'Attacking' || title === 'On your country' ? "Select a source and an adjacent enemy, then use Fight on the choice card for one exchange." : copy,
    ]);
    const close = h("button", { type: "button", id: "close-game-help" }, "Close help");
    close.onclick = () => this.dialog.close();
    this.dialog.append(
      h("header", { class: "game-help-head" }, h("h2", { id: "game-help-title" }, "Help & icon names"), close),
      h("section", {}, h("h3", {}, "Objective"), this.objective),
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
  dispose(): void { this.dialog.close(); this.dialog.remove(); }
}

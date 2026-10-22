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
  ["menu", "Menu", "Game speed, the game history, this help and New game."],
  ["pause", "Pause", "Stops play at once; the same icon resumes it."],
  ["fast-forward", "Fast-forward", "During computer turns: play them without waiting until your turn."],
  ["fit", "Fit", "Shows the whole map again."],
  ["countries", "Countries", "Every country by island, or only the ones you can use now."],
  ["info", "Inspect", "In the Countries list: a country's owner, armies and neighbours."],
  ["combat", "Start combat", "Ends placement once every army is placed."],
  ["move", "Move armies", "One adjacent friendly move per turn."],
  ["flag", "End turn", "Passes the turn; it also skips the friendly move."],
  ["attack", "Fight", "Rolls one exchange with the staged pair; press again to fight on."],
  ["minus", "Fewer", "Lowers a move-in or move amount."],
  ["plus", "More", "Raises a move-in or move amount."],
  ["confirm", "Confirm", "Completes a capture move-in or a move."],
  ["return", "Return", "The gold icon that brings a folded choice back."],
  ["history", "Game event log", "In the menu: every action so far. On your turn's notice: the other seats' actions since your last turn."],
  ["standings", "Standings", "Countries and armies at the end of the game."],
  ["new-game", "New game", "Gives up this game and starts a new one."],
  ["watch", "Watch computers", "After your last country falls: the computers play on."],
  ["close", "Close", "Closes a card, cancels a choice, or dismisses a notice."],
];
const HOW_TO: readonly (readonly [string, string])[] = [
  ["Placing", "Tap your countries to place armies from the pool shown at the top, then Start combat."],
  ["Attacking", "Tap one of your countries, then an adjacent enemy: that only chooses the target. Fight rolls one exchange; press it again to keep fighting, or Cancel."],
  ["Capturing", "Choose how many armies move in with −, + and Confirm. Until then the two counts are dashed."],
  ["Cards", "A required card choice opens by itself. A card that targets a country folds to a strip: tap a highlighted enemy or use Countries, then Confirm."],
  ["Notices", "The slim notice under the top icons says whose turn it is. Tap it for a hint; swipe or × dismisses it."],
  ["Seats", "You play one seat; the computers are named by their colours: Orange, Green and Purple."],
  ["Map", "Pinch or scroll to zoom, drag to pan, Fit to see everything. Cards float over the map and move aside from the countries in play. A tap that touches two countries asks which one."],
];

/** The in-game help: the objective, how the game plays, and every icon's name. Visible and accessible names match. */
export class GameHelp {
  readonly button = h("button", { id: "game-help-button", type: "button" }, "Help & icon names");
  readonly dialog = h("dialog", { class: "game-help", "aria-labelledby": "game-help-title" });
  /** T97: the objective and your progress, which the retired Information icon showed. */
  private readonly objective = h("p", { id: "game-help-objective" });
  constructor(onOpen?: () => void) {
    const close = h("button", { type: "button", id: "close-game-help" }, "Close help");
    close.onclick = () => this.dialog.close();
    this.dialog.append(
      h("header", { class: "game-help-head" }, h("h2", { id: "game-help-title" }, "Help & icon names"), close),
      h("section", {}, h("h3", {}, "Objective"), this.objective),
      ...HOW_TO.map(([title, copy]) => h("section", {}, h("h3", {}, title), h("p", {}, copy))),
      h("h3", {}, "Icons"),
      h("ul", { class: "game-help-icons", "aria-label": "Icon names" }, ...ICON_NAMES.map(([shape, name, use]) =>
        h("li", { "data-icon": shape }, glyph(shape), h("strong", {}, name), h("span", {}, use)))),
    );
    this.button.onclick = () => { onOpen?.(); this.dialog.showModal(); close.focus(); };
    this.dialog.addEventListener("close", () => { if (this.button.isConnected) this.button.focus({ preventScroll: true }); });
  }
  /** The current objective line, e.g. "Domination · 7 / 23 · Round 3". */
  setObjective(text: string): void { if (this.objective.textContent !== text) this.objective.textContent = text; }
  dispose(): void { this.dialog.close(); this.dialog.remove(); }
}

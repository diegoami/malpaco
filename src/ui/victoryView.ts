import type { GameState } from "../core";
import { h } from "./dom";
import { iconButton } from "./icons";
import type { BattleController } from "./battleController";
import { finalStandings } from "../core/victory";
import { seatName } from "./palette";

/**
 * Result data comes from the completed engine turn, including the final move.
 * The card is concise (T92, after the sketches): a title, one reason line and
 * labelled icons; the standings and files open on request (ui-054); the history only with `?log` (T101).
 */
export class VictoryView {
  readonly el = h("section", { class: "victory-result", "aria-label": "Game result", "aria-live": "polite" });
  private standingsOpen = false;
  private detailsOpen = false;

  constructor(private readonly controller: BattleController, private readonly links: { newGame: () => void; menu: () => void; details?: () => readonly string[]; files?: boolean; history?: boolean; totals?: () => string } = { newGame: () => {}, menu: () => {} }) {}

  render(state: GameState, revision: number): void {
    this.el.replaceChildren();
    this.el.hidden = !state.result;
    if (!state.result) { this.standingsOpen = false; this.detailsOpen = false; return; }
    const { reason, standings } = state.result;
    const winner = state.players.find(player => player.id === state.winner);
    const score = standings.find(row => row.player === state.winner);
    const humans = state.players.filter(player => player.kind !== "computer");
    const description = reason === "no-human-left" ? "All human seats eliminated"
      : reason === "domination" ? `Domination · ${score!.countries} of ${state.map.provinces.length} countries`
      : reason === "round-limit" ? `Round limit · ${state.turnNumber} rounds · ${decidedBy(standings)}`
      : reason === "last-seat" ? `Last seat standing · ${score!.countries} countries`
      : `Total conquest · all ${state.map.provinces.length} countries`;
    const loss = state.phase === "human-loss";
    const title = loss ? humans.length === 1 ? "You were eliminated" : "Human seats eliminated"
      : winner ? humans.length === 1 && winner.id === humans[0]!.id ? "You won" : `${seatName(state.players, winner.id)} wins` : "Game over";
    const table = h("table", { id: "victory-standings", hidden: !this.standingsOpen },
      h("caption", {}, "Countries and armies at turn end"),
      h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Seat"), h("th", { scope: "col" }, "Countries"), h("th", { scope: "col" }, "Armies"))),
      h("tbody", {}, ...standings.map(row => h("tr", { "data-result-player": row.player },
        h("th", { scope: "row" }, seatName(state.players, row.player)),
        h("td", { "data-result-countries": "" }, String(row.countries)), h("td", { "data-result-armies": "" }, String(row.armies))))));
    const standingsButton = iconButton("result-standings-button", "Standings", "Standings", "standings", false, () => {
      this.standingsOpen = !this.standingsOpen; table.hidden = !this.standingsOpen; standingsButton.setAttribute("aria-expanded", String(this.standingsOpen));
    });
    standingsButton.setAttribute("aria-controls", "victory-standings"); standingsButton.setAttribute("aria-expanded", String(this.standingsOpen));
    // The seed, options and record open on request too (ui-054).
    const lines = this.links.details?.() ?? [];
    const details = h("dl", { id: "victory-details", hidden: !this.detailsOpen }, ...lines.flatMap(line => {const [term, value] = line.split(": "); return [h("dt", {}, term!), h("dd", {}, value ?? "")];}),
      h("dt", {}, "Record"), h("dd", {}, `${state.history.length} actions`));
    const detailsButton = iconButton("result-details-button", "Details: seed, options and record", "Details", "info", false, () => {
      this.detailsOpen = !this.detailsOpen; details.hidden = !this.detailsOpen; detailsButton.setAttribute("aria-expanded", String(this.detailsOpen));
    });
    detailsButton.setAttribute("aria-controls", "victory-details"); detailsButton.setAttribute("aria-expanded", String(this.detailsOpen));
    this.el.append(h("h2", { class: "result-title" }, title), h("p", { id: "victory-reason", class: "card-note" }, description));
    // T100: the player's game shows the scoreboard's updated totals.
    const totals = this.links.totals?.();
    if (totals) this.el.append(h("p", { id: "victory-totals", class: "card-note result-totals" }, totals));
    if (loss) {
      // Stop game keeps its visible label for the whole unresolved elimination card (follow-up D).
      this.el.append(h("p", { class: "card-note victory-guidance" }, "Your result is recorded once."), h("div", { class: "card-icons victory-choices" },
        iconButton("watch-computers-button", "Watch computers", "Watch computers", "watch", false, () => this.controller.dispatch({ kind: "watchComputers" }, revision), true),
        iconButton("stop-game-button", "Stop game", "Stop game", "stop", false, () => this.controller.dispatch({ kind: "stopGame" }, revision)),
        standingsButton, detailsButton));
    } else {
      this.el.append(h("div", { class: "card-icons victory-choices" },
        iconButton("result-new-game-button", "New game", "New game", "new-game", false, () => this.links.newGame(), true),
        standingsButton,
        // T101: the history is off the player's screen; `?log` brings it back (tests and bug reports).
        ...(this.links.history ? [iconButton("result-history-button", "History", "History", "history", false, () => this.links.menu())] : []),
        ...(this.links.files === false ? [] : [iconButton("result-files-button", "Files: save or load", "Files", "files", false, () => this.links.menu())]), detailsButton));
    }
    this.el.append(table, details);
  }
}

/**
 * The criterion that actually decided a round-limit result (#132): the stored ranking is
 * by countries, then armies, then turn order; name the first that separates first and second.
 */
export function decidedBy(standings: readonly { readonly countries: number; readonly armies: number }[]): string {
  const [first, second] = standings;
  if (!first || !second) return "ranked by countries";
  if (first.countries !== second.countries) return "decided by countries";
  if (first.armies !== second.armies) return "tied on countries, decided by armies";
  return "tied on countries and armies, decided by turn order";
}

/**
 * T96: New game in the player's game asks first, then shows the given-up result (the standings
 * as they stand) before a fresh game starts. While it is open, computer play waits.
 */
export class GiveUpDialog {
  readonly dialog = h("dialog", { id: "give-up-dialog", class: "game-help give-up", "aria-labelledby": "give-up-title" });
  private result = false;
  constructor(private readonly hooks: { open: () => void; keep: () => void; giveUp: () => void; newGame: () => void }) {
    // The result card has no way back: Escape there starts nothing, it simply stays.
    this.dialog.addEventListener("cancel", event => { if (this.result) event.preventDefault(); });
    this.dialog.addEventListener("close", () => { if (!this.result) this.hooks.keep(); });
  }
  ask(): void {
    this.result = false;
    const yes = h("button", { type: "button", id: "give-up-confirm", class: "primary" }, "Give up");
    const no = h("button", { type: "button", id: "give-up-cancel" }, "Keep playing");
    yes.onclick = () => { this.result = true; this.hooks.giveUp(); };
    no.onclick = () => this.dialog.close();
    this.dialog.replaceChildren(h("h2", { id: "give-up-title" }, "Give up this game?"),
      h("p", {}, "The game ends here and a new one starts on another seed."), h("div", { class: "help-actions" }, yes, no));
    this.hooks.open();
    if (!this.dialog.open) this.dialog.showModal();
    no.focus();
  }
  /** The result card: the seats as they stood when the game was given up. */
  showResult(state: GameState, totals?: string): void {
    const again = h("button", { type: "button", id: "give-up-new-game", class: "primary" }, "New game");
    again.onclick = () => { this.dialog.close(); this.hooks.newGame(); };
    this.dialog.replaceChildren(h("h2", { id: "give-up-title" }, "You gave up"),
      h("p", { id: "give-up-reason", class: "card-note" }, `Game given up in round ${state.turnNumber}`),
      ...(totals ? [h("p", { id: "give-up-totals", class: "card-note result-totals" }, totals)] : []),
      h("table", { id: "give-up-standings" }, h("caption", {}, "Countries and armies"),
        h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Seat"), h("th", { scope: "col" }, "Countries"), h("th", { scope: "col" }, "Armies"))),
        h("tbody", {}, ...finalStandings(state).map(row => h("tr", { "data-result-player": row.player },
          h("th", { scope: "row" }, seatName(state.players, row.player)),
          h("td", {}, String(row.countries)), h("td", {}, String(row.armies)))))),
      h("div", { class: "help-actions" }, again));
    again.focus();
  }
  dispose(): void { this.result = true; if (this.dialog.open) this.dialog.close(); this.dialog.remove(); }
}

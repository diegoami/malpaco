import type { GameState } from "../core";
import { h } from "./dom";
import { iconButton } from "./icons";
import type { BattleController } from "./battleController";

/**
 * Result data comes from the completed engine turn, including the final move.
 * The card is concise (T92, after the sketches): a title, one reason line and
 * labelled icons; the standings, history and files open on request (ui-054).
 */
export class VictoryView {
  readonly el = h("section", { class: "victory-result", "aria-label": "Game result", "aria-live": "polite" });
  private standingsOpen = false;

  constructor(private readonly controller: BattleController, private readonly links: { newGame: () => void; menu: () => void } = { newGame: () => {}, menu: () => {} }) {}

  render(state: GameState, revision: number): void {
    this.el.replaceChildren();
    this.el.hidden = !state.result;
    if (!state.result) { this.standingsOpen = false; return; }
    const { reason, standings } = state.result;
    const winner = state.players.find(player => player.id === state.winner);
    const score = standings.find(row => row.player === state.winner);
    const humans = state.players.filter(player => player.kind !== "computer");
    const description = reason === "no-human-left" ? "All human seats eliminated"
      : reason === "domination" ? `Domination · ${score!.countries} of ${state.map.provinces.length} countries`
      : reason === "round-limit" ? `Round limit · ${state.turnNumber} rounds · ranked by countries, then armies, then turn order`
      : reason === "last-seat" ? `Last seat standing · ${score!.countries} countries`
      : `Total conquest · all ${state.map.provinces.length} countries`;
    const loss = state.phase === "human-loss";
    const title = loss ? humans.length === 1 ? "You were eliminated" : "Human seats eliminated"
      : winner ? humans.length === 1 && winner.id === humans[0]!.id ? "You won" : `${winner.name} wins` : "Game over";
    const table = h("table", { id: "victory-standings", hidden: !this.standingsOpen },
      h("caption", {}, "Countries and armies at turn end"),
      h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Seat"), h("th", { scope: "col" }, "Countries"), h("th", { scope: "col" }, "Armies"))),
      h("tbody", {}, ...standings.map(row => h("tr", { "data-result-player": row.player },
        h("th", { scope: "row" }, state.players.find(player => player.id === row.player)!.name),
        h("td", { "data-result-countries": "" }, String(row.countries)), h("td", { "data-result-armies": "" }, String(row.armies))))));
    const standingsButton = iconButton("result-standings-button", "Standings", "Standings", "standings", false, () => {
      this.standingsOpen = !this.standingsOpen; table.hidden = !this.standingsOpen; standingsButton.setAttribute("aria-expanded", String(this.standingsOpen));
    });
    standingsButton.setAttribute("aria-controls", "victory-standings"); standingsButton.setAttribute("aria-expanded", String(this.standingsOpen));
    this.el.append(h("h2", { class: "result-title" }, title), h("p", { id: "victory-reason", class: "card-note" }, description));
    if (loss) {
      // Stop game keeps its visible label for the whole unresolved elimination card (follow-up D).
      this.el.append(h("p", { class: "card-note victory-guidance" }, "Your result is recorded once."), h("div", { class: "card-icons victory-choices" },
        iconButton("watch-computers-button", "Watch computers", "Watch computers", "watch", false, () => this.controller.dispatch({ kind: "watchComputers" }, revision), true),
        iconButton("stop-game-button", "Stop game", "Stop game", "stop", false, () => this.controller.dispatch({ kind: "stopGame" }, revision)),
        standingsButton));
    } else {
      this.el.append(h("div", { class: "card-icons victory-choices" },
        iconButton("result-new-game-button", "New game", "New game", "new-game", false, () => this.links.newGame(), true),
        standingsButton,
        iconButton("result-history-button", "History", "History", "history", false, () => this.links.menu()),
        iconButton("result-files-button", "Files: save or load", "Files", "files", false, () => this.links.menu())));
    }
    this.el.append(table);
  }
}

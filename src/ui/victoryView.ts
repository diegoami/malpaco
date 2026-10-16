import type { GameState } from "../core";
import { h } from "./dom";
import type { BattleController } from "./battleController";

/** Result data comes from the completed engine turn, including the final move. */
export class VictoryView {
  readonly el = h("section", { class: "victory-result", "aria-label": "Game result", "aria-live": "polite" });

  constructor(private readonly controller: BattleController) {}

  render(state: GameState, revision: number): void {
    this.el.replaceChildren();
    this.el.hidden = !state.result;
    if (!state.result) return;
    const { reason, standings } = state.result;
    const winner = state.players.find(player => player.id === state.winner);
    const score = standings.find(row => row.player === state.winner);
    const description = reason === "no-human-left" ? "All human seats have been eliminated."
      : reason === "domination" ? `Domination: ${winner!.name} holds ${score!.countries} of ${state.map.provinces.length} countries.`
      : reason === "round-limit" ? `Round limit reached after ${state.turnNumber} rounds. Ranked by countries, then armies, then later turn order.`
      : reason === "last-seat" ? `${winner!.name} is the last seat standing.`
      : `Total conquest: ${winner!.name} holds every country.`;
    this.el.append(h("h2", { class: "battle-title" }, state.phase === "human-loss" ? "The human game has ended" : "Final standings"),
      h("p", { id: "victory-reason" }, description));
    const table = h("table", { id: "victory-standings" },
      h("caption", {}, "Countries and armies at turn end"),
      h("thead", {}, h("tr", {}, h("th", { scope: "col" }, "Seat"), h("th", { scope: "col" }, "Countries"), h("th", { scope: "col" }, "Armies"))),
      h("tbody", {}, ...standings.map(row => h("tr", { "data-result-player": row.player },
        h("th", { scope: "row" }, state.players.find(player => player.id === row.player)!.name),
        h("td", { "data-result-countries": "" }, String(row.countries)), h("td", { "data-result-armies": "" }, String(row.armies))))));
    this.el.append(table);
    if (state.phase === "human-loss") {
      const watch = h("button", { type: "button", id: "watch-computers-button", class: "primary" }, "Watch computers");
      const stop = h("button", { type: "button", id: "stop-game-button" }, "Stop game");
      watch.addEventListener("click", () => this.controller.dispatch({ kind: "watchComputers" }, revision));
      stop.addEventListener("click", () => this.controller.dispatch({ kind: "stopGame" }, revision));
      this.el.append(h("p", { class: "victory-guidance" }, "Watch the remaining computer seats, or stop here."),
        h("div", { class: "victory-choices" }, watch, stop));
    } else this.el.append(h("p", { class: "victory-guidance" }, "Choose New game to play again."));
  }
}

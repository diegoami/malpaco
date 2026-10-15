import { armyTotal, provincesOf, province, reinforcementIncome } from "../core";
import type { GameState, LogEntry } from "../core";
import { h, s } from "./dom";
import { seatLook } from "./palette";

export interface PanelHandlers {
  onAttack(): void;
  onStartCombat(): void;
  onEndTurn(): void;
  onNewGame(): void;
}

export interface PanelModel {
  state: GameState;
  from: string | null;
  to: string | null;
  /** Why the attack cannot be declared, or "" when it can. */
  blocked: string;
  hint: string;
  seed: number;
}

function badgeIcon(seat: number): SVGSVGElement {
  const look = seatLook(seat);
  return s("svg", { class: "chip", viewBox: "-40 -19 80 38", width: 40, height: 19, "aria-hidden": "true" }, s("path", { d: look.badge, fill: look.color, stroke: look.dark, "stroke-width": 3 }));
}

/** The same crosshair the map draws on a province you can attack. */
function crosshairIcon(): SVGSVGElement {
  return s(
    "svg",
    { class: "legend-icon", viewBox: "-22 -22 44 44", width: 18, height: 18, "aria-hidden": "true" },
    s("circle", { r: 14, fill: "#0c1722", stroke: "#f2c14e", "stroke-width": 4 }),
    s("path", { d: "M-20 0H-8M8 0H20M0 -20V-8M0 8V20", stroke: "#f2c14e", "stroke-width": 4, "stroke-linecap": "round" }),
  );
}

function describeLog(state: GameState, entry: LogEntry): string | null {
  const name = (id: string) => state.players.find((p) => p.id === id)?.name ?? id;
  const where = (id: string) => province(state.map, id)?.name ?? id;
  switch (entry.event) {
    case "attack": {
      const result = entry.captured ? `took ${where(entry.to)}` : entry.penalty ? `lost ${where(entry.from)}` : `-${entry.attackerLosses} / -${entry.defenderLosses}`;
      return `T${entry.turn} ${name(entry.attacker)}: ${where(entry.from)} → ${where(entry.to)}, ${result}`;
    }
    case "turn_ended":
      return `T${entry.turn} ${name(entry.player)} ends the turn`;
    case "eliminated":
      return `${name(entry.player)} is eliminated`;
    case "victory":
      return `${name(entry.player)} wins`;
    case "game_started":
      return null;
  }
}

/** The right-hand column: whose turn, the score, the current selection, and the two buttons. */
export class Panel {
  readonly el: HTMLElement;
  private readonly turn = h("section", { class: "card turn", "aria-live": "polite" });
  private readonly score = h("section", { class: "card score" });
  private readonly pick = h("section", { class: "card pick" });
  private readonly hint = h("p", { class: "hint", id: "hint", "aria-live": "polite" });
  private readonly log = h("ol", { class: "log", "aria-label": "Battle log" });
  private readonly startCombat = h("button", { type: "button", id: "start-combat-button", class: "primary" }, "Start combat");
  private readonly attack = h("button", { type: "button", id: "attack-button", class: "primary" }, "Attack");
  private readonly endTurn = h("button", { type: "button", id: "end-turn-button" }, "End turn");
  private readonly newGame = h("button", { type: "button", id: "new-game-button", class: "quiet" }, "New game");
  private readonly seed = h("span", { class: "seed", id: "seed" });

  constructor(handlers: PanelHandlers) {
    this.attack.addEventListener("click", () => handlers.onAttack());
    this.startCombat.addEventListener("click", () => handlers.onStartCombat());
    this.endTurn.addEventListener("click", () => handlers.onEndTurn());
    this.newGame.addEventListener("click", () => handlers.onNewGame());
    this.el = h(
      "aside",
      { class: "panel" },
      this.turn,
      this.score,
      h("section", { class: "card action" }, this.pick, this.hint, h("div", { class: "buttons" }, this.startCombat, this.attack, this.endTurn),
        // markerSpot (mapView.ts) draws the crosshair only where one fits inside
        // the province; the dashed outline is always there. The legend says so.
        h("p", { class: "legend", id: "legend" }, crosshairIcon(), "Dashed outline on every target, and a marker where one fits: provinces you can attack from the selected one.")),
      h("section", { class: "card log-card" }, h("h3", {}, "Battle log"), this.log),
      h("footer", { class: "panel-foot" }, this.newGame, this.seed),
    );
  }

  render(m: PanelModel): void {
    const { state } = m;
    const mover = state.players[state.currentPlayer];
    const seat = state.currentPlayer;
    const computer = mover?.kind === "computer";
    const finished = state.phase === "finished";
    const winner = state.players.find((p) => p.id === state.winner);
    const income = mover ? reinforcementIncome(state, mover.id) : { base: 0, islandBonus: 0, total: 0, provinceCount: 0 };
    const phase = state.phase === "reinforce" ? "Reinforcement" : state.phase === "attack" ? "Attack" : state.phase === "redeploy" ? "Handoff" : "Finished";
    this.el.dataset["phase"] = state.phase;

    this.turn.replaceChildren(
      badgeIcon(seat),
      h(
        "div",
        {},
        h("div", { class: "turn-title", id: "turn-title" }, finished ? `${winner?.name ?? "Nobody"} conquers the sea` : `${mover?.name ?? ""}'s turn`),
        h("div", { id: "seat-controller", class: "turn-sub" }, computer && !finished ? "Computer · Normal · " : "", finished ? "The game is over." : `Round ${state.turnNumber} · `, h("span", { id: "turn-phase" }, phase)),
      ),
    );
    this.turn.style.setProperty("--owner", seatLook(seat).color);

    this.score.replaceChildren(
      ...state.players.map((p, i) =>
        h(
          "div",
          { class: `score-row${i === seat && !finished ? " active" : ""}`, "data-player": p.id },
          badgeIcon(i),
          h(
            "div",
            {},
            h("div", { class: "score-name" }, p.name + (p.kind === "computer" ? " · Computer" : "")),
            h("div", { class: "score-num" }, `${provincesOf(state, p.id).length} provinces \u00b7 ${armyTotal(state, p.id)} armies`),
          ),
        ),
      ),
    );

    const from = m.from ? province(state.map, m.from) : undefined;
    const to = m.to ? province(state.map, m.to) : undefined;
    const step = (n: number, label: string, value: string, done: boolean) =>
      h("li", { class: done ? "done" : "" }, h("span", { class: "step-n" }, String(n)), h("span", { class: "step-label" }, label), h("span", { class: "step-value" }, value));
    if (state.phase === "reinforce") {
      this.pick.replaceChildren(
        h("div", { class: "income-row" }, h("span", {}, "Province income"), h("strong", {}, h("span", { id: "income-base" }, String(income.base)))),
        h("div", { class: "income-row" }, h("span", {}, "Island income"), h("strong", {}, h("span", { id: "income-island" }, String(income.islandBonus)))),
        h("div", { class: "pool-row" }, h("span", {}, "Armies to place"), h("strong", {}, h("span", { id: "reinforcement-pool" }, String(state.reinforcementPool)))),
      );
    } else {
      this.pick.replaceChildren(
        h(
          "ol",
          { class: "steps" },
          step(1, "From", from ? `${from.name} (${state.armies[from.id] ?? 0})` : "your province", from !== undefined),
          step(2, "Target", to ? `${to.name} (${state.armies[to.id] ?? 0})` : "adjacent enemy", to !== undefined),
          step(3, "Then", to ? "Attack" : "—", false),
        ),
      );
    }
    this.hint.textContent = m.hint;
    this.startCombat.hidden = state.phase !== "reinforce";
    this.startCombat.toggleAttribute("disabled", state.phase !== "reinforce" || state.reinforcementPool !== 0 || finished || computer);
    this.attack.toggleAttribute("disabled", state.phase !== "attack" || m.blocked !== "" || finished || computer);
    this.attack.title = m.blocked;
    this.endTurn.toggleAttribute("disabled", finished || computer || state.phase === "reinforce");

    const entries = state.log.map((e) => describeLog(state, e)).filter((e): e is string => e !== null);
    this.log.replaceChildren(...entries.slice(-7).reverse().map((e) => h("li", {}, e)));
    this.seed.textContent = `seed ${m.seed}`;
  }
}

import { activePlayer, attackTargets, friendlySources, friendlyTargets, ownerOf, whyNot } from "../core";
import type { GameMap, GameState } from "../core";
import { BattleController } from "./battleController";
import type { BattleSpeed } from "./battleController";
import { BattleView } from "./battleView";
import { FriendlyMoveView } from "./friendlyMoveView";
import { h } from "./dom";
import { Panel } from "./panel";
import { ReferenceMapView } from "./referenceMapView";
import { VictoryView } from "./victoryView";

/** Session-only preferences. Full presentation persistence is T56. */
export interface BattlePreferences { threshold: number; speed: BattleSpeed }

/** Reference-route host: the controller owns every selection and ordinary action. */
export class ReferenceBattleGame {
  private readonly controller: BattleController;
  private readonly mapView: ReferenceMapView;
  private readonly panel: Panel;
  private readonly battle: BattleView;
  private readonly friendly: FriendlyMoveView;
  private readonly victory: VictoryView;
  private readonly phaseActions: HTMLElement;
  private hover: string | null = null;
  private mounted = false;
  private disposed = false;
  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    if (this.controller.cancelFriendlyMove()) return;
    if (!this.controller.stop()) this.controller.select(null, null);
  };

  constructor(private readonly map: GameMap, private readonly seed: number, private readonly onNewGame: () => void, state: GameState, preferences: BattlePreferences) {
    this.controller = new BattleController(state, {
      schedule: (callback, delay) => window.setTimeout(callback, delay), cancel: handle => window.clearTimeout(handle),
    }, view => {
      preferences.threshold = view.threshold;
      preferences.speed = view.speed;
      if (this.mounted && !this.disposed) this.render();
    });
    const threshold = preferences.threshold, speed = preferences.speed;
    this.controller.setThreshold(threshold);
    this.controller.setSpeed(speed);
    this.mapView = new ReferenceMapView(map, {
      onProvince: id => this.clickProvince(id),
      onBackground: () => { this.controller.select(null, null); },
      onHover: id => { this.hover = id; if (this.mounted && !this.disposed) this.renderMap(); },
    });
    this.panel = new Panel({
      onAttack: () => { this.controller.singleExchange(); },
      onStartCombat: () => { this.controller.dispatch({ kind: "endReinforcement" }); },
      onEndTurn: () => { this.controller.dispatch({ kind: "endTurn" }); },
      onNewGame: () => { if (!this.disposed) this.onNewGame(); },
    });
    this.phaseActions = this.panel.el.querySelector<HTMLElement>(".buttons")!;
    this.battle = new BattleView(this.controller);
    this.friendly = new FriendlyMoveView(this.controller);
    this.victory = new VictoryView(this.controller);
    this.panel.el.querySelector(".action")!.append(this.battle.el, this.friendly.el, this.victory.el);
  }

  mount(root: HTMLElement): void {
    root.classList.add("battle-reference");
    const score = this.panel.el.querySelector<HTMLElement>(".score")!;
    const footer = this.panel.el.querySelector<HTMLElement>(".panel-foot")!;
    root.replaceChildren(
      h("header", { class: "topbar" }, h("h1", {}, "Malpaco"), h("span", { class: "subtitle" }, `Nine Isles · ${this.controller.state.players.length} human seats · Seed ${this.seed}`), score, footer),
      h("main", { class: "stage" }, h("section", { class: "board" }, this.mapView.el), this.panel.el));
    document.body.dataset["ready"] = "true";
    window.addEventListener("keydown", this.onKeyDown);
    this.mounted = true;
    this.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.controller.dispose();
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private clickProvince(id: string): void {
    if (this.disposed) return;
    const { state, from, to, mode } = this.controller.view;
    if (mode === "move") {
      if (from && friendlyTargets(state, from).includes(id)) this.controller.select(from, id);
      else this.controller.select(id === from ? null : id, null);
    } else if (state.phase === "reinforce") {
      this.controller.dispatch({ kind: "reinforce", province: id, amount: 1 });
    } else if (ownerOf(state, id) === activePlayer(state)?.id) {
      this.controller.select(from === id && to === null ? null : id, null);
    } else if (from !== null) {
      this.controller.select(from, id);
    }
  }

  private renderMap(): void {
    const { state, from, to, running, paused, mode } = this.controller.view;
    const blocked = running || paused || state.pendingCapture !== undefined || state.phase === "finished" || state.phase === "human-loss";
    const targets = blocked ? [] : mode === "move" ? from ? friendlyTargets(state, from) : friendlySources(state) : from ? attackTargets(state, from) : [];
    this.mapView.render({ state, selected: from, target: to, targets, hover: this.hover, flash: [] });
    if (mode === "move") {
      for (const route of this.mapView.el.querySelectorAll<SVGPolylineElement>(".lane")) {
        const ends = route.dataset["edge"]!.split("|");
        route.classList.toggle("active", from !== null && ends.includes(from) && ends.some(id => id !== from && targets.includes(id)));
      }
    }
    // Countries remain reachable for inspection and refusal feedback; the pure
    // controller refuses selection during automation and a pending move-in.
    this.mapView.el.dataset["inputBlocked"] = String(blocked);
  }

  private render(): void {
    const { state, from, to, running, paused, revision, mode } = this.controller.view;
    this.renderMap();
    this.panel.render({ state, from, to, blocked: from && to ? whyNot(state, from, to) : "Choose a source and target.", seed: this.seed,
      hint: state.phase === "reinforce" ? state.reinforcementPool ? "Place your armies on your countries, then start combat." : "All armies placed. Start combat when ready." : "",
    });
    if (state.phase === "capture") this.panel.el.querySelector("#turn-phase")!.textContent = "Capture move-in";
    if (mode === "move") this.panel.el.querySelector("#turn-phase")!.textContent = "Friendly move";
    const action = this.panel.el.querySelector<HTMLElement>(".action")!;
    action.dataset["battle"] = String(state.phase !== "reinforce");
    // Phase controls also capture a revision; an old End turn cannot become a
    // fresh command after a capture or an automatic exchange.
    const start = h("button", { type: "button", id: "start-combat-button", class: "primary", disabled: state.reinforcementPool !== 0 });
    start.textContent = "Start combat";
    start.addEventListener("click", () => this.controller.dispatch({ kind: "endReinforcement" }, revision));
    const end = h("button", { type: "button", id: "end-turn-button", disabled: running || paused || state.phase !== "attack" });
    end.textContent = "End turn";
    end.addEventListener("click", () => this.controller.dispatch({ kind: "endTurn" }, revision));
    const move = h("button", {type:"button", id:"start-friendly-move-button", disabled:running || paused || friendlySources(state).length === 0}, "Move armies");
    move.style.display = state.phase === "attack" ? "" : "none";
    move.addEventListener("click", () => { this.controller.startFriendlyMove(revision); });
    this.phaseActions.replaceChildren(...(state.phase === "reinforce" ? [start] : []), end, move);
    this.phaseActions.style.display = mode === "move" || state.result ? "none" : "";
    this.battle.render(this.controller.view);
    if (mode === "move" || state.result) this.battle.el.hidden = true;
    this.friendly.render(this.controller.view);
    this.victory.render(state, revision);
  }
}

import { activePlayer, apply, armyCount, attackTargets, classicRules, newGame, ownerOf, province, whyNot } from "../core";
import type { Action, AttackOutcome, GameMap, GameState } from "../core";
import { h } from "./dom";
import { MapView } from "./mapView";
import { Panel } from "./panel";
import { ResultDialog } from "./resultDialog";

const PLAYERS = [
  { id: "blue", name: "Blue", eliminated: false },
  { id: "amber", name: "Amber", eliminated: false },
];

/** The controller: holds the game and the selection, and redraws the three views on every change. */
export class App {
  private state: GameState;
  private selected: string | null = null;
  private target: string | null = null;
  private hover: string | null = null;
  private hint = "Select one of your provinces to begin.";
  private flash: string[] = [];
  private readonly mapView: MapView;
  private readonly panel: Panel;
  private readonly dialog = new ResultDialog();
  private readonly tip = h("div", { class: "tip", role: "tooltip", hidden: true });
  private readonly toast = h("div", { class: "toast", "aria-live": "polite" });

  constructor(
    private readonly map: GameMap,
    private seed: number,
    private readonly onNewGame: () => void,
  ) {
    this.state = newGame(map, classicRules(), PLAYERS, seed);
    this.mapView = new MapView(map, {
      onProvince: (id) => this.clickProvince(id),
      onBackground: () => this.clearSelection("Selection cleared."),
      onHover: (id) => this.setHover(id),
    });
    this.panel = new Panel({
      onAttack: () => this.attack(),
      onEndTurn: () => this.endTurn(),
      onNewGame: () => this.onNewGame(),
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.dialog.el.open) this.clearSelection("Selection cleared.");
    });
  }

  mount(root: HTMLElement): void {
    const board = h("section", { class: "board" }, this.mapView.el, this.toast, this.tip);
    board.addEventListener("pointermove", (e) => this.placeTip(e, board));
    root.replaceChildren(
      h(
        "header",
        { class: "topbar" },
        h("h1", {}, "Malpaco"),
        h("span", { class: "subtitle" }, `${this.map.name} · hot-seat for 2 · TypeScript spike`),
      ),
      h("main", { class: "stage" }, board, this.panel.el),
      this.dialog.el,
    );
    document.body.dataset["ready"] = "true";
    this.render();
  }

  // --- input ----------------------------------------------------------------

  private clickProvince(id: string): void {
    if (this.state.phase === "finished") return;
    const mover = activePlayer(this.state);
    const p = province(this.map, id);
    if (!mover || !p) return;

    if (ownerOf(this.state, id) === mover.id) {
      if (this.selected === id) return this.clearSelection("Selection cleared.");
      this.selected = id;
      this.target = null;
      const targets = this.targets();
      this.hint = targets.length > 0 ? `${p.name} can attack ${targets.length === 1 ? "one province" : `${targets.length} provinces`}. Pick a target.` : this.nothingToAttack(id);
    } else if (this.selected === null) {
      this.hint = "Select one of your own provinces first.";
    } else if (this.targets().includes(id)) {
      this.target = id;
      this.hint = `Ready: ${province(this.map, this.selected)?.name} attacks ${p.name}.`;
    } else {
      this.hint = whyNot(this.state, this.selected, id) + ".";
    }
    this.render();
  }

  private nothingToAttack(id: string): string {
    const p = province(this.map, id);
    if (!p) return "";
    if (this.state.phase !== "attack") return "Attacks are over this turn. End your turn.";
    const reasons = [...p.borders, ...p.seaLanes].map((n) => whyNot(this.state, id, n)).filter((r) => r !== "" && !r.endsWith("already yours"));
    return `${reasons[0] ?? `${p.name} has no enemy in reach`}.`;
  }

  private clearSelection(hint: string): void {
    this.selected = null;
    this.target = null;
    this.hint = hint;
    this.render();
  }

  private attack(): void {
    if (this.selected === null || this.target === null) return;
    this.run({ kind: "attack", from: this.selected, to: this.target });
  }

  private endTurn(): void {
    this.run({ kind: "endTurn" });
  }

  private run(action: Action): void {
    const before = this.state;
    const result = apply(before, action);
    if (!result.ok) {
      this.hint = result.error + ".";
      this.render();
      return;
    }
    this.state = result.state;
    this.target = null;
    if (action.kind === "endTurn") {
      this.selected = null;
      this.hint = "Select one of your provinces to begin.";
      this.flash = [];
      this.render();
      this.announce(`${activePlayer(this.state)?.name}'s turn`);
      return;
    }
    const outcome = result.outcome as AttackOutcome;
    this.flash = [outcome.from, outcome.to];
    // Keep the attacker's province selected while it can still act.
    if (this.state.phase !== "attack" || ownerOf(this.state, outcome.from) !== activePlayer(this.state)?.id || armyCount(this.state, outcome.from) < 2) {
      this.selected = null;
    }
    this.hint = "";
    this.render();
    this.flash = [];

    const loser = this.state.log.find((e) => e.event === "eliminated" && e.turn === outcome.turn);
    const extra = this.state.phase === "finished" ? `${loser && loser.event === "eliminated" ? this.nameOf(loser.player) : "The enemy"} is eliminated. ${this.nameOf(this.state.winner)} conquers the sea!` : "";
    this.dialog.show(this.state, outcome, extra, () => {
      this.hint = this.selected ? this.hintAfterAttack() : "Select one of your provinces to continue.";
      this.render();
    });
  }

  private hintAfterAttack(): string {
    return this.targets().length > 0 ? "Pick a target, or end your turn." : "No further attack from here. Pick another province or end your turn.";
  }

  private nameOf(playerId: string): string {
    return this.state.players.find((p) => p.id === playerId)?.name ?? playerId;
  }

  // --- feedback -------------------------------------------------------------

  private setHover(id: string | null): void {
    this.hover = id;
    this.renderMap();
    const p = id ? province(this.map, id) : undefined;
    if (!p || !id) {
      this.tip.hidden = true;
      return;
    }
    const island = this.map.islands.find((i) => i.id === p.island);
    const armies = armyCount(this.state, id);
    this.tip.replaceChildren(
      h("strong", {}, p.name),
      h("span", {}, `${this.nameOf(ownerOf(this.state, id))} · ${armies} ${armies === 1 ? "army" : "armies"}`),
      h("span", { class: "muted" }, `${island?.name ?? p.island} · island bonus ${island?.bonus ?? 0}`),
    );
    this.tip.hidden = false;
  }

  private placeTip(event: PointerEvent, board: HTMLElement): void {
    if (this.tip.hidden) return;
    const box = board.getBoundingClientRect();
    const x = Math.min(event.clientX - box.left + 16, box.width - 190);
    const y = Math.min(event.clientY - box.top + 18, box.height - 80);
    this.tip.style.transform = `translate(${Math.max(8, x)}px, ${Math.max(8, y)}px)`;
  }

  private announce(text: string): void {
    this.toast.textContent = text;
    this.toast.classList.remove("show");
    void this.toast.offsetWidth;
    this.toast.classList.add("show");
  }

  // --- drawing --------------------------------------------------------------

  private targets(): string[] {
    return this.selected === null ? [] : attackTargets(this.state, this.selected);
  }

  private renderMap(): void {
    this.mapView.render({
      state: this.state,
      selected: this.selected,
      target: this.target,
      targets: this.targets(),
      hover: this.hover,
      flash: this.flash,
    });
  }

  private render(): void {
    this.renderMap();
    const blocked =
      this.selected === null ? "Pick one of your provinces." : this.target === null ? "Pick an adjacent enemy." : whyNot(this.state, this.selected, this.target);
    this.panel.render({ state: this.state, from: this.selected, to: this.target, blocked, hint: this.hint, seed: this.seed });
  }
}

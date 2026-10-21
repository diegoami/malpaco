import {CardController} from "./cardController";
import {CardView} from "./cardView";
import { GameEventLog } from "./gameEventLog";
import { dominationThreshold } from "../core/victory";
import { activePlayer, attackTargets, friendlySources, friendlyTargets, ownerOf, whyNot } from "../core";
import type { GameMap, GameOptions, GameState } from "../core";
import { ComputerTurnLoop } from "./computerTurnLoop";
import { BattleController } from "./battleController";
import type { BattleSpeed } from "./battleController";
import { BattleView } from "./battleView";
import { FriendlyMoveView } from "./friendlyMoveView";
import { h } from "./dom";
import { Panel } from "./panel";
import { ReferenceMapView } from "./referenceMapView";
import { VictoryView } from "./victoryView";
import type {MatchPresentation} from "./matchPresentation";
import type {LoadedVersionedMatch} from "../core/match-save";
import { ReferenceMatchFiles } from "./referenceMatchFiles";
import { createPanelDetailControl } from "./panelDetail";
import {BattleChrome} from "./battleChrome";

/** Session-only preferences. Full presentation persistence is T56. */
export type PanelDetail = "compact" | "detailed";
export interface BattlePreferences { threshold: number; speed: BattleSpeed; detail?: PanelDetail }

const EXPLANATIONS: Record<string, string> = {
  "Reinforcement": "Place your armies one at a time on your own countries. When the pool reaches zero, start combat.",
  "Attack": "Select one of your countries, then an enemy neighbour to attack it. Move armies or end your turn when you are done.",
  "Capture move-in": "Choose how many armies move into the captured country, then confirm.",
  "Friendly move": "Choose one of your countries, then a connected country of yours, and how many armies move. This ends your turn.",
  "Cards": "Trade a set of cards for its effect, or skip.",
  "Raid target": "Choose an enemy country for the Raid, then confirm.",
  "Human seats eliminated": "Every human seat is out. Watch the computers finish, or stop the game.",
  "Game over": "The game is over. The result card offers New game, standings, history and files.",
};
const HUMAN_VERBS: Record<string, string> = {"Reinforcement": "place armies", "Attack": "attack or end turn", "Capture move-in": "move armies in", "Friendly move": "move armies", "Cards": "play cards", "Raid target": "choose a Raid target"};
const HUMAN_HINTS: Record<string, string> = {"Reinforcement": "Tap one of your countries to place an army.", "Attack": "Choose your country, then an enemy neighbour.", "Friendly move": "Choose a country to move from, then an own neighbour.", "Raid target": "Choose an enemy country on the map."};
const COMPUTER_VERBS: Record<string, string> = {"Reinforcement": "placing armies", "Attack": "attacking", "Capture move-in": "moving in", "Friendly move": "moving armies", "Cards": "playing cards", "Raid target": "raiding"};
function explain(phase: string): string { return EXPLANATIONS[phase] ?? "Follow the Current choice to continue."; }

/** Reference-route host: the controller owns every selection and ordinary action. */
export class ReferenceBattleGame {
  private readonly computer: ComputerTurnLoop | null;
  private readonly cards:CardController;
  private readonly cardControls:CardView;
  private readonly computerStatus = h("p", { id: "reference-computer-status", role: "status" });
  private readonly playbackPause = h("button", { id: "game-pause-button", type: "button" }, "Pause");
  private readonly playbackSpeed = h("select", { id: "game-speed", "aria-label": "Game speed" },
    ...["very-slow", "slow", "normal", "fast"].map(value => h("option", { value }, value === "very-slow" ? "Very slow (2 s)" : value[0]!.toUpperCase() + value.slice(1))));
  private readonly panelDetail: HTMLSelectElement;
  private readonly eventLog: GameEventLog;
  private readonly controller: BattleController;
  private readonly mapView: Pick<ReferenceMapView,"el"|"render"> & {readonly camera?: ReferenceMapView["camera"]};
  private readonly panel: Panel;
  private readonly battle: BattleView;
  private readonly friendly: FriendlyMoveView;
  private readonly victory: VictoryView;
  private readonly phaseActions: HTMLElement;
  private readonly action: HTMLElement;
  private chrome: BattleChrome | null = null;
  private noticeKey: string | null = null;
  private noticeAt = -1;
  private refusal: {text: string; key: string} | null = null;
  private outcomeSeen: unknown = null;
  private outcomeAt = -1;
  private readonly files: ReferenceMatchFiles;
  private hover: string | null = null;
  private mounted = false;
  private disposed = false;
  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented || this.eventLog.isOpen || document.querySelector("dialog[open]")) return;
    if (this.chrome?.escape()) {event.preventDefault(); return;}
    if (this.controller.cancelFriendlyMove()) return;
    if (!this.controller.stop()) this.controller.select(null, null);
  };

  constructor(private readonly map: GameMap, private readonly options: GameOptions, private readonly onNewGame: () => void, state: GameState, private readonly preferences: BattlePreferences, onLoad: (options: GameOptions, state: GameState, loaded?:LoadedVersionedMatch) => void, private readonly automatic = false, private readonly presentation?:MatchPresentation) {
    this.panelDetail = createPanelDetailControl(preferences, detail => {
      this.panel.el.closest<HTMLElement>(".battle-reference")?.setAttribute("data-panel-detail", detail);
    });
    this.eventLog = new GameEventLog(options,presentation?.initialState);
    document.body.append(this.eventLog.dialog);
    this.controller = new BattleController(state, {
      schedule: (callback, delay) => window.setTimeout(callback, delay), cancel: handle => window.clearTimeout(handle),
    }, view => {
      preferences.threshold = view.threshold;
      preferences.speed = view.speed;
      if (this.mounted && !this.disposed) this.render();
    }, next => !this.automatic || activePlayer(next)?.kind === "human" || next.phase === "human-loss");
    const human=state.players.filter(p=>p.kind!=='computer');
    this.cards=new CardController(this.controller,human.length===1?human[0]!.id:'');
    this.cardControls=new CardView(this.cards,this.controller);
    this.computer = automatic ? new ComputerTurnLoop(this.controller, { schedule: (cb, delay) => window.setTimeout(cb, delay), cancel: id => window.clearTimeout(id) }) : null;
    const threshold = preferences.threshold, speed = preferences.speed;
    this.controller.setThreshold(threshold);
    this.controller.setSpeed(speed);
    this.mapView = (presentation?.createMap ?? ((m,handlers)=>new ReferenceMapView(m,handlers)))(map, {
      onProvince: (id, activation) => { if (!activation?.repeat) this.clickProvince(id, activation?.inspect ?? false); },
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
    this.battle = new BattleView(this.controller, () => { this.controller.select(null, null); this.chrome?.close(); }, () => this.chrome?.close());
    this.friendly = new FriendlyMoveView(this.controller);
    this.victory = new VictoryView(this.controller, {newGame: () => { if (!this.disposed) this.onNewGame(); }, menu: () => this.chrome?.openMenu()});
    this.action = this.panel.el.querySelector<HTMLElement>(".action")!;
    this.action.append(this.battle.el, this.friendly.el, this.victory.el, this.cardControls.el, this.computerStatus);
    this.playbackPause.onclick = () => this.controller.setPlaybackPaused(!this.controller.playbackPaused);
    this.playbackSpeed.onchange = () => this.controller.setSpeed(this.playbackSpeed.value as BattleSpeed);
    this.files = new ReferenceMatchFiles(onLoad, options, () => this.controller.state,presentation?.identity,Boolean(presentation));
  }

  mount(root: HTMLElement): void {
    root.classList.add("battle-reference");
    root.dataset["panelDetail"] = this.preferences.detail ?? "compact";
    const score = this.panel.el.querySelector<HTMLElement>(".score")!;
    const footer = this.panel.el.querySelector<HTMLElement>(".panel-foot")!;
    const humans = this.options.seats.filter(seat => seat.kind === "human").length;
    const computers = this.options.seats.length - humans;
    const name=this.presentation?.label??"Nine Isles";
    const subtitle = computers
      ? `${name} · ${humans} human / ${computers} computer seats · ${this.automatic ? "Computer play" : "Manual play"} · Seed ${this.options.seed}`
      : `${name} · ${this.options.seats.length} human seats · Seed ${this.options.seed}`;
    const identity = h("p", {class: "game-identity"}, h("strong", {}, "Malpaco"), " · ", subtitle);
    const settings = h("section", {class: "game-settings", "aria-label": "Game settings"}, identity, h("div", { class: "game-playback" }, this.eventLog.button, h("label", { for: "game-speed" }, "Game speed"), this.playbackSpeed, h("label", { for: "panel-detail" }, "Panel detail"), this.panelDetail), footer, this.files.el);
    // The board fills the safe viewport; panel content waits, hidden, until a card requests it.
    const store = h("div", {class: "game-store", hidden: true}, this.panel.el, settings);
    this.chrome = new BattleChrome({action: this.action, cards: this.cardControls.el, history: this.panel.el.querySelector<HTMLElement>(".log-card")!, score, settings,
      phaseActions: this.phaseActions, pause: this.playbackPause, ...(this.mapView.camera ? {camera: this.mapView.camera.controls} : {})});
    root.replaceChildren(h("section", { class: "board" }, this.mapView.el), this.chrome.overlay, store);
    // Every overlay reframes the map beside it, so covered land keeps its badges.
    for (const overlay of this.chrome.obstacles) this.mapView.camera?.avoid(overlay);
    document.body.dataset["ready"] = "true";
    window.addEventListener("keydown", this.onKeyDown);
    this.mounted = true;
    this.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.chrome?.dispose();
    this.mapView.camera?.dispose();
    this.cardControls.dispose();
    this.cards.dispose();
    this.computer?.dispose();
    this.eventLog.dispose();
    this.files.dispose();
    this.controller.dispose();
    window.removeEventListener("keydown", this.onKeyDown);
  }

  private clickProvince(id: string, inspect = false): void {
    if (this.disposed || this.controller.playbackPaused) return;
    const card=this.cards.view;
    if(card.phase==='raid-target'){this.cards.selectRaidTarget(id,card.revision);this.render();return;}
    if(card.phase==='discard'||card.phase==='reward'||card.phase==='sets')return;
    const { state, from, to, mode, running, paused } = this.controller.view;
    if (this.computerActive() || running || paused || state.pendingCapture || state.phase === "finished" || state.phase === "human-loss") return;
    if (mode === "move") {
      if (from && friendlyTargets(state, from).includes(id)) this.controller.select(from, id);
      else this.controller.select(id === from ? null : id, null);
    } else if (state.phase === "reinforce") {
      this.controller.dispatch({ kind: "reinforce", province: id, amount: 1 });
    } else if (ownerOf(state, id) === activePlayer(state)?.id) {
      this.controller.select(from === id && to === null ? null : id, null);
    } else if (from !== null) {
      if (this.controller.select(from, id)) {
        if (!inspect) this.controller.singleExchange();
      } else {
        // The engine's reason appears as the one-line notice until the next choice.
        this.refusal = {text: whyNot(state, from, id), key: `${state.history.length}:${from}:${to}`};
        this.render();
      }
    }
  }

  private renderMap(): void {
    const { state, from, to, running, paused, mode } = this.controller.view;
    const blocked = this.controller.playbackPaused || this.computerActive() || running || paused || state.pendingCapture !== undefined || state.cards?.pendingDiscard!==undefined || this.controller.cardAcknowledgmentPending || state.phase === "finished" || state.phase === "human-loss";
    const targets = blocked ? [] : mode === "move" ? from ? friendlyTargets(state, from) : friendlySources(state) : from ? attackTargets(state, from) : [];
    const card=this.cards.view;
    const raidTargets=card.phase==='raid-target'?state.map.provinces.filter(p=>state.ownerOf[p.id]!==activePlayer(state)!.id).map(p=>p.id):null;
    this.mapView.render({ state, selected: from, target: card.selectedTarget??to, targets:raidTargets??targets, hover: this.hover, flash: [] });
    if (mode === "move") {
      for (const route of this.mapView.el.querySelectorAll<SVGPolylineElement>(".lane")) {
        const ends = route.dataset["edge"]!.split("|");
        route.classList.toggle("active", from !== null && ends.includes(from) && ends.some(id => id !== from && targets.includes(id)));
      }
    }
    // Countries remain reachable for inspection and refusal feedback; the pure
    // controller refuses selection during automation and a pending move-in.
    this.mapView.el.dataset["inputBlocked"] = String(blocked);
    this.mapView.camera?.refreshControls();
  }

  private computerActive(): boolean {
    const state = this.controller.state;
    return this.automatic && activePlayer(state)?.kind === "computer" && state.phase !== "human-loss" && state.phase !== "finished";
  }

  private render(): void {
    const { state, from, to, running, paused, revision, mode } = this.controller.view;
    this.cards.update();
    this.cardControls.render();
    this.eventLog.update(this.controller.state);
    this.playbackPause.textContent = this.controller.playbackPaused ? "Resume" : "Pause";
    this.playbackPause.setAttribute("aria-label", this.controller.playbackPaused ? "Resume game" : "Pause game");
    this.playbackSpeed.value = this.controller.view.speed;
    this.renderMap();
    this.panel.render({ prominentArmyTotals: true, state, from, to, blocked: from && to ? whyNot(state, from, to) : "Choose a source and target.", seed: this.options.seed,
      hint: state.phase === "reinforce" ? state.reinforcementPool ? "Place your armies on your countries, then start combat." : "All armies placed. Start combat when ready." : "",
    });
    if (state.phase === "capture") this.panel.el.querySelector("#turn-phase")!.textContent = "Capture move-in";
    if (mode === "move") this.panel.el.querySelector("#turn-phase")!.textContent = "Friendly move";
    const action = this.action;
    action.dataset["cardChoice"]=String(["sets","raid-target","discard","reward"].includes(this.cards.view.phase));
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
    // While moving, the End turn flag skips the move (the friendly card has no Skip, as in the sketches).
    this.phaseActions.replaceChildren(...(state.phase === "reinforce" ? [start] : []), end, ...(mode === "move" ? [] : [move]));
    this.phaseActions.style.display = state.result || ['sets','raid-target','discard','reward'].includes(this.cards.view.phase) ? "none" : "";
    if(state.phase==='cards')this.panel.el.querySelector('#turn-phase')!.textContent=this.cards.view.phase==='raid-target'?'Raid target':'Cards';
    this.battle.render(this.controller.view);
    if (mode === "move" || state.result || ["sets","raid-target","discard","reward"].includes(this.cards.view.phase)) this.battle.el.hidden = true;
    this.friendly.render(this.controller.view);
    this.victory.render(state, revision);
    if(this.controller.cardAcknowledgmentPending)this.victory.el.hidden=true;
    const computer = this.computerActive() && !this.controller.cardAcknowledgmentPending;
    this.panel.el.dataset["computerActive"] = String(computer);
    this.computerStatus.hidden = !computer;
    this.computerStatus.textContent = computer ? this.controller.playbackPaused ? `${activePlayer(state)!.name} · Paused` : `${activePlayer(state)!.name} is playing…` : "";
    if (computer || this.controller.playbackPaused) {
      for (const el of [this.action, this.cardControls.el, this.phaseActions].flatMap(node => [...node.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button,input")])) el.disabled = true;
      this.action.querySelector(".hint")?.replaceChildren(document.createTextNode(this.controller.playbackPaused ? "Game paused. Resume when ready; save, load and new game remain available." : "Computer turn. Save, load or start a new game at any time."));
    }
    const required = this.controller.cardAcknowledgmentPending ? "Acknowledge card reward" : this.cards.view.phase === "discard" ? "Discard a card to continue" : this.cards.view.phase === "raid-target" ? "Choose a Raid target" : this.cards.view.phase === "sets" ? "Choose or skip cards" : state.pendingCapture ? "Confirm capture move-in" : mode === "move" ? "Choose a friendly move" : state.phase === "human-loss" ? "Choose Watch computers or Stop game" : state.result ? "View game result" : null;
    const mover = activePlayer(state), result = state.result, winner = state.players.find(p => p.id === state.winner);
    const gamePaused = this.controller.playbackPaused;
    const phase = result ? state.phase === "human-loss" ? "Human seats eliminated" : "Game over" : this.panel.el.querySelector("#turn-phase")?.textContent ?? state.phase;
    const humans = state.players.filter(p => p.kind !== "computer");
    // One contextual notice (T92, after the sketches): an engine refusal, the latest
    // exchange, a computer's turn, a pause, or a human turn's prompt until they act.
    let notice: {title: string; detail?: string} | null = null;
    const nameOf = (id: string) => state.players.find(p => p.id === id)?.name ?? id;
    const place = (id: string) => this.map.provinces.find(p => p.id === id)?.name ?? id;
    const outcome = this.controller.view.lastOutcome;
    if (outcome !== this.outcomeSeen) {this.outcomeSeen = outcome; this.outcomeAt = state.history.length;}
    if (this.refusal && this.refusal.key !== `${state.history.length}:${from}:${to}`) this.refusal = null;
    if (this.refusal) notice = {title: this.refusal.text};
    else if (outcome && state.history.length === this.outcomeAt && !result) {
      const loser = outcome.attackerLosses > 0 ? outcome.from : outcome.to, lost = outcome.attackerLosses || outcome.defenderLosses, after = state.armies[loser] ?? 0;
      notice = {title: outcome.captured ? `${nameOf(outcome.attacker)} captured ${place(outcome.to)}.` : `${nameOf(state.ownerOf[loser]!)} lost ${lost}. ${after + lost} → ${after}.`,
        detail: `${nameOf(outcome.attacker)} rolled ${outcome.attackerRolls.join(", ")}; ${nameOf(outcome.defender)} rolled ${outcome.defenderRolls.join(", ")}.`};
    }
    else if (!result && computer) notice = {title: `${mover!.name} · ${gamePaused ? "paused" : COMPUTER_VERBS[phase] ?? "playing"}`};
    else if (!result && gamePaused) notice = {title: "Game paused", detail: "Resume to continue."};
    else if (!result) {
      const key = `${state.currentPlayer}:${phase}`;
      if (key !== this.noticeKey) {this.noticeKey = key; this.noticeAt = state.history.length;}
      if (state.history.length === this.noticeAt && from === null)
        notice = {title: `${humans.length > 1 ? `${mover!.name}'s turn` : "Your turn"} · ${HUMAN_VERBS[phase] ?? phase.toLowerCase()}`, ...(HUMAN_HINTS[phase] ? {detail: HUMAN_HINTS[phase]} : {})};
    }
    const viewer = (humans.length === 1 ? humans[0] : mover) ?? state.players[0]!, owned = state.map.provinces.filter(p => state.ownerOf[p.id] === viewer.id).length, total = state.map.provinces.length;
    const info = `${this.options.dominationWin ? `Domination · ${owned} / ${dominationThreshold(total)}` : `Total conquest · ${owned} / ${total}`}${this.options.roundLimit ? ` · Round ${state.turnNumber} / ${this.options.roundLimit}` : ` · Round ${state.turnNumber}`}`;
    const status = {seat: Math.max(0, state.players.indexOf((result ? winner : undefined) ?? mover!)), notice, pool: state.phase === "reinforce" && !result ? state.reinforcementPool : null,
      info, explanation: `${phase}. ${explain(phase)}`, result: !!result};
    // A required choice, or a staged attack pair, brings its card up once.
    const staged = mode !== "move" && state.phase === "attack" && from !== null && to !== null ? `pair:${from}:${to}` : null;
    const prompt = computer || gamePaused ? null : required ? `required:${required}` : staged;
    // A folded card keeps any pending choice one tap away: a required one, or a staged attack.
    const draft = Number(this.battle.el.querySelector<HTMLInputElement>("#capture-amount")?.value);
    const pending = state.pendingCapture, moveIn = pending && Number.isSafeInteger(draft) ? draft : pending?.defaultAmount;
    const choice = pending && required === "Confirm capture move-in" ? `Move-in pending · preview ${state.armies[pending.from]! - (moveIn! - pending.min)} / ${moveIn}` : required ?? (staged && !computer ? `Attack · ${this.map.provinces.find(p => p.id === from)?.name} → ${this.map.provinces.find(p => p.id === to)?.name}` : null);
    this.chrome?.update(status, choice, gamePaused, prompt);
    this.computer?.update();
  }
}

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
import { GiveUpDialog, VictoryView } from "./victoryView";
import type {MatchPresentation} from "./matchPresentation";
import type {LoadedVersionedMatch} from "../core/match-save";
import {serializeVersionedMatch} from "../core/match-save";
import { ReferenceMatchFiles } from "./referenceMatchFiles";
import { createPanelDetailControl } from "./panelDetail";
import {BattleChrome} from "./battleChrome";
import type {Notice} from "./battleChrome";
import {GameHelp} from "./help";
import {CountryPicker} from "./countryPicker";

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
  /** Help pauses computer play while it is read, and resumes only what it paused. */
  private helpPaused = false;
  private readonly help = new GameHelp(() => {
    this.chrome?.close(false);
    this.helpPaused = !this.controller.playbackPaused;
    if (this.helpPaused) this.controller.setPlaybackPaused(true);
  });
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
  /** The Raid choice whose card was last folded for map selection (T83). */
  private raidFolded: string | null = null;
  private readonly changesButton = h("button", { id: "game-changes-button", type: "button", hidden: true }, "Changes since your turn");
  /** T81: countries by name, Inspect, and the named choice after an ambiguous tap. */
  private readonly picker: CountryPicker;
  private mounted = false;
  private disposed = false;
  /** T96: the player's game asks before giving up, and keeps its record after every action. */
  private readonly giveUp: GiveUpDialog | null = null;
  private giveUpPaused = false;
  private givenUp = false;
  private persisted = -1;
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
    document.body.append(this.eventLog.dialog, this.help.dialog);
    if (presentation?.player) {
      this.giveUp = new GiveUpDialog({
        open: () => {this.chrome?.close(false); this.giveUpPaused = !this.controller.playbackPaused; if (this.giveUpPaused) this.controller.setPlaybackPaused(true);},
        keep: () => {if (this.giveUpPaused && !this.disposed) this.controller.setPlaybackPaused(false); this.giveUpPaused = false;},
        giveUp: () => {this.givenUp = true; presentation.player!.persist(null); this.giveUp!.showResult(this.controller.state);},
        newGame: () => { if (!this.disposed) this.onNewGame(); },
      });
      document.body.append(this.giveUp.dialog);
    }
    this.help.dialog.addEventListener("close", () => {if (this.helpPaused && !this.disposed) this.controller.setPlaybackPaused(false); this.helpPaused = false;});
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
    this.controller.restorePreferences(threshold, speed);
    this.mapView = (presentation?.createMap ?? ((m,handlers)=>new ReferenceMapView(m,handlers)))(map, {
      onProvince: (id, activation) => { if (!activation?.repeat) this.clickProvince(id, activation?.inspect ?? false); },
      onBackground: () => { this.controller.select(null, null); },
      onHover: id => { this.hover = id; if (this.mounted && !this.disposed) this.renderMap(); },
    });
    // Choosing from the list acts like a Shift-click: it places, selects or stages, never rolls.
    this.picker = new CountryPicker({
      choose: id => this.clickProvince(id, true),
      focus: id => this.mapView.camera?.focusOn(id),
      painted: title => this.chrome?.retitle(title),
    });
    if (this.mapView.camera) this.mapView.camera.onAmbiguousTap = ids => {
      this.picker.ask(ids);
      if (this.chrome?.openSurface !== "countries") this.chrome?.open("countries", this.chrome.countries, false);
      else this.chrome.retitle(this.picker.title);
    };
    this.panel = new Panel({
      onAttack: () => { this.controller.singleExchange(); },
      onStartCombat: () => { this.controller.dispatch({ kind: "endReinforcement" }); },
      onEndTurn: () => { this.controller.dispatch({ kind: "endTurn" }); },
      onNewGame: () => this.newGame(),
    });
    this.phaseActions = this.panel.el.querySelector<HTMLElement>(".buttons")!;
    this.battle = new BattleView(this.controller, () => { this.controller.select(null, null); this.chrome?.close(); }, () => this.chrome?.close());
    this.friendly = new FriendlyMoveView(this.controller);
    this.victory = new VictoryView(this.controller, {newGame: () => this.newGame(), menu: () => this.chrome?.openMenu(), files: this.showsFiles,
      details: () => [`Seed: ${options.seed}`, `Seats: ${options.seats.map((seat, i) => `${i + 1} ${seat.kind === "computer" ? "Computer" : "Human"}`).join(" · ")}`,
        `Victory: ${options.dominationWin ? "Domination" : "Total conquest"}${options.roundLimit ? ` · Round limit ${options.roundLimit}` : ""}`, `Map: ${presentation?.label ?? "Nine Isles"}`]});
    this.action = this.panel.el.querySelector<HTMLElement>(".action")!;
    this.action.append(this.battle.el, this.friendly.el, this.victory.el, this.cardControls.el, this.computerStatus);
    this.playbackPause.onclick = () => this.controller.setPlaybackPaused(!this.controller.playbackPaused);
    this.playbackSpeed.onchange = () => this.controller.setSpeed(this.playbackSpeed.value as BattleSpeed);
    this.files = new ReferenceMatchFiles(onLoad, options, () => this.controller.state,presentation?.identity,Boolean(presentation),undefined,presentation?.acceptsVersion1);
  }

  focusMenu(): void {this.chrome?.focusMenuOpener();}

  /** The player's game has no file controls; tests and development keep them (`?files`, or the stored flag). */
  private get showsFiles(): boolean {
    if (!this.presentation?.player) return true;
    try {return new URLSearchParams(location.search).has("files") || localStorage.getItem("malpaco:files") === "1";} catch {return false;}
  }

  /** New game: in the player's game, an unfinished game is given up first (T96). */
  private newGame(): void {
    if (this.disposed) return;
    if (this.giveUp && !this.controller.state.result) this.giveUp.ask();
    else this.onNewGame();
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
    const settings = h("section", {class: "game-settings", "aria-label": "Game settings"}, identity, h("div", { class: "game-playback" }, this.eventLog.button, this.changesButton, this.help.button, h("label", { for: "game-speed" }, "Game speed"), this.playbackSpeed, h("label", { for: "panel-detail" }, "Panel detail"), this.panelDetail), footer, ...(this.showsFiles ? [this.files.el] : []));
    // The board fills the safe viewport; panel content waits, hidden, until a card requests it.
    const store = h("div", {class: "game-store", hidden: true}, this.panel.el, settings);
    this.chrome = new BattleChrome({action: this.action, cards: this.cardControls.el, history: this.panel.el.querySelector<HTMLElement>(".log-card")!, score, settings,
      phaseActions: this.phaseActions, pause: this.playbackPause, countries: this.picker.el, ...(this.mapView.camera ? {camera: this.mapView.camera.controls} : {})});
    // The Countries icon always opens on the list.
    this.chrome.countries.addEventListener("click", () => this.picker.showList(), {capture: true});
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
    this.eventLog.dispose(); this.help.dispose(); this.giveUp?.dispose();
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
      // T82: a target is staged, never fought; only the card's Attack rolls an exchange.
      if (this.controller.select(from, id)) {
        if (this.chrome?.openSurface !== "actions") this.chrome?.open("actions", this.chrome.countries, false);
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
    // What choosing from the Countries card does now; the list's Legal filter shows exactly these.
    const human = activePlayer(state), own = (id: string) => state.ownerOf[id] === human?.id;
    const placing = !blocked && state.phase === "reinforce" && human?.kind === "human";
    const sources = !blocked && state.phase === "attack" && mode !== "move" && !from ? state.map.provinces.map(p => p.id).filter(id => own(id) && attackTargets(state, id).length > 0) : [];
    const legal = raidTargets ?? (placing ? state.map.provinces.map(p => p.id).filter(own) : sources.length ? sources : targets);
    const verb = raidTargets ? "Raid target" : placing ? "Place 1 army" : mode === "move" ? (from ? "Move here" : "Move from") : from ? "Target" : "Attack from";
    this.picker.render({state, legal, verb});
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

  /** T96: the versioned save text after every action, so a refresh replays it; a finished game clears it. */
  private persist(state: GameState): void {
    const player = this.presentation?.player;
    if (!player || this.givenUp || state.history.length === this.persisted) return;
    this.persisted = state.history.length;
    let text: string | null = null;
    if (!state.result) try {text = serializeVersionedMatch(this.options, state.history, this.presentation!.identity);} catch {text = null;}
    player.persist(text);
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
    this.persist(state);
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
    const required = this.controller.cardAcknowledgmentPending ? "Acknowledge card reward" : this.cards.view.phase === "discard" ? "Discard a card to continue" : this.cards.view.phase === "raid-target" ? (this.cards.view.selectedTarget ? "Confirm the Raid" : "Raid · choose an enemy country") : this.cards.view.phase === "sets" ? "Choose or skip cards" : state.pendingCapture ? "Confirm capture move-in" : mode === "move" ? "Choose a friendly move" : state.phase === "human-loss" ? "Choose Watch computers or Stop game" : state.result ? "View game result" : null;
    const mover = activePlayer(state), result = state.result, winner = state.players.find(p => p.id === state.winner);
    const gamePaused = this.controller.playbackPaused;
    const phase = result ? state.phase === "human-loss" ? "Human seats eliminated" : "Game over" : this.panel.el.querySelector("#turn-phase")?.textContent ?? state.phase;
    const humans = state.players.filter(p => p.kind !== "computer");
    // One contextual notice (T92, after the sketches): an engine refusal, the latest
    // exchange, a computer's turn, a pause, or a human turn's prompt until they act.
    let notice: Notice | null = null;
    const nameOf = (id: string) => state.players.find(p => p.id === id)?.name ?? id;
    const place = (id: string) => this.map.provinces.find(p => p.id === id)?.name ?? id;
    const outcome = this.controller.view.lastOutcome;
    if (outcome !== this.outcomeSeen) {this.outcomeSeen = outcome; this.outcomeAt = state.history.length;}
    if (this.refusal && this.refusal.key !== `${state.history.length}:${from}:${to}`) this.refusal = null;
    const exchange = outcome && state.history.length === this.outcomeAt && !result ? (() => {
      const loser = outcome.attackerLosses > 0 ? outcome.from : outcome.to, lost = outcome.attackerLosses || outcome.defenderLosses, after = state.armies[loser] ?? 0;
      return {title: outcome.captured ? `${nameOf(outcome.attacker)} captured ${place(outcome.to)}.` : `${nameOf(state.ownerOf[loser]!)} lost ${lost}. ${after + lost} → ${after}.`,
        detail: `${nameOf(outcome.attacker)} rolled ${outcome.attackerRolls.join(", ")}; ${nameOf(outcome.defender)} rolled ${outcome.defenderRolls.join(", ")}.`};
    })() : null;
    // T84: the other seats' actions since this human seat's turn last ended, from the replayed history.
    const changes = mover && mover.kind !== "computer" && !computer && !result ? this.eventLog.changesFor(mover.id) : null;
    this.changesButton.hidden = !changes;
    this.changesButton.onclick = changes ? () => {this.chrome?.close(); this.eventLog.openChanges(changes.from, changes.to);} : null;
    const forward = this.computer?.fastForwarding ?? false;
    if (this.refusal) notice = {title: this.refusal.text, persistent: true};
    // A computer turn keeps one notice with Fast-forward until a human seat moves (Pause sits above it).
    else if (!result && computer) notice = {title: `${mover!.name} · ${gamePaused ? "paused" : forward ? "fast-forward" : COMPUTER_VERBS[phase] ?? "playing"}`,
      ...(exchange ? {detail: `${exchange.title} ${exchange.detail}`} : {}), persistent: true,
      ...(this.computer && !gamePaused && !forward ? {action: {id: "fast-forward-button", label: "Fast-forward to your turn", shape: "fast-forward", run: () => {this.computer?.fastForward(); this.render();}}} : {})};
    else if (exchange) notice = exchange;
    else if (!result && gamePaused) notice = {title: "Game paused", detail: "Resume to continue."};
    else if (!result) {
      const key = `${state.currentPlayer}:${phase}`;
      if (key !== this.noticeKey) {this.noticeKey = key; this.noticeAt = state.history.length;}
      if (state.history.length === this.noticeAt && from === null)
        notice = {title: `${humans.length > 1 ? `${mover!.name}'s turn` : "Your turn"} · ${HUMAN_VERBS[phase] ?? phase.toLowerCase()}`, ...(HUMAN_HINTS[phase] ? {detail: HUMAN_HINTS[phase]} : {}),
          ...(changes ? {action: {id: "open-changes", label: `Changes since your last turn: ${changes.to - changes.from} actions`, shape: "history", run: () => this.changesButton.click()}} : {})};
    }
    const viewer = (humans.length === 1 ? humans[0] : mover) ?? state.players[0]!, owned = state.map.provinces.filter(p => state.ownerOf[p.id] === viewer.id).length, total = state.map.provinces.length;
    const info = `${this.options.dominationWin ? `Domination · ${owned} / ${dominationThreshold(total)}` : `Total conquest · ${owned} / ${total}`}${this.options.roundLimit ? ` · Round ${state.turnNumber} / ${this.options.roundLimit}` : ` · Round ${state.turnNumber}`}`;
    // A human loss names no winner while computers remain, so its badge is neutral (#132).
    const status = {seat: state.phase === "human-loss" ? null : Math.max(0, state.players.indexOf((result ? winner : undefined) ?? mover!)), notice, pool: state.phase === "reinforce" && !result ? state.reinforcementPool : null,
      info, explanation: `${phase}. ${explain(phase)}`, result: !!result};
    // A required choice, or a staged attack pair, brings its card up once.
    const staged = mode !== "move" && state.phase === "attack" && from !== null && to !== null ? `pair:${from}:${to}` : null;
    // T83: choosing a Raid target folds the card to its strip so the whole map is free; a
    // chosen target brings the card back with its preview and Confirm.
    const raiding = this.cards.view.phase === "raid-target", raidTarget = this.cards.view.selectedTarget;
    if (raiding && !raidTarget && !computer && !gamePaused) {
      const key = `raid:${state.history.length}`;
      if (key !== this.raidFolded) {this.raidFolded = key; if (this.chrome?.openSurface === "actions") this.chrome.close(false);}
    }
    const prompt = computer || gamePaused ? null : raiding ? (raidTarget ? `raid:${raidTarget}` : null) : required ? `required:${required}` : staged;
    // A folded card keeps any pending choice one tap away: a required one, or a staged attack.
    const draft = Number(this.battle.el.querySelector<HTMLInputElement>("#capture-amount")?.value);
    const pending = state.pendingCapture, moveIn = pending && Number.isSafeInteger(draft) ? draft : pending?.defaultAmount;
    // A computer seat's own pending choice is never yours to return to (T84).
    const choice = computer ? null : pending && required === "Confirm capture move-in" ? `Move-in pending · preview ${state.armies[pending.from]! - (moveIn! - pending.min)} / ${moveIn}` : required ?? (staged && !computer ? `Attack · ${this.map.provinces.find(p => p.id === from)?.name} → ${this.map.provinces.find(p => p.id === to)?.name}` : null);
    this.chrome?.update(status, choice, gamePaused, prompt, raiding && !raidTarget && !computer);
    this.computer?.update();
  }
}

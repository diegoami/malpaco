import {CardController} from "./cardController";
import {CardView, HandDialog} from "./cardView";
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
import {BattleChrome, forgetCardPosition} from "./battleChrome";
import {glyph} from "./icons";
import type {Notice} from "./battleChrome";
import {GameHelp} from "./help";
import {CountryPicker} from "./countryPicker";
import {ProvinceAction} from "./provinceAction";
import {seatName} from "./palette";
import {ScoreboardDialog} from "./scoreboard";
import type {GameOutcome} from "./scoreboard";
import {ComputerFeedbackController} from './computerFeedback';
import {paintComputerFeedback} from './computerFeedbackView';
import {TurnTracker} from './turnTracker';
import {WorldEventController} from './eventController';
import {WorldEventView} from './eventView';
import {connectNativeGame} from "./nativeGameHost";
import type {NativeGameBinding} from "./nativeGameHost";
import {NextGameSettingsDialog} from "./nextGameSettings";

/** Presentation preferences; the player's game keeps its speed and Pause in this browser (T100). */
export type PanelDetail = "compact" | "detailed";
export interface BattlePreferences { threshold: number; speed: BattleSpeed; detail?: PanelDetail }

const HUMAN_VERBS: Record<string, string> = {"Reinforcement": "place armies", "Attack": "attack or end turn", "Capture move-in": "move armies in", "Friendly move": "move armies", "Cards": "play cards", "Raid target": "choose a Raid target"};
const HUMAN_HINTS: Record<string, string> = {"Reinforcement": "Tap one of your countries to place an army.", "Attack": "Choose your country, then an enemy neighbour.", "Friendly move": "Choose a country to move from, then an own neighbour.", "Raid target": "Choose an enemy country on the map."};

/** Reference-route host: the controller owns every selection and ordinary action. */
export class ReferenceBattleGame {
  private readonly computer: ComputerTurnLoop | null;
  private readonly cards:CardController;
  private readonly cardControls:CardView;
  private readonly computerStatus = h("p", { id: "reference-computer-status", role: "status" });
  private readonly playbackPause = h("button", { id: "game-pause-button", type: "button" }, "Pause");
  private readonly playbackSpeed = h("select", { id: "game-speed", "aria-label": "Game speed", title: "Game speed" },
    ...["very-slow", "slow", "normal", "fast"].map(value => h("option", { value }, value === "very-slow" ? "Very slow" : value[0]!.toUpperCase() + value.slice(1))));
  /** T101: Fast-forward rests beside Pause and the speed choice, the only controls while a computer plays. */
  private readonly forward = h("button", { id: "fast-forward-button", type: "button", "aria-label": "Fast-forward to your turn", title: "Fast-forward to your turn", "aria-pressed": "false" }, glyph("fast-forward"));
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
  private readonly files: ReferenceMatchFiles;
  private hover: string | null = null;
  /** The Raid choice whose card was last folded for map selection (T83). */
  private raidFolded: string | null = null;
  /** T81: countries by name, Inspect, and the named choice after an ambiguous tap. */
  private readonly picker: CountryPicker;
  private mounted = false;
  private disposed = false;
  /** T96: the player's game asks before giving up, and keeps its record after every action. */
  private readonly giveUp: GiveUpDialog | null = null;
  private giveUpPaused = false;
  private givenUp = false;
  private persisted = -1;
  /** T103: the history length at which placement last ended by itself, so it ends once. */
  private autoStarted = -1;
  /** T103: Fight or Move on the selected country (the player's game), and the country Fight is armed for. */
  private readonly provinceAction: ProvinceAction | null = null;
  private armed: string | null = null;
  /** T104: your cards on request (the player's game). */
  private hand: HandDialog | null = null;
  private anchoredTo: string | null = null;
  private persistedSeat = -1;
  /** T100: the menu's scoreboard (the player's game only); a game is recorded once, if it was unfinished when it opened. */
  private readonly scoreboard: ScoreboardDialog | null = null;
  private scoreboardPaused = false;
  private readonly nextSettings: NextGameSettingsDialog | null = null;
  private settingsPaused = false;
  private recorded = false;
  private readonly openedUnfinished: boolean;
  private readonly feedback:ComputerFeedbackController|null;
  private readonly turnTracker:TurnTracker|null;
  private readonly worldEvents:WorldEventController|null;
  private readonly worldView:WorldEventView|null;
  private readonly nativeHost: NativeGameBinding | null;
  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || event.defaultPrevented || this.eventLog.isOpen || document.querySelector("dialog[open]")) return;
    if (this.chrome?.escape()) {event.preventDefault(); return;}
    if(this.worldEvents?.fold()){this.render();event.preventDefault();return;}
    if (this.controller.cancelFriendlyMove()) return;
    if (!this.controller.stop()) this.controller.select(null, null);
  };

  constructor(private readonly map: GameMap, private readonly options: GameOptions, private readonly onNewGame: () => void, state: GameState, private readonly preferences: BattlePreferences, onLoad: (options: GameOptions, state: GameState, loaded?:LoadedVersionedMatch) => void, private readonly automatic = false, private readonly presentation?:MatchPresentation) {
    this.eventLog = new GameEventLog(options,presentation?.initialState);
    document.body.append(this.eventLog.dialog, this.help.dialog);
    if (presentation?.player) {this.provinceAction = new ProvinceAction(); document.body.append(this.provinceAction.el);}
    if (presentation?.player) {
      this.giveUp = new GiveUpDialog({
        open: () => {this.chrome?.close(false); this.giveUpPaused = !this.controller.playbackPaused; if (this.giveUpPaused) this.controller.setPlaybackPaused(true);},
        keep: () => {if (this.giveUpPaused && !this.disposed) this.controller.setPlaybackPaused(false); this.giveUpPaused = false;},
        giveUp: () => {this.givenUp = true; this.record(this.controller.state, "gave-up"); presentation.player!.persist(null); this.giveUp!.showResult(this.controller.state, presentation.player!.totals?.());},
        newGame: () => { if (!this.disposed) this.freshGame(); },
      });
      document.body.append(this.giveUp.dialog);
      this.scoreboard = new ScoreboardDialog(undefined, () => {this.chrome?.close(false); this.scoreboardPaused = !this.controller.playbackPaused; if (this.scoreboardPaused) this.controller.setPlaybackPaused(true);});
      this.scoreboard.dialog.addEventListener("close", () => {if (this.scoreboardPaused && !this.disposed) this.controller.setPlaybackPaused(false); this.scoreboardPaused = false;});
      document.body.append(this.scoreboard.dialog);
      this.nextSettings = new NextGameSettingsDialog(undefined,
        () => {this.chrome?.close(false); this.settingsPaused = !this.controller.playbackPaused; if (this.settingsPaused) this.controller.setPlaybackPaused(true);},
        () => {if (this.settingsPaused && !this.disposed) this.controller.setPlaybackPaused(false); this.settingsPaused = false; this.chrome?.focusMenuOpener();});
      document.body.append(this.nextSettings.dialog);
    }
    this.openedUnfinished = !state.result;
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
    if(presentation?.player){this.hand=new HandDialog(this.cards,()=>this.chrome?.close(false));document.body.append(this.hand.dialog);}
    this.worldEvents=state.rules.events?new WorldEventController(this.controller,human.length===1?human[0]!.id:'',{ack:presentation?.player?.eventAck??0,cleared:presentation?.player?.eventMarksCleared??0},p=>presentation?.player?.remember?.({eventAck:p.ack,eventMarksCleared:p.cleared})):null;
    this.worldView=this.worldEvents?new WorldEventView(this.worldEvents,()=>this.render()):null;this.worldEvents?.update();
    this.computer = automatic ? new ComputerTurnLoop(this.controller, { schedule: (cb, delay) => window.setTimeout(cb, delay), cancel: id => window.clearTimeout(id) }) : null;
    const threshold = preferences.threshold, speed = preferences.speed;
    this.controller.restorePreferences(threshold, speed);
    // T100: a game left paused opens paused.
    if (presentation?.player?.paused) this.controller.setPlaybackPaused(true);
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
    this.feedback=automatic&&presentation?.player?new ComputerFeedbackController(this.controller,{schedule:(cb,ms)=>window.setTimeout(cb,ms),cancel:id=>window.clearTimeout(id)},()=>{if(this.mounted&&!this.disposed)this.renderMap();}):null;
    this.turnTracker=presentation?.player?new TurnTracker():null;
    this.panel = new Panel({
      onAttack: () => { this.controller.singleExchange(); },
      onStartCombat: () => { this.controller.dispatch({ kind: "endReinforcement" }); },
      onEndTurn: () => { this.controller.dispatch({ kind: "endTurn" }); },
      onNewGame: () => this.newGame(),
    });
    this.phaseActions = this.panel.el.querySelector<HTMLElement>(".buttons")!;
    this.battle = new BattleView(this.controller, () => { this.controller.select(null, null); this.chrome?.close(); });
    this.friendly = new FriendlyMoveView(this.controller);
    this.victory = new VictoryView(this.controller, {newGame: () => this.newGame(), menu: () => this.chrome?.openMenu(), files: this.showsFiles, history: this.showsLog, ...(presentation?.player?.record && presentation.player.totals ? {totals: presentation.player.totals} : {}),
      details: () => [`Seed: ${options.seed}`, `Seats: ${this.controller.state.players.map(player => `${seatName(this.controller.state.players, player.id)} ${player.kind === "computer" ? "Computer" : "Human"}`).join(" · ")}`,
        `Victory: ${options.dominationWin ? "Domination" : "Total conquest"}${options.roundLimit ? ` · Round limit ${options.roundLimit}` : ""}`, `Map: ${presentation?.label ?? "Nine Isles"}`]});
    this.action = this.panel.el.querySelector<HTMLElement>(".action")!;
    this.action.append(this.battle.el, this.friendly.el, this.victory.el, this.cardControls.el, this.computerStatus);
    this.playbackPause.onclick = () => {
      if (this.controller.playbackPaused && this.nativeHost && !this.nativeHost.acknowledgeResume()) return;
      this.controller.setPlaybackPaused(!this.controller.playbackPaused, true);
      presentation?.player?.remember?.({paused: this.controller.playbackPaused});
    };
    this.playbackSpeed.onchange = () => {if (this.controller.setSpeed(this.playbackSpeed.value as BattleSpeed)) presentation?.player?.remember?.({speed: this.controller.view.speed});};
    this.forward.onclick = () => {this.computer?.fastForward(); this.render();};
    this.files = new ReferenceMatchFiles(onLoad, options, () => this.controller.state,presentation?.identity,Boolean(presentation),undefined,presentation?.acceptsVersion1);
    this.nativeHost = presentation?.player ? connectNativeGame(() => {
      this.controller.pauseUntilExplicitResume();
      presentation.player!.remember?.({paused:true});
      this.persist(this.controller.state, true);
    }, () => {if(this.chrome?.escape())return true;if(this.worldEvents?.fold()){this.render();return true;}return false;}) : null;
  }

  focusMenu(): void {this.chrome?.focusMenuOpener();}

  /** T101: the game history is off the player's screen; `?log` brings its icon back (tests and bug reports). */
  private readonly showsLog = (() => {try {return new URLSearchParams(location.search).has("log");} catch {return false;}})();

  /** The player's game has no file controls; tests and development keep them (`?files`, or the stored flag). */
  private get showsFiles(): boolean {
    if (!this.presentation?.player) return true;
    try {return new URLSearchParams(location.search).has("files") || localStorage.getItem("malpaco:files") === "1";} catch {return false;}
  }

  /** New game: in the player's game, an unfinished game is given up first (T96). */
  private newGame(): void {
    if (this.disposed) return;
    if (this.giveUp && !this.controller.state.result) this.giveUp.ask();
    else this.freshGame();
  }

  /** A new game puts the cards back in their corners (T101). */
  private freshGame(): void {forgetCardPosition(); this.onNewGame();}

  mount(root: HTMLElement): void {
    root.classList.add("battle-reference");
    // T112: New game, Settings and Help are direct corner buttons. Settings holds the next-game choices, seed and scoreboard; totals, card
    // counts, the battle log and panel detail are gone. T101: the speed choice moved to the corner
    // beside Pause, and the history icon shows only with `?log`.
    const newGame = this.panel.el.querySelector<HTMLButtonElement>("#new-game-button")!;
    // The seed stays as one quiet line, so a game can be named in a report.
    const settings = h("section", {class: "game-settings", "aria-label": "Game settings"}, h("p", {class: "game-identity"}, `Seed ${this.options.seed}`),
      ...(this.nextSettings?[this.nextSettings.inlineContent()]:[]), h("div", { class: "game-menu-actions" }, ...(this.nextSettings?[]:[this.help.button,newGame]), ...(this.showsLog ? [this.eventLog.button] : []), ...(this.scoreboard ? [this.scoreboard.button] : [])), ...(this.showsFiles ? [this.files.el] : []));
    const speed = h("div", {class: "game-speed-control"}, this.playbackSpeed);
    // The board fills the safe viewport; panel content waits, hidden, until a card requests it.
    const store = h("div", {class: "game-store", hidden: true}, this.panel.el, settings);
    this.chrome = new BattleChrome({action: this.action, settings,
      ...(this.nextSettings?{primaryActions:{newGame,help:this.help.button},onMenuOpen:()=>{this.nextSettings?.refresh();if(this.worldEvents?.fold())this.worldView?.render(this.controller.state);}}:{}), phaseActions: this.phaseActions, pause: this.playbackPause, speed, ...(this.computer ? {forward: this.forward} : {}), countries: this.picker.el, ...(this.mapView.camera ? {camera: this.mapView.camera.controls} : {})});
    // T104: your cards sit beside the menu icon.
    if (this.hand) this.chrome.hud.append(this.hand.button);
    if(this.worldView)this.chrome.overlay.append(this.worldView.el);
    if(this.turnTracker)this.chrome.overlay.append(this.turnTracker.el);
    // The Countries icon always opens on the list.
    this.chrome.countries.addEventListener("click", () => this.picker.showList(), {capture: true});
    // The history is its own card over the map: the menu steps aside for it.
    this.eventLog.button.addEventListener("click", () => this.chrome?.close(false), {capture: true});
    // Its icon went back with the menu, so closing the history returns focus to the menu icon.
    this.eventLog.dialog.addEventListener("close", () => { const active = document.activeElement; if (!this.disposed && (!active || active === document.body || !active.getClientRects().length)) this.chrome?.focusMenuOpener(); });
    root.replaceChildren(h("section", { class: "board" }, this.mapView.el), this.chrome.overlay, store);
    // Only the corner icons reframe the map; cards and notices float over it (T97).
    if(this.turnTracker)this.mapView.camera?.avoid(this.turnTracker.el);
    for (const overlay of this.chrome.obstacles) this.mapView.camera?.avoid(overlay);
    document.body.dataset["ready"] = "true";
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("resize", this.onResize);
    this.mounted = true;
    this.render();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.chrome?.dispose();
    this.mapView.camera?.dispose();
    this.feedback?.dispose();
    this.worldEvents?.dispose();this.worldView?.dispose();
    this.cardControls.dispose();
    this.cards.dispose();
    this.computer?.dispose();
    this.eventLog.dispose(); this.help.dispose(); this.provinceAction?.dispose(); this.hand?.dispose(); this.giveUp?.dispose(); this.scoreboard?.dispose(); this.nextSettings?.dispose();
    this.nativeHost?.dispose();
    this.files.dispose();
    this.controller.dispose();
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("resize", this.onResize);
  }

  private readonly onResize = () => { if (this.mounted && !this.disposed) this.placeCard(); };

  /** T97: the open card moves aside from the badges of the countries in play. */
  private placeCard(): void {
    const { state, from, to } = this.controller.view;
    const pending = state.pendingCapture, raid = this.cards.view.selectedTarget;
    const ids = [...new Set([pending?.from ?? from, pending?.to ?? to, raid].filter((id): id is string => !!id))];
    const badges = ids.flatMap(id => [...this.mapView.el.querySelectorAll<SVGGraphicsElement>(`[data-country="${CSS.escape(id)}"] :is(.badge, .army-count)`)]).map(node => node.getBoundingClientRect()).filter(rect => rect.width > 0 && rect.height > 0);
    this.chrome?.place(badges);
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
      // T82: a target is staged, never fought, unless the player armed Fight on the source (T103).
      if (this.controller.select(from, id)) {
        // T103: with Fight armed on the source, the tapped enemy is fought at once, one round.
        if (this.armed === from) this.controller.singleExchange();
        else if (this.chrome?.openSurface !== "actions") this.chrome?.open("actions", this.chrome.countries, false);
      } else {
        // The engine's reason appears as the one-line notice until the next choice.
        this.refusal = {text: whyNot(state, from, id), key: `${state.history.length}:${from}:${to}`};
        this.render();
      }
    }
  }

  private renderMap(): void {
    const { state, from, to, running, paused, mode } = this.controller.view;
    const blocked = this.controller.computerFeedbackPending || this.controller.playbackPaused || this.computerActive() || running || paused || state.pendingCapture !== undefined || state.cards?.pendingDiscard!==undefined || this.controller.cardAcknowledgmentPending || state.phase === "finished" || state.phase === "human-loss";
    const targets = blocked ? [] : mode === "move" ? from ? friendlyTargets(state, from) : friendlySources(state) : from ? attackTargets(state, from) : [];
    const card=this.cards.view;
    const raidTargets=card.phase==='raid-target'?state.map.provinces.filter(p=>state.ownerOf[p.id]!==activePlayer(state)!.id).map(p=>p.id):null;
    // T101: a computer's actions show only counts and colours changing: no pair, outline or name.
    if (this.computerActive()) this.mapView.render({ state: state.pendingCapture ? (({pendingCapture: _pending, ...rest}) => rest)(state) : state, selected: null, target: null, targets: [], hover: this.hover, flash: [],...(this.worldEvents?{eventMarks:this.worldEvents.view.marked}:{}) });
    else this.mapView.render({ state, selected: from, target: card.selectedTarget??to, targets:raidTargets??targets, hover: this.hover, flash: [],...(this.worldEvents?{eventMarks:this.worldEvents.view.marked}:{}) });
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
    if(this.feedback)paintComputerFeedback(this.mapView.el,this.controller.state,this.feedback.frame);
  }

  /**
   * T96: the versioned save text after every action, so a refresh replays it; a finished game clears it.
   * T101: writing it replays the whole game, so during a computer's turn it is written once, when
   * the turn passes, not after every action; the computers' actions are a pure function of the
   * game, so a reload in mid-turn replays that turn's actions again, the same ones.
   */
  private persist(state: GameState, force = false): void {
    const player = this.presentation?.player;
    if (!player || this.givenUp || !force && state.history.length === this.persisted) return;
    if (!force && this.computerActive() && state.currentPlayer === this.persistedSeat) return;
    this.persisted = state.history.length; this.persistedSeat = state.currentPlayer;
    let text: string | null = null;
    if (!state.result) try {text = serializeVersionedMatch(this.options, state.history, this.presentation!.identity);} catch {text = null;}
    player.persist(text);
  }

  /** T100: the player's game ends once: a win, an elimination (Lost at once, even if you then watch), or a give-up. */
  private record(state: GameState, outcome?: GameOutcome): void {
    const player = this.presentation?.player, human = state.players.filter(p => p.kind !== "computer");
    if (!player?.record || this.recorded || !this.openedUnfinished || human.length !== 1) return;
    const result: GameOutcome | null = outcome ?? (state.result ? state.winner === human[0]!.id ? "won" : "lost" : null);
    if (!result) return;
    this.recorded = true;
    player.record({result, rounds: state.turnNumber, countries: state.map.provinces.filter(p => state.ownerOf[p.id] === human[0]!.id).length, seed: this.options.seed});
  }

  private computerActive(): boolean {
    const state = this.controller.state;
    return this.automatic && activePlayer(state)?.kind === "computer" && state.phase !== "human-loss" && state.phase !== "finished";
  }

  private render(): void {
    const seen = this.controller.view;
    this.feedback?.update({speed:seen.speed,forward:this.computer?.fastForwarding??false,paused:this.controller.playbackPaused,ack:this.controller.cardAcknowledgmentPending,reduced:window.matchMedia('(prefers-reduced-motion: reduce)').matches});
    if(this.controller.view!==seen&&this.mounted)return;
    this.cards.update();
    // A step the card update took (a Cards phase with no set passes) has already rendered the
    // newer state; finishing this render would put the older one back (the pool, the notice).
    if (this.controller.view !== seen && this.mounted) return;
    const beforeWorld=this.controller.view;this.worldEvents?.update(this.controller.cardRewardAcknowledgmentPending||Boolean(this.feedback?.pending));if(this.controller.view!==beforeWorld&&this.mounted)return;
    const { state, from, to, running, paused, revision, mode } = this.controller.view;
    const worldPending=this.worldEvents?.view.requiresAck??false,feedbackPending=Boolean(this.feedback?.pending);
    this.cardControls.render();
    this.hand?.update();
    this.eventLog.update(this.controller.state);
    this.record(state);
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
    // T103 (owner): the country already selected stays selected as the move's source, when it can be one.
    move.addEventListener("click", () => { if (this.controller.startFriendlyMove(revision) && from && friendlySources(state).includes(from)) this.controller.select(from, null); });
    // While moving, the End turn flag skips the move (the friendly card has no Skip, as in the sketches).
    this.phaseActions.replaceChildren(...(state.phase === "reinforce" ? [start] : []), end, ...(mode === "move" ? [] : [move]));
    this.phaseActions.style.display = state.result || ['sets','raid-target','discard','reward'].includes(this.cards.view.phase) ? "none" : "";
    if(state.phase==='cards')this.panel.el.querySelector('#turn-phase')!.textContent=this.cards.view.phase==='raid-target'?'Raid target':'Cards';
    this.battle.render(this.controller.view);
    if (mode === "move" || state.result || ["sets","raid-target","discard","reward"].includes(this.cards.view.phase)) this.battle.el.hidden = true;
    this.friendly.render(this.controller.view);
    this.victory.render(state, revision);
    if(this.controller.cardAcknowledgmentPending)this.victory.el.hidden=true;
    const computer = (this.computerActive()||feedbackPending) && !this.controller.cardAcknowledgmentPending;
    // #267: a computer's turn shows only the speed controls, so your cards window closes.
    if (computer) this.hand?.hide();
    // T103: on the player's own turn, with no card choice waiting.
    const quiet = !computer && !this.controller.playbackPaused && !state.result && activePlayer(state)?.kind === "human"
      && !this.controller.cardAcknowledgmentPending && !["sets","raid-target","discard","reward"].includes(this.cards.view.phase);
    // T103 (owner): when the player places their last army, combat starts as if Start combat were pressed.
    if (this.presentation?.player && quiet && state.phase === "reinforce" && state.reinforcementPool === 0
      && state.history.at(-1)?.kind === "reinforce" && this.autoStarted !== state.history.length) {
      this.autoStarted = state.history.length;
      queueMicrotask(() => {if (!this.disposed) this.controller.dispatch({ kind: "endReinforcement" }, revision);});
    }
    if (this.provinceAction) {
      // On the selected country: Fight when it can attack (armed by a press; then a tapped enemy is one
      // round, and a press with a target is another), else Move (a press starts the move from it).
      const source = quiet && state.phase === "attack" && !state.pendingCapture && !running ? from : null;
      if (this.armed !== source) this.armed = null;
      if (source && mode !== "move" && attackTargets(state, source).length) {
        const ready = !!to && whyNot(state, source, to) === "";
        this.provinceAction.show(source, "fight", !paused, this.armed === source, () => {
          if (ready) this.controller.singleExchange(revision);
          else {this.armed = source; this.render();}
        });
      } else if (source && mode !== "move" && friendlySources(state).includes(source)) {
        this.provinceAction.show(source, "move", !paused, false, () => {if (this.controller.startFriendlyMove(revision)) this.controller.select(source, null);});
      } else this.provinceAction.hide();
      // The amount bar of a capture or a move rests beside that country.
      const anchor = state.pendingCapture ? state.pendingCapture.to : mode === "move" && from && to ? to : null;
      if (anchor !== this.anchoredTo) {
        this.anchoredTo = anchor;
        // Beside the destination's count, clear of both countries' counts (#266).
        const other = state.pendingCapture ? state.pendingCapture.from : from;
        const box = (id: string | null) => id ? document.querySelector(`[data-country="${CSS.escape(id)}"] .count`)?.getBoundingClientRect() ?? null : null;
        this.chrome?.anchorTo(anchor ? () => {const near = box(anchor); return near ? {near, avoid: [near, box(other)].filter((r): r is DOMRect => !!r)} : null;} : null);
      }
    }
    const name = (id: string | undefined) => seatName(state.players, id);
    this.panel.el.dataset["computerActive"] = String(computer);
    this.computerStatus.hidden = !computer;
    this.computerStatus.textContent = computer ? this.controller.playbackPaused ? `${name(activePlayer(state)!.id)} · Paused` : `${name(activePlayer(state)!.id)} is playing…` : "";
    if (computer || this.controller.playbackPaused) {
      for (const el of [this.action, this.cardControls.el, this.phaseActions].flatMap(node => [...node.querySelectorAll<HTMLButtonElement | HTMLInputElement>("button,input")])) el.disabled = true;
      this.action.querySelector(".hint")?.replaceChildren(document.createTextNode(this.controller.playbackPaused ? "Game paused. Resume when ready; New game remains available." : "Computer turn. Start a new game at any time."));
    }
    const required = worldPending||feedbackPending?null:this.controller.cardAcknowledgmentPending ? "Acknowledge card reward" : this.cards.view.phase === "discard" ? "Discard a card to continue" : this.cards.view.phase === "raid-target" ? (this.cards.view.selectedTarget ? "Confirm the Raid" : "Raid · choose an enemy country") : this.cards.view.phase === "sets" ? "Choose or skip cards" : state.pendingCapture ? "Confirm capture move-in" : mode === "move" ? "Choose a friendly move" : state.phase === "human-loss" ? "Choose Watch computers or Stop game" : state.result ? "View game result" : null;
    const mover = activePlayer(state), result = state.result, winner = state.players.find(p => p.id === state.winner);
    const gamePaused = this.controller.playbackPaused;
    const phase = result ? state.phase === "human-loss" ? "Human seats eliminated" : "Game over" : this.panel.el.querySelector("#turn-phase")?.textContent ?? state.phase;
    const humans = state.players.filter(p => p.kind !== "computer");
    // One contextual notice (T92, trimmed by T97): an engine refusal, a computer's turn with
    // Fast-forward, a pause, or a human turn's line until they act. Exchange outcomes are not noticed.
    let notice: Notice | null = null;
    if (this.refusal && this.refusal.key !== `${state.history.length}:${from}:${to}`) this.refusal = null;
    // T84: the other seats' actions since this human seat's turn last ended, from the replayed history
    // (T101: only with `?log`, like the history itself).
    const changes = this.showsLog && mover && mover.kind !== "computer" && !computer && !result ? this.eventLog.changesFor(mover.id) : null;
    this.eventLog.changes = () => changes;
    const forward = this.computer?.fastForwarding ?? false;
    // T101: Fast-forward rests beside Pause while a computer plays; pressed while it runs.
    this.forward.hidden = !computer || !!result || gamePaused;
    this.forward.setAttribute("aria-pressed", String(forward));
    if (this.refusal) notice = {title: this.refusal.text, persistent: true};
    // T101 (owner, 2026-10-22): one quiet notice per computer turn, "Orange's turn", with no buttons;
    // the map shows only counts and colours changing.
    else if (!result && computer) notice = {title: `${name(mover!.id)}'s turn`, persistent: true, quiet: true, ...(gamePaused ? {detail: "Paused. Resume to continue."} : {})};
    else if (!result && gamePaused) notice = {title: "Game paused", detail: "Resume to continue."};
    else if (!result) {
      const key = `${state.currentPlayer}:${phase}`;
      if (key !== this.noticeKey) {this.noticeKey = key; this.noticeAt = state.history.length;}
      if (state.history.length === this.noticeAt && from === null)
        notice = {title: `${humans.length > 1 ? `${name(mover!.id)}'s turn` : "Your turn"} · ${HUMAN_VERBS[phase] ?? phase.toLowerCase()}`, ...(HUMAN_HINTS[phase] ? {detail: HUMAN_HINTS[phase]} : {}),
          ...(changes ? {action: {id: "open-changes", label: `Changes since your last turn: ${changes.to - changes.from} actions`, shape: "history", run: () => {this.chrome?.close(); this.eventLog.openChanges(changes.from, changes.to);}}} : {})};
    }
    // T97: the objective line moved from the Information icon into Help.
    const viewer = (humans.length === 1 ? humans[0] : mover) ?? state.players[0]!, owned = state.map.provinces.filter(p => state.ownerOf[p.id] === viewer.id).length, total = state.map.provinces.length;
    this.help.setObjective(`${this.options.dominationWin ? `Domination: hold ${dominationThreshold(total)} of ${total} countries · you hold ${owned}` : `Total conquest: hold all ${total} countries · you hold ${owned}`}${this.options.roundLimit ? ` · Round ${state.turnNumber} / ${this.options.roundLimit}` : ` · Round ${state.turnNumber}`}`);
    // A human loss names no winner while computers remain, so its badge is neutral (#132). The pool
    // shows while you place armies; a computer's placement shows only its notice (T97).
    if(this.turnTracker&&!this.refusal)notice=changes&&notice?.action?{title:'Changes since your last turn',action:notice.action,persistent:true}:null;
    const status = {seat: state.phase === "human-loss" ? null : Math.max(0, state.players.indexOf((result ? winner : undefined) ?? mover!)), notice, pool: state.phase === "reinforce" && !result && !computer ? state.reinforcementPool : null, result: !!result};
    // A required choice, or a staged attack pair, brings its card up once.
    const staged = mode !== "move" && state.phase === "attack" && from !== null && to !== null ? `pair:${from}:${to}` : null;
    // T83: choosing a Raid target folds the card to its strip so the whole map is free; a
    // chosen target brings the card back with Confirm.
    const raiding = this.cards.view.phase === "raid-target", raidTarget = this.cards.view.selectedTarget;
    if (raiding && !raidTarget && !computer && !gamePaused) {
      const key = `raid:${state.history.length}`;
      if (key !== this.raidFolded) {this.raidFolded = key; if (this.chrome?.openSurface === "actions") this.chrome.close(false);}
    }
    const prompt = worldPending || feedbackPending || computer || gamePaused ? null : raiding ? (raidTarget ? `raid:${raidTarget}` : null) : required ? `required:${required}` : staged;
    // A folded card keeps any pending choice one tap away; a computer seat's own pending choice is never yours (T84).
    const choice = worldPending || feedbackPending || computer ? null : required ?? (staged ? `Attack · ${this.map.provinces.find(p => p.id === from)?.name} → ${this.map.provinces.find(p => p.id === to)?.name}` : null);
    // Computer turns show no choice (owner, 2026-10-22). T101: while one plays, only the speed
    // controls stay on screen; the menu, camera and Countries icons return on your turn or a pause.
    const restore = computer && !result && this.chrome?.openSurface === "actions" && (document.activeElement === document.body || this.chrome.drawer.contains(document.activeElement));
    this.chrome?.update(status, choice, gamePaused, prompt, computer && !result && !gamePaused);
    // T103 (owner): a card with nothing to do (an attack card whose pair can no longer fight: only Cancel) closes.
    if (this.presentation?.player && this.chrome?.openSurface === "actions" && !required && mode !== "move" && !state.pendingCapture && !result && !raiding && state.phase === "attack" && !(from && to && whyNot(state, from, to) === "")) this.chrome.close(false);
    // A paused computer turn still shows no choice card (its menu card may open).
    if (computer && !result && this.chrome?.openSurface === "actions") this.chrome.close(false);
    if (restore) this.playbackPause.focus({preventScroll: true});
    this.placeCard();
    if(worldPending||feedbackPending){this.phaseActions.style.display='none';if(this.chrome?.openSurface==='actions')this.chrome.close(false);}
    const guide=this.turnTracker?.render(state,{mode:this.controller.view.mode,cardPhase:this.cards.view.phase,paused:gamePaused,worldPending,cardReward:this.controller.cardRewardAcknowledgmentPending,...(this.feedback?.frame?{feedbackSeat:this.feedback.frame.seat,feedbackKind:this.feedback.frame.kind}:{})});
    this.phaseActions.querySelector('#start-friendly-move-button')?.classList.toggle('guided-command',guide?.suggested==='move');this.phaseActions.querySelector('#end-turn-button')?.classList.toggle('guided-command',guide?.suggested==='end');
    this.worldView?.render(state);
    this.computer?.update();
  }
}

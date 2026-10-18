import { activePlayer, apply } from "../core";
import type { Action, GameOptions, GameResult, GameState } from "../core";
import { deserializeVersionedMatch, serializeVersionedMatch, REFERENCE_MATCH_IDENTITY } from "../core/match-save";
import {publicCardNotes} from "./cardController";
import { h } from "./dom";

export interface EventRegion {
  readonly id: string;
  readonly description: string;
}
export interface GameEvent {
  readonly index: number;
  readonly heading: string;
  readonly regions: readonly EventRegion[];
  readonly notes: readonly string[];
}
const ACTION_NAMES: Record<Action["kind"], string> = {
  tradeCards:"Trade cards",skipCards:"Skip cards",raidTarget:"Raid target",
  discardCard: "Card discard",
  reinforce: "Reinforcement placement", endReinforcement: "Start combat", attack: "Combat",
  captureMove: "Capture transfer", friendlyMove: "Friendly transfer", endTurn: "End turn",
  watchComputers: "Watch computers", stopGame: "Stop game",
};
const PHASE_NAMES: Record<GameState["phase"], string> = {
  cards:"Cards",
  reinforce: "Reinforcement", attack: "Attack", capture: "Capture move-in", redeploy: "Handoff",
  "human-loss": "Human seats eliminated", finished: "Finished",
};
const RESULT_NAMES: Record<GameResult["reason"], string> = {
  conquest: "Total conquest", "last-seat": "Last seat standing", domination: "Domination",
  "round-limit": "Round limit reached", "no-human-left": "All human seats eliminated",
};
function playerName(state: GameState, id: string | undefined): string {
  return state.players.find(player => player.id === id)?.name ?? "Unowned";
}
function regionName(state: GameState, id: string): string {
  return state.map.provinces.find(region => region.id === id)!.name;
}
function regionChanges(before: GameState | null, after: GameState, reason: string, endpoints: readonly string[] = []): EventRegion[] {
  return after.map.provinces.flatMap(region => {
    const a = before?.armies[region.id] ?? 0, b = after.armies[region.id]!;
    const owner = after.ownerOf[region.id], prior = before?.ownerOf[region.id];
    if (before && a === b && prior === owner && !endpoints.includes(region.id)) return [];
    const owners = playerName(after, prior ?? owner) + (prior && prior !== owner ? ` → ${playerName(after, owner)}` : "");
    return [{ id: region.id, description: `${region.name} · ${owners} · ${reason}: ${a} → ${b} (${b - a >= 0 ? "+" : ""}${b - a})` }];
  });
}

/** One initial replay per mounted match; unchanged presentation renders do no replay work. */
export class GameEventHistory {
  private previous: GameState;
  private count = 0;
  readonly events: GameEvent[];

  constructor(options: GameOptions, initialState?: GameState) {
    this.previous = initialState ?? deserializeVersionedMatch(serializeVersionedMatch(options, [], REFERENCE_MATCH_IDENTITY)).state;
    this.events = [{ index: 0, heading: `Initial deal · Round ${this.previous.turnNumber}`,
      regions: regionChanges(null, this.previous, "Initial deal"),
      notes: [`${activePlayer(this.previous)!.name} unplaced reinforcement income: ${this.previous.reinforcementPool}. These armies enter the map only when placed.`] }];
  }

  append(state: GameState): readonly GameEvent[] {
    const added: GameEvent[] = [];
    while (this.count < state.history.length) {
      const action = state.history[this.count]!, result = apply(this.previous, action);
      if (!result.ok) throw Error(`Cannot project game event ${this.count + 1}: ${result.error}`);
      const before = this.previous, after = result.state, reason = ACTION_NAMES[action.kind];
      const notes: string[] = publicCardNotes(before,after,action);
      if (action.kind === "reinforce") notes.push(`Unplaced armies: ${before.reinforcementPool} → ${after.reinforcementPool}. ${action.amount} placed on ${regionName(before, action.province)}.`);
      if (result.outcome) {
        const outcome = result.outcome;
        notes.push(`${playerName(before, outcome.attacker)} ${regionName(before, outcome.from)}: ${outcome.attackerLosses} combat casualties; ${playerName(before, outcome.defender)} ${regionName(before, outcome.to)}: ${outcome.defenderLosses} combat casualties.`);
        if (outcome.captured) notes.push(`${outcome.moved} capture transfer from ${regionName(before, outcome.from)} to ${regionName(before, outcome.to)}: provisional occupation, separate from casualties.`);
        if (outcome.penalty) notes.push(`${regionName(before, outcome.from)} changes owner under the failed-attack penalty.`);
      }
      if (action.kind === "captureMove") {
        const choice = before.pendingCapture!;
        notes.push(`Capture transfer: ${after.armies[choice.to]! - before.armies[choice.to]!} additional armies from ${regionName(before, choice.from)} to ${regionName(before, choice.to)}; ${action.amount ?? choice.defaultAmount} total including the provisional occupation. No combat casualties.`);
      }
      if (action.kind === "friendlyMove") notes.push(`Friendly transfer: ${after.armies[action.to]! - before.armies[action.to]!} armies from ${regionName(before, action.from)} to ${regionName(before, action.to)}. No combat casualties.`);
      if (after.currentPlayer !== before.currentPlayer || after.turnNumber !== before.turnNumber) {
        notes.push(`Turn passes to ${activePlayer(after)!.name} · Round ${after.turnNumber}.`);
      }
      if ((action.kind === "endTurn" || action.kind === "friendlyMove" || action.kind === "watchComputers") && after.reinforcementPool > 0) {
        notes.push(`${activePlayer(after)!.name} unplaced reinforcement income: ${after.reinforcementPool}. Not yet added to map armies.`);
      }
      for (const event of after.log.slice(before.log.length)) {
        if (event.event === "eliminated") notes.push(`${playerName(after, event.player)} eliminated: no countries remain.`);
        if (event.event === "victory") notes.push(`${playerName(after, event.player)} victory.`);
      }
      if (after.result && after.result !== before.result) {
        const winner = after.winner ? `${playerName(after, after.winner)} wins. ` : "";
        notes.push(`Game result: ${winner}${RESULT_NAMES[after.result.reason]}.`);
        after.result.standings.forEach((standing, i) => notes.push(`${i + 1}. ${playerName(after, standing.player)}: ${standing.countries} countries, ${standing.armies} armies.`));
      }
      const event: GameEvent = { index: this.count + 1,
        heading: `Action ${this.count + 1} · Round ${before.turnNumber} · ${activePlayer(before)!.name} · ${reason} · ${PHASE_NAMES[before.phase]} → ${PHASE_NAMES[after.phase]}`,
        regions: regionChanges(before, after, result.outcome?.captured ? "Net after combat and capture" : reason, action.kind === "attack" ? [action.from, action.to] : []), notes };
      this.events.push(event); added.push(event); this.previous = after; this.count++;
    }
    return added;
  }
}

/** Native modal keeps keyboard focus inside the complete, append-only event history. */
export class GameEventLog {
  readonly button = h("button", { id: "game-log-button", type: "button" }, "Game event log");
  readonly dialog = h("dialog", { class: "game-event-log", "aria-labelledby": "game-event-log-title" });
  private readonly list = h("ol", { class: "game-event-list", "aria-label": "All game events" });
  private readonly history: GameEventHistory;
  get isOpen(): boolean { return this.dialog.open; }

  constructor(options: GameOptions, initialState?: GameState) {
    this.history = new GameEventHistory(options,initialState);
    const close = h("button", { type: "button" }, "Close game event log");
    close.onclick = () => this.dialog.close();
    this.button.onclick = () => {
      this.dialog.showModal();
      this.list.lastElementChild?.scrollIntoView({ block: "end" });
    };
    this.dialog.append(h("header", { class: "game-event-log-head" }, h("h2", { id: "game-event-log-title" }, "Game event log"), close), this.list);
    this.append(this.history.events[0]!);
  }

  update(state: GameState): void {
    const follow = this.dialog.open && this.dialog.scrollHeight - this.dialog.scrollTop - this.dialog.clientHeight < 48;
    for (const event of this.history.append(state)) this.append(event);
    if (follow) this.list.lastElementChild?.scrollIntoView({ block: "end" });
  }

  private append(event: GameEvent): void {
    const row = h("li", { class: "game-event", "data-event-index": event.index });
    const regions = event.regions.map(region => h("p", { "data-region": region.id }, region.description));
    if (event.index === 0) row.append(h("details", {}, h("summary", {}, `${event.heading} · ${regions.length} countries`), ...regions));
    else row.append(h("h3", {}, event.heading), ...regions);
    row.append(...event.notes.map(note => h("p", { class: "game-event-note" }, note)));
    this.list.append(row);
  }

  dispose(): void { this.dialog.close(); this.dialog.remove(); }
}

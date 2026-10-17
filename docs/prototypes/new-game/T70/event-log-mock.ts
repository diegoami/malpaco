// Disposable projection feasibility prototype. Not mounted by production source.
import { activePlayer, apply } from "../../../../src/core";
import type { GameOptions, GameState } from "../../../../src/core";
import { deserializeVersionedMatch, serializeVersionedMatch, REFERENCE_MATCH_IDENTITY } from "../../../../src/core/match-save";
import { h } from "../../../../src/ui/dom";
const labels: Record<string, string> = { reinforce: "Reinforcement placement", endReinforcement: "Start combat", attack: "Combat", captureMove: "Capture transfer", friendlyMove: "Friendly transfer", endTurn: "End turn", watchComputers: "Watch computers", stopGame: "Stop game" };
export function eventLogMock(options: GameOptions) {
  let previous = deserializeVersionedMatch(serializeVersionedMatch(options, [], REFERENCE_MATCH_IDENTITY)).state;
  let count = 0;
  const list = h("ol", {}), dialog = h("dialog", { "aria-label": "Game event log", style: "max-height:75vh;max-width:85vw;overflow:auto" });
  const button = h("button", { id: "game-log-button", type: "button" }, "Game event log");
  const close = h("button", { type: "button" }, "Close game event log");
  button.onclick = () => dialog.showModal(); close.onclick = () => dialog.close();
  dialog.append(h("h2", {}, "Game event log"), close, list);
  const name = (s: GameState, id: string | undefined) => s.players.find(player => player.id === id)?.name ?? "Unowned";
  function regions(row: HTMLElement, before: GameState | null, after: GameState, reason: string, endpoints: string[] = []) {
    for (const country of after.map.provinces) {
      const a = before?.armies[country.id] ?? 0, b = after.armies[country.id]!;
      const owner = after.ownerOf[country.id], prior = before?.ownerOf[country.id];
      if (!before || a !== b || prior !== owner || endpoints.includes(country.id)) {
        const delta = b - a;
        row.append(h("p", { "data-region": country.id }, `${country.name} · ${name(after, prior ?? owner)}${prior && prior !== owner ? " → " + name(after, owner) : ""} · ${reason}: ${a} → ${b} (${delta >= 0 ? "+" : ""}${delta})`));
      }
    }
  }
  const initial = h("li", { "data-event-index": "0" }, `Initial deal · Round ${previous.turnNumber}`);
  regions(initial, null, previous, "Initial deal");
  initial.append(h("p", {}, `${activePlayer(previous)!.name} unplaced reinforcement income: ${previous.reinforcementPool}`));
  list.append(initial);
  function update(state: GameState) {
    while (count < state.history.length) {
      const action = state.history[count]!, result = apply(previous, action);
      if (!result.ok) throw Error(result.error);
      const next = result.state, reason = labels[action.kind]!;
      const row = h("li", { "data-event-index": String(count + 1) }, `Action ${count + 1} · Round ${previous.turnNumber} · ${activePlayer(previous)!.name} · ${reason} · ${previous.phase} → ${next.phase}`);
      regions(row, previous, next, reason, action.kind === "attack" ? [action.from, action.to] : []);
      if (result.outcome) {
        const outcome = result.outcome;
        row.append(h("p", {}, `${name(previous, outcome.attacker)} ${previous.map.provinces.find(p => p.id === outcome.from)!.name}: ${outcome.attackerLosses} combat casualties; ${name(previous, outcome.defender)} ${previous.map.provinces.find(p => p.id === outcome.to)!.name}: ${outcome.defenderLosses} combat casualties. ${outcome.captured ? `${outcome.moved} capture transfer` : ""}`));
      }
      if ((action.kind === "endTurn" || action.kind === "friendlyMove") && next.reinforcementPool > 0) row.append(h("p", {}, `${activePlayer(next)!.name} unplaced reinforcement income: ${next.reinforcementPool}`));
      for (const event of next.log.slice(previous.log.length)) {
        if (event.event === "eliminated" || event.event === "victory") row.append(h("p", {}, `${name(next, event.player)} ${event.event}`));
      }
      if (next.result) row.append(h("p", {}, `Game result: ${JSON.stringify(next.result)}`));
      list.append(row); previous = next; count++;
    }
  }
  return { button, dialog, update };
}

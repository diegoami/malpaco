import { expect, test } from "vitest";
import { apply } from "../../src/core";
import { deserializeVersionedMatch, serializeVersionedMatch, REFERENCE_MATCH_IDENTITY } from "../../src/core/match-save";
import { GameEventHistory } from "../../src/ui/gameEventLog";
import { seatName } from "../../src/ui/palette";
import { pinned } from "../core/versioned-match-fixture";

test("complete replay is cached across presentation renders and new actions append exactly once", () => {
  const f = pinned("move-completed"), loaded = deserializeVersionedMatch(f.text);
  const history = new GameEventHistory(loaded.options), initial = history.events[0];
  expect(history.append(loaded.state)).toHaveLength(loaded.state.history.length);
  const entries = [...history.events]; expect(history.append(loaded.state)).toEqual([]);
  expect(history.events).toEqual(entries); expect(history.events[0]).toBe(initial);
  const s = loaded.state;
  const own = s.map.provinces.find(region => s.ownerOf[region.id] === s.players[s.currentPlayer]!.id)!.id;
  const next = apply(s, { kind: "reinforce", province: own, amount: 1 }); if (!next.ok) throw Error(next.error);
  const added = history.append(next.state); expect(added).toHaveLength(1);
  expect(added[0]!.regions[0]!.description).toContain(`${s.armies[own]} → ${next.state.armies[own]}`);
  expect(history.append(next.state)).toEqual([]); expect(history.events).toHaveLength(entries.length + 1);
  const reconstructed = new GameEventHistory(loaded.options);
  reconstructed.append(deserializeVersionedMatch(serializeVersionedMatch(loaded.options, next.state.history, REFERENCE_MATCH_IDENTITY)).state);
  expect(reconstructed.events).toEqual(history.events);
});

test("result text identifies the winner, reason and ranked countries/armies without raw result data", () => {
  const loaded = deserializeVersionedMatch(pinned("domination").text), history = new GameEventHistory(loaded.options);
  history.append(loaded.state);
  const text = history.events.at(-1)!.notes.join(" ");
  // T97: seats read by colour (the one human is You); saves keep Seat N.
  expect(text).toContain(`${seatName(loaded.state.players, loaded.state.winner!)} wins`); expect(text).not.toMatch(/Seat \d/);
  expect(text).toContain("Domination"); expect(text).toContain("1."); expect(text).toContain("countries"); expect(text).toContain("armies");
  expect(text).not.toContain('"standings"');
});

test("capture region counts are labelled net while casualty and transfer details stay separate", () => {
  const loaded = deserializeVersionedMatch(pinned("domination").text), history = new GameEventHistory(loaded.options);
  history.append(loaded.state);
  const capture = history.events.find(event => event.regions.some(region => region.description.includes("Net after combat and capture")));
  expect(capture).toBeDefined();
  expect(capture!.notes.join(" ")).toContain("combat casualties");
  expect(capture!.notes.join(" ")).toContain("capture transfer");
});

// Original approved T63 geography. A new topology or ordered deal path needs a
// new board-generator version; never reinterpret fixed-reference/1 in place.
import data from "../../fixtures/new-game/T63/board.json" with { type: "json" };
import type { GameMap, Province } from "./types";

export const referenceMap: GameMap = {
  id: "reference-coast-first-a",
  name: "Nine Isles",
  bounds: data.bounds,
  provinces: data.provinces as unknown as readonly Province[],
  islands: data.islands,
};

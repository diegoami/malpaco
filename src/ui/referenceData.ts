// Original T63 data; rules read declared adjacency and never screen positions.
import data from "../../docs/prototypes/new-game/T63/board.json";
import type {GameMap,Province} from "../core";
export const referenceMap:GameMap={id:"reference-coast-first-a",name:"Nine Isles",bounds:data.bounds,provinces:data.provinces as unknown as readonly Province[],islands:data.islands};

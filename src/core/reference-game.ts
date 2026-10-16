import { createGameWithRng, DEAL_COUNTRY_COUNT } from "./setup";
import type { CreateGameResult } from "./setup";
import { DeterministicRng } from "./rng";
import { validateGameOptions } from "./options";
import type { GameMap } from "./types";
import type { GameOptions } from "./options";

/** T26: approved fixed geography reuses the verified deal without geography draws. */
export function createReferenceGame(map: GameMap, options: GameOptions): CreateGameResult {
  const validated = validateGameOptions(options);
  // The deal's existing C-BRD-02 accounting requires exactly 46 countries.
  if (map.provinces.length !== DEAL_COUNTRY_COUNT) {
    return { ok: false, errors: [`Reference map requires ${DEAL_COUNTRY_COUNT} countries`] };
  }
  return createGameWithRng(validated, new DeterministicRng(validated.seed), () => ({ ok: true, map }));
}

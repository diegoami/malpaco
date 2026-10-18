// C-SET-05/07: readable, versioned settings/seed and ordinary actions;
// reconstruct every rule/RNG value by replay, never from a saved snapshot.
import { validateGameOptions } from "./options";
import type { GameOptions } from "./options";
import { SaveFormatError } from "./save";
import { createGame } from "./setup";
import { apply } from "./rules";
import type { Action, GameState } from "./types";
import { referenceMap } from "./reference-map";
import { createReferenceGame } from "./reference-game";
import { createGeographicGame } from "./geographic-game";
import type {IslandGeography} from "./island-geography";
import { cardsRules, tradeCardsRules, raidCardsRules, victoryRules } from "./state";

export const MATCH_SAVE_VERSION = 1;
function actionFrom(value: unknown, index: number): Action {
  const fail = (): never => { throw new SaveFormatError(`Action ${index + 1} has an invalid shape.`, `actions[${index}]`); };
  if (typeof value !== "object" || value === null || Array.isArray(value)) return fail();
  const a = value as Record<string, unknown>;
  const keys = a.kind === "reinforce" ? ["kind", "province", "amount"] : a.kind === "attack" ? ["kind", "from", "to"] : a.kind === "endTurn" || a.kind === "endReinforcement" ? ["kind"] : [];
  if (!keys.length || Object.keys(a).length !== keys.length || keys.some(k => !(k in a))) return fail();
  if (a.kind === "reinforce") {
    if (typeof a.province !== "string" || !a.province || typeof a.amount !== "number" || !Number.isSafeInteger(a.amount) || a.amount <= 0) return fail();
    return { kind: "reinforce", province: a.province, amount: a.amount };
  }
  if (a.kind === "attack") {
    if (typeof a.from !== "string" || !a.from || typeof a.to !== "string" || !a.to) return fail();
    return { kind: "attack", from: a.from, to: a.to };
  }
  return { kind: a.kind as "endTurn" | "endReinforcement" };
}
export function deserializeMatch(text: string): { options: GameOptions; state: GameState } {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new SaveFormatError("Game file is not valid JSON."); }
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new SaveFormatError("Game file must be an object.");
  const obj = value as Record<string, unknown>;
  if (obj.version !== MATCH_SAVE_VERSION) throw new SaveFormatError(`Unsupported match version; expected ${MATCH_SAVE_VERSION}.`, "version");
  if (Object.keys(obj).length !== 3 || !Array.isArray(obj.actions)) throw new SaveFormatError("Game file needs version, options and an actions array.");
  let options: GameOptions;
  try { options = validateGameOptions(obj.options); } catch (e) { throw new SaveFormatError(`Invalid game options: ${e instanceof Error ? e.message : String(e)}`, "options"); }
  const actions = obj.actions.map(actionFrom);
  const created = createGame(options);
  if (!created.ok) throw new SaveFormatError(`Cannot generate this saved game: ${created.errors.join("; ")}. Try another game file.`);
  let state = created.state;
  for (let i = 0; i < actions.length; i++) {
    const result = apply(state, actions[i]!);
    if (!result.ok) throw new SaveFormatError(`Cannot replay action ${i + 1}: ${result.error}. Choose an intact game file.`, `actions[${i}]`);
    state = result.state;
  }
  return { options, state };
}
export function serializeMatch(options: GameOptions, actions: readonly Action[]): string {
  const text = JSON.stringify({ version: MATCH_SAVE_VERSION, options, actions });
  const validated = deserializeMatch(text);
  return JSON.stringify({ version: MATCH_SAVE_VERSION, options: validated.options, actions: validated.state.history }, null, 2);
}

/** [designed] T31 storage protocol: identities version algorithms, not positions.
 * Searched the existing options/match codecs: v1 identifies only its implicit
 * generated/malpaco path. Keep that path and its bytes unchanged above.
 */
export interface MatchIdentity {
  readonly boardGenerator: { readonly id: string; readonly version: number };
  readonly rules: { readonly id: string; readonly version: number };
  readonly actionSchemaVersion: number;
}

export const REFERENCE_MATCH_IDENTITY: MatchIdentity = Object.freeze({
  boardGenerator: Object.freeze({ id: "fixed-reference", version: 1 }),
  rules: Object.freeze({ id: "victory", version: 1 }),
  actionSchemaVersion: 2,
});
const LEGACY_MATCH_IDENTITY: MatchIdentity = Object.freeze({
  boardGenerator: Object.freeze({ id: "generated", version: 1 }),
  rules: Object.freeze({ id: "malpaco", version: 1 }),
  actionSchemaVersion: 1,
});

export interface LoadedVersionedMatch {
  readonly formatVersion: 1 | 2;
  readonly identity: MatchIdentity;
  readonly options: GameOptions;
  readonly state: GameState;
  /** Rebuilt metadata for the matching UI; never serialized as trusted state. */
  readonly geography?: IslandGeography;
  readonly initialState?: GameState;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const GEOGRAPHIC_MATCH_IDENTITY: MatchIdentity = Object.freeze({
  boardGenerator: Object.freeze({ id: "geographic", version: 1 }),
  rules: Object.freeze({ id: "victory", version: 1 }),
  actionSchemaVersion: 2,
});

/** [designed] T37 storage protocol, following the existing T31 identities.
 * Searched match codecs and pinned variety: no card wire format is prescribed.
 * cards/1 + schema 3 permanently selects deck-v1. Later trade/raid stages must
 * add exact tuples and preserve this factory, grammar and RNG timing.
 */
export const REFERENCE_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'fixed-reference',version:1}),rules:Object.freeze({id:'cards',version:1}),actionSchemaVersion:3});
export const GEOGRAPHIC_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'geographic',version:1}),rules:Object.freeze({id:'cards',version:1}),actionSchemaVersion:3});
/** [designed] T38 storage stage, after searching the pinned variety inventory
 * and existing match codec: cards/2 + schema4 permanently selects trade-v1.
 * Selection indices name the pre-action hand; discard order follows that hand.
 * Future Raid targets/effects require a separate tuple, never a widened stage.
 */
export const REFERENCE_TRADE_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'fixed-reference',version:1}),rules:Object.freeze({id:'cards',version:2}),actionSchemaVersion:4});
export const GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'geographic',version:1}),rules:Object.freeze({id:'cards',version:2}),actionSchemaVersion:4});
/** [designed] exact raid-v1 protocol; cards/1 and cards/2 remain frozen. */
export const REFERENCE_RAID_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'fixed-reference',version:1}),rules:Object.freeze({id:'cards',version:3}),actionSchemaVersion:5});
export const GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY:MatchIdentity=Object.freeze({boardGenerator:Object.freeze({id:'geographic',version:1}),rules:Object.freeze({id:'cards',version:3}),actionSchemaVersion:5});
function supportedIdentity(value: Record<string, unknown>): MatchIdentity {
  const generator = value.boardGenerator;
  const cardStage=record(value.rules)&&value.rules.id==='cards';
  const raidStage=cardStage&&record(value.rules)&&value.rules.version===3;
  const tradeStage=cardStage&&record(value.rules)&&value.rules.version===2;
  const expected = record(generator) && generator.id === "geographic"
    ? (raidStage?GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY:tradeStage?GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY:cardStage?GEOGRAPHIC_CARD_MATCH_IDENTITY:GEOGRAPHIC_MATCH_IDENTITY) : (raidStage?REFERENCE_RAID_CARD_MATCH_IDENTITY:tradeStage?REFERENCE_TRADE_CARD_MATCH_IDENTITY:cardStage?REFERENCE_CARD_MATCH_IDENTITY:REFERENCE_MATCH_IDENTITY);
  // Each supported generator keeps its exact rules/action tuple for replay.
  for (const field of ["boardGenerator", "rules"] as const) {
    const part = value[field], required = expected[field];
    if (!record(part) || Object.keys(part).length !== 2 || part.id !== required.id || part.version !== required.version) {
      throw new SaveFormatError(`Unsupported ${field}; expected ${required.id}/${required.version}.`, field);
    }
  }
  if (value.actionSchemaVersion !== expected.actionSchemaVersion) {
    throw new SaveFormatError(`Unsupported action schema version; expected ${expected.actionSchemaVersion}.`, "actionSchemaVersion");
  }
  return expected;
}

function versionedAction(value: unknown, index: number, schema: number): Action {
  const fail = (): never => { throw new SaveFormatError(`Action ${index + 1} has an invalid shape.`, `actions[${index}]`); };
  if (!record(value)) return fail();
  let keys: string[];
  switch (value.kind) {
    case 'raidTarget': if(schema!==5)return fail();keys=['kind','province'];break;
    case 'tradeCards':
      if((schema!==4&&schema!==5)||!Array.isArray(value.handIndices)||value.handIndices.length!==3||new Set(value.handIndices).size!==3||value.handIndices.some(i=>typeof i!=='number'||!Number.isSafeInteger(i)||i<0))return fail();
      keys=['kind','handIndices'];break;
    case 'skipCards':
      if(schema!==4&&schema!==5)return fail();keys=['kind'];break;
    case 'discardCard':
      if((schema!==3&&schema!==4&&schema!==5)||typeof value.handIndex!=='number'||!Number.isSafeInteger(value.handIndex)||value.handIndex<0)return fail();
      keys=['kind','handIndex'];break;
    case "reinforce": keys = ["kind", "province", "amount"]; break;
    case "attack":
    case "friendlyMove": keys = ["kind", "from", "to"]; break;
    case "endReinforcement":
    case "endTurn":
    case "captureMove":
    case "watchComputers":
    case "stopGame": keys = ["kind"]; break;
    default: return fail();
  }
  if ((value.kind === "captureMove" || value.kind === "friendlyMove") && Object.hasOwn(value, "amount")) keys.push("amount");
  if (Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key))) return fail();
  for (const key of ["province", "from", "to"]) {
    if (keys.includes(key) && (typeof value[key] !== "string" || value[key].length === 0)) return fail();
  }
  if (keys.includes("amount") && (typeof value.amount !== "number" || !Number.isSafeInteger(value.amount) || value.amount <= 0)) return fail();
  return value as unknown as Action;
}

/** Rebuild from original options and recorded ordinary actions, without policy.
 * The baseline computer policy consumes no RNG. A future policy that does must
 * introduce a versioned replay protocol for its draws before claiming support.
 */
export function deserializeVersionedMatch(text: string): LoadedVersionedMatch {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new SaveFormatError("Game file is not valid JSON."); }
  if (!record(value)) throw new SaveFormatError("Game file must be an object.");
  if (value.version === MATCH_SAVE_VERSION && !Object.hasOwn(value, "format")) {
    return { formatVersion: 1, identity: LEGACY_MATCH_IDENTITY, ...deserializeMatch(text) };
  }
  if (value.format !== "malpaco-match") throw new SaveFormatError("Unsupported match format; expected malpaco-match.", "format");
  if (value.version !== 2) throw new SaveFormatError("Unsupported match version; expected 2.", "version");
  const keys = ["format", "version", "boardGenerator", "rules", "actionSchemaVersion", "options", "actions"];
  if (Object.keys(value).length !== keys.length || keys.some(key => !Object.hasOwn(value, key)) || !Array.isArray(value.actions)) {
    throw new SaveFormatError("Game file needs exactly format, version, boardGenerator, rules, actionSchemaVersion, options and an actions array.");
  }
  const identity = supportedIdentity(value);
  let options: GameOptions;
  try { options = validateGameOptions(value.options); } catch (error) {
    throw new SaveFormatError(`Invalid game options: ${error instanceof Error ? error.message : String(error)}`, "options");
  }
  const actions = value.actions.map((action,index)=>versionedAction(action,index,identity.actionSchemaVersion));
  const rules=identity.rules.id==='cards'?(identity.rules.version===3?raidCardsRules(options):identity.rules.version===2?tradeCardsRules(options):cardsRules(options)):victoryRules(options);
  const geographic=identity.boardGenerator.id==='geographic'?createGeographicGame(options,rules):null;
  const created=geographic??createReferenceGame(referenceMap,options,rules);
  if (!created.ok) throw new SaveFormatError(`Cannot generate this saved game: ${created.errors.join("; ")}.`, "boardGenerator");
  let state = created.state;
  for (let index = 0; index < actions.length; index++) {
    const result = apply(state, actions[index]!);
    if (!result.ok) throw new SaveFormatError(`Cannot replay action ${index + 1}: ${result.error}. Choose an intact game file.`, `actions[${index}]`);
    state = result.state;
  }
  return { formatVersion: 2, identity, options, state, initialState:created.state, ...(geographic?.ok ? {geography:geographic.geography} : {}) };
}

/** Validate through the same replay path before emitting a readable v2 file. */
export function serializeVersionedMatch(options: GameOptions, actions: readonly Action[], identity: MatchIdentity): string {
  const payload = {
    format: "malpaco-match", version: 2,
    boardGenerator: identity.boardGenerator, rules: identity.rules,
    actionSchemaVersion: identity.actionSchemaVersion, options, actions,
  };
  const validated = deserializeVersionedMatch(JSON.stringify(payload));
  return JSON.stringify({ ...payload, options: validated.options, actions: validated.state.history }, null, 2);
}

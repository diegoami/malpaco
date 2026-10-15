// C-SET-05/07: readable, versioned settings/seed and ordinary actions;
// reconstruct every rule/RNG value by replay, never from a saved snapshot.
import { validateGameOptions } from "./options";
import type { GameOptions } from "./options";
import { SaveFormatError } from "./save";
import { createGame } from "./setup";
import { apply } from "./rules";
import type { Action, GameState } from "./types";

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

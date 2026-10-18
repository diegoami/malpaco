// Save format: a versioned wrapper around a GameOptions object, plain
// readable JSON. C-SET-05 (change, decision 2): a saved game is settings +
// seed + the action list, restored by replaying them. C-SET-07 (change):
// every stored file carries a format version, and a file that fails
// validation (wrong version, missing field, value out of range) is ignored
// and the defaults are used. Plain, readable storage; no obfuscation.

import { OptionsError, SAVE_FORMAT_VERSION, validateGameOptions, type GameOptions } from "./options";

/** Typed error from save-format validation. The field is the offending field, if known. */
export class SaveFormatError extends Error {
  constructor(message: string, readonly field?: string) {
    super(message);
    this.name = "SaveFormatError";
  }
}

/**
 * Serialize a GameOptions object to plain JSON, wrapped with the format
 * version. Pure: deterministic and dependency-free.
 */
export function serializeOptions(options: GameOptions): string {
  const payload = { version: SAVE_FORMAT_VERSION, options };
  return JSON.stringify(payload);
}

/**
 * Deserialize a plain JSON string back to a GameOptions object. Throws a
 * typed SaveFormatError with the offending field on any failure. Pure.
 */
export function deserializeOptions(text: string): GameOptions {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SaveFormatError("save file is not valid JSON");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new SaveFormatError("save file is not an object");
  }
  const obj = parsed as Record<string, unknown>;
  if (!("version" in obj)) {
    throw new SaveFormatError("missing field", "version");
  }
  if (obj.version !== SAVE_FORMAT_VERSION) {
    throw new SaveFormatError(
      `unsupported save format version: got ${JSON.stringify(obj.version)}, expected ${SAVE_FORMAT_VERSION}`,
      "version",
    );
  }
  if (!("options" in obj)) {
    throw new SaveFormatError("missing field", "options");
  }
  try {
    return validateGameOptions(obj.options);
  } catch (e) {
    if (e instanceof OptionsError) throw new SaveFormatError(`options: ${e.message}`, e.field);
    throw e;
  }
}
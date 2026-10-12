// GameOptions: the rules-relevant options the player picks on the setup
// screen. Animation speed and sound are presentation-only (design/core-rules.md
// § Setup → Options, the owner 2026-10-12) and stay in the UI layer; they
// never enter `core/`. Each constant cites the spec claim it traces to
// (rule 17).
//
// C-SET-01 (change): the options screen holds every option open to every
//   player. Dropping C-SET-02 (locked options) and C-SET-04 (registration).
// C-STA-03 / decision 6: a per-human share setting, even by default.
// C-PLY-01..03 / decisions 1 and 3: seats are 2..4, each human or computer;
//   the default is one human and three computers.
// C-RND-01: the seed is shown and reproducible.
// decision 9: domination win on by default; switchable off.
// decision 10: round limit off by default; 20, 30 or 40.
// variety.md decision V9: event frequency is Off / Rare / Normal / Often.

import { SeatsError, validateSeats, type SeatSpec } from "./seats";

/** The per-country starting-armies range (decision 4). */
export type StartingArmiesRange = "1-2" | "1-3" | "1-4";

/** How often a hazard is drawn (variety.md V9). */
export type EventFrequency = "Off" | "Rare" | "Normal" | "Often";

/** The optional round limit (decision 10). */
export type RoundLimit = 20 | 30 | 40;

/** The lowest starting-armies count for the per-country spread. */
export const MIN_STARTING_ARMIES = 1;
/** The highest starting-armies count for the per-country spread. */
export const MAX_STARTING_ARMIES = 4;
/** Per decision 6: the human share range. */
export const MIN_HUMAN_SHARE = -4;
export const MAX_HUMAN_SHARE = 4;
/** Save format version (C-SET-07): every stored file carries one. */
export const SAVE_FORMAT_VERSION = 1;

/** Per-decision-9 default threshold: ceil(0.75 × C) of the 46-country board. */
export const DEFAULT_DOMINATION_THRESHOLD = 35;

/**
 * The rules-relevant options a new game starts with. Animation speed and
 * sound are presentation-only (design/core-rules.md § Setup → Options, the
 * owner 2026-10-12) and stay in the UI layer.
 */
export interface GameOptions {
  /** 2..4 seats, each human or computer (C-PLY-01, C-PLY-02, decision 3). */
  readonly seats: readonly SeatSpec[];
  /** Range of the per-country starting-armies spread (decision 4). */
  readonly startingArmiesRange: StartingArmiesRange;
  /** −4..+4, applied per human seat in turn order (C-STA-03, decision 6). */
  readonly humanShare: number;
  /** Off / Rare / Normal / Often (variety.md V9). */
  readonly eventFrequency: EventFrequency;
  /** Decision 9: a 35-of-46 domination win on by default; switchable off. */
  readonly dominationWin: boolean;
  /** Decision 10: off by default; 20, 30 or 40 when on. */
  readonly roundLimit: RoundLimit | null;
  /** Game seed; any 32-bit unsigned integer (C-RND-01). */
  readonly seed: number;
  /** Decision 1: only the generated board is on the table. */
  readonly board: "generated";
}

/** Typed error from option validation. */
export class OptionsError extends Error {
  constructor(message: string, readonly field?: string) {
    super(message);
    this.name = "OptionsError";
  }
}

/** The canonical defaults per the Options table (design/core-rules.md § Setup). */
export function defaultOptions(): GameOptions {
  return {
    seats: [
      { kind: "human" },
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Normal" },
      { kind: "computer", difficulty: "Normal" },
    ],
    startingArmiesRange: "1-3",
    humanShare: 0,
    eventFrequency: "Normal",
    dominationWin: true,
    roundLimit: null,
    seed: 0,
    board: "generated",
  };
}

const SEED_MAX = 0xffffffff;

function parseStartingArmiesRange(value: unknown): StartingArmiesRange {
  if (value === "1-2" || value === "1-3" || value === "1-4") return value;
  throw new OptionsError(
    `startingArmiesRange must be "1-2", "1-3" or "1-4" (got ${JSON.stringify(value)})`,
    "startingArmiesRange",
  );
}

function parseHumanShare(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new OptionsError(`humanShare must be an integer (got ${JSON.stringify(value)})`, "humanShare");
  }
  if (value < MIN_HUMAN_SHARE || value > MAX_HUMAN_SHARE) {
    throw new OptionsError(
      `humanShare must be between ${MIN_HUMAN_SHARE} and ${MAX_HUMAN_SHARE} (got ${value})`,
      "humanShare",
    );
  }
  return value;
}

function parseEventFrequency(value: unknown): EventFrequency {
  if (value === "Off" || value === "Rare" || value === "Normal" || value === "Often") return value;
  throw new OptionsError(
    `eventFrequency must be "Off", "Rare", "Normal" or "Often" (got ${JSON.stringify(value)})`,
    "eventFrequency",
  );
}

function parseRoundLimit(value: unknown): RoundLimit | null {
  if (value === null) return null;
  if (value === 20 || value === 30 || value === 40) return value;
  throw new OptionsError(
    `roundLimit must be null, 20, 30 or 40 (got ${JSON.stringify(value)})`,
    "roundLimit",
  );
}

function parseDominationWin(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  throw new OptionsError(
    `dominationWin must be a boolean (got ${JSON.stringify(value)})`,
    "dominationWin",
  );
}

function parseSeed(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new OptionsError(`seed must be an integer (got ${JSON.stringify(value)})`, "seed");
  }
  if (value < 0 || value > SEED_MAX) {
    throw new OptionsError(
      `seed must be a 32-bit unsigned integer 0..${SEED_MAX} (got ${value})`,
      "seed",
    );
  }
  return value;
}

function parseBoard(value: unknown): "generated" {
  if (value === "generated") return value;
  throw new OptionsError(`board must be "generated" (got ${JSON.stringify(value)})`, "board");
}

/**
 * Validate and normalise an unknown into a GameOptions record, throwing an
 * OptionsError with the offending field on any failure. Pure.
 */
export function validateGameOptions(value: unknown): GameOptions {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new OptionsError("options must be an object");
  }
  const obj = value as Record<string, unknown>;
  if (!("seats" in obj)) throw new OptionsError("missing field", "seats");
  try {
    validateSeats(obj.seats as readonly SeatSpec[]);
  } catch (e) {
    if (e instanceof SeatsError) throw new OptionsError(`seats: ${e.message}`, e.field);
    throw e;
  }
  if (!("startingArmiesRange" in obj)) throw new OptionsError("missing field", "startingArmiesRange");
  if (!("humanShare" in obj)) throw new OptionsError("missing field", "humanShare");
  if (!("eventFrequency" in obj)) throw new OptionsError("missing field", "eventFrequency");
  if (!("dominationWin" in obj)) throw new OptionsError("missing field", "dominationWin");
  if (!("roundLimit" in obj)) throw new OptionsError("missing field", "roundLimit");
  if (!("seed" in obj)) throw new OptionsError("missing field", "seed");
  if (!("board" in obj)) throw new OptionsError("missing field", "board");
  return {
    seats: obj.seats as readonly SeatSpec[],
    startingArmiesRange: parseStartingArmiesRange(obj.startingArmiesRange),
    humanShare: parseHumanShare(obj.humanShare),
    eventFrequency: parseEventFrequency(obj.eventFrequency),
    dominationWin: parseDominationWin(obj.dominationWin),
    roundLimit: parseRoundLimit(obj.roundLimit),
    seed: parseSeed(obj.seed),
    board: parseBoard(obj.board),
  };
}
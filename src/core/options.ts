// GameOptions: the 11 options the player picks on the setup screen, every
// one open to every player (C-SET-01; the locks C-SET-02 / C-SET-04 are
// dropped). Animation speed and sound are presentation-only — they never
// change a rule — but they are stored with the rest so a saved game restores
// the player's choice (design/core-rules.md § Setup → Options, the owner
// 2026-10-12). Each constant cites the spec claim it traces to (rule 17).
//
// C-SET-01 (change): the options screen holds every option open to every
//   player. Dropping C-SET-02 (locked options) and C-SET-04 (registration).
// C-STA-03 / decision 6: a per-human share setting, even by default.
//   When no human seat is in the list, the field is ignored.
// C-PLY-01..03 / decisions 1 and 3: seats are 2..4, each human or computer;
//   the default is one human and three computers. The per-computer strengths
//   live in options.computerStrengths, one entry per computer seat in seat
//   order.
// C-RND-01: the seed is shown and reproducible.
// decision 9: domination win on by default; switchable off.
// decision 10: round limit off by default; 20, 30 or 40.
// variety.md decision V9: event frequency is Off / Rare / Normal / Often.
// computer.md decision A2: each computer seat defaults to Normal.
// Animation speed and sound stay in the file (a saved game restores them)
// but the rules engine never reads them.

import { SeatsError, validateSeats, hasHuman } from "./seats";
import type { Difficulty, SeatSpec } from "./seats";

/** The per-country starting-armies range (decision 4). */
export type StartingArmiesRange = "1-2" | "1-3" | "1-4";

/** How often a hazard is drawn (variety.md V9). */
export type EventFrequency = "Off" | "Rare" | "Normal" | "Often";

/** The optional round limit (decision 10). */
export type RoundLimit = 20 | 30 | 40;

/** Presentation-only animation speed (design/core-rules.md § Setup → Options, 2026-10-12). */
export type AnimationSpeed = "slow" | "normal" | "fast";

/** The lowest starting-armies count for the per-country spread. */
export const MIN_STARTING_ARMIES = 1;
/** The highest starting-armies count for the per-country spread. */
export const MAX_STARTING_ARMIES = 4;
/** Per decision 6: the human share range. */
export const MIN_HUMAN_SHARE = -4;
export const MAX_HUMAN_SHARE = 4;
/** Save format version (C-SET-07): every stored file carries one. */
export const SAVE_FORMAT_VERSION = 1;

/**
 * The 11 options a new game starts with. Animation speed and sound are
 * presentation-only (design/core-rules.md § Setup → Options, the owner
 * 2026-10-12); the rules engine ignores them, yet they live here so a
 * saved game restores the player's choice.
 */
export interface GameOptions {
  /** 2..4 seats, each human or computer (C-PLY-01, C-PLY-02, decision 3). */
  readonly seats: readonly SeatSpec[];
  /** Decision 1: only the generated board is on the table. */
  readonly board: "generated";
  /** Range of the per-country starting-armies spread (decision 4). */
  readonly startingArmiesRange: StartingArmiesRange;
  /** −4..+4, applied per human seat in turn order (C-STA-03, decision 6). Ignored when no human seat is in the list. */
  readonly humanShare: number;
  /** One entry per computer seat, in seat order (computer.md A2: default Normal). */
  readonly computerStrengths: readonly Difficulty[];
  /** Off / Rare / Normal / Often (variety.md V9). */
  readonly eventFrequency: EventFrequency;
  /** Decision 9: a 35-of-46 domination win on by default; switchable off. */
  readonly dominationWin: boolean;
  /** Decision 10: off by default; 20, 30 or 40 when on. */
  readonly roundLimit: RoundLimit | null;
  /** Game seed; any 32-bit unsigned integer (C-RND-01). */
  readonly seed: number;
  /** Presentation-only (T52). The rules engine never reads it. */
  readonly animationSpeed: AnimationSpeed;
  /** Presentation-only (T52). The rules engine never reads it. */
  readonly sound: boolean;
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
      { kind: "computer" },
      { kind: "computer" },
      { kind: "computer" },
    ],
    board: "generated",
    startingArmiesRange: "1-3",
    humanShare: 0,
    computerStrengths: ["Normal", "Normal", "Normal"],
    eventFrequency: "Normal",
    dominationWin: true,
    roundLimit: null,
    seed: 0,
    animationSpeed: "normal",
    sound: true,
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

function parseHumanShare(value: unknown, seats: readonly SeatSpec[]): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new OptionsError(`humanShare must be an integer (got ${JSON.stringify(value)})`, "humanShare");
  }
  // Per design: a setting applies "per human seat". When no human seat is
  // present the field is irrelevant; the value is ignored (and any value,
  // including out-of-range, is accepted).
  if (!hasHuman(seats)) return value;
  if (value < MIN_HUMAN_SHARE || value > MAX_HUMAN_SHARE) {
    throw new OptionsError(
      `humanShare must be between ${MIN_HUMAN_SHARE} and ${MAX_HUMAN_SHARE} (got ${value})`,
      "humanShare",
    );
  }
  return value;
}

function parseComputerStrengths(
  value: unknown,
  seats: readonly SeatSpec[],
): readonly Difficulty[] {
  if (!Array.isArray(value)) {
    throw new OptionsError(
      `computerStrengths must be an array (got ${JSON.stringify(value)})`,
      "computerStrengths",
    );
  }
  const expected = seats.filter((s) => s.kind === "computer").length;
  if (value.length !== expected) {
    throw new OptionsError(
      `computerStrengths must have one entry per computer seat (got ${value.length}, expected ${expected})`,
      "computerStrengths",
    );
  }
  for (let i = 0; i < value.length; i++) {
    const v = value[i];
    if (v !== "Easy" && v !== "Normal" && v !== "Hard") {
      throw new OptionsError(
        `computerStrengths[${i}] must be "Easy", "Normal" or "Hard" (got ${JSON.stringify(v)})`,
        `computerStrengths[${i}]`,
      );
    }
  }
  return value as readonly Difficulty[];
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

function parseAnimationSpeed(value: unknown): AnimationSpeed {
  if (value === "slow" || value === "normal" || value === "fast") return value;
  throw new OptionsError(
    `animationSpeed must be "slow", "normal" or "fast" (got ${JSON.stringify(value)})`,
    "animationSpeed",
  );
}

function parseSound(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  throw new OptionsError(`sound must be a boolean (got ${JSON.stringify(value)})`, "sound");
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
  let seats: readonly SeatSpec[];
  try {
    seats = validateSeats(obj.seats);
  } catch (e) {
    if (e instanceof SeatsError) throw new OptionsError(`seats: ${e.message}`, e.field);
    throw e;
  }
  for (const f of [
    "board",
    "startingArmiesRange",
    "humanShare",
    "computerStrengths",
    "eventFrequency",
    "dominationWin",
    "roundLimit",
    "seed",
    "animationSpeed",
    "sound",
  ] as const) {
    if (!(f in obj)) throw new OptionsError("missing field", f);
  }
  return {
    seats,
    board: parseBoard(obj.board),
    startingArmiesRange: parseStartingArmiesRange(obj.startingArmiesRange),
    humanShare: parseHumanShare(obj.humanShare, seats),
    computerStrengths: parseComputerStrengths(obj.computerStrengths, seats),
    eventFrequency: parseEventFrequency(obj.eventFrequency),
    dominationWin: parseDominationWin(obj.dominationWin),
    roundLimit: parseRoundLimit(obj.roundLimit),
    seed: parseSeed(obj.seed),
    animationSpeed: parseAnimationSpeed(obj.animationSpeed),
    sound: parseSound(obj.sound),
  };
}
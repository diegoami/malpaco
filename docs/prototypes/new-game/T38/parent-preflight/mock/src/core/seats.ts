// Seat kinds and seat-list validation. Lives in src/core so the deal and
// the options screen can both read it without crossing the purity boundary.
//
// C-PLY-01 (change, decisions 1 and 3): a game has 2 to 4 seats.
// C-PLY-02 (change, decision 3): each seat is human or computer; hot-seat
//   and an all-computer game are allowed.
// C-PLY-03 (keep): the default is one human and three computers.

/** Who plays a seat. */
export type SeatKind = "human" | "computer";

/** A computer seat's strength. Listed in options.computerStrengths, not on the seat itself. */
export type Difficulty = "Easy" | "Normal" | "Hard";

/** A seat as the user typed it on the options screen, before it becomes a Player. */
export interface SeatSpec {
  readonly kind: SeatKind;
}

/** Typed error from seat-list validation. */
export class SeatsError extends Error {
  constructor(message: string, readonly field?: string) {
    super(message);
    this.name = "SeatsError";
  }
}

/** The decision-3 seat-count band. */
export const MIN_SEATS = 2;
export const MAX_SEATS = 4;

/**
 * Validate a seat list, throwing a typed SeatsError with the offending field.
 * Pure: no I/O, no randomness, no clock. Safe to call from `core/`.
 */
export function validateSeats(value: unknown): readonly SeatSpec[] {
  if (value === null || value === undefined) {
    throw new SeatsError("seats is missing", "seats");
  }
  if (!Array.isArray(value)) {
    throw new SeatsError("seats must be an array", "seats");
  }
  const seats = value;
  if (!Number.isInteger(seats.length) || seats.length < MIN_SEATS || seats.length > MAX_SEATS) {
    throw new SeatsError(
      `seat count must be ${MIN_SEATS} to ${MAX_SEATS}, got ${seats.length}`,
      "seats.length",
    );
  }
  seats.forEach((seat, i) => {
    if (seat === null || typeof seat !== "object") {
      throw new SeatsError(`seat ${i}: must be an object`, `seats[${i}]`);
    }
    const kind = (seat as { kind?: unknown }).kind;
    if (kind !== "human" && kind !== "computer") {
      throw new SeatsError(`seat ${i}: kind must be "human" or "computer"`, `seats[${i}].kind`);
    }
  });
  return seats as readonly SeatSpec[];
}

/** True when at least one human seat is in the list. */
export function hasHuman(seats: readonly SeatSpec[]): boolean {
  return seats.some((s) => s.kind === "human");
}

/** The number of computer seats in the list. */
export function computerCount(seats: readonly SeatSpec[]): number {
  return seats.filter((s) => s.kind === "computer").length;
}
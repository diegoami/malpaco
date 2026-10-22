// Ownership look after the revision-7 sketches (T93): vivid owner regions and a
// dark count badge whose outline is the owner's colour and whose silhouette
// (square, diamond, hexagon, circle) is a second cue, so colour is never the
// only ownership signal. Generated games print numeric seats in their labels.

export interface SeatLook {
  readonly color: string;
  readonly dark: string;
  /** SVG path for the badge outline, centred on 0,0 and 38 tall (the chip's 80 x 38 box). */
  readonly badge: string;
}

export const SEATS: readonly SeatLook[] = [
  { color: "#239cdb", dark: "#0f4d70", badge: "M-17 -17H17V17H-17Z" }, // square
  { color: "#f47745", dark: "#7f3317", badge: "M0 -19L19 0L0 19L-19 0Z" }, // diamond
  { color: "#92c83e", dark: "#43621a", badge: "M-17 -9.5L0 -19L17 -9.5V9.5L0 19L-17 9.5Z" }, // hexagon
  { color: "#b86cdb", dark: "#5a2a73", badge: "M-19 0A19 19 0 1 0 19 0A19 19 0 1 0 -19 0Z" }, // circle
];

export const NEUTRAL: SeatLook = { color: "#8d8578", dark: "#4b463e", badge: "M-17 -17H17V17H-17Z" };

export function seatLook(seat: number): SeatLook {
  return SEATS[seat] ?? NEUTRAL;
}

export function initial(playerId: string): string {
  return playerId === "" ? "-" : playerId.slice(0, 1).toUpperCase();
}

/** [designed] The sketches scale a 38-unit badge to about 28 units; longer counts widen it to keep a 6-unit margin. */
export function badgeScale(countWidth: number): number {
  return Math.max(0.75, (countWidth + 6) / 34);
}

/**
 * [designed] T87 (B): counts over 999 print compactly and never overstate ("1.2k" for 1250,
 * "12k" for 12 999); the country's accessible name keeps the exact value.
 */
export function countLabel(armies: number): string {
  if (armies < 1000) return String(armies);
  const thousands = armies / 1000;
  return thousands < 10 ? `${Math.floor(thousands * 10) / 10}k` : `${Math.floor(thousands)}k`;
}

/** The chosen target's crosshair, around a badge centred on 0,0 (T87: not hue alone). */
export const TARGET_MARK = "M-30 0H-21M21 0H30M0 -30V-21M0 21V30";

/** T97 (owner, 2026-10-22): seats are named by their colour; the one human seat is "You". */
export const SEAT_NAMES: readonly string[] = ["Blue", "Orange", "Green", "Purple"];

interface NamedSeat {readonly id: string; readonly kind?: string}

/**
 * A presentation name only: saves and the engine keep `Seat N`. With exactly one human seat
 * that seat is "You"; every other seat (and every seat when two or more humans share the
 * screen) is its colour's name.
 */
export function seatName(players: readonly NamedSeat[], id: string | undefined): string {
  const seat = players.findIndex(player => player.id === id);
  if (seat < 0) return "Unowned";
  const humans = players.filter(player => player.kind !== "computer");
  if (humans.length === 1 && humans[0]!.id === id) return "You";
  return SEAT_NAMES[seat] ?? `Seat ${seat + 1}`;
}

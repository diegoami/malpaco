// Ownership look. Programmer art, as in game/player_palette.gd: the same two
// colours, chosen to stay apart for the common colour-blindness types. Colour
// is never the only cue: every province also carries its owner's initial, its
// owner's badge shape, and (for the second seat) a hatch over the fill.

export interface SeatLook {
  readonly color: string;
  readonly dark: string;
  /** SVG path for the badge outline, centred on 0,0, 76 wide and 34 tall. */
  readonly badge: string;
}

export const SEATS: readonly SeatLook[] = [
  { color: "#3d7ab8", dark: "#1f4469", badge: "M-30 -17H30A17 17 0 0 1 30 17H-30A17 17 0 0 1 -30 -17Z" }, // pill
  { color: "#d98c3f", dark: "#7a4614", badge: "M-38 0L-21 -17H21L38 0L21 17H-21Z" }, // hexagon
];

export const NEUTRAL: SeatLook = { color: "#8d8578", dark: "#4b463e", badge: "M-30 -17H30V17H-30Z" };

export function seatLook(seat: number): SeatLook {
  return SEATS[seat] ?? NEUTRAL;
}

export function initial(playerId: string): string {
  return playerId === "" ? "-" : playerId.slice(0, 1).toUpperCase();
}

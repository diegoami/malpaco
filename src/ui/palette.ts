// Ownership look. The original two colours and shapes stay intact. Generated
// games add green and lavender with distinct score badges; their map labels
// print numeric seats so colour is never the only ownership cue. The authored
// map retains initials, badge shapes and the second seat's hatch.

export interface SeatLook {
  readonly color: string;
  readonly dark: string;
  /** SVG path for the badge outline, centred on 0,0, 76 wide and 34 tall. */
  readonly badge: string;
}

export const SEATS: readonly SeatLook[] = [
  { color: "#3d7ab8", dark: "#1f4469", badge: "M-30 -17H30A17 17 0 0 1 30 17H-30A17 17 0 0 1 -30 -17Z" }, // pill
  { color: "#d98c3f", dark: "#7a4614", badge: "M-38 0L-21 -17H21L38 0L21 17H-21Z" }, // hexagon
  { color: "#82b887", dark: "#315938", badge: "M-30 -17H30V17H-30Z" }, // rectangle
  { color: "#bd9cda", dark: "#61427d", badge: "M0 -19L38 0L0 19L-38 0Z" }, // diamond
];

export const NEUTRAL: SeatLook = { color: "#8d8578", dark: "#4b463e", badge: "M-30 -17H30V17H-30Z" };

export function seatLook(seat: number): SeatLook {
  return SEATS[seat] ?? NEUTRAL;
}

export function initial(playerId: string): string {
  return playerId === "" ? "-" : playerId.slice(0, 1).toUpperCase();
}

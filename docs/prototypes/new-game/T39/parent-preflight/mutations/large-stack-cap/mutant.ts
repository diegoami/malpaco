import type { DeterministicRng } from './rng';
/** Approved designed T23 variety-036, pinned ae298e37 variety.md: no upper cap.
 * One bounded rules-stream draw, including the degenerate 1..1 interval.
 * That draw-count convention is a stable designed raid-v1 replay protocol.
 */
export function raidStackAfter(armies:number,rng:Pick<DeterministicRng,'nextInt'>):number {
 return rng.nextInt(1,Math.min(20,Math.max(1,Math.floor(armies/2))));
}

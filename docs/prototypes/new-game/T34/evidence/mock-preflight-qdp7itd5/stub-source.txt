import type { RngSnapshot } from "./types";
export type GeoPoint = [number, number];
export interface GeographyCountry { id: string; island: string; polygon: GeoPoint[]; labelAt: GeoPoint; borders: string[] }
export interface GeographyIsland { id: string; polygon: GeoPoint[]; provinces: string[] }
export interface GeographyCorridor { from: string; to: string; points: GeoPoint[] }
/** Partial construction only: no owners, armies, sea adjacency, bonuses or playable GameMap. */
export interface IslandGeography {
  version: "island-geography-v1";
  seed: number;
  unitsPerPixel: number;
  bounds: { x: number; y: number; width: number; height: number };
  islands: GeographyIsland[];
  provinces: GeographyCountry[];
  entranceReservations: GeographyCorridor[];
}
export interface GeographyFailure { attempt: number; constraints: string[] }
export type GeographyResult =
  | { ok: true; geography: IslandGeography; attempts: number; failures: GeographyFailure[]; rng: RngSnapshot }
  | { ok: false; attempts: number; failures: GeographyFailure[]; rng: RngSnapshot };
export function generateIslandGeography(seed: number, options: { attempts?: number } = {}): GeographyResult {
  void options;
  return { ok: false, attempts: 0, failures: [{attempt: 0, constraints: ["Geography construction not installed"]}], rng: { seed: seed >>> 0, state: seed >>> 0 } };
}

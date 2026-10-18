import type { GameMap, Island, Point, Province } from "./types";

// Map reading, ported from core/validate/map_reader.gd and map_validator.gd.
// A subset: schema, shape, unknown keys, identity, island membership, crossing
// symmetry and polygon size. Contiguity, geometry and connectivity checks are
// not ported (the slice loads one shipped map the Godot gates already validate).
// Pure: it takes a parsed JSON value, never a path.

export const SCHEMA = 1;
const MAP_KEYS = ["schema", "id", "name", "bounds", "provinces", "islands"];
const PROVINCE_KEYS = ["id", "name", "island", "borders", "sea_lanes", "polygon", "label_at"];
const ISLAND_KEYS = ["id", "name", "bonus", "provinces"];
const BOUNDS_KEYS = ["x", "y", "width", "height"];

export type MapReadResult =
  | { readonly ok: true; readonly map: GameMap }
  | { readonly ok: false; readonly errors: string[] };

type Dict = Record<string, unknown>;

const isDict = (v: unknown): v is Dict => typeof v === "object" && v !== null && !Array.isArray(v);

function unexpectedKeys(obj: Dict, allowed: readonly string[], where: string, errors: string[]): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) errors.push(`${where} has unexpected key '${key}'`);
  }
}

function str(obj: Dict, key: string, where: string, errors: string[]): string {
  const v = obj[key];
  if (typeof v !== "string") {
    errors.push(`${where}.${key} must be a string`);
    return "";
  }
  return v;
}

function num(obj: Dict, key: string, where: string, errors: string[]): number {
  const v = obj[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    errors.push(`${where}.${key} must be a number`);
    return 0;
  }
  return v;
}

function strings(obj: Dict, key: string, where: string, errors: string[]): string[] {
  const v = obj[key];
  if (!Array.isArray(v) || v.some((s) => typeof s !== "string")) {
    errors.push(`${where}.${key} must be an array of strings`);
    return [];
  }
  return v as string[];
}

function point(v: unknown, where: string, errors: string[]): Point {
  if (!Array.isArray(v) || v.length !== 2 || v.some((n) => typeof n !== "number" || !Number.isFinite(n))) {
    errors.push(`${where} must be [x, y]`);
    return [0, 0];
  }
  return [v[0] as number, v[1] as number];
}

function readProvince(entry: unknown, errors: string[]): Province | null {
  if (!isDict(entry)) {
    errors.push("a province must be an object");
    return null;
  }
  unexpectedKeys(entry, PROVINCE_KEYS, "province", errors);
  const id = str(entry, "id", "province", errors);
  const where = `province '${id}'`;
  const rawPolygon = entry["polygon"];
  const polygon: Point[] = Array.isArray(rawPolygon)
    ? rawPolygon.map((p, i) => point(p, `${where}.polygon[${i}]`, errors))
    : (errors.push(`${where}.polygon must be an array`), []);
  return {
    id,
    name: str(entry, "name", where, errors),
    island: str(entry, "island", where, errors),
    borders: strings(entry, "borders", where, errors),
    seaLanes: strings(entry, "sea_lanes", where, errors),
    polygon,
    labelAt: point(entry["label_at"], `${where}.label_at`, errors),
  };
}

function readIsland(entry: unknown, errors: string[]): Island | null {
  if (!isDict(entry)) {
    errors.push("an island must be an object");
    return null;
  }
  unexpectedKeys(entry, ISLAND_KEYS, "island", errors);
  const id = str(entry, "id", "island", errors);
  const where = `island '${id}'`;
  return {
    id,
    name: str(entry, "name", where, errors),
    bonus: num(entry, "bonus", where, errors),
    provinces: strings(entry, "provinces", where, errors),
  };
}

function problems(map: GameMap): string[] {
  const found: string[] = [];
  if (map.provinces.length === 0) found.push("map has no provinces");
  if (map.islands.length === 0) found.push("map has no islands");

  const ids = new Set<string>();
  for (const p of map.provinces) {
    if (p.id === "") found.push("a province has an empty id");
    if (ids.has(p.id)) found.push(`duplicate province id '${p.id}'`);
    ids.add(p.id);
    if (p.polygon.length < 3) found.push(`province '${p.id}' has fewer than 3 polygon points`);
  }
  const islandIds = new Set<string>();
  for (const i of map.islands) {
    if (islandIds.has(i.id)) found.push(`duplicate island id '${i.id}'`);
    islandIds.add(i.id);
    if (i.bonus < 0) found.push(`island '${i.id}' has a negative bonus`);
  }

  const byId = new Map(map.provinces.map((p) => [p.id, p] as const));
  const listed = new Set<string>();
  for (const island of map.islands) {
    for (const pid of island.provinces) {
      const p = byId.get(pid);
      if (!p) found.push(`island '${island.id}' lists unknown province '${pid}'`);
      else if (p.island !== island.id) found.push(`province '${pid}' is listed by island '${island.id}' but names '${p.island}'`);
      listed.add(pid);
    }
  }
  for (const p of map.provinces) {
    if (!islandIds.has(p.island)) found.push(`province '${p.id}' names unknown island '${p.island}'`);
    else if (!listed.has(p.id)) found.push(`province '${p.id}' is on no island's list`);
  }

  for (const p of map.provinces) {
    for (const [kind, targets, sameIsland] of [
      ["border", p.borders, true],
      ["sea lane", p.seaLanes, false],
    ] as const) {
      const seen = new Set<string>();
      for (const tid of targets) {
        const t = byId.get(tid);
        if (tid === p.id) found.push(`province '${p.id}' has a ${kind} to itself`);
        else if (seen.has(tid)) found.push(`province '${p.id}' lists ${kind} to '${tid}' twice`);
        else if (!t) found.push(`province '${p.id}' has a ${kind} to unknown province '${tid}'`);
        else {
          if ((t.island === p.island) !== sameIsland) {
            found.push(`${kind} '${p.id}' -> '${tid}' ${sameIsland ? "leaves" : "stays on"} its island`);
          }
          const back = sameIsland ? t.borders : t.seaLanes;
          if (!back.includes(p.id)) found.push(`${kind} '${p.id}' -> '${tid}' is not returned`);
        }
        seen.add(tid);
      }
    }
  }
  return found;
}

/** Validates a parsed JSON value into a GameMap, or says why not. */
export function parseMap(data: unknown): MapReadResult {
  if (!isDict(data)) return { ok: false, errors: ["top level must be a JSON object"] };
  const errors: string[] = [];
  unexpectedKeys(data, MAP_KEYS, "map", errors);
  if (data["schema"] !== SCHEMA) {
    errors.push(`unsupported schema ${String(data["schema"])}; this build reads ${SCHEMA}`);
    return { ok: false, errors };
  }
  const rawIslands = data["islands"];
  const rawProvinces = data["provinces"];
  if (!Array.isArray(rawIslands) || !Array.isArray(rawProvinces)) {
    errors.push("map.islands and map.provinces must be arrays");
    return { ok: false, errors };
  }
  const islands = rawIslands.map((e) => readIsland(e, errors)).filter((i): i is Island => i !== null);
  const provinces = rawProvinces.map((e) => readProvince(e, errors)).filter((p): p is Province => p !== null);

  const rawBounds = data["bounds"];
  let bounds = { x: 0, y: 0, width: 0, height: 0 };
  if (isDict(rawBounds)) {
    unexpectedKeys(rawBounds, BOUNDS_KEYS, "bounds", errors);
    bounds = {
      x: num(rawBounds, "x", "bounds", errors),
      y: num(rawBounds, "y", "bounds", errors),
      width: num(rawBounds, "width", "bounds", errors),
      height: num(rawBounds, "height", "bounds", errors),
    };
    if (bounds.width <= 0 || bounds.height <= 0) errors.push("bounds must have a positive size");
  } else errors.push("map.bounds must be an object");

  const map: GameMap = {
    id: str(data, "id", "map", errors),
    name: str(data, "name", "map", errors),
    bounds,
    provinces,
    islands,
  };
  if (errors.length > 0) return { ok: false, errors };
  const invalid = problems(map);
  return invalid.length > 0 ? { ok: false, errors: invalid } : { ok: true, map };
}

export function province(map: GameMap, id: string): Province | undefined {
  return map.provinces.find((p) => p.id === id);
}

/** Everywhere an army could go from here: land borders then sea lanes. */
export function neighbours(p: Province): string[] {
  return [...p.borders, ...p.seaLanes];
}

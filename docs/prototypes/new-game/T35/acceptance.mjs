// Proposal: install at docs/prototypes/new-game/T35/acceptance.mjs.
// Actual rules data stays authoritative; only diagnostic display specifications are supplied.
import {inspect} from '../T62/contract.mjs';
import {parameters as P} from '../T24/parameters.mjs';

export function diagnosticBoard(map, geography) {
  const point = p => p.map(v => v / geography.unitsPerPixel);
  return {
    ...map,
    bounds: Object.fromEntries(Object.entries(map.bounds).map(([k,v])=>[k,v/geography.unitsPerPixel])),
    provinces: map.provinces.map(p => ({...p,
      polygon:p.polygon.map(point), labelAt:point(p.labelAt),
      hitSizeCss: P.hitSize, countTextCss: P.countTextMin, countContrast: P.contrastMin,
    })),
    islands: map.islands.map(i => ({...i,
      polygon: geography.islands.find(g => g.id === i.id)?.polygon.map(point),
    })),
    routes: geography.entranceReservations.map(r => ({...r, points: r.points.map(point)})),
  };
}

export function inspectBoard(map, geography) {
  const errors = [];
  try {
    const q = geography.unitsPerPixel;
    if (!Number.isSafeInteger(q) || q <= 0) return ['geometry: invalid units'];
    const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const points=[...map.provinces.flatMap(p=>[p.labelAt,...p.polygon]),...geography.provinces.flatMap(p=>[p.labelAt,...p.polygon]),...geography.islands.flatMap(i=>i.polygon),...geography.entranceReservations.flatMap(r=>r.points)];
    if([...Object.values(map.bounds),...Object.values(geography.bounds),...points.flat()].some(v=>!Number.isSafeInteger(v))) errors.push('geometry: noninteger coordinate');
    const bounds = geography.bounds;
    if (!equal(map.bounds, bounds)) errors.push('geometry: stale bounds');
    if (map.provinces.length !== geography.provinces.length || map.islands.length !== geography.islands.length) errors.push('geometry: membership count');
    for (const p of map.provinces) {
      const g = geography.provinces.find(g => g.id === p.id);
      if (!g || p.island !== g.island || !equal(p.polygon, g.polygon) || !equal(p.labelAt, g.labelAt)) errors.push('geometry: stale country '+p.id);
    }
    for (const i of map.islands) {
      const g = geography.islands.find(g => g.id === i.id);
      if (!g || !equal([...i.provinces].sort(), [...g.provinces].sort())) errors.push('geometry: stale island '+i.id);
    }
    // Crucially, do not regenerate map.borders, seaLanes or bonuses from reservations here.
    for (const [group, messages] of Object.entries(inspect(diagnosticBoard(map, geography)))) {
      errors.push(...messages.map(message => group+': '+message));
    }
  } catch (error) { errors.push('malformed: '+error.message); }
  return errors;
}

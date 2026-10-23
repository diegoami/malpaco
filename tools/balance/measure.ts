import {appendFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {defaultOptions} from '../../src/core/options';
import {createGeographicGame} from '../../src/core/geographic-game';
import {raidCardsRules} from '../../src/core/state';
import {apply} from '../../src/core/rules';
import {computerAction} from '../../src/core/computer';
import {candidate, dealMetrics, distribution, incomes, PROTOCOL, summarize, VARIANTS} from './experiment';
import type {Outcome, DealMetrics, Variant} from './experiment';
const config = JSON.parse(process.argv[2]!) as {dealSeeds: number; gameSeeds: number; out: string};
const hash = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const raw = join(config.out, 'games.jsonl'), deals = join(config.out, 'deals.jsonl');
writeFileSync(raw, ''); writeFileSync(deals, '');
const outcomes: Outcome[] = [];
const initial: Record<Variant, DealMetrics[]> = {current: [], deal: [], bonus: [], both: []};
const started = performance.now();
for (let seed = 0; seed < Math.max(config.dealSeeds, config.gameSeeds); seed++) {
  const options = {...defaultOptions(), seed, seats: Array.from({length: 4}, () => ({kind: 'computer' as const})), computerStrengths: Array.from({length: 4}, () => 'Normal' as const)};
  let created;
  try { created = createGeographicGame(options, raidCardsRules(options), {}, 2); }
  catch (error) {
    for (const variant of VARIANTS) {
      const row: Outcome = {seed, variant, status: 'error', error: String(error)};
      if (seed < config.dealSeeds) appendFileSync(deals, JSON.stringify(row) + '\n');
      if (seed < config.gameSeeds) {outcomes.push(row); appendFileSync(raw, JSON.stringify(row) + '\n');}
    }
    continue;
  }
  for (const variant of VARIANTS) {
    if (!created.ok) {
      const row: Outcome = {seed, variant, status: 'refused', error: created.errors.join('; ')};
      if (seed < config.dealSeeds) appendFileSync(deals, JSON.stringify(row) + '\n');
      if (seed < config.gameSeeds) {outcomes.push(row); appendFileSync(raw, JSON.stringify(row) + '\n');}
      continue;
    }
    let dealWritten = false;
    try {
      let state = candidate(created.state, variant);
      const metrics = dealMetrics(state);
      if (seed < config.dealSeeds) {
        initial[variant].push(metrics);
        appendFileSync(deals, JSON.stringify({seed, variant, status: 'generated', seats: metrics,
          boardHash: hash(state.map.provinces), firstSeat: state.players[state.currentPlayer]!.id,
          gameRng: state.rng, initialStateHash: hash(state)}) + '\n');
        dealWritten = true;
      }
      if (seed >= config.gameSeeds) continue;
      const firstSeat = state.players[state.currentPlayer]!.id;
      let round5: ReturnType<typeof incomes> | null = null, actions = 0;
      while (state.phase !== 'finished' && actions < PROTOCOL.actionCap && state.turnNumber <= PROTOCOL.roundCap) {
        const action = computerAction(state);
        if (!action) throw new Error(`No action in ${state.phase}`);
        const next = apply(state, action);
        if (!next.ok) throw new Error(`Illegal ${action.kind}: ${next.error}`);
        state = next.state; actions++;
        if (!round5 && state.turnNumber === 5 && state.phase !== 'finished') round5 = incomes(state);
      }
      const row = {seed, variant, status: state.phase === 'finished' ? 'finished' as const : 'unfinished' as const,
        firstSeat, winner: state.winner, round: state.turnNumber, actions, round5,
        reason: state.result?.reason ?? null, historyHash: hash(state.history), finalRng: state.rng};
      outcomes.push(row); appendFileSync(raw, JSON.stringify(row) + '\n');
    } catch (error) {
      const row: Outcome = {seed, variant, status: 'error', error: String(error)};
      if (seed < config.dealSeeds && !dealWritten) appendFileSync(deals, JSON.stringify(row) + '\n');
      if (seed < config.gameSeeds) {outcomes.push(row); appendFileSync(raw, JSON.stringify(row) + '\n');}
    }
  }
  if ((seed + 1) % 25 === 0) console.log(`${seed + 1} paired seeds; ${Math.round(performance.now() - started)}ms`);
}
const gap = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
const summary = {protocol: PROTOCOL, config, variants: Object.fromEntries(VARIANTS.map(variant => {
  const sets = initial[variant];
  return [variant, {
    deals: {scheduled: config.dealSeeds, generated: sets.length, failed: config.dealSeeds - sets.length,
      capViolatingSeeds: sets.filter(s => s.some(p => p.capViolations.length)).length,
      countryGap: distribution(sets.map(s => gap(s.map(p => p.countries)))),
      armyGap: distribution(sets.map(s => gap(s.map(p => p.armies)))),
      minIslandsTouched: distribution(sets.map(s => Math.min(...s.map(p => p.islandsTouched)))),
      enemyBorderGap: distribution(sets.map(s => gap(s.map(p => p.enemyBorders))))},
    games: summarize(outcomes.filter(r => r.variant === variant)),
  }];
}))};
writeFileSync(join(config.out, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
if (outcomes.some(r => r.status === 'error')) process.exitCode = 1;

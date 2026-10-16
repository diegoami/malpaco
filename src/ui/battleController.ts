import { activePlayer, apply, armyCount, cloneState, DeterministicRng, diceCount, friendlySources, friendlyTargets, ownerOf, pairResults, province, resolve, whyNot } from "../core";
import type { Action, AttackOutcome, GameState } from "../core";

export type BattleSpeed = "slow" | "normal" | "fast";
export interface BattleScheduler {
  schedule(callback: () => void, delayMs: number): number;
  cancel(handle: number): void;
}
export interface BattleRoll {
  readonly attackerRolls: readonly number[];
  readonly defenderRolls: readonly number[];
  readonly results: readonly ("attacker" | "defender" | "tie")[];
}
export interface BattleView {
  readonly mode: "battle" | "move";
  readonly state: GameState;
  readonly from: string | null;
  readonly to: string | null;
  readonly running: boolean;
  readonly paused: boolean;
  readonly threshold: number;
  readonly effectiveThreshold: number;
  readonly speed: BattleSpeed;
  readonly revision: number;
  readonly lastOutcome: AttackOutcome | null;
  readonly rolls: readonly BattleRoll[];
  readonly ties: number;
  readonly attackerWins: number;
  readonly defenderWins: number;
  readonly message: string;
}

// Approved malpaco proposals, not predecessor measurements: pinned design/ui.md
// (ae298e37), Combat feedback / Pacing / UI5 / UI6.
export const DEFAULT_STOP_THRESHOLD = 2;
export const EXCHANGE_TIME = 400;
export const HUMAN_BATTLE_WATCH = 5000;
export const SPEED_SCALE: Readonly<Record<BattleSpeed, number>> = { slow: 1.5, normal: 1, fast: 0.5 };

/** Trace only the exchange the player just chose, with an independent RNG copy.
 * The existing resolver decides every tie; only ordinary apply changes the game.
 */
function exchangeRolls(before: GameState, from: string, to: string): BattleRoll[] {
  const rng = DeterministicRng.fromSnapshot(before.rng);
  const faces: number[] = [];
  resolve(cloneState(before), from, to, {
    rollDie(sides) { const face = rng.rollDie(sides); faces.push(face); return face; },
  });
  const a = diceCount(before.rules.combat.attackerDice, armyCount(before, from));
  const d = diceCount(before.rules.combat.defenderDice, armyCount(before, to));
  const rolls: BattleRoll[] = [];
  for (let offset = 0; offset < faces.length; offset += a + d) {
    const attackerRolls = faces.slice(offset, offset + a).sort((x, y) => y - x);
    const defenderRolls = faces.slice(offset + a, offset + a + d).sort((x, y) => y - x);
    rolls.push({ attackerRolls, defenderRolls, results: pairResults(before.rules.combat.ties, attackerRolls, defenderRolls) });
  }
  return rolls;
}

/** One authoritative state, one cancellable continuation, no DOM or wall clock. */
export class BattleController {
  private current: BattleView;
  private timer: number | null = null;
  private generation = 0;
  private disposed = false;
  private watchExchanges = 0;
  private beforeMove: BattleView | null = null;

  constructor(initial: GameState, private readonly scheduler: BattleScheduler, private readonly onChange?: (view: BattleView) => void) {
    this.current = {
      mode: "battle", state: initial, from: initial.pendingCapture?.from ?? null, to: initial.pendingCapture?.to ?? null, running: false, paused: false,
      threshold: DEFAULT_STOP_THRESHOLD, effectiveThreshold: 1, speed: "normal", revision: 0,
      lastOutcome: null, rolls: [], ties: 0, attackerWins: 0, defenderWins: 0, message: "",
    };
  }

  get state(): GameState { return this.current.state; }
  get view(): BattleView { return this.current; }

  private accepts(revision?: number): boolean {
    return !this.disposed && (revision === undefined || revision === this.current.revision);
  }

  private pending(): boolean { return this.state.phase === "capture" || this.state.pendingCapture !== undefined; }

  private publish(patch: Partial<BattleView>): void {
    this.current = { ...this.current, ...patch, revision: this.current.revision + 1 };
    this.onChange?.(this.current);
  }

  private cancel(): void {
    this.generation += 1;
    if (this.timer !== null) this.scheduler.cancel(this.timer);
    this.timer = null;
  }

  private clamp(from = this.current.from): number {
    return Math.max(1, Math.min(this.current.threshold, from ? armyCount(this.state, from) - 1 : 1));
  }

  select(from: string | null, to: string | null, revision?: number): boolean {
    if (!this.accepts(revision) || this.current.running || this.current.paused || this.pending() || this.state.phase !== "attack") return false;
    if (this.current.mode === "move") {
      if (from === null ? to !== null : !friendlySources(this.state).includes(from)) return false;
      if (to !== null && (from === null || !friendlyTargets(this.state, from).includes(to))) return false;
    } else {
      if (from === null ? to !== null : !province(this.state.map, from) || ownerOf(this.state, from) !== activePlayer(this.state)?.id) return false;
      if (to !== null && (from === null || whyNot(this.state, from, to) !== "")) return false;
    }
    this.cancel();
    const changed = from !== this.current.from || to !== this.current.to;
    this.publish({ from, to, effectiveThreshold: this.clamp(from), message: "",
      ...(changed ? { lastOutcome: null, rolls: [], ties: 0, attackerWins: 0, defenderWins: 0 } : {}),
    });
    return true;
  }

  setThreshold(value: number, revision?: number): boolean {
    if (!this.accepts(revision) || this.pending() || this.current.running || this.current.paused || !Number.isSafeInteger(value) || value < 1) return false;
    const upper = this.current.from ? armyCount(this.state, this.current.from) - 1 : 1;
    this.publish({ threshold: value, effectiveThreshold: Math.max(1, Math.min(value, upper)) });
    return true;
  }

  setSpeed(speed: BattleSpeed, revision?: number): boolean {
    if (!this.accepts(revision) || !Object.hasOwn(SPEED_SCALE, speed)) return false;
    this.publish({ speed });
    return true;
  }

  private canExchange(): boolean {
    const { from, to } = this.current;
    return this.current.mode === "battle" && !this.pending() && this.state.phase === "attack" && from !== null && to !== null && whyNot(this.state, from, to) === "";
  }

  /** The draft consumes no engine action. Cancel restores the prior battle context. */
  startFriendlyMove(revision?: number): boolean {
    if (!this.accepts(revision) || this.current.mode !== "battle" || this.current.running || this.current.paused || this.pending() || friendlySources(this.state).length === 0) return false;
    this.cancel();
    this.beforeMove = this.current;
    this.publish({ mode: "move", from: null, to: null, message: "Choose a marked source, then an owned neighbour. Confirming ends your turn." });
    return true;
  }

  cancelFriendlyMove(revision?: number): boolean {
    if (!this.accepts(revision) || this.current.mode !== "move" || !this.beforeMove) return false;
    const { from, to, effectiveThreshold, lastOutcome, rolls, ties, attackerWins, defenderWins, message } = this.beforeMove;
    this.beforeMove = null;
    this.cancel();
    this.publish({ mode: "battle", from, to, effectiveThreshold, lastOutcome, rolls, ties, attackerWins, defenderWins, message });
    return true;
  }

  singleExchange(revision?: number): boolean {
    if (!this.accepts(revision) || this.current.running || this.current.paused || !this.canExchange()) return false;
    this.exchange(false);
    return true;
  }

  fightOn(revision?: number): boolean {
    if (!this.accepts(revision) || this.current.running || !this.canExchange()) return false;
    this.watchExchanges = 0;
    this.current = { ...this.current, effectiveThreshold: this.current.paused ? this.current.effectiveThreshold : this.clamp(), paused: false };
    this.exchange(true);
    return true;
  }

  /** Called once per chosen exchange, never to prepare a later exchange. */
  private exchange(continuous: boolean): void {
    const from = this.current.from!, to = this.current.to!;
    const before = this.state;
    const result = apply(before, { kind: "attack", from, to });
    if (!result.ok || !result.outcome) return;
    const rolls = exchangeRolls(before, from, to);
    const outcome = result.outcome;
    this.watchExchanges += 1;
    const captured = result.state.pendingCapture !== undefined;
    const exhausted = armyCount(result.state, from) < result.state.rules.combat.minArmiesToAttack;
    const threshold = armyCount(result.state, from) <= this.current.effectiveThreshold;
    const running = continuous && !captured && !exhausted && !threshold && result.state.phase === "attack";
    // Queue only after this outcome exists. A stop invalidates even a callback
    // already removed from the scheduler's queue (covered by the stale-callback test).
    if (running) this.schedule();
    this.publish({ state: result.state, lastOutcome: outcome, rolls, running, paused: false,
      ties: this.current.ties + rolls.reduce((n, roll) => n + roll.results.filter(r => r === "tie").length, 0),
      attackerWins: this.current.attackerWins + outcome.defenderLosses,
      defenderWins: this.current.defenderWins + outcome.attackerLosses,
      message: captured ? "Captured. Choose how many armies move in." : exhausted ? "Stopped: only one army remains at the source." : continuous && threshold ? `Stopped at ${this.current.effectiveThreshold} armies.` : running ? "Fighting on. Stop before the next exchange at any time." : "One exchange complete.",
    });
  }

  private schedule(): void {
    const own = this.generation;
    const scale = SPEED_SCALE[this.current.speed];
    this.timer = this.scheduler.schedule(() => {
      if (this.disposed || own !== this.generation) return;
      this.timer = null;
      if (!this.current.running || !this.canExchange()) return;
      // The same 12 fully shown exchanges at every speed; the 13th needs consent.
      if ((this.watchExchanges + 1) * EXCHANGE_TIME * scale > HUMAN_BATTLE_WATCH * scale) {
        this.publish({ running: false, paused: true, message: "Battle paused. Keep watching or stop with these stacks." });
        return;
      }
      this.exchange(true);
    }, EXCHANGE_TIME * scale);
  }

  stop(revision?: number): boolean {
    if (!this.accepts(revision) || (!this.current.running && !this.current.paused)) return false;
    this.cancel();
    this.publish({ running: false, paused: false, message: "Stopped. Both countries keep their current armies." });
    return true;
  }

  confirmCapture(amount: number, revision?: number): boolean {
    if (!this.accepts(revision) || !this.pending()) return false;
    const result = apply(this.state, { kind: "captureMove", amount });
    if (!result.ok) return false;
    this.cancel();
    this.publish({ state: result.state, running: false, paused: false, message: `${amount} ${amount === 1 ? "army moves" : "armies move"} into the captured country.` });
    return true;
  }

  dispatch(action: Action, revision?: number): boolean {
    if (!this.accepts(revision) || this.pending() || this.current.running || this.current.paused) return false;
    if (action.kind === "captureMove") return false;
    if (this.current.mode === "move") {
      if (action.kind !== "friendlyMove" && action.kind !== "endTurn") return false;
    } else if (action.kind === "friendlyMove") return false;
    if (action.kind === "friendlyMove" && (action.from !== this.current.from || action.to !== this.current.to)) return false;
    if (action.kind === "attack") {
      if (action.from !== this.current.from || action.to !== this.current.to) return false;
      return this.singleExchange(revision);
    }
    const result = apply(this.state, action);
    if (!result.ok) return false;
    this.cancel();
    this.beforeMove = null;
    this.publish({ mode: "battle", state: result.state, from: null, to: null, effectiveThreshold: 1,
      lastOutcome: null, rolls: [], ties: 0, attackerWins: 0, defenderWins: 0, message: "",
    });
    return true;
  }

  replaceGame(next: GameState, _reason: "load" | "new-game"): boolean {
    if (!this.accepts()) return false;
    this.cancel();
    this.watchExchanges = 0;
    this.beforeMove = null;
    this.publish({ mode: "battle", state: next, from: next.pendingCapture?.from ?? null, to: next.pendingCapture?.to ?? null, running: false, paused: false, effectiveThreshold: 1,
      lastOutcome: null, rolls: [], ties: 0, attackerWins: 0, defenderWins: 0, message: "",
    });
    return true;
  }

  dispose(): boolean {
    if (this.disposed) return false;
    this.cancel();
    this.disposed = true;
    this.beforeMove = null;
    this.publish({ mode: "battle", running: false, paused: false });
    return true;
  }
}

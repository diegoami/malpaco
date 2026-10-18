import type { CardState } from './cards';
// Plain data types for the rules core. Everything here is JSON-serialisable
// except the map, which is shared and never mutated once loaded.

export type Point = readonly [number, number];

export interface Province {
  readonly id: string;
  readonly name: string;
  readonly island: string;
  /** Land neighbours: same island, authored and symmetric. */
  readonly borders: readonly string[];
  /** Water neighbours: always on another island. */
  readonly seaLanes: readonly string[];
  readonly polygon: readonly Point[];
  readonly labelAt: Point;
}

export interface Island {
  readonly id: string;
  readonly name: string;
  readonly bonus: number;
  readonly provinces: readonly string[];
}

export interface GameMap {
  readonly id: string;
  readonly name: string;
  readonly bounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly provinces: readonly Province[];
  readonly islands: readonly Island[];
}

export interface Player {
  readonly id: string;
  readonly name: string;
  /** "human" or "computer" (C-PLY-02, decision 3). Defaults to "human" when absent. */
  readonly kind?: "human" | "computer";
  /** A computer seat's difficulty (computer.md A1, A2, A3). Humans ignore it. */
  readonly difficulty?: "Easy" | "Normal" | "Hard";
  eliminated: boolean;
}

/** How many dice a stack rolls: clamp(armies - minus, 0, max). */
export interface DiceRule {
  readonly max: number;
  readonly minus: number;
}

/** The Classic preset's combat block, as data (core/rules/rule_set.gd, Combat). */
export interface CombatRules {
  readonly attackRule: "match" | "classic" | "threshold";
  readonly attackRatio: number;
  readonly minArmiesToAttack: number;
  readonly attackerDice: DiceRule;
  readonly defenderDice: DiceRule;
  readonly ties: "defender" | "attacker" | "reroll";
  readonly failurePenalty: "loseProvince" | "endPhase" | "none";
  readonly capture: "diceCount" | "all" | "one" | "choice";
}

export interface SetupRules {
  readonly startingArmies: number;
  readonly distributionPool: number;
  readonly shortStackBonus: number;
}

export interface RuleSet {
  readonly cards?: "deck-v1" | "trade-v1" | "raid-v1";
  readonly id: string;
  /** Opt-in C-MOV-01..03; omitted by the stable legacy presets. */
  readonly movement?: "adjacent";
  /** [designed] T11 turn flow; Classic remains the legacy attack-only shortcut. */
  readonly turnSequence: "classic" | "reinforcement";
  readonly setup: SetupRules;
  readonly combat: CombatRules;
  /** Conquest only, as in Classic. */
  readonly victory: readonly "conquest"[];
  /** Opt-in pinned end-of-turn victory; earlier presets keep their timing. */
  readonly victoryOptions?: { readonly dominationWin: boolean; readonly roundLimit: 20 | 30 | 40 | null };
}

export type Phase = "cards" | "reinforce" | "attack" | "capture" | "redeploy" | "human-loss" | "finished";

export interface FinalStanding {
  readonly player: string;
  readonly countries: number;
  readonly armies: number;
}

export interface GameResult {
  readonly reason: "conquest" | "last-seat" | "domination" | "round-limit" | "no-human-left";
  readonly standings: FinalStanding[];
}

/** Total move-in bounds, including the one army provisionally moved at capture. */
export interface PendingCapture {
  readonly from: string;
  readonly to: string;
  readonly min: number;
  readonly max: number;
  readonly defaultAmount: number;
}

export interface RngSnapshot {
  readonly seed: number;
  readonly state: number;
}

export type Action =
  | { readonly kind: "tradeCards"; readonly handIndices: readonly [number, number, number] }
  | { readonly kind: "skipCards" }
  | { readonly kind: "discardCard"; readonly handIndex: number }
  | { readonly kind: "reinforce"; readonly province: string; readonly amount: number }
  | { readonly kind: "endReinforcement" }
  | { readonly kind: "attack"; readonly from: string; readonly to: string }
  | { readonly kind: "endTurn" }
  | { readonly kind: "captureMove"; readonly amount?: number }
  | { readonly kind: "friendlyMove"; readonly from: string; readonly to: string; readonly amount?: number }
  | { readonly kind: "watchComputers" }
  | { readonly kind: "stopGame" };

export interface AttackOutcome {
  readonly event: "attack";
  readonly turn: number;
  readonly from: string;
  readonly to: string;
  readonly attacker: string;
  readonly defender: string;
  readonly attackerRolls: readonly number[];
  readonly defenderRolls: readonly number[];
  readonly attackerLosses: number;
  readonly defenderLosses: number;
  readonly captured: boolean;
  readonly penalty: boolean;
  readonly endsPhase: boolean;
  /** Armies moved into a captured province. */
  readonly moved: number;
}

export type LogEntry =
  | { readonly event: "game_started"; readonly seed: number; readonly players: number }
  | AttackOutcome
  | { readonly event: "eliminated"; readonly player: string; readonly turn: number }
  | { readonly event: "victory"; readonly player: string; readonly turn: number }
  | { readonly event: "turn_ended"; readonly player: string; readonly turn: number };

export interface GameState {
  cards?: CardState;
  readonly map: GameMap;
  readonly rules: RuleSet;
  readonly players: Player[];
  ownerOf: Record<string, string>;
  armies: Record<string, number>;
  currentPlayer: number;
  phase: Phase;
  /** Present only during the opt-in capture-choice protocol. */
  pendingCapture?: PendingCapture;
  /** Unplaced income available during a reinforcement phase. */
  reinforcementPool: number;
  turnNumber: number;
  /** Fixed seeded first-seat index; retained even after that seat is eliminated. */
  roundOrigin?: number;
  /** Suppresses repeated loss prompts after the ordinary Watch action. */
  watchingComputers?: boolean;
  result?: GameResult;
  capturedThisTurn: boolean;
  /**
   * The game's own RNG stream. Every rules draw (the board, the deal,
   * starting armies, the first seat, dice, card draws, events) reads from
   * here (C-RND-03).
   */
  rng: RngSnapshot;
  /**
   * Per-computer-seat RNG streams, seeded from the game seed and the seat
   * number. Used by the computer opponent only; never by the rules (so the
   * game's draws are not perturbed by computer play, C-RND-03).
   */
  computerRngs: Record<string, RngSnapshot>;
  log: LogEntry[];
  history: Action[];
  winner: string;
  /** Three uniformly selected opening production centres (C-CEN-01, C-CEN-04). */
  productionCentres: string[];
}

export type ApplyResult =
  | { readonly ok: true; readonly state: GameState; readonly outcome: AttackOutcome | null }
  | { readonly ok: false; readonly error: string };

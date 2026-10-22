import { activePlayer, computerAction } from "../core";
import type { GameState } from "../core";
import type { BattleController, BattleScheduler, BattleSpeed } from "./battleController";

/**
 * The wait before each computer action, by speed; speed only changes waiting, never policy, game
 * RNG, action count or saved history. [designed] T101 (owner, 2026-10-22: "faster"): Normal is
 * 120 ms, so a round of three Normal computers (about 60 actions on the reference seed) takes
 * about 10 s instead of 50 s; Slow keeps the T18 baseline's 350 ms for those who want to watch,
 * and Fast halves Normal.
 */
export const COMPUTER_STEP_TIMES: Readonly<Record<BattleSpeed, number>> = { "very-slow": 2000, slow: 350, normal: 120, fast: 60 };
export const COMPUTER_STEP_TIME = COMPUTER_STEP_TIMES.normal;
// [designed] Owner-requested T70 presentation pace, exactly two seconds per action.
export const VERY_SLOW_COMPUTER_STEP_TIME = COMPUTER_STEP_TIMES["very-slow"];
// [designed] T84 Fast-forward: one short beat per action, so the map still visibly
// updates; it changes waiting only, like speed, and ends when a human seat moves.
export const FAST_FORWARD_STEP_TIME = 40;
export class ComputerTurnLoop {
  private timer: number | null = null;
  private forwarding = false;
  private generation = 0;
  private disposed = false;
  private queuedState: GameState | null = null;
  private queuedSpeed: BattleSpeed | null = null;
  constructor(private readonly controller: BattleController, private readonly scheduler: BattleScheduler) {}
  get fastForwarding(): boolean { return this.forwarding; }
  /** Plays the computer seats without their waits until a human seat moves; Pause ends it. */
  fastForward(): void {
    if (this.disposed || this.forwarding || !this.computerTurn()) return;
    this.forwarding = true; this.cancel(); this.update();
  }
  private computerTurn(): boolean {
    const state = this.controller.state;
    return !this.controller.playbackPaused && !this.controller.cardAcknowledgmentPending && state.phase !== "finished" && state.phase !== "human-loss" && activePlayer(state)?.kind === "computer";
  }
  update(): void {
    if (this.disposed) return;
    if (!this.computerTurn()) this.forwarding = false;
    if (this.controller.playbackPaused || this.controller.cardAcknowledgmentPending) { this.cancel(); return; }
    const {state,speed} = this.controller.view;
    if (this.timer !== null && state === this.queuedState && speed === this.queuedSpeed) return;
    this.cancel();
    if (!this.computerTurn()) return;
    this.queuedState = state; this.queuedSpeed = speed;
    const generation = this.generation;
    this.timer = this.scheduler.schedule(() => {
      if (this.disposed || generation !== this.generation || this.controller.state !== state) return;
      this.timer = null;
      const action = computerAction(state);
      if (action) this.controller.dispatchComputer(action, this.controller.view.revision);
    }, this.forwarding ? FAST_FORWARD_STEP_TIME : COMPUTER_STEP_TIMES[speed]);
  }
  private cancel(): void {
    this.generation++;
    if (this.timer !== null) this.scheduler.cancel(this.timer);
    this.timer = null; this.queuedState = null; this.queuedSpeed = null;
  }
  dispose(): void { this.disposed = true; this.cancel(); }
}

import { activePlayer, computerAction } from "../core";
import type { GameState } from "../core";
import { SPEED_SCALE } from "./battleController";
import type { BattleController, BattleScheduler, BattleSpeed } from "./battleController";

// [designed] Retain the T18 baseline's 350 ms presentation pace; speed only
// changes waiting, never policy, game RNG, action count or saved history.
export const COMPUTER_STEP_TIME = 350;
// [designed] Owner-requested T70 presentation pace, exactly two seconds per action.
export const VERY_SLOW_COMPUTER_STEP_TIME = 2000;
export class ComputerTurnLoop {
  private timer: number | null = null;
  private generation = 0;
  private disposed = false;
  private queuedState: GameState | null = null;
  private queuedSpeed: BattleSpeed | null = null;
  constructor(private readonly controller: BattleController, private readonly scheduler: BattleScheduler) {}
  update(): void {
    if (this.disposed) return;
    if (this.controller.playbackPaused || this.controller.cardAcknowledgmentPending) { this.cancel(); return; }
    const {state,speed} = this.controller.view;
    if (this.timer !== null && state === this.queuedState && speed === this.queuedSpeed) return;
    this.cancel();
    if (state.phase === "finished" || state.phase === "human-loss" || activePlayer(state)?.kind !== "computer") return;
    this.queuedState = state; this.queuedSpeed = speed;
    const generation = this.generation;
    this.timer = this.scheduler.schedule(() => {
      if (this.disposed || generation !== this.generation || this.controller.state !== state) return;
      this.timer = null;
      const action = computerAction(state);
      if (action) this.controller.dispatchComputer(action, this.controller.view.revision);
    }, speed === "very-slow" ? VERY_SLOW_COMPUTER_STEP_TIME : COMPUTER_STEP_TIME * SPEED_SCALE[speed]);
  }
  private cancel(): void {
    this.generation++;
    if (this.timer !== null) this.scheduler.cancel(this.timer);
    this.timer = null; this.queuedState = null; this.queuedSpeed = null;
  }
  dispose(): void { this.disposed = true; this.cancel(); }
}

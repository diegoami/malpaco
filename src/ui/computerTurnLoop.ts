import { activePlayer, computerAction } from "../core";
import type { GameState } from "../core";
import type { BattleController, BattleScheduler, BattleSpeed } from "./battleController";

/** T115: these are gaps between actions. The player UI holds a separate readable
 * executed-action beat; non-player/manual adapters keep their existing scheduler.
 * Speed and feedback never change the policy or consume a rules draw.
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
    if(this.disposed||this.forwarding||this.controller.playbackPaused||this.controller.cardAcknowledgmentPending||this.controller.state.players[this.controller.state.currentPlayer]?.kind!=="computer"||this.controller.state.result)return;
    this.forwarding = true; this.cancel(); this.update();
  }
  private computerTurn(): boolean {
    const state = this.controller.state;
    return !this.controller.computerFeedbackPending && !this.controller.playbackPaused && !this.controller.cardAcknowledgmentPending && state.phase !== "finished" && state.phase !== "human-loss" && activePlayer(state)?.kind === "computer";
  }
  update(): void {
    if (this.disposed) return;
    if(!this.computerTurn()&&!this.controller.computerFeedbackPending)this.forwarding=false;
    if(this.controller.computerFeedbackPending||this.controller.playbackPaused||this.controller.cardAcknowledgmentPending) { this.cancel(); return; }
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

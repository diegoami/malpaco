from pathlib import Path
r=Path.cwd()
def change(name,old,new):
 p=r/name;t=p.read_text();assert old in t,(name,old);p.write_text(t.replace(old,new))
change('src/core/computer.ts','import { legalAttacks }','import { friendlySources, friendlyTargets } from "./movement";\nimport { legalAttacks }')
change('src/core/computer.ts','priorities and finite budget in computer/README.md.','priorities and finite budget in docs/prototypes/new-game/T32/README.md.')
change('src/core/computer.ts','state.phase === "finished")','(state.phase === "finished" || state.phase === "human-loss"))')
change('src/core/computer.ts','  if (state.phase === "reinforce") {','  if (state.phase === "capture") return { kind: "captureMove" };\n  if (state.phase === "reinforce") {')
change('src/core/computer.ts','if (action.kind === "endTurn") break;','if (action.kind === "endTurn" || action.kind === "friendlyMove" || action.kind === "watchComputers") break;')
change('src/core/computer.ts','  return { kind: "endTurn" };','''  // [designed] Move an interior reserve to a neighbouring frontier; no RNG draws.
  const frontier = (id: string) => {
    const p = state.map.provinces.find(p => p.id === id)!;
    return [...p.borders, ...p.seaLanes].some(n => state.ownerOf[n] !== mover.id);
  };
  const moves = friendlySources(state).filter(id => !frontier(id)).flatMap(from =>
    friendlyTargets(state, from).filter(frontier).map(to => ({ kind: "friendlyMove" as const, from, to })));
  moves.sort((a,b) => state.armies[b.from]! - state.armies[a.from]! ||
    (a.from < b.from ? -1 : a.from > b.from ? 1 : a.to < b.to ? -1 : a.to > b.to ? 1 : 0));
  return moves[0] ?? { kind: "endTurn" };''')
change('src/ui/battleController.ts','private readonly onChange?: (view: BattleView) => void)', 'private readonly onChange?: (view: BattleView) => void, private readonly allowInput: (state: GameState) => boolean = () => true)')
change('src/ui/battleController.ts','private accepts(revision?: number): boolean {','private accepts(revision?: number, humanInput = true): boolean {')
change('src/ui/battleController.ts','return !this.disposed && (revision === undefined', 'return !this.disposed && (!humanInput || this.allowInput(this.state)) && (revision === undefined')
change('src/ui/battleController.ts','if (!this.accepts(revision) || !Object.hasOwn(SPEED_SCALE','if (!this.accepts(revision, false) || !Object.hasOwn(SPEED_SCALE')
change('src/ui/battleController.ts','if (!this.accepts()) return false;','if (!this.accepts(undefined, false)) return false;')
change('src/ui/battleController.ts','  replaceGame(next:', '''  /** Automatic seats still use ordinary engine actions, without human selections. */
  dispatchComputer(action: Action, revision?: number): boolean {
    if (!this.accepts(revision, false) || activePlayer(this.state)?.kind !== "computer" || this.state.phase === "human-loss" || this.state.phase === "finished") return false;
    const before = this.state, result = apply(before, action);
    if (!result.ok) return false;
    this.cancel(); this.beforeMove = null;
    const rolls = action.kind === "attack" ? exchangeRolls(before, action.from, action.to) : [];
    this.publish({ mode: "battle", state: result.state, running: false, paused: false,
      from: result.state.pendingCapture?.from ?? (action.kind === "attack" ? action.from : null),
      to: result.state.pendingCapture?.to ?? (action.kind === "attack" ? action.to : null),
      lastOutcome: result.outcome ?? null, rolls, ties: rolls.reduce((n,r)=>n+r.results.filter(v=>v==="tie").length,0),
      attackerWins: result.outcome?.defenderLosses ?? 0, defenderWins: result.outcome?.attackerLosses ?? 0,
      effectiveThreshold: 1, message: action.kind === "attack" ? "Computer exchange complete." : "",
    });
    return true;
  }

  replaceGame(next:''')
(r/'src/ui/computerTurnLoop.ts').write_text('''import { activePlayer, computerAction } from "../core";
import type { GameState } from "../core";
import { SPEED_SCALE } from "./battleController";
import type { BattleController, BattleScheduler, BattleSpeed } from "./battleController";

// [designed] Retain the T18 baseline's 350 ms presentation pace; speed only
// changes waiting, never policy, game RNG, action count or saved history.
export const COMPUTER_STEP_TIME = 350;
export class ComputerTurnLoop {
  private timer: number | null = null;
  private generation = 0;
  private disposed = false;
  private queuedState: GameState | null = null;
  private queuedSpeed: BattleSpeed | null = null;
  constructor(private readonly controller: BattleController, private readonly scheduler: BattleScheduler) {}
  update(): void {
    if (this.disposed) return;
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
    }, COMPUTER_STEP_TIME * SPEED_SCALE[speed]);
  }
  private cancel(): void {
    this.generation++;
    if (this.timer !== null) this.scheduler.cancel(this.timer);
    this.timer = null; this.queuedState = null; this.queuedSpeed = null;
  }
  dispose(): void { this.disposed = true; this.cancel(); }
}
''')
change('src/ui/referenceBattleGame.ts','import { BattleController }','import { ComputerTurnLoop } from "./computerTurnLoop";\nimport { BattleController }')
change('src/ui/referenceBattleGame.ts','  private readonly controller:', '  private readonly computer: ComputerTurnLoop | null;\n  private readonly computerStatus = h("p", { id: "reference-computer-status", role: "status" });\n  private readonly controller:')
change('src/ui/referenceBattleGame.ts','onLoad: (options: GameOptions, state: GameState) => void)', 'onLoad: (options: GameOptions, state: GameState) => void, private readonly automatic = false)')
change('src/ui/referenceBattleGame.ts','    });\n    const threshold', '    }, next => !this.automatic || activePlayer(next)?.kind === "human" || next.phase === "human-loss");\n    this.computer = automatic ? new ComputerTurnLoop(this.controller, { schedule: (cb, delay) => window.setTimeout(cb, delay), cancel: id => window.clearTimeout(id) }) : null;\n    const threshold')
change('src/ui/referenceBattleGame.ts','this.friendly.el, this.victory.el);','this.friendly.el, this.victory.el, this.computerStatus);')
change('src/ui/referenceBattleGame.ts',' · Manual play · Seed',' · ${this.automatic ? "Computer play" : "Manual play"} · Seed')
change('src/ui/referenceBattleGame.ts','    this.files.dispose();','    this.computer?.dispose();\n    this.files.dispose();')
change('src/ui/referenceBattleGame.ts','    const blocked = running', '    const blocked = this.computerActive() || running')
change('src/ui/referenceBattleGame.ts','  private render(): void {','  private computerActive(): boolean {\n    const state = this.controller.state;\n    return this.automatic && activePlayer(state)?.kind === "computer" && state.phase !== "human-loss" && state.phase !== "finished";\n  }\n\n  private render(): void {')
change('src/ui/referenceBattleGame.ts','    this.victory.render(state, revision);','''    this.victory.render(state, revision);
    const computer = this.computerActive();
    this.computerStatus.hidden = !computer;
    this.computerStatus.textContent = computer ? `${activePlayer(state)!.name} is playing…` : "";
    if (computer) {
      for (const el of this.panel.el.querySelectorAll<HTMLButtonElement | HTMLInputElement>(".action button,.action input")) el.disabled = true;
      this.panel.el.querySelector(".hint")?.replaceChildren(document.createTextNode("Computer turn. Save, load or start a new game at any time."));
    }
    this.computer?.update();''')
change('src/ui/referenceGame.ts',' const legacy=new URLSearchParams(location.search).get("battle")==="legacy";', ''' const legacy=new URLSearchParams(location.search).get("battle")==="legacy";
 const manual=legacy||new URLSearchParams(location.search).get("control")==="manual";
 if(!manual){seats="4";controllers=["human","computer","computer","computer"];}''')
change('src/ui/referenceGame.ts','state,preferences,mountMatch);','state,preferences,mountMatch,!manual);')
change('src/ui/referenceGame.ts','"Development reference game for manual play on Nine Isles. Choose each seat’s controller; computer seats are driven manually here. The seed changes the deal."','manual?"Manual testing on Nine Isles. Computer seats are driven manually in this mode.":"Play on Nine Isles against three Normal computers, or choose each seat’s controller. The seed changes the deal."')
change('src/ui/referenceGame.ts','},"Human seats"),count', '},legacy?"Human seats":"Seats"),count')

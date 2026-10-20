import type {GameState} from '../core';
import type {BattleController, BattleView} from './battleController';
import type {CardControllerView} from './cardController';
import type {Rotation} from './mapCamera';

export interface WorkspaceHistoryPosition {
  scrollTop: number;
  followLatest: boolean;
}

/** Presentation data only; controllers retain live game and action authority. */
export interface WorkspaceState {
  /** World-space centre, zoom relative to Fit and the board's quarter turn (see mapCamera). */
  camera: {x: number; y: number; zoom: number; rotation: Rotation};
  surface: string | null;
  histories: {battle: WorkspaceHistoryPosition; events: WorkspaceHistoryPosition};
  drafts: {capture: string; move: string; threshold: string};
  focus: string | null;
  matchGeneration: number;
  attack: {from: string | null; to: string | null; confirmed: boolean};
}

export interface WorkspaceContext {
  matchGeneration: number;
  from: string | null;
  to: string | null;
}

export interface WorkspaceProjection extends WorkspaceContext {
  revision: number;
  mode: BattleView['mode'];
  phase: GameState['phase'];
  paused: boolean;
  speed: BattleView['speed'];
  cards: CardControllerView;
}

export function createWorkspaceState(): WorkspaceState {
  return {
    camera: {x: 0, y: 0, zoom: 1, rotation: 0},
    surface: null,
    histories: {
      battle: {scrollTop: 0, followLatest: true},
      events: {scrollTop: 0, followLatest: true},
    },
    drafts: {capture: '', move: '', threshold: ''},
    focus: null,
    matchGeneration: 0,
    attack: {from: null, to: null, confirmed: false},
  };
}

/** Top-level replacement patch. Draft text is retained without numeric parsing. */
export function updateWorkspaceState(state: WorkspaceState, patch: Partial<WorkspaceState>): WorkspaceState {
  const next = {...state, ...patch};
  return {
    camera: {x: next.camera.x, y: next.camera.y, zoom: next.camera.zoom, rotation: next.camera.rotation},
    surface: next.surface,
    histories: {
      battle: {scrollTop: next.histories.battle.scrollTop, followLatest: next.histories.battle.followLatest},
      events: {scrollTop: next.histories.events.scrollTop, followLatest: next.histories.events.followLatest},
    },
    drafts: {capture: next.drafts.capture, move: next.drafts.move, threshold: next.drafts.threshold},
    focus: next.focus,
    matchGeneration: next.matchGeneration,
    attack: {from: next.attack.from, to: next.attack.to, confirmed: next.attack.confirmed},
  };
}

export function reconcileWorkspace(state: WorkspaceState, context: WorkspaceContext): WorkspaceState {
  const sameMatch = state.matchGeneration === context.matchGeneration;
  const confirmed = sameMatch && context.from !== null && context.to !== null
    && state.attack.from === context.from && state.attack.to === context.to && state.attack.confirmed;
  return updateWorkspaceState(sameMatch ? state : createWorkspaceState(), {
    matchGeneration: context.matchGeneration,
    attack: {from: context.from, to: context.to, confirmed},
  });
}

/** Read only the published scalars and public card view; retain no live objects. */
export function projectWorkspace(battle: BattleController, cardsView: CardControllerView): WorkspaceProjection {
  const view = battle.view;
  return {
    matchGeneration: battle.gameGeneration,
    revision: view.revision,
    from: view.from,
    to: view.to,
    mode: view.mode,
    phase: view.state.phase,
    paused: battle.playbackPaused,
    speed: view.speed,
    cards: {
      revision: cardsView.revision,
      phase: cardsView.phase,
      hand: [...cardsView.hand],
      handCounts: {...cardsView.handCounts},
      drawCount: cardsView.drawCount,
      discardCount: cardsView.discardCount,
      discardTop: cardsView.discardTop,
      sets: cardsView.sets.map(set => ({
        indices: [set.indices[0], set.indices[1], set.indices[2]],
        kind: set.kind,
        effect: set.effect,
      })),
      selectedTarget: cardsView.selectedTarget,
      preview: cardsView.preview,
      notice: cardsView.notice,
      blocked: cardsView.blocked,
    },
  };
}

# T78 state boundary (main-authored acceptance design)

This is a UI-only foundation. Existing BattleController and CardController remain
owners of live game state, selection, playback and card decisions. Nothing is
mounted in the game or allowed to call an engine action in T78.

Freeze these exports from src/ui/workspaceState.ts:

- createWorkspaceState(): creates an independent state with camera {x:0,y:0,zoom:1},
  surface:null, histories {battle:{scrollTop:0,followLatest:true},
  events:{scrollTop:0,followLatest:true}}, drafts {capture:'',move:'',threshold:''},
  focus:null, matchGeneration:0, attack {from:null,to:null,confirmed:false}.
- updateWorkspaceState(state, patch): immutable top-level Partial patch, detaching
  nested input/output values. Numeric drafts stay strings, including invalid ones.
- reconcileWorkspace(state, {matchGeneration,from,to}): derives the staged pair
  from the controller; changing either endpoint invalidates confirmation. Match
  generation changes clear old match UI state to defaults before adopting the new
  generation/pair. Same-match layout/surface changes retain camera, scroll/follow,
  drafts and focus. A null endpoint cannot retain confirmation.
- projectWorkspace(battle, cardsView): fresh allowlisted projection containing
  matchGeneration, revision, from, to, mode, phase, paused (global playback), speed,
  and cards (all and only the public CardControllerView fields). The live
  controller is read-only authority; no core state, private hands, deck contents,
  engine callbacks or serialized match copies are retained. Public nested arrays,
  offered-set indices and hand-count dictionaries are detached from their inputs.

The staging/confirmation fields are inert presentation data for T82; setting them
never grants or executes an action. No controller/input/CSS/core/generator edits.
No DOM/browser contract or appearance claim is added by this foundation.

Tests use real versioned historical fixture replay for placement, combat, pending
capture, friendly movement, cards and result. Their whole core state/history/RNG
must remain identical across UI round trips. Frozen callers and private-card
access traps check mutation/visibility. Missing-module red uses an inherited
no-op adapter so failures concern observable state, not import errors. A retained
mock proves the acceptance surface is feasible; production implementation is the
subagent's work. Main owns this boundary and the frozen acceptance tests; report
any required amendment instead of weakening either.

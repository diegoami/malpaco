export * from "./types";
export { parseMap, province, neighbours, SCHEMA } from "./map";
export type { MapReadResult } from "./map";
export { DeterministicRng } from "./rng";
export type { DiceSource } from "./rng";
export { attackTargets, diceCount, pairResults, resolve, whyNot, DIE_SIDES } from "./combat";
export { apply, legalAttacks } from "./rules";
export { friendlyTargets, friendlySources, whyNotFriendlyMove } from "./movement";
export {
  activePlayer,
  armyCount,
  armyTotal,
  classicRules,
  captureChoiceRules,
  friendlyMoveRules,
  victoryRules,
  cloneState,
  livingPlayers,
  malpacoRules,
  newGame,
  newGameFromOptions,
  ownerOf,
  provincesOf,
} from "./state";
export { islandIncome, type IslandIncome } from "./bonuses";
export { reinforcementIncome, type ReinforcementIncome } from "./reinforcement";
export { createGame } from "./setup";
export {
  MAX_HUMAN_SHARE,
  MAX_STARTING_ARMIES,
  MIN_HUMAN_SHARE,
  MIN_STARTING_ARMIES,
  SAVE_FORMAT_VERSION,
  defaultOptions,
  validateGameOptions,
} from "./options";
export type {
  AnimationSpeed,
  EventFrequency,
  GameOptions,
  RoundLimit,
  StartingArmiesRange,
} from "./options";
export { OptionsError } from "./options";
export { SeatsError, MAX_SEATS, MIN_SEATS, computerCount, hasHuman, validateSeats } from "./seats";
export type { Difficulty, SeatKind, SeatSpec } from "./seats";
export { SaveFormatError, deserializeOptions, serializeOptions } from "./save";
export {
  generateBoard,
  MAX_BOARD_ATTEMPTS,
  MAX_LANES_PER_COUNTRY,
  MAX_ENTRANCES_BY_SIZE,
  MIN_ENTRANCES_PER_ISLAND,
  MAX_ISLAND_GRAPH_DEGREE,
} from "./board-gen";
export type { BoardGenResult } from "./board-gen";
export {
  checkBonusOutOfProportion,
  checkCrowdedCrossing,
  checkEasyBonusesConcentrated,
  checkFortress,
  checkRemoteOrHub,
  runAllFairnessChecks,
} from "./board-fairness";

export { MATCH_SAVE_VERSION, deserializeMatch, serializeMatch, REFERENCE_MATCH_IDENTITY, GEOGRAPHIC_MATCH_IDENTITY, deserializeVersionedMatch, serializeVersionedMatch } from "./match-save";
export type { MatchIdentity, LoadedVersionedMatch } from "./match-save";

export { computerAction } from "./computer";

export { createReferenceGame } from "./reference-game";

export { generateGeographicBoard, generateGeographicBoardWithRng } from "./geographic-board";
export type { GeographicBoardResult } from "./geographic-board";
export { createGeographicGame } from "./geographic-game";
export type { GeographicGameResult } from "./geographic-game";

export { cardsRules } from './state';
export {CARD_COMPOSITION,HAND_LIMIT,cardView} from './cards';
export type {CardKind,CardState,CardView} from './cards';
export {REFERENCE_CARD_MATCH_IDENTITY,GEOGRAPHIC_CARD_MATCH_IDENTITY} from './match-save';

export {tradeCardsRules} from './state';
export {classifyCardSet} from './cards';
export type {TradeableCardKind,PendingRaid} from './cards';
export {REFERENCE_TRADE_CARD_MATCH_IDENTITY,GEOGRAPHIC_TRADE_CARD_MATCH_IDENTITY} from './match-save';

export {raidCardsRules} from './state';
export {raidStackAfter} from './raid';
export {REFERENCE_RAID_CARD_MATCH_IDENTITY,GEOGRAPHIC_RAID_CARD_MATCH_IDENTITY} from './match-save';

export {computerView} from './computer-view';
export type {ComputerDecisionView,ComputerCountry,ComputerStrategicView,ComputerStrategyContext} from './computer-view';
export {decideComputerAction} from './computer';
export {evaluateComputerPosition} from './computer-position';
export type {ComputerPosition,CountryPosition,SeatPosition,IslandPosition,AdjacentOpponent} from './computer-position';
export {estimateCapturePath,CAPTURE_RISK_SCALE,CAPTURE_RISK_MAX_CELLS} from './computer-risk';
export type {CaptureRisk} from './computer-risk';
export {planAllocation,ALLOCATION_PARAMETERS} from './computer-allocation';
export type {AllocationDecision} from './computer-allocation';
export {planMovement,MOVEMENT_PARAMETERS} from './computer-positioning';
export type {MovementDecision} from './computer-positioning';
export {estimateAttackCampaign,CAMPAIGN_SCALE,CAMPAIGN_MAX_CELLS} from './computer-campaign';
export type {AttackCampaign,CampaignTerminal} from './computer-campaign';
export {planOffensive,OFFENSIVE_PARAMETERS} from './computer-offensive';
export type {OffensiveDecision} from './computer-offensive';
export {defenderIslandRules,defenderMatchIdentity,GEOGRAPHIC_DEFENDER_MATCH_IDENTITY,GEOGRAPHIC_V3_DEFENDER_MATCH_IDENTITY} from './combat-presets';
export {DEFENDER_OPTIONS_SAVE_VERSION} from './save';
export {decideTacticalAction} from './computer';

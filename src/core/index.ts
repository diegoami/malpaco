export * from "./types";
export { parseMap, province, neighbours, SCHEMA } from "./map";
export type { MapReadResult } from "./map";
export { DeterministicRng } from "./rng";
export type { DiceSource } from "./rng";
export { attackTargets, diceCount, pairResults, resolve, whyNot, DIE_SIDES } from "./combat";
export { apply, legalAttacks } from "./rules";
export {
  activePlayer,
  armyCount,
  armyTotal,
  classicRules,
  cloneState,
  livingPlayers,
  newGame,
  newGameFromOptions,
  ownerOf,
  provincesOf,
} from "./state";
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
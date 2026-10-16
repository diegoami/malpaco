// [designed] Owner accepted contract-proposal.md for the first iteration.
// Rules come from the pinned core/UI designs cited there; display/budget values
// are proposals, not measurements of the predecessor or proven generation rates.
export const parameters = Object.freeze({
  countryCount: 46, islandSizes: [3,3,3,3,5,5,7,7,10],
  degreeMin: 2, degreeMax: 5, crossingMin: 14, crossingMax: 18,
  islandDegreeMax: 4, islandDistanceMax: 4, countryCrossingMax: 2,
  viewportWidth: 800, viewportHeight: 540, panelHeight: 80,
  hitSize: 40, labelGap: 44, countTextMin: 14, contrastMin: 4.5,
  coordinateTolerance: 1e-6, areaTolerance: 1e-4, coastToleranceCss: 1,
  attemptsMax: 50, successTarget: 0.99,
});

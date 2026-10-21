import {generateGeographicBoardWithRng,nameGeographicMap} from './geographic-board';
import type {GeographicGenerator} from './geographic-board';
import {DeterministicRng} from './rng';
import {createGameWithRng} from './setup';
import {validateGameOptions} from './options';
import {victoryRules} from './state';
import type {GameOptions} from './options';
import type {GameState,RuleSet,RngSnapshot} from './types';
import type {IslandGeography,GeographyFailure} from './island-geography';

interface Metadata {attempts:number;failures:GeographyFailure[];rng:RngSnapshot}
export type GeographicGameResult =
 | ({ok:true;state:GameState;geography:IslandGeography}&Metadata)
 | ({ok:false;errors:string[]}&Metadata);

/** Existing modern rules/deal, on the same stream after accepted geography. */
export function createGeographicGame(options:GameOptions,rules:RuleSet=victoryRules(options),generationOptions:{attempts?:number}={},generator:GeographicGenerator=1):GeographicGameResult {
  const validated=validateGameOptions(options),rng=new DeterministicRng(validated.seed);
  const board=generateGeographicBoardWithRng(rng,generationOptions,generator);
  if(!board.ok)return {...board,errors:[
    `Geographic board generation exhausted its ${board.attempts}-attempt budget. Retry with another seed.`,
    ...board.failures.flatMap(f=>f.constraints),
  ]};
  const created=createGameWithRng(validated,rng,()=>({ok:true,map:nameGeographicMap(board.map,validated.names??'numbered',validated.seed)}),rules);
  const metadata={attempts:board.attempts,failures:board.failures,rng:rng.snapshot()};
  if(!created.ok)return {...created,...metadata};
  return {...created,...metadata,geography:board.geography};
}

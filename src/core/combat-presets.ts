import {validateGameOptions} from './options';
import type {GameOptions} from './options';
import {islandRules} from './state';
import type {RuleSet} from './types';
import type {MatchIdentity} from './match-save';
/** T142 owner-approved symmetric variant of the verified original tie advantage.
 * Economics,cards,events,gates,forfeit and setup remain the current island rules.
 * The old constructor/identity is immutable;only this explicit factory changes ties.
 */
export function defenderIslandRules(options:GameOptions):RuleSet {
 const o=validateGameOptions(options);if(o.combatPreset!=='defender-v1')throw Error('Defender preset must be explicit.');
 const {combatPreset:_preset,...legacy}=o,base=islandRules(legacy);
 return {...base,id:'island-defender-v1',combat:{...base.combat,ties:'defender'}};
}
const identity=(version:2|3):MatchIdentity=>Object.freeze({boardGenerator:Object.freeze({id:'geographic',version}),rules:Object.freeze({id:'island-defender',version:1}),actionSchemaVersion:5});
export const GEOGRAPHIC_DEFENDER_MATCH_IDENTITY=identity(2),GEOGRAPHIC_V3_DEFENDER_MATCH_IDENTITY=identity(3);
export function defenderMatchIdentity(version:2|3):MatchIdentity {if(version!==2&&version!==3)throw Error('Unsupported defender generator.');return version===2?GEOGRAPHIC_DEFENDER_MATCH_IDENTITY:GEOGRAPHIC_V3_DEFENDER_MATCH_IDENTITY;}

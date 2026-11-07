import {version} from '../../package.json';
import {h} from './dom';

/** Build metadata only; independent of match/save/rules versions. */
export function gameVersion():HTMLElement {
 return h('span',{id:'game-version',role:'note','aria-label':`Malpaco version ${version}`},`v${version}`);
}

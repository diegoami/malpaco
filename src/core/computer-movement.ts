import type {Action} from './types';
import type {ComputerDecisionView} from './computer-view';

/** [designed] T128/#320: inspected the prior one-hop policy and legal saved stalls.
 * Route the largest interior reserve toward the public front through owned regions.
 * One existing legal hop per turn; nearer destinations and IDs break equal ties.
 * No private state, stream draws, weights or changes to movement rules.
 */
export function reserveTransfer(view:ComputerDecisionView):Extract<Action,{kind:'friendlyMove'}>|null {
 const player=view.playerId;if(!player||!view.movePairs.length)return null;
 const countries=new Map(view.countries.map(country=>[country.id,country]));
 const frontier=view.countries.filter(country=>country.owner===player&&country.neighbours.some(id=>countries.get(id)?.owner!==player));
 const distance=new Map(frontier.map(country=>[country.id,0])),queue=frontier.map(country=>country.id);
 for(let index=0;index<queue.length;index++){
  const id=queue[index]!;
  for(const neighbour of countries.get(id)!.neighbours){
   if(countries.get(neighbour)?.owner===player&&!distance.has(neighbour)){
    distance.set(neighbour,distance.get(id)!+1);queue.push(neighbour);
   }
  }
 }
 const moves=view.movePairs.filter(move=>{
  const from=distance.get(move.from),to=distance.get(move.to);
  return from!==undefined&&from>0&&to!==undefined&&to===from-1;
 });
 moves.sort((a,b)=>countries.get(b.from)!.armies-countries.get(a.from)!.armies||distance.get(a.to)!-distance.get(b.to)!||
  (a.from<b.from?-1:a.from>b.from?1:a.to<b.to?-1:a.to>b.to?1:0));
 return moves[0]?{...moves[0]}:null;
}

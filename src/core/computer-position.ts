import type {ComputerCountry,ComputerStrategicView} from './computer-view';

/** Current public adjacency only: armies are not independent attack plans or odds. */
export interface AdjacentOpponent {
 readonly playerId:string;readonly sources:readonly string[];readonly armies:number;
}
export interface CountryPosition {
 readonly id:string;readonly owner:string;readonly armies:number;
 readonly frontier:boolean;readonly frontDistance:number|null;readonly movableArmies:number;
 readonly adjacentOpponents:readonly AdjacentOpponent[];
}
export interface IslandPosition {
 readonly id:string;readonly owned:number;readonly total:number;readonly bonus:number;
 readonly complete:boolean;readonly entrances:readonly string[];
}
export interface SeatPosition {
 readonly playerId:string;readonly countries:number;readonly armies:number;
 /** Formula components; income is zero when the rules do not award recurring income. */
 readonly baseIncome:number;readonly islandIncome:number;readonly income:number;
 readonly islands:readonly IslandPosition[];readonly frontierCount:number;readonly interiorMovableArmies:number;
 readonly adjacentOpponents:readonly AdjacentOpponent[];
}
export interface ComputerPosition {readonly countries:readonly CountryPosition[];readonly seats:readonly SeatPosition[]}

const compare=(a:string,b:string)=>a<b?-1:a>b?1:0;

/** Objective-free integer facts, T129/#339. No weights, inference or policy decisions.
 * A frontier is an owned country with a differently owned neighbor, as in T128.
 * Distances traverse only the same owner's countries; disconnected reserves stay null.
 * Source sets deduplicate adjacency before summing, including across an entire seat.
 */
export function evaluateComputerPosition(view:ComputerStrategicView):ComputerPosition {
 const byId=new Map(view.countries.map(c=>[c.id,c]));
 const countries=[...view.countries].sort((a,b)=>compare(a.id,b.id));
 const neighbors=(c:ComputerCountry)=>[...new Set(c.neighbours)].flatMap(id=>{
  const neighbor=byId.get(id);return neighbor?[neighbor]:[];
 });
 const frontier=new Set(countries.filter(c=>neighbors(c).some(n=>n.owner!==c.owner)).map(c=>c.id));
 const distance=new Map([...frontier].map(id=>[id,0]));
 const queue=[...frontier];
 for(let i=0;i<queue.length;i++){
  const id=queue[i]!,country=byId.get(id)!;
  for(const neighbor of neighbors(country))if(neighbor.owner===country.owner&&!distance.has(neighbor.id)){
   distance.set(neighbor.id,distance.get(id)!+1);queue.push(neighbor.id);
  }
 }
 function adjacentOpponents(owned:readonly ComputerCountry[],playerId:string):AdjacentOpponent[]{
  const sources=new Map<string,ComputerCountry>();
  for(const country of owned)for(const neighbor of neighbors(country))if(neighbor.owner!==playerId)sources.set(neighbor.id,neighbor);
  return [...new Set([...sources.values()].map(c=>c.owner))].sort(compare).map(opponent=>{
   const stacks=[...sources.values()].filter(c=>c.owner===opponent).sort((a,b)=>compare(a.id,b.id));
   return {playerId:opponent,sources:stacks.map(c=>c.id),armies:stacks.reduce((sum,c)=>sum+c.armies,0)};
  });
 }
 const facts=countries.map(c=>({id:c.id,owner:c.owner,armies:c.armies,frontier:frontier.has(c.id),
  frontDistance:distance.get(c.id)??null,movableArmies:Math.max(0,c.armies-1),adjacentOpponents:adjacentOpponents([c],c.owner)}));
 const islands=[...view.strategy.islands].sort((a,b)=>compare(a.id,b.id));
 const seats=[...new Set(view.strategy.turnOrder)].sort(compare).map(playerId=>{
  const owned=countries.filter(c=>c.owner===playerId);
  const progress=islands.map(island=>{
   const ids=new Set(island.provinces),count=[...ids].filter(id=>byId.get(id)?.owner===playerId).length;
   return {id:island.id,owned:count,total:ids.size,bonus:island.bonus,complete:ids.size>0&&count===ids.size,
    entrances:[...ids].filter(id=>{const c=byId.get(id);return c&&neighbors(c).some(n=>!ids.has(n.id));}).sort(compare)};
  });
  // Existing engine formula (reinforcement.ts/bonuses.ts), not a strategic weight.
  const baseIncome=Math.max(2,Math.floor(owned.length/view.strategy.reinforcementDivisor));
  const islandIncome=progress.filter(i=>i.complete).reduce((sum,i)=>sum+i.bonus,0);
  return {playerId,countries:owned.length,armies:owned.reduce((sum,c)=>sum+c.armies,0),baseIncome,islandIncome,
   income:view.strategy.turnSequence==='reinforcement'?baseIncome+islandIncome:0,islands:progress,
   frontierCount:owned.filter(c=>frontier.has(c.id)).length,
   interiorMovableArmies:owned.filter(c=>!frontier.has(c.id)).reduce((sum,c)=>sum+Math.max(0,c.armies-1),0),
   adjacentOpponents:adjacentOpponents(owned,playerId)};
 });
 return {countries:facts,seats};
}

// T100: the scoreboard's records: one row per game id, the 20-row cap, the totals and win rate,
// and a corrupt record read as an empty scoreboard.
import {describe,expect,it,test} from 'vitest';
import {RECENT_GAMES,addGame,emptyScoreboard,parseScoreboard,played,recordGame,rulesKey,totalsLine,winRate} from '../../src/ui/scoreboard';
import type {GameOutcome,ScoreRow,ScoreStore} from '../../src/ui/scoreboard';

const row=(n:number,result:GameOutcome='won'):ScoreRow=>({id:`game-${n}`,date:`2026-10-${String(1+n%28).padStart(2,'0')}T12:00:00.000Z`,result,rounds:10+n,countries:n%46,seed:1000+n});
const memory=(text:string|null=null):ScoreStore&{text:string|null}=>{const store={text,get:()=>store.text,set:(t:string|null)=>{store.text=t;}};return store;};

describe('recording',()=>{
 it('adds a finished game first and changes its total by one',()=>{
  let board=recordGame(emptyScoreboard(),row(1,'won'));board=recordGame(board,row(2,'gave-up'));board=recordGame(board,row(3,'lost'));
  expect(board.recent.map(r=>r.id)).toEqual(['game-3','game-2','game-1']);
  expect(board.totals).toEqual({won:1,lost:1,gaveUp:1});expect(played(board.totals)).toBe(3);
  expect(board.recent[0]).toEqual(row(3,'lost'));
 });
 it('records a game id once, however often its end is seen',()=>{
  const once=recordGame(emptyScoreboard(),row(7,'lost'));
  expect(recordGame(once,row(7,'lost'))).toBe(once);
  // A watched game that a computer later wins is the same game: it stays Lost.
  expect(recordGame(once,{...row(7),result:'won'})).toBe(once);
  const store=memory();addGame(store,row(7,'lost'));const text=store.text;addGame(store,row(7,'lost'));
  expect(store.text).toBe(text);expect(parseScoreboard(store.text).recent).toHaveLength(1);
 });
 it('remembers recorded ids after their rows leave the list',()=>{
  let board=emptyScoreboard();for(let n=0;n<RECENT_GAMES+5;n++)board=recordGame(board,row(n));
  expect(board.recent.some(r=>r.id==='game-0')).toBe(false);
  expect(recordGame(board,row(0))).toBe(board);
 });
});

describe('the 20-row cap',()=>{
 it('keeps the last 20 games, newest first; a 21st drops the oldest, and the totals keep counting',()=>{
  let board=emptyScoreboard();for(let n=1;n<=20;n++)board=recordGame(board,row(n,n%2?'won':'lost'));
  expect(board.recent).toHaveLength(20);expect(board.recent.at(-1)!.id).toBe('game-1');
  board=recordGame(board,row(21,'gave-up'));
  expect(board.recent).toHaveLength(20);expect(board.recent[0]!.id).toBe('game-21');expect(board.recent.at(-1)!.id).toBe('game-2');
  expect(board.totals).toEqual({won:10,lost:10,gaveUp:1});
 });
 it('reads at most 20 rows back from a longer record',()=>{
  const text=JSON.stringify({version:1,totals:{won:25,lost:0,gaveUp:0},recent:Array.from({length:25},(_,n)=>row(n)),ids:[]});
  expect(parseScoreboard(text).recent).toHaveLength(20);
 });
});

describe('totals and win rate',()=>{
 it('names the result card line and the win rate as a whole percentage',()=>{
  expect(totalsLine({won:3,lost:2,gaveUp:1})).toBe('Won 3 · Lost 2 · Gave up 1');
  expect(winRate({won:0,lost:0,gaveUp:0})).toBeNull();
  expect(winRate({won:3,lost:2,gaveUp:1})).toBe(50);
  expect(winRate({won:1,lost:2,gaveUp:0})).toBe(33);
  expect(winRate({won:2,lost:1,gaveUp:0})).toBe(67);
  expect(winRate({won:4,lost:0,gaveUp:0})).toBe(100);
 });
});

describe('the kept text',()=>{
 it('round-trips, and a corrupt or foreign record reads as an empty scoreboard',()=>{
  const board=recordGame(recordGame(emptyScoreboard(),row(1)),row(2,'gave-up'));
  expect(parseScoreboard(JSON.stringify(board))).toEqual(board);
  for(const text of [null,'','{not json','null','[]','{"version":3,"totals":{"won":1,"lost":0,"gaveUp":0},"recent":[],"ids":[]}',
   '{"version":1,"totals":{"won":-1,"lost":0,"gaveUp":0},"recent":[],"ids":[]}',
   '{"version":1,"totals":{"won":1,"lost":0,"gaveUp":0},"recent":[{"id":"x","result":"draw"}],"ids":[]}',
   '{"version":1,"totals":{"won":1,"lost":0,"gaveUp":0},"recent":[],"ids":[3]}'])
   expect(parseScoreboard(text)).toEqual(emptyScoreboard());
  const store=memory('{broken');addGame(store,row(5,'won'));
  expect(parseScoreboard(store.text)).toEqual(recordGame(emptyScoreboard(),row(5,'won')));
 });
});
test('old totals remain in an explicit earlier group while new rules get separate deduplicated totals',()=>{
 const old=parseScoreboard(JSON.stringify({version:1,totals:{won:2,lost:1,gaveUp:0},recent:[],ids:['old']}));
 expect(old).toMatchObject({version:2,totals:{won:2,lost:1,gaveUp:0},byRules:{earlier:{won:2,lost:1,gaveUp:0}}});
 const row={id:'new-defender',date:'2026-10-25',result:'won' as const,rounds:4,countries:35,seed:11,rules:{id:'island-defender',version:1}};
 const next=recordGame(old,row);expect(next.byRules['defender']).toEqual({won:1,lost:0,gaveUp:0});expect(next.totals).toEqual({won:3,lost:1,gaveUp:0});expect(recordGame(next,row)).toBe(next);
 expect(parseScoreboard(JSON.stringify(next))).toEqual(next);
});
test('damaged rule subtotals preserve valid totals,old rows and ids in the earlier group',()=>{
 const board=parseScoreboard(JSON.stringify({version:2,totals:{won:3,lost:1,gaveUp:2},byRules:{defender:{won:99,lost:0,gaveUp:0}},recent:[row(1)],ids:['kept']}));
 expect(board.totals).toEqual({won:3,lost:1,gaveUp:2});expect(board.byRules).toEqual({earlier:{won:3,lost:1,gaveUp:2}});expect(board.recent).toEqual([row(1)]);expect(board.ids).toEqual(['kept']);
});

describe('known configurable Legacy results',()=>{
 const config={id:'configurable-cards',version:1};
 it('classifies only the supported exact configurable identity as Legacy',()=>{
  expect(rulesKey(config)).toBe('legacy');
  for(const rules of [undefined,{id:'configurable-cards',version:2},{id:'unknown',version:1}])expect(rulesKey(rules)).toBe('earlier');
  const next=recordGame(emptyScoreboard(),{...row(1),rules:config});
  expect(next.byRules['legacy']).toEqual({won:1,lost:0,gaveUp:0});expect(next.recent[0]).toMatchObject({legacyClassified:true});
  expect(parseScoreboard(JSON.stringify(next))).toEqual(next);
 });
 it('moves only attributable retained outcomes, preserving unknown older totals and every id',()=>{
  const recent=[{...row(1),rules:config},{...row(2,'lost'),rules:config},{...row(3,'gave-up'),rules:config},row(4)];
  const old={version:2,totals:{won:12,lost:8,gaveUp:4},byRules:{earlier:{won:10,lost:8,gaveUp:3},defender:{won:2,lost:0,gaveUp:1}},recent,ids:['older',...recent.map(r=>r.id)]};
  const migrated=parseScoreboard(JSON.stringify(old));
  expect(migrated.byRules).toEqual({earlier:{won:9,lost:7,gaveUp:2},defender:{won:2,lost:0,gaveUp:1},legacy:{won:1,lost:1,gaveUp:1}});
  expect(migrated.totals).toEqual(old.totals);expect(migrated.ids).toEqual(old.ids);expect(migrated.recent.map(r=>r.id)).toEqual(recent.map(r=>r.id));
  expect(migrated.recent.slice(0,3)).toEqual(recent.slice(0,3).map(r=>({...r,legacyClassified:true})));expect(migrated.recent[3]).toEqual(recent[3]);
  expect(parseScoreboard(JSON.stringify(migrated))).toEqual(migrated);
  expect(recordGame(migrated,{...row(1),rules:config})).toBe(migrated);
 });
 it('does not transfer an already marked row again when older readers retain its unknown fields',()=>{
  const prior=parseScoreboard(JSON.stringify({version:1,totals:{won:10,lost:0,gaveUp:0},recent:[],ids:['older']}));
  const recorded=recordGame(prior,{...row(1),rules:config});
  expect(recorded.byRules).toEqual({earlier:{won:10,lost:0,gaveUp:0},legacy:{won:1,lost:0,gaveUp:0}});
  expect(parseScoreboard(JSON.stringify(recorded)).byRules).toEqual(recorded.byRules);
 });
 it('never infers a rule group from a seed or malformed metadata',()=>{
  for(const rules of [null,{id:'configurable-cards',version:'1'},{id:'configurable-cards',version:0}]){
   const old={version:2,totals:{won:2,lost:0,gaveUp:0},byRules:{earlier:{won:2,lost:0,gaveUp:0}},recent:[{...row(1),seed:11,rules},{...row(2),rules:config}],ids:['game-1','game-2']};
   const parsed=parseScoreboard(JSON.stringify(old));expect(parsed.byRules).toEqual({earlier:{won:1,lost:0,gaveUp:0},legacy:{won:1,lost:0,gaveUp:0}});expect(parsed.recent[0]!.rules).toBeUndefined();
  }
 });
 it('leaves unknown metadata and unretained outcomes alone and never subtracts below zero',()=>{
  const rows=[{...row(1),rules:config},...Array.from({length:19},(_,n)=>({...row(n+2),rules:{id:'unknown',version:1}})),{...row(22),rules:config}];
  const old={version:2,totals:{won:25,lost:0,gaveUp:0},byRules:{earlier:{won:25,lost:0,gaveUp:0}},recent:rows,ids:rows.map(r=>r.id)};
  const parsed=parseScoreboard(JSON.stringify(old));expect(parsed.recent).toHaveLength(20);expect(parsed.byRules['earlier']!.won).toBe(24);expect(parsed.byRules['legacy']!.won).toBe(1);expect(parsed.ids).toEqual(old.ids);
  const missing=parseScoreboard(JSON.stringify({...old,totals:{won:0,lost:0,gaveUp:0},byRules:{earlier:{won:0,lost:0,gaveUp:0}},recent:[rows[0]]}));
  expect(missing.byRules['earlier']!.won).toBe(0);expect(missing.totals.won).toBe(0);
 });
});

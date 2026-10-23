import {expect,test} from 'vitest';
import {defaultNextGameSettings,parseNextGameSettings,readNextGameSettings,saveNextGameSettings,saveReplenishmentSettings,saveMapSizeSettings,nextGameOptions} from '../../src/ui/nextGameSettings';
import type {NextGameStore,ComputerOpponents} from '../../src/ui/nextGameSettings';
import {validateGameOptions} from '../../src/core/options';
for(const count of [1,2,3] as const)test(`versioned settings select exactly ${count} Normal computers`,()=>{
 const settings=parseNextGameSettings(JSON.stringify({version:1,computerOpponents:count}));
 expect(settings).toEqual({version:3,mapSize:46,computerOpponents:count,reinforcementDivisor:3});
 const options=nextGameOptions(123,settings);expect(validateGameOptions(options)).toEqual(options);
 expect(options.seed).toBe(123);expect(options.seats.map(s=>s.kind)).toEqual(['human',...Array(count).fill('computer')]);
 expect(options.computerStrengths).toEqual(Array(count).fill('Normal'));
});
for(const value of [null,'{','null','[]','{}','{"version":2,"computerOpponents":1}','{"version":1,"computerOpponents":0}','{"version":1,"computerOpponents":4}','{"version":1,"computerOpponents":"1"}'])test(`invalid preferences keep the existing default: ${value}`,()=>{
 expect(parseNextGameSettings(value)).toEqual(defaultNextGameSettings());
});
test('saving changes only the settings store; invalid values and write failure retain the previous record',()=>{
 let text='{"version":1,"computerOpponents":2}';const store:NextGameStore={get:()=>text,set:value=>{text=value;}};
 expect(saveNextGameSettings(1,store)).toBe(true);expect(readNextGameSettings(store).computerOpponents).toBe(1);
 const before=text;for(const invalid of [0,4,1.5,'2',null]){expect(saveNextGameSettings(invalid,store)).toBe(false);expect(text).toBe(before);}
 const full:NextGameStore={get:()=>text,set:()=>{throw Error('quota');}};
 expect(saveNextGameSettings(3,full)).toBe(false);expect(text).toBe(before);
 expect(readNextGameSettings({get:()=>{throw Error('unavailable');},set:()=>{}})).toEqual(defaultNextGameSettings());
});
test('constructing new-game options leaves the preference and earlier match options unchanged',()=>{
 const preference={version:3 as const,mapSize:46 as const,computerOpponents:2 as ComputerOpponents,reinforcementDivisor:3 as const};Object.freeze(preference);
 const old=nextGameOptions(7,defaultNextGameSettings()),snapshot=JSON.stringify(old);
 const fresh=nextGameOptions(8,preference);expect(fresh.seats).toHaveLength(3);expect(JSON.stringify(old)).toBe(snapshot);
 expect(preference).toEqual({version:3,mapSize:46,computerOpponents:2,reinforcementDivisor:3});
});

for(const rate of [1,3,5,7] as const)test(`rate ${rate} persists independently from opponent choice`,()=>{
 let text='{"version":1,"computerOpponents":2}';const store:NextGameStore={get:()=>text,set:v=>{text=v;}};
 expect(saveReplenishmentSettings(rate,store)).toBe(true);expect(readNextGameSettings(store)).toEqual({version:3,mapSize:46,computerOpponents:2,reinforcementDivisor:rate});
 expect(saveNextGameSettings(1,store)).toBe(true);expect(readNextGameSettings(store)).toEqual({version:3,mapSize:46,computerOpponents:1,reinforcementDivisor:rate});
 expect(nextGameOptions(7,readNextGameSettings(store)).reinforcementDivisor).toBe(rate);
 const before=text;expect(saveReplenishmentSettings(2,store)).toBe(false);expect(text).toBe(before);
 expect(saveReplenishmentSettings(3,{get:()=>text,set:()=>{throw Error('quota');}})).toBe(false);expect(text).toBe(before);
});

for(const size of [46,72,96] as const)test(`map size ${size} migrates v2 and preserves both other choices`,()=>{
 let text=JSON.stringify({version:2,computerOpponents:2,reinforcementDivisor:5});const store:NextGameStore={get:()=>text,set:v=>{text=v;}};
 expect(readNextGameSettings(store)).toEqual({version:3,computerOpponents:2,reinforcementDivisor:5,mapSize:46});
 expect(saveMapSizeSettings(size,store)).toBe(true);expect(saveNextGameSettings(1,store)).toBe(true);expect(saveReplenishmentSettings(7,store)).toBe(true);
 expect(readNextGameSettings(store)).toEqual({version:3,computerOpponents:1,reinforcementDivisor:7,mapSize:size});
 const options=nextGameOptions(7,readNextGameSettings(store));expect(options.regionCount).toBe(size===46?undefined:size);expect(options.names).toBe(size===46?'seed':'numbered');
 const before=text;for(const invalid of [0,47,'72',null])expect(saveMapSizeSettings(invalid,store)).toBe(false);
 expect(saveMapSizeSettings(72,{get:()=>text,set:()=>{throw Error('quota');}})).toBe(false);expect(text).toBe(before);
});

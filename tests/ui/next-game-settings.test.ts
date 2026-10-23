import {expect,test} from 'vitest';
import {defaultNextGameSettings,parseNextGameSettings,readNextGameSettings,saveNextGameSettings,nextGameOptions} from '../../src/ui/nextGameSettings';
import type {NextGameStore,ComputerOpponents} from '../../src/ui/nextGameSettings';
import {validateGameOptions} from '../../src/core/options';
for(const count of [1,2,3] as const)test(`versioned settings select exactly ${count} Normal computers`,()=>{
 const settings=parseNextGameSettings(JSON.stringify({version:1,computerOpponents:count}));
 expect(settings).toEqual({version:1,computerOpponents:count});
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
 const preference={version:1 as const,computerOpponents:2 as ComputerOpponents};Object.freeze(preference);
 const old=nextGameOptions(7,defaultNextGameSettings()),snapshot=JSON.stringify(old);
 const fresh=nextGameOptions(8,preference);expect(fresh.seats).toHaveLength(3);expect(JSON.stringify(old)).toBe(snapshot);
 expect(preference).toEqual({version:1,computerOpponents:2});
});

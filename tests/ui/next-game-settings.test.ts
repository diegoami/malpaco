import {expect,test} from 'vitest';
import {defaultNextGameSettings,parseNextGameSettings,readNextGameSettings,saveNextGameSettings,saveStartingArmySettings,saveEventFrequencySettings,nextGameOptions} from '../../src/ui/nextGameSettings';
import type {NextGameStore} from '../../src/ui/nextGameSettings';
import {validateGameOptions} from '../../src/core/options';
for(const version of [1,2,3])for(const count of [1,2,3] as const)test(`v${version} migrates ${count} opponents and drops obsolete rate only from future preferences`,()=>{
 const old={version,computerOpponents:count,reinforcementDivisor:7,mapSize:46},text=JSON.stringify(old),settings=parseNextGameSettings(text);expect(settings).toEqual({...defaultNextGameSettings(),computerOpponents:count});expect(JSON.stringify(old)).toBe(text);
 const o=nextGameOptions(7,settings);expect(validateGameOptions(o)).toEqual(o);expect(o.seats).toHaveLength(count+1);expect(o.computerStrengths).toEqual(Array(count).fill('Normal'));expect(o.islandRules).toBe(1);expect(Object.hasOwn(o,'reinforcementDivisor')).toBe(false);
});
for(const range of ['1-2','1-3','1-4'] as const)for(const frequency of ['Off','Rare','Normal','Often'] as const)test(`${range} / ${frequency} remains independent from opponent edits`,()=>{
 let text=JSON.stringify({version:2,computerOpponents:2,reinforcementDivisor:1});const store:NextGameStore={get:()=>text,set:v=>{text=v;}};
 expect(saveStartingArmySettings(range,store)).toBe(true);expect(saveEventFrequencySettings(frequency,store)).toBe(true);expect(saveNextGameSettings(1,store)).toBe(true);expect(readNextGameSettings(store)).toEqual({version:4,computerOpponents:1,startingArmiesRange:range,eventFrequency:frequency});
 const o=nextGameOptions(8,readNextGameSettings(store));expect(o.startingArmiesRange).toBe(range);expect(o.eventFrequency).toBe(frequency);expect(o.seats).toHaveLength(2);
 const before=text;for(const v of [null,'1-5',3,''])expect(saveStartingArmySettings(v,store)).toBe(false);for(const v of [null,'Never',0])expect(saveEventFrequencySettings(v,store)).toBe(false);for(const v of [0,4,'2'])expect(saveNextGameSettings(v,store)).toBe(false);expect(text).toBe(before);
 const full:NextGameStore={get:()=>text,set:()=>{throw Error('quota');}};expect(saveStartingArmySettings('1-4',full)).toBe(false);expect(saveEventFrequencySettings('Off',full)).toBe(false);expect(saveNextGameSettings(3,full)).toBe(false);expect(text).toBe(before);
});
for(const text of [null,'{','[]','{}','{"version":4,"computerOpponents":2}','{"version":5,"computerOpponents":2}','{"version":1,"computerOpponents":4}'])test(`invalid preferences retain defaults: ${text}`,()=>expect(parseNextGameSettings(text)).toEqual(defaultNextGameSettings()));
test('new options snapshot never changes earlier options or a frozen preference',()=>{
 const preference=Object.freeze({...defaultNextGameSettings(),startingArmiesRange:'1-4' as const}),old=nextGameOptions(7),before=JSON.stringify(old);expect(nextGameOptions(8,preference).startingArmiesRange).toBe('1-4');expect(JSON.stringify(old)).toBe(before);expect(readNextGameSettings({get:()=>{throw Error('blocked');},set:()=>{}})).toEqual(defaultNextGameSettings());
});

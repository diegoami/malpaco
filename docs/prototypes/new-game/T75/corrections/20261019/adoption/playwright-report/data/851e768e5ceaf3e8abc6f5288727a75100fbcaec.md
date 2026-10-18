# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: compact-panels.spec.ts >> geographic: computer phase changes keep actual card bounds stable
- Location: tests/e2e/compact-panels.spec.ts:40:2

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - heading "New geographic game" [level=1] [ref=e4]
  - paragraph [ref=e5]: Play on generated islands against three Normal computers, or choose each seat’s controller. The seed fixes geography, deal and dice. Cards are enabled with zero or one human seat. Games with two or more human seats play without cards.
  - generic [ref=e6]: Seed
  - spinbutton "Seed" [ref=e7]: "1994"
  - generic [ref=e8]: Seats
  - combobox "Seats" [ref=e9]:
    - option "2"
    - option "3"
    - option "4" [selected]
  - generic [ref=e10]:
    - generic [ref=e11]:
      - generic [ref=e12]: Seat 1 control
      - combobox "Seat 1 control" [ref=e13]:
        - option "Human" [selected]
        - option "Computer"
    - generic [ref=e14]:
      - generic [ref=e15]: Seat 2 control
      - combobox "Seat 2 control" [ref=e16]:
        - option "Human"
        - option "Computer" [selected]
    - generic [ref=e17]:
      - generic [ref=e18]: Seat 3 control
      - combobox "Seat 3 control" [ref=e19]:
        - option "Human"
        - option "Computer" [selected]
    - generic [ref=e20]:
      - generic [ref=e21]: Seat 4 control
      - combobox "Seat 4 control" [ref=e22]:
        - option "Human"
        - option "Computer" [selected]
  - generic [ref=e23]:
    - generic [ref=e24]:
      - checkbox "Domination win" [checked] [ref=e25]
      - generic [ref=e26]: Domination win
    - generic [ref=e27]:
      - generic [ref=e28]: Round limit
      - combobox "Round limit" [ref=e29]:
        - option "Off" [selected]
        - option "20 rounds"
        - option "30 rounds"
        - option "40 rounds"
  - button "Start game" [ref=e30] [cursor=pointer]
  - alert
  - generic [ref=e31]:
    - generic [ref=e32]:
      - generic [ref=e33]: Load game
      - button "Load game" [ref=e34]
    - status [ref=e35]: Loading game…
```

# Test source

```ts
  1   | import {pinned} from '../core/versioned-match-fixture';
  2   | import {expect,test} from '@playwright/test';
  3   | import type {Page} from '@playwright/test';
  4   | import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
  5   | import {join} from 'node:path';
  6   | import {apply,computerAction,deserializeVersionedMatch} from '../../src/core';
  7   | import type {Action} from '../../src/core';
  8   | const fixtures='docs/prototypes/new-game/T71/fixtures';
  9   | const input=(host:string,label:string)=>readFileSync(join(fixtures,`${host}-${label}.json`),'utf8');
  10  | const categories=['reinforcement','selection-ready','exchange','repeated-pair','capture-movement','friendly-movement'];
  11  | const mode=(p:Page)=>p.getByRole('combobox',{name:'Panel detail',exact:true});
  12  | async function begin(p:Page,host:string){
  13  |  await p.clock.install({time:new Date('2026-10-18T12:00:00Z')});await p.clock.pauseAt(new Date('2026-10-18T12:00:00Z'));
  14  |  await p.goto(host==='reference'?'/?view=reference-game':'/');
  15  |  await p.evaluate(()=>{const create=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{Reflect.set(window,'compactPanelSave',blob);return create(blob);};});
  16  | }
  17  | async function save(p:Page){await p.getByRole('button',{name:'Save game',exact:true}).click();return p.evaluate(()=>(Reflect.get(window,'compactPanelSave') as Blob).text());}
  18  | async function load(p:Page,text:string){
  19  |  const previous=await p.getByLabel('Load game',{exact:true}).elementHandle();
  20  |  await p.getByLabel('Load game',{exact:true}).setInputFiles({name:'panels.json',mimeType:'application/json',buffer:Buffer.from(text)});
> 21  |  await expect.poll(()=>previous!.evaluate(el=>el.isConnected)).toBe(false);await expect(p.locator('[data-country]')).toHaveCount(46);
      |                                                                ^ Error: expect(received).toBe(expected) // Object.is equality
  22  | }
  23  | async function bounds(p:Page){return p.locator('.battle-reference').evaluate(root=>{
  24  |  const selectors=['.topbar','.board','.panel','.panel>.turn','.panel>.action','.panel>.log-card'];
  25  |  return Object.fromEntries(selectors.map(selector=>{const r=root.querySelector(selector)!.getBoundingClientRect();return [selector,{x:r.x,y:r.y,width:r.width,height:r.height}];}));
  26  | });}
  27  | function stable(actual:Awaited<ReturnType<typeof bounds>>,anchor:Awaited<ReturnType<typeof bounds>>){
  28  |  for(const selector of Object.keys(anchor))for(const axis of ['x','y','width','height'] as const)expect(Math.abs(actual[selector]![axis]-anchor[selector]![axis]),`${selector} ${axis}`).toBeLessThanOrEqual(1);
  29  | }
  30  | async function essentials(p:Page){
  31  |  for(const locator of [mode(p),p.locator('#game-pause-button'),p.locator('#game-speed'),p.getByRole('button',{name:'Game event log',exact:true}),...await p.getByTestId('player-army-total').all()]){
  32  |   await expect(locator).toBeVisible();expect(await locator.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1;})).toBe(true);
  33  |  }
  34  |  expect(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  35  | }
  36  | function evidence(info:{project:{name:string}},host:string,label:string){const dir=process.env['COMPACT_PANEL_EVIDENCE_DIR']??'screenshots/compact-panels';mkdirSync(dir,{recursive:true});return join(dir,`${info.project.name}-${host}-${label}`);}
  37  | test.use({video:'on'});
  38  | for(const host of ['reference','geographic']){
  39  |  // Separate baseline geometry check still runs when the mode control is absent.
  40  |  test(`${host}: computer phase changes keep actual card bounds stable`,async({page},info)=>{
  41  |   await begin(page,host);let anchor:Awaited<ReturnType<typeof bounds>>|undefined;const samples=[];
  42  |   for(const label of categories){
  43  |    await load(page,input(host,label));const before=await bounds(page);anchor??=before;samples.push({label,before});
  44  |    stable(before,anchor);await page.clock.runFor(350);stable(await bounds(page),anchor);
  45  |   }
  46  |   writeFileSync(evidence(info,host,'geometry')+'.json',JSON.stringify(samples,null,2));
  47  |  });
  48  |  for(const detail of ['compact','detailed'])test(`${host} ${detail}: real computer actions retain fixed panel areas and essentials`,async({page},info)=>{
  49  |   await begin(page,host);let anchor:Awaited<ReturnType<typeof bounds>>|undefined;const samples=[];
  50  |   for(const label of categories){
  51  |    const text=input(host,label);await load(page,text);await expect(mode(page)).toBeVisible({timeout:1000});await mode(page).selectOption(detail);await expect(page.locator('.battle-reference')).toHaveAttribute('data-panel-detail',detail);
  52  |    await page.locator('#game-speed').selectOption('normal');const before=deserializeVersionedMatch(await save(page));expect(before.identity.boardGenerator.id).toBe(host==='reference'?'fixed-reference':'geographic');
  53  |    const action=computerAction(before.state);expect(action).not.toBeNull();const result=apply(before.state,action!);if(!result.ok)throw Error(result.error);
  54  |    const initial=await bounds(page);anchor??=initial;stable(initial,anchor);await essentials(page);
  55  |    await page.clock.runFor(350);expect(deserializeVersionedMatch(await save(page)).state).toEqual(result.state);const after=await bounds(page);stable(after,anchor);await essentials(page);
  56  |    const dice=page.locator('.battle-rolls');if(await dice.count()){if(detail==='compact')await expect(dice).toBeHidden();else if(result.state.log.some(e=>e.event==='attack'))await expect(dice).toBeVisible();}
  57  |    samples.push({label,action,before:initial,after});await page.screenshot({path:evidence(info,host,detail+'-'+label)+'.png'});
  58  |   }
  59  |   writeFileSync(evidence(info,host,detail+'-bounds')+'.json',JSON.stringify(samples,null,2));
  60  |  });
  61  |  test(`${host}: default/reversible keyboard mode preserves pause, speed, log, load and next callback`,async({page})=>{
  62  |   await begin(page,host);await load(page,input(host,'capture-movement'));await expect(mode(page)).toHaveValue('compact',{timeout:1000});
  63  |   await page.locator('#game-pause-button').click();await page.locator('#game-speed').selectOption('very-slow');const frozen=await save(page);
  64  |   await mode(page).focus();await mode(page).press('End');await expect(mode(page)).toHaveValue('detailed');expect(await save(page)).toBe(frozen);
  65  |   await page.getByRole('button',{name:'Game event log',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');
  66  |   await mode(page).selectOption('compact');await mode(page).selectOption('detailed');await expect(page.locator('#game-pause-button')).toHaveText('Resume');await expect(page.locator('#game-speed')).toHaveValue('very-slow');
  67  |   await page.clock.runFor(10000);expect(await save(page)).toBe(frozen);await essentials(page);
  68  |   await page.locator('#game-pause-button').click();await page.clock.runFor(1999);expect(await save(page)).toBe(frozen);await page.clock.runFor(1);
  69  |   const before=deserializeVersionedMatch(frozen),a=computerAction(before.state)!,r=apply(before.state,a);if(!r.ok)throw Error(r.error);expect(deserializeVersionedMatch(await save(page)).state).toEqual(r.state);
  70  |   await load(page,input(host,'reinforcement'));await expect(mode(page)).toHaveValue('detailed');await expect(page.locator('#game-speed')).toHaveValue('very-slow');await mode(page).selectOption('compact');await expect(mode(page)).toHaveValue('compact',{timeout:1000});
  71  |  });
  72  |  for(const detail of ['compact','detailed'])test(`${host} ${detail}: mandatory human capture and friendly movement remain visible and operable`,async({page},info)=>{
  73  |   await begin(page,host);
  74  |   function human(label:string){const v=JSON.parse(input(host,label));v.options.seats=v.options.seats.map(()=>({kind:'human'}));v.options.computerStrengths=[];const text=JSON.stringify(v);expect(()=>deserializeVersionedMatch(text)).not.toThrow();return text;}
  75  |   await load(page,human('capture-movement'));await expect(mode(page)).toBeVisible({timeout:1000});await mode(page).selectOption(detail);const before=deserializeVersionedMatch(await save(page));expect(before.state.phase).toBe('capture');
  76  |   for(const id of ['capture-amount','confirm-capture-button']){await expect(page.locator('#'+id)).toBeVisible();await expect(page.locator('#'+id)).toBeEnabled();expect(await page.locator('#'+id).evaluate(el=>{const a=el.closest('.action')!.getBoundingClientRect(),r=el.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom+1;}),id+' stays inside action card').toBe(true);}
  77  |   await essentials(page);await page.screenshot({path:evidence(info,host,detail+'-human-capture')+'.png'});await page.locator('#confirm-capture-button').click();expect(deserializeVersionedMatch(await save(page)).state.history.at(-1)!.kind).toBe('captureMove');
  78  |   await load(page,human('friendly-movement'));const moving=deserializeVersionedMatch(await save(page)),trace=JSON.parse(readFileSync(join(fixtures,'fixture-discovery.json'),'utf8')).results.find((x:{host:string})=>x.host===host),action=trace.found['friendly-movement'].action as Extract<Action,{kind:'friendlyMove'}>;
  79  |   await page.locator('#start-friendly-move-button').click();await page.locator(`[data-country="${action.from}"]`).click();await page.locator(`[data-country="${action.to}"]`).click();
  80  |   for(const id of ['friendly-move-amount','confirm-friendly-move-button','cancel-friendly-move-button','skip-friendly-move-button']){await expect(page.locator('#'+id)).toBeVisible();await expect(page.locator('#'+id)).toBeEnabled();expect(await page.locator('#'+id).evaluate(el=>{const a=el.closest('.action')!.getBoundingClientRect(),r=el.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom+1;}),id+' stays inside action card').toBe(true);}
  81  |   await essentials(page);await page.screenshot({path:evidence(info,host,detail+'-human-move')+'.png'});await page.locator('#friendly-move-amount').fill('1');await page.locator('#confirm-friendly-move-button').click();
  82  |   const expected=apply(moving.state,{...action,amount:1});if(!expected.ok)throw Error(expected.error);expect(deserializeVersionedMatch(await save(page)).state).toEqual(expected.state);
  83  |  });
  84  | }
  85  | 
  86  | for(const detail of ['compact','detailed'])test(`reference ${detail}: human-loss choices fit and remain usable`,async({page},info)=>{
  87  |  await begin(page,'reference');await load(page,pinned('human-loss').text);await expect(mode(page)).toBeVisible({timeout:1000});await mode(page).selectOption(detail);
  88  |  for(const id of ['watch-computers-button','stop-game-button']){const el=page.locator('#'+id);await expect(el).toBeVisible();await expect(el).toBeEnabled();expect(await el.evaluate(node=>{const a=node.closest('.action')!.getBoundingClientRect(),r=node.getBoundingClientRect();return r.top>=a.top&&r.bottom<=a.bottom+1&&r.right<=innerWidth&&r.bottom<=innerHeight;})).toBe(true);}
  89  |  await essentials(page);await page.screenshot({path:evidence(info,'reference',detail+'-human-loss')+'.png'});const previous=deserializeVersionedMatch(await save(page)).state;
  90  |  await page.locator('#stop-game-button').click();const result=apply(previous,{kind:'stopGame'});if(!result.ok)throw Error(result.error);expect(deserializeVersionedMatch(await save(page)).state).toEqual(result.state);
  91  |  await load(page,pinned('human-loss').text);await page.locator('#watch-computers-button').click();expect(deserializeVersionedMatch(await save(page)).state.watchingComputers).toBe(true);
  92  | });
  93  | 
  94  | for(const host of ['reference','geographic'])test(`${host}: complete battle history scrolls without deleting entries or moving an older reader`,async({page},info)=>{
  95  |  await begin(page,host);
  96  |  for(const detail of ['compact','detailed']){
  97  |   await load(page,input(host,'friendly-movement'));await mode(page).selectOption(detail);
  98  |   let state=deserializeVersionedMatch(await save(page)).state;const log=page.getByRole('list',{name:'Battle log',exact:true}),rows=log.locator('li');
  99  |   const events=state.log.filter(e=>e.event!=='game_started');expect(events.length).toBeGreaterThan(7);await expect(rows).toHaveCount(events.length);
  100 |   const oldTexts=await rows.allTextContents();const first=events[0]!;
  101 |   if(first.event==='attack'){expect(oldTexts[0]).toContain(state.map.provinces.find(p=>p.id===first.from)!.name);expect(oldTexts[0]).toContain(state.map.provinces.find(p=>p.id===first.to)!.name);}
  102 |   const geometry=await bounds(page);expect(await log.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true);
  103 |   await log.evaluate(el=>{el.scrollTop=0;});await expect(rows.first()).toBeInViewport();
  104 |   await log.evaluate(el=>{el.scrollTop=el.scrollHeight;});
  105 |   const action=computerAction(state)!;expect(action.kind).toBe('friendlyMove');const result=apply(state,action);if(!result.ok)throw Error(result.error);state=result.state;await page.clock.runFor(350);
  106 |   await expect(rows).toHaveCount(state.log.filter(e=>e.event!=='game_started').length);expect((await rows.allTextContents()).slice(0,oldTexts.length)).toEqual(oldTexts);
  107 |   expect(await log.evaluate(el=>{const top=el.scrollTop;el.scrollTop=el.scrollHeight;const maximum=el.scrollTop;el.scrollTop=top;return top===maximum;})).toBe(true);stable(await bounds(page),geometry);
  108 |   await log.evaluate(el=>{el.scrollTop=Math.min(48,el.scrollHeight-el.clientHeight);});const reading=await log.evaluate(el=>el.scrollTop),beforeLength=state.log.length;
  109 |   await mode(page).selectOption(detail==='compact'?'detailed':'compact');expect(await log.evaluate(el=>el.scrollTop)).toBe(reading);await mode(page).selectOption(detail);
  110 |   for(let n=0;n<20&&state.log.length===beforeLength;n++){const a=computerAction(state);expect(a).not.toBeNull();const r=apply(state,a!);if(!r.ok)throw Error(r.error);state=r.state;await page.clock.runFor(350);}
  111 |   expect(state.log.length).toBeGreaterThan(beforeLength);await expect(rows).toHaveCount(state.log.filter(e=>e.event!=='game_started').length);expect(await log.evaluate(el=>el.scrollTop)).toBe(reading);expect((await rows.allTextContents()).slice(0,oldTexts.length)).toEqual(oldTexts);stable(await bounds(page),geometry);
  112 |   await page.screenshot({path:evidence(info,host,detail+'-complete-history-scrolled')+'.png'});
  113 |   await load(page,input(host,'reinforcement'));await expect(page.getByRole('list',{name:'Battle log',exact:true}).locator('li')).toHaveCount(0);
  114 |  }
  115 | });
  116 | 
```
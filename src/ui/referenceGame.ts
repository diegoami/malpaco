// Default playable interface on the approved fixed geography; ordinary apply actions only.
import {victoryRules,defaultOptions} from "../core";
import {createReferenceGame} from "../core/reference-game";
import {referenceMap} from "./referenceData";
import {ReferenceMapView} from "./referenceMapView";
import {App} from "./app";
import {h} from "./dom";
import {ReferenceBattleGame} from "./referenceBattleGame";
import type {BattlePreferences} from "./referenceBattleGame";
import type {GameOptions,GameState} from "../core";
import {ReferenceMatchFiles} from "./referenceMatchFiles";
export function mountReferenceGame(root:HTMLElement){
 let seed=new URLSearchParams(location.search).get("seed")??"1994",seats="2";
 let controllers:("human"|"computer")[]=["human","human","human","human"];
 let dominationWin=true,roundLimit:20|30|40|null=null;
 const legacy=new URLSearchParams(location.search).get("battle")==="legacy";
 const manual=legacy||new URLSearchParams(location.search).get("control")==="manual";
 if(!manual){seats="4";controllers=["human","computer","computer","computer"];}
 const preferences:BattlePreferences={threshold:2,speed:"normal"};
 let current:App|ReferenceBattleGame|null=null;
 let setupFiles:ReferenceMatchFiles|null=null;
 const dispose=()=>{setupFiles?.dispose();setupFiles=null;current?.dispose();current=null;};
 const mountMatch=(options:GameOptions,state:GameState)=>{
  const app=legacy
   ?new App(referenceMap,options.seed,()=>setup(),state,(map,handlers)=>new ReferenceMapView(map,handlers))
   :new ReferenceBattleGame(referenceMap,options,()=>setup(),state,preferences,mountMatch,!manual);
  dispose();
  seed=String(options.seed);seats=String(options.seats.length);
  controllers=Array.from({length:4},(_,i)=>options.seats[i]?.kind??"human");
  dominationWin=options.dominationWin;roundLimit=options.roundLimit;
  root.id="reference-game";root.className="reference-game-root";root.dataset["seats"]=seats;
  current=app;app.mount(root);
  if(legacy)root.querySelector(".subtitle")!.textContent=`Nine Isles · ${seats} human seats · Seed ${seed}`;
 };
 const setup=()=>{
  dispose();
  root.id="reference-setup";root.className="reference-setup";
  const input=h("input",{id:"reference-seed",type:"number",min:"0",max:"4294967295",required:"",value:seed});
  const count=h("select",{id:"reference-seats"},...[2,3,4].map(n=>h("option",{value:String(n)},String(n))));count.value=seats;
  const controllerFields=h("div",{class:"reference-controller-fields"});
  const drawControllers=()=>controllerFields.replaceChildren(...Array.from({length:Number(count.value)},(_,i)=>{
   const id=`reference-control-${i+1}`,select=h("select",{id},h("option",{value:"human"},"Human"),h("option",{value:"computer"},"Computer"));
   select.value=controllers[i]!;select.onchange=()=>{controllers[i]=select.value as "human"|"computer";};
   return h("div",{},h("label",{for:id},`Seat ${i+1} control`),select);
  }));
  count.onchange=drawControllers;drawControllers();
  const domination=h("input",{type:"checkbox",id:"reference-domination"});domination.checked=dominationWin;
  const limit=h("select",{id:"reference-round-limit"},h("option",{value:"off"},"Off"),...[20,30,40].map(n=>h("option",{value:String(n)},`${n} rounds`)));limit.value=String(roundLimit??"off");
  const victoryOptions=h("div",{class:"reference-victory-options"},h("div",{class:"reference-domination"},domination,h("label",{for:"reference-domination"},"Domination win")),h("div",{},h("label",{for:"reference-round-limit"},"Round limit"),limit));
  const alert=h("p",{role:"alert"});
  const form=h("form",{class:"card setup-card"},h("h1",{},"New reference game"),h("p",{},legacy?"Play on the Nine Isles map. The seed changes the deal.":manual?"Manual testing on Nine Isles. Computer seats are driven manually in this mode.":"Play on Nine Isles against three Normal computers, or choose each seat’s controller. The seed changes the deal."),h("label",{for:"reference-seed"},"Seed"),input,h("label",{for:"reference-seats"},legacy?"Human seats":"Seats"),count,...(legacy?[]:[controllerFields,victoryOptions]),h("button",{type:"submit",class:"primary"},"Start game"),alert);
  if(!legacy)form.classList.add("victory-setup");
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;seed=input.value;seats=count.value;
   try{dominationWin=domination.checked;roundLimit=limit.value==="off"?null:Number(limit.value) as 20|30|40;
    const kinds=Array.from({length:Number(seats)},(_,i)=>legacy?"human" as const:controllers[i]!);
    const options={...defaultOptions(),seed:Number(seed),seats:kinds.map(kind=>({kind})),computerStrengths:kinds.filter(kind=>kind==="computer").map(()=>"Normal" as const),dominationWin,roundLimit};const result=createReferenceGame(referenceMap,options,legacy?undefined:victoryRules(options));if(!result.ok){alert.textContent=result.errors.join("; ");return;}
    mountMatch(options,result.state);
   }catch(error){alert.textContent=error instanceof Error?error.message:String(error);}
  };if(!legacy){setupFiles=new ReferenceMatchFiles(mountMatch);form.append(setupFiles.el);}root.replaceChildren(form);
 };setup();
}

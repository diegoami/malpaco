// Explicit development route for the approved fixed geography; ordinary apply actions only.
import {victoryRules,defaultOptions} from "../core";
import {createReferenceGame} from "../core/reference-game";
import {referenceMap} from "./referenceData";
import {ReferenceMapView} from "./referenceMapView";
import {App} from "./app";
import {h} from "./dom";
import {ReferenceBattleGame} from "./referenceBattleGame";
import type {BattlePreferences} from "./referenceBattleGame";
export function mountReferenceGame(root:HTMLElement){
 let seed=new URLSearchParams(location.search).get("seed")??"1994",seats="2";
 let controllers:("human"|"computer")[]=["human","human","human","human"];
 let dominationWin=true,roundLimit:20|30|40|null=null;
 const legacy=new URLSearchParams(location.search).get("battle")==="legacy";
 const preferences:BattlePreferences={threshold:2,speed:"normal"};
 const setup=()=>{
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
  const form=h("form",{class:"card setup-card"},h("h1",{},"New reference game"),h("p",{},legacy?"Play on the Nine Isles map. The seed changes the deal.":"Development reference game for manual play on Nine Isles. Choose each seat’s controller; computer seats are driven manually here. The seed changes the deal."),h("label",{for:"reference-seed"},"Seed"),input,h("label",{for:"reference-seats"},"Human seats"),count,...(legacy?[]:[controllerFields,victoryOptions]),h("button",{type:"submit",class:"primary"},"Start game"),alert);
  if(!legacy)form.classList.add("victory-setup");
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;seed=input.value;seats=count.value;
   try{dominationWin=domination.checked;roundLimit=limit.value==="off"?null:Number(limit.value) as 20|30|40;
    const kinds=Array.from({length:Number(seats)},(_,i)=>legacy?"human" as const:controllers[i]!);
    const options={...defaultOptions(),seed:Number(seed),seats:kinds.map(kind=>({kind})),computerStrengths:kinds.filter(kind=>kind==="computer").map(()=>"Normal" as const),dominationWin,roundLimit};const result=createReferenceGame(referenceMap,options,legacy?undefined:victoryRules(options));if(!result.ok){alert.textContent=result.errors.join("; ");return;}
    root.id="reference-game";root.className="reference-game-root";root.dataset["seats"]=seats;
    const app=legacy?new App(referenceMap,options.seed,()=>{app.dispose();setup();},result.state,(map,handlers)=>new ReferenceMapView(map,handlers)):new ReferenceBattleGame(referenceMap,options.seed,()=>{app.dispose();setup();},result.state,preferences);app.mount(root);
    const humans=kinds.filter(kind=>kind==="human").length,computers=kinds.length-humans;
    root.querySelector(".subtitle")!.textContent=computers?`Nine Isles · ${humans} human / ${computers} computer seats · Manual play · Seed ${seed}`:`Nine Isles · ${seats} human seats · Seed ${seed}`;
   }catch(error){alert.textContent=error instanceof Error?error.message:String(error);}
  };root.replaceChildren(form);
 };setup();
}

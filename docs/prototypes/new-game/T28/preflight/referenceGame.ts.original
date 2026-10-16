// Explicit development route for the approved fixed geography; ordinary apply actions only.
import {defaultOptions} from "../core";
import {createReferenceGame} from "../core/reference-game";
import {referenceMap} from "./referenceData";
import {ReferenceMapView} from "./referenceMapView";
import {App} from "./app";
import {h} from "./dom";
export function mountReferenceGame(root:HTMLElement){
 let seed=new URLSearchParams(location.search).get("seed")??"1994",seats="2";
 const setup=()=>{
  root.id="reference-setup";root.className="reference-setup";
  const input=h("input",{id:"reference-seed",type:"number",min:"0",max:"4294967295",required:"",value:seed});
  const count=h("select",{id:"reference-seats"},...[2,3,4].map(n=>h("option",{value:String(n)},String(n))));count.value=seats;
  const alert=h("p",{role:"alert"});
  const form=h("form",{class:"card setup-card"},h("h1",{},"New reference game"),h("p",{},"Play on the Nine Isles map. The seed changes the deal."),h("label",{for:"reference-seed"},"Seed"),input,h("label",{for:"reference-seats"},"Human seats"),count,h("button",{type:"submit",class:"primary"},"Start game"),alert);
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;seed=input.value;seats=count.value;
   try{const options={...defaultOptions(),seed:Number(seed),seats:Array.from({length:Number(seats)},()=>({kind:"human" as const})),computerStrengths:[]};const result=createReferenceGame(referenceMap,options);if(!result.ok){alert.textContent=result.errors.join("; ");return;}
    root.id="reference-game";root.className="reference-game-root";root.dataset["seats"]=seats;const app=new App(referenceMap,options.seed,()=>{app.dispose();setup();},result.state,(map,handlers)=>new ReferenceMapView(map,handlers));app.mount(root);
    root.querySelector(".subtitle")!.textContent=`Nine Isles · ${seats} human seats · Seed ${seed}`;
   }catch(error){alert.textContent=error instanceof Error?error.message:String(error);}
  };root.replaceChildren(form);
 };setup();
}

/** Player action presentation. Data symbols on the map/cards are not commands. */
const labels:Readonly<Record<string,string>>={
 'open-hand':'Cards','map-fit':'Fit','map-focus':'Focus','open-countries':'Regions',
 'close-game-drawer':'Close','close-hand':'Close','close-result-card':'Close','close-game-help':'Close',
 'scoreboard-button':'Scores','game-log-button':'History','open-required-action':'Review',
 'capture-less-button':'Less','capture-more-button':'More','confirm-capture-button':'Confirm',
 'friendly-move-less-button':'Less','friendly-move-more-button':'More','confirm-friendly-move-button':'Confirm','cancel-friendly-move-button':'Cancel',
 'start-friendly-move-button':'Move','start-combat-button':'Attack','end-turn-button':'End turn',
 'fold-world-event':'Fold','resume-turn-button':'Resume',
};
export function textCommands(root:HTMLElement):()=>void {
 const decorate=(button:HTMLButtonElement)=>{
  button.classList.add('game-text-command');
  const svgs=[...button.querySelectorAll('svg,img')],before=button.textContent?.trim()??'',name=button.getAttribute('aria-label')??button.title??before;
  if(button.id==='open-hand'){
   if(svgs.length){svgs.forEach(n=>n.remove());button.prepend(document.createTextNode('Cards '));}return;
  }
  const caption=(button.classList.contains('country-inspect')?'Inspect':labels[button.id])??(before&&!/^[×+−–-]$/.test(before)?before:/close/i.test(name)?'Close':/fold/i.test(name)?'Fold':name);
  if(!button.hasAttribute('aria-label')&&name)button.setAttribute('aria-label',name);
  svgs.forEach(n=>n.remove());
  if(caption&&button.textContent?.trim()!==caption){
   const span=button.querySelector('.card-icon-caption');
   if(span){span.textContent=caption;}else button.textContent=caption;
  }
 };
 const scan=(node:Node,buttons:Set<HTMLButtonElement>)=>{
  const el=node instanceof Element?node:node.parentElement;if(!el)return;
  const parent=el.closest('button');if(parent)buttons.add(parent);
  for(const b of el.querySelectorAll('button'))buttons.add(b);
 };
 const initial=new Set<HTMLButtonElement>();scan(root,initial);initial.forEach(decorate);
 const observer=new MutationObserver(records=>{
  const buttons=new Set<HTMLButtonElement>();
  for(const record of records){const el=record.target instanceof Element?record.target:record.target.parentElement;const button=el?.closest('button');if(button)buttons.add(button);for(const node of record.addedNodes)scan(node,buttons);}
  buttons.forEach(decorate);
 });
 observer.observe(root,{childList:true,subtree:true,characterData:true});return()=>observer.disconnect();
}

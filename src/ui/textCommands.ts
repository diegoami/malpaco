/** Player action presentation. Data symbols on the map/cards are not commands. */
const labels:Readonly<Record<string,string>>={
 'open-hand':'Cards','map-fit':'Fit','map-focus':'Focus','open-countries':'Countries',
 'close-game-drawer':'Close','close-hand':'Close','close-result-card':'Map','close-game-help':'Close',
 'scoreboard-button':'Scoreboard','game-log-button':'Event log','open-required-action':'Return','open-changes':'Changes',
 'capture-less-button':'Fewer','capture-more-button':'More','confirm-capture-button':'Confirm',
 'friendly-move-less-button':'Fewer','friendly-move-more-button':'More','confirm-friendly-move-button':'Move','cancel-friendly-move-button':'Cancel',
 'start-friendly-move-button':'Move','start-combat-button':'Combat','end-turn-button':'End turn',
 'fold-world-event':'Fold','resume-turn-button':'Resume',
};
const iconTools=new Set(['province-move-button','map-fit','map-focus','open-countries','scoreboard-button','game-log-button','open-required-action','capture-min-button','capture-max-button','capture-less-button','capture-more-button','confirm-capture-button','friendly-move-min-button','friendly-move-max-button','friendly-move-less-button','friendly-move-more-button','confirm-friendly-move-button','cancel-friendly-move-button']);
const closeTools=new Set(['fold-card','fold-world-event','close-game-drawer','close-hand','close-game-help','close-next-game-settings','close-scoreboard','close-result-card']);
export function textCommands(root:HTMLElement):()=>void {
 const decorate=(button:HTMLButtonElement)=>{
  if(button.id==='province-action-button'&&button.dataset['both']==='true'){button.classList.remove('game-text-command');button.classList.add('game-utility-command');return;}
  if(button.id==='game-help-button'){button.classList.remove('game-text-command');button.classList.add('game-utility-command','game-help-command');if(button.textContent!=='?')button.replaceChildren(document.createTextNode('?'));return;}
  if(closeTools.has(button.id)){
   button.classList.remove('game-text-command');button.classList.add('game-utility-command','game-close-command');
   if(button.textContent!=='×'||button.querySelector('svg'))button.replaceChildren(document.createTextNode('×'));return;
  }
  if(iconTools.has(button.id)||button.classList.contains('country-inspect')){button.classList.remove('game-text-command');button.classList.add('game-utility-command');return;}
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

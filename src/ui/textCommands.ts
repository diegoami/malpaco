import {glyph} from './icons';
/** Player action presentation. Data symbols on the map/cards are not commands. */
const commandIcons:Readonly<Record<string,string>>={
 'start-game':'play','resume-game':'play','configure-new-game':'new-game','download-recovery-game':'files',
 'new-game-button':'new-game','open-game-menu':'settings','open-hand':'cards','start-friendly-move-button':'move',
 'end-turn-button':'flag','start-combat-button':'combat','resume-turn-button':'play','fast-forward-button':'fast-forward',
 'result-new-game-button':'new-game','give-up-new-game':'new-game','give-up-confirm':'stop','give-up-cancel':'play',
 'watch-computers-button':'watch','stop-game-button':'stop','result-standings-button':'standings',
 'result-details-button':'info','result-history-button':'history','result-files-button':'files',
 'unfold-card':'return','acknowledge-world-event':'confirm',
 'scoreboard-reset':'reset','scoreboard-reset-confirm':'clear','scoreboard-reset-cancel':'return',
};
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
 const media=typeof window.matchMedia==='function'?window.matchMedia('(max-width: 900px)'):null;
 const originals=new WeakMap<HTMLButtonElement,{node:SVGElement;version:number}>();
 const mobile=(button:HTMLButtonElement):boolean=>{
  const raw=button.querySelector<SVGElement>(':scope > svg:not(.mobile-command-symbol)');
  if(raw)originals.set(button,{node:raw.cloneNode(true) as SVGElement,version:(originals.get(button)?.version??0)+1});
  if(!media?.matches){button.classList.remove('game-mobile-command');return false;}
  if(button.matches('.country-row,.country-neighbour,.country-filter'))return false;
  const name=button.getAttribute('aria-label')||button.title||button.textContent?.trim()||'';
  const shape=button.id==='province-action-button'?(button.dataset['kind']==='move'?'move':'attack')
   :button.id==='game-pause-button'?(/resume/i.test(name)?'play':'pause')
   :commandIcons[button.id]??(name==='Skip cards'?'skip':name==='Continue'?'play':name==='Confirm army reduction'?'confirm':undefined);
  const original=originals.get(button);
  if(!shape&&!original)return false;
  if(button.closest('.card-choice-controls')&&!shape)return false;
  if(!button.hasAttribute('aria-label')&&name)button.setAttribute('aria-label',name);
  if(!button.title&&name)button.title=name;
  button.classList.remove('game-text-command');button.classList.add('game-mobile-command');
  const key=shape??`original-${original!.version}`,current=button.querySelector<SVGElement>(':scope > .mobile-command-symbol');
  if(!current||current.getAttribute('data-command-shape')!==key){
   for(const n of button.querySelectorAll(':scope > svg'))n.remove();
   const icon=shape?glyph(shape):original!.node.cloneNode(true) as SVGElement;
   icon.classList.add('mobile-command-symbol');icon.setAttribute('data-command-shape',key);button.prepend(icon);
  }
  return true;
 };
 const decorate=(button:HTMLButtonElement)=>{
  if(button.id==='province-action-button'&&button.dataset['both']==='true'){button.classList.remove('game-text-command','game-mobile-command');button.classList.add('game-utility-command');return;}
  if(button.id==='game-help-button'){button.classList.remove('game-text-command');button.classList.add('game-utility-command','game-help-command');if(button.textContent!=='?')button.replaceChildren(document.createTextNode('?'));return;}
  if(closeTools.has(button.id)){
   button.classList.remove('game-text-command');button.classList.add('game-utility-command','game-close-command');
   if(button.textContent!=='×'||button.querySelector('svg'))button.replaceChildren(document.createTextNode('×'));return;
  }
  if(iconTools.has(button.id)||button.classList.contains('country-inspect')){button.classList.remove('game-text-command');button.classList.add('game-utility-command');return;}
  if(mobile(button))return;
  button.classList.add('game-text-command');
  const svgs=[...button.querySelectorAll('svg,img')],before=button.textContent?.trim()??'',name=button.getAttribute('aria-label')??button.title??before;
  if(button.id==='open-hand'){
   if(svgs.length){svgs.forEach(n=>n.remove());if(!button.textContent?.trim().startsWith('Cards'))button.prepend(document.createTextNode('Cards '));}return;
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
 const resized=()=>{const buttons=new Set<HTMLButtonElement>();scan(root,buttons);buttons.forEach(decorate);};
 media?.addEventListener('change',resized);
 const observer=new MutationObserver(records=>{
  const buttons=new Set<HTMLButtonElement>();
  for(const record of records){const el=record.target instanceof Element?record.target:record.target.parentElement;const button=el?.closest('button');if(button)buttons.add(button);for(const node of record.addedNodes)scan(node,buttons);}
  buttons.forEach(decorate);
 });
 observer.observe(root,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','data-kind']});return()=>{observer.disconnect();media?.removeEventListener('change',resized);};
}

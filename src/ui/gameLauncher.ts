import {h} from './dom';
import {GameHelp} from './help';
import {NextGameSettingsDialog} from './nextGameSettings';
/** Entry presentation only. Creating the match belongs to the explicit Start callback. */
export class GameLauncher {
 readonly el=h('section',{id:'game-launcher',class:'card setup-card game-launcher'});
 private readonly settings=new NextGameSettingsDialog();
 private readonly help=new GameHelp();
 private readonly title=h('h2',{},'Settings');
 private readonly fields=h('div',{class:'game-settings'},this.settings.inlineContent());
 private readonly status=h('p',{role:'alert',class:'match-error'});
 private readonly start=h('button',{id:'start-game',type:'button',class:'primary'},'Start game');
 private readonly resume=h('button',{id:'resume-game',type:'button',class:'primary'},'Resume saved game');
 private readonly fresh=h('button',{id:'configure-new-game',type:'button'},'New game');
 private readonly recovery=h('button',{id:'download-recovery-game',type:'button',hidden:true},'Download saved data');
 constructor(hasSaved:boolean,actions:{start:()=>Promise<void>|void;resume:()=>Promise<void>|void;recovery:()=>void}){
  this.help.button.textContent='Help';this.help.button.classList.add('launcher-help');this.help.button.setAttribute('aria-label','Help');this.help.button.title='Help';document.body.append(this.help.dialog);
  this.start.onclick=()=>{void actions.start();};this.resume.onclick=()=>{void actions.resume();};this.fresh.onclick=()=>this.configure();this.recovery.onclick=actions.recovery;
  this.resume.hidden=!hasSaved;this.fields.hidden=hasSaved;this.start.hidden=hasSaved;this.fresh.hidden=!hasSaved;this.title.textContent=hasSaved?'Saved game':'Settings';this.el.dataset['mode']=hasSaved?'saved':'configure';
  this.el.append(h('header',{class:'game-launcher-head'},h('h1',{},'Malpaco'),this.help.button),this.title,this.fields,h('div',{class:'game-launcher-actions'},this.resume,this.fresh,this.start),this.status,this.recovery);
 }
 configure():void {this.fields.hidden=false;this.start.hidden=false;this.start.classList.add('primary');this.resume.classList.remove('primary');this.fresh.hidden=true;this.title.textContent='Next game settings';this.el.dataset['mode']='configure';this.settings.refresh();this.start.focus();}
 busy(value:boolean):void {for(const n of this.el.querySelectorAll<HTMLButtonElement|HTMLSelectElement>('button,select'))n.disabled=value;this.el.setAttribute('aria-busy',String(value));}
 error(message:string):void {this.busy(false);this.status.textContent=message;this.recovery.hidden=false;}
 dispose():void {this.settings.dispose();this.help.dispose();this.el.remove();}
}

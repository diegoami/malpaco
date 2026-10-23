/** T108: the Android activity supplies only lifecycle state and an explicit
 * resume acknowledgment. No files, paths, arbitrary commands or game actions.
 */
interface NativeLifecycle {
 isActive():boolean;
 requiresResume():boolean;
 acknowledgeResume():boolean;
}
function nativeLifecycle():NativeLifecycle|null {
 if(typeof window==='undefined')return null;
 const value=Reflect.get(window,'MalpacoHost') as Partial<NativeLifecycle>|undefined;
 return value&&typeof value.isActive==='function'&&typeof value.requiresResume==='function'&&typeof value.acknowledgeResume==='function'?value as NativeLifecycle:null;
}
export interface NativeGameBinding {acknowledgeResume():boolean;dispose():void}
export function connectNativeGame(background:()=>void,back:()=>boolean):NativeGameBinding|null {
 const host=nativeLifecycle();if(!host)return null;
 let disposed=false;
 const pause=()=>{if(!disposed)background();};
 const foreground=()=>{if(!disposed&&host.requiresResume())background();};
 const goBack=(event:Event)=>{
  if(disposed)return;
  const dialogs=[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')];
  const dialog=dialogs.at(-1);
  if(dialog){
   // Honor each dialog's existing cancellation contract: giving-up results,
   // for example, refuse cancellation rather than starting another game.
   if(dialog.dispatchEvent(new Event('cancel',{cancelable:true}))){dialog.close();event.preventDefault();}
  }else if(back())event.preventDefault();
 };
 window.addEventListener('malpaco:native-background',pause);
 window.addEventListener('malpaco:native-foreground',foreground);
 window.addEventListener('malpaco:native-back',goBack);
 if(!host.isActive()||host.requiresResume())background();
 return {
  acknowledgeResume:()=>!disposed&&host.isActive()&&host.acknowledgeResume(),
  dispose:()=>{disposed=true;window.removeEventListener('malpaco:native-background',pause);window.removeEventListener('malpaco:native-foreground',foreground);window.removeEventListener('malpaco:native-back',goBack);},
 };
}

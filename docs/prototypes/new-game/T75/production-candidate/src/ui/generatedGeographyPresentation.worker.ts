import {derivePresentation,DRAWING_VERSION,presentationKey} from './generatedGeographyPresentation';
import type {WorkerRequest,WorkerResponse} from './generatedGeographyPresentationService';
/** CPU work runs solely in this dedicated worker. Cancellation rejects subscribers in service;
 * synchronous flow cannot observe a cancel message until its current derivation completes. */
const scope=self as unknown as {onmessage:((event:MessageEvent<WorkerRequest>)=>void)|null;postMessage(message:WorkerResponse):void};
scope.onmessage=event=>{
 const r=event.data;if(r.kind==='cancel')return;
 try{if(r.version!==DRAWING_VERSION||r.key!==presentationKey(r.geometry))throw Error('Unsupported drawing version or content');const value=derivePresentation(r.geometry);scope.postMessage({kind:'success',id:r.id,key:r.key,version:DRAWING_VERSION,value});}
 catch(error){scope.postMessage({kind:'failure',id:r.id,key:r.key,version:r.version,message:error instanceof Error?error.message:String(error)});}
};

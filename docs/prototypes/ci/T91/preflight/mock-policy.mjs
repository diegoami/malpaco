export function classifyChanges(v){
 if(!v||v.eventName!=='pull_request'||v.complete!==true||!Array.isArray(v.files)||!v.files.length||v.changedFiles!==v.files.length)return 'full';
 return v.files.every(f=>f&&['added','modified'].includes(f.status)&&!('previous_filename'in f)&&typeof f.filename==='string'&&!f.filename.includes('\\')&&!f.filename.split('/').some(s=>!s||s==='.'||s==='..')&&(/^(README\.md|RUN-NOTES\.md|docs\/ci-development\.md)$/.test(f.filename)||/^docs\/tasks\/[^/]+\.md$/.test(f.filename)||/^docs\/plans\/(?:[^/]+\/)*[^/]+\.md$/.test(f.filename)))?'docs':'full';
}
export function gatePass(v){return !!(v&&v.classificationResult==='success'&&(v.mode==='docs'&&v.verificationResult==='skipped'||v.mode==='full'&&v.verificationResult==='success'));}

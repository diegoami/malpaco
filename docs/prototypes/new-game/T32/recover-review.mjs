// Recover a completed review whose literal header punctuation defeated extraction.
// No model call; retain the exact final and post it flagged through the existing harness.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const [sessionFile, briefFile, runner, output] = process.argv.slice(2);
const {readReview,accountDoneWhen}=await import(pathToFileURL(path.join(runner,'tools/harness/lib/chain.mjs')).href);
const {planPost,postComment}=await import(pathToFileURL(path.join(runner,'tools/harness/lib/post.mjs')).href);
const session=JSON.parse(fs.readFileSync(sessionFile,'utf8'));
if(session.info.id!=='ses_eb90b94cbffeHLnJlwUEYvgw3I'||session.info.model.id!=='MiniMax-M3')throw Error('Wrong completed review session');
const last=session.messages.at(-1);
if(last.info.role!=='assistant'||last.info.finish!=='stop')throw Error('Review is not complete');
const raw=last.parts.filter(p=>p.type==='text').map(p=>p.text).join('\n');
const expected=fs.readFileSync(briefFile,'utf8').split('\n')[0];
const actual=raw.split('\n').find(l=>l.startsWith('T32 review (MiniMax M3), PR #135 at '));
if(expected!==actual+'.')throw Error('Mismatch is not only the terminal period');
const original=readReview(raw,expected),recovered=readReview(raw,actual);
if(original.kind!=='none'||recovered.kind!=='ok'||recovered.verdict!=='approve')throw Error('Unexpected parser/verdict result');
const dw=accountDoneWhen(recovered.review,3);
if(Object.values(dw).some(a=>a.length))throw Error('Done-when accounting is incomplete');
const plan=planPost({read:{kind:'flagged',review:raw,note:'Recovered from the completed session after the final header omitted its requested terminal period. Exact original text follows; main session must read and assess before applying approval.'},header:expected,doneWhen:3,source:'tools/harness/review.mjs session recovery',signature:'mm-m3, via tools/harness/review.mjs (minimax/MiniMax-M3/thinking), session ses_eb90b94cbffeHLnJlwUEYvgw3I; recovered without another model run'});
const receipt={session:session.info.id,model:session.info.model,reviewedHead:'b38110183a310303b1f9357272870817f166a16a',expectedHeader:expected,actualHeader:actual,originalParserKind:original.kind,recoveredParserKind:recovered.kind,recoveredVerdict:recovered.verdict,doneWhen:dw,rawFinalSha256:createHash('sha256').update(raw).digest('hex'),durationSeconds:(session.info.time.updated-session.info.time.created)/1000,modelTokens:session.info.tokens,postedFlaggedForMainAssessment:true};
fs.writeFileSync(output,JSON.stringify(receipt,null,2)+'\n');
postComment({plan,pr:135,top:runner});
console.log(JSON.stringify(receipt,null,2));

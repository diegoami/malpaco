from pathlib import Path
import json,statistics,hashlib
p=Path(__file__).resolve().parent
r=json.loads((p/'results.json').read_text());rows=[]
for x in r['results']:
 at={e['event']:e['nativeTime'] for e in x['trace']['events']};z=at['file-text-start'];rows.append({'name':x['name'],'fileReadMs':at['file-text-end']-z,'readEndToWorkerPostMs':at['worker-post']-at['file-text-end'],'workerRoundTripMs':at['worker-reply']-at['worker-post'],'replyToMountMs':at['map-mounted']-at['worker-reply'],'fileToMountMs':at['map-mounted']-z,'loadToDetachCheckMs':next(c['end'] for c in x['checks'] if c['check']=='old-input-detached')-x['loadStart'],'checks':x['checks'],'clockStayedPaused':x['clockBefore']==x['clockAfter']})
baseline=[1959.5,1883.9];old=statistics.median(baseline);new=statistics.median(x['workerRoundTripMs'] for x in rows);improvement=(old-new)/old*100
value={'rows':rows,'actualLoadStartDifferenceMs':r['actualLoadStartDifferenceMs'],'baselineWorkerMs':baseline,'baselineMedianMs':old,'candidateMedianMs':new,'medianReductionPercent':improvement,'usefulBenefitAtLeast10Percent':improvement>=10,'singleHostSinglePairNotCausalProof':True,'allReadinessChecksPass':all(c['status']=='passed' for x in rows for c in x['checks'])}
(p/'timing-summary.json').write_text(json.dumps(value,indent=2)+'\n');print(json.dumps(value,indent=2))
print('candidateSHA256',hashlib.sha256((p/'candidate.ts').read_bytes()).hexdigest())

from pathlib import Path
import hashlib,json,sys
E=Path(__file__).resolve().parent
if len(sys.argv)>1: E=Path(sys.argv[1])
assessment=json.loads((E/'assessment.json').read_text())
assert set(assessment['attempts'])=={'attempt-1','attempt-2','attempt-3'}
assert assessment['model_trial_urls'] and assessment['review_findings_relayed'] is True
for name in assessment['attempts']:
 p=E/name
 receipt=json.loads((p/'receipt.json').read_text())
 assert receipt['model']=='claude-sonnet-5-5-high'
 assert receipt['reviewed_commit']=='7f1860dac78932629340c561e8fae4cfcdf44589'
 assert isinstance(receipt['exit_code'],int) and receipt['duration_seconds']>0
 for file,key in [('prompt.txt','prompt_sha256'),('output.jsonl','output_sha256')]:
  assert hashlib.sha256((p/file).read_bytes()).hexdigest()==receipt[key], (name,file)
 assert receipt['model'] in (p/'models.txt').read_text()
 events=[json.loads(x) for x in (p/'output.jsonl').read_text().splitlines() if x.strip()]
 results=[v['result'] for v in events if v.get('event')=='result']
 assert len(results)==1
 result=results[0]
 note=assessment['attempts'][name]
 assert note['conversation_id']==result['conversation_id']
 assert note['denied_actions']==result.get('denied_actions',[])
 if result.get('denied_actions'): assert note['accepted_review'] is False
 if note['accepted_review']:
  assert receipt['exit_code']==0 and result['status']=='SUCCESS'
  assert not result.get('denied_actions')
  assert all(x in result['response'] for x in ['DW1','DW2','DW3'])
 if 'settings_restored' in receipt and not receipt['settings_restored']:
  cleanup=json.loads((p/'settings-cleanup.json').read_text())
  assert cleanup['temporary_grants_removed'] is True and cleanup['other_settings_preserved'] is True
 assert note['parent_assessment']
print('T68 receipts, discovery, output hashes and parent assessments verified')

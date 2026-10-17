import json,sys
p=json.load(sys.stdin)
a=p.get('toolCall',{}).get('args',{})
allowed=['git rev-parse HEAD', 'git status --short', 'git diff --stat 9215373e6020472c60fe7708dcd58802c4e9dccf HEAD', 'git diff 9215373e6020472c60fe7708dcd58802c4e9dccf HEAD -- src tests', 'npx vitest run tests/core/island-geography.test.ts']
cmd=a.get('CommandLine','')
print(json.dumps({'decision':'allow' if cmd in allowed else 'deny','reason':'T68 exact-command review grant; no unrestricted terminal execution'}))

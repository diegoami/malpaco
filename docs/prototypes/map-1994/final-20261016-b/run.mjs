import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
const root = "docs/prototypes/map-1994/final-20261016-b";
const commands = [
 ["unit", "npm", ["test"]],
 ["build", "npm", ["run", "build"]],
];
const results = [];
for (const [name, command, args] of commands) {
 const result = spawnSync(command, args, {encoding:"utf8", maxBuffer:32*1024*1024});
 writeFileSync(`${root}/${name}.stdout.txt`, result.stdout ?? "", {flag:"wx"});
 writeFileSync(`${root}/${name}.stderr.txt`, result.stderr ?? "", {flag:"wx"});
 results.push({name, command:[command,...args], exitCode:result.status, signal:result.signal});
 console.log(`${name}: exit ${result.status}`);
}
const bytes=readFileSync("docs/prototypes/map-1994/preview.html");
writeFileSync(`${root}/results.json`, JSON.stringify({node:process.version, image:"mcr.microsoft.com/playwright:v1.63.0-noble", results, previewSha256:createHash("sha256").update(bytes).digest("hex")},null,2)+"\n", {flag:"wx"});
if (results.some(r=>r.exitCode!==0)) process.exit(1);

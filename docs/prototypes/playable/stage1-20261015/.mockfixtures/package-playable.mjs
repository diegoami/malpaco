import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const checkout = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const output = join(checkout, "release");
const packageDir = join(output, "malpaco-playable");
const archive = join(output, "malpaco-playable.tar.gz");

function command(name, args) {
  const result = spawnSync(name, args, { cwd: checkout, encoding: "utf8", stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${name} exited ${result.status}`);
}

async function walk(dir, prefix = "") {
  const files = [];
  for (const entry of await readdir(join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await walk(dir, rel));
    else if (entry.isFile()) files.push(rel);
    else throw new Error(`unsupported build output: ${rel}`);
  }
  return files.sort();
}

const built = spawnSync("npm", ["run", "build"], { cwd: checkout, encoding: "utf8", stdio: "inherit" });
if (built.error) throw built.error;
if (built.status !== 0) throw new Error(`npm run build exited ${built.status}`);

await rm(packageDir, { recursive: true, force: true });
await mkdir(packageDir, { recursive: true });
await cp(join(checkout, "dist"), packageDir, { recursive: true });
await cp(join(dirname(fileURLToPath(import.meta.url)), "serve.mjs"), join(packageDir, "serve.mjs"));
await cp(join(dirname(fileURLToPath(import.meta.url)), "PLAY.md"), join(packageDir, "PLAY.md"));
const commit = spawnSync("git", ["-c", `safe.directory=${checkout}`, "rev-parse", "HEAD"], { cwd: checkout, encoding: "utf8" });
if (commit.error) throw commit.error;
if (commit.status !== 0) throw new Error(`git rev-parse exited ${commit.status}: ${commit.stderr.trim()}`);
await writeFile(join(packageDir, "BUILD.json"), `${JSON.stringify({ schemaVersion: 1, sourceCommit: commit.stdout.trim(), minimumNode: 22 }, null, 2)}\n`);

const hashes = [];
for (const rel of await walk(packageDir)) {
  const bytes = await readFile(join(packageDir, rel));
  hashes.push(`${createHash("sha256").update(bytes).digest("hex")}  ${rel.split(sep).join("/")}`);
}
await writeFile(join(packageDir, "SHA256SUMS"), `${hashes.join("\n")}\n`);
await rm(archive, { force: true });
command("tar", ["-czf", archive, "-C", output, "malpaco-playable"]);
console.log(`created ${relative(checkout, archive)} (${hashes.length + 1} package files)`);

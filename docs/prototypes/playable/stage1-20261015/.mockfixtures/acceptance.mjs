import { createHash } from "node:crypto";
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, realpath } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const checkout = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const required = ["index.html", "serve.mjs", "PLAY.md", "BUILD.json", "SHA256SUMS"];
const archivePath = join(checkout, "release", "malpaco-playable.tar.gz");
const port = 4175;

function fail(message) {
  throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} exited ${result.status}\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  }
  return result.stdout ?? "";
}

async function allFiles(root, prefix = "") {
  const files = [];
  for (const entry of await readdir(join(root, prefix), { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) fail(`package contains symlink: ${rel}`);
    if (entry.isDirectory()) files.push(...await allFiles(root, rel));
    else if (entry.isFile()) files.push(rel);
    else fail(`package contains unsupported entry: ${rel}`);
  }
  return files.sort();
}

function localPath(value, fromPath = "/") {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("#") || /^(?:data|blob):/i.test(trimmed)) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) {
    fail(`external asset reference is not allowed: ${trimmed}`);
  }
  const url = new URL(trimmed, `http://127.0.0.1:${port}${fromPath}`);
  return url.pathname;
}

function references(filePath, content) {
  const found = new Set();
  const add = (value) => {
    const path = localPath(value, filePath);
    if (path) found.add(path);
  };
  if (filePath.endsWith(".html")) {
    for (const match of content.matchAll(/\b(?:src|href)\s*=\s*(["'])(.*?)\1/gi)) add(match[2]);
  }
  if (filePath.endsWith(".css")) {
    for (const match of content.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)) add(match[2]);
  }
  if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
    for (const match of content.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*)["']([^"']+)["']/g)) add(match[1]);
    for (const match of content.matchAll(/["']((?:\/|\.\.?\/)[^"']+\.(?:css|js|mjs|json|svg|png|woff2?)(?:[?#][^"']*)?)["']/gi)) add(match[1]);
  }
  return [...found].sort();
}

function contentType(path) {
  return ({
    ".html": "text/html",
    ".css": "text/css",
    ".js": "javascript",
    ".mjs": "javascript",
    ".json": "json",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
  })[extname(path).toLowerCase()];
}

async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(3000) });
  return { status: response.status, headers: response.headers, bytes: Buffer.from(await response.arrayBuffer()) };
}

async function waitForServer(child, baseUrl) {
  const deadline = Date.now() + 10_000;
  let lastError;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) fail(`launcher exited early with ${child.exitCode}`);
    try {
      const response = await get(`${baseUrl}/`);
      if (response.status === 200) return response;
      lastError = new Error(`launcher root returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  fail(`launcher did not serve the extracted package: ${lastError?.message ?? "timeout"}`);
}

async function stop(child) {
  if (child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    new Promise((resolvePromise) => child.once("exit", resolvePromise)),
    new Promise((resolvePromise) => setTimeout(resolvePromise, 3000)),
  ]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function verify(extractedRoot) {
  const root = resolve(extractedRoot);
  const pkg = join(root, "malpaco-playable");
  if (!existsSync(pkg)) fail(`missing extracted package directory: ${pkg}`);
  for (const name of required) if (!existsSync(join(pkg, name))) fail(`missing required package file: ${name}`);

  const build = JSON.parse(await readFile(join(pkg, "BUILD.json"), "utf8"));
  if (build.schemaVersion !== 1) fail("BUILD.json schemaVersion must be 1");
  if (!/^[0-9a-f]{40}$/.test(build.sourceCommit ?? "")) fail("BUILD.json sourceCommit must be a full Git commit hash");
  if (build.minimumNode !== 22) fail("BUILD.json minimumNode must be 22");

  const manifestText = await readFile(join(pkg, "SHA256SUMS"), "utf8");
  const manifest = new Map();
  for (const line of manifestText.trimEnd().split("\n")) {
    const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
    if (!match) fail(`invalid SHA256SUMS line: ${line}`);
    if (manifest.has(match[2])) fail(`duplicate SHA256SUMS path: ${match[2]}`);
    manifest.set(match[2], match[1]);
  }
  const packaged = await allFiles(pkg);
  for (const name of packaged) {
    if (/(?:^|\/)(?:\.git|node_modules|src|tests|\.github)(?:\/|$)/.test(name)) fail(`source or repository content included: ${name}`);
  }

  const buildDir = await realpath(checkout);
  const targetReal = await realpath(root);
  const rel = relative(buildDir, targetReal);
  if (rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))) {
    fail(`extraction directory must be outside the source checkout: ${targetReal}`);
  }

  const launcher = spawn(process.execPath, [join(pkg, "serve.mjs"), "--port", String(port)], {
    cwd: pkg,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  launcher.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  launcher.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  const seen = new Set(["/"]);
  try {
    const rootResponse = await waitForServer(launcher, `http://127.0.0.1:${port}`);
    const rootText = rootResponse.bytes.toString("utf8");
    const indexRefs = references("/index.html", rootText);
    if (!indexRefs.some((path) => path.endsWith(".js"))) fail("asset check: index.html does not reference a JavaScript entry");
    if (!indexRefs.some((path) => path.endsWith(".css"))) fail("asset check: index.html does not reference a stylesheet");
    const pending = new Set(indexRefs);
    while (pending.size) {
      const path = [...pending].sort()[0];
      pending.delete(path);
      if (seen.has(path)) continue;
      seen.add(path);
      const response = await get(`http://127.0.0.1:${port}${path}`);
      if (response.status !== 200) fail(`asset check: GET ${path} returned HTTP ${response.status}`);
      const expectedType = contentType(path);
      if (expectedType && !response.headers.get("content-type")?.toLowerCase().includes(expectedType)) {
        fail(`asset check: ${path} has content-type ${response.headers.get("content-type") ?? "(missing)"}, expected ${expectedType}`);
      }
      const text = [".html", ".css", ".js", ".mjs"].includes(extname(path).toLowerCase())
        ? response.bytes.toString("utf8")
        : "";
      for (const ref of references(path, text)) if (!seen.has(ref)) pending.add(ref);
    }
    for (const extension of [".js", ".css"]) {
      if (![...seen].some((path) => path.endsWith(extension))) fail(`asset check: did not request a ${extension} asset`);
    }
  } finally {
    await stop(launcher);
  }

  for (const name of packaged) {
    if (name === "SHA256SUMS") continue;
    const expectedHash = manifest.get(name);
    if (!expectedHash) fail(`packaged file is missing from SHA256SUMS: ${name}`);
    const actualHash = sha256(await readFile(join(pkg, name)));
    if (actualHash !== expectedHash) fail(`SHA256 mismatch: ${name}`);
  }
  for (const name of manifest.keys()) if (!packaged.includes(name)) fail(`SHA256SUMS lists absent file: ${name}`);
  if (manifest.size !== packaged.length - 1) fail("SHA256SUMS does not cover every packaged file except itself");

  console.log(`PASS extracted artifact: ${packaged.length} files; ${manifest.size} SHA-256 entries; checked ${seen.size} HTTP paths on 127.0.0.1:${port}`);
  console.log(`source commit: ${build.sourceCommit}`);
  console.log(`extracted package: ${pkg}`);
  console.log(`launcher stdout: ${stdout.trim()}`);
  if (stderr.trim()) console.log(`launcher stderr: ${stderr.trim()}`);
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--verify-extracted" && args[1]) {
    await verify(args[1]);
    return;
  }
  if (args.length !== 1) fail("usage: node acceptance.mjs <fresh-directory> | --verify-extracted <directory>");
  const destination = resolve(args[0]);
  const existing = existsSync(destination) ? await readdir(destination) : [];
  if (existing.length) fail(`fresh-directory must be empty: ${destination}`);
  await mkdir(destination, { recursive: true });
  run("npm", ["run", "package:playable"], { cwd: checkout });
  if (!existsSync(archivePath)) fail(`package command did not create ${archivePath}`);
  const archiveNames = run("tar", ["-tzf", archivePath]).trim().split("\n").filter(Boolean);
  if (!archiveNames.length) fail("playable archive is empty");
  const files = archiveNames.filter((name) => !name.endsWith("/"));
  if (archiveNames.some((name) => name.startsWith("/") || name.split("/").includes(".."))) fail("archive contains an unsafe path");
  if (files.some((name) => !name.startsWith("malpaco-playable/"))) fail("archive entries must live under malpaco-playable/");
  for (const expected of required) if (!files.includes(`malpaco-playable/${expected}`)) fail(`archive is missing ${expected}`);
  run("tar", ["-xzf", archivePath, "-C", destination]);
  await verify(destination);
  console.log(`archive SHA-256: ${sha256(await readFile(archivePath))}`);
  console.log(`archive files: ${files.length}; extracted to ${destination}`);
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});

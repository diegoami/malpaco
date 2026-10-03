import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// The purity guard. src/core/ is the pure, deterministic rules engine: no DOM,
// no ambient randomness, no clock. It is checked, not trusted. If this fails,
// move the offending code into src/ui/, do not weaken the guard.
// Two layers: this word list, and src/core/tsconfig.json, which compiles core with
// no DOM lib and no Node types so that globals do not type-check at all.
// (Same idea as test/guard/test_core_purity.gd: comments are stripped before
// matching, so prose may name these words freely.)

const CORE_DIR = fileURLToPath(new URL("../../src/core", import.meta.url));

export const FORBIDDEN: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bdocument\b/, "core must not touch the DOM (document)"],
  [/\bwindow\b/, "core must not touch the DOM (window)"],
  [/\bMath\s*(\.\s*random\b|\[\s*["'`]random["'`]\s*\])/, "core must use DeterministicRng, not Math.random"],
  [/\bDate\b/, "core must not read the clock (Date)"],
  [/\bperformance\b/, "core must not read the clock (performance)"],
  [/\bcrypto\b/, "core must use DeterministicRng, not crypto"],
];

export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

export function violationsIn(source: string, label: string): string[] {
  const code = stripComments(source);
  const found: string[] = [];
  code.split("\n").forEach((line, i) => {
    for (const [pattern, reason] of FORBIDDEN) {
      if (pattern.test(line)) found.push(`${label}:${i + 1}: ${reason}: ${line.trim()}`);
    }
  });
  return found;
}

function tsFilesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? tsFilesUnder(path) : path.endsWith(".ts") ? [path] : [];
  });
}

describe("core purity guard", () => {
  it("src/core contains no DOM, Math.random or Date", () => {
    const files = tsFilesUnder(CORE_DIR);
    // A guard that finds no files passes vacuously.
    expect(files.length).toBeGreaterThanOrEqual(6);
    const violations = files.flatMap((f) => violationsIn(readFileSync(f, "utf8"), f.slice(CORE_DIR.length + 1)));
    expect(violations).toEqual([]);
  });

  it("the detector itself fires on each forbidden form (and ignores comments)", () => {
    expect(violationsIn("const x = Math.random();", "t")).toHaveLength(1);
    expect(violationsIn("const x = Math . random();", "t")).toHaveLength(1);
    expect(violationsIn('const x = Math["random"]();', "t")).toHaveLength(1);
    expect(violationsIn("const x = Math['random']();", "t")).toHaveLength(1);
    expect(violationsIn("const t = performance.now();", "t")).toHaveLength(1);
    expect(violationsIn("crypto.getRandomValues(new Uint32Array(1));", "t")).toHaveLength(1);
    expect(violationsIn("const t = new Date();", "t")).toHaveLength(1);
    expect(violationsIn("const t = Date.now();", "t")).toHaveLength(1);
    expect(violationsIn("document.body.append(el);", "t")).toHaveLength(1);
    expect(violationsIn("window.addEventListener('x', f);", "t")).toHaveLength(1);
    expect(violationsIn("// uses Math.random and Date and document\nconst a = 1; /* window */", "t")).toEqual([]);
  });
});

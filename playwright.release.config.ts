import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";

const extracted = process.env["PLAYABLE_EXTRACTED_DIR"];
if (!extracted) throw new Error("PLAYABLE_EXTRACTED_DIR must point to the extracted artifact parent");
const packageDir = resolve(extracted, "malpaco-playable");
const evidenceDir = process.env["PLAYABLE_EVIDENCE_DIR"];

export default defineConfig({
  testDir: "./tests/e2e",
  // T89 (R4): the published build has no legacy views, so their suites run on the source build only.
  testIgnore: ["slice.spec.ts", "generated-board.spec.ts", "generated-game.spec.ts", "reinforcement.spec.ts", "game-setup.spec.ts",
    "complete-game.spec.ts", "help.spec.ts", "match-save.spec.ts", "retry-validation.spec.ts", "computer.spec.ts", "finished-copy.spec.ts"].map(f => `**/${f}`),
  grepInvert: /@legacy/,
  outputDir: evidenceDir ? `${evidenceDir}/test-results` : "test-results-release",
  reporter: [["list"], ["html", { outputFolder: evidenceDir ? `${evidenceDir}/playwright-report` : "playwright-report-release", open: "never" }]],
  fullyParallel: true,
  retries: 0,
  use: { baseURL: "http://127.0.0.1:4175", trace: "off" },
  projects: [
    { name: "1280x800", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
    { name: "1920x1080", use: { browserName: "chromium", viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: {
    command: `node "${packageDir}/serve.mjs" --port 4175`,
    url: "http://127.0.0.1:4175",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

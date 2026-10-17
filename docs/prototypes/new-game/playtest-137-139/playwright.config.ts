import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
import base from "../../../../playwright.config";
export default defineConfig({
  ...base, testDir: ".", testMatch: "flow.spec.ts",
  outputDir: process.env["PLAYTEST_EVIDENCE_DIR"] + "/test-results", reporter: [["list"]],
  webServer: {
    command: "npx vite build && npx vite preview --port 4173 --strictPort",
    cwd: fileURLToPath(new URL("../../../../", import.meta.url)),
    url: "http://localhost:4173", reuseExistingServer: false, timeout: 120_000,
  },
});

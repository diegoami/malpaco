import { defineConfig } from "@playwright/test";
import base from "../../../../playwright.config";
export default defineConfig({ ...base, testDir: ".", testMatch: "flow.spec.ts", outputDir: process.env["PLAYTEST_EVIDENCE_DIR"] + "/test-results", reporter: [["list"]] });

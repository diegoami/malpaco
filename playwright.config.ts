import { defineConfig } from "@playwright/test";

// One project per layout the owner will judge. Tests that take screenshots
// write them to screenshots/<project>/ (CI uploads that folder).
export default defineConfig({
  testDir: "tests/e2e",
  // T89: checks of the published build only (its legacy views are retired) run in the release config.
  grepInvert: /@release-only/,
  outputDir: "test-results",
  reporter: [["list"], ["html", { open: "never" }]],
  fullyParallel: true,
  retries: 0,
  use: { baseURL: "http://localhost:4173", trace: "off" },
  projects: [
    { name: "1280x800", use: { browserName: "chromium", viewport: { width: 1280, height: 800 } } },
    { name: "1920x1080", use: { browserName: "chromium", viewport: { width: 1920, height: 1080 } } },
  ],
  webServer: {
    // Build first, so the tests never run against a stale dist/.
    command: "npx vite build && npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});

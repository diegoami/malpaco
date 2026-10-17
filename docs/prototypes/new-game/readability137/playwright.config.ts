import {defineConfig} from "@playwright/test";
import {fileURLToPath} from "node:url";
import base from "../../../../playwright.config";
export default defineConfig({...base,
 testDir:fileURLToPath(new URL("../../../../tests/e2e",import.meta.url)),
 testMatch:process.env["READABILITY_COMPATIBILITY"] ? ["reference-game.spec.ts","battle-controls.spec.ts","map-readability.spec.ts"] : ["map-readability.spec.ts"],
 outputDir:process.env["READABILITY_EVIDENCE_DIR"]+"/test-results",reporter:[["list"]],
 webServer:{...base.webServer as object,command:"npx vite build && npx vite preview --port 4173 --strictPort",cwd:fileURLToPath(new URL("../../../../",import.meta.url)),url:"http://localhost:4173",reuseExistingServer:false,timeout:120000},
});

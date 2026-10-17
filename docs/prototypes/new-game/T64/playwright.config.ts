import {defineConfig} from "@playwright/test";
import {fileURLToPath} from "node:url";
import base from "../../../../playwright.config";
export default defineConfig({...base,testDir:fileURLToPath(new URL("../../../../tests/e2e",import.meta.url)),
 testMatch:process.env["COAST_COMPATIBILITY"]?["coast-postprocess.spec.ts","reference-game.spec.ts","direct-attack.spec.ts","battle-controls.spec.ts","map-readability.spec.ts","versioned-match.spec.ts","computer-turn-flow.spec.ts","friendly-move.spec.ts","victory-options.spec.ts","entry.spec.ts"]:["coast-postprocess.spec.ts"],
 outputDir:process.env["COAST_EVIDENCE_DIR"]+"/test-results",reporter:[["list"]],
 webServer:{command:"npx vite build && npx vite preview --port 4173 --strictPort",cwd:fileURLToPath(new URL("../../../../",import.meta.url)),url:"http://localhost:4173",reuseExistingServer:false,timeout:120000},
});

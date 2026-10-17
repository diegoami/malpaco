import {defineConfig} from "@playwright/test";
import {fileURLToPath} from "node:url";
import base from "../../../../playwright.config";
export default defineConfig({...base,testDir:fileURLToPath(new URL("../../../../tests/e2e",import.meta.url)),
 testMatch:process.env["ATTACK_COMPATIBILITY"] ? ["direct-attack.spec.ts","battle-controls.spec.ts","battle-accessibility.spec.ts","friendly-move.spec.ts","friendly-feedback.spec.ts","victory-options.spec.ts","versioned-match.spec.ts","computer-turn-flow.spec.ts","entry.spec.ts","map-readability.spec.ts"] : ["direct-attack.spec.ts"],
 outputDir:process.env["ATTACK_EVIDENCE_DIR"]+"/test-results",reporter:[["list"]],
 webServer:{command:"npx vite build && npx vite preview --port 4173 --strictPort",cwd:fileURLToPath(new URL("../../../../",import.meta.url)),url:"http://localhost:4173",reuseExistingServer:false,timeout:120000},
});

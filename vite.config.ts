import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import {manualPlugin} from './tools/manual/render.mjs';

// The map under data/maps is read as data, unchanged; the dev server serves it
// from the repository root.
export default defineConfig({
  plugins:[manualPlugin()],
  server: {
    fs: { allow: ["."] },
    // Local caches must not become dev-server inputs.
    watch: { ignored: [fileURLToPath(new URL("./.cache", import.meta.url))] },
  },
  build: { target: "es2022", sourcemap: false },
  test: {
    include: ["tests/core/**/*.test.ts", "tests/ui/**/*.test.ts"],
    environment: "node",
  },
});

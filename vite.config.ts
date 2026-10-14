import { defineConfig } from "vitest/config";

// The map under data/maps is read as data, unchanged; the dev server serves it
// from the repository root.
export default defineConfig({
  server: { fs: { allow: ["."] } },
  build: { target: "es2022", sourcemap: false },
  test: {
    include: ["tests/core/**/*.test.ts", "tests/ui/**/*.test.ts"],
    environment: "node",
  },
});

import {defineConfig} from 'vitest/config';
export default defineConfig({test:{include:['docs/prototypes/new-game/T38/parent-preflight/mock/tests/core/card-deck.test.ts','docs/prototypes/new-game/T38/parent-preflight/mock/tests/core/card-deck-replay.test.ts'],environment:'node'}});

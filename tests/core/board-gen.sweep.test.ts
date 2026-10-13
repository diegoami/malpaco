/**
 * Wide-seed sweep for T05b's retry loop (C-BRD-01).
 *
 * The contract says: "Over many seeds, the generator finds a valid board
 * within a stated, small number of attempts, and the test fixes that number."
 * Here we drive 200 seeds through `generateBoard` and assert a success
 * rate ≥ 99 %.
 *
 * The cap (`MAX_BOARD_ATTEMPTS`) is fixed separately and pinned in the
 * `rule-9 mutation sensitivity` block in `tests/core/board-gen.test.ts`.
 *
 * This sweep is a `success-rate` measurement: each call uses the retry
 * loop internally.  We do NOT assert each call is fast — that would
 * couple a fairness measurement to the wall clock (rule 18 forbids
 * reading time).  The cap is a count of attempts, not a duration.
 */
import { describe, expect, it } from "vitest";
import { generateBoard } from "../../src/core/board-gen";

describe("wide-seed sweep (C-BRD-01, ≥ 99 % within MAX_BOARD_ATTEMPTS)", () => {
  it("200 seeds success rate is ≥ 99 %", () => {
    const N = 200;
    let ok = 0;
    const failing: number[] = [];
    for (let seed = 1; seed <= N; seed++) {
      const r = generateBoard(seed);
      if (r.ok) ok++;
      else failing.push(seed);
    }
    const pct = ok / N;
    // Surface the actual numbers when the test fails so the implementer
    // can see the gap without re-running.  ≥ 99 % is the contract;
    // 100 % is the design team's intent (rule 22: if a louder run would
    // expose the failure, this is the run).
    expect(
      pct,
      `success rate ${pct * 100}% < 99% on seeds [${failing.slice(0, 20).join(", ")}${failing.length > 20 ? "..." : ""}]`,
    ).toBeGreaterThanOrEqual(0.99);
  }, 600_000);

  it("each seed is deterministic: re-running the same seed produces the same result (C-RND-01)", () => {
    const N = 50;
    for (let seed = 1; seed <= N; seed++) {
      const a = generateBoard(seed);
      const b = generateBoard(seed);
      expect(a.ok, `seed ${seed} first call`).toBe(b.ok);
      if (a.ok && b.ok) {
        expect(a.map.id).toBe(b.map.id);
      }
    }
  });
});

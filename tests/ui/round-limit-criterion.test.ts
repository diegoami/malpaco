import {describe, expect, it} from "vitest";
import {decidedBy} from "../../src/ui/victoryView";

const row = (countries: number, armies: number) => ({player: "p", countries, armies});

describe("the round-limit result names its deciding criterion (#132)", () => {
  it("names countries, armies or turn order, whichever first separates first and second", () => {
    expect(decidedBy([row(20, 30), row(18, 60)])).toBe("decided by countries");
    expect(decidedBy([row(20, 60), row(20, 30)])).toBe("tied on countries, decided by armies");
    expect(decidedBy([row(20, 30), row(20, 30)])).toBe("tied on countries and armies, decided by turn order");
  });
});

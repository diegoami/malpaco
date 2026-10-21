import {expect, it} from "vitest";
import {countLabel} from "../../src/ui/palette";

it("counts over 999 print compactly and never overstate (T87 B)", () => {
  expect([7, 48, 315, 999].map(countLabel)).toEqual(["7", "48", "315", "999"]);
  expect([1000, 1250, 1299, 9999, 12999, 23999, 123456].map(countLabel)).toEqual(["1k", "1.2k", "1.2k", "9.9k", "12k", "23k", "123k"]);
});

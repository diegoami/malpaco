import { expect, test } from "vitest";
import { seatName } from "../../src/ui/palette";

// T97 (owner, 2026-10-22): seats are named by their colour; the one human seat is You.
test("one human is You and the computers take their seats' colours", () => {
  const players = [{ id: "seat1", kind: "human" }, { id: "seat2", kind: "computer" }, { id: "seat3", kind: "computer" }, { id: "seat4", kind: "computer" }];
  expect(players.map(p => seatName(players, p.id))).toEqual(["You", "Orange", "Green", "Purple"]);
  // The human need not sit first: a computer in seat 1 is Blue.
  const last = [{ id: "a", kind: "computer" }, { id: "b", kind: "computer" }, { id: "c", kind: "computer" }, { id: "d", kind: "human" }];
  expect(last.map(p => seatName(last, p.id))).toEqual(["Blue", "Orange", "Green", "You"]);
});

test("with several humans every seat is its colour, and an unknown owner is Unowned", () => {
  const players = [{ id: "a", kind: "human" }, { id: "b" }];
  expect(players.map(p => seatName(players, p.id))).toEqual(["Blue", "Orange"]);
  expect(seatName(players, undefined)).toBe("Unowned");
});

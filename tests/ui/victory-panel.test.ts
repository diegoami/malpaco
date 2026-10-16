import { afterEach, expect, it, vi } from "vitest";
import { end, layout, rotation } from "../core/victory-options-fixture";
import { Panel } from "../../src/ui/panel";
import { seatLook } from "../../src/ui/palette";

// A small DOM recording surface: render the real Panel, h/s and palette rather
// than replacing its result-selection logic. No browser dependency in core/UI units.
class ElementRecord {
  readonly attrs: Record<string, string> = {};
  readonly dataset: Record<string, string> = {};
  readonly properties: Record<string, string> = {};
  readonly style = { setProperty: (name: string, value: string) => { this.properties[name] = value; } };
  children: (ElementRecord | string)[] = [];
  hidden = false;
  title = "";
  constructor(readonly tag: string) {}
  setAttribute(name: string, value: string) { this.attrs[name] = value; }
  toggleAttribute(name: string, value: boolean) { if (value) this.attrs[name] = ""; else delete this.attrs[name]; }
  addEventListener() {}
  append(...children: (ElementRecord | string)[]) { this.children.push(...children); }
  replaceChildren(...children: (ElementRecord | string)[]) { this.children = children; }
  get textContent(): string { return this.children.map(child => typeof child === "string" ? child : child.textContent).join(""); }
  set textContent(value: string) { this.children = [value]; }
  find(predicate: (node: ElementRecord) => boolean): ElementRecord | undefined {
    if (predicate(this)) return this;
    for (const child of this.children) {
      const found = typeof child === "string" ? undefined : child.find(predicate);
      if (found) return found;
    }
    return undefined;
  }
}

afterEach(() => vi.unstubAllGlobals());

it("a round-limit winner before the last mover gets its own result badge and color", () => {
  vi.stubGlobal("document", {
    createElement: (tag: string) => new ElementRecord(tag),
    createElementNS: (_namespace: string, tag: string) => new ElementRecord(tag),
  });
  const position = layout(rotation(2, 0, { dominationWin: false, roundLimit: 20 }), [24, 22]);
  position.currentPlayer = 1;
  position.turnNumber = 20;
  const state = end(position);
  expect(state.result?.reason).toBe("round-limit");
  expect(state.winner).toBe(state.players[0]!.id);
  expect(state.winner).not.toBe(state.players[state.currentPlayer]!.id);
  const panel = new Panel({ onAttack() {}, onStartCombat() {}, onEndTurn() {}, onNewGame() {} });
  panel.render({ state, from: null, to: null, blocked: "", hint: "", seed: state.rng.seed });
  const root = panel.el as unknown as ElementRecord;
  expect(root.find(node => node.attrs.id === "turn-title")!.textContent).toBe(`${state.players[0]!.name} wins`);
  const turn = root.find(node => node.attrs.class === "card turn")!;
  expect([turn.find(node => node.tag === "path")!.attrs.fill, turn.properties["--owner"]])
    .toEqual([seatLook(0).color, seatLook(0).color]);
});

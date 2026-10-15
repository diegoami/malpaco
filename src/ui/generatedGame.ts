import { createGame, defaultOptions, malpacoRules } from "../core";
import type { GameState } from "../core";
import { App } from "./app";
import { h } from "./dom";
import { GeneratedMapView } from "./generatedMapView";
import { layoutGeneratedBoard } from "./prototype/layout";

/** Keep the generated deal and rule RNG; only replace display coordinates. */
export function projectGeneratedState(state: GameState): GameState {
  return { ...state, map: layoutGeneratedBoard(state.map) };
}

export function createGeneratedGame(seed: number) {
  const result = createGame({
    ...defaultOptions(), seed,
    seats: [{ kind: "human" }, { kind: "human" }],
    computerStrengths: [],
  }, malpacoRules());
  return result.ok ? { ok: true as const, state: projectGeneratedState(result.state) } : result;
}

export function mountGeneratedGame(root: HTMLElement): void {
  const given = new URL(location.href).searchParams.get("seed") ?? "1994";
  const seed = /^\d+$/.test(given) ? Number(given) >>> 0 : 1994;
  const input = h("input", {
    id: "game-seed", type: "number", min: "0", max: "4294967295",
    value: String(seed), required: "",
  });
  const form = h("form", { class: "generated-seed" },
    h("label", { for: "game-seed" }, "Seed"), input,
    h("button", { type: "submit" }, "Generate"),
  );
  const retry = () => {
    if (!form.reportValidity()) return;
    const url = new URL(location.href);
    url.searchParams.set("seed", String(Number(input.value) >>> 0));
    location.assign(url);
  };
  form.addEventListener("submit", event => { event.preventDefault(); retry(); });

  root.classList.add("generated-game-root");
  root.id = "generated-game";
  const result = createGeneratedGame(seed);
  if (!result.ok) {
    const button = h("button", { type: "button" }, "Retry");
    button.addEventListener("click", retry);
    root.replaceChildren(h("section", { class: "generated-error" },
      h("h1", {}, "Malpaco"), form,
      h("div", { role: "alert" }, "Generation failed: " + result.errors.join("; ")),
      h("p", {}, "Retry this seed, or choose another seed above."), button,
    ));
    return;
  }

  new App(result.state.map, seed, retry, result.state,
    (map, handlers) => new GeneratedMapView(map, handlers),
  ).mount(root);
  const legend = h("div", { class: "generated-legend", "aria-label": "Map legend" },
    h("span", {}, "Seat · armies"),
    h("span", {}, h("i", { class: "generated-land-key", "aria-hidden": "true" }), "Land"),
    h("span", {}, h("i", { class: "generated-sea-key", "aria-hidden": "true" }), "Sea"),
  );
  root.querySelector("header")!.append(legend, form);
}

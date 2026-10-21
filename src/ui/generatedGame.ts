import { createGame, defaultOptions, deserializeMatch, malpacoRules, serializeMatch } from "../core";
import type { GameOptions, GameState } from "../core";
import { App } from "./app";
import { h } from "./dom";
import { mountHelp } from "./help";
import { GeneratedMapView } from "./generatedMapView";
import { layoutGeneratedBoard } from "./prototype/layout";

/** Keep the core deal and rule RNG; only replace display coordinates. */
export function projectGeneratedState(state: GameState): GameState {
  return { ...state, map: layoutGeneratedBoard(state.map) };
}

export function parseGameSettings(seed: string | null, seats: string | null) {
  const s = seed ?? "1994";
  const n = seats ?? "2";
  const errors: string[] = [];
  if (!/^\d+$/.test(s) || !Number.isInteger(Number(s)) || Number(s) > 4294967295) {
    errors.push("Seed must be a whole number from 0 to 4294967295.");
  }
  if (!["2", "3", "4"].includes(n)) {
    errors.push("Choose 2, 3 or 4 human seats.");
  }
  return errors.length ? { ok: false as const, errors } : { ok: true as const, seed: Number(s), seats: Number(n) };
}

function generatedOptions(seed: number, seats: number, computers = false): GameOptions {
  // Regional names apply to the geographic generator only (T94).
  const { names: _names, ...defaults } = defaultOptions();
  return { ...defaults, seed, seats: Array.from({ length: seats }, (_, i) => ({ kind: computers && i > 0 ? "computer" as const : "human" as const })), computerStrengths: computers ? Array.from({length: seats - 1}, () => "Normal" as const) : [] };
}

export function createGeneratedGame(seed = 1994, seats = 2, computers = false) {
  const settings = parseGameSettings(String(seed), String(seats));
  if (!settings.ok) return settings;
  const result = createGame(generatedOptions(seed, seats, computers), malpacoRules());
  return result.ok ? { ok: true as const, state: projectGeneratedState(result.state) } : result;
}

function navigate(view: string, seed: string, seats: string, computers = false) {
  const url = new URL(location.href);
  url.searchParams.set("view", view);
  url.searchParams.set("seed", seed);
  url.searchParams.set("seats", seats);
  if (computers) url.searchParams.set("opponents", "computer");
  else url.searchParams.delete("opponents");
  location.assign(url);
}

export function mountGameSetup(root: HTMLElement, failure = ""): void {
  const query = new URL(location.href).searchParams;
  const input = h("input", {
    id: "setup-seed", type: "text", inputmode: "numeric",
    value: query.get("seed") ?? "1994", "aria-describedby": "seed-help",
  });
  const select = h("select", { id: "setup-seats" },
    ...[2, 3, 4].map(n => h("option", { value: String(n) }, `${n} seats`)),
  );
  select.value = query.get("seats") ?? "2";
  const mode = h("select", {id:"setup-opponents"}, h("option", {value:"human"}, "All human players"), h("option", {value:"computer"}, "You versus computers"));
  mode.value = query.get("opponents") === "computer" ? "computer" : "human";
  const seatLabel = h("label", {for:"setup-seats"}, "Human seats");
  const refreshSeatLabel = () => { seatLabel.textContent = mode.value === "computer" ? "Total seats" : "Human seats"; };
  mode.addEventListener("change", refreshSeatLabel);
  refreshSeatLabel();
  const alert = h("p", { role: "alert" }, failure);
  const form = h("form", { class: "card setup-card", novalidate: "" },
    h("h1", {}, "New generated game"), h("p", {}, "Choose two to four seats: all humans, or you against one to three computers."),
    h("label", { for: "setup-seed" }, "Seed"), input,
    h("p", { id: "seed-help", class: "muted" }, "Whole number from 0 to 4294967295. The same settings recreate the same game."),
    h("label", {for:"setup-opponents"}, "Players"), mode,
    seatLabel, select, alert,
    h("button", { type: "submit", class: "primary" }, "Start game"));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const settings = parseGameSettings(input.value, select.value);
    if (!settings.ok) {
      alert.textContent = settings.errors.join(" ");
      return;
    }
    const result = createGeneratedGame(settings.seed, settings.seats, mode.value === "computer");
    if (!result.ok) {
      alert.textContent = "Generation failed: " + result.errors.join("; ") + " Choose another seed and start again.";
      return;
    }
    navigate("generated-game", String(settings.seed), String(settings.seats), mode.value === "computer");
  });
  root.id = "game-setup";
  root.classList.add("setup-root");
  form.append(loadControl(root, alert));
  root.replaceChildren(form);
  mountHelp(form);
}

export function mountGeneratedGame(root: HTMLElement): void {
  const query = new URL(location.href).searchParams;
  const settings = parseGameSettings(query.get("seed"), query.get("seats"));
  if (!settings.ok) {
    mountGameSetup(root, settings.errors.join(" "));
    return;
  }
  const { seed, seats } = settings;
  const computers = query.get("opponents") === "computer";
  let retryValidation: HTMLElement | null = null;
  const input = h("input", {
    id: "game-seed", type: "number", min: "0", max: "4294967295",
    value: String(seed), required: "",
  });
  const form = h("form", { class: "generated-seed" },
    h("label", { for: "game-seed" }, "Seed"), input,
    h("button", { type: "submit" }, "Generate"),
  );
  const retry = () => {
    const value = parseGameSettings(input.value, String(seats));
    if (!value.ok) {
      if (retryValidation) {
        retryValidation.textContent = value.errors.join(" ");
        retryValidation.hidden = false;
      }
      return;
    }
    if (retryValidation) {
      retryValidation.textContent = "";
      retryValidation.hidden = true;
    }
    navigate("generated-game", String(value.seed), String(seats), computers);
  };
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (form.reportValidity()) retry();
  });
  const result = createGeneratedGame(seed, seats, computers);
  if (!result.ok) {
    root.classList.add("generated-game-root");
    root.id = "generated-game";
    const button = h("button", { type: "button" }, "Retry");
    button.addEventListener("click", retry);
    retryValidation = h("p", { class: "retry-validation", role: "alert", hidden: true });
    root.replaceChildren(h("section", { class: "generated-error" }, h("h1", {}, "Malpaco"), form,
      h("div", { role: "alert" }, "Generation failed: " + result.errors.join("; ")),
      h("p", {}, "Retry this seed, or choose another seed above."), retryValidation, button));
    return;
  }
  mountMatch(root, generatedOptions(seed, seats, computers), result.state);
}

// [designed] C-SET-05/07 defines the payload; local file controls/errors are new UI.
function loadControl(root: HTMLElement, alert: HTMLElement, current?: App): HTMLElement {
  const input = h("input", { type: "file", accept: ".json,application/json", id: "load-game-file" });
  const label = h("label", { for: "load-game-file" }, "Load game");
  let request = 0;
  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;
    const own = ++request;
    try {
      const loaded = deserializeMatch(await file.text());
      if (own !== request) return;
      // Validate/replay completely before replacing the controller, URL or DOM.
      const state = projectGeneratedState(loaded.state);
      const url = new URL(location.href);
      url.searchParams.set("view", "generated-game");
      url.searchParams.set("seed", String(loaded.options.seed));
      url.searchParams.set("seats", String(loaded.options.seats.length));
      if (loaded.options.seats.some(s => s.kind === "computer")) url.searchParams.set("opponents", "computer");
      else url.searchParams.delete("opponents");
      history.replaceState(null, "", url);
      current?.dispose();
      mountMatch(root, loaded.options, state);
    } catch (error) {
      if (own === request) alert.textContent = "Load failed: " + (error instanceof Error ? error.message : String(error));
    } finally { if (own === request) input.value = ""; }
  });
  return h("div", { class: "match-load" }, label, input);
}

function mountMatch(root: HTMLElement, options: GameOptions, state: GameState): void {
  const seed = options.seed, seats = options.seats.length;
  const computers = options.seats.some(s => s.kind === "computer");
  root.classList.remove("setup-root");
  root.classList.add("generated-game-root");
  root.id = "generated-game";
  root.dataset["seats"] = String(seats);
  const app = new App(state.map, seed, () => { app.dispose(); navigate("game-setup", String(seed), String(seats), computers); }, state,
    (map, handlers) => new GeneratedMapView(map, handlers));
  app.mount(root);
  if (computers) root.querySelector(".subtitle")!.textContent = `${state.map.name} · ${seats} seats · You versus computers`;
  const legend = h("div", { class: "generated-legend", "aria-label": "Map legend" },
    h("span", {}, "Seat · armies"), h("span", {}, h("i", { class: "generated-land-key", "aria-hidden": "true" }), "Land"),
    h("span", {}, h("i", { class: "generated-sea-key", "aria-hidden": "true" }), "Sea"));
  const input = h("input", { id: "game-seed", type: "number", min: "0", max: "4294967295", value: String(seed), required: "" });
  const form = h("form", { class: "generated-seed" }, h("label", {for:"game-seed"}, "Seed"), input, h("button", {type:"submit"}, "Generate"));
  form.addEventListener("submit", event => { event.preventDefault(); if (form.reportValidity()) navigate("generated-game", input.value, String(seats), computers); });
  const save = h("button", { type: "button" }, "Save game");
  save.addEventListener("click", () => {
    const blob = new Blob([serializeMatch(options, app.actions)], {type:"application/json"});
    const url = URL.createObjectURL(blob), anchor = h("a", { href:url, download:`malpaco-${seed}.json` });
    anchor.click();
    // The click has queued the download before releasing its object URL.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
  const alert = h("p", {role:"alert",class:"match-error"});
  const controls = h("div", {class:"match-files"}, save, loadControl(root, alert, app), alert);
  root.querySelector("header")!.append(legend, form, controls);
  mountHelp(root.querySelector(".panel-foot")!, () => app.pauseForHelp(), () => app.resumeAfterHelp(), "Help");
}

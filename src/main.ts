import {mountReferenceGame} from "./ui/referenceGame";
import "./styles.css";
import { mountGameSetup, mountGeneratedGame } from "./ui/generatedGame";
import smallSeaJson from "../data/maps/small_sea.json";
import { parseMap } from "./core";
import { App } from "./ui/app";
import { mountGeneratedPreview } from "./ui/prototype/preview";

const root = document.getElementById("app");
if (!root) throw new Error("#app is missing");

/** `?seed=N` fixes the game (tests and bug reports); otherwise a fresh random one. */
function chooseSeed(): number {
  const given = new URLSearchParams(location.search).get("seed");
  if (given !== null && /^\d+$/.test(given)) return Number(given) >>> 0;
  return crypto.getRandomValues(new Uint32Array(1))[0] as number;
}

function startAuthoredGame(): void {
  const parsed = parseMap(smallSeaJson);
  if (!parsed.ok) {
    root!.textContent = `The map did not load: ${parsed.errors.join("; ")}`;
    throw new Error("map did not load");
  }
  new App(parsed.map, chooseSeed(), () => {
    const url = new URL(location.href);
    url.searchParams.delete("seed");
    url.searchParams.set("view", "authored-game");
    location.assign(url);
  }).mount(root!);
}

const view = new URLSearchParams(location.search).get("view");
if (view === "reference-game") {
  mountReferenceGame(root);
} else if (view === "authored-game") {
  startAuthoredGame();
} else if (view === "generated-prototype") {
  mountGeneratedPreview(root);
} else if (view === "generated-game") {
  mountGeneratedGame(root);
} else if (view === "game-setup") {
  mountGameSetup(root);
} else {
  mountReferenceGame(root);
}

import "./styles.css";
// The map is read as data, unchanged, from the repository's data/ folder.
import smallSeaJson from "../data/maps/small_sea.json";
import { parseMap } from "./core";
import { App } from "./ui/app";

const root = document.getElementById("app");
if (!root) throw new Error("#app is missing");

const parsed = parseMap(smallSeaJson);
if (!parsed.ok) {
  root.textContent = `The map did not load: ${parsed.errors.join("; ")}`;
  throw new Error("map did not load");
}

const map = parsed.map;

/** `?seed=N` fixes the game (tests and bug reports); otherwise a fresh random one. */
function chooseSeed(): number {
  const given = new URLSearchParams(location.search).get("seed");
  if (given !== null && /^\d+$/.test(given)) return Number(given) >>> 0;
  return crypto.getRandomValues(new Uint32Array(1))[0] as number;
}

function start(): void {
  new App(map, chooseSeed(), () => {
    const url = new URL(location.href);
    url.searchParams.delete("seed");
    location.assign(url);
  }).mount(root as HTMLElement);
}

start();

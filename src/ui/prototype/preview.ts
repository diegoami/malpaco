import { generateBoard } from "../../core";
import type { GameMap, Point, Province } from "../../core";
import { h, s } from "../dom";
import { coastOf, layoutGeneratedBoard } from "./layout";

const pathOf = (points: readonly Point[]) => `M${points.map(p => p.join(" ")).join("L")}Z`;

/** Separate, opt-in display experiment; never creates or modifies a game state. */
export function mountGeneratedPreview(root: HTMLElement): void {
  const url = new URL(location.href);
  const rawSeed = url.searchParams.get("seed") ?? "1994";
  const seed = /^\d+$/.test(rawSeed) ? Number(rawSeed) >>> 0 : 1994;
  const seedInput = h("input", { id: "prototype-seed", type: "number", min: "0", max: "4294967295", value: String(seed), required: "" });
  const generate = h("button", { type: "submit", class: "prototype-generate" }, "Generate");
  const form = h("form", { class: "prototype-seed-control" }, h("label", { for: "prototype-seed" }, "Seed"), seedInput, generate);
  const regenerate = () => {
    if (!form.reportValidity()) return;
    const next = new URL(location.href);
    next.searchParams.set("seed", String(Number(seedInput.value) >>> 0));
    location.assign(next);
  };
  form.addEventListener("submit", event => { event.preventDefault(); regenerate(); });

  const header = h("header", { class: "prototype-header" },
    h("div", {}, h("p", { class: "prototype-eyebrow" }, "MALPACO / MAP LAB"), h("h1", {}, "The generated archipelago")),
    form,
  );
  const legend = h("div", { class: "prototype-legend" },
    h("span", {}, h("i", { class: "prototype-key prototype-key-border", "aria-hidden": "true" }), "Land neighbour"),
    h("span", {}, h("i", { class: "prototype-key prototype-key-sea", "aria-hidden": "true" }), "Sea lane"),
    h("p", {}, "Connections define neighbours. Select a country to trace its routes."),
  );
  const main = h("main", { id: "generated-prototype" }, header, legend);
  root.classList.add("prototype-root");
  root.replaceChildren(main);

  const result = generateBoard(seed);
  if (!result.ok) {
    const retry = h("button", { type: "button" }, "Retry");
    retry.addEventListener("click", regenerate);
    main.append(h("section", { class: "prototype-error" },
      h("div", { role: "alert" }, h("h2", {}, "Generation failed"), h("p", {}, result.errors.join("; "))),
      h("p", {}, "Retry this seed, or enter another seed above."), retry,
    ));
    return;
  }
  const map = layoutGeneratedBoard(result.map);
  const selection = h("section", { class: "prototype-selection", "aria-live": "polite", "aria-atomic": "true" },
    h("div", { class: "prototype-selected-title" }, h("p", { class: "prototype-eyebrow" }, "COUNTRY ROUTES"), h("h2", { id: "selected-country" }, "Choose a country")),
    h("div", { id: "selected-neighbours" }, h("p", { class: "prototype-selection-hint" }, "Click a region, or focus it and press Enter or Space.")),
  );
  const svg = renderAtlas(map, p => select(p));
  main.append(h("div", { class: "prototype-map-wrap" }, svg), selection);
  const groups = new Map(Array.from(svg.querySelectorAll<SVGGElement>("[data-country]")).map(g => [g.dataset["country"]!, g]));
  const connections = Array.from(svg.querySelectorAll<SVGPathElement>("[data-connection]"));

  function select(p: Province): void {
    const neighbours = new Set([...p.borders, ...p.seaLanes]);
    for (const [id, group] of groups) {
      group.setAttribute("aria-pressed", String(id === p.id));
      group.dataset["neighbour"] = String(neighbours.has(id));
    }
    for (const connection of connections) connection.dataset["highlighted"] = String(connection.dataset["from"] === p.id || connection.dataset["to"] === p.id);
    selection.querySelector("#selected-country")!.textContent = `${p.name} (${p.id})`;
    const sections = ([ ["border", "Land neighbours", p.borders], ["sea", "Sea neighbours", p.seaLanes] ] as const).map(([kind, title, ids]) =>
      h("div", { class: `prototype-neighbour-list prototype-neighbours-${kind}` }, h("h3", {}, title),
        ...(ids.length ? ids.map(id => h("span", { "data-neighbour-kind": kind }, `${map.provinces.find(q => q.id === id)!.name} (${id})`)) : [h("span", { class: "prototype-no-neighbours" }, "None")]),
      ),
    );
    selection.querySelector("#selected-neighbours")!.replaceChildren(...sections);
  }
}

function renderAtlas(map: GameMap, select: (p: Province) => void): SVGSVGElement {
  const { x, y, width, height } = map.bounds;
  const svg = s("svg", { id: "generated-map", viewBox: `${x} ${y} ${width} ${height}`, role: "group", "aria-label": "Generated archipelago: 46 countries on 9 islands" });
  const mask = s("mask", { id: "prototype-route-mask", maskUnits: "userSpaceOnUse", x, y, width, height }, s("rect", { x, y, width, height, fill: "white" }));
  // [designed] Name clearance follows 18-unit Inter text after inspecting the
  // MapView name box. getBBox measures the actual loaded font below.
  const defs = s("defs", {}, mask);
  svg.append(defs, s("rect", { class: "prototype-sea", x, y, width, height }));
  const coasts = s("g", { class: "prototype-coasts", "aria-hidden": "true" });
  for (const island of map.islands) {
    const provinces = map.provinces.filter(p => p.island === island.id);
    const coast = coastOf(provinces);
    coasts.append(s("path", { class: "prototype-coast", d: pathOf(coast) }));
    const labelX = Math.min(...provinces.map(p => p.labelAt[0])) - 70;
    const labelY = Math.min(...provinces.map(p => p.labelAt[1])) - 62;
    coasts.append(s("text", { "data-island": island.id, class: "prototype-island-title", x: labelX, y: labelY }, `${island.name}  /  +${island.bonus}`));
  }
  svg.append(coasts);
  const countries = s("g", { class: "prototype-countries" });
  for (const p of map.provinces) {
    const group = s("g", { "data-country": p.id, role: "button", tabindex: "0", "aria-pressed": "false", "aria-label": `${p.name} (${p.id}), ${map.islands.find(i => i.id === p.island)!.name}` },
      s("path", { class: "country-shape", d: pathOf(p.polygon) }),
      s("text", { class: "country-name", x: p.labelAt[0], y: p.labelAt[1] }, p.name),
    );
    group.addEventListener("click", () => select(p));
    group.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); select(p); }
    });
    countries.append(group);
  }
  svg.append(countries);
  const routes = s("g", { class: "prototype-routes", mask: "url(#prototype-route-mask)", "aria-hidden": "true" });
  for (const [kind, field] of [["border", "borders"], ["sea", "seaLanes"]] as const) {
    const seen = new Set<string>();
    for (const p of map.provinces) for (const id of p[field]) {
      const key = [p.id, id].sort().join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      const q = map.provinces.find(country => country.id === id)!;
      // [designed] Gentle water arcs distinguish crossings from straight land
      // indicators; endpoints remain the true country centres, with full names
      // masked out. Inspected MapView.lane/arrowBetween.
      const [ax, ay] = p.labelAt, [bx, by] = q.labelAt;
      const d = kind === "border" ? `M${ax} ${ay}L${bx} ${by}` : `M${ax} ${ay}Q${(ax + bx) / 2 + (by - ay) * .08} ${(ay + by) / 2 - (bx - ax) * .08} ${bx} ${by}`;
      routes.append(s("path", { "data-connection": kind, "data-from": p.id, "data-to": id, "data-highlighted": "false", d }));
    }
  }
  svg.append(routes);
  // Wait until attached and fonts are loaded. Mask only the label area, leaving
  // both the country paint and each connection's remaining stroke visible.
  void document.fonts.load("600 18px Inter").then(() => document.fonts.ready).then(() => {
    for (const text of svg.querySelectorAll<SVGTextElement>(".country-name, .prototype-island-title")) {
      const b = text.getBBox();
      mask.append(s("rect", { x: b.x - 5, y: b.y - 3, width: b.width + 10, height: b.height + 6, fill: "black" }));
    }
  });
  return svg;
}

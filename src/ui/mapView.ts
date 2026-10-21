import { armyCount, ownerOf } from "../core";
import type { GameMap, GameState, Point, Province } from "../core";
import { s } from "./dom";
import { initial, seatLook } from "./palette";

export interface MapHandlers {
  onProvince(id: string, activation?: { readonly inspect: boolean; readonly repeat: boolean }): void;
  onBackground(): void;
  onHover(id: string | null): void;
}

export interface MapViewState {
  state: GameState;
  selected: string | null;
  target: string | null;
  /** Legal targets from `selected`. */
  targets: readonly string[];
  hover: string | null;
  /** Provinces to flash once (what the last attack changed). */
  flash: readonly string[];
}

const pathOf = (p: Province) => "M" + p.polygon.map(([x, y]) => `${x} ${y}`).join("L") + "Z";

/** Ray casting; the polygon is the province's own, in map coordinates. */
function inside(polygon: readonly Point[], x: number, y: number): boolean {
  let in_ = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i] as Point;
    const [xj, yj] = polygon[j] as Point;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) in_ = !in_;
  }
  return in_;
}

/**
 * The box a province's label occupies (badge above, name below), in map units:
 * its centre and half-sizes. Arrows stop at its edge and markers keep out of it.
 */
function labelBox(p: Province): { cx: number; cy: number; hw: number; hh: number } {
  const [lx, ly] = p.labelAt;
  return { cx: lx, cy: ly + 5.5, hw: Math.max(42, (0.58 * 21 * p.name.length) / 2 + 6), hh: 32.5 };
}

/** The arrow between two label boxes, trimmed to their edges; null when the boxes leave no room for it. */
function arrowBetween(a: Province, b: Province): string | null {
  const A = labelBox(a);
  const B = labelBox(b);
  const dx = B.cx - A.cx;
  const dy = B.cy - A.cy;
  const length = Math.hypot(dx, dy);
  const exit = (box: { hw: number; hh: number }) => Math.min(box.hw / Math.abs(dx || 1e-9), box.hh / Math.abs(dy || 1e-9));
  const margin = 8 / length;
  const t1 = exit(A) + margin;
  const t2 = 1 - exit(B) - margin;
  if ((t2 - t1) * length < 30) return null;
  return `M${A.cx + dx * t1} ${A.cy + dy * t1}L${A.cx + dx * t2} ${A.cy + dy * t2}`;
}

/** Where a legal-target marker fits: inside the province, clear of its label. First fit wins. */
function markerSpot(p: Province): Point | null {
  const [lx, ly] = p.labelAt;
  const box = labelBox(p);
  const R = 17;
  const candidates: Point[] = [
    [lx, ly - 8 - R - 22],
    [lx - box.hw - R - 4, ly - 8],
    [lx + box.hw + R + 4, ly - 8],
    [lx, ly + 38 + R + 4],
  ];
  const ring = Array.from({ length: 8 }, (_, i) => [Math.cos((i * Math.PI) / 4) * (R + 6), Math.sin((i * Math.PI) / 4) * (R + 6)] as const);
  return (
    candidates.find(([x, y]) => inside(p.polygon, x, y) && ring.every(([ox, oy]) => inside(p.polygon, x + ox, y + oy))) ?? null
  );
}

/** The board, as SVG drawn from the province polygons. Built once, updated in place. */
export class MapView {
  readonly el: SVGSVGElement;
  private readonly groups = new Map<string, SVGGElement>();
  private readonly counts = new Map<string, SVGTextElement>();
  private readonly initials = new Map<string, SVGTextElement>();
  private readonly badges = new Map<string, SVGPathElement>();
  private readonly overlay: SVGGElement;

  constructor(
    private readonly map: GameMap,
    private readonly handlers: MapHandlers,
  ) {
    const { x, y, width, height } = map.bounds;
    this.el = s("svg", {
      id: "map",
      viewBox: `${x} ${y} ${width} ${height}`,
      preserveAspectRatio: "xMidYMid meet",
      role: "group",
      "aria-label": `Map of ${map.name}`,
    });
    this.el.append(this.defs(), s("rect", { class: "sea", x: x - 1600, y: y - 1600, width: width + 3200, height: height + 3200 }), this.waves());
    this.el.append(this.seaLanes(), this.shore());

    const provinces = s("g", { class: "provinces" });
    for (const p of map.provinces) provinces.append(this.provinceGroup(p));
    this.overlay = s("g", { class: "overlay", "pointer-events": "none" });
    this.el.append(provinces, this.overlay);

    this.el.addEventListener("click", (event) => {
      if (event.target === this.el || (event.target as Element).classList.contains("sea")) handlers.onBackground();
    });
  }

  private defs(): SVGDefsElement {
    const hatch = s(
      "pattern",
      { id: "hatch", width: 14, height: 14, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" },
      s("rect", { width: 14, height: 14, fill: "none" }),
      s("rect", { width: 5, height: 14, fill: "#000", opacity: 0.28 }),
    );
    const marker = s(
      "marker",
      { id: "arrow", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 5, markerHeight: 5, orient: "auto-start-reverse" },
      s("path", { d: "M0 0L10 5L0 10z", fill: "#fff" }),
    );
    const sea = s(
      "linearGradient",
      { id: "seaGradient", x1: 0, y1: 0, x2: 0, y2: 1 },
      s("stop", { offset: "0", "stop-color": "var(--sea-1)" }),
      s("stop", { offset: "1", "stop-color": "var(--sea-2)" }),
    );
    const shadow = s(
      "filter",
      { id: "land-shadow", x: "-10%", y: "-10%", width: "120%", height: "125%" },
      s("feDropShadow", { dx: 0, dy: 6, stdDeviation: 7, "flood-color": "#00101c", "flood-opacity": 0.45 }),
    );
    return s("defs", {}, hatch, marker, sea, shadow);
  }

  private waves(): SVGGElement {
    const g = s("g", { class: "waves", "aria-hidden": "true" });
    for (let row = -6; row < 18; row++) {
      const y = 40 + row * 78;
      let d = `M-800 ${y}`;
      for (let x = -800; x < 2400; x += 100) d += `q25 -14 50 0t50 0`;
      g.append(s("path", { d, class: "wave" }));
    }
    return g;
  }

  private seaLanes(): SVGGElement {
    const g = s("g", { class: "sea-lanes", "aria-hidden": "true" });
    const seen = new Set<string>();
    for (const p of this.map.provinces) {
      for (const to of p.seaLanes) {
        const key = [p.id, to].sort().join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        const q = this.map.provinces.find((c) => c.id === to);
        if (q) g.append(s("path", { d: this.lane(p, q), class: "lane" }));
      }
    }
    return g;
  }

  /** A shallow arc between two label points. */
  private lane(a: Province, b: Province): string {
    const [x1, y1] = a.labelAt;
    const [x2, y2] = b.labelAt;
    const mx = (x1 + x2) / 2 - (y2 - y1) * 0.12;
    const my = (y1 + y2) / 2 + (x2 - x1) * 0.12;
    return `M${x1} ${y1}Q${mx} ${my} ${x2} ${y2}`;
  }

  /** A wide pale stroke under every polygon: the beach, and a coast where polygons overlap. */
  private shore(): SVGGElement {
    const g = s("g", { class: "shore", filter: "url(#land-shadow)", "aria-hidden": "true" });
    for (const p of this.map.provinces) g.append(s("path", { d: pathOf(p) }));
    return g;
  }

  private provinceGroup(p: Province): SVGGElement {
    const [lx, ly] = p.labelAt;
    // The legacy badge holds an initial and a count side by side: the owner shape is stretched to its 76-unit width.
    const badge = s("path", { class: "badge-shape", d: seatLook(0).badge, transform: "scale(2 1)" });
    const init = s("text", { class: "badge-initial", x: -19, y: 5 });
    const count = s("text", { class: "badge-count", x: 9, y: 8 });
    const group = s(
      "g",
      { class: "province", "data-province": p.id, tabindex: 0, role: "button" },
      s("path", { class: "shape", d: pathOf(p) }),
      s("path", { class: "hatch", d: pathOf(p), fill: "url(#hatch)" }),
      s("g", { class: "badge", transform: `translate(${lx} ${ly - 8})` }, badge, init, count),
      s("text", { class: "name", x: lx, y: ly + 28 }, p.name),
    );
    group.addEventListener("click", (event) => {
      event.stopPropagation();
      this.handlers.onProvince(p.id);
    });
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.handlers.onProvince(p.id);
      }
    });
    group.addEventListener("pointerenter", () => this.handlers.onHover(p.id));
    group.addEventListener("pointerleave", () => this.handlers.onHover(null));
    group.addEventListener("focus", () => this.handlers.onHover(p.id));
    group.addEventListener("blur", () => this.handlers.onHover(null));
    this.groups.set(p.id, group);
    this.counts.set(p.id, count);
    this.initials.set(p.id, init);
    this.badges.set(p.id, badge);
    return group;
  }

  render(view: MapViewState): void {
    const { state } = view;
    const mover = state.players[state.currentPlayer];
    for (const p of this.map.provinces) {
      const group = this.groups.get(p.id) as SVGGElement;
      const owner = ownerOf(state, p.id);
      const seat = state.players.findIndex((pl) => pl.id === owner);
      const armies = armyCount(state, p.id);
      const look = seatLook(seat);
      const isTarget = view.targets.includes(p.id);
      const relevant = view.selected === null || p.id === view.selected || isTarget;

      group.setAttribute("class", `province seat-${seat}${relevant ? "" : " is-dim"}${owner === mover?.id ? " is-mine" : ""}`);
      group.dataset["owner"] = owner;
      group.dataset["armies"] = String(armies);
      group.dataset["target"] = String(isTarget);
      group.dataset["selected"] = String(p.id === view.selected);
      group.style.setProperty("--owner", look.color);
      group.style.setProperty("--owner-dark", look.dark);
      group.setAttribute("aria-label", `${p.name}, held by ${state.players[seat]?.name ?? "nobody"}, ${armies} ${armies === 1 ? "army" : "armies"}`);
      group.setAttribute("aria-pressed", String(p.id === view.selected));
      this.badges.get(p.id)?.setAttribute("d", look.badge);
      const count = this.counts.get(p.id) as SVGTextElement;
      if (count.textContent !== String(armies)) count.textContent = String(armies);
      (this.initials.get(p.id) as SVGTextElement).textContent = initial(owner);
    }
    for (const id of view.flash) {
      const group = this.groups.get(id);
      if (!group) continue;
      group.classList.remove("flash");
      void group.getBoundingClientRect();
      group.classList.add("flash");
    }
    this.renderOverlay(view);
  }

  private renderOverlay(view: MapViewState): void {
    this.overlay.replaceChildren();
    const province = (id: string) => this.map.provinces.find((p) => p.id === id);
    const outline = (id: string, cls: string) => {
      const p = province(id);
      if (p) this.overlay.append(s("path", { d: pathOf(p), class: cls }));
    };
    if (view.hover && view.hover !== view.selected) outline(view.hover, "ov-hover");
    for (const t of view.targets) if (t !== view.target) outline(t, "ov-target");
    if (view.target) outline(view.target, "ov-chosen");
    if (view.selected) outline(view.selected, "ov-selected");

    const from = view.selected ? province(view.selected) : undefined;
    const to = view.target ? province(view.target) : undefined;
    if (from && to) {
      const d = arrowBetween(from, to);
      if (d) this.overlay.append(s("path", { d, class: "ov-arrow", "marker-end": "url(#arrow)" }));
    }
    const tag = (id: string, text: string, cls: string) => {
      const p = province(id);
      if (!p) return;
      const [x, y] = p.labelAt;
      const w = text.length * 11 + 18;
      this.overlay.append(
        s(
          "g",
          { class: `tag ${cls}`, transform: `translate(${x} ${y - 46})` },
          s("rect", { x: -w / 2, y: -13, width: w, height: 26, rx: 13 }),
          s("text", { y: 6 }, text),
        ),
      );
    };
    if (view.selected) tag(view.selected, "FROM", "from");
    if (view.target) tag(view.target, "TARGET", "target");
    for (const t of view.targets) {
      if (t === view.target) continue;
      const p = province(t);
      const spot = p ? markerSpot(p) : null;
      if (!spot) continue;
      this.overlay.append(
        s(
          "g",
          { class: "crosshair", "data-province": t, transform: `translate(${spot[0]} ${spot[1]})` },
          s("circle", { r: 14 }),
          s("path", { d: "M-20 0H-8M8 0H20M0 -20V-8M0 8V20" }),
        ),
      );
    }
  }
}

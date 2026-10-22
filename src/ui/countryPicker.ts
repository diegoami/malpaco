import type {GameState} from "../core";
import {h, s} from "./dom";
import {glyph} from "./icons";
import {seatLook, seatName} from "./palette";

/**
 * T81: the requested Countries card. Every country is reachable by name, by touch and
 * keyboard, independently of the camera: a list of all countries or only the legal
 * candidates, grouped by island; Inspect for a country's full public information;
 * and a named choice when a touch tap could mean more than one country. It reads only
 * public state (map, owners, armies, centres, players), never a hand of cards.
 */
export interface PickerView {
  state: GameState;
  /** Countries the current step can use, in map order; empty when nothing is legal. */
  legal: readonly string[];
  /** What choosing a country does now, e.g. "Place 1 army" or "Choose". */
  verb: string;
}
export interface PickerHandlers {choose(id: string): void; focus(id: string): void; painted?(title: string): void}
type Mode = {kind: "list"; legalOnly: boolean} | {kind: "inspect"; id: string} | {kind: "ask"; ids: string[]};

function chip(seat: number): SVGSVGElement {
  const look = seatLook(seat);
  return s("svg", {class: "country-chip", viewBox: "-20 -20 40 40", width: 22, height: 22, "aria-hidden": "true"},
    s("path", {d: look.badge, fill: "#102b36", stroke: look.color, "stroke-width": 4}));
}

export class CountryPicker {
  readonly el = h("section", {class: "country-picker", "aria-label": "Countries"});
  private mode: Mode = {kind: "list", legalOnly: true};
  private last: PickerView | null = null;

  constructor(private readonly handlers: PickerHandlers) {}

  /** The list (legal candidates first), Inspect for one country, or a named choice between several. */
  showList(): void {this.mode = {kind: "list", legalOnly: (this.last?.legal.length ?? 0) > 0}; this.paint();}
  inspect(id: string): void {this.mode = {kind: "inspect", id}; this.paint();}
  ask(ids: readonly string[]): void {this.mode = {kind: "ask", ids: [...ids]}; this.paint();}
  get title(): string {return this.mode.kind === "inspect" ? "Inspect" : this.mode.kind === "ask" ? "Which country?" : "Countries";}

  render(view: PickerView): void {this.last = view; if (this.el.isConnected) this.paint();}

  private paint(): void {
    const view = this.last;
    if (!view) return;
    const focused = this.el.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset["key"] : undefined;
    this.el.dataset["mode"] = this.mode.kind;
    this.el.replaceChildren(...(this.mode.kind === "inspect" ? this.inspection(view, this.mode.id) : this.mode.kind === "ask" ? this.question(view, this.mode.ids) : this.list(view, this.mode.legalOnly)));
    if (focused) this.el.querySelector<HTMLElement>(`[data-key="${CSS.escape(focused)}"]`)?.focus({preventScroll: true});
    this.handlers.painted?.(this.title);
  }

  private facts(state: GameState, id: string) {
    const p = state.map.provinces.find(x => x.id === id)!, owner = state.ownerOf[id]!, seat = state.players.findIndex(x => x.id === owner);
    return {p, seat, owner: state.players[seat]!, armies: state.armies[id]!, island: state.map.islands.find(i => i.id === p.island)!, centre: state.productionCentres.includes(id)};
  }

  /** One country as a named button that acts now, plus its Inspect icon. */
  private row(view: PickerView, id: string): HTMLElement {
    const f = this.facts(view.state, id), legal = view.legal.includes(id);
    const label = `${f.p.name}, ${seatName(view.state.players, f.owner.id)}, ${f.armies} ${f.armies === 1 ? "army" : "armies"}${f.centre ? ", production centre" : ""}`;
    const choose = h("button", {type: "button", class: "country-row", "data-country-row": id, "data-key": `choose:${id}`, disabled: !legal,
      "aria-label": legal ? `${view.verb}: ${label}` : label, title: legal ? view.verb : "Not available now"},
      chip(f.seat), h("span", {class: "country-row-name"}, f.p.name), ...(f.centre ? [h("span", {class: "country-row-centre", "aria-hidden": "true"}, "★")] : []),
      h("span", {class: "country-row-count"}, String(f.armies)));
    choose.onclick = () => this.handlers.choose(id);
    const look = h("button", {type: "button", class: "card-icon country-inspect", "data-key": `inspect:${id}`, "aria-label": `Inspect ${f.p.name}`, title: `Inspect ${f.p.name}`}, glyph("info"));
    look.onclick = () => this.inspect(id);
    return h("li", {class: "country-item"}, choose, look);
  }

  private list(view: PickerView, legalOnly: boolean): HTMLElement[] {
    const shown = legalOnly && view.legal.length ? new Set(view.legal) : null;
    const toggle = (only: boolean, text: string) => {
      const b = h("button", {type: "button", class: "country-filter", "data-key": `filter:${only}`, "aria-pressed": String(legalOnly === only), disabled: only && !view.legal.length}, text);
      b.onclick = () => {this.mode = {kind: "list", legalOnly: only}; this.paint();};
      return b;
    };
    const groups = view.state.map.islands.map(island => {
      const ids = island.provinces.filter(id => !shown || shown.has(id));
      return ids.length ? h("section", {class: "country-group", "aria-label": island.name},
        h("h3", {class: "country-island"}, island.name, h("span", {class: "country-bonus"}, ` +${island.bonus}`)),
        h("ul", {class: "country-list"}, ...ids.map(id => this.row(view, id)))) : null;
    }).filter((g): g is HTMLElement => g !== null);
    return [h("div", {class: "country-filters", role: "group", "aria-label": "Show"}, toggle(true, `Legal now (${view.legal.length})`), toggle(false, "All")), ...groups];
  }

  private inspection(view: PickerView, id: string): HTMLElement[] {
    const f = this.facts(view.state, id), legal = view.legal.includes(id), lanes = new Set(f.p.seaLanes);
    const neighbour = (n: string) => {
      const b = h("button", {type: "button", class: "country-neighbour", "data-key": `inspect:${n}`}, chip(this.facts(view.state, n).seat), view.state.map.provinces.find(x => x.id === n)!.name, lanes.has(n) ? h("span", {class: "country-by-sea"}, " · by sea") : "");
      b.onclick = () => this.inspect(n);
      return h("li", {}, b);
    };
    const act = (key: string, text: string, shape: string, run: () => void, primary = false, disabled = false) => {
      const b = h("button", {type: "button", class: `card-icon${primary ? " primary" : ""}`, "data-key": key, disabled, "aria-label": text, title: text}, glyph(shape), h("span", {class: "card-icon-caption", "aria-hidden": "true"}, text));
      b.onclick = run;
      return b;
    };
    return [
      h("h3", {class: "country-inspected", id: "inspected-country"}, chip(f.seat), f.p.name),
      h("dl", {class: "country-facts"},
        h("dt", {}, "Owner"), h("dd", {}, seatName(view.state.players, f.owner.id)),
        h("dt", {}, "Armies"), h("dd", {id: "inspected-armies"}, String(f.armies)),
        h("dt", {}, "Island"), h("dd", {}, `${f.island.name} · +${f.island.bonus} when held whole`),
        ...(f.centre ? [h("dt", {}, "Centre"), h("dd", {}, "Production centre")] : [])),
      h("h4", {class: "country-neighbours-title"}, "Neighbours"),
      h("ul", {class: "country-neighbours"}, ...[...f.p.borders, ...f.p.seaLanes].map(neighbour)),
      h("div", {class: "card-icons"},
        act(`act:${id}`, view.verb, "confirm", () => this.handlers.choose(id), true, !legal),
        act(`focus:${id}`, "Focus", "fit", () => this.handlers.focus(id)),
        act("back", "All countries", "menu", () => this.showList())),
    ];
  }

  private question(view: PickerView, ids: string[]): HTMLElement[] {
    return [h("p", {class: "card-line"}, "That tap touched several countries."), h("ul", {class: "country-list"}, ...ids.map(id => this.row(view, id)))];
  }
}

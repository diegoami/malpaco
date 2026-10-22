import type { GameMap } from "../core";
import { s } from "./dom";
import type { MapHandlers, MapViewState } from "./mapView";
import { seatLook, seatName } from "./palette";
import { renderAtlas } from "./prototype/preview";

/** T13 geometry and connections, with gameplay ownership and input handlers. */
export class GeneratedMapView {
  readonly el: SVGSVGElement;

  constructor(map: GameMap, handlers: MapHandlers) {
    this.el = renderAtlas(map, province => handlers.onProvince(province.id));
    for (const group of this.el.querySelectorAll<SVGGElement>("[data-country]")) {
      const id = group.dataset["country"]!;
      group.classList.add("province");
      group.dataset["province"] = id;
      const name = group.querySelector<SVGTextElement>(".country-name")!;
      // [designed] Two 18-unit text rows fit the 54-unit T13 country height.
      // Pinned-image preflight rejected overlapping baselines at both sizes.
      name.setAttribute("y", String(Number(name.getAttribute("y")) - 12));
      group.append(s("text", {
        class: "army-count", x: name.getAttribute("x")!,
        y: Number(name.getAttribute("y")) + 26,
      }));
    }
  }

  render(view: MapViewState): void {
    const { state } = view;
    for (const group of this.el.querySelectorAll<SVGGElement>("[data-country]")) {
      const id = group.dataset["country"]!;
      const seat = state.players.findIndex(player => player.id === state.ownerOf[id]);
      group.dataset["owner"] = state.ownerOf[id]!;
      group.dataset["armies"] = String(state.armies[id]);
      group.dataset["selected"] = String(id === view.selected);
      group.dataset["target"] = String(view.targets.includes(id));
      group.classList.toggle("is-mine", state.ownerOf[id] === state.players[state.currentPlayer]!.id);
      group.setAttribute("aria-pressed", String(id === view.selected));
      const name = state.map.provinces.find(province => province.id === id)!.name;
      group.setAttribute("aria-label", `${name}, ${seatName(state.players, state.ownerOf[id])}, ${state.armies[id]} armies`);
      (group.querySelector(".country-shape") as SVGElement).style.fill = seatLook(seat).color;
      group.querySelector(".army-count")!.textContent = `${seat + 1} · ${state.armies[id]}`;
    }
  }
}

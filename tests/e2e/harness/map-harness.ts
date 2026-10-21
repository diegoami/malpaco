// T87: mounts the real geographic map view on a real generated board, with army counts and
// selection states chosen by the test (stacks over 999 take far too long to reach in play).
import "../../../src/styles.css";
import {createGeographicGame} from "../../../src/core/geographic-game";
import {defaultOptions} from "../../../src/core/options";
import type {AcceptedGeometry} from "../../../src/ui/generatedGeographyPresentation";
import {derivePresentation} from "../../../src/ui/generatedGeographyPresentation";
import {GeographicMapView} from "../../../src/ui/geographicMapView";

export interface Mounted {ids: string[]; names: Record<string, string>}
export function mount(seed: number, armies: Record<string, number>, view: {selected: string | null; target: string | null; targets: string[]}): Mounted {
  const result = createGeographicGame({...defaultOptions(), seed, seats: [{kind: "human"}, {kind: "human"}], computerStrengths: []}, undefined, {}, 2);
  if (!result.ok) throw Error("no board");
  const state = {...result.state, armies: {...result.state.armies, ...armies}};
  const map = new GeographicMapView(state.map, result.geography, {onProvince() {}, onBackground() {}, onHover() {}}, derivePresentation(result.geography as unknown as AcceptedGeometry));
  const board = document.createElement("section");
  board.className = "board";
  board.style.cssText = "position:fixed;inset:0";
  board.append(map.el);
  document.body.append(board);
  map.render({state, ...view, hover: null, flash: []});
  return {ids: state.map.provinces.map(p => p.id), names: Object.fromEntries(state.map.provinces.map(p => [p.id, p.name]))};
}

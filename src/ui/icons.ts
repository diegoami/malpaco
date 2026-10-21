// Original inline-SVG action glyphs (owner, #222 Q7), shared by the shell and its cards.
import {h,s} from "./dom";

const PATHS: Record<string, string> = {
  menu: "M4 6H20M4 12H20M4 18H20",
  cards: "M7 5H20V21H7ZM3 17V2H16",
  info: "M12 11V17M12 7V7.1",
  close: "M5 5L19 19M19 5L5 19",
  play: "M6 3L21 12 6 21Z",
  pause: "M8 4V20M16 4V20",
  flag: "M5 21V3M5 4H18L15 8.5 18 13H5",
  move: "M3 7H21M16 2L21 7 16 12M21 17H3M8 12L3 17 8 22",
  combat: "M4 3L20 19M3 4L4 8 16 20M3 16L8 21M20 3L4 19M21 4L20 8 8 20M16 21L21 16",
  attack: "M4 3L20 19M3 4L4 8 16 20M3 16L8 21M20 3L4 19M21 4L20 8 8 20M16 21L21 16",
  "fight-on": "M5 6L11 12 5 18M12 6L18 12 12 18",
  stop: "M8 12V6.5a1.5 1.5 0 0 1 3 0V11M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V5.5a1.5 1.5 0 0 1 3 0V12.5M17 12.5V9a1.5 1.5 0 0 1 3 0V14c0 4-3 7-7 7c-3 0-5-1.5-6.5-4L4.2 13.6a1.5 1.5 0 0 1 2.6-1.5L8 14",
  pool: "M12 3V9M8 12H16M6 16H18M4 20H20",
  fold: "M5 9L12 16 19 9",
  return: "M6 7L12 13 18 7M5 18H19",
  settings: "M4 7H20M4 17H20M9 4V10M15 14V20",
  fit: "M4 4L10 10M4 4V9M4 4H9M20 4L14 10M20 4V9M20 4H15M4 20L10 14M4 20V15M4 20H9M20 20L14 14M20 20V15M20 20H15",
  minus: "M5 12H19",
  plus: "M12 5V19M5 12H19",
  confirm: "M5 12.5L10 17.5 19 7",
  watch: "M2 12C5 6 19 6 22 12C19 18 5 18 2 12ZM12 9A3 3 0 1 0 12 15A3 3 0 1 0 12 9",
  "new-game": "M6 3H14L19 8V21H6ZM14 3V8H19M12.5 11V17M9.5 14H15.5",
  standings: "M4 20H20M7 16V11M12 16V7M17 16V13",
  history: "M3 12A9 9 0 1 0 6 5.3M3 4V9H8M12 7V12L15 14",
  files: "M3 6H9L11 8H21V19H3ZM12 11V16M9.5 13.5L12 16 14.5 13.5",
  skip: "M5 5L15 12 5 19ZM19 5V19",
  countries: "M10 6H20M10 12H20M10 18H20M4.5 6V6.1M4.5 12V12.1M4.5 18V18.1",
};

export function glyph(shape: string): SVGSVGElement {
  return s("svg", {class: "game-action-symbol", viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true"},
    s("path", {d: PATHS[shape] ?? PATHS["info"]!}));
}

/**
 * A card control after the sketches: an icon with a short caption beneath. The
 * accessible name is the full action, so a terse caption never loses meaning.
 */
export function iconButton(id: string, name: string, caption: string | null, shape: string, disabled: boolean, click: () => void, primary = false): HTMLButtonElement {
  const button = h("button", {id, type: "button", class: `card-icon${primary ? " primary" : ""}`, disabled, "aria-label": name, title: name}, glyph(shape), ...(caption ? [h("span", {class: "card-icon-caption", "aria-hidden": "true"}, caption)] : []));
  button.addEventListener("click", click);
  return button;
}

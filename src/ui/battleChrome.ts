import {h,s} from "./dom";
import {seatLook} from "./palette";

export type Surface = "actions" | "cards" | "details" | "settings" | "phase";
/** What the status chips show: the active seat, the phase and, during placement, the pool. */
export interface ShellStatus {seat: number; name: string; phase: string; round: number | null; pool: number | null; explanation: string}

function symbol(shape: string): SVGSVGElement {
  const paths: Record<string,string> = {
    "⚔": "M4 3L20 19M3 4L4 8 16 20M3 16L8 21M20 3L4 19M21 4L20 8 8 20M16 21L21 16",
    "▱": "M7 5H20V21H7ZM3 17V2H16", "ⓘ": "M12 11V17M12 7V7.1",
    "⚙": "M9 3H15L16 6 19 7 21 12 19 17 16 18 15 21H9L8 18 5 17 3 12 5 7 8 6ZM12 8A4 4 0 1 0 12 16A4 4 0 1 0 12 8",
    "!": "M12 6V13M12 17V17.1", "×": "M5 5L19 19M19 5L5 19",
    "▶": "M6 3L21 12 6 21Z", "↦": "M3 12H17M12 6L18 12 12 18M21 4V20",
    "⇄": "M3 7H21M16 2L21 7 16 12M21 17H3M8 12L3 17 8 22",
    "■": "M5 5H19V19H5Z", "⚀": "M4 4H20V20H4ZM12 11.5V12.5",
    "Ⅱ": "M8 4V20M16 4V20", "≡": "M8 6H21M8 12H21M8 18H21M3 6H3.1M3 12H3.1M3 18H3.1",
    "Σ": "M18 4H6L13 12 6 20H18", "✚": "M12 4V20M4 12H20",
    "◷": "M12 7V12L15 15",
  };
  const svg = s("svg", {class:"game-action-symbol", viewBox:"0 0 24 24", width:20, height:20, fill:"none", stroke:"currentColor", "stroke-width":1.8, "stroke-linecap":"round", "stroke-linejoin":"round", "aria-hidden":"true"}, s("path", {d:paths[shape] ?? paths["ⓘ"]!}));
  if (shape === "ⓘ" || shape === "!" || shape === "◷") svg.prepend(s("circle", {cx:12, cy:12, r:10}));
  return svg;
}

function commandSymbol(button: HTMLButtonElement, shape: string): void {
  button.querySelector(".rail-command-icon")?.remove();
  const svg = symbol(shape); svg.classList.add("rail-command-icon"); button.append(svg);
}

function icon(id: string, label: string, shape: string): HTMLButtonElement {
  return h("button", {id, type: "button", class: "game-icon", "aria-label": label, title: label},
    symbol(shape));
}

const TITLES: Record<Surface, string> = {actions: "Current choice", cards: "Cards", details: "Totals and history", settings: "Game settings", phase: "Phase details"};

/**
 * The full-viewport shell (T79): the map fills the safe viewport; status chips,
 * the icon rail, the camera controls and one requested card float over it in
 * disjoint grid areas, so no overlay covers another. Panel content waits in a
 * hidden store and travels, with its existing listeners, into the card on request.
 */
export class BattleChrome {
  readonly overlay = h("div", {class: "game-overlay"});
  readonly hud = h("div", {id: "game-status", class: "game-hud", role: "group", "aria-label": "Game status"});
  readonly rail = h("nav", {id: "battle-action-rail", role: "toolbar", "aria-label": "Game actions"});
  readonly drawer = h("section", {id: "game-focus-drawer", role: "dialog", "aria-modal": "false", "aria-labelledby": "game-drawer-title", hidden: true});
  private readonly seat = h("div", {id: "active-seat-notice", class: "hud-chip", role: "status"});
  private readonly phase = h("button", {id: "phase-details-button", type: "button", class: "hud-chip", "aria-haspopup": "dialog", "aria-controls": "game-focus-drawer"});
  private readonly pool = h("div", {id: "placement-pool", class: "hud-chip", role: "status", hidden: true});
  private readonly explanation = h("p", {id: "phase-explanation", class: "phase-explanation"});
  private readonly title = h("h2", {id: "game-drawer-title"});
  private readonly content = h("div", {class: "game-drawer-content"});
  private readonly required = icon("open-required-action", "Required choice", "!");
  private readonly actions = icon("open-game-actions", "Current choice", "⚔");
  private surface: Surface | null = null;
  private opener: HTMLElement | null = null;
  private moved: {node: HTMLElement; marker: Comment}[] = [];
  private battleCommands: {node: HTMLElement; marker: Comment} | null = null;
  private historyPosition: {top: number; following: boolean} | null = null;
  private lastRequired: string | null = null;

  constructor(private readonly nodes: {action: HTMLElement; cards: HTMLElement; history: HTMLElement; score: HTMLElement; settings: HTMLElement; turn: HTMLElement; phaseActions: HTMLElement; battle: HTMLElement; pause: HTMLButtonElement; log: HTMLButtonElement; camera?: HTMLElement}) {
    const cards = icon("open-game-cards", "Cards", "▱");
    const details = icon("open-game-details", "Totals and history", "Σ");
    const settings = icon("open-game-settings", "Game settings and files", "⚙");
    for (const [button, surface] of [[this.actions, "actions"], [cards, "cards"], [details, "details"], [settings, "settings"], [this.phase, "phase"]] as const) {
      button.setAttribute("aria-controls", this.drawer.id);
      button.setAttribute("aria-haspopup", "dialog");
      button.onclick = () => this.open(surface, button);
    }
    this.required.hidden = true;
    this.required.onclick = () => this.open("actions", this.required);
    const close = icon("close-game-drawer", "Return to map", "×");
    close.onclick = () => this.close();
    this.drawer.append(h("header", {class: "game-drawer-head"}, this.title, close), this.content);
    this.rail.append(this.required, this.actions, cards, details, settings, nodes.pause, nodes.log);
    this.rail.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const buttons = [...this.rail.querySelectorAll<HTMLButtonElement>("button")].filter(button => !button.disabled && button.getClientRects().length > 0);
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
      const index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + step + buttons.length) % buttons.length;
      buttons[index]?.focus({preventScroll:true}); event.preventDefault();
    });
    this.hud.append(this.seat, this.phase, this.pool);
    this.overlay.append(this.hud, ...(nodes.camera ? [nodes.camera] : []), this.drawer, this.rail);
    this.commands();
  }

  /** Phase and battle commands ride the rail as icons; disabled ones are not shown. */
  private commands(): void {
    const focused = this.rail.contains(document.activeElement) ? document.activeElement?.id : undefined;
    if (this.battleCommands && !this.battleCommands.marker.isConnected) {
      this.battleCommands.node.remove(); this.battleCommands = null;
    }
    if (this.nodes.phaseActions.parentElement !== this.rail) this.rail.insertBefore(this.nodes.phaseActions, this.actions);
    const battle = this.nodes.battle.querySelector<HTMLElement>(".battle-actions");
    if (battle) {
      const marker = document.createComment("battle commands home"); battle.before(marker);
      this.battleCommands = {node: battle, marker}; this.rail.insertBefore(battle, this.actions);
    }
    if (this.battleCommands) this.battleCommands.node.hidden = this.nodes.battle.hidden || this.nodes.battle.dataset["pendingCapture"] === "true";
    const symbols: Record<string,string> = {"start-combat-button":"▶", "end-turn-button":"↦", "start-friendly-move-button":"⇄", "fight-on-button":"⚔", "stop-battle-button":"■", "single-exchange-button":"⚀"};
    for (const group of [this.nodes.phaseActions, this.battleCommands?.node]) {
      for (const button of group?.querySelectorAll<HTMLButtonElement>("button") ?? []) {
        if (!button.querySelector(".rail-command-icon")) {
          button.setAttribute("aria-label", button.textContent ?? ""); button.title = button.textContent ?? "";
          commandSymbol(button, symbols[button.id] ?? "ⓘ");
        }
      }
    }
    if (focused) this.focus(this.rail.querySelector<HTMLElement>(`#${focused}`), this.actions);
  }

  private rememberHistory(): void {
    const log = this.nodes.history.querySelector<HTMLElement>(".log")!;
    if (log.getClientRects().length) this.historyPosition = {top: log.scrollTop, following: log.scrollHeight - log.clientHeight - log.scrollTop <= 1};
  }

  private restoreHistory(): void {
    const log = this.nodes.history.querySelector<HTMLElement>(".log")!;
    if (this.historyPosition && log.getClientRects().length) log.scrollTop = this.historyPosition.following ? log.scrollHeight : this.historyPosition.top;
  }

  get openSurface(): Surface | null {return this.surface;}

  /** Opens a card over the map. An automatic opening (a new required choice) never takes focus. */
  open(surface: Surface, opener: HTMLElement, takeFocus = true): void {
    if (this.surface === surface) {this.close(); return;}
    this.close(false);
    this.surface = surface; this.opener = opener;
    this.drawer.dataset["surface"] = surface;
    this.title.textContent = TITLES[surface];
    const nodes = {actions: [this.nodes.action], cards: [this.nodes.cards], details: [this.nodes.score, this.nodes.history], settings: [this.nodes.settings], phase: [this.nodes.turn, this.explanation]}[surface];
    for (const node of nodes) {
      const marker = document.createComment("focused panel home"); node.before(marker);
      this.moved.push({node, marker}); this.content.append(node);
    }
    this.drawer.hidden = false;
    for (const button of [this.actions, this.phase, ...this.rail.querySelectorAll<HTMLElement>("[aria-haspopup]")])
      button.setAttribute("aria-expanded", String(button.getAttribute("aria-controls") === this.drawer.id && button === opener));
    this.restoreHistory();
    if (takeFocus) this.drawer.querySelector<HTMLElement>("#close-game-drawer")!.focus({preventScroll: true});
  }

  close(restoreFocus = true): void {
    if (!this.surface) return;
    this.rememberHistory();
    for (const {node, marker} of this.moved) {marker.replaceWith(node);}
    this.moved = []; this.drawer.hidden = true; this.surface = null;
    for (const button of this.overlay.querySelectorAll<HTMLElement>("[aria-expanded]")) button.setAttribute("aria-expanded", "false");
    if (restoreFocus) this.focus(this.opener, this.actions);
    this.opener = null;
  }

  private focus(control: HTMLElement | null, fallback: HTMLElement): void {
    (control?.isConnected && control.getClientRects().length && !control.hasAttribute("disabled") ? control : fallback).focus({preventScroll:true});
  }

  escape(): boolean {
    if (!this.surface) return false;
    this.close(); return true;
  }

  /** `prompt` allows a new required choice to open the Current choice card without taking focus. */
  update(status: ShellStatus, required: string | null, paused: boolean, prompt: boolean): void {
    const look = seatLook(status.seat);
    this.seat.replaceChildren(s("svg", {class: "chip", viewBox: "-40 -19 80 38", width: 32, height: 16, "aria-hidden": "true"}, s("path", {d: look.badge, fill: look.color, stroke: look.dark, "stroke-width": 3})),
      h("span", {class: "hud-text"}, status.name));
    this.seat.setAttribute("aria-label", `Active seat: ${status.name}`);
    const phaseName = status.round === null ? status.phase : `${status.phase} · Round ${status.round}`;
    this.phase.replaceChildren(symbol("◷"), h("span", {class: "hud-text"}, status.phase));
    this.phase.setAttribute("aria-label", `Phase details: ${phaseName}`);
    this.phase.title = `Phase details: ${phaseName}`;
    this.explanation.textContent = status.explanation;
    this.pool.hidden = status.pool === null;
    this.pool.replaceChildren(symbol("✚"), h("span", {id: "placement-pool-count", class: "hud-text"}, String(status.pool ?? 0)));
    this.pool.setAttribute("aria-label", `${status.pool ?? 0} ${status.pool === 1 ? "army" : "armies"} to place`);
    this.pool.title = this.pool.getAttribute("aria-label")!;
    this.required.hidden = !required;
    this.required.title = required ?? "Required choice";
    this.required.setAttribute("aria-label", required ?? "Required choice");
    this.nodes.pause.title = paused ? "Resume game" : "Pause game";
    commandSymbol(this.nodes.pause, paused ? "▶" : "Ⅱ");
    this.nodes.log.title = "Game event log";
    commandSymbol(this.nodes.log, "≡");
    const cardsButton = this.rail.querySelector<HTMLButtonElement>("#open-game-cards")!;
    cardsButton.hidden = !!this.nodes.cards.hidden;
    this.commands();
    if (required && required !== this.lastRequired && prompt && !this.surface) this.open("actions", this.required, false);
    this.lastRequired = required;
  }

  dispose(): void {this.close(false); this.battleCommands?.marker.replaceWith(this.battleCommands.node); this.overlay.remove();}
}

import {h,s} from "./dom";
import {glyph} from "./icons";
import {seatLook} from "./palette";

export type Surface = "actions" | "cards" | "menu" | "info";
/** What the quiet map shows: an optional one-line notice, the pool during placement, and requested information. */
export interface ShellStatus {seat: number; notice: string | null; pool: number | null; info: string; explanation: string; result: boolean}

const symbol = glyph;

function commandSymbol(button: HTMLButtonElement, shape: string): void {
  button.querySelector(".rail-command-icon")?.remove();
  const svg = symbol(shape); svg.classList.add("rail-command-icon"); button.append(svg);
}

function icon(id: string, label: string, shape: string): HTMLButtonElement {
  return h("button", {id, type: "button", class: "game-icon", "aria-label": label, title: label},
    symbol(shape));
}

const TITLES: Record<Surface, string> = {actions: "Current choice", cards: "Cards", menu: "Menu", info: "Objective and phase"};

/**
 * The quiet full-viewport shell (T79, made sketch-faithful by T92): the map fills
 * the safe viewport and only corner icons rest on it — menu and Cards top-left,
 * Pause top-right, the camera's Fit bottom-left, and the legal phase actions with
 * the information icon bottom-right. The pool is an icon and a number at top
 * centre. One-line notices and one requested card appear beside the map and go
 * away. Every overlay sits in its own grid area, so none covers another. Panel
 * content waits in a hidden store and travels, with its listeners, into the card.
 */
export class BattleChrome {
  readonly overlay = h("div", {class: "game-overlay"});
  readonly hud = h("div", {id: "game-status", class: "game-corner game-corner-start", role: "group", "aria-label": "Game menu"});
  readonly rail = h("nav", {id: "battle-action-rail", role: "toolbar", "aria-label": "Game actions"});
  readonly drawer = h("section", {id: "game-focus-drawer", role: "dialog", "aria-modal": "false", "aria-labelledby": "game-drawer-title", hidden: true});
  readonly side = h("div", {class: "game-side"});
  private readonly top = h("div", {class: "game-corner game-corner-end"});
  private readonly poolSlot = h("div", {class: "game-pool-slot"});
  private readonly notice = h("div", {id: "active-seat-notice", class: "game-notice", role: "status", hidden: true});
  private readonly pool = h("div", {id: "placement-pool", class: "hud-chip", role: "status", hidden: true});
  private readonly folded = h("div", {id: "game-folded-choice", class: "game-notice game-folded", hidden: true});
  private readonly foldedText = h("span", {class: "game-notice-text"});
  private readonly infoLine = h("p", {id: "game-info-line", class: "game-info-line"});
  private readonly explanation = h("p", {id: "phase-explanation", class: "phase-explanation"});
  private readonly title = h("h2", {id: "game-drawer-title", class: "visually-hidden"});
  private readonly content = h("div", {class: "game-drawer-content"});
  private readonly closeButton = icon("close-game-drawer", "Return to map", "close");
  private readonly required = icon("open-required-action", "Required choice", "return");
  private readonly menu = icon("open-game-menu", "Menu: totals, history, settings and files", "menu");
  private readonly info = icon("game-info-button", "Objective and phase", "info");
  private surface: Surface | null = null;
  private opener: HTMLElement | null = null;
  private moved: {node: HTMLElement; marker: Comment}[] = [];
  private historyPosition: {top: number; following: boolean} | null = null;
  private lastPrompt: string | null = null;
  private statusKey = "";
  private result = false;
  private requiredText: string | null = null;

  constructor(private readonly nodes: {action: HTMLElement; cards: HTMLElement; history: HTMLElement; score: HTMLElement; settings: HTMLElement; phaseActions: HTMLElement; pause: HTMLButtonElement; camera?: HTMLElement}) {
    const cards = icon("open-game-cards", "Cards", "cards");
    for (const [button, surface] of [[this.menu, "menu"], [cards, "cards"], [this.info, "info"]] as const) {
      button.setAttribute("aria-controls", this.drawer.id);
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-expanded", "false");
      button.onclick = () => this.open(surface, button);
    }
    // The required choice is never toggled away: when its card is open, the icon moves focus into it.
    this.required.onclick = () => {
      if (this.surface === "actions") {this.opener = this.required; this.closeButton.focus({preventScroll: true});}
      else this.open("actions", this.required);
    };
    this.closeButton.onclick = () => this.close();
    this.drawer.append(this.title, this.content, this.closeButton);
    this.folded.append(this.foldedText, this.required);
    this.hud.append(this.menu, cards);
    this.top.append(nodes.pause);
    this.poolSlot.append(this.pool);
    this.rail.append(this.info, nodes.phaseActions);
    this.rail.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const buttons = [...this.rail.querySelectorAll<HTMLButtonElement>("button")].filter(button => !button.disabled && button.getClientRects().length > 0);
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
      const index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + step + buttons.length) % buttons.length;
      buttons[index]?.focus({preventScroll:true}); event.preventDefault();
    });
    this.side.append(this.notice, this.folded, this.drawer);
    // The information card's lines need a home to return to when the card closes.
    this.overlay.append(h("div", {class: "game-info-store", hidden: true}, this.infoLine, this.explanation));
    this.overlay.append(this.hud, this.poolSlot, this.top, this.side, ...(nodes.camera ? [nodes.camera] : []), this.rail);
    this.commands();
  }

  /** Legal phase commands ride the action corner as icons; disabled ones are not shown. */
  private commands(): void {
    const symbols: Record<string,string> = {"start-combat-button":"combat", "end-turn-button":"flag", "start-friendly-move-button":"move"};
    for (const button of this.nodes.phaseActions.querySelectorAll<HTMLButtonElement>("button")) {
      if (!button.querySelector(".rail-command-icon")) {
        button.setAttribute("aria-label", button.textContent ?? ""); button.title = button.textContent ?? "";
        commandSymbol(button, symbols[button.id] ?? "info");
      }
    }
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

  /** The result card's History and Files icons open the menu card. */
  openMenu(): void {if (this.surface !== "menu") this.open("menu", this.menu);}

  /** Everything that floats over the map; the camera frames the board beside each one that shows. */
  get obstacles(): Element[] {return [this.hud, this.top, this.pool, this.rail, this.notice, this.folded, this.drawer];}

  /** Opens a card over the map. An automatic opening (a new choice) never takes focus. */
  open(surface: Surface, opener: HTMLElement, takeFocus = true): void {
    if (this.surface === surface) {this.close(); return;}
    this.close(false);
    this.surface = surface; this.opener = opener;
    this.drawer.dataset["surface"] = surface;
    this.title.textContent = TITLES[surface];
    const nodes = {actions: [this.nodes.action], cards: [this.nodes.cards], menu: [this.nodes.score, this.nodes.history, this.nodes.settings], info: [this.infoLine, this.explanation]}[surface];
    for (const node of nodes) {
      const marker = document.createComment("focused panel home"); node.before(marker);
      this.moved.push({node, marker}); this.content.append(node);
    }
    this.drawer.hidden = false;
    this.layout();
    for (const button of this.overlay.querySelectorAll<HTMLElement>("[aria-haspopup]")) button.setAttribute("aria-expanded", String(button === opener));
    this.restoreHistory();
    if (takeFocus) this.closeButton.focus({preventScroll: true});
  }

  close(restoreFocus = true): void {
    if (!this.surface) return;
    this.rememberHistory();
    for (const {node, marker} of this.moved) {marker.replaceWith(node);}
    this.moved = []; this.drawer.hidden = true; this.surface = null;
    for (const button of this.overlay.querySelectorAll<HTMLElement>("[aria-haspopup]")) button.setAttribute("aria-expanded", "false");
    this.layout();
    if (restoreFocus) this.focus(this.opener, this.menu);
    this.opener = null;
  }

  private focus(control: HTMLElement | null, fallback: HTMLElement): void {
    (control?.isConnected && control.getClientRects().length && !control.hasAttribute("disabled") ? control : fallback).focus({preventScroll:true});
  }

  escape(): boolean {
    if (!this.surface) return false;
    this.close(); return true;
  }

  /** The result card sits in the middle; a folded required choice leaves a one-line card with a return icon. */
  private layout(): void {
    const actions = this.surface === "actions";
    this.drawer.dataset["placement"] = actions && this.result ? "center" : "side";
    // A choice card folds back to the map; every other card simply closes.
    commandSymbol(this.closeButton, actions && this.requiredText ? "fold" : "close");
    this.closeButton.querySelector(".game-action-symbol:not(.rail-command-icon)")?.remove();
    this.folded.hidden = !this.requiredText || actions;
  }

  /** `prompt` names a choice that wants its card; a new one opens Current choice without taking focus. */
  update(status: ShellStatus, required: string | null, paused: boolean, prompt: string | null): void {
    // Live regions are rewritten only when what they say changes, so nothing is re-announced.
    const key = JSON.stringify(status);
    if (key !== this.statusKey) {this.statusKey = key; this.status(status);}
    this.requiredText = required;
    this.foldedText.textContent = required ?? "";
    this.required.title = required ?? "Required choice";
    this.required.setAttribute("aria-label", required ? `Return to ${required.toLowerCase()}` : "Required choice");
    this.nodes.pause.title = paused ? "Resume game" : "Pause game";
    commandSymbol(this.nodes.pause, paused ? "play" : "pause");
    const cardsButton = this.hud.querySelector<HTMLButtonElement>("#open-game-cards")!;
    cardsButton.hidden = !!this.nodes.cards.hidden;
    this.commands();
    if (prompt && prompt !== this.lastPrompt && !this.surface) this.open("actions", this.required, false);
    this.lastPrompt = prompt;
    this.layout();
  }

  private status(status: ShellStatus): void {
    this.result = status.result;
    const look = seatLook(status.seat);
    this.notice.hidden = status.notice === null;
    this.notice.replaceChildren(s("svg", {class: "chip", viewBox: "-40 -19 80 38", width: 30, height: 15, "aria-hidden": "true"}, s("path", {d: look.badge, fill: look.color, stroke: look.dark, "stroke-width": 3})),
      h("span", {class: "game-notice-text"}, status.notice ?? ""));
    this.infoLine.textContent = status.info;
    this.explanation.textContent = status.explanation;
    this.pool.hidden = status.pool === null;
    this.pool.replaceChildren(symbol("pool"), h("span", {id: "placement-pool-count"}, String(status.pool ?? 0)));
    this.pool.setAttribute("aria-label", `${status.pool ?? 0} ${status.pool === 1 ? "army" : "armies"} to place`);
    this.pool.title = this.pool.getAttribute("aria-label")!;
  }

  dispose(): void {this.close(false); this.overlay.remove();}
}

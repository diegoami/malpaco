import {h,s} from "./dom";
import {glyph} from "./icons";
import {seatLook} from "./palette";

export type Surface = "actions" | "cards" | "menu" | "info" | "countries";
/** What the quiet map shows: an optional one-line notice, the pool during placement, and requested information. */
/** A one-line notice; `persistent` ones (refusals, folded choices) never fade, only dismiss. */
export interface Notice {title: string; detail?: string; persistent?: boolean; action?: NoticeAction}
/** One icon on the notice itself (T84): Fast-forward during computer play, Changes on a human turn. */
export interface NoticeAction {id: string; label: string; shape: string; run: () => void}
export interface ShellStatus {seat: number; notice: Notice | null; pool: number | null; info: string; explanation: string; result: boolean}

const symbol = glyph;

function commandSymbol(button: HTMLButtonElement, shape: string): void {
  button.querySelector(".rail-command-icon")?.remove();
  const svg = symbol(shape); svg.classList.add("rail-command-icon"); button.append(svg);
}

function icon(id: string, label: string, shape: string): HTMLButtonElement {
  return h("button", {id, type: "button", class: "game-icon", "aria-label": label, title: label},
    symbol(shape));
}

/** [designed] An ordinary notice fades after 4 s; a swipe beyond 40 px dismisses it. */
const NOTICE_FADE_MS = 4000;
const NOTICE_SWIPE = 40;

const TITLES: Record<Surface, string> = {actions: "Current choice", cards: "Cards", menu: "Menu", info: "Objective and phase", countries: "Countries"};

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
  /** The notice's line is reserved whether or not a notice shows, so a notice never covers a country nor reframes the map; it never decides the map's quarter turn. */
  private readonly noticeSlot = h("div", {class: "game-notice-slot", "data-camera-turn-ignore": ""}, this.notice);
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
  /** T81: every country by name, Inspect and a named choice for ambiguous taps. */
  readonly countries = icon("open-countries", "Countries: list and inspect", "countries");
  private readonly cornerClose = icon("close-result-card", "Return to map", "close");
  private notified: Notice | null = null;
  /** The notice on show, the one the player dismissed (or that faded), and its fade timer. */
  private noticeKey: string | null = null;
  private dismissedKey: string | null = null;
  private noticeOpen = false;
  private fadeTimer: number | null = null;
  private noticeShown = "";
  private surface: Surface | null = null;
  private opener: HTMLElement | null = null;
  private moved: {node: HTMLElement; marker: Comment}[] = [];
  private historyPosition: {top: number; following: boolean} | null = null;
  private lastPrompt: string | null = null;
  private statusKey = "";
  private result = false;
  private requiredText: string | null = null;
  /** The folded choice waits on a map tap (a Raid target), not on its card. */
  private selecting = false;

  constructor(private readonly nodes: {action: HTMLElement; cards: HTMLElement; history: HTMLElement; score: HTMLElement; settings: HTMLElement; phaseActions: HTMLElement; pause: HTMLButtonElement; camera?: HTMLElement; countries?: HTMLElement}) {
    for (const [button, surface] of [[this.menu, "menu"], [this.info, "info"], [this.countries, "countries"]] as const) {
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
    this.hud.append(this.menu);
    // Countries is a way to find a country, so it rests with the camera's Fit and Focus.
    if (nodes.countries) (nodes.camera ?? this.hud).append(this.countries);
    // On the result card the top-right corner returns to the map, as in the sketches.
    this.cornerClose.onclick = () => this.close();
    this.top.append(nodes.pause, this.cornerClose);
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
    this.notice.addEventListener("pointerdown", this.onNoticeDown);
    this.side.append(this.noticeSlot, this.folded, this.drawer);
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

  /**
   * The controls and cards that float over the map; the camera frames the board beside
   * each one that shows. The notice's slot is always there, so a notice coming or going
   * never refits or turns the board.
   */
  get obstacles(): Element[] {return [this.hud, this.top, this.pool, this.noticeSlot, this.rail, this.folded, this.drawer];}

  /** Opens a card over the map. An automatic opening (a new choice) never takes focus. */
  open(surface: Surface, opener: HTMLElement, takeFocus = true): void {
    if (this.surface === surface) {this.close(); return;}
    this.close(false);
    this.surface = surface; this.opener = opener;
    this.drawer.dataset["surface"] = surface;
    this.title.textContent = TITLES[surface];
    // The menu holds the hand too (the sketches rest only the menu icon top-left).
    const nodes = {actions: [this.nodes.action], cards: [this.nodes.cards], menu: [this.nodes.cards, this.nodes.score, this.nodes.history, this.nodes.settings], info: [this.infoLine, this.explanation], countries: this.nodes.countries ? [this.nodes.countries] : []}[surface];
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

  /** A card whose content changes kind (the Countries card's list, Inspect or question) renames itself. */
  retitle(text: string): void {if (this.surface) this.title.textContent = text;}

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
    const actions = this.surface === "actions", center = actions && this.result;
    this.drawer.dataset["placement"] = center ? "center" : "side";
    // The result card rests over the whole map, which is not reframed beside it.
    this.drawer.toggleAttribute("data-camera-ignore", center);
    this.cornerClose.hidden = !center;
    this.nodes.pause.hidden = center;
    // A choice card folds back to the map; every other card simply closes.
    commandSymbol(this.closeButton, actions && this.requiredText ? "fold" : "close");
    this.closeButton.querySelector(".game-action-symbol:not(.rail-command-icon)")?.remove();
    this.folded.hidden = !this.requiredText || actions;
    this.renderNotice();
  }

  /**
   * A folded choice says so; otherwise the host's contextual notice, if any. The notice
   * is a slim one-line pill (owner, 2026-10-21): a tap shows its hint, a swipe or × dismisses
   * it until the next new notice, and an ordinary one fades after [designed] 4 s. Refusals and
   * folded choices persist until dismissed or acted on (U5: nothing required times out).
   */
  private renderNotice(): void {
    const notice: Notice | null = this.folded.hidden ? this.notified
      : this.selecting ? {title: "Tap a highlighted country on the map.", detail: "Or choose one from the Countries list beside Fit.", persistent: true}
      : {title: "Choice folded, not completed.", detail: "Tap the gold return icon to resume.", persistent: true};
    const key = notice ? `${notice.title}|${notice.detail ?? ""}|${notice.action?.id ?? ""}` : null;
    if (key !== this.noticeKey) {
      this.noticeKey = key; this.noticeOpen = false;
      if (this.fadeTimer !== null) window.clearTimeout(this.fadeTimer);
      this.fadeTimer = null;
      if (notice && !notice.persistent && key !== this.dismissedKey) this.fadeTimer = window.setTimeout(() => this.dismissNotice(), NOTICE_FADE_MS);
    }
    this.notice.hidden = !notice || key === this.dismissedKey;
    this.notice.dataset["fading"] = String(this.fadeTimer !== null && !this.noticeOpen);
    this.notice.dataset["open"] = String(this.noticeOpen);
    // Rebuilt only when what it shows changes, so the live region is not re-announced.
    const shown = `${key}|${this.noticeOpen}|${this.notice.hidden}`;
    if (shown === this.noticeShown) return;
    this.noticeShown = shown;
    if (!notice) {this.notice.replaceChildren(); return;}
    const dismiss = icon("dismiss-notice", "Dismiss notice", "close");
    dismiss.onclick = event => {event.stopPropagation(); this.dismissNotice();};
    const action = notice.action, extra: HTMLElement[] = [];
    if (action) {const b = icon(action.id, action.label, action.shape); b.onclick = event => {event.stopPropagation(); action.run();}; extra.push(b);}
    this.notice.replaceChildren(h("strong", {class: "game-notice-title"}, notice.title), ...extra, dismiss,
      ...(notice.detail ? [h("span", {class: this.noticeOpen ? "game-notice-detail" : "visually-hidden"}, notice.detail)] : []));
  }

  private dismissNotice(): void {
    if (this.fadeTimer !== null) window.clearTimeout(this.fadeTimer);
    this.fadeTimer = null; this.dismissedKey = this.noticeKey; this.renderNotice();
  }

  /** Tap: show the hint (and stop the fade). Swipe sideways or up: dismiss. */
  private readonly onNoticeDown = (down: PointerEvent) => {
    if ((down.target as Element).closest("#dismiss-notice, .game-notice > button")) return;
    const start = {x: down.clientX, y: down.clientY};
    const move = (event: PointerEvent) => {this.notice.style.translate = `${event.clientX - start.x}px ${Math.min(0, event.clientY - start.y)}px`;};
    const up = (event: PointerEvent) => {
      window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); window.removeEventListener("pointercancel", up);
      this.notice.style.translate = "";
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (event.type !== "pointercancel" && (Math.abs(dx) > NOTICE_SWIPE || dy < -NOTICE_SWIPE)) {this.dismissNotice(); return;}
      if (Math.hypot(dx, dy) <= 10 && event.type !== "pointercancel") {
        this.noticeOpen = !this.noticeOpen;
        if (this.fadeTimer !== null) {window.clearTimeout(this.fadeTimer); this.fadeTimer = null;}
        this.renderNotice();
      }
    };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up); window.addEventListener("pointercancel", up);
  };

  /** `prompt` names a choice that wants its card; a new one opens Current choice without taking focus. */
  update(status: ShellStatus, required: string | null, paused: boolean, prompt: string | null, selecting = false): void {
    // Live regions are rewritten only when what they say changes, so nothing is re-announced.
    const key = JSON.stringify(status);
    if (key !== this.statusKey) {this.statusKey = key; this.status(status);}
    this.requiredText = required; this.selecting = selecting;
    this.foldedText.textContent = required ?? "";
    this.required.title = required ?? "Required choice";
    this.required.setAttribute("aria-label", required ? `Return to ${required.toLowerCase()}` : "Required choice");
    this.nodes.pause.title = paused ? "Resume game" : "Pause game";
    commandSymbol(this.nodes.pause, paused ? "play" : "pause");
    this.commands();
    // A list choice that completes one (a Raid target, an attack pair) brings its card in place of the list.
    if (prompt && prompt !== this.lastPrompt && (!this.surface || this.surface === "countries")) this.open("actions", this.required, false);
    this.lastPrompt = prompt;
    this.layout();
  }

  private status(status: ShellStatus): void {
    this.result = status.result;
    const look = seatLook(status.seat);
    this.notified = status.notice;
    this.notice.style.setProperty("--seat", look.color);
    this.renderNotice();
    this.infoLine.textContent = status.info;
    this.explanation.textContent = status.explanation;
    this.pool.hidden = status.pool === null;
    this.pool.replaceChildren(symbol("pool"), h("span", {id: "placement-pool-count"}, String(status.pool ?? 0)));
    this.pool.setAttribute("aria-label", `${status.pool ?? 0} ${status.pool === 1 ? "army" : "armies"} to place`);
    this.pool.title = this.pool.getAttribute("aria-label")!;
  }

  dispose(): void {if (this.fadeTimer !== null) window.clearTimeout(this.fadeTimer); this.close(false); this.overlay.remove();}
}

import {h,s} from "./dom";
import {glyph} from "./icons";
import {seatLook} from "./palette";

export type Surface = "actions" | "menu" | "countries";
/**
 * A one-line notice; `persistent` ones (refusals, a computer turn) never fade, only dismiss. A
 * `quiet` one (a computer's turn, T101) carries no buttons: it is a status line, and a swipe still
 * dismisses it.
 */
export interface Notice {title: string; detail?: string; persistent?: boolean; action?: NoticeAction; quiet?: boolean}
/** One icon on the notice itself (T84): Fast-forward during computer play, Changes on a human turn. */
export interface NoticeAction {id: string; label: string; shape: string; run: () => void}
export interface ShellStatus {seat: number | null; notice: Notice | null; pool: number | null; result: boolean}
/** Where a floating card rests: a bottom corner, or a top one when both bottom corners would cover the countries in play. */
export type Corner = "end" | "start" | "top-end" | "top-start";
const CORNERS: readonly Corner[] = ["end", "start", "top-end", "top-start"];

const symbol = glyph;

function commandSymbol(button: HTMLButtonElement, shape: string): void {
  button.dataset["commandSymbol"]=shape;
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
/**
 * [designed] T101 (owner, 2026-10-22): a card moves only once the pointer has travelled 6 px from
 * where it went down, so a tap is never a drag; two taps on the grip within 400 ms put the card
 * back in its corner.
 */
const DRAG_THRESHOLD = 6;
const DOUBLE_TAP_MS = 400;
/** Where a dragged card rests, kept for later cards in this browser until a reset or a new game. */
export const CARD_POSITION_KEY = "malpaco:card-position";
interface CardPosition {x: number; y: number}
function keptPosition(): CardPosition | null {
  try {
    const value = JSON.parse(localStorage.getItem(CARD_POSITION_KEY) ?? "null");
    return value && Number.isFinite(value.x) && Number.isFinite(value.y) ? {x: value.x, y: value.y} : null;
  } catch {return null;}
}
function keepPosition(position: CardPosition | null): void {
  try {if (position) localStorage.setItem(CARD_POSITION_KEY, JSON.stringify(position)); else localStorage.removeItem(CARD_POSITION_KEY);} catch {/* not kept */}
}
/** A new game puts cards back in their corners (T101). */
export function forgetCardPosition(): void {keepPosition(null);}

const TITLES: Record<Surface, string> = {actions: "Current choice", menu: "Menu", countries: "Countries"};

/**
 * The quiet full-viewport shell (T79, T92; trimmed by T97): the map fills the safe
 * viewport and only corner icons rest on it — the menu top-left, Pause top-right, the
 * camera's Fit and Countries bottom-left, and the legal phase actions bottom-right. The
 * pool is an icon and a number at top centre. Only those icons frame the map: one-line
 * notices and the one requested card float over it (owner, #240), and a card rests in a
 * bottom corner, moving to the other side when it would cover the countries in play.
 * Panel content waits in a hidden store and travels, with its listeners, into the card.
 */
export class BattleChrome {
  readonly overlay = h("div", {class: "game-overlay"});
  readonly hud = h("div", {id: "game-status", class: "game-corner game-corner-start", role: "group", "aria-label": "Game menu"});
  readonly rail = h("nav", {id: "battle-action-rail", role: "toolbar", "aria-label": "Game actions"});
  readonly drawer = h("section", {id: "game-focus-drawer", tabindex: -1, role: "dialog", "aria-modal": "false", "aria-labelledby": "game-drawer-title", hidden: true});
  readonly side = h("div", {class: "game-side"});
  private readonly top = h("div", {class: "game-corner game-corner-end"});
  private readonly poolSlot = h("div", {class: "game-pool-slot"});
  private readonly notice = h("div", {id: "active-seat-notice", class: "game-notice", role: "status", hidden: true});
  private readonly noticeSlot = h("div", {class: "game-notice-slot"}, this.notice);
  private readonly pool = h("div", {id: "placement-pool", class: "hud-chip", role: "status", hidden: true});
  private readonly folded = h("div", {id: "game-folded-choice", class: "game-notice game-folded", hidden: true});
  private readonly foldedText = h("span", {class: "game-notice-text"});
  private readonly title = h("h2", {id: "game-drawer-title", class: "visually-hidden"});
  private readonly content = h("div", {class: "game-drawer-content"});
  private readonly closeButton = icon("close-game-drawer", "Return to map", "close");
  private readonly required = icon("open-required-action", "Required choice", "return");
  private readonly menu = icon("open-game-menu", "Menu: help, scoreboard and New game", "menu");
  /** T81: every country by name, Inspect and a named choice for ambiguous taps. */
  readonly countries = icon("open-countries", "Countries: list and inspect", "countries");
  private readonly cornerClose = icon("close-result-card", "Return to map", "close");
  /** T101: every card folds to a chip with its title and drags by its grip or its edge. */
  private readonly grip = h("div", {class: "card-grip", title: "Drag to move the card; double-tap to put it back"});
  private readonly foldButton = icon("fold-card", "Fold card", "fold");
  private readonly chip = h("button", {id: "unfold-card", type: "button", class: "card-chip"});
  private collapsed = false;
  private position: CardPosition | null = keptPosition();
  private gripTap = -Infinity;
  private quiet = false;
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
  private lastPrompt: string | null = null;
  private statusKey = "";
  private result = false;
  private requiredText: string | null = null;
  private corner: Corner = "end";
  private railSize = {width: 0, height: 0, viewport: ""};

  constructor(private readonly nodes: {action: HTMLElement; settings: HTMLElement; phaseActions: HTMLElement; pause: HTMLButtonElement; speed?: HTMLElement; forward?: HTMLButtonElement; camera?: HTMLElement; countries?: HTMLElement; primaryActions?: {newGame:HTMLButtonElement;help:HTMLButtonElement}; onMenuOpen?:()=>void;onMenuClose?:()=>void}) {
    for (const [button, surface] of [[this.menu, "menu"], [this.countries, "countries"]] as const) {
      button.setAttribute("aria-controls", this.drawer.id);
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-expanded", "false");
      button.onclick = () => {if(surface==='menu')this.nodes.onMenuOpen?.();this.open(surface, button);};
    }
    // The required choice is never toggled away: when its card is open, the icon moves focus into it.
    this.required.onclick = () => {
      if (this.surface === "actions") {this.opener = this.required; this.firstControl().focus({preventScroll: true});}
      else this.open("actions", this.required);
    };
    this.closeButton.onclick = () => this.close();
    this.foldButton.onclick = () => this.fold(true);
    this.chip.onclick = () => this.fold(false);
    this.drawer.append(this.grip, this.title, this.content, this.foldButton, this.closeButton, this.chip);
    this.drawer.addEventListener("pointerdown", this.onCardDown);
    this.drawer.dataset["corner"] = this.corner;
    this.folded.append(this.foldedText, this.required);
    if(nodes.primaryActions){
      this.hud.classList.add('game-primary-buttons');
      const {newGame,help}=nodes.primaryActions;
      for(const [button,name,shape] of [[newGame,'New game','new-game'],[this.menu,'Settings','settings'],[help,'Help','help']] as const){
        button.replaceChildren(document.createTextNode(name));button.setAttribute('aria-label',name);button.title=name;button.classList.add('primary-command');
      }
      this.hud.append(newGame,this.menu,help);this.overlay.dataset['primaryCommands']='true';
    }else this.hud.append(this.menu);
    // Countries is a way to find a country, so it rests with the camera's Fit and Focus.
    if (nodes.countries) (nodes.camera ?? this.hud).append(this.countries);
    // On the result card the top-right corner returns to the map, as in the sketches.
    this.cornerClose.onclick = () => this.close();
    // T101: the speed controls share the top-right corner: the speed choice, Fast-forward and Pause.
    this.top.append(...(nodes.speed ? [nodes.speed] : []), ...(nodes.forward ? [nodes.forward] : []), nodes.pause, this.cornerClose);
    this.poolSlot.append(this.pool);
    this.rail.append(nodes.phaseActions);
    // Arrow keys and Home/End move within each icon group (the action rail, the map view
    // controls and every card's icon row); they only move focus, never act (T88). Number
    // fields keep their own arrow keys.
    this.overlay.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      const target = event.target as HTMLElement;
      const group = target.closest<HTMLElement>("#battle-action-rail, .map-camera-controls, .card-icons");
      if (!group || target.matches("input, select, textarea")) return;
      const buttons = [...group.querySelectorAll<HTMLButtonElement>("button")].filter(button => !button.disabled && button.getClientRects().length > 0);
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      if (current < 0) return;
      const step = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
      const index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + step + buttons.length) % buttons.length;
      buttons[index]?.focus({preventScroll:true}); event.preventDefault();
    });
    this.notice.addEventListener("pointerdown", this.onNoticeDown);
    this.side.append(this.noticeSlot, this.folded);
    this.overlay.append(this.hud, this.poolSlot, this.top, this.side, ...(nodes.camera ? [nodes.camera] : []), this.rail, this.drawer);
    this.commands();
  }

  /** Legal phase commands ride the action corner as icons; disabled ones are not shown. */
  private commands(): void {
    const symbols: Record<string,string> = {"start-combat-button":"combat", "end-turn-button":"flag", "start-friendly-move-button":"move"};
    for (const button of this.nodes.phaseActions.querySelectorAll<HTMLButtonElement>("button")) {
      if (!button.dataset["commandSymbol"]) {
        button.setAttribute("aria-label", button.textContent ?? ""); button.title = button.textContent ?? "";
        commandSymbol(button, symbols[button.id] ?? "info");
      }
    }
  }

  get openSurface(): Surface | null {return this.surface;}

  /** The result card's History and Files icons open the menu card. */
  /** After a match replaces another, focus returns to a visible control, not the page (#195). */
  focusMenuOpener(): void {this.menu.focus({preventScroll: true});}
  openMenu(): void {if (this.surface !== "menu") {this.nodes.onMenuOpen?.();this.open("menu", this.menu);}}

  /**
   * Only the corner icons (and the pool between them) frame the map (T97): cards, the
   * folded strip and notices float over it, so none of them refits or turns the board.
   */
  get obstacles(): Element[] {
    // T101: the speed choice and Fast-forward float over the map like the notice, so their coming
    // and going (and their width) never reframes it; Pause (or the result card's ×) holds the corner.
    return [this.hud, this.nodes.pause, this.cornerClose, this.pool, this.rail];
  }

  /**
   * Rests the open card in the first corner where it covers none of `avoid` (the badges of
   * the countries in play): bottom end, bottom start, then the top ones; if every corner
   * covers one, the corner covering least. The centred result card stays where it is.
   */
  place(avoid: readonly DOMRect[]): void {
    this.avoid = avoid;
    this.reserveCommands();
    this.fitSpeed();
    this.reposition();
  }

  /** Keep the command corner steady when a choice temporarily hides a phase command. */
  private reserveCommands(): void {
    const frame = this.overlay.getBoundingClientRect();
    const viewport = `${frame.width}:${frame.height}`;
    if (viewport !== this.railSize.viewport) {
      this.railSize = {width: 0, height: 0, viewport};
      this.rail.style.removeProperty('min-width');
      this.rail.style.removeProperty('min-height');
    }
    const rect = this.rail.getBoundingClientRect();
    this.railSize.width = Math.max(this.railSize.width, rect.width);
    this.railSize.height = Math.max(this.railSize.height, rect.height);
    this.rail.style.minWidth = `${this.railSize.width}px`;
    this.rail.style.minHeight = `${this.railSize.height}px`;
    this.overlay.style.setProperty('--command-width', `${this.railSize.width}px`);
    this.overlay.style.setProperty('--command-height', `${this.railSize.height}px`);
  }

  /**
   * The speed choice rests beside Pause; on a screen too narrow for it and the pool together (a
   * phone with wide safe areas) it gives way while you place armies, which it does not pace.
   */
  private fitSpeed(): void {
    const speed = this.nodes.speed;
    if (!speed) return;
    speed.hidden = this.drawer.dataset["placement"] === "center" && !this.drawer.hidden;
    if(speed.hidden)return;
    delete this.top.dataset['stackSpeed'];
    if(this.nodes.primaryActions&&getComputedStyle(this.hud).visibility!=='hidden'){const a=speed.getBoundingClientRect(),b=this.hud.getBoundingClientRect();if(a.left<b.right+8&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom)this.top.dataset['stackSpeed']='true';}
    if(this.pool.hidden)return;
    const a = speed.getBoundingClientRect(), b = this.pool.getBoundingClientRect();
    speed.hidden = a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  }

  private avoid: readonly DOMRect[] = [];
  /**
   * T103: the amount bar of a capture or a move rests beside its country and follows the camera,
   * clear of the countries in play (#266). It applies to the choice card only; a drag sets it free
   * for the rest of that choice, and the dragged place is kept as for any card.
   */
  private anchor: (() => {near: DOMRect; avoid: readonly DOMRect[]} | null) | null = null;
  private anchorFrame: number | null = null;
  private anchorReleased = false;
  private settingsReleased = false;
  anchorTo(rect: (() => {near: DOMRect; avoid: readonly DOMRect[]} | null) | null): void {
    this.anchor = rect;
    this.anchorReleased = false;
    if (rect && this.anchorFrame === null) {
      const tick = () => {this.anchorFrame = this.anchor ? requestAnimationFrame(tick) : null; if (this.anchor && !this.anchorReleased && this.surface === "actions") this.reposition();};
      this.anchorFrame = requestAnimationFrame(tick);
    }
    this.reposition();
  }
  /** The first place beside `near` (below, above, right, left) that covers none of `avoid`, else the one covering least. */
  private besideAnchor(near: DOMRect, avoid: readonly DOMRect[]): {x: number; y: number} {
    const frame = this.overlay.getBoundingClientRect(), card = this.drawer.getBoundingClientRect(), gap = 8;
    const clamp = (x: number, y: number) => ({x: Math.max(0, Math.min(x - frame.left, frame.width - card.width)), y: Math.max(0, Math.min(y - frame.top, frame.height - card.height))});
    const middle = {x: near.left + near.width / 2 - card.width / 2, y: near.top + near.height / 2 - card.height / 2};
    const places = [clamp(middle.x, near.bottom + gap), clamp(middle.x, near.top - gap - card.height), clamp(near.right + gap, middle.y), clamp(near.left - gap - card.width, middle.y)];
    const covered = (at: {x: number; y: number}) => avoid.reduce((sum, r) => {
      const left = at.x + frame.left, top = at.y + frame.top;
      return sum + Math.max(0, Math.min(left + card.width, r.right) - Math.max(left, r.left)) * Math.max(0, Math.min(top + card.height, r.bottom) - Math.max(top, r.top));
    }, 0);
    let best = places[0]!, least = Infinity;
    for (const at of places) {const area = covered(at); if (area < least) {best = at; least = area;} if (area === 0) break;}
    return best;
  }
  private reposition(): void {
    if (this.drawer.hidden) return;
    if(this.surface==='menu'&&this.nodes.primaryActions&&!this.settingsReleased){
      const frame=this.overlay.getBoundingClientRect(),button=this.menu.getBoundingClientRect(),edge=16,top=Math.max(button.bottom,this.hud.getBoundingClientRect().bottom)-frame.top+8;
      this.drawer.dataset['settingsAnchored']='true';
      this.drawer.style.width=`${Math.min(400,frame.width-2*edge)}px`;
      this.drawer.style.maxHeight=`${Math.max(48,frame.height-top-edge)}px`;
      this.moveTo({x:Math.max(edge,Math.min(button.left-frame.left,frame.width-this.drawer.getBoundingClientRect().width-edge)),y:top});return;
    }
    delete this.drawer.dataset['settingsAnchored'];this.drawer.style.removeProperty('max-height');this.drawer.style.removeProperty('width');
    const anchored = this.surface === "actions" && !this.anchorReleased ? this.anchor?.() : null;
    if (anchored) {
      this.moveTo(this.besideAnchor(anchored.near, anchored.avoid));
      this.drawer.dataset["anchored"] = "true";
      return;
    }
    delete this.drawer.dataset["anchored"];
    // A card the player dragged rests where it was put, inside the safe viewport (T101).
    if (this.position) {this.moveTo(this.position); return;}
    this.drawer.removeAttribute("data-moved");
    for (const side of ["left", "top", "right", "bottom", "translate"]) this.drawer.style.removeProperty(side);
    if (this.drawer.dataset["placement"] === "center") return;
    // The card stays below the top icons and the notice as they stand, so none covers another.
    const frame = this.overlay.getBoundingClientRect(), shown = [this.hud, this.top, this.pool, this.notice].filter(e => !e.hidden && e.getClientRects().length);
    const below = Math.max(0, ...shown.map(e => e.getBoundingClientRect().bottom - frame.top));
    this.drawer.style.setProperty("--card-top", `${Math.ceil(below)}px`);
    const avoid = this.avoid;
    const overlap = (corner: Corner) => {
      this.drawer.dataset["corner"] = corner;
      const card = this.drawer.getBoundingClientRect();
      return avoid.reduce((sum, r) => sum + Math.max(0, Math.min(card.right, r.right) - Math.max(card.left, r.left)) * Math.max(0, Math.min(card.bottom, r.bottom) - Math.max(card.top, r.top)), 0);
    };
    let best: Corner = this.corner, least = Infinity;
    for (const corner of avoid.length ? CORNERS : [this.corner]) {
      const area = overlap(corner);
      if (area < least) {best = corner; least = area;}
      if (area === 0) break;
    }
    this.corner = best; this.drawer.dataset["corner"] = best;
  }

  /** Places the card's top-left corner at `at` (overlay pixels), clamped so the whole card stays inside the safe viewport. */
  private moveTo(at: CardPosition): CardPosition {
    const frame = this.overlay.getBoundingClientRect();
    Object.assign(this.drawer.style, {right: "auto", bottom: "auto", translate: "none"});
    this.drawer.dataset["moved"] = "true";
    const card = this.drawer.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(at.x, frame.width - card.width))), y = Math.round(Math.max(0, Math.min(at.y, frame.height - card.height)));
    this.drawer.style.left = `${x}px`; this.drawer.style.top = `${y}px`;
    return {x, y};
  }

  /** Drag by the grip or the card's own edge (never from a control); a short move is a tap. */
  private readonly onCardDown = (down: PointerEvent) => {
    if (down.button !== 0 || (down.target !== this.drawer && down.target !== this.grip)) return;
    const frame = this.overlay.getBoundingClientRect(), card = this.drawer.getBoundingClientRect();
    const start = {x: down.clientX, y: down.clientY}, origin = {x: card.left - frame.left, y: card.top - frame.top};
    let dragging = false;
    try {this.drawer.setPointerCapture(down.pointerId);} catch {/* a synthetic pointer */}
    const move = (event: PointerEvent) => {
      if (event.pointerId !== down.pointerId) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      // A drag frees an anchored amount bar for the rest of its choice (#266).
      if(!dragging&&this.surface==='menu')this.settingsReleased=true;
      if (!dragging && this.drawer.dataset["anchored"]) {this.anchorReleased = true; delete this.drawer.dataset["anchored"];}
      dragging = true; this.drawer.dataset["dragging"] = "true";
      this.position = this.moveTo({x: origin.x + dx, y: origin.y + dy});
      event.preventDefault();
    };
    const up = (event: PointerEvent) => {
      if (event.pointerId !== down.pointerId) return;
      this.drawer.removeEventListener("pointermove", move); this.drawer.removeEventListener("pointerup", up); this.drawer.removeEventListener("pointercancel", up);
      delete this.drawer.dataset["dragging"];
      if (dragging) {keepPosition(this.position); return;}
      if (event.type !== "pointerup" || down.target !== this.grip) return;
      // Two taps on the grip put the card back in its corner and forget the kept place.
      if (event.timeStamp - this.gripTap < DOUBLE_TAP_MS) {this.gripTap = -Infinity; this.resetPosition();}
      else this.gripTap = event.timeStamp;
    };
    this.drawer.addEventListener("pointermove", move); this.drawer.addEventListener("pointerup", up); this.drawer.addEventListener("pointercancel", up);
  };

  /** Back to the automatic corner, forgetting the kept place. */
  resetPosition(): void {this.position = null; keepPosition(null); this.reposition();}

  /** Folds the open card to a chip that keeps its title, or unfolds it; the game is untouched. */
  fold(collapsed: boolean): void {
    if (!this.surface || this.collapsed === collapsed) return;
    this.collapsed = collapsed;
    this.layout();
    (collapsed ? this.chip : this.firstControl()).focus({preventScroll: true});
  }

  get cardFolded(): boolean {return this.collapsed;}

  /** Opens a card over the map. An automatic opening (a new choice) never takes focus. */
  open(surface: Surface, opener: HTMLElement, takeFocus = true): void {
    if (this.surface === surface) {this.close(); return;}
    this.close(false);
    this.surface = surface; this.opener = opener; this.collapsed = false;this.settingsReleased=false;
    this.drawer.dataset["surface"] = surface;
    this.title.textContent = surface==='menu'&&this.nodes.primaryActions?'Settings':TITLES[surface];
    const nodes = {actions: [this.nodes.action], menu: [this.nodes.settings], countries: this.nodes.countries ? [this.nodes.countries] : []}[surface];
    for (const node of nodes) {
      const marker = document.createComment("focused panel home"); node.before(marker);
      this.moved.push({node, marker}); this.content.append(node);
    }
    this.drawer.hidden = false;
    this.layout();
    for (const button of this.overlay.querySelectorAll<HTMLElement>("[aria-haspopup]")) button.setAttribute("aria-expanded", String(button === opener));
    if (takeFocus) this.firstControl().focus({preventScroll: true});
  }

  /** The card's close icon, or its first control when a choice card has none. */
  private firstControl(): HTMLElement {
    if (this.collapsed) return this.chip;
    if (!this.closeButton.hidden) return this.closeButton;
    return [...this.content.querySelectorAll<HTMLElement>("button, input, select")].find(node => !node.hasAttribute("disabled") && node.getClientRects().length > 0) ?? this.drawer;
  }

  /** A card whose content changes kind (the Countries card's list, Inspect or question) renames itself. */
  retitle(text: string): void {if (this.surface) this.title.textContent = text;}

  close(restoreFocus = true): void {
    if (!this.surface) return;
    // Content with no home in the page (the Countries list) leaves the card instead of staying under the next one.
    for (const {node, marker} of this.moved) {if (marker.parentNode) marker.replaceWith(node); else node.remove();}
    const wasMenu=this.surface==='menu';
    this.moved = []; this.drawer.hidden = true; this.surface = null; this.collapsed = false;
    for (const button of this.overlay.querySelectorAll<HTMLElement>("[aria-haspopup]")) button.setAttribute("aria-expanded", "false");
    this.layout();
    if (restoreFocus) this.focus(this.opener, this.menu);
    this.opener = null;if(wasMenu)this.nodes.onMenuClose?.();
  }

  private focus(control: HTMLElement | null, fallback: HTMLElement): void {
    (control?.isConnected && control.getClientRects().length && !control.hasAttribute("disabled") ? control : fallback).focus({preventScroll:true});
  }

  escape(): boolean {
    if (!this.surface) return false;
    this.close(); return true;
  }

  /** The result card sits in the middle; a folded required choice leaves a one-line strip with a return icon. */
  private layout(): void {
    const actions = this.surface === "actions", center = actions && this.result;
    this.drawer.dataset["placement"] = center ? "center" : "side";
    // The result card rests over the whole map, which is not reframed beside it.
    this.drawer.toggleAttribute("data-camera-ignore", center);
    this.cornerClose.hidden = !center;
    this.nodes.pause.hidden = center;
    // A choice card holds only its own controls (T97); Escape still folds it to the strip.
    this.closeButton.hidden = actions || this.collapsed;
    // T101: a choice card folds to a chip that keeps its title; the menu and Countries close instead.
    this.foldButton.hidden = !actions || this.collapsed;
    this.content.hidden = this.collapsed;
    this.chip.hidden = !this.collapsed;
    this.drawer.dataset["folded"] = String(this.collapsed);
    const chipText = (actions ? this.requiredText : null) ?? this.title.textContent ?? "";
    if (this.chip.textContent !== chipText) {this.chip.textContent = chipText; this.chip.setAttribute("aria-label", `Unfold: ${chipText}`); this.chip.title = `Unfold: ${chipText}`;}
    // T101: while a computer plays only the speed controls stay; pausing brings the rest back.
    this.overlay.dataset["quiet"] = String(this.quiet);
    this.fitSpeed();
    if (this.nodes.forward) this.nodes.forward.hidden = center || this.nodes.forward.hidden;
    // The strip waits while any card is open (T97: cards float, so it would sit under one).
    this.folded.hidden = !this.requiredText || this.surface !== null;
    this.renderNotice();
    this.reposition();
  }

  /**
   * The host's contextual notice, if any; a folded choice's strip speaks for itself (T97). The
   * notice is a slim one-line pill (owner, 2026-10-21): a tap shows its hint, a swipe or ×
   * dismisses it until the next new notice, and an ordinary one fades after [designed] 4 s.
   * Refusals and a computer's turn persist until dismissed or acted on (U5: nothing required times out).
   */
  private renderNotice(): void {
    const notice: Notice | null = this.notified;
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
    if (notice.quiet) {
      this.notice.replaceChildren(h("strong", {class: "game-notice-title"}, notice.title),
        ...(notice.detail ? [h("span", {class: this.noticeOpen ? "game-notice-detail" : "visually-hidden"}, notice.detail)] : []));
      return;
    }
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
  update(status: ShellStatus, required: string | null, paused: boolean, prompt: string | null, quiet = false): void {
    // T101: a computer's turn closes any card and leaves only the speed controls; focus left on a
    // control that hides moves to Pause.
    this.quiet = quiet;
    if (quiet) {
      if (this.surface) this.close(false);
      const active = document.activeElement;
      if (active && active !== document.body && [this.hud, this.rail, this.folded, this.nodes.camera].some(group => group?.contains(active))) this.nodes.pause.focus({preventScroll: true});
    }
    // Live regions are rewritten only when what they say changes, so nothing is re-announced.
    const key = JSON.stringify(status);
    if (key !== this.statusKey) {this.statusKey = key; this.status(status);}
    this.requiredText = required;
    this.foldedText.textContent = required ?? "";
    this.required.title = required ?? "Required choice";
    this.required.setAttribute("aria-label", required ? `Return to ${required.toLowerCase()}` : "Required choice");
    this.nodes.pause.title = paused ? "Resume game" : "Pause game";
    commandSymbol(this.nodes.pause, paused ? "play" : "pause");
    this.commands();
    // A list choice that completes one (a Raid target, an attack pair) brings its card in place of the list.
    if (prompt && prompt !== this.lastPrompt && (!this.surface || this.surface === "countries")) this.open("actions", this.required, false);
    if(!paused)this.lastPrompt = prompt;
    this.layout();
  }

  private status(status: ShellStatus): void {
    this.result = status.result;
    this.notified = status.notice;
    this.notice.style.setProperty("--seat", status.seat === null ? "" : seatLook(status.seat).color);
    this.renderNotice();
    this.pool.hidden = status.pool === null;
    this.pool.replaceChildren(symbol("pool"), h("span", {id: "placement-pool-count"}, String(status.pool ?? 0)));
    this.pool.setAttribute("aria-label", `${status.pool ?? 0} ${status.pool === 1 ? "army" : "armies"} to place`);
    this.pool.title = this.pool.getAttribute("aria-label")!;
  }

  dispose(): void {this.anchor = null; if (this.anchorFrame !== null) cancelAnimationFrame(this.anchorFrame); if (this.fadeTimer !== null) window.clearTimeout(this.fadeTimer); this.close(false); this.overlay.remove();}
}

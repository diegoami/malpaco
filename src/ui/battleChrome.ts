import {h,s} from "./dom";

export interface ChromePreferences { topbarVisible?: boolean; sidebarVisible?: boolean }
type Surface = "actions" | "cards" | "details" | "settings";

function symbol(shape: string): SVGSVGElement {
  const paths: Record<string,string> = {
    "▤": "M3 5H21V19H3ZM3 10H21", "◧": "M3 5H21V19H3ZM16 5V19",
    "⚔": "M4 3L20 19M3 4L4 8 16 20M3 16L8 21M20 3L4 19M21 4L20 8 8 20M16 21L21 16",
    "▱": "M7 5H20V21H7ZM3 17V2H16", "ⓘ": "M12 11V17M12 7V7.1",
    "⚙": "M9 3H15L16 6 19 7 21 12 19 17 16 18 15 21H9L8 18 5 17 3 12 5 7 8 6ZM12 8A4 4 0 1 0 12 16A4 4 0 1 0 12 8",
    "!": "M12 6V13M12 17V17.1", "×": "M5 5L19 19M19 5L5 19",
    "▶": "M6 3L21 12 6 21Z", "↦": "M3 12H17M12 6L18 12 12 18M21 4V20",
    "⇄": "M3 7H21M16 2L21 7 16 12M21 17H3M8 12L3 17 8 22",
    "■": "M5 5H19V19H5Z", "⚀": "M4 4H20V20H4ZM12 11.5V12.5",
    "Ⅱ": "M8 4V20M16 4V20", "≡": "M8 6H21M8 12H21M8 18H21M3 6H3.1M3 12H3.1M3 18H3.1",
  };
  const svg = s("svg", {class:"game-action-symbol", viewBox:"0 0 24 24", width:20, height:20, fill:"none", stroke:"currentColor", "stroke-width":1.8, "stroke-linecap":"round", "stroke-linejoin":"round", "aria-hidden":"true"}, s("path", {d:paths[shape] ?? paths["ⓘ"]!}));
  if (shape === "ⓘ" || shape === "!") svg.prepend(s("circle", {cx:12, cy:12, r:10}));
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


/** Presentation-only: original live controls travel with their existing listeners. */
export class BattleChrome {
  readonly rail = h("nav", {id: "battle-action-rail", role: "toolbar", "aria-label": "Game actions"});
  readonly drawer = h("section", {id: "game-focus-drawer", role: "dialog", "aria-modal": "false", "aria-labelledby": "game-drawer-title", hidden: true});
  private readonly top = icon("toggle-topbar", "Hide top panel", "▤");
  private readonly side = icon("toggle-sidebar", "Hide side panel", "◧");
  private readonly title = h("h2", {id: "game-drawer-title"});
  private readonly content = h("div", {class: "game-drawer-content"});
  private readonly required = icon("open-required-action", "Required choice", "!");
  private readonly summary = h("span", {class: "game-rail-summary", "aria-live": "polite"});
  private surface: Surface | null = null;
  private opener: HTMLElement | null = null;
  private moved: {node: HTMLElement; marker: Comment}[] = [];
  private readonly pauseMarker: Comment;
  private readonly logMarker: Comment;
  private readonly phaseMarker: Comment;
  private battleCommands: {node: HTMLElement; marker: Comment} | null = null;
  private historyPosition: {top: number; following: boolean} | null = null;

  constructor(private readonly root: HTMLElement, private readonly preferences: ChromePreferences,
    private readonly nodes: {topbar: HTMLElement; panel: HTMLElement; action: HTMLElement; cards: HTMLElement; history: HTMLElement; score: HTMLElement; settings: HTMLElement; phaseActions: HTMLElement; battle: HTMLElement; pause: HTMLButtonElement; log: HTMLButtonElement}) {
    nodes.topbar.id = "battle-topbar";
    nodes.panel.id = "battle-sidebar";
    this.top.setAttribute("aria-controls", nodes.topbar.id);
    this.side.setAttribute("aria-controls", nodes.panel.id);
    this.pauseMarker = document.createComment("playback pause home");
    this.logMarker = document.createComment("event log home");
    this.phaseMarker = document.createComment("phase commands home");
    nodes.phaseActions.before(this.phaseMarker);
    nodes.pause.before(this.pauseMarker);
    nodes.log.before(this.logMarker);
    this.top.onclick = () => {this.close(false); preferences.topbarVisible = preferences.topbarVisible === false; this.layout();};
    this.side.onclick = () => {this.close(false); preferences.sidebarVisible = preferences.sidebarVisible === false; this.layout();};
    const actions = icon("open-game-actions", "Game actions", "⚔");
    const cards = icon("open-game-cards", "Cards", "▱");
    const details = icon("open-game-details", "Game details and history", "ⓘ");
    const settings = icon("open-game-settings", "Game settings and files", "⚙");
    for (const [button, surface] of [[actions, "actions"], [cards, "cards"], [details, "details"], [settings, "settings"]] as const) {
      button.setAttribute("aria-controls", this.drawer.id);
      button.setAttribute("aria-haspopup", "dialog");
      button.onclick = () => this.open(surface, button);
    }
    this.required.hidden = true;
    this.required.onclick = () => this.open("actions", this.required);
    const close = icon("close-game-drawer", "Close game panel", "×");
    close.onclick = () => this.close();
    this.drawer.append(h("header", {class: "game-drawer-head"}, this.title, close), this.content);
    this.rail.append(this.top, this.side, actions, cards, details, settings, this.required, this.summary);
    this.rail.addEventListener("keydown", event => {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      const buttons = [...this.rail.querySelectorAll<HTMLButtonElement>("button")].filter(button => !button.disabled && button.getClientRects().length > 0);
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
      buttons[index]?.focus({preventScroll:true}); event.preventDefault();
    });
    root.querySelector(".stage")!.append(this.rail, this.drawer);
    this.layout();
  }

  private layout(): void {
    this.rememberHistory();
    const top = this.preferences.topbarVisible !== false, side = this.preferences.sidebarVisible !== false;
    this.root.dataset["topbarVisible"] = String(top);
    this.root.dataset["sidebarVisible"] = String(side);
    for (const [button, shown, name] of [[this.top, top, "top"], [this.side, side, "side"]] as const) {
      button.setAttribute("aria-expanded", String(shown));
      const label = `${shown ? "Hide" : "Show"} ${name} panel`;
      button.setAttribute("aria-label", label); button.title = label;
    }
    const railPlayback = !top || !side;
    if (railPlayback) {this.rail.insertBefore(this.nodes.pause, this.summary); this.rail.insertBefore(this.nodes.log, this.summary);}
    else {this.pauseMarker.after(this.nodes.pause); this.logMarker.after(this.nodes.log);}
    this.root.dataset["railPlayback"] = String(railPlayback);
    this.commands();
    this.restoreHistory();
  }

  private commands(): void {
    const focused = this.rail.contains(document.activeElement) ? document.activeElement?.id : undefined;
    if (this.battleCommands && !this.battleCommands.marker.isConnected) {
      this.battleCommands.node.remove(); this.battleCommands = null;
    }
    const compact = this.preferences.sidebarVisible === false;
    if (compact) this.rail.insertBefore(this.nodes.phaseActions, this.summary);
    else this.phaseMarker.after(this.nodes.phaseActions);
    const battle = this.nodes.battle.querySelector<HTMLElement>(".battle-actions");
    if (compact && battle) {
      const marker = document.createComment("battle commands home"); battle.before(marker);
      this.battleCommands = {node: battle, marker}; this.rail.insertBefore(battle, this.summary);
    } else if (!compact && this.battleCommands) {
      this.battleCommands.marker.replaceWith(this.battleCommands.node); this.battleCommands = null;
    }
    if (this.battleCommands) this.battleCommands.node.hidden = this.nodes.battle.hidden || this.nodes.battle.dataset["pendingCapture"] === "true";
    const symbols: Record<string,string> = {"start-combat-button":"▶", "end-turn-button":"↦", "start-friendly-move-button":"⇄", "fight-on-button":"⚔", "stop-battle-button":"■", "single-exchange-button":"⚀"};
    for (const group of [this.nodes.phaseActions, this.battleCommands?.node]) {
      for (const button of group?.querySelectorAll<HTMLButtonElement>("button") ?? []) {
        button.setAttribute("aria-label", button.textContent ?? ""); button.title = button.textContent ?? "";
        commandSymbol(button, symbols[button.id] ?? "ⓘ");
      }
    }
    if (focused) this.focus(this.rail.querySelector<HTMLElement>(`#${focused}`), this.rail.querySelector<HTMLElement>("#open-game-actions")!);
  }

  private rememberHistory(): void {
    const log = this.nodes.history.querySelector<HTMLElement>(".log")!;
    if (log.getClientRects().length) this.historyPosition = {top: log.scrollTop, following: log.scrollHeight - log.clientHeight - log.scrollTop <= 1};
  }

  private restoreHistory(): void {
    const log = this.nodes.history.querySelector<HTMLElement>(".log")!;
    if (this.historyPosition && log.getClientRects().length) log.scrollTop = this.historyPosition.following ? log.scrollHeight : this.historyPosition.top;
  }

  open(surface: Surface, opener: HTMLElement): void {
    this.rememberHistory();
    if (this.surface === surface) {this.close(); return;}
    this.close(false);
    this.surface = surface; this.opener = opener;
    this.drawer.dataset["surface"] = surface;
    this.title.textContent = {actions: "Game actions", cards: "Cards", details: "Game details", settings: "Game settings"}[surface];
    const nodes = surface === "actions" ? [this.nodes.action] : surface === "cards" ? [this.nodes.cards] : surface === "details" ? [this.nodes.score, this.nodes.history] : [this.nodes.settings];
    for (const node of nodes) {
      const marker = document.createComment("focused panel home"); node.before(marker);
      this.moved.push({node, marker}); this.content.append(node);
    }
    this.drawer.hidden = false;
    this.restoreHistory();
    this.drawer.querySelector<HTMLElement>("#close-game-drawer")!.focus({preventScroll: true});
  }

  close(restoreFocus = true): void {
    if (!this.surface) return;
    this.rememberHistory();
    for (const {node, marker} of this.moved) {marker.replaceWith(node);}
    this.moved = []; this.drawer.hidden = true; this.surface = null;
    this.restoreHistory();
    if (restoreFocus) this.focus(this.opener, this.side);
    this.opener = null;
  }

  private focus(control: HTMLElement | null, fallback: HTMLElement): void {
    (control?.isConnected && control.getClientRects().length && !control.hasAttribute("disabled") ? control : fallback).focus({preventScroll:true});
  }

  escape(): boolean {
    if (!this.surface) return false;
    this.close(); return true;
  }

  update(summary: string, required: string | null, paused: boolean): void {
    const parts = summary.split(" · ");
    this.summary.textContent = `${parts[0]}\n${parts[2] ?? parts[1] ?? ""}`;
    this.summary.title = summary;
    this.summary.setAttribute("aria-label", summary);
    this.required.hidden = !required;
    this.required.title = required ?? "Required choice";
    this.required.setAttribute("aria-label", required ?? "Required choice");
    this.nodes.pause.title = paused ? "Resume game" : "Pause game";
    commandSymbol(this.nodes.pause, paused ? "▶" : "Ⅱ");
    this.nodes.log.title = "Game event log";
    commandSymbol(this.nodes.log, "≡");
    const cardsButton = this.rail.querySelector<HTMLButtonElement>("#open-game-cards")!;
    cardsButton.disabled = !!this.nodes.cards.hidden;
    cardsButton.title = this.nodes.cards.hidden ? "Cards are not used in this match" : "Cards";
    this.commands();
  }

  dispose(): void {this.close(false); this.phaseMarker.after(this.nodes.phaseActions); this.battleCommands?.marker.replaceWith(this.battleCommands.node); this.rail.remove(); this.drawer.remove();}
}

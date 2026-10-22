import {h} from "./dom";
import {glyph} from "./icons";

/**
 * T100: the scoreboard, kept in this browser only (owner, 2026-10-22: the same browser is enough;
 * totals and recent games). Each player game is recorded once, by its id. [designed] throughout.
 */
export const SCOREBOARD_KEY = "malpaco:scoreboard";
/** [designed] The list shows the last 20 games; the ids of the last 200 are kept, so a game id is never counted twice. */
export const RECENT_GAMES = 20, KEPT_IDS = 200;
export type GameOutcome = "won" | "lost" | "gave-up";
export interface ScoreRow {readonly id: string; readonly date: string; readonly result: GameOutcome; readonly rounds: number; readonly countries: number; readonly seed: number}
export interface ScoreTotals {readonly won: number; readonly lost: number; readonly gaveUp: number}
export interface Scoreboard {readonly version: 1; readonly totals: ScoreTotals; readonly recent: readonly ScoreRow[]; readonly ids: readonly string[]}
export const RESULT_LABEL: Readonly<Record<GameOutcome, string>> = {won: "Won", lost: "Lost", "gave-up": "Gave up"};

export const emptyScoreboard = (): Scoreboard => ({version: 1, totals: {won: 0, lost: 0, gaveUp: 0}, recent: [], ids: []});
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;
const isRow = (row: unknown): row is ScoreRow => {
  const r = row as Record<string, unknown> | null;
  return !!r && typeof r === "object" && typeof r["id"] === "string" && typeof r["date"] === "string" && Object.hasOwn(RESULT_LABEL, r["result"] as string)
    && count(r["rounds"]) && count(r["countries"]) && count(r["seed"]);
};

/** The kept text, or an empty scoreboard for a missing or corrupt one (never an error). */
export function parseScoreboard(text: string | null): Scoreboard {
  if (!text) return emptyScoreboard();
  try {
    const v = JSON.parse(text) as Record<string, unknown> | null, t = v?.["totals"] as Record<string, unknown> | undefined;
    if (!v || v["version"] !== 1 || !t || !count(t["won"]) || !count(t["lost"]) || !count(t["gaveUp"])) return emptyScoreboard();
    if (!Array.isArray(v["recent"]) || !v["recent"].every(isRow) || !Array.isArray(v["ids"]) || !v["ids"].every(id => typeof id === "string")) return emptyScoreboard();
    return {version: 1, totals: {won: t["won"], lost: t["lost"], gaveUp: t["gaveUp"]}, recent: (v["recent"] as ScoreRow[]).slice(0, RECENT_GAMES), ids: (v["ids"] as string[]).slice(-KEPT_IDS)};
  } catch {return emptyScoreboard();}
}

/** One finished game: the totals change by one and the row goes first. A recorded id changes nothing. */
export function recordGame(board: Scoreboard, row: ScoreRow): Scoreboard {
  if (board.ids.includes(row.id) || board.recent.some(r => r.id === row.id)) return board;
  const t = board.totals;
  const totals = {won: t.won + Number(row.result === "won"), lost: t.lost + Number(row.result === "lost"), gaveUp: t.gaveUp + Number(row.result === "gave-up")};
  return {version: 1, totals, recent: [row, ...board.recent].slice(0, RECENT_GAMES), ids: [...board.ids, row.id].slice(-KEPT_IDS)};
}

export const played = (t: ScoreTotals): number => t.won + t.lost + t.gaveUp;
/** The win rate as a whole percentage of games played, or null before the first game. */
export const winRate = (t: ScoreTotals): number | null => played(t) ? Math.round(100 * t.won / played(t)) : null;
/** The result card's line, e.g. "Won 3 · Lost 2 · Gave up 1". */
export const totalsLine = (t: ScoreTotals): string => `Won ${t.won} · Lost ${t.lost} · Gave up ${t.gaveUp}`;

export interface ScoreStore {get(): string | null; set(text: string | null): void}
/** This browser's scoreboard; private modes simply keep nothing. */
export const browserScores: ScoreStore = {
  get: () => {try {return localStorage.getItem(SCOREBOARD_KEY);} catch {return null;}},
  set: text => {try {if (text === null) localStorage.removeItem(SCOREBOARD_KEY); else localStorage.setItem(SCOREBOARD_KEY, text);} catch {/* not kept */}},
};
export function addGame(store: ScoreStore, row: ScoreRow): Scoreboard {
  const board = parseScoreboard(store.get()), next = recordGame(board, row);
  if (next !== board) store.set(JSON.stringify(next));
  return next;
}

/** The menu's trophy icon opens the scoreboard: totals, the last 20 games, and Reset (asked first). */
export class ScoreboardDialog {
  readonly button = h("button", {id: "scoreboard-button", type: "button", class: "game-history-icon", "aria-label": "Scoreboard", title: "Scoreboard"}, glyph("trophy"));
  readonly dialog = h("dialog", {id: "scoreboard-dialog", class: "game-help scoreboard", "aria-labelledby": "scoreboard-title"});
  private readonly close = h("button", {type: "button", id: "close-scoreboard"}, "Close");
  private readonly body = h("div", {class: "scoreboard-body"});
  constructor(private readonly store: ScoreStore = browserScores, onOpen?: () => void) {
    this.close.onclick = () => this.dialog.close();
    this.dialog.append(h("header", {class: "game-help-head"}, h("h2", {id: "scoreboard-title"}, "Scoreboard"), this.close), this.body);
    this.button.onclick = () => {onOpen?.(); this.render(); this.dialog.showModal(); this.close.focus();};
    this.dialog.addEventListener("close", () => {if (this.button.isConnected) this.button.focus({preventScroll: true});});
  }
  private render(confirming = false): void {
    const board = parseScoreboard(this.store.get()), t = board.totals, rate = winRate(t);
    const stat = (id: string, term: string, value: string) => h("div", {}, h("dt", {}, term), h("dd", {id}, value));
    const totals = h("dl", {id: "scoreboard-totals", class: "scoreboard-totals"}, stat("scoreboard-played", "Played", String(played(t))), stat("scoreboard-won", "Won", String(t.won)),
      stat("scoreboard-lost", "Lost", String(t.lost)), stat("scoreboard-gave-up", "Gave up", String(t.gaveUp)), stat("scoreboard-win-rate", "Win rate", rate === null ? "–" : `${rate}%`));
    // A short date fits a phone; the full one is its title.
    const date = (iso: string) => {const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : h("time", {datetime: iso, title: d.toLocaleString()}, d.toLocaleDateString(undefined, {month: "short", day: "numeric"}));};
    const list = board.recent.length ? h("table", {id: "scoreboard-games"}, h("caption", {}, `Last ${RECENT_GAMES} games, newest first; Countries are yours at the end`),
      h("thead", {}, h("tr", {}, ...["Date", "Result", "Rounds", "Countries", "Seed"].map(c => h("th", {scope: "col"}, c)))),
      h("tbody", {}, ...board.recent.map(row => h("tr", {"data-result": row.result}, h("td", {}, date(row.date)), h("th", {scope: "row"}, RESULT_LABEL[row.result]),
        h("td", {}, String(row.rounds)), h("td", {}, String(row.countries)), h("td", {}, String(row.seed))))))
      : h("p", {id: "scoreboard-empty", class: "card-note"}, "No games recorded yet. A game counts once, when it ends.");
    const reset = h("button", {type: "button", id: "scoreboard-reset", disabled: !played(t) && !board.recent.length}, "Reset");
    reset.onclick = () => {this.render(true); this.body.querySelector<HTMLButtonElement>("#scoreboard-reset-cancel")?.focus();};
    let actions: HTMLElement = h("div", {class: "help-actions"}, reset);
    if (confirming) {
      const yes = h("button", {type: "button", id: "scoreboard-reset-confirm", class: "primary"}, "Clear"), no = h("button", {type: "button", id: "scoreboard-reset-cancel"}, "Keep");
      yes.onclick = () => {this.store.set(null); this.render(); this.close.focus();};
      no.onclick = () => {this.render(); this.body.querySelector<HTMLButtonElement>("#scoreboard-reset")?.focus();};
      actions = h("div", {class: "scoreboard-confirm", role: "group", "aria-labelledby": "scoreboard-reset-question"}, h("p", {id: "scoreboard-reset-question"}, "Clear the scoreboard?"), h("div", {class: "help-actions"}, yes, no));
    }
    this.body.replaceChildren(h("p", {class: "card-note"}, "Games finished in this browser."), totals, list, actions);
  }
  dispose(): void {if (this.dialog.open) this.dialog.close(); this.dialog.remove();}
}

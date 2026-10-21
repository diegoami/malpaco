import { deserializeVersionedMatch, REFERENCE_MATCH_IDENTITY, serializeMatch, serializeVersionedMatch } from "../core/match-save";
import type {MatchIdentity,LoadedVersionedMatch} from "../core/match-save";
import type { GameOptions, GameState } from "../core";
import { h } from "./dom";

export interface MatchLoadContext {
  readonly signal: AbortSignal;
  isCurrent(): boolean;
}
export type MatchLoadHandler = (options: GameOptions, state: GameState, loaded?: LoadedVersionedMatch, context?: MatchLoadContext) => void | Promise<void>;

/** One set of local file controls belongs to one setup screen or live match. */
export class ReferenceMatchFiles {
  readonly el: HTMLElement;
  private disposed = false;
  private request = 0;
  private pending: AbortController | null = null;
  private readonly status = h("p", { role: "status", class: "match-error" });
  private readonly error = h("p", { role: "alert", class: "match-error" });

  constructor(onLoad: MatchLoadHandler, options?: GameOptions, getState?: () => GameState, identity:MatchIdentity=REFERENCE_MATCH_IDENTITY, allowVersionedMaps=false, onRequest?: () => void, acceptVersion1=false) {
    const input = h("input", { id: "reference-load-game-file", type: "file", accept: ".json,application/json" });
    const load = h("div", { class: "match-load" }, h("label", { for: input.id }, "Load game"), input);
    this.el = h("div", { class: "match-files reference-match-files" });
    if (options && getState) {
      const save = h("button", { id: "reference-save-game", type: "button" }, "Save game");
      save.addEventListener("click", () => {
        if (this.disposed) return;
        try {
          // A version-1 match (the legacy generated board) saves back in its own format (A13).
          const text = identity.boardGenerator.id === "generated" ? serializeMatch(options, getState().history) : serializeVersionedMatch(options, getState().history, identity);
          const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
          h("a", { href: url, download: `malpaco-${options.seed}.json` }).click();
          setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch (error) { this.error.textContent = "Save failed: " + this.message(error); }
      });
      this.el.append(save);
    } else this.el.classList.add("reference-match-files-setup");
    this.el.append(load, this.status, this.error);
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (this.disposed || !file) return;
      onRequest?.();
      this.pending?.abort();
      const pending = new AbortController();
      this.pending = pending;
      const own = ++this.request;
      const context: MatchLoadContext = {signal: pending.signal, isCurrent: () => !this.disposed && own === this.request && !pending.signal.aborted};
      this.error.textContent = "";
      this.status.textContent = "Loading game…";
      try {
        const text = await file.text();
        if (this.disposed || own !== this.request) return;
        const loaded = deserializeVersionedMatch(text);
        // This renderer uses fixed T63 SVG paths. A valid generated save still
        // belongs in its matching view; it must never replace this board.
        // Only the main game screen continues version-1 saves (A13); other hosts refuse them as before.
        if (loaded.formatVersion === 1 ? !acceptVersion1 : !allowVersionedMaps && loaded.identity.boardGenerator.id !== "fixed-reference") {
          throw new Error(loaded.identity.boardGenerator.id === "geographic"
            ? "This game uses a generated map; load it in the main game screen."
            : "This game uses a generated map; load it in the generated game view.");
        }
        if(loaded.state.cards&&loaded.options.seats.filter(seat=>seat.kind==='human').length>1)throw new Error('Card play currently supports at most one human seat. Shared-screen handover is not available yet.');
        await onLoad(loaded.options, loaded.state, loaded, context);
      } catch (error) {
        if (context.isCurrent() && !(error instanceof Error && error.name === "AbortError")) {
          this.error.textContent = "Load failed: " + this.message(error);
          // The error lives in a scrolling card; bring it into view so the failure is read.
          this.error.scrollIntoView?.({ block: "nearest" });
        }
      } finally {
        if (own === this.request) {
          input.value = "";
          this.status.textContent = "";
          this.pending = null;
        }
      }
    });
  }

  cancelPending(): void {
    this.request += 1;
    this.pending?.abort();
    this.pending = null;
    this.status.textContent = "";
  }

  dispose(): void {
    this.disposed = true;
    this.cancelPending();
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

import { deserializeVersionedMatch, REFERENCE_MATCH_IDENTITY, serializeVersionedMatch } from "../core/match-save";
import type {MatchIdentity,LoadedVersionedMatch} from "../core/match-save";
import type { GameOptions, GameState } from "../core";
import { h } from "./dom";

/** One set of local file controls belongs to one setup screen or live match. */
export class ReferenceMatchFiles {
  readonly el: HTMLElement;
  private disposed = false;
  private request = 0;
  private readonly error = h("p", { role: "alert", class: "match-error" });

  constructor(onLoad: (options: GameOptions, state: GameState, loaded?:LoadedVersionedMatch) => void, options?: GameOptions, getState?: () => GameState, identity:MatchIdentity=REFERENCE_MATCH_IDENTITY, allowVersionedMaps=false) {
    const input = h("input", { id: "reference-load-game-file", type: "file", accept: ".json,application/json" });
    const load = h("div", { class: "match-load" }, h("label", { for: input.id }, "Load game"), input);
    this.el = h("div", { class: "match-files reference-match-files" });
    if (options && getState) {
      const save = h("button", { id: "reference-save-game", type: "button" }, "Save game");
      save.addEventListener("click", () => {
        if (this.disposed) return;
        try {
          const text = serializeVersionedMatch(options, getState().history, identity);
          const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
          h("a", { href: url, download: `malpaco-${options.seed}.json` }).click();
          setTimeout(() => URL.revokeObjectURL(url), 0);
        } catch (error) { this.error.textContent = "Save failed: " + this.message(error); }
      });
      this.el.append(save);
    } else this.el.classList.add("reference-match-files-setup");
    this.el.append(load, this.error);
    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (this.disposed || !file) return;
      const own = ++this.request;
      try {
        const text = await file.text();
        if (this.disposed || own !== this.request) return;
        const loaded = deserializeVersionedMatch(text);
        // This renderer uses fixed T63 SVG paths. A valid generated save still
        // belongs in its matching view; it must never replace this board.
        if (loaded.formatVersion !== 2 || (!allowVersionedMaps && loaded.identity.boardGenerator.id !== "fixed-reference")) {
          throw new Error(loaded.identity.boardGenerator.id === "geographic"
            ? "This game uses a generated map; load it in the main game screen."
            : "This game uses a generated map; load it in the generated game view.");
        }
        if(loaded.state.cards&&loaded.options.seats.filter(seat=>seat.kind==='human').length>1)throw new Error('Card play currently supports at most one human seat. Shared-screen handover is not available yet.');
        onLoad(loaded.options, loaded.state,loaded);
      } catch (error) {
        if (!this.disposed && own === this.request) this.error.textContent = "Load failed: " + this.message(error);
      } finally { if (own === this.request) input.value = ""; }
    });
  }

  dispose(): void {
    this.disposed = true;
    this.request += 1;
  }

  private message(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

import { h } from "./dom";

const sections = [
  [
    "Seed and players",
    "Choose a seed and two to four human seats, or play against computers. The same seed and choices recreate the same generated game.",
  ],
  [
    "Map and armies",
    "Province labels show the numeric seat and army count. Land borders and sea lanes mark the explicit routes between provinces.",
  ],
  [
    "Reinforcements",
    "Place armies from your reinforcement pool on provinces you own. When the pool is empty, choose Start combat.",
  ],
  [
    "Attacking",
    "Select a source and an adjacent enemy. The source needs at least two armies and at least as many armies as the defender. Each Attack resolves one exchange; choose Continue to act again.",
  ],
  [
    "Turns and victory",
    "End your turn when ready. A player with no provinces is eliminated; taking every province wins the game.",
  ],
  [
    "Computer turns",
    "Computer players take their turns automatically. Opening help pauses a computer turn until you close it.",
  ],
  [
    "Save and load",
    "Save game downloads the match and its options and history. Load game replays a saved match. New game returns to setup.",
  ],
] as const;

export function mountHelp(
  host: HTMLElement,
  pause?: () => void,
  resume?: () => void,
  buttonLabel = "How to play",
): void {
  const dialog = h(
    "dialog",
    { class: "help-dialog", "aria-labelledby": "help-title" },
    h("h2", { id: "help-title" }, "How to play"),
    ...sections.map(([title, copy]) =>
      h("section", {}, h("h3", {}, title), h("p", {}, copy)),
    ),
    h("div", { class: "help-actions" }, h("button", { type: "button" }, "Close")),
  );
  const opener = h(
    "button",
    {
      type: "button",
      class: "help-open",
      "aria-haspopup": "dialog",
      "aria-label": "How to play",
    },
    buttonLabel,
  );
  const close = dialog.querySelector("button")!;

  opener.addEventListener("click", () => {
    pause?.();
    dialog.showModal();
    close.focus();
  });
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") event.stopPropagation();
  });
  dialog.addEventListener("close", () => {
    resume?.();
    opener.focus();
  });
  host.append(opener, dialog);
}

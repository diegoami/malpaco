import { h } from "./dom";
export type PanelDetail = "compact" | "detailed";
export function createPanelDetailControl(preferences: { detail?: PanelDetail }, onChange: (detail: PanelDetail) => void): HTMLSelectElement {
  preferences.detail = preferences.detail === "detailed" ? "detailed" : "compact";
  const select = h("select", { id: "panel-detail", "aria-label": "Panel detail" },
    h("option", { value: "compact" }, "Compact"), h("option", { value: "detailed" }, "Detailed"));
  select.value = preferences.detail;
  select.onchange = () => {
    const detail = select.value === "detailed" ? "detailed" : "compact";
    select.value = detail;
    preferences.detail = detail;
    onChange(detail);
  };
  return select;
}

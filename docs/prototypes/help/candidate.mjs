import { readFileSync, writeFileSync } from "node:fs";

const helpPath = "src/ui/help.ts";
const generatedPath = "src/ui/generatedGame.ts";
const appPath = "src/ui/app.ts";
const stylePath = "src/styles.css";
const help = readFileSync("docs/prototypes/help/help.module.mock.txt", "utf8");
function replace(path, before, after) {
  const source = readFileSync(path, "utf8");
  if (!source.includes(before)) throw new Error(`Candidate anchor missing in ${path}: ${before.slice(0, 60)}`);
  writeFileSync(path, source.replace(before, after));
}

writeFileSync(helpPath, help, { flag: "wx" });
replace(generatedPath,
  'import { h } from "./dom";',
  'import { h } from "./dom";\nimport { mountHelp } from "./help";');
replace(generatedPath,
  '  root.replaceChildren(form);\n}',
  '  root.replaceChildren(form);\n  mountHelp(form);\n}');
replace(generatedPath,
  '  root.querySelector("header")!.append(legend, form, controls);',
  '  root.querySelector("header")!.append(legend, form, controls);\n  mountHelp(root.querySelector(".panel-foot")!, () => app.pauseForHelp(), () => app.resumeAfterHelp());');
replace(appPath,
  '  private disposed = false;',
  '  private disposed = false;\n  private helpPaused = false;');
replace(appPath,
  '  get actions(): readonly Action[] { return this.state.history; }',
  '  get actions(): readonly Action[] { return this.state.history; }\n\n  pauseForHelp(): void {\n    if (this.disposed) return;\n    this.helpPaused = true;\n    if (this.computerTimer !== null) clearTimeout(this.computerTimer);\n    this.computerTimer = null;\n  }\n\n  resumeAfterHelp(): void {\n    if (this.disposed) return;\n    this.helpPaused = false;\n    this.scheduleComputer();\n  }');
replace(appPath,
  '    if (this.disposed || this.computerTimer !== null || !this.isComputerTurn()) return;',
  '    if (this.disposed || this.helpPaused || this.computerTimer !== null || !this.isComputerTurn()) return;');
writeFileSync(stylePath,
  readFileSync(stylePath, "utf8") + '\n.help-dialog{box-sizing:border-box;max-height:80vh;max-width:min(42rem,calc(100vw - 2rem));overflow:auto;background:#101f2b;color:#f2f5f7;border:1px solid #8a9ba8;border-radius:12px;padding:1.25rem}.help-dialog::backdrop{background:#0009}.help-dialog h2{margin-top:0}.help-dialog h3{margin:1rem 0 .25rem}.help-dialog p{margin:.25rem 0;line-height:1.45}.help-actions{position:sticky;bottom:-1.25rem;background:#101f2b;padding:.75rem 0 0;text-align:right}\n');

export const candidateFiles = [helpPath, generatedPath, appPath, stylePath];

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mkdtempSync } from "node:fs";
import { join } from "node:path";
import { ACTION_BUDGET, advance, nextAction, opening, policyFor } from "../helpers/complete-game";

const country = (page: Page, id: string) => page.locator(`[data-country="${id}"]`);
async function capture(page: Page, name: string, project: string) {
  const root = process.env["COMPLETE_EVIDENCE_DIR"] ?? "screenshots";
  const dir = mkdtempSync(join(root, "complete-"));
  await page.screenshot({ path: join(dir, `${name}-${project}.png`) });
}
async function finishedFit(page: Page) {
  const boxes = await page.locator("#turn-title, .turn-sub, #new-game-button, #end-turn-button, #attack-button, #start-combat-button").evaluateAll(nodes => nodes.filter(n => !(n as HTMLElement).hidden).map(n => {
    const b = n.getBoundingClientRect(), panel = n.closest(".panel")!.getBoundingClientRect();
    const r = document.createRange(); r.selectNodeContents(n);
    return { text: n.textContent, font: parseFloat(getComputedStyle(n).fontSize), box: { x:b.x,y:b.y,r:b.right,b:b.bottom,w:b.width,h:b.height }, panel:{x:panel.x,y:panel.y,r:panel.right,b:panel.bottom}, lines: Array.from(r.getClientRects()).map(t => ({x:t.x,y:t.y,r:t.right,b:t.bottom})) };
  }));
  expect(boxes.length).toBeGreaterThanOrEqual(4);
  const v = page.viewportSize()!;
  for (const {text,font,box:b,panel:p,lines} of boxes) {
    expect(font,text!).toBeGreaterThanOrEqual(12); expect(b.w,text!).toBeGreaterThan(0); expect(b.h,text!).toBeGreaterThan(0);
    expect(b.x,text!).toBeGreaterThanOrEqual(Math.max(0,p.x)); expect(b.y,text!).toBeGreaterThanOrEqual(Math.max(0,p.y));
    expect(b.r,text!).toBeLessThanOrEqual(Math.min(v.width,p.r)+1); expect(b.b,text!).toBeLessThanOrEqual(Math.min(v.height,p.b)+1);
    for(const t of lines) { expect(t.x,text!).toBeGreaterThanOrEqual(b.x-1);expect(t.r,text!).toBeLessThanOrEqual(b.r+1);expect(t.y,text!).toBeGreaterThanOrEqual(b.y-1);expect(t.b,text!).toBeLessThanOrEqual(b.b+1); }
  }
}

test("normal three-human clicks eliminate, skip a dead seat, conquer, freeze and restart", async ({ page }, info) => {
  test.setTimeout(240_000);
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", e => { if (e.type() === "error") errors.push(e.text()); });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/?view=game-setup");
  await page.getByLabel("Seed", {exact:true}).fill("1994");
  await page.getByLabel("Human seats").selectOption("3");
  await page.getByRole("button", {name:"Start game",exact:true}).click();
  let state = opening(1994, 3);
  const policy = policyFor(state);
  let actions = 0, deadSkips = 0, eliminationSeen = false;
  while(state.phase !== "finished" && actions < ACTION_BUDGET) {
    const before = state, action = nextAction(state, policy);
    const next = advance(state, action);
    if(action.kind === "reinforce") await country(page,action.province).click();
    else if(action.kind === "endReinforcement") await page.locator("#start-combat-button").click();
    else if(action.kind === "endTurn") await page.locator("#end-turn-button").click();
    else {
      const from = country(page,action.from);
      if(await from.getAttribute("aria-pressed") !== "true") await from.click();
      await country(page,action.to).click();
      await page.locator("#attack-button").click();
      await expect(page.locator("#result-dialog")).toBeVisible();
      for(const id of [action.from,action.to]) {
        await expect(country(page,id)).toHaveAttribute("data-owner",next.ownerOf[id]!);
        await expect(country(page,id)).toHaveAttribute("data-armies",String(next.armies[id]));
      }
      await page.getByRole("button", {name:"Continue",exact:true}).click();
    }
    state = next; actions++;
    if(action.kind === "reinforce") await expect(page.locator("#reinforcement-pool")).toHaveText(String(state.reinforcementPool));
    if(action.kind === "endTurn") {
      await expect(page.locator("#turn-title")).toHaveText(`${state.players[state.currentPlayer]!.name}'s turn`);
      if(before.players[(before.currentPlayer+1)%3]!.eliminated) {
        deadSkips++; expect(state.players[state.currentPlayer]!.eliminated).toBe(false);
        await capture(page,"living-seat-handoff",info.project.name);
      }
    }
    if(!eliminationSeen && state.players.some(p=>p.eliminated)) {
      eliminationSeen = true;
      expect(state.phase).not.toBe("finished");
      const dead = state.players.find(p=>p.eliminated)!;
      await expect(page.locator(`[data-player="${dead.id}"] .score-num`)).toContainText("0 provinces");
      await capture(page,"first-elimination",info.project.name);
    }
  }
  expect(actions).toBeLessThan(ACTION_BUDGET);expect(deadSkips).toBeGreaterThan(0);
  expect(state.phase).toBe("finished");expect(state.winner).toBe(policy.conqueror);
  const winner = state.players.find(p=>p.id===state.winner)!;
  await expect(page.locator("#turn-title")).toHaveText(`${winner.name} conquers the sea`);
  await expect(page.locator(".turn-sub")).toContainText("The game is over.");
  for(const id of ["attack-button","end-turn-button","start-combat-button"]) await expect(page.locator(`#${id}`)).toBeDisabled();
  await expect(page.locator(`[data-player="${winner.id}"] .score-num`)).toContainText("46 provinces");
  const boardBefore = await page.locator("[data-country]").evaluateAll(ns=>ns.map(n=>[n.getAttribute("data-owner"),n.getAttribute("data-armies")]));
  await country(page,state.map.provinces[0]!.id).click();
  expect(await page.locator("[data-country]").evaluateAll(ns=>ns.map(n=>[n.getAttribute("data-owner"),n.getAttribute("data-armies")]))).toEqual(boardBefore);
  await finishedFit(page); await capture(page,"winner",info.project.name);
  await page.getByRole("button",{name:"New game",exact:true}).click();
  await expect(page.getByRole("heading",{name:"New generated game"})).toBeVisible();
  await expect(page.getByLabel("Seed",{exact:true})).toHaveValue("1994");
  await expect(page.getByLabel("Human seats")).toHaveValue("3");
  await page.getByRole("button",{name:"Start game",exact:true}).click();
  const fresh = opening(1994,3);
  await expect(page.locator("#turn-title")).toHaveText(`${fresh.players[fresh.currentPlayer]!.name}'s turn`);
  await expect(page.locator("#reinforcement-pool")).toHaveText(String(fresh.reinforcementPool));
  for(const p of fresh.map.provinces) {await expect(country(page,p.id)).toHaveAttribute("data-owner",fresh.ownerOf[p.id]!);await expect(country(page,p.id)).toHaveAttribute("data-armies",String(fresh.armies[p.id]));}
  expect(errors).toEqual([]);
});

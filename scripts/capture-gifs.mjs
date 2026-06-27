/**
 * Records short screen captures of each feature flow with Playwright and converts
 * them to GIFs (via ffmpeg-static) into docs/media/. Produces the demo GIFs
 * embedded in README / ENGINEERING_NOTES.
 *
 * This is a one-off authoring tool, NOT an app dependency — Playwright and
 * ffmpeg are intentionally NOT in package.json so they don't bloat installs or
 * the deploy build. Install them on demand only when regenerating the GIFs.
 *
 * Usage:
 *   1. npm i -D playwright ffmpeg-static && npx playwright install chromium
 *   2. Start the app (a fast simulator makes the activity GIF livelier):
 *        SIMULATOR_TICK_MS=4000 npm run start   # or npm run dev
 *   3. node scripts/capture-gifs.mjs
 */
import { chromium } from "playwright";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";

const execFileP = promisify(execFile);
const BASE = process.env.BASE_URL || "http://localhost:3000";
// Optional comma-separated allowlist of scenario names to (re)capture.
const ONLY = (process.env.ONLY || "").split(",").map((s) => s.trim()).filter(Boolean);
const ROOT = process.cwd();
const VIDEO_DIR = path.join(ROOT, ".gif-tmp");
const OUT_DIR = path.join(ROOT, "docs", "media");
const VIEWPORT = { width: 1280, height: 800 };

async function toGif(webmPath, outName, { fps = 12, width = 840, trimStart = 1.0 } = {}) {
  const out = path.join(OUT_DIR, outName);
  const filters =
    `fps=${fps},scale=${width}:-1:flags=lanczos,` +
    `split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3`;
  // -ss before -i trims the blank lead-in (recording starts before first paint).
  await execFileP(ffmpegPath, ["-y", "-ss", String(trimStart), "-i", webmPath, "-vf", filters, "-loop", "0", out]);
  console.log("  → docs/media/" + outName);
}

async function record(browser, { name, storageState, run, gifOpts }) {
  if (ONLY.length && !ONLY.includes(name)) return;
  console.log("● capturing", name);
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    storageState,
    recordVideo: { dir: VIDEO_DIR, size: VIEWPORT },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  try {
    await run(page, ctx);
  } finally {
    const video = page.video();
    await ctx.close();
    const webm = await video.path();
    await toGif(webm, `${name}.gif`, gifOpts);
  }
}

/** Drag the first task in one column into another, with dnd-kit-friendly steps. */
async function dragBetween(page, srcCol, dstCol) {
  const src = page.locator(`[data-testid=column-${srcCol}] [data-testid^=task-]`).first();
  const dst = page.locator(`[data-testid=column-${dstCol}]`);
  const sb = await src.boundingBox();
  const db = await dst.boundingBox();
  if (!sb || !db) return;

  await page.mouse.move(sb.x + sb.width / 2, sb.y + 24);
  await page.mouse.down();
  // Exceed the 6px activation threshold to start the drag.
  await page.mouse.move(sb.x + sb.width / 2, sb.y + 40, { steps: 4 });
  const tx = db.x + db.width / 2;
  const ty = db.y + 120;
  await page.mouse.move(tx, ty, { steps: 24 });
  await page.mouse.move(tx, ty + 6, { steps: 6 });
  await page.waitForTimeout(350);
  await page.mouse.up();
}

async function login(browser) {
  const ctx = await browser.newContext({ viewport: VIEWPORT });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill("#email", "alice@acme.test");
  await page.fill("#password", "password");
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`);
  await page.waitForSelector("[data-testid^=board-card-]");
  const state = await ctx.storageState();
  await ctx.close();
  return state;
}

async function main() {
  await rm(VIDEO_DIR, { recursive: true, force: true });
  await mkdir(VIDEO_DIR, { recursive: true });
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch();
  const auth = await login(browser);

  // 1) Login flow (no auth state).
  await record(browser, {
    name: "login",
    run: async (page) => {
      await page.goto(`${BASE}/login`);
      await page.waitForTimeout(900);
      await page.fill("#email", "alice@acme.test");
      await page.waitForTimeout(300);
      await page.fill("#password", "password");
      await page.waitForTimeout(400);
      await page.click('button[type="submit"]');
      await page.waitForURL(`${BASE}/`);
      await page.waitForSelector("[data-testid^=board-card-]");
      await page.waitForTimeout(1600);
    },
  });

  // 2) Workspace switching.
  await record(browser, {
    name: "workspace-switch",
    storageState: auth,
    run: async (page) => {
      await page.goto(`${BASE}/`);
      await page.waitForSelector("[data-testid^=board-card-]");
      await page.waitForTimeout(900);
      await page.click("[data-testid=ws-switcher]");
      await page.waitForTimeout(700);
      await page.click("[data-testid=ws-option-ws-launch]");
      await page.waitForSelector("[data-testid^=board-card-]");
      await page.waitForTimeout(1500);
      await page.click("[data-testid=ws-switcher]");
      await page.waitForTimeout(500);
      await page.click("[data-testid=ws-option-ws-acme]");
      await page.waitForTimeout(1300);
    },
  });

  // 3) Board drag/drop + reorder.
  await record(browser, {
    name: "board-dnd",
    storageState: auth,
    gifOpts: { fps: 12, width: 760 },
    run: async (page) => {
      await page.goto(`${BASE}/board/b-roadmap`);
      await page.waitForSelector("[data-testid^=task-]");
      await page.waitForTimeout(900);
      await dragBetween(page, "c-roadmap-todo", "c-roadmap-progress");
      await page.waitForTimeout(800);
      await dragBetween(page, "c-roadmap-progress", "c-roadmap-review");
      await page.waitForTimeout(1100);
    },
  });

  // 4) Task create/edit.
  await record(browser, {
    name: "task-crud",
    storageState: auth,
    run: async (page) => {
      await page.goto(`${BASE}/board/b-roadmap`);
      await page.waitForSelector("[data-testid^=column-]");
      await page.waitForTimeout(800);
      await page.click("[data-testid=add-task-c-roadmap-todo]");
      await page.waitForSelector("#task-title");
      await page.waitForTimeout(400);
      await page.type("#task-title", "Write launch checklist", { delay: 45 });
      await page.fill("#task-desc", "Cover QA, comms, and rollback steps.");
      await page.selectOption("#task-pri", "high");
      await page.waitForTimeout(500);
      await page.click('button:has-text("Create task")');
      await page.waitForTimeout(1600);
    },
  });

  // 5) Activity feed (relies on a running simulator; faster tick recommended).
  await record(browser, {
    name: "activity",
    storageState: auth,
    gifOpts: { fps: 11, width: 1000 },
    run: async (page) => {
      await page.goto(`${BASE}/board/b-roadmap`);
      await page.waitForSelector("text=Activity");
      await page.waitForTimeout(800);
      await dragBetween(page, "c-roadmap-todo", "c-roadmap-progress");
      await page.waitForTimeout(1500);
      // Wait for a couple of simulated "teammate" updates (toast + feed entry).
      await page.waitForTimeout(6000);
      // Demonstrate the live-activity toggle: pause, then resume.
      await page.click("[data-testid=simulation-toggle]");
      await page.waitForTimeout(2500);
      await page.click("[data-testid=simulation-toggle]");
      await page.waitForTimeout(2500);
    },
  });

  // 6) Share → public view.
  await record(browser, {
    name: "share-public",
    storageState: auth,
    run: async (page) => {
      await page.goto(`${BASE}/board/b-sprint`);
      await page.waitForSelector("[data-testid=share-button]");
      await page.waitForTimeout(800);
      await page.click("[data-testid=share-button]");
      await page.waitForTimeout(600);
      await page.click("[data-testid=share-toggle]");
      // Confirm it actually went public before navigating (Copy link appears).
      await page.waitForSelector('button:has-text("Copy")', { timeout: 8000 });
      await page.waitForTimeout(1300);
      await page.goto(`${BASE}/public/board/b-sprint`);
      await page.waitForSelector('h1:has-text("Engineering Sprint")');
      await page.waitForTimeout(2200);
    },
  });

  // 7) Search & filter.
  await record(browser, {
    name: "search-filter",
    storageState: auth,
    run: async (page) => {
      await page.goto(`${BASE}/board/b-roadmap`);
      await page.waitForSelector("[data-testid^=task-]");
      await page.waitForTimeout(900);
      for (const ch of "onboarding") {
        await page.type('input[type="search"]', ch, { delay: 60 });
      }
      await page.waitForTimeout(1500);
      await page.fill('input[type="search"]', "");
      await page.waitForTimeout(700);
      await page.selectOption('select[aria-label="Filter by priority"]', "urgent");
      await page.waitForTimeout(1600);
      await page.click('button:has-text("Clear")');
      await page.waitForTimeout(1000);
    },
  });

  // 8) Undo / redo.
  await record(browser, {
    name: "undo-redo",
    storageState: auth,
    run: async (page) => {
      await page.goto(`${BASE}/board/b-roadmap`);
      await page.waitForSelector("[data-testid^=task-]");
      await page.waitForTimeout(900);
      await dragBetween(page, "c-roadmap-todo", "c-roadmap-progress");
      await page.waitForTimeout(1300);
      await page.click('[aria-label="Undo"]');
      await page.waitForTimeout(1500);
      await page.click('[aria-label="Redo"]');
      await page.waitForTimeout(1500);
    },
  });

  // 9) Offline: queue a change offline, then reconnect to sync.
  await record(browser, {
    name: "offline",
    storageState: auth,
    run: async (page, ctx) => {
      await page.goto(`${BASE}/board/b-roadmap`);
      await page.waitForSelector("[data-testid^=task-]");
      await page.waitForTimeout(800);
      await ctx.setOffline(true);
      await page.waitForTimeout(1300);
      await page.click("[data-testid=add-task-c-roadmap-todo]");
      await page.waitForSelector("#task-title");
      await page.type("#task-title", "Drafted while offline", { delay: 45 });
      await page.click('button:has-text("Create task")');
      await page.waitForTimeout(1800);
      await ctx.setOffline(false);
      await page.waitForTimeout(2800);
    },
  });

  await browser.close();
  await rm(VIDEO_DIR, { recursive: true, force: true });
  console.log("\nDone. GIFs in docs/media/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

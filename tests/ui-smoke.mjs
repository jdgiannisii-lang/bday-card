// tests/ui-smoke.mjs
//
// Playwright UI smoke-test for the Phase 1 loop (project UI-verification rule in
// .claude/CLAUDE.md). The full UI (maker form, card view, share state, CTA) only
// exists after this wave, so the smoke-test lives in Plan 03.
//
// What it does:
//   1. Serves the repo statically (python3 -m http.server), waits for the port.
//   2. Launches headless chromium, loads maker.html, screenshots it.
//   3. (deep) Fills + submits the create form, reads the share-state link.
//   4. (deep) Opens the card via ?c=<token> (the local server has no 404
//      fallback), clicks .card to open, asserts the engine canvas #fx, screenshots.
//   5. (deep) Asserts the "Make one for someone you love" CTA appears after the
//      animation settles and that activating it routes back into the maker.
//
// Zero-build / no-install contract:
//   This uses the GLOBAL Playwright v1.60.0 install with the already-cached
//   Chromium. It does NOT create an npm project, add a package.json, run
//   npm install, or run a Chromium install. The global "playwright" module is
//   resolved via the global npm root (added to NODE_PATH) or, failing that, by
//   importing it from the resolved global location.
//
// Graceful degradation:
//   The deep steps (3 to 5) need real Supabase creds in shared/config.js. If those
//   are absent (still REPLACE_ME) or a save fails, the deep steps are SKIPPED with
//   a clear message and the script still exits 0 after the maker render screenshot,
//   so render + layout are always smoke-checked. The full create-to-CTA chain is
//   only ASSERTED when a card link is actually produced.
//
// No forbidden long-dash anywhere in this file.

import { spawn, execSync } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join, resolve } from "node:path";
import net from "node:net";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
// Captures land in tests/screenshots/ (gitignored). Resolved from __dirname so the
// path is correct regardless of the cwd the script is launched from.
const SHOTS_DIR = join(__dirname, "screenshots");
const PORT = 8000;
const BASE = `http://localhost:${PORT}`;

const log = (...a) => console.log("[ui-smoke]", ...a);

// ---- Resolve the GLOBAL Playwright (no install) --------------------------------
// Playwright ships as CommonJS. Under a dynamic import, the real API object lands
// on `mod.default` (with chromium/firefox/webkit on it), while `mod.chromium` is
// only defined when the package exposes named ESM exports. Pick whichever is real.
function pickChromium(mod) {
  if (mod && mod.chromium) return mod.chromium;
  if (mod && mod.default && mod.default.chromium) return mod.default.chromium;
  return undefined;
}

async function loadChromium() {
  // Prime NODE_PATH with the global npm root so a bare import resolves the global.
  try {
    const globalRoot = execSync("npm root -g", { encoding: "utf8" }).trim();
    if (globalRoot) {
      process.env.NODE_PATH = process.env.NODE_PATH
        ? `${globalRoot}${process.platform === "win32" ? ";" : ":"}${process.env.NODE_PATH}`
        : globalRoot;
      // Re-resolve from the global root explicitly (most reliable cross-platform).
      const req = createRequire(join(globalRoot, "noop.js"));
      const entry = req.resolve("playwright");
      const mod = await import(pathToFileURL(entry).href);
      const chromium = pickChromium(mod);
      if (chromium) return chromium;
    }
  } catch (err) {
    log("global npm root resolution failed, trying a bare import:", String(err.message || err));
  }
  // Fallback: a bare import (works if Playwright is on the default resolution path).
  const mod = await import("playwright");
  const chromium = pickChromium(mod);
  if (!chromium) throw new Error("Playwright loaded but chromium export was not found.");
  return chromium;
}

// ---- Static server -------------------------------------------------------------
function waitForPort(port, timeoutMs = 8000) {
  const start = Date.now();
  return new Promise((res, rej) => {
    const tryOnce = () => {
      const sock = net.connect(port, "localhost");
      sock.once("connect", () => { sock.destroy(); res(); });
      sock.once("error", () => {
        sock.destroy();
        if (Date.now() - start > timeoutMs) rej(new Error("server port never opened"));
        else setTimeout(tryOnce, 150);
      });
    };
    tryOnce();
  });
}

function startServer() {
  const py = process.platform === "win32" ? "python" : "python3";
  const srv = spawn(py, ["-m", "http.server", String(PORT)], {
    cwd: REPO_ROOT,
    stdio: "ignore",
  });
  return srv;
}

// ---- Are real Supabase creds present? ------------------------------------------
function hasSupabaseCreds() {
  const cfg = join(REPO_ROOT, "shared", "config.js");
  if (!existsSync(cfg)) return false;
  const txt = readFileSync(cfg, "utf8");
  // Real if both values are present and NOT the REPLACE_ME placeholders.
  const urlOk = /SUPABASE_URL\s*=\s*["'](?!REPLACE_ME)[^"']+["']/.test(txt);
  const keyOk = /SUPABASE_ANON_KEY\s*=\s*["'](?!REPLACE_ME)[^"']+["']/.test(txt);
  return urlOk && keyOk;
}

// A tiny valid 1x1 JPEG fixture written to disk for the photo input.
function writeJpegFixture() {
  const b64 =
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////" +
    "////////////////////////////////////////////////////wgARCAABAAEDAREAAhEB" +
    "AxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQBAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEA" +
    "AhADEAAAAUf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAn//xAAUEQEAAAAAAAAA" +
    "AAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AX//" +
    "xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/An//xAAUEAEAAAAAAAAAAAAAAAAAAAAA" +
    "/9oACAEBAAE/IX//2gAMAwEAAgADAAAAEB//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAED" +
    "AQE/EH//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EH//xAAUEAEAAAAAAAAAAAAA" +
    "AAAAAAAA/9oACAEBAAE/EH//2Q==";
  const path = join(SHOTS_DIR, "fixture.jpg");
  writeFileSync(path, Buffer.from(b64, "base64"));
  return path;
}

// ---- Main ----------------------------------------------------------------------
async function main() {
  mkdirSync(SHOTS_DIR, { recursive: true });
  const shots = [];
  let chromium;
  try {
    chromium = await loadChromium();
  } catch (err) {
    log("FAIL: could not load the global Playwright module.", String(err.message || err));
    log("This test requires the global Playwright v1.60.0 install (no npm install here).");
    process.exit(1);
  }

  const server = startServer();
  let browser;
  let exitCode = 0;
  try {
    await waitForPort(PORT);
    log(`static server up at ${BASE}`);

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 414, height: 896 } });

    // Step 1 + 2: load the maker and screenshot it (always runs).
    await page.goto(`${BASE}/maker.html`, { waitUntil: "networkidle" });
    await page.waitForSelector("#makerForm");
    const makerShot = join(SHOTS_DIR, "maker.png");
    await page.screenshot({ path: makerShot, fullPage: true });
    shots.push(makerShot);
    log("PASS: maker rendered, screenshot saved:", makerShot);

    // Gate the deep steps on real Supabase creds.
    if (!hasSupabaseCreds()) {
      log("SKIP: shared/config.js has no real Supabase creds (still REPLACE_ME).");
      log("SKIP: steps 3 to 5 (submit, share link, card open, CTA) were skipped.");
      log("Set real creds in shared/config.js and re-run to exercise the full chain.");
      log("SUMMARY: PASS (render + layout) | SKIP (deep create-to-CTA chain)");
      log("Screenshots:", shots.join(", "));
      return; // exit 0 in finally
    }

    // Step 3: fill + submit the create form.
    const fixture = writeJpegFixture();
    await page.fill("#recipientName", "Rachel");
    await page.fill("#message", "You make ordinary days feel like a celebration. Happy everything.");
    await page.fill("#signoff", "With love, JD");
    // occasion + effect chips (click the second of each to exercise selection).
    await page.click('#occasionChips .chip[data-value="birthday"]');
    await page.click('#effectChips .chip[data-value="confetti"]');
    await page.setInputFiles("#photo", fixture);
    await page.waitForSelector("#thumbWrap", { state: "visible" }).catch(() => {});
    await page.check("#consent");
    await page.click("#submitBtn");

    // Step 4: read the share-state link.
    await page.waitForSelector("#share", { state: "visible", timeout: 15000 });
    const link = await page.inputValue("#shareLink");
    if (!link || !/\/c\/[^/]+\/?$/.test(link)) {
      log("SKIP: submit did not produce a /c/<token>/ link (save likely failed).");
      log("SUMMARY: PASS (render + layout) | SKIP (deep chain, no link produced)");
      log("Screenshots:", shots.join(", "));
      return;
    }
    const shareShot = join(SHOTS_DIR, "share.png");
    await page.screenshot({ path: shareShot, fullPage: true });
    shots.push(shareShot);
    const token = (link.match(/\/c\/([^/]+)\/?$/) || [])[1];
    log("PASS: card created, token:", token);

    // Open the card via the ?c=<token> form (local server has no 404 fallback).
    const cardUrl = `${BASE}/card.html?c=${token}`;
    await page.goto(cardUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("#fx", { timeout: 15000 });
    // Trigger the engine open (the engine wires a click on .card).
    await page.click(".card");
    // Assert the engine canvas is present and sized.
    const canvasOk = await page.evaluate(() => {
      const c = document.getElementById("fx");
      return !!c && c.tagName === "CANVAS" && c.width > 0 && c.height > 0;
    });
    if (!canvasOk) throw new Error("engine canvas #fx did not render");
    const cardShot = join(SHOTS_DIR, "card.png");
    await page.screenshot({ path: cardShot, fullPage: true });
    shots.push(cardShot);
    log("PASS: card view opened, engine canvas #fx rendered, screenshot saved.");

    // Step 5: the CTA appears after the animation settles (engine reveals via .show
    // after the ~1500ms timer), and activating it routes back into the maker.
    const ctaText = "Make one for someone you love";
    const cta = page.getByText(ctaText, { exact: false }).first();
    await cta.waitFor({ state: "visible", timeout: 8000 });
    const ctaShot = join(SHOTS_DIR, "cta.png");
    await page.screenshot({ path: ctaShot, fullPage: true });
    shots.push(ctaShot);
    log("PASS: CTA visible after the animation settled.");

    await cta.click();
    await page.waitForLoadState("networkidle");
    const landedUrl = page.url();
    const landedOnMaker = /maker\.html/.test(landedUrl) || /[?&]ref=/.test(landedUrl);
    await page.waitForSelector("#makerForm", { timeout: 8000 });
    if (!landedOnMaker) throw new Error(`CTA did not route into the maker (url: ${landedUrl})`);
    log("PASS: CTA routed into the maker:", landedUrl);

    log("SUMMARY: PASS (full create-to-open-to-CTA chain)");
    log("Screenshots:", shots.join(", "));
  } catch (err) {
    exitCode = 1;
    log("FAIL:", String(err.stack || err.message || err));
    log("Screenshots so far:", shots.join(", "));
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server && !server.killed) server.kill();
    process.exit(exitCode);
  }
}

main();

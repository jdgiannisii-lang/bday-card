// shared/analytics.js
//
// The single home for the D-02 engagement logic. card.html (and its byte
// identical twin 404.html) only call into this module; all the dedupe, the
// reduced motion exclusion, and the dwell math live here so the card view stays
// thin.
//
// Cookieless PostHog (research Pattern 3). posthog-js is loaded lazily with a
// dynamic import() from esm.sh (major pinned @1), exactly like shared/supabase.js
// loads its CDN clients, so this module ALSO imports cleanly under plain Node for
// the structural export check (no network module loader there). In the browser
// the dynamic import resolves the first time initAnalytics runs.
//
// POSTHOG_KEY / POSTHOG_HOST come from shared/config.js (gitignored). A missing
// or REPLACE_ME placeholder key degrades to NO analytics, never a broken card:
// initAnalytics returns early, window.posthog stays undefined, and every track()
// call is a no op. The Google Sheet ledger is the source of truth; PostHog only
// corroborates and can be ad blocked at any time.

import { POSTHOG_KEY, POSTHOG_HOST } from "./config.js";

const POSTHOG_ESM = "https://esm.sh/posthog-js@1";

// The dwell threshold for the short note fallback. D-02 fixes 8s as a tunable
// starting point (research Open Question 3); kept as a named constant so the dry
// run can retune it from one place. dwell_ms is also recorded on card_engaged so
// the real reading time is visible in PostHog.
const DWELL_THRESHOLD_MS = 8000;

// Module level session state. One page load is one session (cookieless: there is
// no cross load persistence by design).
let _engagedFired = false; // card_engaged fires at most once per session (Pitfall 5)
let _reduceMotion = false; // reduced motion sessions are EXCLUDED from the engaged denominator (D-02)

// Visible dwell accumulator. We sum only the time the page was actually visible,
// so backgrounding the tab pauses the clock (the >=8s must be 8s of VISIBLE time).
let _dwellMs = 0; // cumulative visible milliseconds
let _dwellSince = 0; // timestamp the current visible stretch began (0 = clock paused)
let _dwellTimer = null; // setTimeout id for the threshold check while visible
let _dwellArmed = false; // startDwellTimer ran (the card was actually opened)

function _now() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

// Is the configured key a real one (not the placeholder, not empty)? A REPLACE_ME
// or blank key means analytics is intentionally off.
function _keyIsReal(key) {
  return typeof key === "string" && key.length > 0 && key.indexOf("REPLACE_ME") === -1;
}

// initAnalytics({ cardId, generation, reduceMotion })
//   Initializes cookieless PostHog and registers the card_id + generation super
//   properties so every event carries them. If reduceMotion is true it also tags
//   the session with reduced_motion: true (so funnels can EXCLUDE it per D-02).
//   Safe to call once per page load. Never throws; never blocks the open.
export async function initAnalytics(opts) {
  const o = opts || {};
  _reduceMotion = !!o.reduceMotion;

  // No real key: analytics stays off. The card still opens and plays.
  if (!_keyIsReal(POSTHOG_KEY)) return;

  try {
    const mod = await import(/* @vite-ignore */ POSTHOG_ESM);
    const posthog = mod && (mod.default || mod);
    if (!posthog || typeof posthog.init !== "function") return;

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST || "https://us.i.posthog.com",
      cookieless_mode: "always", // 2026 cookieless API: no cookies, no local/session storage
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
    });

    // Expose for the if (window.posthog) guards in track(); this is also how the
    // card view stays decoupled from the import.
    if (typeof window !== "undefined") window.posthog = posthog;

    const register = {
      card_id: o.cardId || "unknown",
      generation: o.generation == null ? 0 : o.generation,
    };
    if (_reduceMotion) register.reduced_motion = true;
    posthog.register(register);
  } catch (err) {
    // Ad blocked, offline, or CDN hiccup: analytics simply stays off. Never throw.
  }
}

// track(event, props)
//   Fire and forget. Guarded by if (window.posthog) so a blocked or absent
//   PostHog never throws. Returns nothing; the caller never awaits it.
export function track(event, props) {
  try {
    if (typeof window === "undefined" || !window.posthog) return;
    window.posthog.capture(event, props || {});
  } catch (err) {
    // Never let analytics break the open.
  }
}

// _fireEngaged(via)
//   The shared dedupe + reduced motion gate for both engaged paths. Fires
//   card_engaged exactly once per session, and NEVER for a reduced motion session
//   (those are excluded from the craft conversion denominator, D-02). via is
//   either note_bottom or dwell; dwell_ms is the measured visible dwell so far.
function _fireEngaged(via) {
  if (_engagedFired) return; // dedupe: at most once per session (Pitfall 5)
  if (_reduceMotion) return; // EXCLUDED: reduced motion never reaches the engaged step (D-02)
  _engagedFired = true;
  // Stop the dwell clock; we are done with engagement.
  if (_dwellTimer) {
    clearTimeout(_dwellTimer);
    _dwellTimer = null;
  }
  track("card_engaged", { via: via, dwell_ms: Math.round(_currentDwellMs()) });
}

// markEngagedOnBottom()
//   The note bottom path. The card view calls this the first time the engine
//   reaches the bottom of the note (the atBottom()/.read signal). Fires
//   card_engaged once with via: note_bottom (subject to the shared dedupe +
//   reduced motion gate).
export function markEngagedOnBottom() {
  _fireEngaged("note_bottom");
}

// _currentDwellMs()
//   Total visible dwell so far: the banked _dwellMs plus the open visible stretch
//   (if the clock is currently running).
function _currentDwellMs() {
  let total = _dwellMs;
  if (_dwellSince) total += _now() - _dwellSince;
  return total;
}

// _scheduleDwellCheck()
//   While the page is visible, schedule the card_engaged fire for the moment the
//   cumulative visible dwell crosses the threshold. Recomputed whenever the clock
//   resumes so the remaining wait reflects already banked visible time.
function _scheduleDwellCheck() {
  if (_dwellTimer) {
    clearTimeout(_dwellTimer);
    _dwellTimer = null;
  }
  if (_engagedFired || _reduceMotion) return;
  const remaining = DWELL_THRESHOLD_MS - _currentDwellMs();
  if (remaining <= 0) {
    _fireEngaged("dwell");
    return;
  }
  _dwellTimer = setTimeout(function () {
    _dwellTimer = null;
    if (_currentDwellMs() >= DWELL_THRESHOLD_MS) _fireEngaged("dwell");
  }, remaining);
}

// startDwellTimer()
//   The >=8s visible dwell fallback for notes too short to scroll. The card view
//   calls this on open. The clock begins counting visible time immediately; when
//   cumulative VISIBLE dwell reaches DWELL_THRESHOLD_MS, card_engaged fires once
//   with via: dwell (same dedupe + reduced motion gate as the bottom path).
//   Reduced motion sessions never arm the clock (they are excluded anyway).
export function startDwellTimer() {
  if (_reduceMotion || _engagedFired) return;
  _dwellArmed = true;
  // Begin a visible stretch now (the card view starts visible on open).
  if (!_dwellSince) _dwellSince = _now();
  _scheduleDwellCheck();
}

// pauseDwell()
//   The card view forwards a visibilitychange to hidden here. Banks the elapsed
//   visible time and stops the clock, so a backgrounded tab does not accrue dwell.
export function pauseDwell() {
  if (!_dwellSince) return;
  _dwellMs += _now() - _dwellSince;
  _dwellSince = 0;
  if (_dwellTimer) {
    clearTimeout(_dwellTimer);
    _dwellTimer = null;
  }
}

// resumeDwell()
//   The card view forwards a visibilitychange back to visible here. Restarts the
//   clock and reschedules the threshold check against the already banked time.
//   Only acts once startDwellTimer armed the clock: the card view forwards EVERY
//   visibilitychange, and without this gate a recipient who backgrounds the tab
//   on the closed cover and comes back would start accruing dwell (and fire
//   card_engaged) without ever opening the card.
export function resumeDwell() {
  if (!_dwellArmed || _engagedFired || _reduceMotion) return;
  if (!_dwellSince) _dwellSince = _now();
  _scheduleDwellCheck();
}

// setGeneration(g)
//   Re-registers the generation super property once the card row arrives. Share
//   links carry no ?g=, so the URL-derived generation is 0 for every shared open;
//   the row's stored generation is the truth. Updating the super prop here keeps
//   card_opened / card_engaged / cta_clicked attributable to the right depth.
export function setGeneration(g) {
  try {
    if (typeof window !== "undefined" && window.posthog && Number.isFinite(g)) {
      window.posthog.register({ generation: g });
    }
  } catch (err) {
    // Never let analytics break the open.
  }
}

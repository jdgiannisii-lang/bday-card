// shared/supabase.js
//
// The thin Supabase data layer for the Walking Skeleton (D-01: token as
// capability, no auth, controlled cohort). Imported as an ES module by
// maker.html and card.html, straight from a CDN with no build step.
//
// The third party clients (supabase-js, nanoid) are loaded with dynamic import()
// from esm.sh, major pinned per SKELETON.md. They are loaded lazily (inside the
// functions that need them) so this module also imports cleanly under plain Node
// for the structural export check, which has no network module loader. In the
// browser the dynamic imports resolve normally the first time saveCard or
// getCardByToken runs.
//
// SUPABASE_URL and SUPABASE_ANON_KEY come from shared/config.js (gitignored).
// Copy shared/config.example.js to shared/config.js and fill both in. Both are
// public by design; the service_role key must never appear in client code.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

const SUPABASE_ESM = "https://esm.sh/@supabase/supabase-js@2";
const NANOID_ESM = "https://esm.sh/nanoid@5";
const PHOTO_BUCKET = "card-photos";

// Lazily created client singleton. We do not build it at module load so the
// structural import check (no network) stays green; the browser builds it on the
// first saveCard or getCardByToken call.
let _client = null;

async function getClient() {
  if (_client) return _client;
  const { createClient } = await import(/* @vite-ignore */ SUPABASE_ESM);
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

async function mintToken() {
  const { nanoid } = await import(/* @vite-ignore */ NANOID_ESM);
  // Default 21 char alphabet, about 126 bits of entropy: unguessable enough to
  // be the sole capability for the controlled cohort (research A2).
  return nanoid();
}

// saveCard(formData)
//   formData: {
//     recipientName, message, signoff, occasion, effect, emojis, theme,
//     photoBlobs (Blob[] in strip order) or photoBlob (single, back-compat),
//     whoSentYou, refCardId, generation
//   }
//   Mints a token, uploads the photos (if any) to unguessable Storage paths,
//   inserts the cards row, and returns { token, url } where url is the absolute
//   card.html?c=<token> link. On any Supabase error it returns { error } rather
//   than throwing, so the maker can show the UI-SPEC error copy.
export async function saveCard(formData) {
  try {
    const data = formData || {};
    const client = await getClient();
    const token = await mintToken();

    // Photos: accept an array (photoBlobs, in strip order) or a single photoBlob
    // for back-compat. Each uploads to an unguessable path under the token.
    // photo_url keeps the first photo (single-polaroid + back-compat); content.photos
    // carries all of them so the engine can roll out a photo-booth strip (2+).
    const blobs = Array.isArray(data.photoBlobs)
      ? data.photoBlobs.filter(Boolean)
      : (data.photoBlob ? [data.photoBlob] : []);
    const photo_urls = [];
    const uploaded_paths = [];
    // Best-effort removal of already-uploaded photos when a later step fails,
    // so a failed save does not strand orphan files in the bucket.
    async function cleanupUploads() {
      if (!uploaded_paths.length) return;
      try {
        await client.storage.from(PHOTO_BUCKET).remove(uploaded_paths);
      } catch (e) {
        // Cleanup is best effort; the save error is what the caller sees.
      }
    }
    for (let i = 0; i < blobs.length; i++) {
      const path = `photos/${token}-${i}.jpg`; // token is a nanoid: unguessable
      const up = await client.storage
        .from(PHOTO_BUCKET)
        .upload(path, blobs[i], { contentType: "image/jpeg", upsert: false });
      if (up.error) {
        await cleanupUploads();
        return { error: up.error };
      }
      uploaded_paths.push(path);
      const pub = client.storage.from(PHOTO_BUCKET).getPublicUrl(path);
      if (pub && pub.data && pub.data.publicUrl) photo_urls.push(pub.data.publicUrl);
    }
    const photo_url = photo_urls.length ? photo_urls[0] : null;

    // Card text content. Message is split into paragraphs by the caller or here;
    // we keep it as an array of non empty lines so the engine bridge can render
    // one <p> per paragraph with textContent (never innerHTML).
    const message = Array.isArray(data.message)
      ? data.message
      : String(data.message || "")
          .split(/\n\s*\n/)
          .map((s) => s.trim())
          .filter(Boolean);

    const content = {
      recipientName: data.recipientName || "",
      message,
      signoff: data.signoff || "",
      photos: photo_urls,
      emojis: Array.isArray(data.emojis) ? data.emojis.filter(Boolean).slice(0, 8) : [],
      // Sender-picked theme, validated against the same allowlist the card
      // view enforces (the row is untrusted either way; cream is the default).
      theme: ["cream", "sage", "dusk", "sky"].indexOf(data.theme) !== -1 ? data.theme : "cream",
      // Optional age for the birthday medallion (integers 1 to 120 only; the
      // bridge re-validates on read because the row is untrusted).
      age: Number.isInteger(data.age) && data.age >= 1 && data.age <= 120 ? data.age : null,
      // Self-reported propagation evidence for the ledger. Stored in the row
      // (never sent to analytics: it is free-text PII).
      whoSentYou: data.whoSentYou || "",
    };

    const row = {
      token,
      content,
      photo_url,
      occasion: data.occasion || "justBecause",
      effect: data.effect || "hearts",
      ref_card_id: data.refCardId || null,
      generation: Number.isFinite(data.generation) ? data.generation : 0,
    };

    const ins = await client.from("cards").insert(row);
    if (ins.error) {
      await cleanupUploads();
      return { error: ins.error };
    }

    // Build the share URL relative to the app's deployment directory so it works
    // both at the domain root (localhost) and under a project Pages subpath
    // (e.g. /bday-card/). saveCard runs from the maker, which sits at the app root,
    // so the directory of the current path IS the app root.
    const base = location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1);
    // Use the ?c= form (card.html?c=<token>): on GitHub Pages it returns HTTP 200
    // so link previews render in iMessage/WhatsApp, whereas a clean /c/<token>/
    // path returns 404 (SPA fallback) and can suppress the preview. The clean
    // route still works for anyone who has such a link.
    const url = `${location.origin}${base}card.html?c=${token}`;
    return { token, url };
  } catch (err) {
    return { error: err };
  }
}

// getCardByToken(token)
//   Reads the single cards row for a token. Returns the row, or null if it is
//   missing or the read errors (so the recipient view can degrade to the cover
//   plus a soft retry message instead of throwing).
//
//   Reads go through the get_card(p_token) SECURITY DEFINER function (migration
//   0002): direct SELECT on cards is revoked so the table cannot be enumerated
//   with the public anon key. If the function is missing (0002 not applied yet)
//   we fall back to the old direct select so existing deployments keep working.
export async function getCardByToken(token) {
  try {
    if (!token) return null;
    const client = await getClient();
    const rpc = await client.rpc("get_card", { p_token: token });
    if (!rpc.error) {
      const rows = Array.isArray(rpc.data) ? rpc.data : (rpc.data ? [rpc.data] : []);
      return rows.length ? rows[0] : null;
    }
    // Fallback for databases still on migration 0001 only.
    const res = await client.from("cards").select("*").eq("token", token).single();
    if (res.error) return null;
    return res.data || null;
  } catch (err) {
    return null;
  }
}

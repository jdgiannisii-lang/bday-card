// shared/photo.js
//
// Client-side photo downscale for the maker (research Don't Hand-Roll + Pitfall 3).
// Browser-native only: createImageBitmap to decode, a temporary canvas to draw,
// and canvas.toBlob to re-encode a JPEG under the max long edge. No library.
//
// Why this exists (Plan 03):
//  - Storage hygiene: an iPhone photo can be 3 to 8 MB. Downscaling to a ~1600px
//    JPEG at 0.8 quality kills 70%+ of the bytes, keeping the Supabase free tier
//    comfortable (research A3) and the upload fast.
//  - HEIC graceful failure: createImageBitmap decodes HEIC natively only in Safari.
//    On Chrome/Firefox an iPhone HEIC throws or yields a blank. We wrap the decode
//    in try/catch and surface a TYPED error so the maker can show the "ask for a
//    JPEG" copy instead of a blank polaroid (research Pitfall 3).
//
// The caller distinguishes three failure modes by the error's `code`:
//   "too_large" -> the original file is over the 10MB UI-SPEC cap.
//   "decode"    -> the image could not be decoded (the HEIC-on-non-Safari case).
//   "encode"    -> the canvas re-encode (toBlob) failed.
// A network/save failure is NOT raised here; that is the upload layer's concern,
// so the maker can tell the two apart and show the right UI-SPEC copy.

// The long edge of the output never exceeds this. ~1600px keeps the polaroid crisp
// on a phone while shedding most of the bytes.
export const MAX_EDGE = 1600;

// JPEG quality for the re-encode. 0.8 is the research-recommended sweet spot.
export const JPEG_QUALITY = 0.8;

// The UI-SPEC oversize cap (10MB). Checked on the ORIGINAL file so a huge upload
// is rejected before we even try to decode it.
export const MAX_BYTES = 10 * 1024 * 1024;

// A typed error so the maker can branch on the failure mode. Plain Error subclass
// (no library) carrying a stable `code`.
export class PhotoError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = "PhotoError";
    this.code = code;
  }
}

// downscalePhoto(file) -> Promise<Blob>
//   Rejects early with PhotoError("too_large") if the original is over the cap.
//   Decodes with createImageBitmap (PhotoError("decode") on failure, the HEIC case),
//   draws onto a canvas sized so the long edge is at most MAX_EDGE (aspect ratio
//   preserved, never upscaled), and resolves the JPEG Blob from canvas.toBlob
//   (PhotoError("encode") on failure).
export async function downscalePhoto(file) {
  if (!file) {
    throw new PhotoError("decode", "No file provided.");
  }

  // Reject oversize originals before decoding, so the maker shows the too-big copy.
  if (typeof file.size === "number" && file.size > MAX_BYTES) {
    throw new PhotoError("too_large", "Photo exceeds the 10MB cap.");
  }

  // Decode. This is the step that fails for an iPhone HEIC outside Safari, so we
  // map any throw here to the typed decode error (research Pitfall 3).
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch (err) {
    throw new PhotoError("decode", "Could not decode the image.");
  }

  try {
    const srcW = bitmap.width;
    const srcH = bitmap.height;
    if (!srcW || !srcH) {
      throw new PhotoError("decode", "Image had no dimensions.");
    }

    // Scale so the long edge is at most MAX_EDGE. Never upscale a small photo.
    const longEdge = Math.max(srcW, srcH);
    const scale = longEdge > MAX_EDGE ? MAX_EDGE / longEdge : 1;
    const outW = Math.max(1, Math.round(srcW * scale));
    const outH = Math.max(1, Math.round(srcH * scale));

    const canvas = makeCanvas(outW, outH);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new PhotoError("encode", "Canvas 2D context unavailable.");
    }
    // JPEG has no alpha channel: without this fill, a transparent PNG's clear
    // pixels re-encode as black. Paint white first so transparency stays paper.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(bitmap, 0, 0, outW, outH);

    const blob = await canvasToJpegBlob(canvas);
    if (!blob) {
      throw new PhotoError("encode", "Could not encode the JPEG.");
    }
    return blob;
  } finally {
    // Free the decoded bitmap regardless of outcome.
    if (bitmap && typeof bitmap.close === "function") bitmap.close();
  }
}

// Prefer an OffscreenCanvas where available (it works off the DOM and in tests),
// falling back to a detached <canvas> element in the browser.
function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(w, h);
  }
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

// Resolve a JPEG Blob from either an OffscreenCanvas (convertToBlob) or a DOM
// canvas (toBlob). Returns null if neither path produces a blob.
function canvasToJpegBlob(canvas) {
  if (typeof canvas.convertToBlob === "function") {
    return canvas
      .convertToBlob({ type: "image/jpeg", quality: JPEG_QUALITY })
      .catch(() => null);
  }
  return new Promise((resolve) => {
    if (typeof canvas.toBlob !== "function") {
      resolve(null);
      return;
    }
    canvas.toBlob((blob) => resolve(blob || null), "image/jpeg", JPEG_QUALITY);
  });
}

// shared/config.example.js
//
// Copy this file to shared/config.js and fill in the two values from your
// Supabase project. shared/config.js is gitignored, so your real keys never get
// committed. Both values below are PUBLIC by design (the anon key is safe in
// client code; RLS is the real control). NEVER put the service_role key here.
//
//   SUPABASE_URL ......  Supabase Dashboard -> Project Settings -> API -> Project URL
//   SUPABASE_ANON_KEY .  Supabase Dashboard -> Project Settings -> API -> Project API keys -> anon public
//   POSTHOG_KEY .......  PostHog Dashboard -> Project Settings -> Project API Key (the phc_ key; public by design)
//   POSTHOG_HOST ......  PostHog Dashboard -> Project Settings -> API Host (e.g. https://us.i.posthog.com)
//
// After copying, also make a PUBLIC Storage bucket named card-photos
// (directory listing OFF) and run supabase/migrations/0001_cards.sql in the
// SQL Editor.
//
// PostHog is optional. If POSTHOG_KEY is left as the REPLACE_ME placeholder (or
// empty), analytics quietly turns off and the card still opens and plays. The
// Google Sheet ledger is the source of truth; PostHog only corroborates.

export const SUPABASE_URL = "REPLACE_ME_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "REPLACE_ME_SUPABASE_ANON_KEY";

// PostHog (cookieless analytics). Public by design (the phc_ key is meant to ship
// in client code). Leave as REPLACE_ME to disable analytics entirely.
export const POSTHOG_KEY = "REPLACE_ME_POSTHOG_KEY";
export const POSTHOG_HOST = "https://us.i.posthog.com";

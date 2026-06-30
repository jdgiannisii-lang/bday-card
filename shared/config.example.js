// shared/config.example.js
//
// Copy this file to shared/config.js and fill in the two values from your
// Supabase project. shared/config.js is gitignored, so your real keys never get
// committed. Both values below are PUBLIC by design (the anon key is safe in
// client code; RLS is the real control). NEVER put the service_role key here.
//
//   SUPABASE_URL ......  Supabase Dashboard -> Project Settings -> API -> Project URL
//   SUPABASE_ANON_KEY .  Supabase Dashboard -> Project Settings -> API -> Project API keys -> anon public
//
// After copying, also make a PUBLIC Storage bucket named card-photos
// (directory listing OFF) and run supabase/migrations/0001_cards.sql in the
// SQL Editor.

export const SUPABASE_URL = "REPLACE_ME_SUPABASE_URL";
export const SUPABASE_ANON_KEY = "REPLACE_ME_SUPABASE_ANON_KEY";

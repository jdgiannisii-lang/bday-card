-- 0001_cards.sql
-- Walking Skeleton card store for Phase 1 (Validate the Loop), decision D-01.
--
-- Security model (token as capability):
--   The card token is a 21 char nanoid (~126 bits of entropy). That unguessable
--   token IS the access capability. There is no auth at Stage 0 (controlled
--   cohort), so the public anon role may SELECT and INSERT, but never UPDATE or
--   DELETE. A card is therefore immutable and non deletable by the public; the
--   founder unpublishes a card by deleting its row manually from the dashboard.
--
--   Anyone holding a token can read its row, and a client with the anon key
--   could in principle page the table. That blast radius is accepted for the
--   controlled cohort (no listing UI is ever shipped). The Phase 4 hardening is
--   a SECURITY DEFINER RPC get_card(p_token text) that resolves a token to a row
--   with direct table SELECT revoked. We do not build that here.
--
-- Run this in the Supabase Dashboard SQL Editor on a fresh free project, then
-- create a PUBLIC Storage bucket named card-photos (directory listing OFF).

create table public.cards (
  token       text primary key,                       -- the nanoid; the capability
  content     jsonb not null,                          -- recipientName, message, signoff, coverTitle, caption
  photo_url   text,                                    -- public URL of the uploaded photo (unguessable path)
  occasion    text not null default 'justBecause',     -- justBecause, thinkingOfYou, birthday (D-04)
  effect      text not null default 'hearts',          -- existing hand coded effects only (D-04)
  ref_card_id text,                                     -- the card that spawned this one (generation edge)
  generation  int  not null default 0,                 -- generation depth for attribution
  created_at  timestamptz not null default now()
);

-- Enable row level security so the policies below are the only access path.
alter table public.cards enable row level security;

-- Public read: the token in the caller's WHERE clause is the gate. No listing UI
-- is ever shipped, so this scoped public SELECT is acceptable for Stage 0.
create policy "public read cards"
  on public.cards
  for select
  to anon
  using (true);

-- Public create: anyone in the controlled cohort can mint a card (no auth yet).
create policy "public create cards"
  on public.cards
  for insert
  to anon
  with check (true);

-- Intentionally NO update or delete policy for anon. Cards stay immutable and
-- non deletable by the public; the founder deletes a row to unpublish a card.

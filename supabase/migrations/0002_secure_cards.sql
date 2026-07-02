-- 0002_secure_cards.sql
-- Hardening pass on the Walking Skeleton card store (the "Phase 4 hardening"
-- promised in 0001). The product model is unchanged: token as capability, no
-- auth, anonymous senders. What changes is the blast radius.
--
-- Why:
--   0001 gave anon a blanket SELECT policy (using (true)), which means anyone
--   holding the public anon key can page the whole cards table through
--   PostgREST and dump every private message, name, and photo URL. The token
--   was never really the gate; it was a convention. This migration makes the
--   token the actual gate:
--
--   1. Anon (and authenticated) lose direct SELECT on public.cards entirely.
--      The table is no longer enumerable via the REST API.
--   2. A SECURITY DEFINER function, get_card(p_token text), becomes the only
--      read path. It resolves exactly one token to exactly one row and returns
--      only the columns the card view needs (no ref_card_id, so a card cannot
--      be walked back to the card that spawned it).
--   3. The anon INSERT policy gains abuse constraints: bounded content size,
--      bounded generation depth, sane token length, and closed enums for
--      occasion and effect. Anonymous sending stays free, it just cannot be
--      used to stuff megabytes of junk or forge nonsense rows.
--   4. The card-photos storage INSERT policy now also requires the object key
--      to live under photos/, so anon cannot scribble objects at arbitrary
--      paths in the bucket.
--   5. The card-photos bucket itself enforces a 5 MB cap and image/jpeg only,
--      so oversized or non image uploads are rejected server side.
--
-- Cards remain immutable and non deletable by the public (no UPDATE or DELETE
-- policy for anon existed, and none is added).

-- ---------------------------------------------------------------------------
-- 1. Close the enumeration hole: drop the blanket anon SELECT policy and
--    revoke direct SELECT on the table from the public facing roles. RLS stays
--    enabled, so even a future stray grant is still policy gated.
-- ---------------------------------------------------------------------------
drop policy if exists "public read cards" on public.cards;

revoke select on table public.cards from anon;
revoke select on table public.cards from authenticated;

-- ---------------------------------------------------------------------------
-- 2. The one true read path: get_card(p_token). SECURITY DEFINER so it can
--    read the table that anon no longer can; STABLE because it only reads;
--    search_path pinned to public so a malicious schema cannot shadow the
--    table. Returns only what the card view renders. An unknown token returns
--    zero rows (indistinguishable from a card that never existed).
-- ---------------------------------------------------------------------------
create or replace function public.get_card(p_token text)
returns table (
  token      text,
  content    jsonb,
  photo_url  text,
  occasion   text,
  effect     text,
  generation int,
  created_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    c.token,
    c.content,
    c.photo_url,
    c.occasion,
    c.effect,
    c.generation,
    c.created_at
  from public.cards c
  where c.token = p_token;
$$;

-- Least privilege: strip the default PUBLIC execute grant, then hand execute
-- back to anon only (the recipient view runs as anon; nothing else needs it).
revoke execute on function public.get_card(text) from public;
grant execute on function public.get_card(text) to anon;

-- ---------------------------------------------------------------------------
-- 3. Constrain anonymous card creation. Anyone may still mint a card (the
--    viral loop depends on it), but a row must now look like a card:
--      content    - at most 20 KB of JSON, enough for any handwritten note
--      generation - 0 to 20, deeper chains are noise or abuse
--      token      - 15 to 40 chars, brackets the 21 char nanoid convention
--      occasion   - one of the three shipped occasions (D-04)
--      effect     - one of the hand coded effects only (D-04)
-- ---------------------------------------------------------------------------
drop policy if exists "public create cards" on public.cards;

create policy "public create cards"
  on public.cards
  for insert
  to anon
  with check (
    octet_length(content::text) <= 20000
    and generation between 0 and 20
    and char_length(token) between 15 and 40
    and occasion in ('justBecause', 'thinkingOfYou', 'birthday')
    and effect in ('hearts', 'confetti', 'petals', 'sparkles', 'balloons')
  );

-- ---------------------------------------------------------------------------
-- 4. Storage upload policy: still insert only, still scoped to the
--    card-photos bucket, but now the object key must live under photos/ so
--    anon cannot plant objects at arbitrary paths in the bucket.
-- ---------------------------------------------------------------------------
drop policy if exists "anon upload card-photos" on storage.objects;

create policy "anon upload card-photos"
  on storage.objects
  for insert
  to anon
  with check (
    bucket_id = 'card-photos'
    and name like 'photos/%'
  );

-- ---------------------------------------------------------------------------
-- 5. Bucket level enforcement: 5 MB max per object, JPEG only. The client
--    already re-encodes uploads to JPEG, so this rejects only abuse, never a
--    legitimate card.
-- ---------------------------------------------------------------------------
update storage.buckets
set
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg']
where id = 'card-photos';

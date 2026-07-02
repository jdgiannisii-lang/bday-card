-- 0004_reactions.sql
-- Reactions: append-only love notes back to the sender. A recipient taps one
-- emoji on an open card and the tap lands here: anonymous, no account, token
-- as capability, exactly like the cards themselves.
--
-- Why this shape:
--   1. Append only. Anon can INSERT a reaction but can never read, update, or
--      delete the table. A reaction cannot be enumerated, traced, or edited
--      after the fact; the table is a one-way mailbox.
--   2. Counts only. The single read path is get_reactions(p_token), a
--      SECURITY DEFINER aggregate that resolves one token to its per-kind
--      counts. Nobody sees rows, timestamps, or order; "3 sent back" is all
--      that ever leaves the database.
--   3. Gated by existence. The card view probes get_reactions once per open
--      and hides the whole reaction pill when the call errors, so a database
--      that has not run this migration serves cards exactly as before.
--      Nothing breaks forward or backward.
--
-- The kinds are a closed enum (heart, tears, party, hug) and the token length
-- check brackets the 21 char nanoid convention, same as the cards insert
-- policy in 0002.

-- ---------------------------------------------------------------------------
-- 1. The table. Identity key, no foreign key to cards on purpose: a reaction
--    to a card that was never saved is harmless noise, and skipping the FK
--    means this table cannot be used to probe which tokens exist.
-- ---------------------------------------------------------------------------
create table public.reactions (
  id         bigint generated always as identity primary key,
  card_token text not null,
  kind       text not null,
  created_at timestamptz not null default now(),
  check (char_length(card_token) between 15 and 40),
  check (kind in ('heart', 'tears', 'party', 'hug'))
);

-- Counts are always read per token; give the aggregate an index to lean on.
create index on public.reactions (card_token);

-- ---------------------------------------------------------------------------
-- 2. Close the read path entirely: RLS on, and the public facing roles
--    stripped of direct SELECT. RLS stays enabled so even a future stray
--    grant is still policy gated (same posture as cards in 0002).
-- ---------------------------------------------------------------------------
alter table public.reactions enable row level security;

revoke select on table public.reactions from anon;
revoke select on table public.reactions from authenticated;

-- ---------------------------------------------------------------------------
-- 3. The one write path: anon INSERT, with the table's own checks repeated in
--    the policy so a dropped constraint still cannot smuggle a bad row in.
-- ---------------------------------------------------------------------------
create policy "public react"
  on public.reactions
  for insert
  to anon
  with check (
    char_length(card_token) between 15 and 40
    and kind in ('heart', 'tears', 'party', 'hug')
  );

-- ---------------------------------------------------------------------------
-- 4. The one read path: get_reactions(p_token). SECURITY DEFINER so it can
--    aggregate the table that anon no longer can; STABLE because it only
--    reads; search_path pinned to public so a malicious schema cannot shadow
--    the table. Returns per-kind counts and nothing else. An unreacted token
--    returns zero rows (indistinguishable from a card that never existed).
-- ---------------------------------------------------------------------------
create or replace function public.get_reactions(p_token text)
returns table (
  kind text,
  n    bigint
)
language sql
security definer
stable
set search_path = public
as $$
  select
    r.kind,
    count(*) as n
  from public.reactions r
  where r.card_token = p_token
  group by r.kind;
$$;

-- Least privilege: strip the default PUBLIC execute grant, then hand execute
-- back to anon only (the card view runs as anon; nothing else needs it).
revoke execute on function public.get_reactions(text) from public;
grant execute on function public.get_reactions(text) to anon;

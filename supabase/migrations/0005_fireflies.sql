-- 0005_fireflies.sql
-- The engine grew a sixth hand coded effect (fireflies) and the bridge now
-- accepts it, but the insert policy from 0003 closes the effect enum at five
-- values, so a card made with fireflies would be rejected at the database.
-- This migration widens only that allowlist.
--
-- Why:
--   1. The "public create cards" policy is recreated in full, not altered.
--      Every other constraint from 0003 is repeated verbatim: content size,
--      generation bounds, token length, and the six occasion allowlist.
--      Nothing loosens except the effect list, which grows from five to six.
--   2. This policy supersedes 0003's version of the same policy. Running
--      0001 then 0002 then 0003 then 0005 in order is the normal path (0004
--      is independent: it only adds reactions); the drop below simply
--      replaces 0003's policy with this one.
--   3. A database that ran 0001 and skips straight to 0005 still ends up with
--      a fully constrained insert policy, because this file carries the whole
--      with check clause rather than patching the old one.
--
-- Cards remain immutable and non deletable by the public (no UPDATE or DELETE
-- policy for anon existed, and none is added).

-- ---------------------------------------------------------------------------
-- 1. Recreate the anon insert policy with the six effect allowlist. All the
--    other clauses match 0003 exactly.
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
    and occasion in ('justBecause', 'thinkingOfYou', 'birthday', 'congrats', 'thankYou', 'missYou')
    and effect in ('hearts', 'confetti', 'petals', 'sparkles', 'balloons', 'fireflies')
  );

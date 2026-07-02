-- 0003_more_occasions.sql
-- The client shipped three new occasions (congrats, thankYou, missYou) in the
-- maker and the engine bridge. The insert policy from 0002 closes the occasion
-- enum at three values, so a card made with any new occasion would be rejected
-- at the database. This migration widens only that allowlist.
--
-- Why:
--   1. The "public create cards" policy is recreated in full, not altered.
--      Every other constraint from 0002 is repeated verbatim: content size,
--      generation bounds, token length, and the closed effect enum. Nothing
--      loosens except the occasion list, which grows from three to six.
--   2. This policy supersedes 0002's version of the same policy. Running
--      0001 then 0002 then 0003 in order is the normal path; the drop below
--      simply replaces 0002's policy with this one.
--   3. A database that ran 0001 and skips straight to 0003 still ends up with
--      a fully constrained insert policy, because this file carries the whole
--      with check clause rather than patching the old one.
--
-- Cards remain immutable and non deletable by the public (no UPDATE or DELETE
-- policy for anon existed, and none is added).

-- ---------------------------------------------------------------------------
-- 1. Recreate the anon insert policy with the six occasion allowlist. All the
--    other clauses match 0002 exactly.
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
    and effect in ('hearts', 'confetti', 'petals', 'sparkles', 'balloons')
  );

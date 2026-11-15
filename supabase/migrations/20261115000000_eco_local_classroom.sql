begin;

-- Local classroom games read the shared bank and the teacher panel manages it.
grant select, insert, update, delete on public.eco_questions to anon, authenticated;
drop policy if exists eco_questions_read on public.eco_questions;
create policy eco_questions_read on public.eco_questions for select to anon, authenticated using (true);
drop policy if exists eco_questions_insert on public.eco_questions;
create policy eco_questions_insert on public.eco_questions for insert to anon, authenticated with check (true);
drop policy if exists eco_questions_update on public.eco_questions;
create policy eco_questions_update on public.eco_questions for update to anon, authenticated using (true) with check (true);
drop policy if exists eco_questions_delete on public.eco_questions;
create policy eco_questions_delete on public.eco_questions for delete to anon, authenticated using (true);

grant select on public.eco_drag_challenges to anon, authenticated;
drop policy if exists eco_drag_challenges_read on public.eco_drag_challenges;
create policy eco_drag_challenges_read on public.eco_drag_challenges for select to anon, authenticated using (active);

create or replace function public.eco_record_badge(
  p_player_key text,
  p_player_name text,
  p_badge_id text,
  p_unlocked_at timestamptz default now()
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.eco_player_badges (player_key, player_name, badge_id, unlocked_at)
  values (left(p_player_key, 80), left(p_player_name, 24), left(p_badge_id, 50), p_unlocked_at)
  on conflict (player_key, badge_id) do nothing;
$$;

revoke all on function public.eco_record_badge(text, text, text, timestamptz) from public;
grant execute on function public.eco_record_badge(text, text, text, timestamptz) to anon, authenticated;

commit;

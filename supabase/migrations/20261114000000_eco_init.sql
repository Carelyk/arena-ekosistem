-- ============================================================================
-- Harmoni dalam Ekosistem - Rantai Makanan (IPAS Kelas 6)
-- Supabase schema: question bank, match history, and optional room-code duels.
--
-- Safe to re-run. Tables use IF NOT EXISTS, functions use CREATE OR REPLACE,
-- policies are dropped before creation, and seed rows use ON CONFLICT DO NOTHING.
--
-- Security model
--   * eco_questions and eco_match_answers are never readable with the anon key.
--     Answer keys live only inside SECURITY DEFINER functions.
--   * Room-duel scores are written by SQL using server time, never by the browser.
--   * eco_rooms is readable so Supabase Realtime can push row updates; all writes
--     go through the RPCs below.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.eco_questions (
  id text primary key,
  prompt text not null,
  options text[] not null,
  correct_index smallint not null,
  explanation text not null,
  category text not null,
  difficulty text not null,
  reviewed boolean not null default false,
  active boolean not null default true,
  origin text not null default 'seed',
  created_at timestamptz not null default now(),
  constraint eco_questions_options_len check (array_length(options, 1) = 4),
  constraint eco_questions_correct_index check (correct_index between 0 and 3),
  constraint eco_questions_difficulty check (difficulty in ('mudah', 'sedang', 'sulit'))
);

create table if not exists public.eco_rooms (
  code text primary key,
  status text not null default 'waiting',
  phase text not null default 'waiting',
  round_seconds integer not null default 30,
  total_rounds integer not null default 10,
  round_index integer not null default 0,
  question_ids text[] not null default '{}',
  current_question_id text references public.eco_questions (id) on delete set null,
  first_solver smallint,
  reveal jsonb,
  round_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint eco_rooms_code_format check (code ~ '^[A-Z0-9]{6}$'),
  constraint eco_rooms_status check (status in ('waiting', 'connected', 'playing', 'reconnecting', 'finished')),
  constraint eco_rooms_phase check (phase in ('waiting', 'playing', 'revealed', 'finished')),
  constraint eco_rooms_round_seconds check (round_seconds between 10 and 120),
  constraint eco_rooms_total_rounds check (total_rounds between 1 and 20),
  constraint eco_rooms_first_solver check (first_solver is null or first_solver in (0, 1))
);

create table if not exists public.eco_room_players (
  room_code text not null references public.eco_rooms (code) on delete cascade,
  slot smallint not null,
  name text not null default '',
  avatar text not null default '🦁',
  score integer not null default 0,
  solved boolean not null default false,
  fast_bonus integer not null default 0,
  frozen_until timestamptz,
  joined_at timestamptz not null default now(),
  primary key (room_code, slot),
  constraint eco_room_players_slot check (slot in (0, 1)),
  constraint eco_room_players_score check (score >= 0)
);

create table if not exists public.eco_match_answers (
  id bigserial primary key,
  room_code text not null references public.eco_rooms (code) on delete cascade,
  round_index integer not null,
  slot smallint not null,
  chosen_index smallint not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  constraint eco_match_answers_slot check (slot in (0, 1)),
  constraint eco_match_answers_chosen check (chosen_index between 0 and 3)
);

create table if not exists public.eco_matches (
  id text primary key,
  game text not null,
  player1_name text not null default '',
  player1_avatar text not null default '🦁',
  score_p1 integer not null default 0,
  player2_name text not null default '',
  player2_avatar text not null default '🐸',
  score_p2 integer not null default 0,
  winner text not null default 'draw',
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint eco_matches_game check (game in ('duel', 'susun')),
  constraint eco_matches_winner check (winner in ('p1', 'p2', 'draw')),
  constraint eco_matches_scores check (score_p1 >= 0 and score_p2 >= 0)
);

create table if not exists public.eco_leaderboard (
  player_key text primary key,
  name text not null,
  avatar text not null default '🦁',
  score integer not null default 0,
  wins integer not null default 0,
  matches integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint eco_leaderboard_score check (score >= 0)
);

create table if not exists public.eco_player_badges (
  id bigserial primary key,
  player_key text not null,
  player_name text not null,
  badge_id text not null,
  unlocked_at timestamptz not null default now(),
  constraint eco_player_badges_unique unique (player_key, badge_id)
);

create table if not exists public.eco_drag_challenges (
  id text primary key,
  ecosystem text not null,
  prompt text not null,
  solution jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint eco_drag_challenges_ecosystem check (ecosystem in ('sawah', 'hutan', 'laut'))
);

create index if not exists eco_room_players_room_idx
  on public.eco_room_players (room_code);
create index if not exists eco_match_answers_room_idx
  on public.eco_match_answers (room_code, round_index);
create index if not exists eco_matches_created_idx
  on public.eco_matches (created_at desc);
create index if not exists eco_leaderboard_score_idx
  on public.eco_leaderboard (score desc, wins desc);

-- ---------------------------------------------------------------------------
-- 2. Room state helpers
-- ---------------------------------------------------------------------------

/**
 * Redacted room snapshot. Must stay in sync with normalizeRoomState() in
 * lib/game/room.ts. The answer key is only included through r.reveal, which is
 * written when a round closes.
 */
create or replace function public.eco_room_payload(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.eco_rooms%rowtype;
  v_players jsonb := '[]'::jsonb;
  v_question jsonb := null;
  v_reveal jsonb := null;
  v_row record;
begin
  select * into r from public.eco_rooms where code = upper(p_code);
  if not found then
    return null;
  end if;

  for v_row in
    select * from public.eco_room_players where room_code = r.code order by slot
  loop
    v_players := v_players || jsonb_build_object(
      'slot', v_row.slot,
      'name', v_row.name,
      'avatar', v_row.avatar,
      'score', v_row.score,
      'solved', v_row.solved,
      'frozenUntil', case when v_row.frozen_until is null then null else to_jsonb(v_row.frozen_until) end
    );
  end loop;

  if jsonb_array_length(v_players) < 2 then
    v_players := v_players || jsonb_build_object(
      'slot', 1,
      'name', '',
      'avatar', '⏳',
      'score', 0,
      'solved', false,
      'frozenUntil', null
    );
  end if;

  if r.phase in ('playing', 'revealed') and r.current_question_id is not null then
    select jsonb_build_object(
      'id', q.id,
      'text', q.prompt,
      'options', to_jsonb(q.options),
      'category', q.category,
      'difficulty', q.difficulty
    )
    into v_question
    from public.eco_questions q
    where q.id = r.current_question_id;
  end if;

  if r.phase = 'revealed' then
    v_reveal := r.reveal;
  end if;

  return jsonb_build_object(
    'code', r.code,
    'status', r.status,
    'phase', r.phase,
    'roundIndex', r.round_index,
    'totalRounds', r.total_rounds,
    'roundSeconds', r.round_seconds,
    'roundDeadline', case when r.round_deadline is null then null else to_jsonb(r.round_deadline) end,
    'players', v_players,
    'question', v_question,
    'reveal', v_reveal
  );
end;
$$;

/** Closes the current round and publishes the answer key. Caller must allow writes. */
create or replace function public.eco_close_round(p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.eco_rooms%rowtype;
  v_question public.eco_questions%rowtype;
  v_solved jsonb;
begin
  select * into r from public.eco_rooms where code = upper(p_code) for update;
  if not found or r.phase <> 'playing' then
    return;
  end if;

  select * into v_question from public.eco_questions where id = r.current_question_id;
  if not found then
    return;
  end if;

  select jsonb_build_array(
    coalesce(bool_or(case when slot = 0 then solved else false end), false),
    coalesce(bool_or(case when slot = 1 then solved else false end), false)
  )
  into v_solved
  from public.eco_room_players
  where room_code = r.code;

  update public.eco_rooms
  set phase = 'revealed',
      reveal = jsonb_build_object(
        'correctIndex', v_question.correct_index,
        'explanation', v_question.explanation,
        'firstSolver', r.first_solver,
        'solved', v_solved
      ),
      updated_at = now()
  where code = r.code;
end;
$$;

/** Closes a round whose deadline has passed. Cheap enough to call on every read. */
create or replace function public.eco_room_tick(p_code text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.eco_rooms%rowtype;
begin
  select * into r from public.eco_rooms where code = upper(p_code) for update;
  if not found or r.phase <> 'playing' or r.round_deadline is null then
    return;
  end if;
  if now() < r.round_deadline then
    return;
  end if;
  perform public.eco_close_round(r.code);
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Room RPCs (the only write path for room-code play)
-- ---------------------------------------------------------------------------

create or replace function public.eco_create_room(
  p_name text,
  p_avatar text,
  p_round_seconds integer default 30,
  p_max_rounds integer default 10
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text;
  v_ids text[];
  v_i integer;
  v_j integer;
  v_name text := left(btrim(coalesce(p_name, '')), 24);
  v_seconds integer := greatest(10, least(coalesce(p_round_seconds, 30), 120));
  v_rounds integer := greatest(1, least(coalesce(p_max_rounds, 10), 20));
begin
  if length(v_name) = 0 then
    raise exception 'invalid_name';
  end if;

  select coalesce(array_agg(id), '{}')
  into v_ids
  from (
    select id
    from public.eco_questions
    where active and reviewed
    order by random()
    limit v_rounds
  ) picked;

  if coalesce(array_length(v_ids, 1), 0) = 0 then
    raise exception 'question_bank_empty';
  end if;

  for attempt in 1..20 loop
    v_code := '';
    for v_i in 1..6 loop
      v_j := floor(random() * length(v_alphabet))::integer + 1;
      v_code := v_code || substr(v_alphabet, v_j, 1);
    end loop;
    exit when not exists (select 1 from public.eco_rooms where code = v_code);
  end loop;

  if v_code is null or exists (select 1 from public.eco_rooms where code = v_code) then
    raise exception 'room_code_failed';
  end if;

  insert into public.eco_rooms (
    code, status, phase, round_seconds, total_rounds, round_index,
    question_ids, current_question_id
  )
  values (
    v_code, 'waiting', 'waiting', v_seconds, array_length(v_ids, 1), 0,
    v_ids, v_ids[1]
  );

  insert into public.eco_room_players (room_code, slot, name, avatar)
  values (v_code, 0, v_name, left(coalesce(p_avatar, '🦁'), 8));

  return jsonb_build_object('state', public.eco_room_payload(v_code));
end;
$$;

create or replace function public.eco_join_room(
  p_code text,
  p_name text,
  p_avatar text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.eco_rooms%rowtype;
  v_name text := left(btrim(coalesce(p_name, '')), 24);
  v_existing public.eco_room_players%rowtype;
begin
  if length(v_name) = 0 then
    raise exception 'invalid_name';
  end if;

  select * into r from public.eco_rooms where code = upper(p_code) for update;
  if not found then
    raise exception 'room_not_found';
  end if;

  select * into v_existing
  from public.eco_room_players
  where room_code = r.code and slot = 1;

  if found then
    if lower(v_existing.name) = lower(v_name) then
      return jsonb_build_object('slot', 1, 'state', public.eco_room_payload(r.code));
    end if;
    raise exception 'room_full';
  end if;

  if r.phase <> 'waiting' then
    raise exception 'room_full';
  end if;

  insert into public.eco_room_players (room_code, slot, name, avatar)
  values (r.code, 1, v_name, left(coalesce(p_avatar, '🐸'), 8));

  update public.eco_rooms
  set status = 'connected', updated_at = now()
  where code = r.code;

  return jsonb_build_object('slot', 1, 'state', public.eco_room_payload(r.code));
end;
$$;

create or replace function public.eco_room_state(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  perform public.eco_room_tick(p_code);
  return jsonb_build_object('state', public.eco_room_payload(p_code));
end;
$$;

create or replace function public.eco_start_room(p_code text, p_slot smallint)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.eco_rooms%rowtype;
  v_count integer;
begin
  select * into r from public.eco_rooms where code = upper(p_code) for update;
  if not found then
    raise exception 'room_not_found';
  end if;
  if r.phase <> 'waiting' then
    return jsonb_build_object('state', public.eco_room_payload(r.code));
  end if;

  select count(*) into v_count from public.eco_room_players where room_code = r.code;
  if v_count < 2 then
    raise exception 'room_not_full';
  end if;

  update public.eco_rooms
  set phase = 'playing',
      status = 'playing',
      round_index = 0,
      round_deadline = now() + make_interval(secs => r.round_seconds),
      current_question_id = r.question_ids[1],
      first_solver = null,
      reveal = null,
      updated_at = now()
  where code = r.code;

  update public.eco_room_players
  set score = 0, solved = false, fast_bonus = 0, frozen_until = null
  where room_code = r.code;

  return jsonb_build_object('state', public.eco_room_payload(r.code));
end;
$$;

create or replace function public.eco_submit_room_answer(
  p_code text,
  p_slot smallint,
  p_option smallint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.eco_rooms%rowtype;
  v_player public.eco_room_players%rowtype;
  v_question public.eco_questions%rowtype;
  v_bonus boolean := false;
  v_correct boolean;
  v_both boolean;
begin
  if p_slot is null or p_slot not in (0, 1) then
    raise exception 'invalid_slot';
  end if;
  if p_option is null or p_option not in (0, 1, 2, 3) then
    raise exception 'invalid_option';
  end if;

  perform public.eco_room_tick(p_code);

  select * into r from public.eco_rooms where code = upper(p_code) for update;
  if not found then
    raise exception 'room_not_found';
  end if;

  if r.phase <> 'playing' then
    return jsonb_build_object('state', public.eco_room_payload(r.code));
  end if;

  select * into v_player
  from public.eco_room_players
  where room_code = r.code and slot = p_slot
  for update;
  if not found then
    raise exception 'player_not_found';
  end if;

  -- A solved panel stays locked for the rest of the round; a frozen panel
  -- cannot answer until the two-second penalty expires.
  if v_player.solved then
    return jsonb_build_object('state', public.eco_room_payload(r.code));
  end if;
  if v_player.frozen_until is not null and v_player.frozen_until > now() then
    return jsonb_build_object('state', public.eco_room_payload(r.code));
  end if;
  if r.round_deadline is not null and now() >= r.round_deadline then
    perform public.eco_close_round(r.code);
    return jsonb_build_object('state', public.eco_room_payload(r.code));
  end if;

  select * into v_question from public.eco_questions where id = r.current_question_id;
  if not found then
    raise exception 'question_missing';
  end if;

  v_correct := (p_option = v_question.correct_index);

  insert into public.eco_match_answers (room_code, round_index, slot, chosen_index, is_correct)
  values (r.code, r.round_index, p_slot, p_option, v_correct);

  if v_correct then
    v_bonus := (r.first_solver is null);
    update public.eco_room_players
    set solved = true,
        score = score + 100 + case when v_bonus then 50 else 0 end,
        fast_bonus = fast_bonus + case when v_bonus then 1 else 0 end
    where room_code = r.code and slot = p_slot;

    if v_bonus then
      update public.eco_rooms
      set first_solver = p_slot, updated_at = now()
      where code = r.code;
    end if;

    select bool_and(solved) into v_both
    from public.eco_room_players
    where room_code = r.code;

    if coalesce(v_both, false) then
      perform public.eco_close_round(r.code);
    end if;
  else
    update public.eco_room_players
    set frozen_until = now() + interval '2 seconds'
    where room_code = r.code and slot = p_slot;
  end if;

  return jsonb_build_object('state', public.eco_room_payload(r.code));
end;
$$;

create or replace function public.eco_next_room_round(
  p_code text,
  p_slot smallint
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r public.eco_rooms%rowtype;
  v_p0 public.eco_room_players%rowtype;
  v_p1 public.eco_room_players%rowtype;
  v_winner text;
  v_detail jsonb;
begin
  perform public.eco_room_tick(p_code);

  select * into r from public.eco_rooms where code = upper(p_code) for update;
  if not found then
    raise exception 'room_not_found';
  end if;

  if r.phase <> 'revealed' then
    return jsonb_build_object('state', public.eco_room_payload(r.code));
  end if;

  if r.round_index + 1 >= r.total_rounds then
    update public.eco_rooms
    set phase = 'finished',
        status = 'finished',
        round_deadline = null,
        reveal = null,
        updated_at = now()
    where code = r.code;

    select * into v_p0 from public.eco_room_players where room_code = r.code and slot = 0;
    select * into v_p1 from public.eco_room_players where room_code = r.code and slot = 1;

    if coalesce(v_p0.score, 0) = coalesce(v_p1.score, 0) then
      v_winner := 'draw';
    elsif coalesce(v_p0.score, 0) > coalesce(v_p1.score, 0) then
      v_winner := 'p1';
    else
      v_winner := 'p2';
    end if;

    v_detail := jsonb_build_object(
      'kind', 'duel',
      'rounds', r.total_rounds,
      'correctP1', (select count(*) from public.eco_match_answers where room_code = r.code and slot = 0 and is_correct),
      'correctP2', (select count(*) from public.eco_match_answers where room_code = r.code and slot = 1 and is_correct),
      'answersP1', (select count(*) from public.eco_match_answers where room_code = r.code and slot = 0),
      'answersP2', (select count(*) from public.eco_match_answers where room_code = r.code and slot = 1),
      'fastestBonusP1', coalesce(v_p0.fast_bonus, 0),
      'fastestBonusP2', coalesce(v_p1.fast_bonus, 0)
    );

    insert into public.eco_matches (
      id, game, player1_name, player1_avatar, score_p1,
      player2_name, player2_avatar, score_p2, winner, detail
    )
    values (
      'room-' || r.code,
      'duel',
      coalesce(v_p0.name, 'Tim Hijau'),
      coalesce(v_p0.avatar, '🦁'),
      coalesce(v_p0.score, 0),
      coalesce(v_p1.name, 'Tim Oranye'),
      coalesce(v_p1.avatar, '🐸'),
      coalesce(v_p1.score, 0),
      v_winner,
      v_detail
    )
    on conflict (id) do nothing;

    return jsonb_build_object('state', public.eco_room_payload(r.code));
  end if;

  update public.eco_rooms
  set round_index = r.round_index + 1,
      phase = 'playing',
      status = 'playing',
      round_deadline = now() + make_interval(secs => r.round_seconds),
      current_question_id = r.question_ids[r.round_index + 2],
      first_solver = null,
      reveal = null,
      updated_at = now()
  where code = r.code;

  update public.eco_room_players
  set solved = false, frozen_until = null
  where room_code = r.code;

  return jsonb_build_object('state', public.eco_room_payload(r.code));
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Match history
-- ---------------------------------------------------------------------------

/**
 * Validates a finished match before storing it. Scores are bounded and the
 * winner must agree with the scores, so a tampered payload cannot publish an
 * impossible result to the shared leaderboard.
 */
create or replace function public.eco_record_match(
  p_id text,
  p_game text,
  p_p1_name text,
  p_p1_avatar text,
  p_p1_score integer,
  p_p2_name text,
  p_p2_avatar text,
  p_p2_score integer,
  p_winner text,
  p_detail jsonb,
  p_created_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_p1 text := left(btrim(coalesce(p_p1_name, '')), 24);
  v_p2 text := left(btrim(coalesce(p_p2_name, '')), 24);
  v_s1 integer := coalesce(p_p1_score, 0);
  v_s2 integer := coalesce(p_p2_score, 0);
begin
  if p_game not in ('duel', 'susun') then
    raise exception 'invalid_game';
  end if;
  if p_winner not in ('p1', 'p2', 'draw') then
    raise exception 'invalid_winner';
  end if;
  if length(v_p1) = 0 or length(v_p2) = 0 then
    raise exception 'invalid_name';
  end if;
  if v_s1 < 0 or v_s2 < 0 or v_s1 > 100000 or v_s2 > 100000 then
    raise exception 'invalid_score';
  end if;
  if (p_winner = 'p1' and v_s1 < v_s2)
     or (p_winner = 'p2' and v_s2 < v_s1)
     or (p_winner = 'draw' and v_s1 <> v_s2) then
    raise exception 'inconsistent_result';
  end if;

  insert into public.eco_matches (
    id, game, player1_name, player1_avatar, score_p1,
    player2_name, player2_avatar, score_p2, winner, detail, created_at
  )
  values (
    left(btrim(coalesce(p_id, '')), 64),
    p_game,
    v_p1,
    left(coalesce(p_p1_avatar, '🦁'), 8),
    v_s1,
    v_p2,
    left(coalesce(p_p2_avatar, '🐸'), 8),
    v_s2,
    p_winner,
    coalesce(p_detail, '{}'::jsonb),
    coalesce(p_created_at, now())
  )
  on conflict (id) do nothing;
end;
$$;

create or replace function public.eco_sync_leaderboard()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if length(btrim(coalesce(new.player1_name, ''))) > 0 then
    insert into public.eco_leaderboard (player_key, name, avatar, score, wins, matches, updated_at)
    values (
      lower(btrim(new.player1_name)) || '|' || coalesce(new.player1_avatar, ''),
      btrim(new.player1_name),
      coalesce(new.player1_avatar, '🦁'),
      new.score_p1,
      case when new.winner = 'p1' then 1 else 0 end,
      1,
      new.created_at
    )
    on conflict (player_key) do update
    set name = excluded.name,
        avatar = excluded.avatar,
        score = public.eco_leaderboard.score + excluded.score,
        wins = public.eco_leaderboard.wins + excluded.wins,
        matches = public.eco_leaderboard.matches + excluded.matches,
        updated_at = greatest(public.eco_leaderboard.updated_at, excluded.updated_at);
  end if;

  if length(btrim(coalesce(new.player2_name, ''))) > 0 then
    insert into public.eco_leaderboard (player_key, name, avatar, score, wins, matches, updated_at)
    values (
      lower(btrim(new.player2_name)) || '|' || coalesce(new.player2_avatar, ''),
      btrim(new.player2_name),
      coalesce(new.player2_avatar, '🐸'),
      new.score_p2,
      case when new.winner = 'p2' then 1 else 0 end,
      1,
      new.created_at
    )
    on conflict (player_key) do update
    set name = excluded.name,
        avatar = excluded.avatar,
        score = public.eco_leaderboard.score + excluded.score,
        wins = public.eco_leaderboard.wins + excluded.wins,
        matches = public.eco_leaderboard.matches + excluded.matches,
        updated_at = greatest(public.eco_leaderboard.updated_at, excluded.updated_at);
  end if;

  return new;
end;
$$;

drop trigger if exists eco_matches_leaderboard on public.eco_matches;
create trigger eco_matches_leaderboard
after insert on public.eco_matches
for each row execute function public.eco_sync_leaderboard();

/** Optional housekeeping for long-lived deployments. */
create or replace function public.eco_purge_rooms(p_older_than interval default interval '12 hours')
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_deleted integer;
begin
  delete from public.eco_rooms
  where updated_at < now() - p_older_than
    and phase in ('waiting', 'finished');
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Row level security
-- ---------------------------------------------------------------------------

alter table public.eco_questions enable row level security;
alter table public.eco_rooms enable row level security;
alter table public.eco_room_players enable row level security;
alter table public.eco_match_answers enable row level security;
alter table public.eco_matches enable row level security;
alter table public.eco_leaderboard enable row level security;
alter table public.eco_player_badges enable row level security;
alter table public.eco_drag_challenges enable row level security;

-- Answer material: no policy means no access for anon/authenticated. Only the
-- SECURITY DEFINER functions above (owned by the migration runner) can read it.
revoke all on public.eco_questions from anon, authenticated;
revoke all on public.eco_match_answers from anon, authenticated;
revoke all on public.eco_drag_challenges from anon, authenticated;
revoke all on public.eco_matches from anon, authenticated;
revoke all on public.eco_rooms from anon, authenticated;
revoke all on public.eco_room_players from anon, authenticated;
revoke all on public.eco_leaderboard from anon, authenticated;
revoke all on public.eco_player_badges from anon, authenticated;

drop policy if exists eco_rooms_read on public.eco_rooms;
create policy eco_rooms_read on public.eco_rooms
  for select to anon, authenticated using (true);

drop policy if exists eco_room_players_read on public.eco_room_players;
create policy eco_room_players_read on public.eco_room_players
  for select to anon, authenticated using (true);

drop policy if exists eco_matches_read on public.eco_matches;
create policy eco_matches_read on public.eco_matches
  for select to anon, authenticated using (true);

drop policy if exists eco_leaderboard_read on public.eco_leaderboard;
create policy eco_leaderboard_read on public.eco_leaderboard
  for select to anon, authenticated using (true);

drop policy if exists eco_player_badges_read on public.eco_player_badges;
create policy eco_player_badges_read on public.eco_player_badges
  for select to anon, authenticated using (true);

grant usage on schema public to anon, authenticated;
grant select on public.eco_rooms to anon, authenticated;
grant select on public.eco_room_players to anon, authenticated;
grant select on public.eco_matches to anon, authenticated;
grant select on public.eco_leaderboard to anon, authenticated;
grant select on public.eco_player_badges to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Function grants
-- ---------------------------------------------------------------------------

revoke all on function public.eco_room_payload(text) from public;
revoke all on function public.eco_close_round(text) from public;
revoke all on function public.eco_room_tick(text) from public;
revoke all on function public.eco_sync_leaderboard() from public;
revoke all on function public.eco_purge_rooms(interval) from public;

revoke all on function public.eco_create_room(text, text, integer, integer) from public;
revoke all on function public.eco_join_room(text, text, text) from public;
revoke all on function public.eco_room_state(text) from public;
revoke all on function public.eco_start_room(text, smallint) from public;
revoke all on function public.eco_submit_room_answer(text, smallint, smallint) from public;
revoke all on function public.eco_next_room_round(text, smallint) from public;
revoke all on function public.eco_record_match(text, text, text, text, integer, text, text, integer, text, jsonb, timestamptz) from public;

grant execute on function public.eco_create_room(text, text, integer, integer) to anon, authenticated;
grant execute on function public.eco_join_room(text, text, text) to anon, authenticated;
grant execute on function public.eco_room_state(text) to anon, authenticated;
grant execute on function public.eco_start_room(text, smallint) to anon, authenticated;
grant execute on function public.eco_submit_room_answer(text, smallint, smallint) to anon, authenticated;
grant execute on function public.eco_next_room_round(text, smallint) to anon, authenticated;
grant execute on function public.eco_record_match(text, text, text, text, integer, text, text, integer, text, jsonb, timestamptz) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 7. Realtime (room-code lobby)
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1
       from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'eco_rooms'
     ) then
    alter publication supabase_realtime add table public.eco_rooms;
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. Seed data
-- ---------------------------------------------------------------------------

-- The 32 questions below match lib/data/questions.ts after the deterministic
-- option rotation applied by seedBank(), so the correct answer is not always A.
insert into public.eco_questions (
  id, prompt, options, correct_index, explanation, category, difficulty
)
values
  (
    'q01',
    'Rantai makanan adalah ...',
    array['kumpulan hewan yang hidup di satu tempat', 'proses tumbuhan membuat makanan', 'hubungan antara manusia dan hewan peliharaan', 'proses perpindahan energi dan nutrisi antar makhluk hidup di suatu ekosistem'],
    3,
    'Rantai makanan adalah proses perpindahan energi dan nutrisi antar makhluk hidup di suatu ekosistem.',
    'definisi',
    'mudah'
  ),
  (
    'q02',
    'Urutan rantai makanan selalu dimulai dari ...',
    array['pengurai', 'hewan karnivora', 'produsen', 'konsumen puncak'],
    2,
    'Produsen menjadi awal rantai makanan karena mampu membuat makanan sendiri.',
    'definisi',
    'mudah'
  ),
  (
    'q03',
    'Sumber energi utama bagi rantai makanan di Bumi adalah ...',
    array['tanah', 'Matahari', 'Bulan', 'angin'],
    1,
    'Matahari adalah sumber energi utama. Cahaya matahari ditangkap tumbuhan untuk fotosintesis.',
    'fotosintesis',
    'mudah'
  ),
  (
    'q04',
    'Tumbuhan disebut produsen karena ...',
    array['dapat membuat makanan sendiri melalui fotosintesis', 'memakan serangga di sekitarnya', 'menguraikan sisa makhluk hidup', 'menghasilkan energi baru dari tanah'],
    0,
    'Produsen membuat makanan sendiri melalui fotosintesis, bukan menciptakan energi.',
    'fotosintesis',
    'mudah'
  ),
  (
    'q05',
    'Bahan yang dibutuhkan tumbuhan untuk fotosintesis adalah ...',
    array['oksigen, tanah, dan angin', 'gula, air, dan mineral', 'nitrogen, oksigen, dan panas bumi', 'air, karbon dioksida, dan cahaya matahari'],
    3,
    'Fotosintesis membutuhkan air, karbon dioksida, dan cahaya matahari.',
    'fotosintesis',
    'sedang'
  ),
  (
    'q06',
    'Hasil fotosintesis yang dimanfaatkan makhluk hidup lain adalah ...',
    array['protein dan lemak', 'karbon dioksida dan air', 'karbohidrat dan oksigen', 'air dan tanah'],
    2,
    'Fotosintesis menghasilkan karbohidrat sebagai makanan dan oksigen untuk pernapasan.',
    'fotosintesis',
    'sedang'
  ),
  (
    'q07',
    'Belalang yang memakan rumput termasuk ...',
    array['pengurai', 'konsumen tingkat I', 'produsen', 'konsumen tingkat II'],
    1,
    'Belalang memakan produsen, sehingga disebut konsumen tingkat I.',
    'konsumen',
    'mudah'
  ),
  (
    'q08',
    'Katak yang memakan belalang termasuk ...',
    array['konsumen tingkat II', 'produsen', 'konsumen tingkat I', 'pengurai'],
    0,
    'Katak memakan konsumen tingkat I, sehingga menjadi konsumen tingkat II.',
    'konsumen',
    'mudah'
  ),
  (
    'q09',
    'Dalam rantai makanan sawah, elang berperan sebagai ...',
    array['produsen', 'konsumen tingkat I', 'pengurai', 'konsumen puncak'],
    3,
    'Elang berada pada tingkat trofik tertinggi pada contoh rantai makanan sawah.',
    'konsumen',
    'mudah'
  ),
  (
    'q10',
    'Konsumen tingkat II memperoleh energi dari ...',
    array['pengurai', 'cahaya matahari', 'konsumen tingkat I', 'produsen'],
    2,
    'Konsumen tingkat II memakan konsumen tingkat I untuk memperoleh energi.',
    'konsumen',
    'sedang'
  ),
  (
    'q11',
    'Jamur dan bakteri disebut pengurai karena ...',
    array['menjadi konsumen puncak di ekosistem', 'menguraikan sisa organisme menjadi zat hara', 'membuat makanan melalui fotosintesis', 'memakan produsen secara langsung'],
    1,
    'Pengurai menguraikan sisa organisme dan mengembalikan unsur hara ke lingkungan.',
    'pengurai',
    'mudah'
  ),
  (
    'q12',
    'Pengurai dapat bekerja pada ...',
    array['sisa organisme dari semua tingkat trofik', 'hanya tubuh konsumen puncak', 'hanya daun yang masih hidup', 'hanya bangkai hewan besar'],
    0,
    'Sisa organisme dari produsen sampai konsumen puncak dapat diuraikan oleh pengurai.',
    'pengurai',
    'sedang'
  ),
  (
    'q13',
    'Arah panah pada rantai makanan menunjukkan ...',
    array['urutan hewan dari kecil ke besar', 'arah gerak hewan mencari air', 'jumlah populasi setiap makhluk hidup', 'perpindahan energi dari yang dimakan ke pemakan'],
    3,
    'Panah menunjuk ke organisme pemakan, tempat energi berpindah.',
    'aliran-energi',
    'sedang'
  ),
  (
    'q14',
    'Mengapa energi yang diterima konsumen puncak lebih sedikit?',
    array['Konsumen puncak tidak membutuhkan energi', 'Matahari berhenti mengirim energi', 'Sebagian energi hilang sebagai panas dan dipakai untuk aktivitas', 'Energi berubah menjadi tanah'],
    2,
    'Setiap perpindahan energi disertai energi yang hilang sebagai panas dan digunakan untuk aktivitas.',
    'aliran-energi',
    'sulit'
  ),
  (
    'q15',
    'Urutan rantai makanan di ekosistem sawah yang benar adalah ...',
    array['Elang → Ular → Katak → Belalang → Padi', 'Padi → Belalang → Katak → Ular → Elang', 'Padi → Katak → Belalang → Elang → Ular', 'Belalang → Padi → Ular → Katak → Elang'],
    1,
    'Padi dimakan belalang, belalang dimakan katak, katak dimakan ular, lalu ular dimakan elang.',
    'sawah',
    'sedang'
  ),
  (
    'q16',
    'Pada rantai makanan sawah, ular memangsa ...',
    array['katak', 'padi', 'elang', 'jamur'],
    0,
    'Ular menempati tingkat trofik setelah katak, sehingga memangsa katak.',
    'sawah',
    'mudah'
  ),
  (
    'q17',
    'Jika populasi belalang berkurang drastis, kemungkinan yang terjadi adalah ...',
    array['populasi padi menurun dan populasi katak meningkat', 'semua populasi tetap sama', 'elang langsung menjadi produsen', 'populasi padi meningkat dan populasi katak menurun'],
    3,
    'Belalang adalah pemakan padi dan makanan katak, sehingga perubahan populasinya memengaruhi keduanya.',
    'populasi',
    'sulit'
  ),
  (
    'q18',
    'Petani menanam padi di sawah. Dalam rantai makanan, padi berperan sebagai ...',
    array['konsumen puncak', 'pengurai', 'produsen', 'konsumen tingkat I'],
    2,
    'Padi membuat makanan sendiri melalui fotosintesis, sehingga berperan sebagai produsen.',
    'sawah',
    'mudah'
  ),
  (
    'q19',
    'Urutan rantai makanan di hutan yang benar adalah ...',
    array['Daun → Elang → Ulat → Burung pemakan serangga', 'Daun → Ulat → Burung pemakan serangga → Elang', 'Ulat → Daun → Elang → Burung pemakan serangga', 'Elang → Burung pemakan serangga → Ulat → Daun'],
    1,
    'Energi mengalir dari daun ke ulat, lalu ke burung pemakan serangga, lalu ke elang.',
    'hutan',
    'sedang'
  ),
  (
    'q20',
    'Burung pemakan serangga pada rantai makanan hutan berperan sebagai ...',
    array['konsumen tingkat II', 'produsen', 'konsumen tingkat I', 'pengurai'],
    0,
    'Burung memakan ulat (konsumen tingkat I), sehingga menjadi konsumen tingkat II.',
    'hutan',
    'sedang'
  ),
  (
    'q21',
    'Jika elang di hutan banyak diburu, populasi burung pemakan serangga akan ...',
    array['menurun', 'tetap', 'hilang seluruhnya', 'meningkat'],
    3,
    'Berkurangnya predator membuat populasi mangsa di bawahnya cenderung meningkat.',
    'populasi',
    'sulit'
  ),
  (
    'q22',
    'Urutan rantai makanan di ekosistem laut yang benar adalah ...',
    array['Zooplankton → Fitoplankton → Hiu → Ikan kecil → Ikan besar', 'Fitoplankton → Ikan besar → Zooplankton → Hiu → Ikan kecil', 'Fitoplankton → Zooplankton → Ikan kecil → Ikan besar → Hiu', 'Hiu → Ikan besar → Ikan kecil → Zooplankton → Fitoplankton'],
    2,
    'Fitoplankton dimakan zooplankton, lalu ikan kecil, ikan besar, dan akhirnya hiu.',
    'laut',
    'sedang'
  ),
  (
    'q23',
    'Fitoplankton di laut berperan sebagai ...',
    array['pengurai', 'produsen', 'konsumen tingkat II', 'konsumen puncak'],
    1,
    'Fitoplankton berfotosintesis dan menjadi dasar rantai makanan laut.',
    'laut',
    'mudah'
  ),
  (
    'q24',
    'Zooplankton memakan fitoplankton. Zooplankton termasuk ...',
    array['konsumen tingkat I', 'produsen', 'konsumen puncak', 'pengurai'],
    0,
    'Zooplankton memakan produsen, sehingga termasuk konsumen tingkat I.',
    'laut',
    'sedang'
  ),
  (
    'q25',
    'Hiu pada rantai makanan laut berperan sebagai ...',
    array['produsen', 'konsumen tingkat I', 'pengurai', 'konsumen puncak'],
    3,
    'Hiu berada di ujung rantai makanan laut pada contoh ini.',
    'laut',
    'mudah'
  ),
  (
    'q26',
    'Perubahan populasi satu makhluk hidup dapat memengaruhi ...',
    array['hanya tumbuhan di sekitarnya', 'hanya manusia', 'seluruh bagian jaring-jaring makanan', 'hanya dirinya sendiri'],
    2,
    'Jaring-jaring makanan saling terhubung, sehingga dampaknya dapat menyebar.',
    'populasi',
    'sedang'
  ),
  (
    'q27',
    'Jika katak banyak ditangkap manusia, populasi belalang cenderung ...',
    array['berhenti berkembang', 'meningkat', 'menurun', 'tetap'],
    1,
    'Katak adalah predator belalang. Berkurangnya predator membuat belalang lebih banyak.',
    'populasi',
    'sedang'
  ),
  (
    'q28',
    'Keseimbangan ekosistem dapat terganggu jika ...',
    array['salah satu komponen hilang atau populasinya berubah drastis', 'produsen tumbuh dengan normal', 'pengurai menguraikan sisa organisme', 'setiap organisme mendapat energi'],
    0,
    'Hilangnya komponen atau perubahan populasi yang ekstrem mengganggu aliran energi dan keseimbangan.',
    'keseimbangan',
    'sedang'
  ),
  (
    'q29',
    'Tindakan yang menjaga keseimbangan ekosistem adalah ...',
    array['menangkap semua katak di sawah', 'menebang seluruh pohon di hutan', 'membuang sampah ke laut', 'tidak memburu hewan langka dan menjaga habitat'],
    3,
    'Menjaga habitat dan tidak memburu hewan langka membantu mempertahankan keseimbangan.',
    'keseimbangan',
    'mudah'
  ),
  (
    'q30',
    'Mengapa pengurai penting bagi keseimbangan ekosistem?',
    array['Memakan semua konsumen puncak', 'Mengubah air menjadi energi', 'Mengembalikan unsur hara sehingga produsen dapat tumbuh', 'Menjadi sumber cahaya bagi tumbuhan'],
    2,
    'Unsur hara hasil penguraian dibutuhkan produsen untuk tumbuh dan memulai rantai makanan lagi.',
    'keseimbangan',
    'sulit'
  ),
  (
    'q31',
    'Jaring-jaring makanan adalah ...',
    array['proses penguraian sisa organisme', 'kumpulan rantai makanan yang saling berhubungan', 'satu rantai makanan yang paling panjang', 'daftar hewan yang dilindungi'],
    1,
    'Jaring-jaring makanan menghubungkan beberapa rantai makanan dalam satu ekosistem.',
    'definisi',
    'sedang'
  ),
  (
    'q32',
    'Perhatikan rantai makanan sawah: Padi → Tikus → Ular → Elang. Tikus termasuk ...',
    array['konsumen tingkat I', 'produsen', 'konsumen puncak', 'pengurai'],
    0,
    'Tikus memakan padi (produsen), sehingga tikus adalah konsumen tingkat I.',
    'sawah',
    'sedang'
  )
on conflict (id) do nothing;

-- Seed questions must be immediately available to the game. These columns are
-- omitted from the VALUES tuples above so every tuple has the same seven fields.
update public.eco_questions
set reviewed = true,
    active = true,
    origin = 'seed'
where id ~ '^q(0[1-9]|[12][0-9]|3[0-2])$';

insert into public.eco_drag_challenges (id, ecosystem, prompt, solution)
values
  ('sawah', 'sawah', 'Susun rantai makanan ekosistem sawah.', '{"steps": ["Padi", "Belalang", "Katak", "Ular", "Elang"], "decomposer": "Jamur & bakteri"}'::jsonb),
  ('hutan', 'hutan', 'Susun rantai makanan ekosistem hutan.', '{"steps": ["Tumbuhan/Daun", "Ulat", "Burung Pemakan Serangga", "Elang"], "decomposer": "Jamur & bakteri"}'::jsonb),
  ('laut', 'laut', 'Susun rantai makanan ekosistem laut.', '{"steps": ["Fitoplankton", "Zooplankton", "Ikan Kecil", "Ikan Besar", "Hiu"], "decomposer": "Bakteri pengurai"}'::jsonb)
on conflict (id) do nothing;

commit;

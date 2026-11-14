# Arena Ekosistem - Harmoni dalam Ekosistem

A learning and competitive-game site for Grade 6 IPAS (Chapter 2, *Harmoni dalam
Ekosistem*). Two players share one screen, answer the same questions, and race to
trace how energy moves through a food chain. No accounts, no install step for
students, no external image hosts.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide
icons, and an optional Supabase backend for room-code duels and shared history.

## Routes

| Route | What it does |
| --- | --- |
| `/` | Landing page: chapter framing, quick links to the three main areas. |
| `/belajar` | Chapter badge, "Rantai Makanan" explainer, five organism cards (produsen, konsumen I-II, konsumen puncak, pengurai), the energy flow `Matahari  Rumput  Belalang  Katak  Ular  Elang`, arrow-direction note, "Tahukah Kamu?" panel, and five checkpoint questions. |
| `/games` | Game hub: Duel Ekosistem, Susun Cepat, and pre-game tips. |
| `/arena` | Duel 1 vs 1: setup (names, avatars, one-device or room code, round length), countdown, split board, energy rope, pause/resume/exit, reveal, result, replay. |
| `/games/susun-cepat` | Drag-and-drop food-chain builder with independent boards for both players across sawah, hutan, and laut. |
| `/juara` | Leaderboard (all/duel/susun), best scores, wins, badges, and the chapter conclusion. |
| `/guru` | Local question bank: create, edit, review, activate, delete, search, filter, restore the 32 seed questions. |

Navigation keeps the three main areas (Belajar Materi, Arena Games & Duel, Papan
Juara) reachable on desktop and mobile; the teacher panel and audio settings live
in the header.

## Game rules

### Duel Ekosistem (`/arena`)

- Both players receive the same question order, at most 10 non-repeating items
  drawn from the active + reviewed question bank.
- A-D answer pads on each side. Correct answer: **+100**. The first correct answer
  in a round also earns **+50**.
- A wrong answer freezes only that panel for **2 seconds**; the opponent keeps
  playing. A correct answer locks that panel for the rest of the round.
- The round closes when both players are correct or the timer expires. Only then
  is the answer key and its explanation revealed.
- The rope shows the score difference. A result screen offers replay and the
  match is written to history.
- In one-device mode the answer key is held by a `DuelEngine` instance and only
  redacted `PublicQuestion` snapshots reach React.

### Susun Cepat (`/games/susun-cepat`)

- Real pointer/mouse/touch drag and drop. Each player owns a private card pool and
  slot row, so one player cannot move the other player's cards.
- Lift, valid-slot highlight, drop, swap, replace, and return-to-pool are all
  supported. Tapping a card and then a slot is the keyboard/fallback path.
- No correctness feedback before submit. A wrong submit freezes that area for
  **2 seconds** with a shake; a full solve gets a glow and confetti.
- **100 points** per correct position, **+250** for the first player to finish.
  Default round length is 30 seconds.
- Chains: Sawah (`Padi  Belalang  Katak  Ular  Elang`), Hutan
  (`Tumbuhan/Daun  Ulat  Burung Pemakan Serangga  Elang`), Laut
  (`Fitoplankton  Zooplankton  Ikan Kecil  Ikan Besar  Hiu`). Decomposers are
  an extra slot after the chain and are explained as recyclers of matter, not a
  trophic level that receives energy from the Sun.

## Project structure

```
app/                     routes, layout, global theme, icon
components/
  audio/                 AudioProvider (SFX + music) and the settings dialog
  layout/                header, footer
  learning/              organism cards, energy flow, fun fact, checkpoint quiz
  games/duel/            local duel board, setup, result, room-code duel
  games/susun/           drag-and-drop panels, setup, result
lib/
  audio/                 preference persistence and the sound manager
  data/                  questions, learning copy, ecosystems, badges, bank
  game/                  duel engine, susun logic, history, room client
  supabase.ts            env-only client, null when unconfigured
  storage.ts             localStorage helpers
supabase/migrations/     one idempotent eco_init migration
scripts/generate-audio.mjs  regenerates the original WAV assets
public/audio/            generated SFX + background loop
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The app starts with no environment variables: every
online feature degrades to the local-only experience instead of failing.

Other scripts:

```bash
npm run lint
npm run typecheck
npm run build
npm run audio:generate   # rewrite public/audio/*.wav from code
```

## Optional Supabase setup

Copy `.env.example` to `.env.local` and fill in:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable/anon key. Safe for the browser; RLS still applies. |

The app reads only these two public values. A service-role key is intentionally
absent from `.env.example`: nothing here needs it, and putting it in a Next.js env
file risks shipping it to the browser.

`NEXT_PUBLIC_*` values are read once at module load. Without them
`isSupabaseConfigured` is `false`, the room-code button shows a friendly notice,
and the leaderboard uses the local device history.

Then apply the single migration in `supabase/migrations/20261114000000_eco_init.sql`
through the Supabase SQL editor or the CLI:

```bash
supabase db push
```

The migration is idempotent (`if not exists`, `create or replace`, seeded rows use
`on conflict do nothing`) and creates:

- `eco_questions` - 32 seeded questions with answers, review, and active flags.
- `eco_rooms`, `eco_room_players` - authoritative room state and per-player scores.
- `eco_match_answers` - per-answer audit trail used for the recorded result.
- `eco_matches` - match history read by `/juara`.
- `eco_drag_challenges` - server-side chain solutions for future validation.
- `eco_leaderboard`, `eco_player_badges` - aggregate scoreboard and badge storage.
- RPCs: `eco_create_room`, `eco_join_room`, `eco_room_state`, `eco_start_room`,
  `eco_submit_room_answer`, `eco_next_room_round`, `eco_record_match`, plus the
  internal `eco_room_payload`, `eco_room_tick`, `eco_close_round`, and
  `eco_sync_leaderboard` trigger.

`eco_purge_rooms(interval)` deletes stale waiting/finished rooms when you want to
tidy a long-lived database.

## Local vs room code

| | One device | Room code |
| --- | --- | --- |
| Needs Supabase | No | Yes |
| Answer key location | In-memory duel engine | `eco_questions`, read only inside SQL |
| Scoring | Browser engine | SQL RPC using `now()` |
| Fastest bonus | First correct in the round | First `eco_submit_room_answer` with the correct option |
| History | `localStorage` (+ RPC when configured) | SQL match row |

Room codes are six characters from an unambiguous alphabet. The host creates the
room, the guest joins with the code, and the host starts the duel once both
players are present. The client polls `eco_room_state` every 1.5 s and also
subscribes to `eco_rooms` changes through Supabase Realtime, so a dropped
websocket still recovers.

## Data storage

| Key | Contents |
| --- | --- |
| `eco.history.v1` | Last 200 matches on this device. |
| `eco.badges.v1` | Derived badge unlocks. |
| `eco.questions.v1` | Teacher-edited question bank for this device. |
| `eco.audio.v1` | Mute flag and master/music/SFX volumes. |

The teacher bank is device-local on purpose: there is no teacher login, so the
anon key must not be able to write questions. Cross-device question management
needs authentication and a server-side write path.

## Audio

All sounds are original: `scripts/generate-audio.mjs` synthesises them into
`public/audio` (11 SFX plus a looping background track) using code only, so there
is no third-party audio licence attached. Background music sits below the SFX
level and is ducked during correct/wrong/winner/badge cues. Audio starts only
after the first user interaction, and a missing file degrades silently. The header
settings dialog persists mute plus master, music, and SFX volumes.

## Security notes and known limits

- `eco_questions` and `eco_match_answers` have RLS enabled with **no** policy for
  `anon`/`authenticated`; only `SECURITY DEFINER` functions can read them.
- Room-duel scores, freeze windows, and the fastest bonus are computed in SQL with
  server time. A browser cannot submit a score.
- `eco_record_match` bounds scores and rejects a winner that contradicts the score.
  There is still no user identity, so a determined user could replay fabricated
  matches; treat the shared leaderboard as classroom data, not a competitive rank.
- One-device mode keeps the answer key in the browser by design. A student who
  opens DevTools can inspect it; the room-code mode is the stronger path.
- No teacher authentication exists yet. Do not store confidential exam material in
  the question bank.
- `cacheComponents` and `partialPrefetching` are enabled in `next.config.ts`; check
  `node_modules/next/dist/docs/` before changing data-fetching behaviour.

## Deployment

1. Push the repository to GitHub.
2. Import it in Vercel with the Next.js preset.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to
   Production and Preview if you want room-code play and shared history.
4. Deploy, then run the migration once against the Supabase project.

No deployment URL is recorded here because none has been verified.


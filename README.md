# Arena Ekosistem — Harmoni dalam Ekosistem

A learning and competitive-game site for Grade 6 IPAS (Chapter 2, *Harmoni dalam
Ekosistem*). Two players share one screen, answer the same questions, and race to
trace how energy moves through a food chain. No accounts, no install step for
students, no external image hosts.

Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Lucide
icons, and localStorage persistence.

## Routes

| Route | What it does |
| --- | --- |
| `/` | Landing page: chapter framing, quick links to the three main areas. |
| `/belajar` | Chapter badge, "Rantai Makanan" explainer, five organism cards (produsen, konsumen I–II, konsumen puncak, pengurai), the energy flow `Matahari → Rumput → Belalang → Katak → Ular → Elang`, arrow-direction note, "Tahukah Kamu?" panel, and five checkpoint questions. |
| `/games` | Game hub: Duel Ekosistem, Susun Cepat, and pre-game tips. |
| `/arena` | Duel 1 vs 1: setup (names, avatars, difficulty filter, category filter, round length), tutorial, countdown, split board, energy rope, pause/resume/exit, reveal, result, replay. |
| `/games/susun-cepat` | Drag-and-drop food-chain builder with independent boards for both players across sawah, hutan, and laut, plus tutorial and retry options. |
| `/juara` | Leaderboard (all/duel/susun), best scores, wins, badges, and the chapter conclusion. |
| `/guru` | Local question bank: create, edit, review, activate, delete, search, filter, restore the 32 seed questions. |

Navigation keeps the three main areas (Belajar Materi, Arena Games & Duel, Papan
Juara) reachable on desktop and mobile; the teacher panel and audio settings live
in the header.

## Game rules

### Duel Ekosistem (`/arena`)

- Both players receive the same question order, at most 10 non-repeating items
- Filterable by difficulty (Mudah, Sedang, Sulit, Campuran) and category (Umum, Sawah, Hutan, Laut, Keseimbangan, dll.).
- A–D answer pads on each side. Correct answer: **+100**. The first correct answer
  in a round also earns **+50**.
- A wrong answer freezes only that panel for **2 seconds**; the opponent keeps
  playing. A correct answer locks that panel for the rest of the round.
- The round closes when both players are correct or the timer expires. Only then
  is the answer key and its explanation revealed.
- The rope shows the score difference. A result screen offers replay and the
  match is written to localStorage.
- The answer key is held by a `DuelEngine` instance and only
  redacted `PublicQuestion` snapshots reach React.

### Susun Cepat (`/games/susun-cepat`)

- Real pointer/mouse/touch drag and drop. Each player owns a private card pool and
  slot row, so one player cannot move the other player's cards.
- Lift, valid-slot highlight, drop, swap, replace, and return-to-pool are all
  supported. Tapping a card and then a slot is the keyboard/fallback path.
- No correctness feedback before submit. A wrong submit freezes that area for
  **2 seconds** with a shake; a full solve gets a glow and confetti.
- **100 points** per correct position, **+250** for the first player to finish.
- Chains: Sawah (`Padi → Belalang → Katak → Ular → Elang`), Hutan
  (`Tumbuhan/Daun → Ulat → Burung Pemakan Serangga → Elang`), Laut
  (`Fitoplankton → Zooplankton → Ikan Kecil → Ikan Besar → Hiu`). Decomposers are
  an extra slot after the chain and are explained as recyclers of matter, not a
  trophic level that receives energy from the Sun.

## Project structure

```
app/                     routes, layout, global theme, icon
components/
  audio/                 AudioProvider (SFX + music) and the settings dialog
  layout/                header, footer
  learning/              organism cards, energy flow, fun fact, checkpoint quiz
  games/                 shared tutorial component
  games/duel/            local duel board, setup, result
  games/susun/           drag-and-drop panels, setup, result
lib/
  audio/                 preference persistence and the sound manager
  data/                  questions, learning copy, ecosystems, badges, bank
  game/                  duel engine, susun logic, history
  storage.ts             localStorage helpers
scripts/generate-audio.mjs  regenerates the original WAV assets
public/audio/            generated SFX + background loop
```

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The app runs entirely client-side with localStorage persistence.

Other scripts:

```bash
npm run lint
npm run typecheck
npm run build
npm run audio:generate   # rewrite public/audio/*.wav from code
```

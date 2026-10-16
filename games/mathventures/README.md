# Mathventures · The Glimmerwood Trials

A playable, original arithmetic adventure for the browser. Become a lantern keeper, complete missing-operator equations, and restore four woodland guardians. Inspired by the approachable turn-based puzzle-adventure format, with original characters, artwork, writing, and mechanics.

## Play locally

Requires Node.js 20.19+ or 22.12+ and npm.

From the repository root, enter this game's directory before installing or running commands:

```sh
cd games/mathventures
npm ci
npm run dev
```

Open the local address printed by Vite. The game supports desktop and mobile portrait layouts. All game assets and Phaser are bundled locally; no account, API, CDN, or external media is required.

## Controls and rules

- Click **Begin adventure**, then choose the operator that makes the equation true.
- Choose **Adventure** for the original challenge or **Relaxed** for gentler guardian attacks. Your choice is kept when you retry.
- Tap a choice, use **Tab + Enter/Space**, or press **1–4** for ×, −, ÷, +.
- Correct answers cast spells. Consecutive correct answers increase damage from 12 to 24.
- Incorrect answers reveal the complete equation and cost health. No timer and no damage while thinking.
- Free all four guardians to win. Moving to a new guardian restores up to 10 health.
- Use your one **Potion** when injured to restore up to 35 health without changing the question or your streak. The guardian’s next retaliation is shown beside its health, with a warning when the next miss would end the run.
- **How to play** opens the guide; the music-note button toggles generated sound effects. Sound starts off. **Start a fresh adventure** resets the run.

There are no fractional answers, negative results, or division by zero. Every puzzle has exactly one valid choice. A run usually takes a few minutes.

## Local progress

Progress saves on the current browser by default. Reload and choose **Continue adventure** to resume the same equation, health, potion, streak, and encounter. Each accepted answer saves its resulting state before animation, so reloading cannot replay a spell or its damage. **Begin new adventure** replaces the previous saved run only after you choose it.

Uncheck **Remember this journey on this device** before starting to disable run saving. One run can be saved at a time. Finished runs clear that slot; the title remembers your last journey and a separate personal best for each mode, ranked by guardians freed, accuracy, then best streak. These records are local to this browser, with no account or cloud sync. Invalid or unavailable browser storage never prevents play.

## Validate and build

Run these commands from `games/mathventures/`:

```sh
npm test
npm run build
npm run preview
npm run package:itch
```

The static build is in `dist/`. Relative asset URLs make it suitable for an itch.io HTML game embedded in an iframe. The packaging command creates `artifacts/mathventures-web.zip` with `index.html` at the archive root. See the deployment notes in `docs/` for hosting and upload details. Deploying or publishing is a separate action.

## Project layout

- `src/game/engine.js`: immutable, DOM-free game state and unique-answer integer puzzle generation. RNG arguments allow deterministic tests.
- `src/game/persistence.js`: versioned, validated local-save and results serialization, independent of browser storage.
- `src/game/ForestScene.js`: Phaser scene with original procedural forest/character art and spell animations.
- `src/main.js`: accessible DOM controls, progression, feedback, dialogs, and optional synthesized audio.
- `src/style.css`: responsive layout and reduced-motion styling.
- `docs/GDD.md`: scope and compact game design document.

This is a focused prototype: one chapter, four encounters, two difficulty modes, one healing potion, local progress and records, procedural placeholder art, and optional effects without a soundtrack. Results show accuracy, best streak, mode, and guardians freed. Puzzle history avoids the last eight exact equations in each run, including after resume.

Code is distributed under the repository’s [MIT license](../../LICENSE).

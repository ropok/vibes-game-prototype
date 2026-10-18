# MBG Evolution

A complete, Indonesian-language comic kitchen game for browsers. An empty lunch tray eats its way through twelve original mutations until an entire kitchen village stands on its back. Each creature has its own illustration, fictional dimensions, favorite food, ability, lore, and peculiar habit in **Buku Evolusi**.

The game uses original procedural canvas illustrations, local system fonts, Phaser 3, and Vite. The built game makes no requests for remote art, fonts, accounts, or analytics. It is a separate game: Mathventures and Winterhold remain independent.

## Play

1. Click or tap a roaming food creature. Your small ompreng approaches it, then lunges to hit. Food takes one to three hits.
2. Once it falls over, **tap it again** to consume it. The food visibly shrinks and flies into the ompreng before granting 10 XP. A knockout and an absorption remain separate actions; fallen food waits indefinitely.
3. When the energy meter fills, **evolution happens automatically** and a discovery page introduces the next form. Energy beyond the threshold carries over.
4. Discover all twelve forms in exactly 100 absorptions. After Kopdes, continue playing or browse the complete book. Starting again requires confirmation.

Each approach, strike, or consumption must finish before another action starts; repeated clicks cannot queue duplicate hits or XP. There is a minimum 0.3-second interval between accepted actions, and absorbed food returns after 0.7 seconds. Stronger forms have higher attack power; food scales with them so its hit count remains one to three. Remaining hits survive evolution. There is no idle or offline growth.

**Keyboard:** press **1–6** to choose a target, then **Space** to act. Tab focuses the food directly in the arena; Enter or Space performs the same approach and action. Focus rings and spoken food labels make the arena targets accessible without a separate selection panel. Holding a key does not automate hits. Touch targets remain at least 44 pixels on narrow screens.

**Buku Evolusi** opens from its button inside the arena. There is no persistent notebook sidebar. **Pause** stops movement and any unfinished action. Opening help or the book also pauses it; closing the dialog resumes the same action. The help panel offers optional sound and reduced movement. Reduced movement preserves the approach and consumption cues while removing decorative bobbing, spinning, and hit swishes. Sound starts off; the system's reduced-motion setting supplies the initial motion preference.

## Run and validate

Requires Node.js 20.19+ or 22.12+ and npm. Run within this game directory:

```sh
npm ci
npm run dev
npm test
npm run build
npm run package:itch
```

Production files are in `dist/`; the self-contained itch.io archive is `artifacts/mbg-evolution-web.zip`. See [deployment](docs/DEPLOYMENT.md), [playtest](docs/PLAYTEST.md), and the [game design document](docs/GDD.md).

## Saves

The versioned `mbg-evolution-save-v1` local-storage entry contains the active form, energy, discovered forms, action statistics, seeded roaming food, and simulation clock. An action commits only when its movement finishes, then synchronously saves the result and any automatic evolution before reward feedback or the discovery dialog. Reloading an unfinished movement grants no hit or XP; completed actions restore their food state and cannot consume the same target twice. Older saves waiting at a full meter evolve on restore. Saves never apply offline time.

Malformed, inconsistent, or unknown-version saves safely fall back to a new game. Blocked storage displays an in-game message and still permits play. Browser storage is local to the current browser and origin, and private browsing may discard it. Optional sound and motion settings use a separate preferences entry. **Mulai ulang** changes the save only after confirmation.

## Source layout and simulation API

- `src/data.js`: twelve forms and six food types.
- `src/engine.js`: deterministic simulation with no DOM, storage, clock, or Phaser dependency.
- `src/art.js`: original locally generated illustrations and paper kitchen backdrop.
- `src/main.js`: Phaser scene, accessible DOM controls, dialogs, saves, and optional audio.
- `src/style.css`: desktop and portrait layouts.

Engine exports: `createState(seed)`, `step(state, deltaSeconds)`, `act(state, targetId)`, `canEvolve(state)`, `evolve(state)`, `serialize(state)`, `restore(raw, fallbackSeed)`, `FORMS`, `FOODS`, `SAVE_KEY`, `SAVE_VERSION`, and `ARENA`. `step`, `act`, and `evolve` mutate the supplied state. `step` uses a fixed 1/60-second tick and caps a single supplied interval at 0.25 seconds. `act` returns `hit`, `knockout`, `absorb`, or `blocked`; an absorption includes `evolution` (`null`, or an `evolve`/`win` event) when it crosses a threshold. The `evolve` export remains available for compatibility. IDs 1–6 identify stable food slots. Only `step` advances action cooldown and respawn time.

This is a fantasy kitchen comedy. Its invented creatures and events do not depict real people or institutions. No official logos or external artwork are used.

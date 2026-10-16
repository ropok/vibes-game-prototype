# Mathventures — The Glimmerwood Trials

**Version:** 0.1.0 prototype · **Platform:** desktop/mobile browser · **Engine:** Phaser 3 + accessible HTML controls · **Format:** static HTML, itch.io ready

## Vision

A thoughtful little journey in which arithmetic feels like casting a spell. The player is a lantern keeper restoring light to a forest overtaken by wayward magic. Woodland guardians are freed rather than killed. An original world, original procedural artwork, and gentle writing establish a distinct identity.

The prototype takes inspiration from the broad turn-based puzzle-adventure structure of games such as Bookworm Adventures. It uses no characters, dialogue, branding, art, or assets from those games. Mathleticus, MathCombat, and Battle Math are adjacent references for arithmetic battle conventions; this prototype makes no market-demand claims.

## Core loop

1. Read an equation such as **5 ? 0 = 0**.
2. Pick one of **× − ÷ +**. Exactly one operator is valid.
3. A correct answer launches a lantern spell; a wrong answer lets the guardian retaliate and shows the resolved equation.
4. Build a streak, free a guardian, recover a little health, and follow the path to the next encounter.
5. Free the final guardian or run out of health. Review accuracy and best streak, then restart.

No countdown, reaction challenge, navigation, equipment, inventory, or payment systems are included. The player can think without penalty.

## Rules and tuning

| Rule | Prototype setting |
| --- | --- |
| Player health | 100 |
| Correct spell | 12 damage, +3 per consecutive correct answer, capped at 24 |
| Incorrect answer | Enemy attack damage; streak resets; no damage dealt to enemy |
| Between encounters | Restore up to 10 HP, retain streak |
| Healing potion | One per run, restores up to 35% max HP (35 HP), capped at max health; no question, turn, streak, or score change |
| Difficulty | Adventure: listed attacks; Relaxed: each enemy attack × 0.6 rounded up |
| Answer feedback | 1.05 seconds correct; 1.7 seconds incorrect; input locked during resolution |
| Result | Accuracy, best streak, spells cast, difficulty mode, guardians freed, restart |

| Guardian | Location | Health | Attack |
| --- | --- | --- | --- |
| Mossling | Mosslight Clearing | 30 | 13 |
| Bramble Wisp | The Violet Thicket | 42 | 16 |
| Stonecap | Oldstone Crossing | 54 | 19 |
| The Hollow Crown | The Heartwood | 72 | 23 |

## Puzzle generation

Players choose Adventure or Relaxed before beginning; retry keeps the selected mode. Both use identical puzzle generation, player health, streak rules, and spell damage. Relaxed only reduces guardian retaliation. The enemy HUD states the health cost of the next wrong answer and highlights when that attack would end the run. The potion is unavailable at full health, after use, during answer feedback, or after a run ends. Its availability presents a small resource decision without adding time pressure.

The engine samples addition, subtraction, multiplication, and division equations. Ordinary operands increase from 0–8 to 0–20 by encounter. Division uses a nonzero divisor and an integer quotient, with dividends up to 120. Subtraction results remain nonnegative. All four operators are evaluated against the same operands: ambiguous equations are rejected. Invalid division and unsafe or noninteger values cannot count as answers. The last eight exact equations are excluded across encounters. After 100 failed random attempts, the generator tries **5 × 0 = 0** and then scans a finite legal pool, avoiding the recent history even with constant randomness.

## Presentation and access

The scene uses an evergreen, parchment, and warm lantern palette. Original code-drawn characters, layered trees, glowing motes, and restrained spell animation create a cohesive placeholder art direction. Georgia and local system sans fonts avoid network font dependencies. An optional procedural chime provides feedback without downloaded sound files.

Controls are real HTML buttons with accessible names and focus rings. Equations have readable text, health bars expose values, and a polite live region announces feedback. Keyboard shortcuts 1–4 supplement Tab/Enter/Space. Feedback uses words and shapes as well as color. Reduced-motion preferences disable continuous animation and spell motion. The portrait layout supports 320px screens; page content may scroll normally rather than shrink touch targets.

## Architecture and scope

`engine.js` contains the independently testable immutable rules, with injectable randomness. Phaser owns illustration and animation; the DOM owns controls and information. Vite bundles the engine and assets with a relative base path. `persistence.js` validates versioned snapshots independently of browser storage, including modes, counters, health, potion inventory, unique-answer puzzles, recent history, and turn metadata.

Local saving is enabled by default and can be disabled before beginning. There is one local run slot. Accepted answers save the next state before their feedback animation; potion use saves immediately. Reload offers Continue with mode, guardian, and health information. A new run replaces the old snapshot only when begun. Terminal states clear the active slot and save a compact last-journey result, with separate per-mode bests ranked by guardians freed, accuracy, then best streak. Resuming never replays a turn or result. Corrupt, unsupported, blocked, or unavailable browser storage is ignored safely, with a brief notice when storage access fails. No accounts or cloud sync are included.

Completion means a playable opening, four distinct encounters, evolving difficulty, win/loss screens, restart, keyboard/touch controls, passing automated rule tests, a checked browser build, and a static upload archive. Later work could add authored lessons, additional chapters, localization, and a richer art pass after observing playtests. These are outside this prototype.

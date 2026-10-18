# Ternak Zombie · Arus di Kota Mati

An independent, mobile-friendly browser survival game in Indonesian, built with Phaser. Play as Raya, a brave survivor bringing an abandoned city back to life by turning the movement of captured zombies into electricity.

```sh
npm ci
npm run dev
```

Open the local address shown by Vite. Requires Node.js 20.19+ or 22.12+ and npm. All art is original procedural drawing; the game loads no remote assets and needs no account.

## Controls

| Action | Keyboard | Touch / mouse |
| --- | --- | --- |
| Move | WASD or arrow keys | Direction pad at lower left; two arrows allow diagonal movement |
| Lure a nearby wild zombie | Space | Pancing |
| Search a nearby supply crate | E | Ambil / Periksa |
| Build and upgrade | Walk into a marked ground square and remain inside | Move into a marked square with the direction pad |
| Repair shelter / walls | E near home | Perbaiki near home |
| Pause / resume | Escape | Pause button at upper right |

Sound starts muted. Enable it with the music-note button. Help explains the rules in game. Restart asks for confirmation. Leaving the browser tab or window pauses the session. Resume explicitly to continue; paused, hidden, and closed games generate no electricity.

## Your first night

1. Press **Pancing** near the marked zombie south of Raya. A successful lure consumes one bait and lasts 25 seconds; it makes the zombie physically follow Raya.
2. Walk into the **Kinetik area west of the shelter from any direction** and wait for the follower. The zombie itself must enter the full marked 180 × 180 area and remain for 0.8 seconds. Luring alone never captures it; there is no entrance restriction.
3. Captured zombies run on the generator track. Electricity comes from their actual distance traveled: `distance × 0.035`. Resting the generator freezes the zombies and produces **0 W**. The HUD shows the moving count and instantaneous rate.
4. Explore the yellow supply crates, then press **E / Ambil** nearby. Each gives 5 scrap and 2 bait and refreshes after 45 seconds.
5. Walk into one of the four small ground squares near the shelter: KINETIK, SHELTER, DINDING, or MENARA. Stand inside while its loading ring fills. Start with walls or an electric turret and save scrap for repairs. Survive the first night and produce a lifetime total of 120 energy to complete the first milestone. You can keep playing afterward.

Raya begins with 100 health, 3 bait, and 10 scrap. Her shelter has 250 health and a built generator cage for two zombies. Wild zombies hurt on contact. Raya automatically strikes nearby threats, but never attacks lured or captive zombies. Resting near home heals her; if she falls, she returns to shelter after three seconds with 60 health. Captures and supplies persist through that recovery.

The first night begins after 90 seconds and lasts 50 seconds, with five attacking zombies. Later days last 55 seconds; each subsequent night adds one attacker. A modest shelter defense helps hold the line. Electric turrets target only hostile night attackers and consume real battery energy.

| Construction | Scrap | Time in square | Result |
| --- | --- | --- | --- |
| Kinetik LV 1 → 2 | 10 | 10 seconds | Capacity 2 → 4 |
| Kinetik LV 2 → 3 | 18 | 20 seconds | Capacity 4 → 6 |
| Shelter LV 1 → 2 | 12 | 12 seconds | Max health 250 → 350; solar panels and lamps |
| Shelter LV 2 → 3 | 22 | 22 seconds | Max health 350 → 475; roof extension and beacon |
| Walls LV 0 → 1 | 8 | 8 seconds | New protective perimeter; 100 health |
| Walls LV 1 → 2 | 14 | 14 seconds | Stronger wall; 180 health |
| Walls LV 2 → 3 | 22 | 20 seconds | Reinforced wall; 280 health |
| Electric turret | 12 | 8 seconds each | Up to three turrets; each shot costs 3 stored energy |
| Shelter / wall repair | 4 | E near home | Restores up to 70 health; shelter takes priority |

Construction charges scrap once when a funded project starts. Only one project can run at a time. Leaving its square pauses the timer; reentering continues without paying again. Other squares show that a project is active. A finished project never starts another level while Raya stays in place: leave and reenter to build again. Labels show current level, exact next price, build duration, and maximum state; the focused HUD and loading ring show time remaining. Pause, hiding the tab, and being downed freeze construction. Restart clears every project and level.

Walls are absent at the start. Built walls stop hostile attackers at the perimeter and take damage before the shelter; after wall health reaches zero, attackers can advance. Gaps let Raya and followers pass freely. Repair restores the shelter first, then damaged walls when the shelter is healthy. Shelter upgrades add their max-health increase to current health without exceeding the new cap.

The battery holds 200 energy. **Total production** counts all physical generation, including excess when the battery is full; **stored energy** is capped and is spent by turrets. There are no offline rewards. This prototype has session-only progress: refreshing or closing the page starts a new run.

## Validation and distribution

```sh
npm test
npm run build
npm run package:itch
npm run smoke:browser
npm run smoke:layout
```

See [design notes](docs/GDD.md), [deployment](docs/DEPLOYMENT.md), and [playtest checklist](docs/PLAYTEST.md). The standalone upload archive is `artifacts/ternak-zombie-web.zip`.

The simulation lives in `src/engine.js`, advances at fixed 60 Hz, and has no renderer or browser dependency. Phaser draws the city and characters; responsive HTML supplies accessible controls and HUD. Public `#game-status` data attributes expose simulation observations for browser verification. `window.__game.getState()` returns a copy of current state.

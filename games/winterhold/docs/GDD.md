# Winterhold · The Last Hearth — prototype design

## Experience

A keeper steps into a bright, generous valley and creates a small community before the cold arrives. Exploration supplies settlement building; settlement building turns rescued people into a defense. The winter deadline connects each short trip to a clear final test.

The presentation uses original procedural shapes: layered evergreen canopies, faceted rocks, berry clusters, tiny round-headed settlers, warm roofs, wooden towers, and a central fire. Dark green interface surfaces and warm gold actions keep the terrain visible. The visual influence is the clarity of a chunky toy settlement rather than any copied character, image, or commercial game asset.

## Run structure

- Preparation: 150 seconds. Walk, gather, build, recruit, and train. Periodic bandits create light pressure.
- Warnings: 60, 30, and 10 seconds before winter. At 30 seconds, the objective and home direction prioritize returning.
- Winter: eighteen raiders spawn every 1.55 seconds along four approaches. Ambient bandit spawning stops. Raiders walk into the settlement and attack; defenders and keeper fight automatically.
- End: win after all winter raiders have spawned and died; lose when keeper or hearth health reaches zero. A summary records recruited settlers, constructed buildings, and threats defeated. Restart creates a fresh deterministic run.

The intended session is approximately 3–4 minutes, including the initial welcome. The initial two settlers, guaranteed nearby resources, and two towers allow a modest settlement to win. Fully upgrading every slot or recruiting every camp is unnecessary.

## Valley and movement

The world measures 2600 by 2000 units, with the hearth at its center. The keeper moves at 235 units per second. Resource groves and three survivor camps encourage trips west, east, and north. Three wolves wander outside the starting clearing. The nearest timber, stone, and berry groves provide safe early options.

Movement supports WASD/arrows and desktop click destinations. Touch uses a bounded joystick. A compact minimap shows resource colors, occupied camps, the keeper, the hearth, and raiders. The return-home control displays a world arrow. It supplies orientation while preserving traversal.

## Economy and interaction

The starting economy is 24 wood, 14 stone, 20 food, two settlers, and four beds. Resource nodes each supply 24 units; an interaction collects eight with a 0.65-second cooldown. The player must be within 98 units of a node or 125 units of a camp. Recruitment spends four food and requires a spare bed.

Construction uses fixed plots within 265 units of the hearth. Two longhouses each add four beds. Two palisade upgrades each add 100 current and maximum hearth health; any palisade slows enemies within 245 units of the fire. Two watchtowers shoot at threats within 470 units. One training yard enables converting settlers to guards for five wood and five food each.

Food is a reserve rather than a recurring starvation tax: it pays for welcome, training, and optional keeper healing. Wood also pays for optional hearth repairs. The hearth slowly restores keeper health without cost when nearby. Wolf and raider defeats add small food rewards. Resources do not respawn during this deliberately short run.

## Combat

The keeper automatically strikes within 110 units for 22 damage every 0.6 seconds. The initial two settlers and each welcomed refugee automatically throw stones for 6 damage every 1.5 seconds, even when the keeper is away. Each untrained settler holds a stable position around the fire and targets enemies within 175 units of themselves and 230 units of the hearth, prioritizing the closest threat to the hearth. Gold trails and a small strike flash show actual throws. Settlers stay in the refuge rather than pursuing enemies into the valley. Training removes one stone thrower and replaces them with a guard; the same person cannot attack in both roles.

Guards engage threats within 510 units of the hearth, move into range, and attack for 16 damage every 0.8 seconds. Towers deal 26 damage each second. Guards have 85 health and recover slowly while no threat is in range. A dead guard is removed from the living settler population. Untrained settlers share the hearth's protection and have no separate health or death mechanic in this prototype.

Wolves have 38 health and primarily threaten nearby explorers. Raiders have 56 health and target the hearth unless a nearby keeper or guard draws them away. Enemies deal seven damage to the hearth or six to a person every 1.2 seconds. The hearth begins with 280 health; keeper begins with 100. These values favor preparation and active support without requiring precise aiming.

## Interface and accessibility

The resource bar, countdown, population, hearth and keeper health, objective, minimap, contextual interaction, and build cards are DOM elements over the canvas. Build cards display costs and limits. Titles explain requirements and effects; disabled states reflect affordability and proximity. Toasts give polite live announcements. Focus indicators, real buttons, keyboard menus, touch controls, and a reduced-motion variant are included.

The welcome screen explains the complete loop. Pause/help screens stop the timer, as do document hiding and window focus loss. Optional oscillator-based sound is muted until enabled; no external audio dependency exists. This prototype requires sight to navigate its spatial canvas and is not a complete screen-reader adaptation.

## Engineering and limits

Rules and presentation are separate. `engine.js` uses seeded integer randomness, bounded time input, and an internal fixed 1/30-second tick. State-changing actions enforce their own proximity, affordability, capacity, pause, and terminal conditions. Tests exercise deterministic stepping, interaction range, economy, survival, failure, and full-run balance.

The prototype has one valley, one seed, one winter, fixed construction slots, and no campaign, persistence, drag construction editor, inventory equipment, manual aiming, multiplayer, or external asset services. It is designed as a self-contained browser and itch.io HTML game.

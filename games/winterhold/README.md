# Winterhold · The Last Hearth

A short exploration and settlement defense game. Begin with a campfire in a broad green valley, gather timber, stone, and berries, welcome displaced settlers, and raise a refuge before the winter horde arrives.

This is an independent Phaser browser prototype with original procedural artwork, generated sound, and no downloaded art, font, or audio assets. One run takes about 3–4 minutes. There is no account, network service, or saved progress.

## Play locally

Requires Node.js 20.19+ or 22.12+ and npm.

```sh
cd games/winterhold
npm ci
npm run dev
```

Open the local address printed by Vite. On a phone connected to the same local network, use the printed network address.

## Controls

| Action | Desktop | Touch |
| --- | --- | --- |
| Move | WASD, arrow keys, or click a destination | Drag the lower-left joystick |
| Gather supplies | Hold Space near a resource | Hold the contextual Gather button |
| Welcome a settler | Space near an occupied camp | Tap Welcome settler |
| Build / train | Click the bottom building cards | Tap the bottom building cards |
| Pause / help | P, Escape, or top-right buttons | Top-right buttons |
| Find home | Click the map's Hearth button | Tap the map's Hearth button |
| Heal / repair | Keeper Eat button / bottom Repair button | Same buttons |

The keeper attacks nearby wildlife and bandits automatically. Your initial settlers and newly welcomed refugees throw stones at intruders near the hearth, even while the keeper explores. A gold throw trail marks each settler attack. Train settlers as guards for stronger attacks and a wider defense range; watchtowers also defend automatically. Controls are real labeled buttons; menus support keyboard focus. Sound is optional and starts muted. Pausing, opening help, hiding the page, or leaving the browser window freezes the simulation. Reduced motion preferences suppress character bobbing and snowfall animation.

## Build your first refuge

1. Walk southwest to the timber grove and gather wood. Stone is southeast of home; berries are northwest.
2. Build a longhouse at the hearth to gain four more beds. Follow the west trail to the Pinefolk camp and welcome settlers for 4 food each.
3. Build a training yard, then train your settlers for 5 wood and 5 food each. The initial two settlers can also become guards.
4. Raise one or two watchtowers. A palisade adds 100 hearth health and slows enemies close to home.
5. Return when the last 30 seconds begin. Stay near the hearth, help fight, eat if hurt, and repair using spare wood.

Winter begins after 2 minutes 30 seconds. Eighteen winter raiders arrive along four approaches. Defeat all eighteen while keeping both the keeper and the hearth alive to win. Wildlife roams the outer valley and a bandit enters every 42 seconds before winter. A fallen guard also reduces the settlement population. Food remains available from bushes and defeated threats; it is spent on recruitment, training, and keeper healing.

| Investment | Cost | Result |
| --- | --- | --- |
| Longhouse (maximum 2) | 16 wood + 6 stone | 4 additional beds |
| Palisade (maximum 2) | 18 wood + 8 stone | 100 additional current/maximum hearth health; slows nearby enemies |
| Watchtower (maximum 2) | 22 wood + 14 stone | Automatic ranged defense |
| Training yard (maximum 1) | 18 wood + 8 stone | Unlocks guard training |
| Train guard | 5 wood + 5 food | Upgrades one stone-throwing settler into a stronger guard with a wider defense range |
| Keeper provisions | 4 food | Restores up to 40 keeper health |
| Repair hearth | 8 wood | Restores up to 65 hearth health |

Building, training, and repair require proximity to the hearth. Gathering and recruitment require proximity to the selected resource or camp. Each resource node supplies 24 units in three gathers of 8; supplies are deliberately finite but plentiful for one run. The minimap shows resources, occupied camps, your position, home, and incoming bandits. The Hearth button reveals a directional marker; it does not teleport the keeper.

Untrained settlers stay around the fire and deal 6 damage every 1.5 seconds to an enemy within 175 units of themselves and 230 units of the hearth. They prioritize the closest threat to the hearth. Guards deal 16 damage every 0.8 seconds and intercept enemies within 510 units of home, so training remains a substantial defense upgrade.

## Validate and distribute

```sh
npm test
npm run build
npm run package:itch
```

The browser build uses relative asset paths and writes to `dist/`. Packaging writes `artifacts/winterhold-web.zip`, ready for an itch.io HTML game upload. See [deployment notes](docs/DEPLOYMENT.md) for the iframe and mobile checks. The archive contains a root `index.html`; it needs no server-side code.

The rules live in `src/engine.js`, a DOM-free module with seeded randomness and a fixed 30 Hz simulation. The Phaser scene and accessible DOM interface live in `src/main.js`. Engine tests include a complete winning run using movement, gathering, building, recruitment, and training, plus an undefended loss.

See [the design document](docs/GDD.md) for scope and tuning.

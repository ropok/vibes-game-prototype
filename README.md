# Vibes Game Prototype

A collection of browser game prototypes. Each game lives in its own directory under `games/`, with its source, dependencies, tests, documentation, and build outputs kept together.

| Game | Directory | Description |
| --- | --- | --- |
| Mathventures · The Glimmerwood Trials | [games/mathventures](games/mathventures/) | An arithmetic adventure with four woodland guardians, two difficulty modes, and local progress saves. |
| Winterhold · The Last Hearth | [games/winterhold](games/winterhold/) | Explore a bright valley, gather supplies, recruit settlers, and defend a growing refuge against the first winter horde. |
| MBG Evolution | [games/mbg-evolution](games/mbg-evolution/) | A comic kitchen evolution game in Indonesian: hit roaming food, absorb its energy, and discover 12 original creatures, from Ompreng Kosong to Kopdes. |
| Permisi Paket! | [games/permisi-paket](games/permisi-paket/) | Explore three Indonesian neighborhoods as a courier: deliver packages, follow the minimap, avoid traffic, and upgrade your gear with keyboard or touch controls. |
| Ternak Zombie · Arus di Kota Mati | [games/ternak-zombie](games/ternak-zombie/) | Guide Raya through an abandoned city, lure zombies into a kinetic generator, and power a shelter through the first night. |

## Run Mathventures

Requires Node.js 20.19+ or 22.12+ and npm. From the repository root:

```sh
cd games/mathventures
npm ci
npm run dev
```

Open the local address printed by Vite. See the [game README](games/mathventures/README.md) for controls, rules, and progress saving.

## Run Winterhold

```sh
cd games/winterhold
npm ci
npm run dev
```

Winterhold is an independent 3–4 minute exploration and settlement defense game with keyboard and touch controls. See its [game README](games/winterhold/README.md) for controls, rules, and building costs. Run validation and distribution commands from that game directory as well; its itch.io archive is `games/winterhold/artifacts/winterhold-web.zip`.

## Run MBG Evolution

```sh
cd games/mbg-evolution
npm ci
npm run dev
```

MBG Evolution is an independent browser game with touch, mouse, and keyboard controls, a complete 100-absorption campaign, an illustrated evolution book, and local progress saves. See the [game README](games/mbg-evolution/README.md) for rules and the [deployment guide](games/mbg-evolution/docs/DEPLOYMENT.md) for the standalone itch.io package.

## Run Permisi Paket!

```sh
cd games/permisi-paket
npm ci
npm run dev
```

Permisi Paket! is a mobile-friendly courier adventure with 18 homes, a camera that follows the player through a connected town, a minimap, four upgrade paths, and local progress saves. See the [game README](games/permisi-paket/README.md), [design document](games/permisi-paket/docs/GDD.md), and [deployment guide](games/permisi-paket/docs/DEPLOYMENT.md).

## Run Ternak Zombie

```sh
cd games/ternak-zombie
npm ci
npm run dev
```

Ternak Zombie is a mobile-friendly city survival game with physical zombie luring, a movement-powered generator, renewable supplies, electric defenses, and a first-night milestone. See its [game README](games/ternak-zombie/README.md), [design document](games/ternak-zombie/docs/GDD.md), and [deployment guide](games/ternak-zombie/docs/DEPLOYMENT.md).

## Validate and build Mathventures

Run these commands from `games/mathventures/`:

```sh
npm test
npm run build
npm run package:itch
```

The build is written to `games/mathventures/dist/` and the upload archive to `games/mathventures/artifacts/mathventures-web.zip`. See the [deployment notes](games/mathventures/docs/DEPLOYMENT.md) for previewing, browser checks, and itch.io setup.

## Repository layout

```text
games/
  mathventures/
    src/
    tests/
    scripts/
    docs/
    package.json
    package-lock.json
    README.md
  winterhold/
    src/
    tests/
    scripts/
    docs/
    package.json
    package-lock.json
    README.md
  mbg-evolution/
    src/
    tests/
    scripts/
    docs/
    package.json
    package-lock.json
    README.md
  permisi-paket/
    src/
    tests/
    scripts/
    docs/
    package.json
    package-lock.json
    README.md
  ternak-zombie/
    src/
    tests/
    scripts/
    docs/
    package.json
    package-lock.json
    README.md
.github/workflows/
AGENTS.md
LICENSE
README.md
```

Add future games in `games/<game-name>/`, each with its own README, package files, source, and any tests or supporting files it needs. Install and run dependencies inside the selected game directory. Repository-wide guidance, license, and workflows stay at the root; add or adjust workflows for each new game as needed.

Code is distributed under the [MIT license](LICENSE).

# Vibes Game Prototype

A collection of browser game prototypes. Each game lives in its own directory under `games/`, with its source, dependencies, tests, documentation, and build outputs kept together.

| Game | Directory | Description |
| --- | --- | --- |
| Mathventures · The Glimmerwood Trials | [games/mathventures](games/mathventures/) | An arithmetic adventure with four woodland guardians, two difficulty modes, and local progress saves. |

## Run Mathventures

Requires Node.js 20.19+ or 22.12+ and npm. From the repository root:

```sh
cd games/mathventures
npm ci
npm run dev
```

Open the local address printed by Vite. See the [game README](games/mathventures/README.md) for controls, rules, and progress saving.

## Validate and build

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
.github/workflows/
AGENTS.md
LICENSE
README.md
```

Add future games in `games/<game-name>/`, each with its own README, package files, source, and any tests or supporting files it needs. Install and run dependencies inside the selected game directory. Repository-wide guidance, license, and workflows stay at the root; add or adjust workflows for each new game as needed.

Code is distributed under the [MIT license](LICENSE).

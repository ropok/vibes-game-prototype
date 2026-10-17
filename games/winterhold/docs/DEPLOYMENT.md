# Winterhold browser delivery

Run from `games/winterhold` with Node 22:

```sh
npm ci
npm test
npm run build
npm run package:itch
```

The upload archive is `artifacts/winterhold-web.zip`, with `index.html` at its root. The packaging check verifies local, case-sensitive asset references and rejects external runtime imports and common external network calls. The production build uses relative URLs so it can run below a nested itch.io path. No server, account, or API key is needed to play.

For local browser QA, install Playwright and Chromium in your QA environment and run `node scripts/smoke-browser.mjs` and `node scripts/smoke-embed.mjs`. A separately installed Playwright may be selected with `PLAYWRIGHT_MODULE` (absolute path to its entry module) and `PLAYWRIGHT_EXECUTABLE` (browser executable). These scripts serve the built files at `/games/winterhold/`, capture screenshots in `artifacts`, and reject runtime errors or external requests.

## Manual itch.io upload

Create an HTML game on itch.io and upload `winterhold-web.zip`. Select **This file will be played in the browser**. Use a resizable 1280 × 720 embed with fullscreen enabled; check the narrow touch layout as well. Keep the project private or restricted until playtest feedback has been reviewed. Verify keyboard focus, audio after a user gesture, restart, and mobile touch controls in the actual itch embed before publishing.

## Optional GitHub deployment

The `Deploy Winterhold to itch.io manually` workflow is prepared but does not run on pushes. Configure the GitHub environment `itch-winterhold` with variable `ITCH_TARGET` as `username/game-slug` and secret `BUTLER_API_KEY`. Add required reviewers if desired. Manually dispatch the workflow only when upload is authorized. It validates, builds, packages, then uploads the `dist` directory to the `html5` channel with the commit SHA as version.

Mathventures keeps its separate `itch` environment and existing workflow. No target, credential, upload, publication, or release is configured by this prototype.

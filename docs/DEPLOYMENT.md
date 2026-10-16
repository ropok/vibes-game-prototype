# Browser build and itch.io deployment

Use Node.js 22. Install with `npm ci`, then run `npm test`, `npm run build`, and `npm run package:itch`. The upload artifact is `artifacts/mathventures-web.zip`; `index.html` is directly at its root. The package task validates explicit HTML/CSS/module references, case-sensitive asset paths and itch archive limits. It rejects obvious external runtime loaders; dynamic URL construction still requires browser inspection. Preview the production build with `npm run preview` before uploading.

## Manual first upload

1. Sign into the intended itch.io account and create a project. Choose **HTML Game** as its kind. Keep visibility private/draft while testing.
2. Upload `artifacts/mathventures-web.zip` and mark it **This file will be played in the browser**.
3. Enable fullscreen and choose a responsive embed or fullscreen launch. Enable **Mobile Friendly** only after checking touch controls on a real phone.
4. Save and preview. Check title/start, every answer option, feedback, battle completion, restart, narrow portrait layout, fullscreen resizing and reload. Inspect browser network requests for missing assets or unexpected remote requests.
5. Add the final screenshots, description, controls and credits; choose page visibility when ready.

itch hosts HTML games under a subdirectory, so all runtime assets use relative paths. The archive must include the full build and a root `index.html`. See [official HTML5 upload requirements](https://itch.io/docs/creators/html5).

## Optional GitHub manual deployment

The validation workflow builds a downloadable artifact on pushes and pull requests. It does not upload to itch.io. The separate **Deploy to itch.io manually** workflow runs only through Actions → Run workflow and uploads the selected ref to the `html5` channel. Existing channel content is updated immediately, so select the intended reviewed commit.

Before running it, create a GitHub environment named `itch` with variable `ITCH_TARGET` set to `username/game-slug` (without a URL or channel) and secret `BUTLER_API_KEY` holding the intended account's wharf key. Optional environment reviewers can gate uploads. Never put that key in `.env`, a `VITE_*` variable, source code or logs. [Official authentication guide](https://itch.io/docs/butler/login.html).

The workflow downloads stable butler over HTTPS from itch's documented [automation download endpoint](https://itch.io/docs/butler/installing.html). After the first upload, edit the itch project and explicitly mark the `html5` channel playable in browser; channel naming alone does not do this. [Official pushing guide](https://itch.io/docs/butler/pushing.html).

No account, project, secret or hosted deployment is created by these files. To restore an earlier browser build, manually run deployment from the known-good ref, or upload its saved ZIP in the itch project editor.

## Enabling automatic deployment later

The current upload workflow is manual-only. To make it usable, first supply the intended itch account/project, `ITCH_TARGET`, `BUTLER_API_KEY`, and the browser-playable project/channel flags described above, then verify the private hosted page. Automatic publishing would require a separate reviewed change to add a trigger on approved `main` changes or release events and suitable environment protection. Adding credentials alone does not enable automatic uploads. No automatic trigger or hosted account action is configured here.

## Optional browser smoke

With preview running, `node scripts/smoke-persistence.mjs` checks accepted-turn saves during feedback, reload/resume, spent potion persistence, explicit new-run replacement, completed-run recall and corrupt/denied local storage. It uses isolated browser contexts and the same Playwright environment settings below. These checks imply no result until they have actually passed.

With the production preview already serving on port 4173, run `node scripts/smoke-browser.mjs` in an environment that has Playwright and Chromium available. If Playwright is supplied by a bundled runtime, set `PLAYWRIGHT_MODULE` to its absolute `playwright/index.mjs` path. `PLAYWRIGHT_EXECUTABLE` optionally points to a local Chrome/Edge executable. `SMOKE_URL` overrides the preview URL. The script checks desktop victory, defeat and retry, plus three correct answers at a narrow 320×568 touch viewport, and saves screenshots under `artifacts/`. A real-phone check is still required before claiming mobile support.

Run `node scripts/smoke-embed.mjs` after building for a separate nested-path iframe check. It starts and closes its own loopback-only static server, serves the production build at `/games/mathventures/`, checks desktop/mobile startup in an iframe, and fails on external runtime requests or browser/network errors. It uses the same Playwright environment settings. Record actual results in [PLAYTEST.md](PLAYTEST.md); this local shell approximates embedding and does not replace testing the saved itch.io page.

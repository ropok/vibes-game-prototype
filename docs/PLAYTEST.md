# Prototype QA record

Recorded from the delegated validation runner's results. Pending items remain unverified.

Build: local `codex/feature/mathventures-prototype` working tree, no commit yet. Date: 2026-10-16. Browser: headless Microsoft Edge; desktop 1440×1000 and mobile 320×568 emulation. Real-device testing has not been performed.

| Case | Expected behavior | Result / evidence |
| --- | --- | --- |
| First visit | Title, instructions, difficulty and sound opt-in work | Pass: browser smoke starts both viewport profiles; sound aria state toggles |
| Keyboard and touch | Numeric answer shortcut and actual touch taps work; help blocks shortcuts | Pass: final browser smoke includes Enter focus restoration, help-during-feedback focus retention and held Enter/Space repeat suppression |
| 320×568 active battle | All four operators visible without scrolling; no horizontal overflow | Pass: mobile operator bounds, portrait layout and landscape resize |
| Correct / incorrect answer | Correct damage and feedback; controls lock until next turn | Pass: engine tests and browser smoke |
| Enemy intent | Displayed damage equals actual health loss | Pass: browser smoke compares displayed intent to HP delta; engine damage rules covered by tests |
| Potion | Disabled at full health, heals once, preserves question/streak/attempt count | Pass: engine tests, browser and persistence smoke |
| Relaxed trail | Reduced enemy damage; chosen trail persists on retry | Pass: engine tests and browser smoke |
| Win / loss / retry | All guardians can be freed; losing ends run; retry resets run | Pass: desktop full victory, defeat and retry |
| Reload during feedback | Accepted turn is saved immediately and resumes once with stable HP/question/stats | Pass: correct and wrong accepted turns reloaded before feedback finishes |
| Save and new run | Potion use persists; starting new run replaces previous save only at Begin | Pass: persistence smoke; corrupt/denied storage also remains playable |
| Last result | Completed-run summary and per-mode best visible after reload | Pass: persistence smoke |
| Repeated questions | Recent puzzles avoided within the eight-question history window | Pass: engine tests including constant random input and history bounds |
| Page cache lifecycle | Persisted pagehide retains playable scene | Pass: synthetic persisted pagehide followed by another answer; real navigation cache not separately verified |
| Nested iframe build | Production assets load under a nested path in iframe without external requests | Pass: desktop/mobile nested iframe smoke |
| Real phone | Touch, resizing, audio opt-in and fullscreen work on target device | Pending |

Automated validation: `npm test` passed 26/26. Final production build and three-file itch ZIP packaging passed; the final archive is 361,959 bytes. The final `smoke-browser.mjs` run exited successfully, including focus restoration, modal focus retention and held Enter/Space repeat suppression. `smoke-persistence.mjs` and `smoke-embed.mjs` passed on the preceding relevant build; the final focus-only patch does not change those features. Browser emulation is not evidence of a real-device pass.

Screenshot evidence is generated under `artifacts/`: desktop/mobile title and battle, desktop victory/defeat, mobile landscape, resumed run, recalled last result, and desktop/mobile nested iframe. Screenshots document layout; they do not establish real-phone compatibility.

Scope limits: one chapter with four guardians and procedural art; saves stay in one browser profile on the device, with no cloud sync. No itch.io account, project, credential or hosted deployment has been configured. Actual itch embedding, real phones, other browser engines and user learning outcomes remain unverified.

Player observations: ask whether they understood the operator choice and damage, how mistakes felt, and whether they wanted another round. Do not treat a technical pass as proof of learning effectiveness.

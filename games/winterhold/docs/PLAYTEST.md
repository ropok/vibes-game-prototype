# Playtest checklist

Use a fresh page on desktop and a narrow touch viewport. Test both the standalone build and its nested iframe. Record build SHA, browser, viewport, input method, completion time, and any console errors.

## Automated baseline observed

On 16 October 2026, the baseline browser and iframe smoke scripts passed using headless Microsoft Edge at desktop 1440 × 1000 and touch-emulated mobile 390 × 844. Coverage included movement, gathering, hearth-only building, recruitment, training, pause, repeated pause keys, gather pointer cancellation, mobile terrain taps, and joystick movement/release. Bundle requests were local and no runtime errors were observed. Touch emulation does not replace testing on a physical phone.

`node scripts/smoke-winter.mjs` passed a complete normal-countdown browser session with gathered resources, a prepared settlement, the winter wave, victory, and restart. It uses seeded starting map coordinates as navigation guidance and reads the visible minimap; it never injects browser game state. All 15 engine tests also passed, including deterministic win and loss outcomes. Screenshots record preparation, combat, and victory. The updated iframe smoke passed all four viewports: desktop 1440 × 1000, mobile 390 × 844, small mobile 320 × 568, and landscape 844 × 390, including touch terrain, joystick movement/release, layout overlap, and page overflow checks. Production build and packaging passed; the verified archive was 363,148 bytes. Physical-phone behavior and the actual hosted itch.io embed remain unverified.

1. Start from the title screen without verbal instruction. Find movement and the context action.
2. Explore both directions. Gather resources at a visible source and confirm feedback and resource counts.
3. Build a defense, recruit a settler, then train a defender. Check cost, proximity, unavailable-action feedback, and resulting behavior.
4. Prepare for a wave. Confirm its warning, enemy movement, defenses taking damage, and defender attacks are readable.
5. Pause during preparation and combat. Confirm simulation freezes, resume continues, and controls do not remain stuck after focus loss.
6. Complete the survival objective with a prepared settlement. Separately allow an unprepared settlement to fall. Confirm each ending explains the result and offers a clean restart.
7. Restart and verify fresh resources, units, structures, wave state, and input state. Check mute, help/controls, and fullscreen where available.
8. Repeat in the iframe with keyboard focus, then touch controls. Check that all actions remain reachable, text fits, and the page does not scroll while moving.

Record observed outcomes separately from assumptions. Browser smoke scripts cover bundle startup, visible interactions, pause, and embed loading; engine tests and a full manual session cover deterministic combat and ending branches. A passing startup smoke alone does not establish balance or usability.

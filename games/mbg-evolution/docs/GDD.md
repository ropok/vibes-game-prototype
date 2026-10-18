# MBG Evolution — game design document

## Intent

A small, complete evolution game inspired by the readable loop of roaming prey, deliberate hits, absorption, and surprising transformations. The original setting is a warm paper-comic kitchen courtyard. The player begins as an empty lunch tray and becomes increasingly improbable kitchen life. All interface and creature text is Indonesian.

The campaign should take roughly five to ten minutes when discovering the controls and reading the eleven new-form pages. There is no payment, waiting gate, upgrade shop, idle income, or account. The complete campaign costs 1,000 energy: 100 absorbed creatures.

## Core loop

Six living food creatures roam within bounded courtyard coordinates. A live target needs one, two, or three deliberate hits; the distribution is 30%, 60%, and 10%. The rank gives attack power and scales food HP equally. Food already injured when the player evolves retains the same remaining hit count.

A selected creature first draws the small player ompreng toward it. Once within reach, the ompreng lunges before the hit commits. A final hit knocks the creature over but does not grant energy. Another deliberate tap approaches and consumes it: the food shrinks and flies into the ompreng during a 0.48-second animation, then grants 10 XP. Knocked creatures do not expire. The entire movement locks further actions, with a minimum 0.3-second action cooldown and a 0.7-second respawn. The six accessible DOM targets sit directly over the arena food and support pointer, touch, and keyboard interaction. No separate food-selection panel or hold-to-attack behavior is present.

The energy bar shows the local cost of the next mutation. Completing a consumption automatically evolves the player when the threshold is reached, preserves excess energy, unlocks the next bestiary entry, and opens its discovery page. No evolution button is needed. Form twelve concludes the campaign while leaving free play and the book available.

## Evolution ledger

| Rank | Form | Cost to next | Cumulative discovery XP | Visual silhouette |
| --- | --- | ---: | ---: | --- |
| 1 | Ompreng Kosong | 40 | 0 | Empty divided tray, thin legs, upright lid |
| 2 | Ompreng Bertaring | 50 | 40 | Open toothed lid and fanged tray mouth |
| 3 | Ompreng Isi Perdana | 60 | 90 | Rice hair, egg eye, leafy eyebrows |
| 4 | Ompreng Lauk Lincah | 70 | 150 | Four sausage legs, fork arms, tilted lid |
| 5 | Ompreng Kuah Meluap | 80 | 220 | Round soup pool, steam moustache, noodle tail |
| 6 | Ompreng Beracun Pelangi | 90 | 300 | Violet magic soup and floating eyed bubbles |
| 7 | Ompreng Berkepala Tiga | 100 | 390 | Three disagreeing lid heads on noodle necks |
| 8 | Gerobak Perut Besar | 110 | 490 | Striped cart awning, donut wheels, display mouth |
| 9 | Dapur Keliling Menggelinding | 120 | 600 | Stove chest, pot shoulders, spatula antenna |
| 10 | SPPG | 130 | 720 | Walking kitchen building and stacked-pan crown |
| 11 | Kompleks Dapur Berjalan | 150 | 850 | Three connected buildings, six feet, chimneys |
| 12 | Kopdes | — | 1,000 | Village on a giant tray, ladle tower, egg sun |

Each unlocked entry includes the exact original art, two-sentence lore, fictional dimensions, rank, attack power, favorite food, a named flavor ability, and a special quirk. Abilities do not add hidden mechanics. Locked entries expose only rank and an unknown specimen marker. There are no paid or inaccessible information pages. The short fiction note appears naturally in the book.

## Presentation

Cream paper, coral ink, olive accents, thick charcoal outlines, hand-drawn shapes, floor tiles, a utensil shelf, and a kitchen notebook establish a playful laboratory atmosphere. Art is drawn in local canvas code and reused consistently in the arena, discovery pages, and collection. Each rank has its own silhouette rather than a recolored common body. Fictional giant dimensions do not enlarge the live sprite until it obscures the courtyard.

The courtyard occupies the play width on desktop and portrait screens. Buku Evolusi is a dialog opened by a button in the arena; no notebook sidebar takes space from play. The player is compact (102–146 CSS pixels, depending on viewport and form), keeping the food readable while it walks across the courtyard. A KAMU label follows the player and changes to HUP! or HAP! during actions. Visible labels supplement HP hearts and fallen target rotation. Food targets retain 62 CSS pixels on small screens and their focusable hit areas stay at least 44 pixels. Reduced motion retains approach and consumption but removes decorative bounce, spin, and swishes.

## State and persistence

The seeded engine has no browser dependency. Movement uses bounded coordinates, fixed 60 Hz simulation steps, and a 0.25-second maximum catch-up interval. The simulation pauses in all book, help, discovery, and confirmation dialogs, during manual pause, and after leaving the page until the player resumes.

Actions commit once at the end of their animation and synchronously save the versioned result and any automatic evolution before reward feedback. The pending movement is transient: reload discards it without granting a hit or XP. Pausing or opening the book freezes it and resumes it on return. Persistence includes the arena, RNG state, current form, local XP, contiguous discoveries, hit and absorption statistics, and a logical clock. Save validation checks types, bounds, discovery order, food HP, version, and energy accounting. Valid older saves waiting at a full meter evolve on restore. Bad data starts fresh. Reopening has no offline time credit. Sound is optional and saved separately; reset always requires explicit confirmation.

## Completion criteria

Reach all twelve forms through real gameplay, observe a separate knockout and absorption, verify local XP and 100-absorption completion, inspect every unlocked entry, pause/resume, reload progress, test corrupt storage, and cancel then confirm reset. Keyboard and portrait play must retain the same functionality as pointer play. Production must load from relative paths in a standalone static host and an iframe without remote assets.

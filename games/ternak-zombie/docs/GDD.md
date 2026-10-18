# Ternak Zombie — Arus di Kota Mati

## Premise and tone

Raya is the last keeper of a small shelter in an abandoned city. She chooses resourcefulness over despair: bring roaming zombies into a kinetic generator, store their energy, and defend a warm refuge until dawn. The mood is quiet, hopeful survival with stylized, non-graphic danger. Indonesian is the interface language.

The standalone prototype uses the exploration, gathering, refuge building, and night-defense rhythm of Winterhold. Its own city setting and central physical zombie-generator loop define the experience. The title, characters, illustrations, buildings, interface, and audio tones are original. No downloaded artwork or remote dependencies are required at runtime.

## Play space and presentation

A 2200 × 1600 connected city contains nine ruined blocks, broad asphalt streets, abandoned cars, roof cracks, broken windows, and creeping vines. A teal-gray palette sets off Raya's ochre coat and the amber shelter. The camera follows Raya. A compact minimap shows buildings, Raya, available supply crates, wild/hostile zombies, the cage, and the shelter.

Raya has four facing directions, walking arms and legs, a dark ponytail, and a burgundy scarf. Zombies have green skin, torn clothes, and distinct arm poses. Lured zombies receive a gold ring, marker, and capture-progress bar. Captives physically move around a visible circular generator track. Power conduits and shelter windows brighten while stored electricity is available.

## Core simulation

The engine advances through a fixed 1/60-second accumulator. An update accepts at most 0.25 seconds to avoid background catch-up. Input direction is normalized so diagonals do not move faster. Raya travels at 170 world units per second. Ruin rectangles prevent walking through buildings; sliding provides local obstacle avoidance. Connected streets and open resource placements keep the route navigable.

Lure selects the closest wild zombie within 250 units. It consumes exactly one bait only on a valid target, changes that zombie into a follower for 25 seconds, and leaves its world position unchanged. Followers travel at 112 units per second. Capture requires the zombie itself to stay anywhere inside the marked 180 × 180 Kinetik deck for 0.8 seconds while capacity is available. All four sides are open and there is no entrance point or gate. A full generator cannot capture another zombie. After capture, the zombie moves to its track slot.

Each captive's physical distance traveled on each tick is multiplied by 0.035 energy units. The meter's W label represents energy units per simulated second. Running captive slots have elliptical radii of 36, 48, or 60 units. Lifetime generation records physical production even at full battery. Stored battery energy caps at 200. Turret expenditures have a separate ledger. Resting the generator keeps captive coordinates unchanged, reports no moving zombies, and produces no energy.

## Economy and survival

The initial shelter has 250 health; Raya has 100. The built cage holds two zombies. Starting resources are 3 bait and 10 scrap. Six renewable crates give 5 scrap and 2 bait each, with a 45-second refill. Wild roamers replenish if their population becomes low. Dawn gives two bait. This prevents exhausted initial bait from ending an otherwise viable run.

Four distinct 64 × 64 ground squares provide automatic construction while Raya stands inside. Kinetik upgrades LV1→2 cost 10 scrap / 10 seconds and LV2→3 cost 18 / 20 seconds, adding two slots each. Shelter upgrades cost 12 / 12 seconds then 22 / 22 seconds; max health increases from 250 to 350 to 475, current health receives the same bounded increase, and new solar panels, lamps, an extension, and beacon show the change.

Walls initially have level zero and no structure. Their three square-based upgrades cost 8 / 8 seconds, 14 / 14 seconds, and 22 / 20 seconds, with full wall health of 100, 180, and 280. Hostile attackers stop at the shelter's 165-unit protective perimeter while wall health remains; hits consume wall health before spilling into shelter health. Destroyed walls let attackers advance. Visible perimeter segments leave gaps for Raya and followers, without adding collision obstacles to their route. Upgrading walls restores their new full health.

Up to three electrical turrets cost 12 scrap and eight seconds in their construction square each. A shot costs 3 stored energy, deals 25 damage, and has a 1.2-second cooldown. Turrets target hostile night attackers within 300 units; lured and captive zombies are ignored. Repair via E near home costs 4 scrap and restores up to 70 shelter health, or wall health when the shelter is full. Repairs respect upgraded health caps. Generator control requires Raya within 260 units of home.

Exactly one global construction job can exist. Starting deducts its full price once, leaving the square preserves paid progress, and returning resumes it. Insufficient funds do not start a job or advance progress. Other squares explain that another project is active. Completion latches that square until Raya exits, preventing accidental purchases of the next level. Pause, hidden state, loss, and being downed freeze construction; restarting creates clean job and latch state. Ground labels and the contextual HUD show current levels, exact costs and durations, loading progress, remaining seconds, paused/blocked feedback, completion feedback, and maximum levels. Construction has no instant-button bypass.

Wild zombies approach at 85 units per second when Raya comes close. Contact damage has a one-second player cooldown. Raya automatically strikes nearby un-lured threats for 9 damage every 0.7 seconds. The shelter has a modest basic defense. Shelter proximity heals Raya by four health per second. At zero health, Raya recovers after three seconds at home with 60 health and a brief immunity, retaining captures and resources.

The first day lasts 90 seconds and the first night 50 seconds. Five hostile attackers spawn around the city at dusk. Later days last 55 seconds; subsequent nights increase their count. Attackers pursue the shelter and may turn toward Raya at close range. Reaching the shelter allows repeated damage. Remaining hostile night attackers disappear at dawn. Shelter health reaching zero ends the run.

## Session arc and feedback

The first objective highlights the nearby wild zombie. After luring, the whole Kinetik capture deck pulses, inviting an approach from any side. Capturing reveals the production loop. The next goals are total generation, supply gathering, standing on upgrade squares, building security equipment, and dawn. Producing at least 120 lifetime energy and surviving one night opens a success panel; players may continue the settlement afterward. Loss offers an immediate fresh run. Pause includes a confirmed restart flow.

The first screen offers one clear start action and a short visual lure → build → survive explanation. HUD tracks Raya, upgraded shelter health, battery, bait, scrap, phase countdown, objectives, moving captive count, power, wall health, and current construction. Only the focused square or active job opens the construction HUD. Keyboard and touch share gameplay actions. The touch direction pad supports simultaneous buttons for diagonals. Optional procedural tones start muted. Help, pause, and restart are available in-game.

There is no persistence in this prototype. Page reload or closure discards progress. Hidden tabs and unfocused windows pause; explicit resume is required. No simulation or generation occurs during pause, hiding, or closure. This is a compact complete single-session survival loop, intended for mobile browsers and desktop itch.io embedding.

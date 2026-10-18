import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, HOME, CAGE, BUILDINGS, COSTS, UPGRADE_ZONES, createState, step, useBait, interact, getContext, getUpgradeInfo, repairShelter, toggleGenerator, getObjective } from '../src/engine.js';

function tick(state, seconds, input = {}) {
  for (let frame = 0; frame < Math.round(seconds * 60); frame++) step(state, 1 / 60, input);
}
const at = (body, position) => Object.assign(body, { x: position.x, y: position.y });
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} should equal ${b}`);
function quiet() { const state = createState({ seed: 73 }); state.zombies = []; return state; }
function makeZombie(state, mode, position) {
  const z = { ...createState().zombies[0], id: state.nextId++, mode, lureLeft: 25, captureProgress: 0, attackCooldown: 0, hp: 60, ...position };
  state.zombies.push(z); return z;
}
function captive(state, angle = 0) {
  return makeZombie(state, 'captive', { angle, x: CAGE.x + Math.cos(angle) * 36, y: CAGE.y + Math.sin(angle) * 36 * .8 });
}
const zone = kind => UPGRADE_ZONES.find(item => item.kind === kind);
const leaveZone = state => at(state.player, { x: 1400, y: 1000 });
function finishUpgrade(state, kind) {
  const info = getUpgradeInfo(state, kind);
  leaveZone(state); step(state, 1 / 60);
  at(state.player, zone(kind)); tick(state, info.duration + .1);
  assert.equal(state.construction, null, `${kind} construction should finish`);
}

test('seeded games and identical inputs are deterministic and independent', () => {
  const a = createState({ seed: 73 }), b = createState({ seed: 73 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.zombies, createState({ seed: 74 }).zombies);
  tick(a, 2, { x: 1 }); tick(b, 2, { x: 1 }); assert.deepEqual(a, b);
  a.player.hp = 1; assert.equal(b.player.hp, 100);
});

test('walking normalizes diagonal speed and is consistent across frame rates', () => {
  const straight = quiet(), diagonal = quiet(), slow = quiet(), fast = quiet();
  const origin = { ...straight.player };
  tick(straight, .5, { x: 1 }); tick(diagonal, .5, { x: 1, y: -1 });
  near(Math.hypot(straight.player.x - origin.x, straight.player.y - origin.y), 85);
  near(Math.hypot(diagonal.player.x - origin.x, diagonal.player.y - origin.y), 85);
  for (let i = 0; i < 30; i++) step(slow, 1 / 30, { x: 1 });
  tick(fast, 1, { x: 1 }); near(slow.player.x, fast.player.x); near(slow.time, fast.time);
});

test('world borders and abandoned buildings block walking', () => {
  const s = quiet(); at(s.player, { x: WORLD.width - 36, y: WORLD.height - 36 });
  tick(s, 2, { x: 1, y: 1 });
  assert.ok(s.player.x < WORLD.width && s.player.y < WORLD.height);
  at(s.player, { x: 36, y: 36 }); tick(s, 2, { x: -1, y: -1 });
  assert.ok(s.player.x > 0 && s.player.y > 0);
  const building = BUILDINGS[0]; at(s.player, { x: building.x - 30, y: building.y + building.h / 2 });
  tick(s, .5, { x: 1 }); assert.ok(s.player.x < building.x, 'Cannot walk into a building');
});

test('invalid elapsed time cannot move, generate energy, or advance timers', () => {
  const s = quiet(); captive(s); const before = structuredClone(s);
  for (const dt of [0, -1, NaN, Infinity, undefined]) step(s, dt, { x: 1 });
  assert.deepEqual(s, before);
  step(s, 100); assert.ok(s.time > 0 && s.time <= .25 + 1e-9);
});

test('bait requires an available wild zombie and consumes exactly one successful use', () => {
  const s = quiet(), initial = s.bait;
  assert.equal(useBait(s), false); assert.equal(s.bait, initial);
  const far = makeZombie(s, 'wild', { x: s.player.x + 400, y: s.player.y });
  assert.equal(useBait(s), false); assert.equal(s.bait, initial);
  const close = makeZombie(s, 'wild', { x: s.player.x + 130, y: s.player.y });
  assert.equal(useBait(s), true); assert.equal(s.bait, initial - 1);
  assert.equal(close.mode, 'lured'); assert.equal(far.mode, 'wild');
  assert.equal(useBait(s), false); assert.equal(s.bait, initial - 1);
  s.bait = 0; far.x = s.player.x + 100; assert.equal(useBait(s), false); assert.equal(s.bait, 0);
});

test('lured zombies physically approach the woman without instant capture', () => {
  const s = quiet(); at(s.player, { x: 1100, y: 1040 });
  const z = makeZombie(s, 'wild', { x: 1250, y: 1040 });
  useBait(s); const before = Math.hypot(z.x - s.player.x, z.y - s.player.y);
  tick(s, .5); assert.ok(Math.hypot(z.x - s.player.x, z.y - s.player.y) < before);
  assert.equal(z.mode, 'lured');
  at(s.player, CAGE); tick(s, .1);
  assert.equal(z.mode, 'lured', 'Woman reaching the cage cannot teleport a distant zombie inside');
  assert.equal(s.captiveCount, 0);
});

test('zombies physically cross all four generator boundaries and capture within its area', () => {
  const approaches = [
    { x: -1, y: 0, half: CAGE.width / 2 }, { x: 1, y: 0, half: CAGE.width / 2 },
    { x: 0, y: -1, half: CAGE.height / 2 }, { x: 0, y: 1, half: CAGE.height / 2 },
  ];
  for (const side of approaches) {
    const s = quiet(); at(s.player, CAGE);
    const z = makeZombie(s, 'lured', { x: CAGE.x + side.x * (side.half + 25), y: CAGE.y + side.y * (side.half + 25) });
    tick(s, .1); assert.equal(z.mode, 'lured'); assert.equal(s.captiveCount, 0);
    tick(s, 1.1); assert.equal(z.mode, 'captive', `capture from side ${side.x},${side.y}`);
    assert.equal(s.captiveCount, 1);
    assert.ok(Math.abs(z.x - CAGE.x) < CAGE.width / 2 && Math.abs(z.y - CAGE.y) < CAGE.height / 2);
  }
  const s = quiet(); leaveZone(s); const z = makeZombie(s, 'lured', CAGE);
  tick(s, .4); assert.equal(z.mode, 'lured');
  tick(s, .45); assert.equal(z.mode, 'captive', 'woman need not remain near the generator');
});

test('leaving the generator interrupts capture and full capacity rejects additional captives', () => {
  const s = quiet(), z = makeZombie(s, 'lured', CAGE);
  tick(s, .4); at(z, { x: 1250, y: 1000 }); tick(s, .1); at(z, CAGE);
  tick(s, .45); assert.equal(z.mode, 'lured', 'Capture progress must restart after leaving');
  tick(s, .4); assert.equal(z.mode, 'captive');
  const second = makeZombie(s, 'lured', CAGE); tick(s, .85); assert.equal(second.mode, 'captive');
  const overflow = makeZombie(s, 'lured', CAGE); tick(s, 1);
  assert.equal(s.captiveCount, s.cage.capacity); assert.equal(overflow.mode, 'lured');
});

test('expired bait releases the zombie and clears unfinished capture', () => {
  const s = quiet(), z = makeZombie(s, 'lured', { x: 1700, y: 1050 });
  z.lureLeft = .1; z.captureProgress = .3; tick(s, .2);
  assert.equal(z.mode, 'wild'); assert.equal(z.captureProgress, 0); assert.equal(s.captiveCount, 0);
});

test('electricity follows actual captive travel and remains zero while generator rests', () => {
  const s = quiet(), z = captive(s); const start = { ...z };
  step(s, 1 / 60);
  const traveled = Math.hypot(z.x - start.x, z.y - start.y);
  assert.ok(traveled > 0); near(s.totalGenerated, traveled * .035); near(s.battery, s.totalGenerated);
  assert.equal(s.movingCaptives, 1); assert.ok(s.powerRate > 0);
  at(s.player, HOME); assert.equal(toggleGenerator(s), true);
  const position = { x: z.x, y: z.y }, generated = s.totalGenerated; tick(s, 2);
  assert.deepEqual({ x: z.x, y: z.y }, position); assert.equal(s.totalGenerated, generated);
  assert.equal(s.powerRate, 0); assert.equal(s.movingCaptives, 0); assert.equal(z.moving, false);
  assert.equal(toggleGenerator(s), true); tick(s, .2); assert.ok(s.totalGenerated > generated);
});

test('wild and lured movement cannot generate electricity', () => {
  const s = quiet(); makeZombie(s, 'wild', { x: 1400, y: 1040 }); makeZombie(s, 'lured', { x: 1300, y: 1040 });
  tick(s, 2); assert.equal(s.totalGenerated, 0); assert.equal(s.battery, 0); assert.equal(s.powerRate, 0);
});

test('battery capacity limits storage while lifetime generation continues counting', () => {
  const s = quiet(); captive(s); s.battery = s.batteryCapacity - .01;
  tick(s, 2); assert.equal(s.battery, s.batteryCapacity); assert.ok(s.totalGenerated > .01);
  const previous = s.totalGenerated; tick(s, 1);
  assert.equal(s.battery, s.batteryCapacity); assert.ok(s.totalGenerated > previous); assert.equal(s.spentEnergy, 0);
});

test('turrets require battery power, spend their shot cost, and preserve lured zombies', () => {
  const s = quiet(); s.scrap = 100; finishUpgrade(s, 'turret'); at(s.player, HOME);
  const turret = s.turrets[0], lured = makeZombie(s, 'lured', { x: turret.x + 100, y: turret.y });
  const hostile = makeZombie(s, 'hostile', { x: turret.x + 180, y: turret.y });
  step(s, 1 / 60); assert.equal(hostile.hp, 60); assert.equal(s.spentEnergy, 0);
  s.battery = COSTS.shot; step(s, 1 / 60);
  assert.ok(hostile.hp < 60); assert.equal(lured.hp, 60); assert.equal(s.battery, 0); assert.equal(s.spentEnergy, COSTS.shot);
  const hp = hostile.hp; tick(s, 1.3); assert.equal(hostile.hp, hp); assert.equal(s.spentEnergy, COSTS.shot);
});

test('below-cap generation and turret consumption balance the energy ledger', () => {
  const s = quiet(); s.scrap = 100; finishUpgrade(s, 'turret'); captive(s); at(s.player, HOME);
  makeZombie(s, 'hostile', { x: 1400, y: 940 }); const initial = s.battery = 20;
  tick(s, 2); assert.ok(s.spentEnergy > 0); near(s.battery + s.spentEnergy, initial + s.totalGenerated);
});

test('ground zones automatically begin paid upgrades and Kinetik level two takes ten real seconds', () => {
  const s = quiet(); s.scrap = 100; at(s.player, HOME); tick(s, .5);
  assert.equal(s.construction, null); assert.equal(s.scrap, 100);
  const cost = getUpgradeInfo(s, 'cage').cost, capacity = s.cage.capacity;
  assert.equal(getUpgradeInfo(s, 'cage').duration, 10);
  at(s.player, zone('cage')); tick(s, 9.9);
  assert.equal(s.construction.kind, 'cage'); assert.equal(s.scrap, 100 - cost);
  assert.equal(s.cage.capacity, capacity); assert.equal(s.cage.level, 0);
  tick(s, .2); assert.equal(s.cage.level, 1); assert.equal(s.cage.capacity, capacity + 2);
  assert.equal(s.construction, null); assert.equal(s.scrap, 100 - cost);
  assert.ok(getUpgradeInfo(s, 'cage').duration > 10, 'level three requires longer presence');
  tick(s, 1); assert.equal(s.construction, null); assert.equal(s.scrap, 100 - cost, 'holding a completed zone cannot buy another level');
  leaveZone(s); step(s, 1 / 60); at(s.player, zone('cage')); step(s, 1 / 60);
  assert.equal(s.construction.kind, 'cage'); assert.ok(s.scrap < 100 - cost);
});

test('leaving a zone pauses its progress and locks other zones until paid work finishes', () => {
  const s = quiet(); s.scrap = 100; at(s.player, zone('cage')); tick(s, 2);
  const progress = s.construction.progress, paid = s.scrap;
  leaveZone(s); tick(s, 1); near(s.construction.progress, progress);
  at(s.player, zone('walls')); tick(s, 1);
  assert.equal(s.construction.kind, 'cage'); near(s.construction.progress, progress); assert.equal(s.scrap, paid); assert.equal(s.walls.level, 0);
  at(s.player, zone('cage')); tick(s, 1); assert.ok(s.construction.progress > progress); assert.equal(s.scrap, paid);
  tick(s, 8); assert.equal(s.cage.level, 1); assert.equal(s.construction, null);
});

test('each ground zone rejects insufficient funds without partial charges or free progress', () => {
  for (const kind of ['cage', 'shelter', 'walls', 'turret']) {
    const s = quiet(), info = getUpgradeInfo(s, kind); s.scrap = info.cost - 1; at(s.player, zone(kind));
    tick(s, 1); assert.equal(s.construction, null); assert.equal(s.scrap, info.cost - 1); assert.equal(getUpgradeInfo(s, kind).level, info.level);
    s.scrap = info.cost; tick(s, .1); assert.equal(s.construction.kind, kind); assert.equal(s.scrap, 0);
  }
});

test('construction freezes during pause, hidden tabs, invalid elapsed time, downing, and loss', () => {
  const s = quiet(); s.scrap = 100; at(s.player, zone('cage')); tick(s, 1);
  const before = structuredClone(s);
  for (const dt of [0, -1, NaN, Infinity, undefined]) step(s, dt);
  tick(s, 1, { paused: true }); tick(s, 1, { hidden: true });
  assert.deepEqual(s, before);
  for (const flag of ['paused', 'hidden']) { s[flag] = true; const snapshot = structuredClone(s); tick(s, 1); assert.deepEqual(s, snapshot); s[flag] = false; }
  const progress = s.construction.progress; s.player.hp = 0; step(s, 1 / 60); tick(s, 1);
  near(s.construction.progress, progress);
  s.lost = true; const lost = structuredClone(s); tick(s, 1); assert.deepEqual(s, lost);
});

test('all four upgrade paths enforce maximum levels and charge only successful levels', () => {
  for (const kind of ['cage', 'shelter', 'walls', 'turret']) {
    const s = quiet(); s.scrap = 1000; let expected = s.scrap;
    while (!getUpgradeInfo(s, kind).maxed) {
      expected -= getUpgradeInfo(s, kind).cost;
      finishUpgrade(s, kind); s.phaseTime = 0;
      assert.equal(s.scrap, expected);
    }
    const info = getUpgradeInfo(s, kind); assert.equal(info.level, info.maxLevel);
    leaveZone(s); step(s, 1 / 60); at(s.player, zone(kind)); tick(s, 1);
    assert.equal(s.construction, null); assert.equal(s.scrap, expected);
    if (kind === 'cage') assert.equal(s.cage.capacity, 6);
    if (kind === 'turret') assert.equal(s.turrets.length, 3);
  }
});

test('turret purchase spends resources immediately but cannot defend before construction completes', () => {
  const s = quiet(); s.scrap = 100; s.battery = 30; at(s.player, zone('turret'));
  const info = getUpgradeInfo(s, 'turret'); step(s, 1 / 60);
  assert.equal(s.scrap, 100 - info.cost); assert.equal(s.turrets.length, 0);
  tick(s, Math.max(0, info.duration - .1)); assert.equal(s.turrets.length, 0); assert.equal(s.spentEnergy, 0);
  tick(s, .2); assert.equal(s.turrets.length, 1); assert.equal(s.scrap, 100 - info.cost);
});

test('shelter upgrades raise real HP limits and initially absent walls absorb attacks before shelter HP', () => {
  const bare = quiet(); assert.equal(bare.walls.level, 0); assert.equal(bare.walls.hp, 0);
  leaveZone(bare); makeZombie(bare, 'hostile', HOME); const bareHp = bare.shelter.hp; step(bare, 1 / 60);
  assert.ok(bare.shelter.hp < bareHp);
  const s = quiet(); s.scrap = 1000; const initialMax = s.shelter.maxHp;
  finishUpgrade(s, 'shelter'); assert.ok(s.shelter.maxHp > initialMax); assert.ok(s.shelter.hp > initialMax);
  finishUpgrade(s, 'walls'); assert.ok(s.walls.hp > 0); assert.equal(s.walls.hp, s.walls.maxHp);
  leaveZone(s); const hp = s.shelter.hp, wallHp = s.walls.hp; const attacker = makeZombie(s, 'hostile', HOME); step(s, 1 / 60);
  assert.equal(s.shelter.hp, hp); assert.ok(s.walls.hp < wallHp);
  s.walls.hp = 2; attacker.attackCooldown = 0; step(s, 1 / 60);
  assert.equal(s.walls.hp, 0); assert.ok(s.shelter.hp < hp, 'damage beyond remaining wall HP reaches shelter');
});

test('repairs never overfill shelter or charge for unavailable repairs', () => {
  const s = quiet(); at(s.player, HOME); s.scrap = 20;
  assert.equal(repairShelter(s), false); assert.equal(s.scrap, 20);
  s.shelter.hp -= 1; assert.equal(repairShelter(s), true); assert.equal(s.shelter.hp, s.shelter.maxHp); assert.equal(s.scrap, 20 - COSTS.repair);
  s.shelter.hp = 100; s.scrap = 0; assert.equal(repairShelter(s), false); assert.equal(s.shelter.hp, 100); assert.equal(s.scrap, 0);
  s.scrap = 100; finishUpgrade(s, 'shelter'); at(s.player, HOME);
  s.shelter.hp = s.shelter.maxHp - 1; const paid = s.scrap;
  assert.equal(repairShelter(s), true); assert.equal(s.shelter.hp, s.shelter.maxHp); assert.equal(s.scrap, paid - COSTS.repair);
  finishUpgrade(s, 'walls'); at(s.player, HOME); s.walls.hp = s.walls.maxHp - 1;
  const wallPaid = s.scrap; assert.equal(repairShelter(s), true); assert.equal(s.walls.hp, s.walls.maxHp); assert.equal(s.scrap, wallPaid - COSTS.repair);
  assert.equal(repairShelter(s), false); assert.equal(s.scrap, wallPaid - COSTS.repair);
});

test('supply crates require proximity and cooldown before resources can be collected again', () => {
  const s = quiet(); at(s.player, { x: 100, y: 100 }); assert.equal(interact(s), false);
  const node = s.nodes[0]; at(s.player, node); assert.equal(getContext(s).type, 'scavenge');
  const before = { bait: s.bait, scrap: s.scrap }; assert.equal(interact(s), true);
  assert.equal(s.bait, before.bait + 2); assert.equal(s.scrap, before.scrap + 5);
  assert.equal(interact(s), false); assert.equal(s.scrap, before.scrap + 5);
  s.time = node.readyAt; assert.equal(interact(s), true); assert.equal(s.scrap, before.scrap + 10);
});

test('nightfall spawns attackers and dawn records survival while retaining captives', () => {
  const s = quiet(), z = captive(s); s.phaseTime = 89.95; tick(s, .1);
  assert.equal(s.night, true); assert.ok(s.zombies.some(item => item.mode === 'hostile'));
  assert.equal(s.nightCount, 1); s.phaseTime = 49.95; tick(s, .1);
  assert.equal(s.night, false); assert.equal(s.survivedNights, 1); assert.equal(s.day, 2);
  assert.ok(s.zombies.includes(z)); assert.ok(s.zombies.every(item => item.mode !== 'hostile'));
});

test('destroyed shelter stops simulation and spending actions', () => {
  const s = quiet(); at(s.player, HOME); s.shelter.hp = 1; s.scrap = 100;
  makeZombie(s, 'hostile', HOME); step(s, 1 / 60);
  assert.equal(s.lost, true); assert.equal(s.shelter.hp, 0);
  const before = structuredClone(s); tick(s, 1); assert.deepEqual(s, before);
  assert.equal(repairShelter(s), false); assert.equal(useBait(s), false);
  assert.equal(s.scrap, 100);
});

test('downed woman recovers at shelter without losing existing captives', () => {
  const s = quiet(), z = captive(s); s.player.hp = 0; at(s.player, { x: 1400, y: 1000 }); step(s, 1 / 60);
  assert.ok(s.player.downTimer > 0); const position = { x: s.player.x, y: s.player.y };
  assert.equal(useBait(s), false); tick(s, 1, { x: 1 });
  assert.deepEqual({ x: s.player.x, y: s.player.y }, position);
  tick(s, 2.2); assert.ok(s.player.downTimer <= 0); assert.ok(s.player.hp > 0);
  assert.equal(s.player.x, 1120); assert.equal(s.player.y, 940); assert.ok(s.zombies.includes(z)); assert.equal(s.lost, false);
});

test('winning requires generation plus a survived night and permits continued play', () => {
  const s = quiet(); s.totalGenerated = 120; step(s, 1 / 60); assert.equal(s.won, false);
  s.survivedNights = 1; step(s, 1 / 60); assert.equal(s.won, true); assert.match(getObjective(s), /terus/);
  const time = s.time, x = s.player.x; tick(s, .5, { x: 1 }); assert.ok(s.time > time); assert.ok(s.player.x > x);
  const unpowered = quiet(); unpowered.survivedNights = 1; step(unpowered, 1 / 60); assert.equal(unpowered.won, false);
});

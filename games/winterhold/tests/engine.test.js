import test from 'node:test';
import assert from 'node:assert/strict';
import { WORLD, BUILDINGS, createGame, stepGame, interact, build, train, nearestInteraction, getBuildInfo, eat, repair } from '../src/engine.js';

const tick = (state, seconds, input = {}) => {
  for (let index = 0; index < Math.round(seconds * 30); index++) stepGame(state, 1 / 30, input);
};
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-7, message || `${actual} differs from ${expected}`);
const rich = state => { state.resources = { wood: 1000, stone: 1000, food: 1000 }; return state; };
const at = (state, target) => { state.player.x = target.x; state.player.y = target.y; };
const walkTo = (state, target) => {
  for (let steps = 0; Math.hypot(target.x - state.player.x, target.y - state.player.y) > 0.01; steps++) {
    assert.ok(steps < 1000 && state.status === 'playing', 'Walking must reach the target while alive');
    const x = target.x - state.player.x, y = target.y - state.player.y;
    const distance = Math.hypot(x, y);
    const divisor = Math.max(distance, 235 / 30);
    stepGame(state, 1 / 30, { x: x / divisor, y: y / divisor });
  }
};

test('seeded worlds and identical actions are deterministic and independent', () => {
  const first = createGame({ seed: 73 });
  const second = createGame({ seed: 73 });
  assert.deepEqual(first, second);
  assert.notDeepEqual(first.nodes, createGame({ seed: 74 }).nodes);
  tick(first, 2, { x: 1 }); tick(second, 2, { x: 1 });
  assert.deepEqual(first, second);
  first.resources.wood = 0;
  assert.equal(second.resources.wood, 24);
});

test('movement normalizes diagonals, stays within the world, and agrees across frame rates', () => {
  const straight = createGame(), diagonal = createGame();
  const start = { ...straight.player };
  tick(straight, 1, { x: 1 }); tick(diagonal, 1, { x: 1, y: 1 });
  close(Math.hypot(straight.player.x - start.x, straight.player.y - start.y), 235);
  close(Math.hypot(diagonal.player.x - start.x, diagonal.player.y - start.y), 235);
  const fast = createGame(), slow = createGame();
  for (let i = 0; i < 120; i++) stepGame(fast, 1 / 60, { x: -1, y: -1 });
  for (let i = 0; i < 60; i++) stepGame(slow, 1 / 30, { x: -1, y: -1 });
  close(fast.player.x, slow.player.x); close(fast.player.y, slow.player.y);
  close(fast.elapsed, slow.elapsed);
  at(straight, { x: WORLD.width - 1, y: WORLD.height - 1 });
  tick(straight, 1, { x: 1, y: 1 });
  assert.ok(straight.player.x < WORLD.width && straight.player.y < WORLD.height);
  at(straight, { x: 1, y: 1 }); tick(straight, 1, { x: -1, y: -1 });
  assert.ok(straight.player.x > 0 && straight.player.y > 0);
});

test('invalid deltas do nothing and a stalled frame advances at most a quarter second', () => {
  const state = createGame(), before = structuredClone(state);
  for (const dt of [0, -1, NaN, Infinity, -Infinity, undefined]) stepGame(state, dt, { x: 1 });
  assert.deepEqual(state, before);
  stepGame(state, 100);
  assert.ok(state.elapsed > 0 && state.elapsed <= 0.25);
});

test('gathering requires proximity, respects cooldown and conserves depleted node contents', () => {
  const state = createGame();
  at(state, { x: 1300, y: 1000 });
  assert.equal(nearestInteraction(state), null);
  assert.equal(interact(state), false);
  const node = state.nodes[0]; at(state, node);
  const before = state.resources[node.type];
  assert.equal(interact(state), true);
  assert.equal(state.resources[node.type], before + 8);
  assert.equal(node.amount, 16);
  assert.equal(interact(state), false);
  for (let i = 0; i < 2; i++) { tick(state, 0.7); assert.equal(interact(state), true); }
  assert.equal(node.amount, 0);
  assert.equal(state.resources[node.type], before + 24);
  assert.notEqual(nearestInteraction(state)?.id, node.id);
  assert.ok(state.nodes.every(item => item.amount >= 0));
});

test('all building costs, proximity and per-building limits are enforced', () => {
  for (const [kind, spec] of Object.entries(BUILDINGS)) {
    const state = rich(createGame());
    at(state, { x: 100, y: 100 });
    const before = { ...state.resources };
    assert.equal(getBuildInfo(state, kind).available, false);
    assert.equal(build(state, kind), false);
    assert.deepEqual(state.resources, before);
    at(state, state.base);
    for (let count = 0; count < spec.max; count++) {
      const resources = { ...state.resources };
      assert.equal(build(state, kind), true);
      for (const resource of Object.keys(resources)) assert.equal(state.resources[resource], resources[resource] - spec[resource]);
    }
    const resources = { ...state.resources };
    assert.equal(build(state, kind), false);
    assert.deepEqual(state.resources, resources);
    assert.equal(state.structures.filter(item => item.kind === kind).length, spec.max);
    assert.equal(getBuildInfo(state, kind).reason, 'Fully built');
  }
  const poor = createGame(); poor.resources = { wood: 0, stone: 0, food: 0 };
  for (const kind of Object.keys(BUILDINGS)) assert.equal(build(poor, kind), false);
  assert.equal(build(poor, 'castle'), false);
  assert.deepEqual(poor.resources, { wood: 0, stone: 0, food: 0 });
});

test('recruitment consumes camp population and food, requires beds, and shelters add beds', () => {
  const state = createGame(), camp = state.camps[0];
  const before = state.resources.food;
  at(state, camp);
  assert.equal(interact(state), true); assert.equal(interact(state), true);
  assert.equal(state.survivors, state.capacity);
  assert.equal(state.resources.food, before - 8); assert.equal(camp.people, 1);
  assert.equal(interact(state), false);
  at(state, state.base); assert.equal(build(state, 'shelter'), true);
  assert.equal(state.capacity, 8);
  at(state, camp); state.resources.food = 3;
  assert.equal(interact(state), false); assert.equal(camp.people, 1);
  state.resources.food = 4;
  assert.equal(interact(state), true); assert.equal(camp.people, 0);
  assert.equal(state.resources.food, 0); assert.equal(state.survivors, 5);
});

test('guards require a yard, settlers, proximity, wood and food without overspending', () => {
  const state = rich(createGame());
  assert.equal(train(state), false);
  assert.equal(build(state, 'barracks'), true);
  at(state, { x: 100, y: 100 }); assert.equal(train(state), false);
  at(state, state.base);
  for (const resource of ['wood', 'food']) {
    const saved = state.resources[resource]; state.resources[resource] = 4;
    assert.equal(train(state), false); state.resources[resource] = saved;
  }
  const before = { ...state.resources };
  assert.equal(train(state), true); assert.equal(train(state), true);
  assert.equal(train(state), false);
  assert.equal(state.trained, 2); assert.equal(state.troops.length, 2);
  assert.equal(state.resources.wood, before.wood - 10);
  assert.equal(state.resources.food, before.food - 10);
  assert.equal(state.resources.stone, before.stone);
});

test('a fallen guard frees one bed once and a recruited replacement gets a new unique ID', () => {
  const state = rich(createGame()), camp = state.camps[0];
  at(state, camp);
  assert.equal(interact(state), true); assert.equal(interact(state), true);
  assert.equal(state.survivors, state.capacity);
  at(state, state.base); assert.equal(build(state, 'barracks'), true);
  for (let i = 0; i < 4; i++) assert.equal(train(state), true);
  const originalIds = state.troops.map(guard => guard.id);
  const fallenId = state.troops[1].id;
  state.troops[1].hp = 0;
  tick(state, 1 / 30);
  assert.equal(state.survivors, 3);
  assert.equal(state.trained, 3);
  assert.equal(state.troops.length, 3);
  assert.ok(!state.troops.some(guard => guard.id === fallenId));
  tick(state, 1);
  assert.equal(state.survivors, 3, 'A removed guard must not consume another settler');
  assert.equal(state.trained, state.troops.length);
  assert.equal(train(state), false, 'All remaining settlers are already trained');
  at(state, camp);
  const food = state.resources.food;
  assert.equal(interact(state), true);
  assert.equal(state.survivors, state.capacity);
  assert.equal(state.resources.food, food - 4);
  assert.equal(camp.people, 0);
  at(state, state.base); assert.equal(train(state), true);
  const replacement = state.troops.at(-1);
  assert.ok(!originalIds.includes(replacement.id), 'Replacement IDs must never recycle a fallen or living ID');
  assert.ok(Number(replacement.id.split('-')[1]) > Math.max(...originalIds.map(id => Number(id.split('-')[1]))));
  assert.equal(new Set(state.troops.map(guard => guard.id)).size, state.troops.length);
  assert.equal(state.trained, 4);
});

test('eating pays for bounded healing and never wastes food at full health or when unaffordable', () => {
  const state = createGame();
  const fullHealth = structuredClone(state);
  assert.equal(eat(state), false); assert.deepEqual(state, fullHealth);
  state.player.hp = 30; state.resources.food = 8;
  assert.equal(eat(state), true);
  assert.equal(state.player.hp, 70); assert.equal(state.resources.food, 4);
  assert.equal(eat(state), true);
  assert.equal(state.player.hp, state.player.maxHp); assert.equal(state.resources.food, 0);
  state.player.hp = 20; state.resources.food = 3;
  const unaffordable = structuredClone(state);
  assert.equal(eat(state), false); assert.deepEqual(state, unaffordable);
});

test('repairs require proximity and wood, cap healing, and never spend wood on a healthy hearth', () => {
  const state = createGame();
  assert.equal(build(state, 'barricade'), true);
  const fullHealth = structuredClone(state);
  assert.equal(repair(state), false); assert.deepEqual(state, fullHealth);
  state.base.hp = 200; state.resources.wood = 16;
  at(state, { x: 100, y: 100 });
  const distant = structuredClone(state);
  assert.equal(repair(state), false); assert.deepEqual(state, distant);
  at(state, state.base);
  assert.equal(repair(state), true);
  assert.equal(state.base.hp, 265); assert.equal(state.resources.wood, 8);
  state.base.hp = state.base.maxHp - 10;
  assert.equal(repair(state), true);
  assert.equal(state.base.hp, state.base.maxHp); assert.equal(state.resources.wood, 0);
  state.base.hp = 200; state.resources.wood = 7;
  const unaffordable = structuredClone(state);
  assert.equal(repair(state), false); assert.deepEqual(state, unaffordable);
});

test('nearby threats hurt the player and raiders can damage an undefended hearth', () => {
  const playerState = createGame(), wolf = playerState.enemies[0];
  at(playerState, { x: 700, y: 700 }); wolf.x = 700; wolf.y = 700;
  tick(playerState, 1 / 30);
  assert.ok(playerState.player.hp < 100);
  assert.ok(wolf.hp < wolf.maxHp, 'The keeper automatically fights a nearby threat');
  const baseState = createGame(), raider = baseState.enemies[0];
  at(baseState, { x: 100, y: 100 });
  Object.assign(raider, { raid: true, x: baseState.base.x + 60, y: baseState.base.y });
  tick(baseState, 1 / 30);
  assert.ok(baseState.base.hp < baseState.base.maxHp);
});

test('trained guards and watchtowers attack automatically while the player is away', () => {
  for (const defense of ['guard', 'watchtower']) {
    const state = rich(createGame());
    if (defense === 'guard') { build(state, 'barracks'); train(state); }
    else build(state, 'watchtower');
    at(state, { x: 100, y: 100 });
    const target = state.enemies[0];
    Object.assign(target, { raid: true, x: state.base.x + 80, y: state.base.y + 80, hp: 200, maxHp: 200 });
    tick(state, 3);
    assert.ok(target.hp < 200, `${defense} must attack without player input`);
  }
});

// A durable, stationary raider isolates autonomous defense from keeper combat,
// wandering wildlife, new raids, and enemy deaths.
const refugeDefense = () => {
  const state = createGame();
  at(state, { x: 100, y: 100 });
  const target = state.enemies[0];
  Object.assign(target, { kind: 'raider', raid: true, x: state.base.x + 60, y: state.base.y, hp: 1000, maxHp: 1000 });
  state.enemies = [target];
  return { state, target };
};

test('untrained settlers defend the hearth automatically while the keeper is away', () => {
  const { state, target } = refugeDefense();
  assert.equal(state.trained, 0);
  assert.equal(state.troops.length, 0);
  tick(state, 1 / 30);
  assert.ok(target.hp < target.maxHp, 'The initial untrained settlers must fight without a yard or keeper nearby');
  assert.equal(state.player.hp, state.player.maxHp);
  const afterFirstVolley = target.hp;
  tick(state, 0.5);
  assert.equal(target.hp, afterFirstVolley, 'Settlers must wait between attacks');
  tick(state, 2);
  assert.ok(target.hp < afterFirstVolley, 'Settlers resume attacking when their cooldown expires');
});

test('untrained settlers need both personal reach and a threat inside the refuge', () => {
  for (const boundary of ['personal reach', 'refuge perimeter']) {
    const { state, target } = refugeDefense();
    // Keep one defender so another settler cannot mask either range check.
    state.settlers = state.settlers.slice(0, 1);
    state.survivors = 1;
    const settler = state.settlers[0];
    if (boundary === 'personal reach') {
      Object.assign(settler, { x: state.base.x - 200, y: state.base.y });
      Object.assign(target, { x: state.base.x + 60, y: state.base.y });
    } else {
      Object.assign(settler, { x: state.base.x + 150, y: state.base.y });
      Object.assign(target, { x: state.base.x + 240, y: state.base.y });
    }
    tick(state, 1 / 30);
    assert.equal(target.hp, target.maxHp, `No attack outside ${boundary}`);
    Object.assign(settler, { x: state.base.x, y: state.base.y });
    Object.assign(target, { x: state.base.x + 60, y: state.base.y });
    tick(state, 1 / 30);
    assert.ok(target.hp < target.maxHp, 'The same defender attacks once the threat is in both ranges');
  }
});

test('recruitment adds civilian defenders and training transfers them into stronger guards', () => {
  const state = rich(createGame());
  const initialIds = state.settlers.map(settler => settler.id);
  assert.equal(state.settlers.length, state.survivors - state.trained);
  at(state, state.camps[0]);
  assert.equal(interact(state), true);
  assert.equal(state.settlers.length, 3);
  assert.equal(new Set(state.settlers.map(settler => settler.id)).size, 3);
  assert.ok(state.settlers.some(settler => !initialIds.includes(settler.id)));
  at(state, state.base);
  assert.equal(build(state, 'barracks'), true);
  while (state.trained < state.survivors) assert.equal(train(state), true);
  assert.equal(state.settlers.length, 0, 'Trained settlers must stop contributing civilian attacks');

  at(state, { x: 100, y: 100 });
  const target = state.enemies[0];
  Object.assign(target, { kind: 'raider', raid: true, x: state.base.x + 60, y: state.base.y, hp: 1000, maxHp: 1000 });
  state.enemies = [target];
  for (const guard of state.troops) Object.assign(guard, { x: state.base.x + 600, y: state.base.y });
  tick(state, 1 / 30);
  assert.equal(target.hp, target.maxHp, 'Training cannot leave invisible civilian attacks behind when guards are out of reach');

  const civilians = refugeDefense();
  tick(civilians.state, 1 / 30);
  const civilianDamage = civilians.target.maxHp - civilians.target.hp;
  for (const guard of state.troops) Object.assign(guard, { x: state.base.x + 60, y: state.base.y });
  tick(state, 1 / 30);
  assert.ok((target.maxHp - target.hp) / state.troops.length > civilianDamage / civilians.state.survivors,
    'Each trained guard delivers a stronger attack than an untrained settler');
});

test('settler attack timing agrees across frame rates and freezes during pause or game end', () => {
  const fast = refugeDefense(), slow = refugeDefense();
  for (let i = 0; i < 120; i++) stepGame(fast.state, 1 / 60);
  for (let i = 0; i < 60; i++) stepGame(slow.state, 1 / 30);
  assert.ok(fast.target.hp < fast.target.maxHp);
  assert.equal(fast.target.hp, slow.target.hp);
  assert.deepEqual(fast.state.settlers, slow.state.settlers);
  for (const mode of ['paused', 'won', 'lost']) {
    const { state } = refugeDefense();
    tick(state, 1 / 30);
    if (mode === 'paused') state.paused = true; else state.status = mode;
    const before = structuredClone(state);
    tick(state, 2);
    assert.deepEqual(state, before, `Active settler attacks and cooldowns freeze when ${mode}`);
  }
});

test('winter starts once, spawns its finite horde, and an undefended refuge can lose', () => {
  const state = createGame({ winterAt: 10 });
  at(state, { x: 100, y: 100 });
  for (let i = 0; i < 3000 && state.status === 'playing'; i++) stepGame(state, 1 / 30);
  assert.equal(state.status, 'lost');
  assert.equal(state.wave.started, true);
  assert.ok(state.wave.spawned > 0 && state.wave.spawned <= state.wave.total);
  assert.equal(state.wave.total, 18);
  assert.ok(state.wave.remaining > 0);
  assert.equal(new Set(state.warnings).size, state.warnings.length);
});

test('paused and completed games reject time and every gameplay action without mutation', () => {
  for (const mode of ['paused', 'won', 'lost']) {
    const state = rich(createGame());
    if (mode === 'paused') state.paused = true; else state.status = mode;
    const before = structuredClone(state);
    stepGame(state, 0.2, { x: 1 });
    assert.equal(interact(state), false); assert.equal(build(state, 'shelter'), false);
    assert.equal(train(state), false); assert.equal(eat(state), false); assert.equal(repair(state), false);
    assert.deepEqual(state, before);
  }
});

test('a real gathering, building and recruitment route can survive the full winter', () => {
  const state = createGame({ seed: 4271 });
  // Travel and resource collection use the same actions as the browser. No
  // resources, health, enemies, timers or defenders are fabricated in this run.
  for (const [type, center, count] of [
    ['wood', { x: 1000, y: 1260 }, 5],
    ['stone', { x: 1610, y: 1210 }, 3],
    ['food', { x: 1120, y: 720 }, 3],
  ]) {
    const nodes = state.nodes.filter(node => node.type === type)
      .sort((a, b) => Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y)).slice(0, count);
    for (const node of nodes) {
      walkTo(state, node);
      while (node.amount > 0) {
        if (state.player.gatherCooldown > 0) tick(state, 0.7);
        assert.equal(interact(state), true);
      }
    }
  }
  walkTo(state, state.base);
  for (const kind of ['shelter', 'barracks', 'watchtower', 'watchtower', 'barricade']) assert.equal(build(state, kind), true);
  walkTo(state, state.camps[0]);
  for (let i = 0; i < 3; i++) assert.equal(interact(state), true);
  walkTo(state, state.base);
  for (let i = 0; i < 5; i++) assert.equal(train(state), true);
  assert.ok(state.elapsed < state.winterAt, 'Preparation fits within the actual countdown');
  for (let i = 0; i < 9000 && state.status === 'playing'; i++) {
    stepGame(state, 1 / 30);
    if (state.base.hp < state.base.maxHp - 65) repair(state);
    if (state.player.hp < 60) eat(state);
  }
  assert.equal(state.status, 'won');
  assert.equal(state.wave.spawned, state.wave.total);
  assert.equal(state.wave.remaining, 0);
  assert.ok(state.base.hp > 0 && state.player.hp > 0);
  assert.ok(Object.values(state.resources).every(amount => amount >= 0));
  const ended = structuredClone(state); tick(state, 5);
  assert.deepEqual(state, ended, 'Victory must remain complete when time continues');
});

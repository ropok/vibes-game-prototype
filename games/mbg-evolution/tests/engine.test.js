import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARENA, FORMS, FOODS, SAVE_VERSION, createState, step, act,
  canEvolve, evolve, serialize, restore,
} from '../src/engine.js';

const COSTS = [40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 150];
const SEED = 72519;
const copy = (value) => JSON.parse(JSON.stringify(value));

function advance(state, seconds) {
  while (seconds > 1e-9) {
    const delta = Math.min(seconds, 0.1);
    step(state, delta);
    seconds -= delta;
  }
}

function ready(state) {
  advance(state, 0.31);
}

// All progression helpers use the same public actions as the player.
function knockOut(state, id) {
  let target = state.foods.find((food) => food.id === id);
  let attempts = 0;
  while (target.status === 'alive') {
    ready(state);
    const result = act(state, id);
    assert.ok(['hit', 'knockout'].includes(result.type));
    assert.ok(++attempts <= 10, 'food must remain defeatable');
    target = state.foods.find((food) => food.id === id);
  }
  assert.equal(target.status, 'knocked');
  return target;
}

function collectOne(state) {
  let target = state.foods.find((food) => food.status !== 'absorbed');
  if (!target) {
    advance(state, 0.8);
    target = state.foods.find((food) => food.status === 'alive');
  }
  assert.ok(target, 'food must respawn');
  knockOut(state, target.id);
  ready(state);
  const before = state.energy;
  const previousForm = state.form;
  const result = act(state, target.id);
  assert.equal(result.type, 'absorb');
  const spent = FORMS.slice(previousForm, state.form).reduce((sum, form) => sum + form.threshold, 0);
  assert.equal(state.energy + spent - before, 10);
  return result;
}

function earn(state, amount) {
  for (let count = 0; count < amount / 10; count++) collectOne(state);
}

test('collection contains twelve distinct, complete forms in the required order', () => {
  assert.equal(FORMS.length, 12);
  assert.equal(new Set(FORMS.map((form) => form.name)).size, 12);
  assert.equal(FORMS[0].name, 'Ompreng Kosong');
  assert.match(FORMS[2].name, /Isi/);
  assert.ok(FORMS.findIndex((form) => /Beracun Pelangi/.test(form.name)) > 2);
  assert.ok(FORMS.findIndex((form) => form.name === 'SPPG') > 5);
  assert.equal(FORMS.at(-1).name, 'Kopdes');
  for (const [index, form] of FORMS.entries()) {
    assert.equal(form.id, index);
    for (const field of ['name', 'lore', 'dimensions', 'favorite', 'quirk']) {
      assert.equal(typeof form[field], 'string', `${form.name}: ${field}`);
      assert.ok(form[field].trim().length > 0, `${form.name}: empty ${field}`);
    }
  }
});

test('local evolution costs total exactly one hundred absorptions', () => {
  assert.deepEqual(FORMS.slice(0, -1).map((form) => form.threshold), COSTS);
  assert.equal(COSTS.reduce((sum, value) => sum + value, 0), 1000);
  assert.ok(FOODS.length >= 4);
  assert.ok(FOODS.every((food) => food.energy === 10 && food.hp >= 1));
});

test('a seeded fresh state is deterministic, empty and bounded', () => {
  const state = createState(SEED);
  assert.deepEqual(state, createState(SEED));
  assert.notDeepEqual(state.foods, createState(SEED + 1).foods);
  assert.equal(state.form, 0);
  assert.equal(state.energy, 0);
  assert.deepEqual(state.discovered, [0]);
  assert.equal(state.won, false);
  assert.equal(state.foods.length, 6);
  assert.equal(new Set(state.foods.map((food) => food.id)).size, 6);
});

test('striking a live food reduces health without awarding energy', () => {
  const state = createState(SEED);
  const target = state.foods[0];
  const hp = target.hp;
  assert.ok(['hit', 'knockout'].includes(act(state, target.id).type));
  assert.equal(target.hp, hp - 1);
  assert.equal(state.energy, 0);
  assert.equal(state.stats.hits, 1);
  assert.equal(state.stats.absorbed, 0);
});

test('knockout requires a later action to absorb and never expires', () => {
  const state = createState(SEED);
  const target = knockOut(state, state.foods[0].id);
  const snapshot = copy(target);
  advance(state, 60);
  assert.deepEqual(state.foods.find((food) => food.id === target.id), snapshot);
  assert.equal(state.energy, 0);
  assert.equal(act(state, target.id).type, 'absorb');
  assert.equal(state.energy, 10);
  assert.equal(state.stats.absorbed, 1);
});

test('accepted actions share a 300 ms cooldown across targets', () => {
  const state = createState(SEED);
  act(state, state.foods[0].id);
  const snapshot = copy(state);
  assert.equal(act(state, state.foods[1].id).type, 'blocked');
  assert.deepEqual(state, snapshot);
  advance(state, 0.28);
  assert.equal(act(state, state.foods[1].id).type, 'blocked');
  advance(state, 0.02);
  assert.notEqual(act(state, state.foods[1].id).type, 'blocked');
});

test('repeated actions in the same frame cannot duplicate hits or absorption', () => {
  const state = createState(SEED);
  const target = knockOut(state, state.foods[0].id);
  ready(state);
  assert.equal(act(state, target.id).type, 'absorb');
  const snapshot = copy(state);
  for (let repeat = 0; repeat < 30; repeat++) assert.equal(act(state, target.id).type, 'blocked');
  assert.deepEqual(state, snapshot);
  ready(state);
  assert.equal(act(state, target.id).type, 'blocked');
  assert.equal(state.energy, 10);
});

test('an unknown target does not mutate state or consume the next action', () => {
  const state = createState(SEED);
  const snapshot = copy(state);
  assert.equal(act(state, -987).type, 'blocked');
  assert.deepEqual(state, snapshot);
  assert.notEqual(act(state, state.foods[0].id).type, 'blocked');
});

test('absorbed food respawns once and population stays bounded', () => {
  const state = createState(SEED);
  const id = state.foods[0].id;
  collectOne(state);
  assert.equal(state.foods.find((food) => food.id === id).status, 'absorbed');
  advance(state, 0.8);
  assert.equal(state.foods.find((food) => food.id === id).status, 'alive');
  for (let count = 0; count < 25; count++) collectOne(state);
  assert.equal(state.foods.length, 6);
  assert.equal(new Set(state.foods.map((food) => food.id)).size, 6);
});

test('the threshold absorption evolves immediately without a separate action', () => {
  const state = createState(SEED);
  earn(state, 30);
  assert.equal(canEvolve(state), false);
  const snapshot = copy(state);
  assert.equal(evolve(state).type, 'blocked');
  assert.deepEqual(state, snapshot);
  const result = collectOne(state);
  assert.deepEqual(result.evolution, { type: 'evolve', form: 1 });
  assert.equal(state.form, 1);
  assert.equal(state.energy, 0);
  assert.deepEqual(state.discovered, [0, 1]);
  assert.equal(evolve(state).type, 'blocked');
});

test('automatic evolution spends its cost and later absorptions build the next form', () => {
  const state = createState(SEED);
  earn(state, 60);
  assert.equal(state.energy, 20);
  assert.equal(state.form, 1);
  assert.equal(state.stats.evolutions, 1);
  assert.equal(canEvolve(state), false);
});

test('automatic evolution preserves remaining hit count and never grants an easy knockout', () => {
  const state = createState(SEED);
  earn(state, 30);
  advance(state, 0.8);
  const target = state.foods.find((food) => food.hp >= 2);
  assert.ok(target);
  ready(state);
  act(state, target.id);
  const meal = state.foods.find((food) => food.id !== target.id && food.status === 'alive');
  knockOut(state, meal.id);
  ready(state);
  const remaining = new Map(state.foods.map((food) => [food.id, Math.ceil(food.hp / (state.form + 1))]));
  assert.equal(act(state, meal.id).evolution.type, 'evolve');
  for (const food of state.foods) {
    assert.equal(Math.ceil(food.hp / (state.form + 1)), remaining.get(food.id));
    assert.equal(food.maxHp, FOODS[food.kind].hp * (state.form + 1));
  }
});

test('fixed simulation is deterministic for the same actions and deltas', () => {
  const left = createState(SEED);
  const right = createState(SEED);
  for (let index = 0; index < 60; index++) {
    step(left, 1 / 30); step(right, 1 / 30);
    if (index % 12 === 0) { act(left, 1); act(right, 1); }
  }
  assert.deepEqual(left, right);
});

test('long frames are capped and invalid time deltas have no effect', () => {
  const left = createState(SEED);
  const right = createState(SEED);
  step(left, 1000); step(right, 0.25);
  assert.deepEqual(left, right);
  const snapshot = copy(left);
  for (const delta of [-1, NaN, Infinity, -Infinity, undefined, '0.1']) step(left, delta);
  assert.deepEqual(left, snapshot);
});

test('moving food remains within the arena for extended simulation', () => {
  const state = createState(SEED);
  advance(state, 180);
  for (const food of state.foods) {
    assert.ok(food.x >= 0 && food.x <= ARENA.width);
    assert.ok(food.y >= 0 && food.y <= ARENA.height);
    assert.ok(Number.isFinite(food.x) && Number.isFinite(food.y));
  }
});

test('pause prevents motion, combat and evolution', () => {
  const state = createState(SEED);
  earn(state, 40);
  state.paused = true;
  const snapshot = copy(state);
  step(state, 0.25);
  assert.equal(act(state, 1).type, 'blocked');
  assert.equal(evolve(state).type, 'blocked');
  assert.deepEqual(state, snapshot);
});

test('save roundtrip preserves earned progress, combat and collection', () => {
  const state = createState(SEED);
  earn(state, 60);
  knockOut(state, state.foods.find((food) => food.status === 'alive').id);
  const loaded = restore(serialize(state));
  assert.equal(loaded.form, state.form);
  assert.equal(loaded.energy, state.energy);
  assert.deepEqual(loaded.stats, state.stats);
  assert.deepEqual(loaded.discovered, state.discovered);
  assert.deepEqual(loaded.foods, state.foods);
  assert.equal(loaded.rng, state.rng);
  assert.equal(loaded.paused, false);
});

test('a valid legacy save at its threshold resumes with automatic evolution', () => {
  const state = createState(SEED);
  earn(state, 30);
  // This is the accounting of an old save made after the fourth absorption,
  // before the old manual evolution button was pressed.
  state.energy = 40;
  state.stats.absorbed = 4;
  state.stats.hits = Math.max(state.stats.hits, 4);
  const loaded = restore(serialize(state));
  assert.equal(loaded.form, 1);
  assert.equal(loaded.energy, 0);
  assert.equal(loaded.stats.absorbed, 4);
  assert.equal(loaded.stats.evolutions, 1);
  assert.deepEqual(loaded.discovered, [0, 1]);
  assert.deepEqual(restore(serialize(loaded)), loaded);
});

test('corrupt and unsupported saves safely produce a fresh state', () => {
  const fresh = createState(SEED);
  for (const raw of [null, '', '{bad json', 'null', '[]', '{}', { ...fresh, version: SAVE_VERSION + 1 }]) {
    assert.deepEqual(restore(raw, SEED), fresh);
  }
});

test('invalid numeric, food and collection fields cannot restore progress', () => {
  const valid = createState(SEED);
  const mutations = [
    (saved) => { saved.energy = Infinity; },
    (saved) => { saved.elapsed = NaN; },
    (saved) => { saved.stats.hits = -1; },
    (saved) => { saved.stats.absorbed = 1.5; },
    (saved) => { saved.form = 100; },
    (saved) => { saved.discovered = [0, 11]; },
    (saved) => { saved.won = true; },
    (saved) => { saved.foods[0] = null; },
    (saved) => { saved.foods[0].hp = Infinity; },
    (saved) => { saved.foods[0].status = 'knocked'; },
    (saved) => { saved.foods[1].id = saved.foods[0].id; },
    (saved) => { saved.foods[0].kind = 999; },
  ];
  for (const mutate of mutations) {
    const saved = copy(valid);
    mutate(saved);
    assert.deepEqual(restore(saved, SEED), valid);
  }
});

test('inconsistent save accounting cannot grant energy or free evolution', () => {
  const fresh = createState(SEED);
  const energyGrant = copy(fresh);
  energyGrant.energy = 500;
  assert.deepEqual(restore(energyGrant, SEED), fresh);
  const freeForm = copy(fresh);
  freeForm.form = 1; freeForm.discovered = [0, 1]; freeForm.stats.evolutions = 1;
  for (const food of freeForm.foods) { food.hp *= 2; food.maxHp *= 2; }
  assert.deepEqual(restore(freeForm, SEED), fresh);
  const noHits = copy(fresh);
  noHits.stats.absorbed = 1; noHits.energy = 10;
  assert.deepEqual(restore(noHits, SEED), fresh);
});

test('one hundred normal absorptions unlock all forms with a midpoint reload and one win', () => {
  let state = createState(SEED);
  let wins = 0;
  for (let count = 1; count <= 100; count++) {
    const previousForm = state.form;
    const result = collectOne(state);
    if (count === 50) {
      const stats = copy(state.stats);
      state = restore(serialize(state));
      assert.deepEqual(state.stats, stats);
    }
    if (state.form !== previousForm) {
      assert.equal(state.form, previousForm + 1);
      assert.equal(result.evolution.form, state.form);
      if (result.evolution.type === 'win') wins++;
      assert.equal(state.energy, 0);
      assert.equal(evolve(state).type, 'blocked');
    } else assert.equal(result.evolution, null);
    assert.equal(canEvolve(state), false);
    if (count < 100) assert.equal(state.won, false);
  }
  assert.equal(state.stats.absorbed, 100);
  assert.equal(state.stats.evolutions, 11);
  assert.equal(state.form, 11);
  assert.equal(state.won, true);
  assert.equal(wins, 1);
  assert.deepEqual(state.discovered, FORMS.map((form) => form.id));
  assert.equal(canEvolve(state), false);
  assert.deepEqual(restore(serialize(state)).discovered, state.discovered);
  // The final collection remains readable and food interactions remain usable.
  assert.ok(state.discovered.every((id) => FORMS[id].lore && FORMS[id].favorite));
  collectOne(state);
  assert.equal(state.stats.absorbed, 101);
  assert.equal(state.energy, 10);
  assert.equal(evolve(state).type, 'blocked');
});

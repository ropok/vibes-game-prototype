import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createState, step, interact, contextAction, buyUpgrade, upgradeCost,
  serialize, restore, canOccupy, maxStamina, trafficAt, FIXED_DT,
} from '../src/engine.js';
import { WORLD, DEPOT, GARAGE, HOMES, UPGRADE_KEYS, INTERACT_RADIUS } from '../src/data.js';

const close = (actual, expected, tolerance = 1e-7) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should equal ${expected}`);
};
const at = (state, point) => Object.assign(state.player, { x: point.x, y: point.y });
const quietState = () => {
  const state = createState();
  state.traffic = [];
  return state;
};
const advance = (state, seconds, input = {}, rate = 60) => {
  for (let frame = 0; frame < Math.round(seconds * rate); frame++) step(state, input, 1 / rate);
};
const destination = state => HOMES.find(home => home.id === state.parcel.homeId);
const pickup = state => {
  at(state, DEPOT);
  assert.equal(interact(state).kind, 'pickup');
  return structuredClone(state.parcel);
};
const walkTo = (state, point) => {
  for (let frame = 0; Math.hypot(point.x - state.player.x, point.y - state.player.y) > 0.01; frame++) {
    assert.ok(frame < 3000, 'A road-and-door route must be reachable by ordinary walking');
    const x = point.x - state.player.x, y = point.y - state.player.y;
    const divisor = Math.max(3, Math.hypot(x, y));
    step(state, { x: x / divisor, y: y / divisor }, FIXED_DT);
    assert.ok(canOccupy(state.player.x, state.player.y));
  }
};
const parkTrafficOnPlayer = state => {
  const progress = 0;
  const car = { ...trafficAt(progress), progress, speed: 0 };
  state.traffic = [car];
  at(state, car);
};

test('new games are deterministic and do not share mutable progress', () => {
  const first = createState(73), second = createState(73);
  assert.deepEqual(first, second);
  first.upgrades.speed = 2;
  first.traffic[0].progress = 99;
  first.completedIds.push('paket-1');
  assert.equal(second.upgrades.speed, 0);
  assert.equal(second.traffic[0].progress, 0);
  assert.deepEqual(second.completedIds, []);
});

test('walking has the same distance diagonally and across 30, 60, and 120 Hz', () => {
  const states = [30, 60, 120].map(rate => {
    const state = quietState();
    at(state, { x: 1500, y: 2100 });
    advance(state, 1, { x: 1 }, rate);
    return state;
  });
  for (const state of states) {
    close(state.player.x, 1680);
    close(state.player.y, 2100);
    close(state.time, 1);
  }
  const diagonal = quietState();
  at(diagonal, { x: 1500, y: 2100 });
  advance(diagonal, 1, { x: 1, y: 1 });
  close(Math.hypot(diagonal.player.x - 1500, diagonal.player.y - 2100), 180);
});

test('zero or invalid elapsed time leaves the whole simulation unchanged', () => {
  const state = createState(), before = structuredClone(state);
  for (const delta of [0, -1, NaN, Infinity, -Infinity]) step(state, { x: 1, run: true }, delta);
  assert.deepEqual(state, before);
  step(state, {}, 10);
  assert.ok(state.time > 0 && state.time <= 0.25 + 1e-9, 'A stalled frame is bounded');
});

test('walking respects world edges and cannot enter a house wall', () => {
  const state = quietState();
  at(state, { x: 25, y: 25 });
  advance(state, 1, { x: -1, y: -1 });
  assert.ok(state.player.x >= 20 && state.player.y >= 20);
  at(state, { x: WORLD.width - 25, y: WORLD.height - 25 });
  advance(state, 1, { x: 1, y: 1 });
  assert.ok(state.player.x <= WORLD.width - 20 && state.player.y <= WORLD.height - 20);
  const home = HOMES[0];
  at(state, { x: home.x, y: home.y + 30 });
  advance(state, 1, { y: -1, run: true });
  assert.ok(state.player.y >= home.building.y + home.building.h + 14);
  assert.ok(canOccupy(state.player.x, state.player.y));
});

test('every delivery door can be reached from the depot along actual roads', () => {
  for (const home of HOMES) {
    const state = quietState();
    walkTo(state, { x: 500, y: DEPOT.y });
    walkTo(state, { x: 500, y: home.y + 104 });
    walkTo(state, { x: home.x, y: home.y + 104 });
    walkTo(state, home);
    state.parcel = { id: 'paket-1', homeId: home.id, reward: 100 };
    assert.equal(contextAction(state).kind, 'deliver', home.name);
  }
});

test('running spends stamina, rest replenishes it, and an exhausted courier can walk', () => {
  const state = quietState();
  at(state, { x: 1500, y: 2150 });
  advance(state, 1, { x: 1, run: true });
  assert.ok(state.player.x > 1680);
  assert.ok(state.player.stamina < 100 && state.player.stamina > 0);
  const depleted = state.player.stamina;
  advance(state, 1);
  assert.ok(state.player.stamina > depleted && state.player.stamina <= maxStamina(state));
  state.player.stamina = 0;
  const start = state.player.x;
  step(state, { x: 1, run: true }, FIXED_DT);
  assert.ok(state.player.x > start, 'Exhaustion must never strand the courier');
  assert.equal(state.player.running, false);
  advance(state, 15, { run: true });
  close(state.player.stamina, maxStamina(state));
});

test('traffic moves around its route and damage has a cooldown', () => {
  const moving = createState(), before = moving.traffic[0].progress;
  advance(moving, 1);
  assert.ok(moving.traffic[0].progress > before);
  const state = quietState();
  parkTrafficOnPlayer(state);
  step(state, {}, FIXED_DT);
  assert.ok(state.player.health < 100);
  const afterHit = state.player.health;
  advance(state, 1);
  assert.equal(state.player.health, afterHit, 'Remaining in the same car must not hurt every frame');
  advance(state, 0.6);
  assert.ok(state.player.health < afterHit);
});

test('a helmet reduces actual traffic damage, and a fatal collision preserves money and parcel', () => {
  const plain = quietState(), protectedState = quietState();
  protectedState.upgrades.helmet = 3;
  parkTrafficOnPlayer(plain);
  parkTrafficOnPlayer(protectedState);
  step(plain, {}, FIXED_DT);
  step(protectedState, {}, FIXED_DT);
  assert.ok(protectedState.player.health > plain.player.health);
  const state = quietState(), parcel = pickup(state);
  state.balance = 250;
  state.player.health = 1;
  parkTrafficOnPlayer(state);
  step(state, {}, FIXED_DT);
  close(state.player.x, DEPOT.x);
  close(state.player.y, DEPOT.y);
  assert.equal(state.player.health, 100);
  assert.equal(state.balance, 250);
  assert.deepEqual(state.parcel, parcel);
  assert.equal(state.deliveries, 0);
  assert.ok(state.player.invincible > 0);
});

test('pickup requires proximity, carries one parcel, and recovers at the depot', () => {
  const state = quietState();
  at(state, { x: DEPOT.x, y: DEPOT.y + INTERACT_RADIUS + 1 });
  assert.equal(interact(state).ok, false);
  assert.equal(state.parcel, null);
  const parcel = pickup(state), sequence = state.sequence;
  state.player.health = 40;
  state.player.stamina = 1;
  assert.equal(interact(state).kind, 'recover');
  assert.deepEqual(state.parcel, parcel);
  assert.equal(state.sequence, sequence);
  assert.equal(state.player.health, 100);
  assert.equal(state.player.stamina, maxStamina(state));
});

test('only the addressed home pays, only once, and the next parcel gets a different destination', () => {
  const state = quietState(), parcel = pickup(state);
  at(state, HOMES.find(home => home.id !== parcel.homeId));
  assert.equal(interact(state).ok, false);
  assert.equal(state.balance, 0);
  assert.deepEqual(state.parcel, parcel);
  at(state, destination(state));
  assert.equal(interact(state).kind, 'delivered');
  assert.equal(state.balance, parcel.reward);
  assert.equal(state.deliveries, 1);
  assert.equal(state.parcel, null);
  assert.equal(interact(state).ok, false);
  state.parcel = parcel;
  assert.equal(interact(state).ok, false, 'A completed parcel cannot be replayed');
  assert.equal(state.balance, parcel.reward);
  assert.equal(state.deliveries, 1);
  assert.notEqual(pickup(state).homeId, parcel.homeId);
});

test('garage purchases enforce location, funds, supported items, and all three level limits', () => {
  const state = quietState();
  state.balance = 10000;
  assert.equal(buyUpgrade(state, 'speed').ok, false);
  at(state, GARAGE);
  assert.equal(interact(state).kind, 'garage');
  assert.equal(buyUpgrade(state, 'unknown').ok, false);
  state.balance = upgradeCost(state, 'speed') - 1;
  const poor = serialize(state);
  assert.equal(buyUpgrade(state, 'speed').ok, false);
  assert.equal(serialize(state), poor);
  state.balance = 10000;
  for (const key of UPGRADE_KEYS) {
    for (let level = 0; level < 3; level++) {
      const cost = upgradeCost(state, key), balance = state.balance;
      assert.ok(cost > 0);
      assert.equal(buyUpgrade(state, key).ok, true);
      assert.equal(state.upgrades[key], level + 1);
      assert.equal(state.balance, balance - cost);
    }
    const balance = state.balance;
    assert.equal(upgradeCost(state, key), null);
    assert.equal(buyUpgrade(state, key).ok, false);
    assert.equal(state.balance, balance);
  }
});

test('speed, income, and jacket upgrades improve movement, subsequent pay, and stamina capacity', () => {
  const plain = quietState(), upgraded = quietState();
  at(upgraded, GARAGE);
  upgraded.balance = 1000;
  for (const key of ['speed', 'income', 'jacket']) assert.equal(buyUpgrade(upgraded, key).ok, true);
  assert.ok(maxStamina(upgraded) > maxStamina(plain));
  const ordinaryParcel = pickup(plain), improvedParcel = pickup(upgraded);
  assert.equal(ordinaryParcel.homeId, improvedParcel.homeId);
  assert.ok(improvedParcel.reward > ordinaryParcel.reward);
  assert.equal(upgraded.player.stamina, maxStamina(upgraded));
  for (const state of [plain, upgraded]) {
    at(state, { x: 1500, y: 2150 });
    advance(state, 1, { x: 1 });
  }
  assert.ok(upgraded.player.x > plain.player.x);
});

test('saving an active delivery preserves progression and paying after reload cannot duplicate earnings', () => {
  const state = quietState(), first = pickup(state);
  at(state, destination(state));
  interact(state);
  at(state, GARAGE);
  assert.equal(buyUpgrade(state, 'speed').ok, true);
  const active = pickup(state), saved = serialize(state), loaded = restore(saved);
  assert.equal(serialize(loaded), saved);
  assert.deepEqual(loaded.parcel, active);
  assert.deepEqual(loaded.completedIds, [first.id]);
  at(loaded, destination(loaded));
  const balance = loaded.balance;
  assert.equal(interact(loaded).ok, true);
  assert.equal(loaded.balance, balance + active.reward);
  const paid = restore(serialize(loaded));
  assert.equal(interact(paid).ok, false);
  assert.equal(paid.balance, loaded.balance);
  assert.equal(paid.deliveries, 2);
});

test('corrupt saves, impossible positions, invalid upgrades, and replayed parcel records reset safely', () => {
  const state = quietState(), parcel = pickup(state);
  at(state, destination(state));
  interact(state);
  const valid = JSON.parse(serialize(state));
  const corruptions = [
    null, '{broken', {}, { ...valid, version: 999 },
    { ...valid, balance: -1 }, { ...valid, balance: Infinity },
    { ...valid, sequence: 0 },
    { ...valid, player: { ...valid.player, x: -100 } },
    { ...valid, player: { ...valid.player, x: HOMES[0].x, y: HOMES[0].building.y + 10 } },
    { ...valid, player: { ...valid.player, stamina: 10000 } },
    { ...valid, upgrades: { ...valid.upgrades, helmet: 4 } },
    { ...valid, completedIds: [parcel.id, parcel.id], deliveries: 2, sequence: 2 },
    { ...valid, parcel },
  ];
  for (const raw of corruptions) assert.deepEqual(restore(raw), createState());
  const source = JSON.parse(serialize(createState()));
  const loaded = restore(source);
  source.upgrades.speed = 3;
  source.completedIds.push('paket-99');
  assert.equal(loaded.upgrades.speed, 0);
  assert.deepEqual(loaded.completedIds, []);
});

test('twelve deliveries unlock the milestone while allowing the courier to keep working', () => {
  const state = quietState();
  for (let delivery = 0; delivery < 12; delivery++) {
    pickup(state);
    at(state, destination(state));
    assert.equal(interact(state).kind, 'delivered');
  }
  assert.equal(state.achievement, true);
  assert.equal(state.deliveries, 12);
  assert.equal(new Set(state.completedIds).size, 12);
  assert.equal(restore(serialize(state)).achievement, true);
  assert.equal(pickup(state).id, 'paket-13');
});

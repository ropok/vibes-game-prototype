import { FORMS, FOODS } from './data.js';

export { FORMS, FOODS };
export const SAVE_KEY = 'mbg-evolution-save-v1';
export const SAVE_VERSION = 1;
export const ARENA = Object.freeze({ width: 900, height: 560 });
const TICK = 1 / 60;
const MAX_DELTA = 0.25;
const validNumber = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;

function random(state) {
  let n = state.rng >>> 0;
  n ^= n << 13; n ^= n >>> 17; n ^= n << 5;
  state.rng = n >>> 0;
  return state.rng / 4294967296;
}

function spawn(state, id) {
  const roll = random(state);
  const kind = roll < .15 ? 0 : roll < .45 ? 1 : roll < .60 ? 2 : roll < .75 ? 3 : roll < .90 ? 4 : 5;
  const definition = FOODS[kind];
  const angle = random(state) * Math.PI * 2;
  return { id, kind, x: 78 + random(state) * 744, y: 142 + random(state) * 318,
    vx: Math.cos(angle) * (20 + random(state) * 22), vy: Math.sin(angle) * (20 + random(state) * 22),
    hp: definition.hp * (state.form + 1), maxHp: definition.hp * (state.form + 1), status: 'alive', respawn: 0 };
}

/** Pure simulation state; no DOM, wall clock, storage, or renderer dependencies. */
export function createState(seed = 0x4d4247) {
  const state = { version: SAVE_VERSION, rng: (seed >>> 0) || 1, form: 0, energy: 0,
    discovered: [0], stats: { hits: 0, absorbed: 0, evolutions: 0 }, foods: [],
    paused: false, won: false, elapsed: 0, nextActionAt: 0, accumulator: 0 };
  for (let id = 1; id <= 6; id++) state.foods.push(spawn(state, id));
  return state;
}

/** Advance by seconds. Mutates and returns state; long frames are capped at 250 ms. */
export function step(state, deltaSeconds) {
  if (state.paused || !validNumber(deltaSeconds, 0, Number.MAX_VALUE)) return state;
  state.accumulator += Math.min(deltaSeconds, MAX_DELTA);
  while (state.accumulator + 1e-10 >= TICK) {
    state.accumulator = Math.max(0, state.accumulator - TICK);
    state.elapsed += TICK;
    for (let i = 0; i < state.foods.length; i++) {
      const food = state.foods[i];
      if (food.status === 'absorbed') {
        food.respawn -= TICK;
        if (food.respawn <= 0) state.foods[i] = spawn(state, food.id);
      } else if (food.status === 'alive') {
        food.x += food.vx * TICK; food.y += food.vy * TICK;
        if (food.x < 65 || food.x > 835) { food.x = Math.max(65, Math.min(835, food.x)); food.vx *= -1; }
        if (food.y < 135 || food.y > 478) { food.y = Math.max(135, Math.min(478, food.y)); food.vy *= -1; }
      }
    }
  }
  return state;
}

/** One deliberate action: attack a live target OR absorb a previously knocked target. */
export function act(state, id) {
  if (state.paused) return { type: 'blocked', reason: 'paused' };
  if (state.elapsed + 1e-9 < state.nextActionAt) return { type: 'blocked', reason: 'cooldown' };
  const food = state.foods.find((item) => item.id === id);
  if (!food || food.status === 'absorbed') return { type: 'blocked', reason: 'unavailable' };
  if (food.status === 'alive') {
    food.hp = Math.max(0, food.hp - state.form - 1); state.stats.hits += 1;
    state.nextActionAt = state.elapsed + 0.3;
    if (food.hp === 0) food.status = 'knocked';
    return { type: food.status === 'knocked' ? 'knockout' : 'hit', id, kind: food.kind };
  }
  const energy = FOODS[food.kind].energy;
  state.nextActionAt = state.elapsed + 0.3;
  state.energy += energy; state.stats.absorbed += 1;
  food.status = 'absorbed'; food.respawn = 0.7;
  const evolution = canEvolve(state) ? evolve(state) : null;
  return { type: 'absorb', id, kind: food.kind, energy, evolution };
}

export function canEvolve(state) {
  return state.form < FORMS.length - 1 && state.energy >= FORMS[state.form].threshold;
}

export function evolve(state) {
  if (state.paused || !canEvolve(state)) return { type: 'blocked', reason: 'not-ready' };
  state.energy -= FORMS[state.form].threshold;
  const oldDamage = state.form + 1;
  state.form += 1; state.discovered.push(state.form); state.stats.evolutions += 1;
  for (const food of state.foods) {
    food.hp = Math.ceil(food.hp / oldDamage) * (state.form + 1);
    food.maxHp = FOODS[food.kind].hp * (state.form + 1);
  }
  state.won = state.form === FORMS.length - 1;
  return { type: state.won ? 'win' : 'evolve', form: state.form };
}

export function serialize(state) {
  // Transient pause and frame remainder never resume as a stuck or accelerated game.
  return JSON.stringify({ ...state, paused: false, accumulator: 0 });
}

/** Validate the complete persisted simulation. Invalid or old saves safely start fresh. */
export function restore(raw, seed = 0x4d4247) {
  try {
    const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!saved || saved.version !== SAVE_VERSION || !Number.isInteger(saved.form) || saved.form < 0 || saved.form >= FORMS.length ||
      !Number.isInteger(saved.rng) || !validNumber(saved.rng, 1, 4294967295) || !validNumber(saved.energy, 0, 1e9) ||
      !Number.isInteger(saved.energy) || !validNumber(saved.elapsed, 0, 1e9) || !validNumber(saved.nextActionAt, 0, saved.elapsed + .301) ||
      !Array.isArray(saved.discovered) || saved.discovered.length !== saved.form + 1 ||
      saved.discovered.some((value, index) => value !== index) ||
      !saved.stats || !['hits', 'absorbed', 'evolutions'].every((key) => Number.isInteger(saved.stats[key]) && validNumber(saved.stats[key], 0, 1e9)) ||
      saved.stats.evolutions !== saved.form || saved.stats.hits < saved.stats.absorbed ||
      saved.energy !== saved.stats.absorbed * 10 - FORMS.slice(0, saved.form).reduce((sum, form) => sum + form.threshold, 0) ||
      saved.won !== (saved.form === FORMS.length - 1) ||
      !Array.isArray(saved.foods) || saved.foods.length !== 6) return createState(seed);
    const ids = new Set();
    for (const food of saved.foods) {
      if (!Number.isInteger(food.id) || food.id < 1 || food.id > 6 || ids.has(food.id) || !Number.isInteger(food.kind) || !FOODS[food.kind] ||
        !['alive', 'knocked', 'absorbed'].includes(food.status) || !validNumber(food.x, 60, 840) || !validNumber(food.y, 130, 480) ||
        !validNumber(food.vx, -42, 42) || !validNumber(food.vy, -42, 42) || !Number.isInteger(food.hp) ||
        food.maxHp !== FOODS[food.kind].hp * (saved.form + 1) || !validNumber(food.hp, 0, food.maxHp) || (food.status === 'alive' ? food.hp < 1 : food.hp !== 0) ||
        !validNumber(food.respawn, 0, 0.7)) return createState(seed);
      ids.add(food.id);
    }
    const state = { ...saved, paused: false, accumulator: 0 };
    // Earlier saves could wait at a full meter for a manual evolution.
    while (canEvolve(state)) evolve(state);
    return state;
  } catch { return createState(seed); }
}

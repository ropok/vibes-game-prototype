import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, resolveAnswer, usePotion, ENCOUNTERS, OPERATORS } from '../src/game/engine.js';
import { SAVE_VERSION, serializeSave, parseSave, summarizeResult, serializeResult, parseResult, selectBestResult } from '../src/game/persistence.js';

function progressedGame() {
  let state = createGame(() => 0, 'relaxed');
  state = resolveAnswer(state, state.puzzle.answer, () => 0);
  state = resolveAnswer(state, OPERATORS.find((operator) => operator !== state.puzzle.answer), () => 0);
  return usePotion(state);
}

function finishGame(correct) {
  let state = createGame(() => 0, 'relaxed');
  for (let turn = 0; turn < 100 && state.status === 'playing'; turn += 1) {
    const answer = correct ? state.puzzle.answer : OPERATORS.find((operator) => operator !== state.puzzle.answer);
    state = resolveAnswer(state, answer, () => 0);
  }
  assert.equal(state.status, correct ? 'victory' : 'defeat');
  return state;
}

test('saved active runs preserve resources, puzzle, history, mode and turn feedback', () => {
  const state = progressedGame();
  const serialized = serializeSave(state);
  assert.equal(typeof serialized, 'string');
  assert.equal(JSON.parse(serialized).version, SAVE_VERSION);
  const restored = parseSave(serialized);
  assert.deepEqual(restored, state);
  assert.notEqual(restored, state);
  assert.notEqual(restored.puzzle, state.puzzle);
  assert.notEqual(restored.recentEquations, state.recentEquations);
  assert.notEqual(restored.lastTurn, state.lastTurn);
  restored.puzzle.options.reverse();
  assert.deepEqual(state.puzzle.options, OPERATORS);
});

test('an untouched run with no turn feedback also round-trips', () => {
  const state = createGame(() => 0);
  assert.deepEqual(parseSave(serializeSave(state)), state);
});

test('corrupt saves and unsupported versions are rejected without throwing', () => {
  for (const raw of [null, undefined, '', '{broken', 'null', '[]', '{}', '42', JSON.stringify({ version: SAVE_VERSION + 1, state: progressedGame() })]) {
    assert.doesNotThrow(() => assert.equal(parseSave(raw), null));
  }
});

test('malformed and unsafe state fields cannot be restored', () => {
  const mutations = [
    (state) => { state.playerHp = -1; },
    (state) => { state.playerHp = state.maxPlayerHp + 1; },
    (state) => { state.playerHp = '100'; },
    (state) => { state.enemyHp = ENCOUNTERS[state.encounterIndex].hp + 1; },
    (state) => { state.encounterIndex = -1; },
    (state) => { state.encounterIndex = ENCOUNTERS.length; },
    (state) => { state.potions = 2; },
    (state) => { state.potions = -1; },
    (state) => { state.mode = 'unknown'; },
    (state) => { state.attempts = Number.MAX_SAFE_INTEGER + 1; },
    (state) => { state.correct = state.attempts + 1; },
    (state) => { state.puzzle.left = Number.MAX_SAFE_INTEGER + 1; },
    (state) => { state.puzzle.answer = '?'; },
    (state) => { state.puzzle.result += 1; },
    (state) => { state.puzzle.options = ['×', '×', '+', '÷']; },
    (state) => { state.puzzle = { left: 2, right: 2, result: 4, answer: '+', options: [...OPERATORS] }; },
    (state) => { state.recentEquations = []; },
    (state) => { state.recentEquations = Array(9).fill(state.recentEquations.at(-1)); },
    (state) => { state.recentEquations[state.recentEquations.length - 1] = 'different equation'; },
    (state) => { state.lastTurn.damage = -1; },
  ];
  for (const mutate of mutations) {
    const state = progressedGame();
    mutate(state);
    const raw = JSON.stringify({ version: SAVE_VERSION, state });
    assert.doesNotThrow(() => assert.equal(parseSave(raw), null, mutate.toString()));
    assert.equal(serializeSave(state), null, mutate.toString());
  }
});

test('terminal runs are saved as last results instead of resumable games', () => {
  for (const correct of [true, false]) {
    const state = finishGame(correct);
    assert.equal(serializeSave(state), null);
    assert.equal(parseSave(JSON.stringify({ version: SAVE_VERSION, state })), null);
    const summary = summarizeResult(state);
    assert.deepEqual(summary, {
      mode: state.mode, status: state.status,
      guardiansFreed: correct ? ENCOUNTERS.length : state.encounterIndex,
      correct: state.correct, attempts: state.attempts,
      bestStreak: state.bestStreak, playerHp: state.playerHp,
    });
    const raw = serializeResult(state);
    assert.equal(typeof raw, 'string');
    assert.deepEqual(parseResult(raw), summary);
  }
  assert.equal(summarizeResult(progressedGame()), null);
  assert.equal(serializeResult(progressedGame()), null);
});

test('malformed last results are rejected without throwing', () => {
  const valid = JSON.parse(serializeResult(finishGame(true)));
  const rawResults = [null, undefined, '', '{broken', 'null', '{}', '[]',
    JSON.stringify({ ...valid, version: SAVE_VERSION + 1 }),
    JSON.stringify({ ...valid, result: { ...valid.result, status: 'playing' } }),
    JSON.stringify({ ...valid, result: { ...valid.result, guardiansFreed: ENCOUNTERS.length + 1 } }),
    JSON.stringify({ ...valid, result: { ...valid.result, attempts: Number.MAX_SAFE_INTEGER + 1 } }),
    JSON.stringify({ ...valid, result: { ...valid.result, correct: valid.result.attempts + 1 } }),
  ];
  for (const raw of rawResults) {
    assert.doesNotThrow(() => assert.equal(parseResult(raw), null));
  }
});

test('personal best ranks progress before accuracy and streak, preserving ties', () => {
  const previous = { mode: 'adventure', status: 'defeat', guardiansFreed: 1, correct: 6, attempts: 10, bestStreak: 3, playerHp: 0 };
  const further = { ...previous, guardiansFreed: 2, correct: 5, attempts: 20 };
  assert.equal(selectBestResult(previous, further), further);
  const accurate = { ...previous, correct: 7 };
  assert.equal(selectBestResult(previous, accurate), accurate);
  const streak = { ...previous, bestStreak: 4 };
  assert.equal(selectBestResult(previous, streak), streak);
  assert.equal(selectBestResult(previous, { ...previous }), previous);
  assert.equal(selectBestResult(previous, { ...previous, correct: 5, bestStreak: 5 }), previous);
  assert.equal(selectBestResult(null, previous), previous);
  assert.equal(selectBestResult(previous, null), previous);
});

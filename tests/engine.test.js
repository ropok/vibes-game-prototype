import test from 'node:test';
import assert from 'node:assert/strict';
import { OPERATORS, ENCOUNTERS, evaluateOperator, generatePuzzle, createGame, resolveAnswer, usePotion, getEnemyAttack, puzzleKey } from '../src/game/engine.js';

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

function wrongAnswer(state) {
  return OPERATORS.find((operator) => operator !== state.puzzle.answer);
}

// Independent arithmetic oracle also catches mistakes shared by the generator
// and evaluateOperator (rather than validating one with the other).
function arithmetic(left, right, operator) {
  switch (operator) {
    case '×': return left * right;
    case '−': return left - right;
    case '+': return left + right;
    case '÷': return right !== 0 && left % right === 0 ? left / right : null;
    default: return null;
  }
}

test('integer arithmetic handles all operators and rejects invalid operations', () => {
  assert.equal(evaluateOperator(7, 3, '+'), 10);
  assert.equal(evaluateOperator(3, 7, '−'), -4);
  assert.equal(evaluateOperator(7, 3, '×'), 21);
  assert.equal(evaluateOperator(12, 3, '÷'), 4);
  assert.equal(evaluateOperator(7, 3, '÷'), null);
  assert.equal(evaluateOperator(5, 0, '÷'), null);
  assert.equal(evaluateOperator(0, 0, '÷'), null);
  assert.equal(evaluateOperator(5, 0, '×'), 0);
  assert.equal(evaluateOperator(5, 0, '+'), 5);
  assert.equal(evaluateOperator(5, 0, '−'), 5);
  assert.equal(evaluateOperator(5, 2, '?'), null);
  assert.equal(evaluateOperator(1.5, 2, '+'), null);
  assert.equal(evaluateOperator(Infinity, 2, '×'), null);
  assert.equal(evaluateOperator(Number.MAX_SAFE_INTEGER, 1, '+'), null);
});

test('seeded puzzles have exactly one valid answer across levels', () => {
  const seenAnswers = new Set();
  for (const level of [-5, 0, 1, 2, 3, 100]) {
    const rng = seededRandom(12345 + level);
    for (let index = 0; index < 300; index += 1) {
      const puzzle = generatePuzzle(level, rng);
      const { left, right, result, answer, options } = puzzle;
      assert.ok([left, right, result].every(Number.isSafeInteger));
      assert.ok(result >= 0);
      assert.deepEqual(options, OPERATORS);
      assert.deepEqual(OPERATORS.filter((operator) => arithmetic(left, right, operator) === result), [answer]);
      seenAnswers.add(answer);
    }
  }
  assert.deepEqual([...seenAnswers].sort(), [...OPERATORS].sort());
});

test('ambiguous constant random input terminates with valid 5 × 0 = 0 puzzle', () => {
  const puzzle = generatePuzzle(0, () => 0);
  assert.deepEqual(puzzle, { left: 5, right: 0, result: 0, answer: '×', options: [...OPERATORS] });
  assert.deepEqual(OPERATORS.filter((operator) => arithmetic(5, 0, operator) === 0), ['×']);
});

test('new games start healthy with independent deterministic state', () => {
  const first = createGame(seededRandom(52));
  const second = createGame(seededRandom(52));
  assert.deepEqual(first, second);
  assert.notEqual(first, second);
  assert.notEqual(first.puzzle.options, second.puzzle.options);
  assert.equal(first.status, 'playing');
  assert.equal(first.encounterIndex, 0);
  assert.equal(first.playerHp, first.maxPlayerHp);
  assert.equal(first.enemyHp, ENCOUNTERS[0].hp);
  assert.equal(first.attempts, 0);
  assert.equal(first.correct, 0);
  assert.equal(first.streak, 0);
  assert.equal(first.lastTurn, null);
});

test('correct answers damage enemies, build streaks and preserve the input state', () => {
  const rng = seededRandom(13);
  const previous = freezeDeep(createGame(rng));
  const snapshot = structuredClone(previous);
  const next = resolveAnswer(previous, previous.puzzle.answer, rng);
  assert.deepEqual(previous, snapshot);
  assert.notEqual(next, previous);
  assert.equal(next.enemyHp, previous.enemyHp - 12);
  assert.equal(next.playerHp, previous.playerHp);
  assert.equal(next.correct, 1);
  assert.equal(next.attempts, 1);
  assert.equal(next.streak, 1);
  assert.equal(next.bestStreak, 1);
  assert.equal(next.lastTurn.correct, true);
  assert.equal(next.lastTurn.answer, previous.puzzle.answer);
  assert.notEqual(next.puzzle, previous.puzzle);
  const second = resolveAnswer(freezeDeep(next), next.puzzle.answer, rng);
  assert.equal(second.lastTurn.damage, 15);
  assert.equal(second.streak, 2);
  assert.equal(second.bestStreak, 2);
});

test('incorrect answers apply encounter damage and reset only the current streak', () => {
  const rng = seededRandom(27);
  let state = createGame(rng);
  state = resolveAnswer(state, state.puzzle.answer, rng);
  const previous = freezeDeep(state);
  const next = resolveAnswer(previous, wrongAnswer(previous), rng);
  assert.equal(next.enemyHp, previous.enemyHp);
  assert.equal(next.playerHp, previous.playerHp - ENCOUNTERS[0].attack);
  assert.equal(next.streak, 0);
  assert.equal(next.bestStreak, 1);
  assert.equal(next.correct, 1);
  assert.equal(next.attempts, 2);
  assert.equal(next.lastTurn.correct, false);
});

test('defeating an intermediate enemy advances and heals without exceeding maximum health', () => {
  for (const playerHp of [50, 97, 100]) {
    const previous = freezeDeep({ ...createGame(() => 0), enemyHp: 1, playerHp });
    const next = resolveAnswer(previous, previous.puzzle.answer, () => 0);
    assert.equal(next.status, 'playing');
    assert.equal(next.encounterIndex, 1);
    assert.equal(next.enemyHp, ENCOUNTERS[1].hp);
    assert.equal(next.playerHp, Math.min(playerHp + 10, previous.maxPlayerHp));
    assert.equal(next.lastTurn.healed, Math.min(10, previous.maxPlayerHp - playerHp));
    assert.equal(next.lastTurn.enemyDefeated, true);
    assert.equal(next.lastTurn.previousEncounterIndex, 0);
  }
});

test('a full correct run reaches victory, visits every encounter and stops accepting answers', () => {
  const rng = seededRandom(81);
  let state = createGame(rng);
  const visited = new Set([state.encounterIndex]);
  for (let turn = 0; turn < 100 && state.status === 'playing'; turn += 1) {
    state = resolveAnswer(freezeDeep(state), state.puzzle.answer, rng);
    visited.add(state.encounterIndex);
  }
  assert.equal(state.status, 'victory');
  assert.deepEqual([...visited], ENCOUNTERS.map((_, index) => index));
  assert.equal(state.enemyHp, 0);
  assert.equal(state.correct, state.attempts);
  assert.equal(state.lastTurn.enemyDefeated, true);
  assert.equal(resolveAnswer(freezeDeep(state), state.puzzle.answer, rng), state);
});

test('repeated wrong answers reach defeat with health clamped to zero and no further turns', () => {
  const rng = seededRandom(99);
  let state = createGame(rng);
  for (let turn = 0; turn < 100 && state.status === 'playing'; turn += 1) {
    state = resolveAnswer(freezeDeep(state), wrongAnswer(state), rng);
  }
  assert.equal(state.status, 'defeat');
  assert.equal(state.playerHp, 0);
  assert.equal(state.correct, 0);
  assert.equal(state.encounterIndex, 0);
  assert.equal(state.enemyHp, ENCOUNTERS[0].hp);
  assert.equal(resolveAnswer(freezeDeep(state), state.puzzle.answer, rng), state);
});

test('unknown operators are ignored without consuming a turn or generating a puzzle', () => {
  const state = freezeDeep(createGame(() => 0));
  const unexpectedRng = () => { throw new Error('An ignored action must not consume random input'); };
  assert.equal(resolveAnswer(state, '?', unexpectedRng), state);
});

test('new runs default to Adventure and replenish one potion in either mode', () => {
  assert.equal(createGame(() => 0).mode, 'adventure');
  for (const mode of ['adventure', 'relaxed']) {
    const first = createGame(() => 0, mode);
    assert.equal(first.mode, mode);
    assert.equal(first.potions, 1);
    const used = usePotion({ ...first, playerHp: 50 });
    assert.equal(used.potions, 0);
    const fresh = createGame(() => 0, mode);
    assert.equal(fresh.potions, 1);
    assert.equal(fresh.playerHp, fresh.maxPlayerHp);
  }
});

test('a potion heals 35 health without consuming a turn or changing combat history', () => {
  const rng = seededRandom(120);
  let state = createGame(rng);
  state = resolveAnswer(state, state.puzzle.answer, rng);
  const previous = freezeDeep({ ...state, playerHp: 40 });
  const snapshot = structuredClone(previous);
  const next = usePotion(previous);
  assert.deepEqual(previous, snapshot);
  assert.notEqual(next, previous);
  assert.deepEqual(next, { ...previous, playerHp: 75, potions: 0 });
  assert.equal(next.puzzle, previous.puzzle);
  assert.equal(next.lastTurn, previous.lastTurn);
});

test('potion healing caps at full health and cannot be used twice', () => {
  const previous = freezeDeep({ ...createGame(() => 0), playerHp: 90 });
  const healed = usePotion(previous);
  assert.equal(healed.playerHp, 100);
  assert.equal(healed.potions, 0);
  const injuredAgain = freezeDeep({ ...healed, playerHp: 50 });
  assert.equal(usePotion(injuredAgain), injuredAgain);
});

test('potions ignore full health, empty inventory and terminal states', () => {
  const initial = createGame(() => 0);
  const ignoredStates = [
    initial,
    { ...initial, playerHp: 50, potions: 0 },
    { ...initial, playerHp: 50, status: 'victory' },
    { ...initial, playerHp: 0, status: 'defeat' },
  ];
  for (const state of ignoredStates) {
    freezeDeep(state);
    assert.equal(usePotion(state), state);
  }
});

test('Relaxed rounds enemy attacks up to 60 percent and Adventure retains full damage', () => {
  for (const mode of ['adventure', 'relaxed']) {
    for (let encounterIndex = 0; encounterIndex < ENCOUNTERS.length; encounterIndex += 1) {
      const previous = freezeDeep({ ...createGame(() => 0, mode), encounterIndex, enemyHp: ENCOUNTERS[encounterIndex].hp });
      const expected = mode === 'relaxed' ? Math.ceil(ENCOUNTERS[encounterIndex].attack * 0.6) : ENCOUNTERS[encounterIndex].attack;
      assert.equal(getEnemyAttack(previous), expected);
      const next = resolveAnswer(previous, wrongAnswer(previous), () => 0);
      assert.equal(next.playerHp, previous.playerHp - expected);
      assert.equal(next.lastTurn.damage, expected);
      assert.equal(next.mode, mode);
    }
  }
});

test('mode and spent potion persist across every encounter and victory', () => {
  for (const mode of ['adventure', 'relaxed']) {
    const rng = seededRandom(140);
    let state = usePotion({ ...createGame(rng, mode), playerHp: 80 });
    for (let turn = 0; turn < 100 && state.status === 'playing'; turn += 1) {
      state = resolveAnswer(freezeDeep(state), state.puzzle.answer, rng);
      assert.equal(state.mode, mode);
      assert.equal(state.potions, 0);
    }
    assert.equal(state.status, 'victory');
    assert.equal(state.encounterIndex, ENCOUNTERS.length - 1);
  }
});

test('constant random input still produces unique valid equations within recent history', () => {
  for (const level of [0, 1, 2, 3]) {
    let recent = [];
    for (let turn = 0; turn < 40; turn += 1) {
      const previous = freezeDeep([...recent]);
      const puzzle = generatePuzzle(level, () => 0, previous);
      const key = puzzleKey(puzzle);
      assert.equal(typeof key, 'string');
      assert.ok(!recent.includes(key), `Repeated equation ${key} at level ${level}, turn ${turn}`);
      assert.deepEqual(OPERATORS.filter((operator) => arithmetic(puzzle.left, puzzle.right, operator) === puzzle.result), [puzzle.answer]);
      assert.deepEqual(previous, recent);
      recent = [...recent, key].slice(-8);
    }
  }
});

test('equation identity is independent of the options array', () => {
  const puzzle = generatePuzzle(0, () => 0);
  assert.equal(puzzleKey(puzzle), puzzleKey({ ...puzzle, options: [...puzzle.options].reverse() }));
  assert.notEqual(puzzleKey(puzzle), puzzleKey({ ...puzzle, left: puzzle.left + 1 }));
});

test('game history includes the current question, caps at eight, and survives potion use', () => {
  let state = createGame(() => 0);
  assert.deepEqual(state.recentEquations, [puzzleKey(state.puzzle)]);
  let capped = false;
  for (let turn = 0; turn < 100 && state.status === 'playing'; turn += 1) {
    const previous = freezeDeep(state);
    state = resolveAnswer(previous, previous.puzzle.answer, () => 0);
    const key = puzzleKey(state.puzzle);
    assert.deepEqual(state.recentEquations, state.status === 'playing'
      ? [...previous.recentEquations, key].slice(-8)
      : previous.recentEquations);
    if (state.status === 'playing') assert.ok(!previous.recentEquations.includes(key));
    assert.equal(state.recentEquations.at(-1), key);
    if (state.recentEquations.length === 8) capped = true;
  }
  assert.equal(capped, true);
  assert.equal(state.status, 'victory');
  const injured = freezeDeep({ ...createGame(() => 0), playerHp: 50 });
  assert.equal(usePotion(injured).recentEquations, injured.recentEquations);
});

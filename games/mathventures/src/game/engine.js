/** Pure game rules. Pass an RNG for deterministic sessions and tests. */
export const OPERATORS = Object.freeze(['×', '−', '÷', '+']);

export const ENCOUNTERS = Object.freeze([
  Object.freeze({ name: 'Mossling', title: 'The overgrown gatekeeper', hp: 30, attack: 13, color: 0x8cab61, description: 'A little wild magic has taken root.' }),
  Object.freeze({ name: 'Bramble Wisp', title: 'A thorn in the twilight', hp: 42, attack: 16, color: 0xbc85c8, description: 'Follow the lanterns deeper into the wood.' }),
  Object.freeze({ name: 'Stonecap', title: 'Guardian of the old path', hp: 54, attack: 19, color: 0x91b6b5, description: 'Even ancient stone can be persuaded.' }),
  Object.freeze({ name: 'The Hollow Crown', title: 'Keeper of the stolen light', hp: 72, attack: 23, color: 0xe0b961, description: 'One final spell will bring the light home.' }),
]);

export function evaluateOperator(left, right, operator) {
  if (!Number.isSafeInteger(left) || !Number.isSafeInteger(right)) return null;
  let result;
  switch (operator) {
    case '+': result = left + right; break;
    case '−': result = left - right; break;
    case '×': result = left * right; break;
    case '÷':
      if (right === 0 || left % right !== 0) return null;
      result = left / right;
      break;
    default: return null;
  }
  return Number.isSafeInteger(result) ? result : null;
}

function randomInt(rng, max) {
  const value = rng();
  return Math.min(max, Math.max(0, Math.floor((Number.isFinite(value) ? value : 0) * (max + 1))));
}

export function puzzleKey(puzzle) {
  return `${puzzle.left}|${puzzle.answer}|${puzzle.right}|${puzzle.result}`;
}

function makePuzzle(left, right, answer, excluded) {
  const result = evaluateOperator(left, right, answer);
  if (result === null || result < 0) return null;
  const matches = OPERATORS.filter((operator) => evaluateOperator(left, right, operator) === result);
  const puzzle = { left, right, result, answer, options: [...OPERATORS] };
  return matches.length === 1 && !excluded.has(puzzleKey(puzzle)) ? puzzle : null;
}

export function generatePuzzle(level = 0, rng = Math.random, recentEquations = []) {
  const safeLevel = Math.min(3, Math.max(0, Math.floor(level) || 0));
  const max = 8 + safeLevel * 4;
  const excluded = new Set(recentEquations.slice(-8));
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const answer = OPERATORS[randomInt(rng, 3)];
    let left = randomInt(rng, max);
    let right = randomInt(rng, max);
    if (answer === '÷') {
      right = 2 + randomInt(rng, Math.min(max - 2, 10));
      left = right * (2 + randomInt(rng, 8));
    }
    if (answer === '−' && left < right) [left, right] = [right, left];
    const puzzle = makePuzzle(left, right, answer, excluded);
    if (puzzle) return puzzle;
  }
  // Bounded fallback also works with a constant RNG, without repeating recent spells.
  const familiar = makePuzzle(5, 0, '×', excluded);
  if (familiar) return familiar;
  for (let left = 0; left <= max; left += 1) {
    for (let right = 0; right <= max; right += 1) {
      for (const answer of OPERATORS) {
        const puzzle = makePuzzle(left, right, answer, excluded);
        if (puzzle) return puzzle;
      }
    }
  }
  // The 0–8 pool alone contains far more than eight unique equations.
  throw new Error('No unique puzzle is available.');
}

export function createGame(rng = Math.random, mode = 'adventure') {
  const puzzle = generatePuzzle(0, rng);
  return {
    mode: mode === 'relaxed' ? 'relaxed' : 'adventure', potions: 1,
    status: 'playing', encounterIndex: 0, playerHp: 100, maxPlayerHp: 100,
    enemyHp: ENCOUNTERS[0].hp, streak: 0, bestStreak: 0, correct: 0, attempts: 0,
    puzzle, recentEquations: [puzzleKey(puzzle)], lastTurn: null,
  };
}

export function getEnemyAttack(state) {
  return Math.ceil(ENCOUNTERS[state.encounterIndex].attack * (state.mode === 'relaxed' ? 0.6 : 1));
}

export function usePotion(state) {
  if (state.status !== 'playing' || state.potions < 1 || state.playerHp >= state.maxPlayerHp) return state;
  return {
    ...state, playerHp: Math.min(state.maxPlayerHp, state.playerHp + Math.ceil(state.maxPlayerHp * 0.35)),
    potions: state.potions - 1,
  };
}

export function resolveAnswer(state, operator, rng = Math.random) {
  if (state.status !== 'playing' || !OPERATORS.includes(operator)) return state;
  const correct = operator === state.puzzle.answer;
  const streak = correct ? state.streak + 1 : 0;
  const damage = correct ? 12 + Math.min(streak - 1, 4) * 3 : getEnemyAttack(state);
  let enemyHp = correct ? Math.max(0, state.enemyHp - damage) : state.enemyHp;
  let playerHp = correct ? state.playerHp : Math.max(0, state.playerHp - damage);
  let encounterIndex = state.encounterIndex;
  let status = playerHp === 0 ? 'defeat' : 'playing';
  const enemyDefeated = enemyHp === 0;
  let healed = 0;
  if (enemyDefeated) {
    if (encounterIndex === ENCOUNTERS.length - 1) status = 'victory';
    else {
      encounterIndex += 1;
      enemyHp = ENCOUNTERS[encounterIndex].hp;
      healed = Math.min(10, state.maxPlayerHp - playerHp);
      playerHp += healed;
    }
  }
  const history = state.recentEquations ?? [puzzleKey(state.puzzle)];
  const puzzle = status === 'playing' ? generatePuzzle(encounterIndex, rng, history) : state.puzzle;
  const recentEquations = status === 'playing' ? [...history, puzzleKey(puzzle)].slice(-8) : history;
  return {
    ...state, status, encounterIndex, playerHp, enemyHp, streak,
    bestStreak: Math.max(state.bestStreak, streak), correct: state.correct + Number(correct),
    attempts: state.attempts + 1,
    puzzle, recentEquations,
    lastTurn: {
      correct, damage, enemyDefeated, healed, operator, answer: state.puzzle.answer,
      equation: `${state.puzzle.left} ${state.puzzle.answer} ${state.puzzle.right} = ${state.puzzle.result}`,
      previousEncounterIndex: state.encounterIndex,
    },
  };
}

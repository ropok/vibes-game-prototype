import { ENCOUNTERS, OPERATORS, evaluateOperator, puzzleKey } from './engine.js';

export const SAVE_VERSION = 1;
const MODES = ['adventure', 'relaxed'];
const STATUSES = ['playing', 'victory', 'defeat'];
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
const object = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

function validPuzzle(puzzle) {
  if (!object(puzzle) || !['left', 'right', 'result'].every((key) => integer(puzzle[key], 0, 10000))) return false;
  if (!OPERATORS.includes(puzzle.answer) || !Array.isArray(puzzle.options)) return false;
  if (puzzle.options.length !== 4 || puzzle.options.some((operator, i) => operator !== OPERATORS[i])) return false;
  const matches = OPERATORS.filter((operator) => evaluateOperator(puzzle.left, puzzle.right, operator) === puzzle.result);
  return matches.length === 1 && matches[0] === puzzle.answer;
}

function validEquationKey(key) {
  if (typeof key !== 'string' || key.length > 64) return false;
  const parts = key.split('|');
  if (parts.length !== 4 || ![parts[0], parts[2], parts[3]].every((part) => /^\d+$/.test(part))) return false;
  return validPuzzle({ left: Number(parts[0]), answer: parts[1], right: Number(parts[2]), result: Number(parts[3]), options: [...OPERATORS] });
}

function validLastTurn(turn) {
  if (!object(turn) || typeof turn.correct !== 'boolean' || typeof turn.enemyDefeated !== 'boolean') return false;
  if (!integer(turn.damage, 1, 24) || !integer(turn.healed, 0, 10) || !integer(turn.previousEncounterIndex, 0, 3)) return false;
  if (!OPERATORS.includes(turn.operator) || !OPERATORS.includes(turn.answer) || turn.correct !== (turn.operator === turn.answer)) return false;
  if (typeof turn.equation !== 'string' || turn.equation.length > 64) return false;
  const match = /^(\d+) ([×−÷+]) (\d+) = (\d+)$/.exec(turn.equation);
  return !!match && match[2] === turn.answer && validEquationKey(`${match[1]}|${match[2]}|${match[3]}|${match[4]}`);
}

function validCounters(value) {
  return integer(value.attempts, 0, 1000000)
    && integer(value.correct, 0, value.attempts)
    && integer(value.bestStreak, 0, value.correct);
}

function validState(state) {
  if (!object(state) || !MODES.includes(state.mode) || !STATUSES.includes(state.status)) return false;
  if (state.maxPlayerHp !== 100 || !integer(state.playerHp, 0, 100) || !integer(state.potions, 0, 1)) return false;
  if (!integer(state.encounterIndex, 0, ENCOUNTERS.length - 1) || !integer(state.enemyHp, 0, ENCOUNTERS[state.encounterIndex].hp)) return false;
  if (!validCounters(state) || !integer(state.streak, 0, state.bestStreak)) return false;
  if (!validPuzzle(state.puzzle)) return false;
  if (!Array.isArray(state.recentEquations) || !integer(state.recentEquations.length, 1, 8)) return false;
  if (!state.recentEquations.every(validEquationKey) || new Set(state.recentEquations).size !== state.recentEquations.length) return false;
  if (state.recentEquations.at(-1) !== puzzleKey(state.puzzle)) return false;
  if (state.attempts === 0 ? state.lastTurn !== null : !validLastTurn(state.lastTurn)) return false;
  if (state.status === 'victory') return state.encounterIndex === 3 && state.enemyHp === 0 && state.playerHp > 0;
  if (state.status === 'defeat') return state.playerHp === 0 && state.enemyHp > 0;
  return state.playerHp > 0 && state.enemyHp > 0;
}

function readEnvelope(raw) {
  if (typeof raw !== 'string' || raw.length > 20000) return null;
  try {
    const envelope = JSON.parse(raw);
    return object(envelope) && envelope.version === SAVE_VERSION ? envelope : null;
  } catch { return null; }
}

/** Only an active, structurally valid run can occupy the local save slot. */
export function serializeSave(state) {
  try {
    return validState(state) && state.status === 'playing'
      ? JSON.stringify({ version: SAVE_VERSION, state }) : null;
  } catch { return null; }
}

export function parseSave(raw) {
  try {
    const envelope = readEnvelope(raw);
    return envelope && validState(envelope.state) && envelope.state.status === 'playing' ? envelope.state : null;
  } catch { return null; }
}

export function summarizeResult(state) {
  try {
    if (!validState(state) || state.status === 'playing') return null;
    return {
      mode: state.mode, status: state.status,
      guardiansFreed: state.encounterIndex + Number(state.status === 'victory'),
      correct: state.correct, attempts: state.attempts,
      bestStreak: state.bestStreak, playerHp: state.playerHp,
    };
  } catch { return null; }
}

function validResult(result) {
  if (!object(result) || !MODES.includes(result.mode) || !['victory', 'defeat'].includes(result.status)) return false;
  if (!validCounters(result) || result.attempts === 0 || !integer(result.playerHp, 0, 100)) return false;
  return result.status === 'victory'
    ? result.guardiansFreed === 4 && result.playerHp > 0
    : integer(result.guardiansFreed, 0, 3) && result.playerHp === 0;
}

export function serializeResult(state) {
  const result = summarizeResult(state);
  return result && validResult(result) ? JSON.stringify({ version: SAVE_VERSION, result }) : null;
}

export function parseResult(raw) {
  try {
    const envelope = readEnvelope(raw);
    return envelope && validResult(envelope.result) ? envelope.result : null;
  } catch { return null; }
}

/** Per-mode personal best: progress first, then accuracy, then best streak. Ties keep the earlier run. */
export function selectBestResult(previous, candidate) {
  if (!validResult(candidate)) return validResult(previous) ? previous : null;
  if (!validResult(previous) || previous.mode !== candidate.mode) return candidate;
  if (candidate.guardiansFreed !== previous.guardiansFreed) return candidate.guardiansFreed > previous.guardiansFreed ? candidate : previous;
  const accuracyDifference = candidate.correct * previous.attempts - previous.correct * candidate.attempts;
  if (accuracyDifference !== 0) return accuracyDifference > 0 ? candidate : previous;
  return candidate.bestStreak > previous.bestStreak ? candidate : previous;
}

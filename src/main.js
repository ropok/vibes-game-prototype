import Phaser from 'phaser';
import './style.css';
import { ForestScene } from './game/ForestScene.js';
import { createGame, resolveAnswer, usePotion, getEnemyAttack, OPERATORS, ENCOUNTERS } from './game/engine.js';
import { serializeSave, parseSave, serializeResult, parseResult, summarizeResult, selectBestResult } from './game/persistence.js';

const leaf = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 4C8 3 3 8 5 15c7 3 13-1 14-11Z" stroke="currentColor" stroke-width="1.5"/><path d="m4 21 10-11" stroke="currentColor" stroke-width="1.5"/></svg>';
const star = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z" stroke="currentColor" stroke-width="1.5"/></svg>';
const names = ['Multiply', 'Subtract', 'Divide', 'Add'];

document.querySelector('#app').innerHTML = `
  <header class="topbar">
    <a href="./" class="brand" aria-label="Mathventures home"><span class="brand-mark">${star}</span>mathventures<span class="brand-dot">.</span></a>
    <div class="edition">THE GLIMMERWOOD TRIALS <span>•</span> A MATH ADVENTURE</div>
    <div class="header-actions"><button class="icon-button" id="sound" aria-label="Turn sound on" aria-pressed="false">♫<span class="sound-label"> Sound off</span></button><button class="help-button" id="help">How to play <span>?</span></button></div>
  </header>
  <main>
    <section class="chapter-heading"><div><p class="eyebrow">A LITTLE COURAGE. A LITTLE CALCULATION.</p><h1>The Glimmerwood Trials</h1><p class="chapter-subtitle">Find the missing signs. Bring the forest back to life.</p></div><div class="chapter-stamp">${leaf}<span>CHAPTER ONE<small>The awakening</small></span></div></section>
    <div class="game-layout">
      <section class="adventure" aria-label="Adventure battle">
        <div class="location-bar"><span><i class="live-dot"></i><span id="location-name">The Mosslight Clearing</span></span><span id="encounter-number">ENCOUNTER 01 / 04</span></div>
        <div class="arena">
          <div id="forest" role="img" aria-label="A lantern keeper faces a woodland guardian in a glowing forest"></div>
          <div class="arena-vignette"></div>
          <div class="fighter-hud player-hud"><span class="fighter-label">YOU <span>✦</span> THE LANTERN KEEPER</span><div class="health-line"><span id="player-health">100 <small>/ 100</small></span><span class="heart">♥</span></div><div class="health-track" role="progressbar" aria-label="Your health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div id="player-health-fill"></div></div></div>
          <div class="fighter-hud enemy-hud"><span class="fighter-label" id="enemy-title">THE OVERGROWN GATEKEEPER</span><div class="health-line"><span id="enemy-name">Mossling</span><span id="enemy-health">30 / 30</span></div><div class="health-track enemy-track" role="progressbar" aria-label="Guardian health" aria-valuemin="0" aria-valuemax="30" aria-valuenow="30"><div id="enemy-health-fill"></div></div></div>
          <div class="stage-caption"><span class="tiny-diamond">✧</span><span id="stage-caption">A little wild magic has taken root.</span><span class="tiny-diamond">✧</span></div>
        </div>
        <div class="spell-panel" id="spell-panel">
          <div class="spell-topline"><span class="eyebrow" id="spell-label">YOUR FIRST SPELL AWAITS</span><span class="streak" id="streak">✦ <span>0</span> STREAK</span></div>
          <div id="welcome" class="welcome"><h2>A little math. A little magic.</h2><p>The forest has lost its light. Choose the missing operator to cast a spell and gently free its guardians.</p><button id="begin" class="primary-button">Begin adventure <span>→</span></button><span class="welcome-note">Four guardians · No time limit · All you need is a little curiosity</span></div>
          <div id="puzzle-area" hidden><h2 class="puzzle-instruction">Which sign completes the spell?</h2><div class="equation" id="equation" aria-label=""></div><div class="operator-choices" id="choices">${OPERATORS.map((operator, i) => `<button class="operator" data-operator="${operator}" aria-label="${names[i]}, keyboard ${i + 1}"><span class="operator-symbol">${operator}</span><span class="operator-name">${names[i]}</span><kbd>${i + 1}</kbd></button>`).join('')}</div><p class="feedback" id="feedback" role="status" aria-live="polite">Every correct sign is a little light in the dark.</p></div>
          <div class="spell-footer"><span>◷ Take your time. There’s no rush.</span><span>CLICK, TAP, OR PRESS <kbd>1</kbd>–<kbd>4</kbd></span></div>
        </div>
      </section>
      <aside class="sidebar">
        <section class="journey-card"><div class="card-overline">YOUR JOURNEY <span>✧</span></div><h2>A path to the light</h2><p>Four guardians. One brighter forest.</p><ol class="journey-list">${ENCOUNTERS.map((enemy, i) => `<li data-step="${i}" class="${i === 0 ? 'current' : ''}"><span class="journey-node">${String(i + 1).padStart(2, '0')}</span><div><strong>${enemy.name}</strong><span>${['Mosslight Clearing', 'The Violet Thicket', 'Oldstone Crossing', 'The Heartwood'][i]}</span></div><span class="step-status">${i === 0 ? '◈' : '·'}</span></li>`).join('')}</ol><div class="journey-foot">${leaf}<span>Small steps. Remarkable things.</span></div></section>
        <section class="spellbook-card"><span class="book-icon">✦</span><p class="eyebrow">FROM YOUR SPELLBOOK</p><h2>Keep the magic flowing.</h2><p>Correct answers build your streak and make each spell stronger.</p><div class="spellbook-rule"><span>✧</span> A new guardian restores <strong>10 HP</strong>.</div></section>
        <div class="session-stats"><div><span id="stat-correct">00</span><small>SPELLS CAST</small></div><div><span id="stat-best">00</span><small>BEST STREAK</small></div></div>
        <button id="restart" class="restart-button">↺ <span>Start a fresh adventure</span></button>
      </aside>
    </div>
    <footer class="page-footer"><span>${leaf} Made for curious minds & brave little hearts.</span><span>MATHVENTURES <i>✧</i> PROTOTYPE 0.1</span></footer>
  </main>
  <dialog id="guide" class="modal"><button class="close-button" id="close-guide" aria-label="Close how to play">×</button><span class="modal-emblem">${star}</span><p class="eyebrow">A LANTERN KEEPER’S GUIDE</p><h2>Let the numbers lead.</h2><p>Choose the one operator that makes the equation true. Tap a sign, use Tab and Enter, or press <strong>1–4</strong>.</p><div class="example-equation">5 <span>×</span> 0 = 0</div><ul><li><strong>A correct answer casts a spell.</strong> Consecutive answers increase damage, up to 24.</li><li><strong>A missed answer costs health.</strong> We’ll show you the completed equation so you can learn.</li><li><strong>Free all four guardians.</strong> Recover up to 10 health between encounters. There’s no timer.</li></ul><button id="got-it" class="primary-button">I’m ready <span>→</span></button></dialog>
  <dialog id="result" class="modal result-modal"><span id="result-emblem" class="modal-emblem">${leaf}</span><p id="result-eyebrow" class="eyebrow"></p><h2 id="result-title"></h2><p id="result-description"></p><div class="result-stats"><div><strong id="result-accuracy"></strong><span>ACCURACY</span></div><div><strong id="result-streak"></strong><span>BEST STREAK</span></div><div><strong id="result-spells"></strong><span>SPELLS CAST</span></div></div><button id="play-again" class="primary-button">Another adventure <span>→</span></button></dialog>
`;

const $ = (selector) => document.querySelector(selector);
// Stable semantic hooks for browser accessibility and embedding checks.
const question = document.createElement('div');
question.id = 'question';
$('#equation').before(question);
question.append($('#equation'));
document.querySelectorAll('[data-operator]').forEach((button) => { button.dataset.answer = button.dataset.operator; });
$('#begin').insertAdjacentHTML('beforebegin', `<fieldset class="mode-picker"><legend>Choose your trail</legend><label><input type="radio" name="mode" value="adventure" checked><span><strong>Adventure</strong><small>The original challenge</small></span></label><label><input type="radio" name="mode" value="relaxed"><span><strong>Relaxed</strong><small>Gentler guardian attacks</small></span></label></fieldset>`);
$('#feedback').insertAdjacentHTML('beforebegin', `<div class="supplies-bar"><span id="potion-hint">A little help, when you need it.</span><button id="potion" class="potion-button" aria-label="Use your one healing potion to restore up to 35 health" disabled><span aria-hidden="true">✚</span> Potion <span id="potion-count">1</span></button></div>`);
$('.enemy-track').insertAdjacentHTML('afterend', '<p class="enemy-intent" id="enemy-intent"></p>');
$('.result-stats').insertAdjacentHTML('beforebegin', '<p class="result-summary" id="result-summary"></p>');
$('.mode-picker').insertAdjacentHTML('beforebegin', '<div class="resume-card" id="resume-card" hidden><p id="resume-summary"></p><button id="continue-button" class="primary-button">Continue adventure <span>→</span></button></div>');
$('#begin').insertAdjacentHTML('beforebegin', '<label class="remember-setting"><input id="remember-save" type="checkbox" checked> Remember this journey on this device</label>');
$('.welcome-note').insertAdjacentHTML('afterend', '<p id="storage-notice" class="storage-notice"></p><div class="local-journal"><p id="last-journey" hidden></p><p id="personal-best" hidden></p></div>');
$('.spell-footer').insertAdjacentHTML('afterbegin', '<span id="save-status" class="save-status" aria-live="polite"></span>');
const scene = new ForestScene();
const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'forest', width: 1000, height: 450,
  backgroundColor: '#153a35', scene, render: { antialias: true },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  audio: { noAudio: true },
});

let state = createGame();
let selectedMode = 'adventure';
let started = false;
let locked = false;
let turnTimeout;
let pointerInteractions = 0;
let soundOn = false;
let audioContext;
let storageAvailable = true;
const SAVE_KEY = 'mathventures-save-v1';
const RESULT_KEY = 'mathventures-result-v1';
const BEST_KEY = (mode) => `mathventures-best-${mode}-v1`;
let savedRun = parseSave(readStorage(SAVE_KEY));
let lastResult = parseResult(readStorage(RESULT_KEY));
const bestResults = {
  adventure: readBest('adventure'),
  relaxed: readBest('relaxed'),
};
let rememberSave = readStorage('mathventures-remember') !== 'off';
$('#remember-save').checked = rememberSave;
try { soundOn = localStorage.getItem('mathventures-sound') === 'on'; } catch { /* Storage is optional in embedded games. */ }

function readStorage(key) {
  try { return localStorage.getItem(key); }
  catch { storageAvailable = false; return null; }
}

function writeStorage(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    return true;
  } catch { storageAvailable = false; return false; }
}

function readBest(mode) {
  const result = parseResult(readStorage(BEST_KEY(mode)));
  return result?.mode === mode ? result : null;
}

function resultDescription(result) {
  const mode = result.mode === 'relaxed' ? 'Relaxed' : 'Adventure';
  const accuracy = Math.round(result.correct / Math.max(1, result.attempts) * 100);
  return `${mode} · ${result.guardiansFreed} of 4 guardians freed · ${accuracy}% accuracy · best streak ${result.bestStreak}`;
}

function renderLocalProgress() {
  $('#resume-card').hidden = started || !savedRun;
  if (savedRun) $('#resume-summary').textContent = `${savedRun.mode === 'relaxed' ? 'Relaxed' : 'Adventure'} trail · Guardian ${savedRun.encounterIndex + 1} of 4 · ${savedRun.playerHp} HP`;
  $('#begin').innerHTML = `${savedRun ? 'Begin new adventure' : 'Begin adventure'} <span>→</span>`;
  $('#storage-notice').textContent = storageAvailable
    ? rememberSave ? 'Progress saves on this device after each spell.' : 'Progress saving is off for your next adventure.'
    : 'Saving is unavailable in this browser. You can still play.';
  $('#last-journey').hidden = !lastResult;
  if (lastResult) $('#last-journey').textContent = `Last journey: ${resultDescription(lastResult)}`;
  const best = bestResults[selectedMode];
  $('#personal-best').hidden = !best;
  if (best) $('#personal-best').textContent = `Personal best: ${resultDescription(best)}`;
  $('#save-status').textContent = started ? !storageAvailable ? 'Saving unavailable' : rememberSave ? 'Journey saved locally' : 'Saving off' : '';
}

// Persist the accepted turn immediately, before its animation finishes. Reloading
// resumes the next question and cannot replay damage, healing, or a potion.
function persistProgress(next) {
  if (next.status === 'playing') {
    savedRun = next;
    if (rememberSave) writeStorage(SAVE_KEY, serializeSave(next));
    else writeStorage(SAVE_KEY, null);
  } else {
    savedRun = null;
    writeStorage(SAVE_KEY, null);
    const result = summarizeResult(next);
    const serialized = serializeResult(next);
    if (result && serialized) {
      lastResult = result;
      writeStorage(RESULT_KEY, serialized);
      const best = selectBestResult(bestResults[next.mode], result);
      if (best === result) {
        bestResults[next.mode] = result;
        writeStorage(BEST_KEY(next.mode), serialized);
      }
    }
  }
  renderLocalProgress();
}

function syncSound() {
  $('#sound').setAttribute('aria-pressed', String(soundOn));
  $('#sound').setAttribute('aria-label', `Turn sound ${soundOn ? 'off' : 'on'}`);
  $('.sound-label').textContent = ` Sound ${soundOn ? 'on' : 'off'}`;
}

function chime(correct) {
  if (!soundOn) return;
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audioContext ??= new Audio();
    void audioContext.resume();
    const now = audioContext.currentTime;
    (correct ? [523.25, 659.25, 783.99] : [220, 174.61]).forEach((frequency, i) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.045, now + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);
      oscillator.connect(gain); gain.connect(audioContext.destination);
      oscillator.start(now + i * 0.07); oscillator.stop(now + i * 0.07 + 0.45);
    });
  } catch { /* Gameplay continues if audio is unavailable. */ }
}

function render() {
  const enemy = ENCOUNTERS[state.encounterIndex];
  document.body.classList.toggle('is-playing', started && state.status === 'playing');
  $('#welcome').hidden = started;
  $('#puzzle-area').hidden = !started;
  $('#spell-label').textContent = started ? 'YOUR TURN · CAST A SPELL' : 'YOUR FIRST SPELL AWAITS';
  $('#player-health').innerHTML = `${state.playerHp} <small>/ ${state.maxPlayerHp}</small>`;
  $('#player-health-fill').style.width = `${state.playerHp}%`;
  $('.player-hud .health-track').setAttribute('aria-valuenow', state.playerHp);
  $('.player-hud').classList.toggle('low-health', state.playerHp < 30);
  $('#enemy-name').textContent = enemy.name;
  $('#enemy-title').textContent = enemy.title.toUpperCase();
  $('#enemy-health').textContent = `${state.enemyHp} / ${enemy.hp}`;
  $('#enemy-health-fill').style.width = `${state.enemyHp / enemy.hp * 100}%`;
  $('.enemy-track').setAttribute('aria-valuemax', enemy.hp);
  $('.enemy-track').setAttribute('aria-valuenow', state.enemyHp);
  const attack = getEnemyAttack(state);
  const lethal = state.playerHp <= attack;
  $('#enemy-intent').textContent = lethal ? `Next miss ends your run · −${attack} HP` : `If wrong: −${attack} HP`;
  $('#enemy-intent').classList.toggle('lethal', lethal);
  $('#stage-caption').textContent = enemy.description;
  $('#location-name').textContent = ['The Mosslight Clearing', 'The Violet Thicket', 'Oldstone Crossing', 'The Heartwood'][state.encounterIndex];
  $('#encounter-number').textContent = `ENCOUNTER ${String(state.encounterIndex + 1).padStart(2, '0')} / 04`;
  $('#streak span').textContent = state.streak;
  $('#streak').classList.toggle('active', state.streak > 1);
  $('#stat-correct').textContent = String(state.correct).padStart(2, '0');
  $('#stat-best').textContent = String(state.bestStreak).padStart(2, '0');
  $('#potion').disabled = !started || locked || state.status !== 'playing' || state.potions === 0 || state.playerHp === state.maxPlayerHp;
  $('#potion-count').textContent = state.potions;
  $('#potion-hint').textContent = state.potions === 0 ? 'Your potion has been used.' : state.playerHp === state.maxPlayerHp ? 'Health full. Save your potion for later.' : 'One potion. Restore up to 35 HP.';
  $('#potion').setAttribute('aria-label', state.potions === 0 ? 'Healing potion already used' : state.playerHp === state.maxPlayerHp ? 'Healing potion unavailable: health is full' : 'Use healing potion to restore up to 35 health');
  const p = state.puzzle;
  $('#equation').innerHTML = `<span>${p.left}</span><span class="missing-sign">?</span><span>${p.right}</span><span class="equals">=</span><span>${p.result}</span>`;
  $('#equation').setAttribute('aria-label', `${p.left}, missing operator, ${p.right}, equals ${p.result}`);
  document.querySelectorAll('.operator').forEach((button) => { button.disabled = !started || locked || state.status !== 'playing'; button.classList.remove('correct', 'incorrect'); });
  document.querySelectorAll('[data-step]').forEach((item, i) => {
    const done = i < state.encounterIndex || state.status === 'victory';
    item.classList.toggle('complete', done);
    item.classList.toggle('current', !done && i === state.encounterIndex);
    item.querySelector('.journey-node').textContent = done ? '✓' : String(i + 1).padStart(2, '0');
    item.querySelector('.step-status').textContent = done ? '✓' : i === state.encounterIndex ? '◈' : '·';
    if (i === state.encounterIndex) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  if (scene.sys.isActive()) scene.setEncounter(state.encounterIndex);
  renderLocalProgress();
}

function start() {
  clearTimeout(turnTimeout);
  state = createGame(Math.random, selectedMode); started = true; locked = false;
  rememberSave = $('#remember-save').checked;
  writeStorage('mathventures-remember', rememberSave ? 'on' : 'off');
  persistProgress(state);
  $('#result').close();
  $('#feedback').className = 'feedback';
  $('#feedback').textContent = 'Every correct sign is a little light in the dark.';
  render();
  $('.operator').focus({ preventScroll: true });
}

function answer(operator, inputSource = 'pointer') {
  if (!started || locked || state.status !== 'playing' || $('#guide').open || $('#result').open) return;
  const chosenButton = document.querySelector(`[data-operator="${operator}"]`);
  const pointerCountAtAnswer = pointerInteractions;
  locked = true;
  const next = resolveAnswer(state, operator);
  persistProgress(next);
  const turn = next.lastTurn;
  $('#potion').disabled = true;
  document.querySelectorAll('.operator').forEach((button) => {
    button.disabled = true;
    if (button.dataset.operator === turn.answer) button.classList.add('correct');
    if (!turn.correct && button.dataset.operator === operator) button.classList.add('incorrect');
  });
  const message = turn.correct
    ? turn.enemyDefeated ? `${ENCOUNTERS[state.encounterIndex].name} is free! ${next.status === 'victory' ? 'The light returns.' : `Onward to the next guardian.${turn.healed > 0 ? ` +${turn.healed} HP` : ' Your health is full.'}`}` : `Beautifully done! ${turn.damage} spell damage${next.streak > 1 ? ` · ${next.streak} in a row` : ''}.`
    : `The spell was ${turn.equation}. You lose ${turn.damage} HP. Take a breath; you’ve got this.`;
  $('#feedback').className = `feedback ${turn.correct ? 'success' : 'mistake'}`;
  $('#feedback').textContent = message;
  $('#equation .missing-sign').textContent = turn.answer;
  $('#equation .missing-sign').classList.add(turn.correct ? 'resolved' : 'revealed');
  $('#equation').setAttribute('aria-label', turn.equation);
  scene.cast(turn.correct, turn.damage);
  chime(turn.correct);
  turnTimeout = setTimeout(() => {
    state = next; locked = false; render();
    if (state.status !== 'playing') showResult();
    else if (inputSource === 'keyboard' && pointerInteractions === pointerCountAtAnswer
      && !$('#guide').open && !$('#result').open
      && (document.activeElement === document.body || document.activeElement === chosenButton)) {
      chosenButton.focus({ preventScroll: true });
    }
  }, turn.correct ? 1050 : 1700);
}

function showResult() {
  const won = state.status === 'victory';
  $('#result-eyebrow').textContent = won ? 'THE GLIMMERWOOD SHINES AGAIN' : 'EVERY ADVENTURE IS A LESSON';
  $('#result-title').textContent = won ? 'You brought the light.' : 'Rest your lantern.';
  $('#result-description').textContent = won ? 'Four guardians freed. A forest awakened. Your courage and a little calculation made all the difference.' : 'The forest will wait for you. Try again, take your time, and let each equation teach you something new.';
  $('#result-accuracy').textContent = `${Math.round(state.correct / Math.max(1, state.attempts) * 100)}%`;
  $('#result-streak').textContent = state.bestStreak;
  $('#result-spells').textContent = state.correct;
  const freed = state.encounterIndex + Number(won);
  $('#result-summary').textContent = `${state.mode === 'relaxed' ? 'Relaxed' : 'Adventure'} trail · ${freed} of ${ENCOUNTERS.length} guardians freed`;
  $('#result').showModal();
}

document.querySelectorAll('input[name="mode"]').forEach((input) => input.addEventListener('change', () => {
  selectedMode = input.value;
  renderLocalProgress();
}));
$('#remember-save').addEventListener('change', () => {
  rememberSave = $('#remember-save').checked;
  renderLocalProgress();
});
$('#continue-button').addEventListener('click', () => {
  if (!savedRun) return;
  clearTimeout(turnTimeout);
  state = savedRun;
  selectedMode = state.mode;
  document.querySelector(`input[name="mode"][value="${selectedMode}"]`).checked = true;
  rememberSave = $('#remember-save').checked;
  started = true; locked = false;
  $('#feedback').className = 'feedback';
  $('#feedback').textContent = 'Your lantern is right where you left it. Welcome back.';
  persistProgress(state);
  render();
  $('.operator').focus({ preventScroll: true });
});
$('#potion').addEventListener('click', () => {
  if (!started || locked) return;
  const next = usePotion(state);
  if (next === state) return;
  const healed = next.playerHp - state.playerHp;
  state = next;
  persistProgress(state);
  render();
  $('#feedback').className = 'feedback success';
  $('#feedback').textContent = `A quiet moment. Your potion restored ${healed} HP. The same spell is waiting for you.`;
  chime(true);
});
$('#begin').addEventListener('click', start);
$('#restart').addEventListener('click', start);
$('#play-again').addEventListener('click', start);
$('#choices').addEventListener('click', (event) => {
  const button = event.target.closest('[data-operator]');
  if (button) answer(button.dataset.operator, event.detail === 0 ? 'keyboard' : 'pointer');
});
$('#help').addEventListener('click', () => $('#guide').showModal());
$('#close-guide').addEventListener('click', () => $('#guide').close());
$('#got-it').addEventListener('click', () => $('#guide').close());
$('#result').addEventListener('cancel', (event) => event.preventDefault());
$('#sound').addEventListener('click', () => {
  soundOn = !soundOn; syncSound();
  try { localStorage.setItem('mathventures-sound', soundOn ? 'on' : 'off'); } catch { /* Optional. */ }
  if (soundOn) chime(true);
});
document.addEventListener('pointerdown', () => { pointerInteractions += 1; }, { passive: true });
document.addEventListener('keydown', (event) => {
  if (event.repeat) {
    if ((event.key === 'Enter' || event.key === ' ') && event.target instanceof Element
      && event.target.closest('[data-operator]')) event.preventDefault();
    return;
  }
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < 4 && /^\d$/.test(event.key)) { event.preventDefault(); answer(OPERATORS[index], 'keyboard'); }
});
window.addEventListener('pagehide', (event) => {
  if (event.persisted) return;
  clearTimeout(turnTimeout);
  game.destroy(true);
  void audioContext?.close();
});
syncSound(); render();

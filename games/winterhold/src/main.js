import Phaser from 'phaser';
import { WORLD, BUILDINGS, createGame, stepGame, nearestInteraction, atBase, getBuildInfo, interact, build, train, eat, repair } from './engine.js';
import './style.css';

const icons = {
  wood: '<path d="m5 9 14-5 7 5-14 5z" fill="#c8874d"/><path d="m5 9 7 5v10l-7-5z" fill="#8b583b"/><path d="m12 14 14-5v10l-14 5z" fill="#dda364"/><ellipse cx="9" cy="16" rx="2" ry="4" fill="none" stroke="#ffe1a0" stroke-width="1.5"/>',
  stone: '<path d="m3 20 4-12 13-3 9 12-8 9-15-1z" fill="#8aabb2"/><path d="m7 8 10 8 12 1-9-12z" fill="#cfdfdb"/><path d="m17 16 4 10 8-9z" fill="#557b87"/>',
  food: '<path d="M16 15Q9 3 22 4q5 8-6 11" fill="#75a84a"/><circle cx="10" cy="20" r="7" fill="#da695b"/><circle cx="22" cy="20" r="7" fill="#bd494e"/><circle cx="16" cy="25" r="5" fill="#ef9470"/>',
  people: '<circle cx="16" cy="10" r="6" fill="#f4d6a2"/><path d="M6 29v-8a10 10 0 0 1 20 0v8" fill="#d5e9d3"/><path d="M12 5h8l3 5H9z" fill="#deae57"/>',
  shield: '<path d="m16 3 12 5-2 14-10 8L6 22 4 8z" fill="#81b9ad" stroke="#dfecd6" stroke-width="2"/><path d="m16 8 7 3-2 9-5 4z" fill="#407975"/>',
  home: '<path d="M5 15h22v14H5z" fill="#d8b582"/><path d="m2 16 14-13 14 13z" fill="#c86d46"/><path d="M12 19h8v10h-8z" fill="#5e5947"/>',
  tower: '<path d="M8 12h16l-2 18H10z" fill="#b08b62"/><path d="M5 6h22v9H5z" fill="#efc779"/><path d="m2 6 14-6 14 6z" fill="#cf7048"/><path d="M12 17h8v6h-8z" fill="#4a6961"/>',
  fence: '<path d="M3 12h26v5H3zm0 10h26v4H3z" fill="#8e6245"/><path d="m7 1 4 6v24H3V7zm18 0 4 6v24h-8V7z" fill="#d4a363"/>',
  flag: '<path d="M8 31V2" stroke="#dec89a" stroke-width="3"/><path d="M10 3h19l-6 7 6 7H10z" fill="#e0a74c"/><path d="m14 24 4-8 4 8z" fill="#8f6d45"/>',
};
const icon = (name) => `<svg viewBox="0 0 32 32" aria-hidden="true">${icons[name] || icons.home}</svg>`;
document.querySelector('#app').innerHTML = `
  <main id="game-shell" aria-label="Winterhold survival game">
    <div id="game-world" aria-label="Game world. Move with WASD or arrow keys, hold Space to gather." role="application" tabindex="0"></div>
    <header class="topbar">
      <div class="brand"><span class="brand-mark">W</span><div>WINTERHOLD<small>THE LAST HEARTH</small></div></div>
      <div class="resources" aria-label="Resources">
        ${['wood', 'stone', 'food'].map(r => `<div class="resource" title="${r === 'food' ? 'Food pays for recruits, guards, and healing' : `Gather ${r} in the wilds to build your refuge`}">${icon(r)}<span><strong id="${r}-count">0</strong><small>${r}</small></span></div>`).join('')}
      </div>
      <div class="menu-buttons"><button id="sound-button" class="icon-button" aria-label="Enable sound" title="Sound off">♪<span class="sound-slash">╱</span></button><button id="help-button" class="icon-button" aria-label="Help" title="How to play">?</button><button id="pause-button" class="icon-button" aria-label="Pause game" title="Pause (P)">Ⅱ</button></div>
    </header>
    <section class="status-strip" aria-label="Settlement status">
      <div class="countdown"><span id="season-label">WINTER ARRIVES IN</span><strong id="winter-timer">2:30</strong><span id="wave-count"></span></div>
      <div class="population" title="Untrained settlers throw stones at intruders near the hearth, even while you explore. Guards strike harder and defend farther out.">${icon('people')}<span><strong id="settler-count">2 / 4</strong><small>settlers / beds</small></span>${icon('shield')}<span><strong id="guard-count">0</strong><small>guards</small></span></div>
    </section>
    <section class="hearth-card" aria-label="Hearth health"><span>♨ <b>THE HEARTH</b><strong id="hearth-health">280 / 280</strong></span><div class="health-track"><div id="hearth-bar"></div></div><p id="objective">Make a home. Build a longhouse.</p></section>
    <div class="map-card"><canvas id="minimap" width="150" height="112" aria-label="Map of resources and refuge"></canvas><button id="return-button" title="Show the way back to the hearth">⌂ <span id="return-label">Hearth nearby</span></button></div>
    <div id="toast" role="status" aria-live="polite"></div>
    <div id="location-label">THE HEARTH · A NEW BEGINNING</div>
    <section class="player-card" aria-label="Keeper health"><span>KEEPER <b id="player-health">100</b></span><div class="health-track"><div id="player-bar"></div></div><button id="eat-button" title="Eat provisions: 4 food restores 40 keeper health">Eat · 4 food</button></section>
    <div id="joystick" aria-label="Touch movement joystick"><div id="joystick-knob"></div></div>
    <div class="action-area"><div id="context-hint">Explore the wilds for supplies</div><button id="action-button" class="action-button" aria-label="Interact with nearby resource or camp">${icon('wood')}<span id="action-label">Find supplies</span><kbd>SPACE</kbd></button></div>
    <section class="build-dock" aria-label="Build at the hearth"><div class="dock-caption"><b>RAISE YOUR REFUGE</b><span id="build-range">Build near the hearth</span></div><div class="build-buttons">
      ${Object.entries(BUILDINGS).map(([kind, spec]) => `<button id="build-${kind}" class="build-button" title="${spec.description} Costs ${spec.wood} wood, ${spec.stone} stone.">${icon(({ shelter: 'home', barricade: 'fence', watchtower: 'tower', barracks: 'flag' })[kind])}<span class="build-name">${spec.name}</span><span class="build-cost">${spec.wood} wood · ${spec.stone} stone</span><span class="build-number">0/${spec.max}</span></button>`).join('')}
      <button id="train-button" class="build-button train-button" title="Train a settler as a guard. Requires a training yard. Costs 5 wood, 5 food.">${icon('shield')}<span class="build-name">Train guard</span><span class="build-cost">5 wood · 5 food</span><span class="build-number">+</span></button>
    </div><div class="dock-footer"><span><kbd>WASD</kbd> / <kbd>↑↓←→</kbd> move · Hold <kbd>SPACE</kbd> gather · Auto combat</span><button id="repair-button" title="Repair at the hearth: 8 wood restores 65 hearth health">Repair hearth · 8 wood</button></div></section>
    <div id="modal" class="modal"><section class="modal-panel" aria-labelledby="modal-title"><div class="eyebrow" id="modal-eyebrow">A SMALL SURVIVAL ADVENTURE</div><div class="modal-emblem">${icon('home')}<span>✦</span></div><h1 id="modal-title">Winterhold</h1><p class="subtitle" id="modal-subtitle">The last hearth starts with you.</p><div id="modal-content"><p>Beyond these embers, the wilds are full of promise.<br>Gather, welcome, and prepare. Winter is coming.</p><div class="intro-steps"><div><b>01</b><span><strong>Explore the valley</strong>Walk close to trees, rocks, and berries. Hold Space or tap Gather.</span></div><div><b>02</b><span><strong>Build a home</strong>Recruit at camps. Settlers throw stones at hearth intruders while you explore.</span></div><div><b>03</b><span><strong>Hold the hearth</strong>Train stronger guards, build towers and palisades. Everyone fights automatically.</span></div></div><p class="modal-controls">WASD / arrow keys to move · Touch joystick on mobile<br>Gather & recruit nearby · Build & train at the hearth · P pauses</p></div><button id="start-game" class="primary-button">Found the refuge <span>→</span></button><button id="resume-game" class="primary-button" hidden>Return to the wilds <span>→</span></button><button id="restart-game" class="primary-button" hidden>Build a new beginning <span>↻</span></button><small class="session-note" id="session-note">One valley. One winter. About 3–4 minutes.</small></section></div>
  </main>`;

let state = createGame();
state.paused = true;
let started = false, scene, held = false, actionPointer, shownEvent = 0, lastHud = 0, showHomeUntil = 0;
let soundEnabled = false, audioContext;
let touch = { x: 0, y: 0 }, pointerTarget = null;
const $ = (id) => document.getElementById(id);
const initialContent = $('modal-content').innerHTML;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function sound(pitch = 440) {
  if (!soundEnabled) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioContext.createOscillator(), volume = audioContext.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(pitch, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, audioContext.currentTime + 0.13);
    volume.gain.setValueAtTime(0.04, audioContext.currentTime); volume.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.16);
    osc.connect(volume); volume.connect(audioContext.destination); osc.start(); osc.stop(audioContext.currentTime + 0.17);
  } catch { soundEnabled = false; }
}
function perform(fn) { const ok = fn(); if (ok) sound(560); updateHud(); return ok; }
function openModal(mode) {
  state.paused = true; held = false; actionPointer = undefined; touch = { x: 0, y: 0 }; pointerTarget = null;
  releaseStick();
  $('modal').hidden = false;
  $('start-game').hidden = started;
  $('resume-game').hidden = !started || mode === 'ended';
  $('restart-game').hidden = mode !== 'ended';
  $('modal-emblem')?.removeAttribute('hidden');
  if (mode === 'ended') {
    const won = state.status === 'won';
    $('modal-eyebrow').textContent = won ? 'YOUR PEOPLE HAVE A HOME' : 'THE VALLEY WILL REMEMBER';
    $('modal-title').textContent = won ? 'A hearth that held.' : 'Even embers begin again.';
    $('modal-subtitle').textContent = won ? 'The first winter is yours.' : state.player.hp <= 0 ? 'The keeper fell in the wilds.' : 'The winter horde reached your hearth.';
    $('modal-content').innerHTML = `<p>${won ? 'Through your care, strangers became neighbors and a clearing became a home.' : 'Build towers early, train your settlers, and stay near the hearth when winter arrives.'}</p><div class="result-stats"><div><b>${state.stats.recruited}</b><span>settlers welcomed</span></div><div><b>${state.stats.built}</b><span>buildings raised</span></div><div><b>${state.stats.slain}</b><span>threats defeated</span></div></div>`;
    $('session-note').textContent = 'Every new beginning is a chance to build something stronger.';
    $('restart-game').focus();
  } else if (started) {
    $('modal-eyebrow').textContent = mode === 'help' ? 'FIELD NOTES' : 'THE FIRE CAN WAIT';
    $('modal-title').textContent = mode === 'help' ? 'Keep the hearth alive.' : 'A moment by the fire.';
    $('modal-subtitle').textContent = 'Winter waits while this screen is open.';
    $('modal-content').innerHTML = initialContent;
    $('session-note').textContent = 'Tip: two watchtowers and several guards make a strong refuge.';
    $('resume-game').focus();
  }
  $('pause-button').setAttribute('aria-label', 'Resume game');
}
function resume() {
  started = true; state.paused = false; $('modal').hidden = true;
  $('pause-button').setAttribute('aria-label', 'Pause game');
  $('game-world').focus({ preventScroll: true });
  sound(330);
}
$('start-game').addEventListener('click', resume);
$('resume-game').addEventListener('click', resume);
$('restart-game').addEventListener('click', () => {
  state = createGame(); shownEvent = 0; scene?.resetView(); resume(); updateHud();
});
$('pause-button').addEventListener('click', () => { if (!started || state.status !== 'playing') return; state.paused ? resume() : openModal('pause'); });
$('help-button').addEventListener('click', () => { if (state.status === 'playing') openModal('help'); });
$('sound-button').addEventListener('click', () => {
  soundEnabled = !soundEnabled; $('sound-button').classList.toggle('enabled', soundEnabled);
  $('sound-button').setAttribute('aria-label', soundEnabled ? 'Mute sound' : 'Enable sound'); sound(660);
});
for (const kind of Object.keys(BUILDINGS)) $(`build-${kind}`).addEventListener('click', () => perform(() => build(state, kind)));
$('train-button').addEventListener('click', () => perform(() => train(state)));
$('eat-button').addEventListener('click', () => perform(() => eat(state)));
$('repair-button').addEventListener('click', () => perform(() => repair(state)));
$('return-button').addEventListener('click', () => { showHomeUntil = performance.now() + 12000; $('context-hint').textContent = 'Follow the golden arrow home'; });
$('action-button').addEventListener('pointerdown', (e) => {
  if (actionPointer !== undefined) return;
  e.preventDefault(); actionPointer = e.pointerId;
  $('action-button').setPointerCapture(e.pointerId);
  held = nearestInteraction(state)?.kind === 'gather';
  perform(() => interact(state));
});
function releaseAction(e) { if (e.pointerId === actionPointer) { held = false; actionPointer = undefined; } }
$('action-button').addEventListener('pointerup', releaseAction);
$('action-button').addEventListener('pointercancel', releaseAction);
$('action-button').addEventListener('lostpointercapture', releaseAction);
$('action-button').addEventListener('keydown', (e) => { if (e.code === 'Enter' || e.code === 'Space') { e.preventDefault(); if (!e.repeat || nearestInteraction(state)?.kind === 'gather') perform(() => interact(state)); } });
window.addEventListener('keydown', (e) => {
  if (!e.repeat && (e.code === 'KeyP' || e.code === 'Escape')) { if (started && state.status === 'playing') state.paused ? resume() : openModal('pause'); }
});
document.addEventListener('visibilitychange', () => { if (document.hidden && started && state.status === 'playing' && !state.paused) openModal('pause'); });
window.addEventListener('blur', () => { held = false; touch = { x: 0, y: 0 }; if (started && state.status === 'playing' && !state.paused) openModal('pause'); });
const joystick = $('joystick');
let joystickPointer;
function moveStick(e) {
  const box = joystick.getBoundingClientRect(), dx = e.clientX - box.x - box.width / 2, dy = e.clientY - box.y - box.height / 2;
  const d = Math.hypot(dx, dy), scale = Math.min(1, 36 / Math.max(1, d));
  touch = { x: dx * scale / 36, y: dy * scale / 36 };
  $('joystick-knob').style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
}
joystick.addEventListener('pointerdown', (e) => { if (state.paused || joystickPointer !== undefined) return; joystickPointer = e.pointerId; joystick.setPointerCapture(e.pointerId); moveStick(e); });
joystick.addEventListener('pointermove', (e) => { if (e.pointerId === joystickPointer) moveStick(e); });
function releaseStick() { joystickPointer = undefined; touch = { x: 0, y: 0 }; $('joystick-knob').style.transform = ''; }
joystick.addEventListener('pointerup', releaseStick); joystick.addEventListener('pointercancel', releaseStick);
joystick.addEventListener('lostpointercapture', releaseStick);

const color = { green: 0x7fa772, dark: 0x244e43, grass: 0x9bbb7b, bark: 0x8b6547, cream: 0xf5e4bd, gold: 0xefbe67, stone: 0xa8bfbb, red: 0xbd6549, shadow: 0x284c43 };
function poly(g, points, fill, alpha = 1) { g.fillStyle(fill, alpha); g.fillPoints(points.map(([x, y]) => ({ x, y })), true); }
function ellipse(g, x, y, w, h, fill, alpha = 1) { g.fillStyle(fill, alpha); g.fillEllipse(x, y, w, h); }
function rect(g, x, y, w, h, fill, r = 0) { g.fillStyle(fill); r ? g.fillRoundedRect(x, y, w, h, r) : g.fillRect(x, y, w, h); }
function tree(g, x, y, scale = 1, depleted = false, variant = 0) {
  ellipse(g, x + 6, y + 4, 60 * scale, 23 * scale, color.shadow, 0.15);
  rect(g, x - 5 * scale, y - 29 * scale, 10 * scale, 33 * scale, color.bark, 3);
  if (depleted) { ellipse(g, x, y - 3, 17 * scale, 9 * scale, 0xdbb67c); return; }
  const leaf = variant % 3 === 0 ? 0x407f62 : variant % 3 === 1 ? 0x609557 : 0x498b6c;
  poly(g, [[x, y - 100 * scale], [x - 32 * scale, y - 43 * scale], [x + 32 * scale, y - 43 * scale]], leaf);
  poly(g, [[x, y - 77 * scale], [x - 40 * scale, y - 16 * scale], [x + 40 * scale, y - 16 * scale]], leaf);
  poly(g, [[x - 3 * scale, y - 94 * scale], [x - 29 * scale, y - 45 * scale], [x - 4 * scale, y - 48 * scale]], 0x94ba76, 0.65);
  poly(g, [[x - 4 * scale, y - 65 * scale], [x - 35 * scale, y - 20 * scale], [x - 5 * scale, y - 25 * scale]], 0x92b574, 0.5);
}
function rock(g, x, y, amount = 24) {
  ellipse(g, x + 4, y + 2, 63, 22, color.shadow, 0.16);
  if (!amount) { ellipse(g, x, y, 21, 10, 0x819889); return; }
  poly(g, [[x - 29, y - 3], [x - 20, y - 31], [x + 10, y - 42], [x + 29, y - 15], [x + 21, y + 4], [x - 11, y + 8]], 0x8ea9a4);
  poly(g, [[x - 20, y - 31], [x + 10, y - 42], [x + 29, y - 15], [x + 3, y - 13]], 0xcad8c9);
  poly(g, [[x + 3, y - 13], [x + 29, y - 15], [x + 21, y + 4], [x + 4, y + 7]], 0x688d8b);
}
function berries(g, x, y, amount = 24) {
  ellipse(g, x, y + 1, 54, 18, color.shadow, 0.13);
  ellipse(g, x - 13, y - 11, 31, 29, 0x648b48); ellipse(g, x + 8, y - 15, 38, 36, 0x77a050);
  ellipse(g, x, y - 27, 31, 27, 0x96b561);
  if (amount) for (const [dx, dy] of [[-15, -13], [4, -33], [17, -16], [-1, -7]]) { ellipse(g, x + dx, y + dy, 9, 9, 0xce6559); ellipse(g, x + dx - 1, y + dy - 2, 3, 3, 0xf0a17d); }
}
function house(g, x, y, small = false) {
  const w = small ? 62 : 90, h = small ? 36 : 52;
  ellipse(g, x + 8, y + 10, w + 23, 30, color.shadow, 0.17);
  poly(g, [[x - w / 2, y - h], [x + 15, y - h + 11], [x + 15, y + 12], [x - w / 2, y]], 0xe4c68b);
  poly(g, [[x + 15, y - h + 11], [x + w / 2, y - h - 1], [x + w / 2, y], [x + 15, y + 12]], 0xb28e64);
  poly(g, [[x - w / 2 - 9, y - h], [x - 12, y - h - 34], [x + w / 2 + 8, y - h - 21], [x + 17, y - h + 14]], 0xcc744b);
  poly(g, [[x + 17, y - h + 14], [x + w / 2 + 8, y - h - 21], [x + w / 2 + 9, y - h + 3]], 0x92533d);
  rect(g, x - 22, y - 28, 20, 30, 0x557064, 3); rect(g, x + 25, y - 34, 12, 15, 0xecc571, 2);
}
function tower(g, x, y) {
  ellipse(g, x, y + 5, 77, 28, color.shadow, 0.16);
  for (const dx of [-22, 21]) rect(g, x + dx, y - 93, 8, 103, 0x8b6547, 2);
  poly(g, [[x - 27, y - 75], [x + 27, y - 75], [x + 27, y - 50], [x - 27, y - 50]], 0xd7b077);
  rect(g, x - 6, y - 76, 14, 13, 0x436a5b, 2);
  poly(g, [[x - 34, y - 96], [x, y - 125], [x + 36, y - 96]], 0xbe6b45);
  rect(g, x - 29, y - 96, 59, 17, 0xedc47e, 3);
  for (let i = -1; i <= 1; i++) rect(g, x + i * 20 - 5, y - 103, 10, 12, 0xedc47e, 2);
}
function person(g, x, y, kind = 'keeper', phase = 0, moving = false) {
  const keeper = kind === 'keeper', enemy = kind === 'raider', guard = kind === 'guard';
  const bob = moving && !reducedMotion ? Math.sin(phase) * 2 : 0;
  ellipse(g, x + 2, y + 3, keeper ? 31 : 25, 12, color.shadow, 0.22);
  const coat = keeper ? 0xe6af4c : enemy ? 0xa85d51 : guard ? 0x568f99 : 0xead5a4;
  rect(g, x - 10, y - 26 + bob, 20, 24, coat, 6);
  rect(g, x - 8, y - 5, 6, 10, 0x485e55, 2); rect(g, x + 3, y - 5, 6, 10, 0x485e55, 2);
  if (keeper) { rect(g, x - 15, y - 22 + bob, 8, 17, 0x688275, 3); poly(g, [[x - 7, y - 28 + bob], [x + 10, y - 26 + bob], [x + 17, y - 8 + bob], [x, y - 12 + bob]], 0x3d7773); }
  ellipse(g, x, y - 34 + bob, 21, 21, 0xf1d4a0);
  if (guard || enemy) { rect(g, x - 11, y - 43 + bob, 22, 10, enemy ? 0x775e65 : 0x9dbab5, 5); }
  else { ellipse(g, x, y - 41 + bob, 23, 12, keeper ? 0xc47843 : 0x8b6c4b); }
  rect(g, x + 3, y - 35 + bob, 2, 3, 0x3e5349, 1);
  if (guard || keeper || enemy) { rect(g, x + 13, y - 27 + bob, 3, 26, 0xc1cebe, 1); rect(g, x + 9, y - 13 + bob, 11, 3, 0xb48a50, 1); }
  if (guard) { ellipse(g, x - 12, y - 14 + bob, 15, 20, 0xb9d2c2); ellipse(g, x - 12, y - 14 + bob, 9, 14, 0x58858b); }
}
function wolf(g, x, y, phase) {
  ellipse(g, x, y + 5, 43, 15, color.shadow, 0.2); ellipse(g, x, y - 9, 39, 23, 0x6a7480);
  ellipse(g, x + 17, y - 16, 22, 22, 0x818997);
  poly(g, [[x + 7, y - 22], [x + 11, y - 36], [x + 18, y - 24]], 0x69717f);
  poly(g, [[x + 20, y - 24], [x + 26, y - 34], [x + 28, y - 18]], 0x69717f);
  rect(g, x + 19, y - 19, 3, 3, 0xf1c878, 1);
  rect(g, x - 12, y - 4, 6, 14, 0x5d6571, 2); rect(g, x + 10, y - 4, 6, 14, 0x5d6571, 2);
  poly(g, [[x - 15, y - 14], [x - 35, y - 24 + Math.sin(phase) * 3], [x - 25, y - 7]], 0x7c8692);
}
function health(g, x, y, value, max, width = 36) {
  rect(g, x - width / 2, y, width, 5, 0x284d43, 2); rect(g, x - width / 2 + 1, y + 1, Math.max(0, (width - 2) * value / max), 3, value / max < 0.3 ? 0xde755a : 0xaad19a, 1);
}

class Valley extends Phaser.Scene {
  constructor() { super('valley'); }
  create() {
    scene = this;
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.terrain = this.add.graphics(); this.paintTerrain();
    this.actors = this.add.graphics(); this.effects = this.add.graphics();
    this.followPoint = this.add.zone(state.player.x, state.player.y, 1, 1);
    this.cameras.main.startFollow(this.followPoint, true, 0.08, 0.08);
    this.resize(); this.scale.on('resize', () => this.resize());
    this.labels = new Map();
    const label = (key, text, x, y, fill = '#eff2ce') => {
      const t = this.add.text(x, y, text, { fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', fontStyle: 'bold', color: fill, backgroundColor: '#294f42dd', padding: { x: 9, y: 5 } }).setOrigin(0.5).setDepth(4);
      this.labels.set(key, t);
    };
    label('hearth', '♨  THE HEARTH', 1300, 1050, '#ffe2a1');
    for (const camp of state.camps) label(camp.id, camp.name, camp.x, camp.y + 40);
    for (const [id, text, x, y] of [['wood', 'TIMBER GROVE', 960, 1370], ['stone', 'STONE RIDGE', 1640, 1315], ['food', 'BERRY GLADE', 1110, 815]]) label(id, text, x, y, '#e0e9c4');
    this.keys = this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,SPACE');
    this.input.on('pointerdown', (pointer) => {
      if (state.paused || pointer.wasTouch) return;
      const target = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      pointerTarget = target;
    });
    this.time.addEvent({ delay: 100, loop: true, callback: updateHud });
    updateHud();
  }
  resize() { this.cameras.main.setZoom(this.scale.width < 600 ? 0.83 : this.scale.width < 1000 ? 0.9 : 1.05); }
  resetView() { this.cameras.main.centerOn(state.player.x, state.player.y); }
  paintTerrain() {
    const g = this.terrain;
    rect(g, 0, 0, WORLD.width, WORLD.height, 0x87ad79);
    let r = 8421; const rand = () => { r = (Math.imul(r, 1664525) + 1013904223) >>> 0; return r / 4294967296; };
    for (let i = 0; i < 170; i++) ellipse(g, rand() * WORLD.width, rand() * WORLD.height, 80 + rand() * 230, 40 + rand() * 110, i % 2 ? 0x9dbd80 : 0x6e9e76, 0.2);
    // A slow river at the edge of the valley, with pale banks.
    g.lineStyle(130, 0xb5cfa3, 1); g.beginPath(); g.moveTo(0, 230); g.lineTo(370, 150); g.lineTo(740, 185); g.lineTo(1050, 70); g.lineTo(1550, -60); g.strokePath();
    g.lineStyle(95, 0x6eaaa8, 1); g.beginPath(); g.moveTo(0, 230); g.lineTo(370, 150); g.lineTo(740, 185); g.lineTo(1050, 70); g.lineTo(1550, -60); g.strokePath();
    g.lineStyle(3, 0xc0dbbd, 0.45); for (let i = 0; i < 25; i++) { const x = i * 44; g.lineBetween(x, 169 + Math.sin(i) * 17, x + 25, 167 + Math.sin(i) * 17); }
    for (const camp of state.camps) {
      g.lineStyle(42, 0xb8bd87, 0.65); g.lineBetween(WORLD.baseX, WORLD.baseY, camp.x, camp.y);
      g.lineStyle(31, 0xc4c596, 0.4); g.lineBetween(WORLD.baseX, WORLD.baseY, camp.x, camp.y);
      ellipse(g, camp.x, camp.y, 180, 112, 0xbdc28c, 0.9);
    }
    ellipse(g, 1300, 1000, 520, 400, 0xa7b981); ellipse(g, 1300, 1000, 462, 350, 0xc1c191);
    g.lineStyle(3, 0xdad4a4, 0.65); g.strokeEllipse(1300, 1000, 482, 370);
    for (let i = 0; i < 1600; i++) {
      const x = rand() * WORLD.width, y = rand() * WORLD.height;
      if (Math.hypot(x - 1300, y - 1000) < 260) continue;
      if (i % 7 === 0) { ellipse(g, x, y, 4, 4, i % 3 ? 0xe4d9a0 : 0xe5ab83, 0.7); }
      else { g.lineStyle(1.3, i % 2 ? 0x5e9164 : 0xb7ca8d, 0.6); g.lineBetween(x, y, x + 2, y - 5); g.lineBetween(x, y, x - 3, y - 3); }
    }
    for (let i = 0; i < 82; i++) {
      const x = 100 + rand() * (WORLD.width - 200), y = 290 + rand() * (WORLD.height - 380);
      if (Math.hypot(x - 1300, y - 1000) < 540 || state.camps.some(c => Math.hypot(c.x - x, c.y - y) < 180) || state.nodes.some(n => Math.hypot(n.x - x, n.y - y) < 90)) continue;
      tree(g, x, y, 0.7 + rand() * 0.6, false, i);
    }
    for (const [x, y] of [[100, 490], [2370, 1780], [350, 1790], [2300, 250]]) { rock(g, x, y); rock(g, x + 40, y + 9); tree(g, x - 35, y + 10, 1.3); }
  }
  update(time, delta) {
    if (!this.keys) return;
    const spacePressed = Phaser.Input.Keyboard.JustDown(this.keys.SPACE);
    let x = (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) - (this.keys.A.isDown || this.keys.LEFT.isDown ? 1 : 0) + touch.x;
    let y = (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0) - (this.keys.W.isDown || this.keys.UP.isDown ? 1 : 0) + touch.y;
    if (!state.paused && (x || y) && document.activeElement?.tagName === 'BUTTON') $('game-world').focus({ preventScroll: true });
    if (x || y) pointerTarget = null;
    if (pointerTarget) {
      const dx = pointerTarget.x - state.player.x, dy = pointerTarget.y - state.player.y, d = Math.hypot(dx, dy);
      if (d < 14) pointerTarget = null; else { x = dx / d; y = dy / d; }
    }
    const before = state.status;
    stepGame(state, delta / 1000, { x, y });
    if (!state.paused) {
      const nearby = nearestInteraction(state);
      const keyboardInWorld = document.activeElement?.tagName !== 'BUTTON';
      if (nearby?.kind === 'gather' && (held || (keyboardInWorld && this.keys.SPACE.isDown))) interact(state);
      else if (nearby?.kind === 'recruit' && keyboardInWorld && spacePressed) interact(state);
    }
    if (before === 'playing' && state.status !== 'playing') { updateHud(); sound(state.status === 'won' ? 880 : 180); openModal('ended'); }
    this.followPoint.setPosition(state.player.x, state.player.y);
    this.paintActors(time / 1000, !!(x || y) && !state.paused);
    if (performance.now() - lastHud > 150) { updateHud(); lastHud = performance.now(); }
  }
  paintActors(time, moving) {
    const g = this.actors; g.clear(); this.effects.clear();
    const near = nearestInteraction(state);
    const objects = state.nodes.map((n, i) => ({ y: n.y, draw: () => { if (n.id === near?.id) { g.lineStyle(3, 0xffdfa0, 0.9); g.strokeEllipse(n.x, n.y + 2, 85, 40); } n.type === 'wood' ? tree(g, n.x, n.y, 0.8, !n.amount, i) : n.type === 'stone' ? rock(g, n.x, n.y, n.amount) : berries(g, n.x, n.y, n.amount); } }));
    // Four fixed plots invite building without a fiddly construction editor.
    for (const [kind, x, y] of [['shelter', 1190, 945], ['watchtower', 1150, 1110], ['barracks', 1300, 860], ['barricade', 1300, 1195]]) {
      if (!state.structures.some(b => b.kind === kind)) {
        this.effects.lineStyle(2, 0xffe3a2, 0.45); this.effects.strokeEllipse(x, y, 86, 42);
        rect(this.effects, x - 8, y - 2, 16, 3, 0xe7d49e, 1); rect(this.effects, x - 2, y - 8, 3, 16, 0xe7d49e, 1);
      }
    }
    objects.push({ y: 1000, draw: () => {
      ellipse(g, 1300, 1007, 102, 49, 0x7d8660, 0.35);
      for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; ellipse(g, 1300 + Math.cos(a) * 31, 1000 + Math.sin(a) * 15, 18, 12, i % 2 ? 0xa1aca0 : 0xc5c4aa); }
      poly(g, [[1278, 1002], [1322, 986], [1327, 993], [1285, 1010]], 0x81583e);
      poly(g, [[1281, 984], [1324, 1003], [1317, 1010], [1278, 992]], 0x9c6d43);
      const flicker = reducedMotion || state.paused ? 0 : Math.sin(time * 9) * 3;
      ellipse(g, 1300, 984, 43, 53, 0xe9a854, 0.18);
      poly(g, [[1286, 995], [1291, 978], [1298, 984], [1305, 961 - flicker], [1316, 985], [1310, 998]], 0xe89948);
      poly(g, [[1294, 995], [1302, 977 - flicker], [1309, 992]], 0xffda7f);
      rect(g, 1347, 938, 5, 62, 0x916d45); poly(g, [[1352, 938], [1381, 940], [1372, 951], [1381, 963], [1352, 959]], 0xe3ad56);
    } });
    for (const c of state.camps) objects.push({ y: c.y, draw: () => {
      ellipse(g, c.x, c.y + 3, 130, 45, color.shadow, 0.12);
      poly(g, [[c.x - 52, c.y], [c.x - 5, c.y - 67], [c.x + 18, c.y + 7]], 0xe3c68e);
      poly(g, [[c.x - 5, c.y - 67], [c.x + 44, c.y - 22], [c.x + 55, c.y + 5], [c.x + 18, c.y + 7]], 0xb29b6e);
      poly(g, [[c.x - 20, c.y], [c.x - 5, c.y - 45], [c.x + 7, c.y + 5]], 0x556f55);
      for (let i = 0; i < c.people; i++) person(g, c.x - 45 + i * 32, c.y + 28, 'settler', time * 3, false);
      if (near?.id === c.id) { g.lineStyle(3, 0xffdfa0, 1); g.strokeEllipse(c.x, c.y + 24, 145, 75); }
    } });
    for (const b of state.structures) objects.push({ y: b.y, draw: () => {
      if (b.kind === 'shelter') house(g, b.x, b.y);
      if (b.kind === 'watchtower') {
        tower(g, b.x, b.y);
        const target = state.enemies.filter(e => Math.hypot(e.x - b.x, e.y - b.y) < 470).sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y))[0];
        if (target && b.cooldown > 0.82) { this.effects.lineStyle(2, 0xffe6a8, 0.9); this.effects.lineBetween(b.x, b.y - 86, target.x, target.y - 22); }
      }
      if (b.kind === 'barracks') { house(g, b.x, b.y, true); rect(g, b.x + 51, b.y - 50, 4, 56, 0x795a3c); poly(g, [[b.x + 55, b.y - 50], [b.x + 84, b.y - 48], [b.x + 77, b.y - 38], [b.x + 55, b.y - 35]], 0x789b9b); ellipse(g, b.x - 47, b.y + 4, 22, 25, 0xb89a66); }
      if (b.kind === 'barricade') {
        for (let i = -5; i <= 5; i++) { const px = b.x + i * 18, py = b.y + Math.abs(i) * -2; rect(g, px - 6, py - 42, 12, 44, i % 2 ? 0xc39b65 : 0xd5ad75, 3); poly(g, [[px - 6, py - 40], [px, py - 51], [px + 6, py - 40]], 0xe2bf81); }
        rect(g, b.x - 98, b.y - 25, 194, 7, 0x936e46, 2);
      }
    } });
    for (const settler of state.settlers) objects.push({ y: settler.y, draw: () => {
      person(g, settler.x, settler.y, 'settler');
      if (settler.attackFlash > 0) {
        this.effects.lineStyle(2, 0xffdf9a, 0.85);
        this.effects.lineBetween(settler.x + 12, settler.y - 20, settler.attackX, settler.attackY - 20);
        ellipse(this.effects, settler.attackX, settler.attackY - 20, 7, 7, 0xffe7b6);
        g.lineStyle(2, 0xffdf9a, 0.9); g.strokeCircle(settler.x, settler.y - 16, 22);
      }
    } });
    for (const t of state.troops) objects.push({ y: t.y, draw: () => { person(g, t.x, t.y, 'guard', time * 8, !state.paused && state.enemies.some(e => Math.hypot(e.x - t.x, e.y - t.y) < 400)); if (t.hp < t.maxHp) health(g, t.x, t.y - 52, t.hp, t.maxHp); if (t.cooldown > 0.65) { g.lineStyle(2, 0xe1ecca, 0.8); g.strokeCircle(t.x, t.y - 14, 26); } } });
    for (const e of state.enemies) objects.push({ y: e.y, draw: () => { e.kind === 'wolf' ? wolf(g, e.x, e.y, time * 4) : person(g, e.x, e.y, 'raider', time * 8, !state.paused); health(g, e.x, e.y - 53, e.hp, e.maxHp, 31); } });
    objects.push({ y: state.player.y, draw: () => {
      g.lineStyle(2, 0xf8d27f, 0.9); g.strokeEllipse(state.player.x, state.player.y + 3, 42, 20);
      person(g, state.player.x, state.player.y, 'keeper', time * 11, moving);
      if (state.player.attackCooldown > 0.4) { g.lineStyle(4, 0xffebba, 0.7); g.beginPath(); g.arc(state.player.x, state.player.y - 18, 40, -1.2, 1.3); g.strokePath(); }
    } });
    objects.sort((a, b) => a.y - b.y).forEach(o => o.draw());
    const far = !atBase(state), homeNeeded = far && (showHomeUntil > performance.now() || state.winterAt - state.elapsed < 30);
    if (homeNeeded) {
      const p = state.player, a = Math.atan2(1000 - p.y, 1300 - p.x), x = p.x + Math.cos(a) * 82, y = p.y + Math.sin(a) * 82;
      const points = [[20, 0], [-10, -11], [-5, 0], [-10, 11]].map(([px, py]) => [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)]);
      poly(this.effects, points, 0xffdc89);
    }
    for (const camp of state.camps) this.labels.get(camp.id)?.setText(`${camp.name} · ${camp.people ? `${camp.people} settlers` : 'welcomed'}`);
    if (state.wave.started) {
      const camera = this.cameras.main, view = camera.worldView;
      this.effects.fillStyle(0xd5e9df, 0.11); this.effects.fillRect(view.x, view.y, view.width, view.height);
      if (!reducedMotion) for (let i = 0; i < 55; i++) { const x = view.x + ((i * 137 + time * 17) % view.width), y = view.y + ((i * 97 + time * 27) % view.height); ellipse(this.effects, x, y, 3, 3, 0xf1f5e9, 0.7); }
    }
  }
}

function updateHud() {
  for (const r of ['wood', 'stone', 'food']) $(`${r}-count`).textContent = state.resources[r];
  $('settler-count').textContent = `${state.survivors} / ${state.capacity}`;
  $('settler-count').setAttribute('aria-label', `${state.survivors} settlers, ${state.capacity} beds, ${state.settlers.length} untrained stone throwers`);
  $('guard-count').textContent = state.trained;
  const remaining = Math.max(0, Math.ceil(state.winterAt - state.elapsed));
  $('season-label').textContent = state.wave.started ? 'HOLD THE HEARTH' : 'WINTER ARRIVES IN';
  $('winter-timer').textContent = state.wave.started ? `${state.wave.remaining}` : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`;
  $('wave-count').textContent = state.wave.started ? 'invaders left' : '';
  document.body.classList.toggle('winter', state.wave.started);
  document.body.classList.toggle('urgent', remaining <= 30 && !state.wave.started);
  $('hearth-health').textContent = `${Math.max(0, Math.ceil(state.base.hp))} / ${state.base.maxHp}`;
  $('player-health').textContent = Math.max(0, Math.ceil(state.player.hp));
  $('hearth-bar').style.width = `${Math.max(0, state.base.hp / state.base.maxHp * 100)}%`;
  $('player-bar').style.width = `${Math.max(0, state.player.hp)}%`;
  $('hearth-bar').classList.toggle('low', state.base.hp / state.base.maxHp < 0.35);
  $('player-bar').classList.toggle('low', state.player.hp < 35);
  $('eat-button').disabled = state.resources.food < 4 || state.player.hp >= 100 || state.paused;
  $('repair-button').disabled = state.resources.wood < 8 || !atBase(state) || state.base.hp >= state.base.maxHp || state.paused;
  for (const kind of Object.keys(BUILDINGS)) {
    const info = getBuildInfo(state, kind), button = $(`build-${kind}`);
    button.disabled = !info.available; button.querySelector('.build-number').textContent = `${info.count}/${info.max}`;
    button.title = `${info.description} ${info.reason || 'Ready to build'}. Costs ${info.wood} wood and ${info.stone} stone.`;
    button.classList.toggle('complete', info.count >= info.max);
  }
  $('train-button').disabled = state.paused || !atBase(state) || !state.structures.some(b => b.kind === 'barracks') || state.trained >= state.survivors || state.resources.wood < 5 || state.resources.food < 5;
  const nearby = nearestInteraction(state);
  $('action-button').disabled = !nearby || state.paused || (nearby.kind === 'recruit' && (state.survivors >= state.capacity || state.resources.food < 4));
  $('action-button').classList.toggle('recruit', nearby?.kind === 'recruit');
  if (nearby?.kind === 'gather') {
    $('action-label').textContent = `Gather ${nearby.type} +8`;
    $('context-hint').textContent = 'Hold to gather · Stay nearby';
    $('action-button').querySelector('svg').outerHTML = icon(nearby.type);
  } else if (nearby?.kind === 'recruit') {
    $('action-label').textContent = state.survivors >= state.capacity ? 'Need more beds' : 'Welcome settler';
    $('context-hint').textContent = `4 food · ${nearby.people} waiting at this camp`;
    $('action-button').querySelector('svg').outerHTML = icon('people');
  } else {
    $('action-label').textContent = 'Find supplies';
    $('context-hint').textContent = 'Get close to trees, rocks, berries, or a camp';
  }
  const distanceHome = Math.round(Math.hypot(state.player.x - 1300, state.player.y - 1000));
  $('return-label').textContent = atBase(state) ? 'Hearth nearby' : `Hearth · ${distanceHome} m`;
  $('build-range').textContent = atBase(state) ? 'You are home · Build & train here' : 'Return to the hearth to build';
  $('location-label').textContent = atBase(state) ? 'THE HEARTH · YOUR REFUGE' : state.player.y < 650 ? 'THE RIDGE · TREAD CAREFULLY' : state.player.x < 900 ? 'PINEFOLK TRAIL · THE WESTERN WILDS' : state.player.x > 1750 ? 'WAYFARER TRAIL · THE EASTERN WILDS' : 'THE VALLEY · SUPPLIES AWAIT';
  let objective = 'Build a longhouse for more beds.';
  if (state.structures.some(b => b.kind === 'shelter')) objective = state.rescued < 2 ? 'Follow the west trail. Welcome settlers for 4 food.' : !state.structures.some(b => b.kind === 'barracks') ? 'Build a training yard to ready your settlers.' : state.trained < 4 ? 'Train 4+ guards. Each needs 5 wood + 5 food.' : !state.structures.some(b => b.kind === 'watchtower') ? 'Raise watchtowers to cover the hearth.' : 'Gather supplies, add defenses, and prepare.';
  if (state.wave.started) objective = 'Defend the hearth! Fight nearby; repair for 8 wood.';
  else if (remaining <= 30) objective = 'Winter is close. Return to the hearth now!';
  $('objective').textContent = objective;
  const latest = state.events.at(-1);
  if (latest && latest.id > shownEvent) {
    shownEvent = latest.id; $('toast').textContent = latest.text; $('toast').className = `visible ${latest.tone}`;
    clearTimeout(updateHud.toastTimeout); updateHud.toastTimeout = setTimeout(() => { $('toast').className = ''; }, latest.text.length > 65 ? 6500 : 3500);
    if (latest.tone === 'warning') sound(230);
  }
  drawMap();
}
function drawMap() {
  const canvas = $('minimap'), ctx = canvas.getContext('2d'), sx = canvas.width / WORLD.width, sy = canvas.height / WORLD.height;
  ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = '#517e63'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#96b48a'; ctx.beginPath(); ctx.ellipse(1300 * sx, 1000 * sy, 16, 13, 0, 0, Math.PI * 2); ctx.fill();
  const dot = (x, y, r, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x * sx, y * sy, r, 0, Math.PI * 2); ctx.fill(); };
  for (const n of state.nodes) if (n.amount) dot(n.x, n.y, 1.6, n.type === 'wood' ? '#abd28a' : n.type === 'stone' ? '#d0dfd5' : '#eda58a');
  for (const c of state.camps) if (c.people) { ctx.fillStyle = '#e9dfb4'; ctx.fillRect(c.x * sx - 2.5, c.y * sy - 2.5, 5, 5); }
  for (const e of state.enemies) if (e.raid) dot(e.x, e.y, 2.2, '#ef9676');
  dot(1300, 1000, 4, '#f6ca75'); dot(state.player.x, state.player.y, 3.5, '#fffce2');
  ctx.strokeStyle = '#294d40'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(state.player.x * sx, state.player.y * sy, 4.5, 0, Math.PI * 2); ctx.stroke();
}

const game = new Phaser.Game({
  type: Phaser.AUTO, parent: 'game-world', backgroundColor: '#87ad79',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  render: { antialias: true, roundPixels: true }, input: { activePointers: 3 },
  scene: Valley, audio: { noAudio: true },
});
window.addEventListener('pagehide', () => { game.sound?.pauseAll(); });

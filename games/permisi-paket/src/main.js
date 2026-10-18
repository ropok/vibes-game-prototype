import Phaser from 'phaser';
import './style.css';
import { WORLD, ROAD_X, ROAD_Y, HOMES, DEPOT, GARAGE, UPGRADE_KEYS, UPGRADE_INFO } from './data.js';
import { createState, step, interact, buyUpgrade, contextAction, upgradeCost, maxStamina, serialize, restore } from './engine.js';
import { buildTown, makeTextures } from './art.js';

const $ = selector => document.querySelector(selector);
const money = amount => `Rp${Math.round(amount).toLocaleString('id-ID')}`;
const SAVE_KEY = 'permisi-paket-save-v1';
let storage = 'available', raw = null;
try { raw = localStorage.getItem(SAVE_KEY); } catch { storage = 'unavailable'; }
let state = raw ? restore(raw) : createState();
let started = Boolean(raw), modal = '', previousFocus = null, sceneRef = null, saveClock = 0, soundEnabled = false, audio = null;
let shoutUntil = 0;
let courierFacing = 'down';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const keys = new Set(), stick = { x: 0, y: 0, pointer: null }, held = { run: false };
const app = $('#app');
app.innerHTML = `
  <header class="topbar"><div class="brand"><span class="brand-icon">▣</span><div><h1>PERMISI <em>PAKET!</em></h1><p>KURIR KELILING KOTA</p></div></div><div class="top-actions"><button id="sound-button" class="icon-button" aria-label="Aktifkan suara" aria-pressed="false">♪<span>Suara</span></button><button id="help-button" class="icon-button" aria-label="Bantuan">?<span>Bantuan</span></button><button id="pause-button" class="icon-button" aria-label="Jeda permainan">Ⅱ<span>Jeda</span></button></div></header>
  <main class="play-area"><div id="game" aria-label="Kota Permisi Paket, gunakan WASD atau joystick untuk bergerak"></div>
    <section class="wallet" aria-label="Status kurir"><div><span class="eyebrow">UANG SAKU</span><strong id="money">Rp0</strong></div><div class="delivery-count"><strong id="deliveries">0<span> / 12</span></strong><span class="eyebrow">PAKET SAMPAI</span></div><div class="meters"><label><span>♥ Kondisi</span><span id="health-label">100</span></label><div class="meter health"><i id="health-bar"></i></div><label><span>ϟ Stamina</span><span id="stamina-label">100</span></label><div class="meter stamina"><i id="stamina-bar"></i></div></div></section>
    <aside class="map-card"><div class="map-heading"><span>PETA KOTA</span><span class="north">N ↑</span></div><canvas id="minimap" width="320" height="240" aria-label="Peta kota: kurir, tujuan, pos, dan bengkel"></canvas><div class="map-legend"><span><i class="legend-dot player"></i>Kamu</span><span><i class="legend-dot target"></i>Tujuan</span><span class="legend-station">P Pos · B Bengkel</span></div></aside>
    <section class="mission"><div id="direction-arrow" aria-label="Arah tujuan">➤</div><div class="mission-copy"><span class="eyebrow" id="mission-label">MULAI DARI POS PAKET</span><strong id="objective">Ambil paket pertamamu</strong><span id="objective-detail">Dekati loket lalu tekan Interaksi</span></div><span class="distance" id="distance">0 m</span></section>
    <div id="delivery-shout" role="status" aria-live="polite" hidden>MISI PAKET!</div>
    <div id="toast" role="status" aria-live="polite"></div><div id="achievement" hidden>✦ KURIR ANDALAN · 12 PAKET SAMPAI</div>
    <div class="desktop-hint"><kbd>W A S D</kbd> / panah <span>jalan</span><kbd>Shift</kbd> <span>lari</span><kbd>E</kbd> <span>interaksi</span></div>
    <div class="touch-controls"><div id="joystick" role="group" aria-label="Joystick arah gerak"><div class="stick-rings"></div><div id="joystick-knob"></div></div><div class="action-controls"><button id="run-button" aria-label="Tahan untuk berlari">ϟ<span>LARI</span></button><button id="interact-button" aria-label="Interaksi"><span class="action-key">E</span><strong>Ambil paket</strong></button></div></div>
    <span id="save-status"></span><div id="game-status" class="sr-only" aria-live="off"></div>
  </main><div id="modal" class="modal-backdrop" hidden></div>`;

function clearInput() {
  keys.clear(); held.run = false; stick.x = 0; stick.y = 0; stick.pointer = null;
  $('#joystick-knob').style.transform = 'translate(0px, 0px)';
  $('#run-button').classList.remove('held');
}
function persist() {
  if (!started) return;
  try { localStorage.setItem(SAVE_KEY, serialize(state)); storage = 'available'; }
  catch { storage = 'unavailable'; }
  $('#save-status').textContent = storage === 'available' ? '✓ Tersimpan di perangkat' : 'Sesi tanpa simpan · penyimpanan tidak tersedia';
}
function tone(kind = 'pickup') {
  if (!soundEnabled) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(kind === 'delivered' ? 660 : 440, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(kind === 'delivered' ? 990 : 660, audio.currentTime + .13);
    gain.gain.setValueAtTime(.055, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .22);
    oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(); oscillator.stop(audio.currentTime + .23);
  } catch { /* Sound is optional; gameplay never depends on an audio device. */ }
}
function cancelVoice() {
  try { window.speechSynthesis?.cancel(); } catch { /* Speech support is optional. */ }
}
function clearShout() {
  shoutUntil = 0; $('#delivery-shout').hidden = true; cancelVoice();
}
function shoutDelivery(event) {
  shoutUntil = state.time + 2.2;
  $('#delivery-shout').hidden = false;
  // Only a successful delivery from a real keyboard/touch/click can start a voice.
  if (!soundEnabled || !event?.isTrusted) return;
  try {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    cancelVoice();
    const utterance = new window.SpeechSynthesisUtterance('MISI PAKET!');
    utterance.lang = 'id-ID'; utterance.rate = 1.08; utterance.pitch = 1.1; utterance.volume = .85;
    const voice = window.speechSynthesis.getVoices().find(item => /^id(?:[-_]|$)/i.test(item.lang));
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
  } catch { /* The speech bubble remains available if the browser cannot speak. */ }
}
function positionShout(camera) {
  const bubble = $('#delivery-shout');
  bubble.hidden = !started || Boolean(modal) || state.time >= shoutUntil;
  if (bubble.hidden) return;
  const area = $('.play-area').getBoundingClientRect();
  const x = (state.player.x - camera.worldView.x) * camera.zoom;
  const y = (state.player.y - camera.worldView.y) * camera.zoom;
  const width = bubble.offsetWidth, height = bubble.offsetHeight;
  const bound = (value, maximum) => Math.max(10, Math.min(value, Math.max(10, maximum)));
  const candidates = [
    { x: x - width / 2, y: y - 72 * camera.zoom - height, below: false },
    { x: x - width / 2, y: y + 26 * camera.zoom, below: true },
    { x: x + 35 * camera.zoom, y: y - height / 2, below: false },
    { x: x - 35 * camera.zoom - width, y: y - height / 2, below: false },
  ].map(point => ({ ...point, x: bound(point.x, area.width - width - 10), y: bound(point.y, area.height - height - 10) }));
  const obstacles = [...document.querySelectorAll('.wallet, .mission, .map-card, .action-controls, #joystick, #achievement')]
    .filter(element => !element.hidden && element.getClientRects().length)
    .map(element => element.getBoundingClientRect());
  const overlaps = point => obstacles.some(rect => point.x < rect.right - area.left + 6 && point.x + width > rect.left - area.left - 6 && point.y < rect.bottom - area.top + 6 && point.y + height > rect.top - area.top - 6);
  const point = candidates.find(candidate => !overlaps(candidate)) || candidates[0];
  bubble.style.left = `${point.x}px`; bubble.style.top = `${point.y}px`;
  bubble.dataset.placement = point.below ? 'below' : 'above';
}
function closeModal() {
  modal = ''; $('#modal').hidden = true; $('#modal').innerHTML = ''; clearInput();
  previousFocus?.focus?.(); updateHUD();
}
function showModal(kind) {
  previousFocus = document.activeElement; clearInput(); clearShout(); modal = kind;
  const panel = $('#modal'); panel.hidden = false;
  let content = '';
  if (kind === 'intro') content = `<div class="intro-art"><span class="parcel-mark">▣</span><span class="postmark">KAMPUNG<br>EXPRESS</span></div><span class="modal-kicker">SELAMAT DATANG, KURIR!</span><h2>Paket kecil.<br>Petualangan <em>besar.</em></h2><p>Jelajahi tiga kampung, temukan pintu yang tepat, dan jadilah kurir andalan. Satu paket, satu senyum.</p><div class="intro-steps"><span><b>01</b> Ambil di pos</span><span><b>02</b> Ikuti tujuan</span><span><b>03</b> Antar & upgrade</span></div><button id="start-button" class="primary-button">Mulai mengantar <span>→</span></button><p class="tiny">WASD / panah · Shift lari · E interaksi<br>Di ponsel, gunakan joystick dan tombol di layar.</p>`;
  if (kind === 'pause' || kind === 'help') content = `<span class="modal-kicker">${kind === 'pause' ? 'TARIK NAPAS SEJENAK' : 'PANDUAN KURIR'}</span><h2>${kind === 'pause' ? 'Lagi istirahat.' : 'Permisi, paket!'}</h2><p>Permainan dijeda. Paket dan kendaraan menunggu sampai kamu kembali.</p><div class="help-grid"><article><b>01 · Ambil paket</b><p>Tekan <kbd>E</kbd> atau Interaksi di Pos Paket. Satu paket dibawa dalam satu perjalanan.</p></article><article><b>02 · Cari pintu tujuan</b><p>Ikuti panah kuning dan titik di peta. Mendekat ke pintu rumah, lalu Interaksi untuk berteriak “MISI PAKET!” dan menerima upah. Aktifkan Suara untuk mendengar teriakannya.</p></article><article><b>03 · Tingkatkan perlengkapan</b><p>Datang ke Bengkel Siap Jalan di timur pos. Sepatu, tas, helm, dan jaket punya tiga level.</p></article><article><b>04 · Jaga kondisi</b><p>Tahan Shift / Lari untuk berlari. Hindari kendaraan; pulih gratis di pos. Jika tumbang, paket dan uang tetap aman.</p></article></div><p class="save-note">Target: antar 12 paket. Setelah itu, kota tetap bisa dijelajahi. Progres disimpan otomatis di perangkat ini.</p><button id="modal-close" class="primary-button">Lanjut mengantar →</button><button id="reset-button" class="text-button">Mulai ulang progres</button>`;
  if (kind === 'garage') content = `<span class="modal-kicker">BENGKEL SIAP JALAN</span><h2>Bekal buat<br><em>perjalanan berikutnya.</em></h2><p>Uang tersedia <strong id="garage-money">${money(state.balance)}</strong>. Peningkatan berlaku permanen untuk sesi ini dan progres tersimpan.</p><div class="upgrade-grid">${UPGRADE_KEYS.map(key => {
    const info = UPGRADE_INFO[key], level = state.upgrades[key], cost = upgradeCost(state, key);
    return `<article class="upgrade-card"><span class="upgrade-icon" style="--upgrade-color:${info.color}">${info.icon}</span><div><h3>${info.name}</h3><p>${info.description}</p><div class="level-pips">${[1, 2, 3].map(n => `<i class="${level >= n ? 'filled' : ''}"></i>`).join('')}<span>Lv ${level}/3</span></div></div><button data-upgrade="${key}" ${cost === null || state.balance < cost ? 'disabled' : ''}>${cost === null ? 'Maksimal' : `Upgrade · ${money(cost)}`}</button></article>`;
  }).join('')}</div><div id="garage-message" role="status"></div><button id="modal-close" class="primary-button">Siap jalan →</button>`;
  if (kind === 'reset') content = `<span class="modal-kicker">MULAI DARI AWAL?</span><h2>Giliran baru.</h2><p>Uang, paket, dan semua peningkatan akan dikosongkan. Progres sebelumnya tidak bisa dikembalikan.</p><button id="reset-confirm" class="primary-button danger">Ya, mulai ulang</button><button id="modal-close" class="text-button">Batal, lanjutkan perjalanan</button>`;
  panel.innerHTML = `<section class="modal-panel ${kind === 'intro' ? 'intro-panel' : ''}" role="dialog" aria-modal="true" aria-label="${kind === 'garage' ? 'Bengkel perlengkapan' : kind === 'reset' ? 'Konfirmasi mulai ulang' : 'Permisi Paket'}">${content}</section>`;
  $('#start-button')?.addEventListener('click', () => { started = true; closeModal(); persist(); tone(); });
  $('#modal-close')?.addEventListener('click', closeModal);
  $('#reset-button')?.addEventListener('click', () => showModal('reset'));
  $('#reset-confirm')?.addEventListener('click', () => { state = createState(); courierFacing = 'down'; started = true; closeModal(); persist(); sceneRef?.cameras.main.centerOn(state.player.x, state.player.y); });
  document.querySelectorAll('[data-upgrade]').forEach(button => button.addEventListener('click', () => {
    const result = buyUpgrade(state, button.dataset.upgrade); persist(); tone(); showModal('garage'); $('#garage-message').textContent = result.message;
  }));
  updateHUD();
  panel.querySelector('button:not(:disabled)')?.focus();
}
function doInteract(event) {
  if (!started || modal) return;
  const result = interact(state);
  if (result.ok && result.kind === 'delivered') shoutDelivery(event);
  if (result.kind === 'garage') showModal('garage');
  if (result.ok) { tone(result.kind); persist(); }
  else { state.notification = result.message; state.notificationTime = 2; }
  updateHUD();
}
$('#help-button').addEventListener('click', () => started && showModal('help'));
$('#pause-button').addEventListener('click', () => { if (!started) return; modal ? closeModal() : showModal('pause'); });
$('#interact-button').addEventListener('click', doInteract);
$('#sound-button').addEventListener('click', () => { soundEnabled = !soundEnabled; if (!soundEnabled) cancelVoice(); $('#sound-button').setAttribute('aria-pressed', String(soundEnabled)); $('#sound-button').setAttribute('aria-label', soundEnabled ? 'Matikan suara' : 'Aktifkan suara'); tone(); });
window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(event.key)) event.preventDefault();
  if (event.key === 'Escape') { if (started) modal ? closeModal() : showModal('pause'); return; }
  if (modal) {
    if (event.key === 'Tab') {
      const focusables = [...$('#modal').querySelectorAll('button:not(:disabled)')];
      const first = focusables[0], last = focusables.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    return;
  }
  keys.add(event.key.toLowerCase());
  if (event.key.toLowerCase() === 'e' && !event.repeat) doInteract(event);
});
window.addEventListener('keyup', event => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => { clearInput(); clearShout(); persist(); if (started && !modal) showModal('pause'); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearInput(); clearShout(); persist(); if (started && !modal) showModal('pause'); } });
window.addEventListener('pagehide', persist);
const joystick = $('#joystick');
function moveStick(event) {
  if (stick.pointer !== event.pointerId) return;
  const rect = joystick.getBoundingClientRect(), radius = 40;
  const x = event.clientX - rect.left - rect.width / 2, y = event.clientY - rect.top - rect.height / 2;
  const length = Math.hypot(x, y), scale = length > radius ? radius / length : 1;
  stick.x = x * scale / radius; stick.y = y * scale / radius;
  $('#joystick-knob').style.transform = `translate(${x * scale}px, ${y * scale}px)`;
}
joystick.addEventListener('pointerdown', event => { if (modal || !started) return; event.preventDefault(); stick.pointer = event.pointerId; joystick.setPointerCapture(event.pointerId); moveStick(event); });
joystick.addEventListener('pointermove', moveStick);
function releaseStick(event) { if (stick.pointer === event.pointerId) { stick.pointer = null; stick.x = 0; stick.y = 0; $('#joystick-knob').style.transform = 'translate(0px, 0px)'; } }
joystick.addEventListener('pointerup', releaseStick); joystick.addEventListener('pointercancel', releaseStick); joystick.addEventListener('lostpointercapture', releaseStick);
$('#run-button').addEventListener('pointerdown', event => { if (modal) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); held.run = true; event.currentTarget.classList.add('held'); });
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) $('#run-button').addEventListener(name, () => { held.run = false; $('#run-button').classList.remove('held'); });
function target() { return state.parcel ? HOMES.find(home => home.id === state.parcel.homeId) : DEPOT; }
function facingDirection(angle, previous) {
  const x = Math.cos(angle), y = Math.sin(angle), horizontal = Math.abs(x), vertical = Math.abs(y);
  // At a diagonal tie, keep a compatible last facing instead of alternating each frame.
  if (Math.abs(horizontal - vertical) < 1e-6) {
    if ((previous === 'right' && x > 0) || (previous === 'left' && x < 0) || (previous === 'down' && y > 0) || (previous === 'up' && y < 0)) return previous;
    return y > 0 ? 'down' : 'up';
  }
  return horizontal > vertical ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
}
function drawMap(camera) {
  const canvas = $('#minimap'), ctx = canvas.getContext('2d'), sx = canvas.width / WORLD.width, sy = canvas.height / WORLD.height;
  ctx.fillStyle = '#d5dfbc'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#9bb1a0';
  ROAD_X.forEach(x => ctx.fillRect((x - 66) * sx, 8, 132 * sx, 224));
  ROAD_Y.forEach(y => ctx.fillRect(8, (y - 66) * sy, 304, 132 * sy));
  ctx.fillStyle = '#a3be95'; HOMES.forEach(home => ctx.fillRect(home.building.x * sx, home.building.y * sy, 16, 12));
  ctx.strokeStyle = '#557e7040'; ctx.lineWidth = 1; ctx.strokeRect(camera.scrollX * sx, camera.scrollY * sy, camera.width / camera.zoom * sx, camera.height / camera.zoom * sy);
  for (const [site, letter] of [[DEPOT, 'P'], [GARAGE, 'B']]) {
    ctx.fillStyle = '#386e68'; ctx.beginPath(); ctx.roundRect(site.x * sx - 7, site.y * sy - 7, 14, 14, 3); ctx.fill();
    ctx.fillStyle = '#fff5d5'; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(letter, site.x * sx, site.y * sy + 1);
  }
  const goal = target();
  ctx.strokeStyle = '#f3b849'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(goal.x * sx, goal.y * sy, 7, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f7bd4e'; ctx.beginPath(); ctx.arc(goal.x * sx, goal.y * sy, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#174d52'; ctx.strokeStyle = '#fff9de'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(state.player.x * sx, state.player.y * sy, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
function updateHUD(camera = sceneRef?.cameras.main) {
  const p = state.player, goal = target(), action = contextAction(state), dist = Math.hypot(p.x - goal.x, p.y - goal.y);
  $('#money').textContent = money(state.balance); $('#deliveries').innerHTML = `${state.deliveries}<span> / 12</span>`;
  $('#health-label').textContent = Math.ceil(p.health); $('#stamina-label').textContent = `${Math.ceil(p.stamina)} / ${maxStamina(state)}`;
  $('#health-bar').style.width = `${p.health}%`; $('#stamina-bar').style.width = `${p.stamina / maxStamina(state) * 100}%`;
  $('#objective').textContent = state.parcel ? `${goal.name} · No. ${String(goal.number).padStart(2, '0')}` : 'Ambil paket di Pos Paket';
  $('#mission-label').textContent = state.parcel ? goal.district.toUpperCase() : 'POS PAKET · LOKET PENGAMBILAN';
  $('#objective-detail').textContent = state.parcel ? `Upah ${money(state.parcel.reward)} · Antar di pintu rumah` : 'Pulih gratis · satu paket setiap perjalanan';
  $('#distance').textContent = `${Math.round(dist / 10)} m`;
  $('#direction-arrow').style.transform = `rotate(${Math.atan2(goal.y - p.y, goal.x - p.x)}rad)`;
  $('#interact-button strong').textContent = action.kind === 'deliver' ? 'Teriak: MISI PAKET!' : action.label; $('#interact-button').classList.toggle('ready', action.kind !== 'none');
  $('#interact-button').setAttribute('aria-label', action.kind === 'deliver' ? 'Interaksi: Teriak MISI PAKET!' : 'Interaksi');
  $('#toast').textContent = state.notificationTime > 0 ? state.notification : ''; $('#toast').classList.toggle('visible', state.notificationTime > 0);
  $('#achievement').hidden = !state.achievement;
  const status = $('#game-status');
  Object.assign(status.dataset, { phase: started ? 'playing' : 'intro', playerX: p.x.toFixed(2), playerY: p.y.toFixed(2), targetX: goal.x, targetY: goal.y, cash: state.balance, deliveries: state.deliveries, upgrade: JSON.stringify(state.upgrades), paused: String(Boolean(modal)), shouting: String(!modal && state.time < shoutUntil), worldWidth: WORLD.width, worldHeight: WORLD.height, storage });
  if (camera) { Object.assign(status.dataset, { cameraX: camera.scrollX.toFixed(2), cameraY: camera.scrollY.toFixed(2), cameraWidth: (camera.width / camera.zoom).toFixed(2), cameraHeight: (camera.height / camera.zoom).toFixed(2) }); drawMap(camera); positionShout(camera); }
}
class TownScene extends Phaser.Scene {
  constructor() { super('Town'); }
  create() {
    sceneRef = this; makeTextures(this); buildTown(this);
    this.cars = state.traffic.map((car, i) => this.add.image(car.x, car.y, `car-${i}`).setDepth(5));
    this.pedestrians = Array.from({ length: 12 }, (_, i) => this.add.image(780 + i % 4 * 530, 588 + Math.floor(i / 4) * 650, 'pedestrian').setDepth(6).setTint([0xffffff, 0xd6ddd6, 0xecc0aa][i % 3]));
    this.marker = this.add.graphics().setDepth(7);
    this.goalLabel = this.add.text(0, 0, '', { fontFamily: 'Arial', fontSize: '14px', fontStyle: 'bold', color: '#244c49', backgroundColor: '#fff4ce', padding: { x: 10, y: 6 } }).setOrigin(.5, 1).setDepth(8);
    this.courier = this.add.image(state.player.x, state.player.y, 'courier-0-0-down-0').setOrigin(.5, .78).setDepth(10);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
    this.fitCamera(); this.cameras.main.startFollow(this.courier, true, .16, .16);
    this.cameras.main.centerOn(state.player.x, state.player.y);
    this.scale.on('resize', this.fitCamera, this);
    if (!started) showModal('intro'); else persist();
    updateHUD(this.cameras.main);
  }
  fitCamera() {
    const w = this.scale.width, h = this.scale.height;
    this.cameras.main.setZoom(Math.max(1, w / 1040, h / 800));
  }
  update(_time, delta) {
    const active = started && !modal;
    if (active) {
      step(state, { x: stick.x + Number(keys.has('d') || keys.has('arrowright')) - Number(keys.has('a') || keys.has('arrowleft')), y: stick.y + Number(keys.has('s') || keys.has('arrowdown')) - Number(keys.has('w') || keys.has('arrowup')), run: held.run || keys.has('shift') }, delta / 1000);
      saveClock += Math.min(delta / 1000, .25); if (saveClock > 2) { persist(); saveClock = 0; }
    }
    const p = state.player;
    if (active && p.moving) courierFacing = facingDirection(p.facing, courierFacing);
    const walking = active && p.moving && !reducedMotion.matches;
    const frame = walking ? 1 + Math.floor(state.time * (p.running ? 12 : 8)) % 2 : 0;
    const sprite = `courier-${state.upgrades.helmet}-${state.upgrades.jacket}-${courierFacing}-${frame}`;
    this.courier.setPosition(p.x, p.y).setTexture(sprite).setFlipX(false);
    Object.assign($('#game').dataset, { facing: courierFacing, sprite });
    Object.assign($('#game-status').dataset, { facing: courierFacing, sprite });
    this.courier.setAlpha(p.invincible > 0 && Math.floor(state.time * 12) % 2 ? .45 : 1);
    state.traffic.forEach((car, i) => this.cars[i].setPosition(car.x, car.y).setRotation(car.angle));
    this.pedestrians.forEach((ped, i) => ped.setX(780 + i % 4 * 530 + Math.sin(state.time * .22 + i) * 94));
    const goal = target(), bob = Math.sin(state.time * 4) * 5;
    this.marker.clear().lineStyle(4, 0xffd16b, .8).strokeEllipse(goal.x, goal.y, 66, 24).fillStyle(0xffd16b).fillTriangle(goal.x - 10, goal.y - 43 + bob, goal.x + 10, goal.y - 43 + bob, goal.x, goal.y - 31 + bob);
    this.goalLabel.setPosition(goal.x, goal.y - 55 + bob).setText(state.parcel ? `▣ ${goal.name}` : '▣ AMBIL PAKET');
    updateHUD(this.cameras.main);
  }
}
const game = new Phaser.Game({ type: Phaser.AUTO, parent: 'game', backgroundColor: '#b8d39b', antialias: true, roundPixels: true, scale: { mode: Phaser.Scale.RESIZE, width: '100%', height: '100%' }, scene: TownScene, render: { transparent: false, powerPreference: 'low-power' }, audio: { noAudio: true } });
window.addEventListener('pagehide', () => { clearInput(); clearShout(); });

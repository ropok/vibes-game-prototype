import { WORLD, DEPOT, GARAGE, HOMES, BUILDINGS, UPGRADE_KEYS, TRAFFIC_ROUTE, DELIVERY_ORDER, INTERACT_RADIUS } from './data.js';

export const FIXED_DT = 1 / 60;
export const SAVE_VERSION = 1;
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const maxStamina = state => 100 + state.upgrades.jacket * 25;
export const upgradeCost = (state, key) => UPGRADE_KEYS.includes(key) ? [100, 200, 350][state.upgrades[key]] ?? null : null;
export function trafficAt(progress) {
  const lengths = TRAFFIC_ROUTE.map((point, i) => distance(point, TRAFFIC_ROUTE[(i + 1) % TRAFFIC_ROUTE.length]));
  const total = lengths.reduce((sum, n) => sum + n, 0);
  let position = ((progress % total) + total) % total;
  for (let i = 0; i < lengths.length; i++) {
    if (position <= lengths[i]) {
      const a = TRAFFIC_ROUTE[i], b = TRAFFIC_ROUTE[(i + 1) % TRAFFIC_ROUTE.length], t = position / lengths[i];
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, angle: Math.atan2(b.y - a.y, b.x - a.x) };
    }
    position -= lengths[i];
  }
  return { ...TRAFFIC_ROUTE[0], angle: 0 };
}
export function createState(seed = 1) {
  return { version: SAVE_VERSION, seed: Number.isSafeInteger(seed) ? seed : 1, time: 0, accumulator: 0,
    player: { x: DEPOT.x, y: DEPOT.y, health: 100, stamina: 100, invincible: 0, facing: 0, moving: false, running: false },
    balance: 0, deliveries: 0, sequence: 0, upgrades: { speed: 0, income: 0, helmet: 0, jacket: 0 },
    parcel: null, completedIds: [], traffic: Array.from({ length: 6 }, (_, i) => ({ ...trafficAt(i * 1120), progress: i * 1120, speed: 90 + i * 8 })),
    notification: '', notificationTime: 0, achievement: false,
  };
}
export function canOccupy(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  if (x < 20 || y < 20 || x > WORLD.width - 20 || y > WORLD.height - 20) return false;
  return !BUILDINGS.some(b => x > b.x - 14 && x < b.x + b.w + 14 && y > b.y - 14 && y < b.y + b.h + 14);
}
function inform(state, message) { state.notification = message; state.notificationTime = 4; }
function tick(state, input) {
  const p = state.player, dt = FIXED_DT;
  state.time += dt;
  state.notificationTime = Math.max(0, state.notificationTime - dt);
  p.invincible = Math.max(0, p.invincible - dt);
  let x = Number.isFinite(input.x) ? clamp(input.x, -1, 1) : 0, y = Number.isFinite(input.y) ? clamp(input.y, -1, 1) : 0;
  const length = Math.hypot(x, y);
  if (length > 1) { x /= length; y /= length; }
  p.moving = length > .05;
  p.running = Boolean(input.run && p.moving && p.stamina > .4);
  p.stamina = clamp(p.stamina + (p.running ? -22 : 16) * dt, 0, maxStamina(state));
  const speed = 180 * (1 + state.upgrades.speed * .12) * (p.running ? 1.45 : 1);
  const nx = clamp(p.x + x * speed * dt, 20, WORLD.width - 20), ny = clamp(p.y + y * speed * dt, 20, WORLD.height - 20);
  if (canOccupy(nx, p.y)) p.x = nx;
  if (canOccupy(p.x, ny)) p.y = ny;
  if (p.moving) p.facing = Math.atan2(y, x);
  for (const car of state.traffic) {
    car.progress += car.speed * dt;
    Object.assign(car, trafficAt(car.progress));
    if (p.invincible <= 0 && distance(p, car) < 35) {
      const damage = 25 * (1 - state.upgrades.helmet * .15);
      p.health = Math.max(0, p.health - damage); p.invincible = 1.5;
      inform(state, 'Awas kendaraan! Pulihkan kondisi gratis di Pos Paket.');
      if (p.health <= 0) {
        p.x = DEPOT.x; p.y = DEPOT.y; p.health = 100; p.stamina = maxStamina(state); p.invincible = 3;
        inform(state, 'Diantar pulang ke pos. Uang dan paketmu tetap aman.');
      }
    }
  }
}
export function step(state, input = {}, dt = FIXED_DT) {
  if (!Number.isFinite(dt) || dt <= 0) return state;
  state.accumulator += Math.min(dt, .25);
  while (state.accumulator + 1e-9 >= FIXED_DT) { tick(state, input); state.accumulator -= FIXED_DT; }
  return state;
}
export function contextAction(state) {
  if (distance(state.player, DEPOT) <= INTERACT_RADIUS) return { kind: 'depot', label: state.parcel ? 'Pulihkan kondisi' : 'Ambil paket' };
  if (distance(state.player, GARAGE) <= INTERACT_RADIUS) return { kind: 'garage', label: 'Buka bengkel' };
  const home = state.parcel && HOMES.find(h => h.id === state.parcel.homeId);
  if (home && distance(state.player, home) <= INTERACT_RADIUS) return { kind: 'deliver', label: `Antar ke ${home.name}` };
  return { kind: 'none', label: state.parcel ? 'Dekati pintu tujuan' : 'Kembali ke Pos Paket' };
}
export function interact(state) {
  const action = contextAction(state);
  if (action.kind === 'depot') {
    state.player.health = 100; state.player.stamina = maxStamina(state);
    if (state.parcel) { inform(state, 'Kondisi pulih. Paketmu masih menunggu diantar!'); return { ok: true, kind: 'recover', message: state.notification }; }
    const home = HOMES[DELIVERY_ORDER[state.sequence % DELIVERY_ORDER.length]];
    const id = `paket-${state.sequence + 1}`;
    state.sequence++;
    const reward = Math.round((80 + Math.min(100, distance(DEPOT, home) / 23)) * (1 + state.upgrades.income * .15));
    state.parcel = { id, homeId: home.id, reward };
    inform(state, `Paket untuk ${home.name}. Ikuti penanda kuning!`);
    return { ok: true, kind: 'pickup', message: state.notification };
  }
  if (action.kind === 'garage') return { ok: true, kind: 'garage', message: 'Bengkel siap melayani.' };
  if (action.kind === 'deliver') {
    const parcel = state.parcel;
    if (state.completedIds.includes(parcel.id)) { state.parcel = null; return { ok: false, message: 'Paket ini sudah diantar.' }; }
    state.balance += parcel.reward; state.deliveries++; state.completedIds.push(parcel.id); state.parcel = null;
    state.achievement = state.deliveries >= 12;
    inform(state, state.deliveries === 12 ? 'Kurir andalan! 12 paket sampai. Perjalanan boleh lanjut!' : `Paket sampai! +Rp${parcel.reward}. Ambil paket berikutnya di pos.`);
    return { ok: true, kind: 'delivered', reward: parcel.reward, message: state.notification };
  }
  return { ok: false, kind: 'none', message: action.label };
}
export function buyUpgrade(state, key) {
  if (distance(state.player, GARAGE) > INTERACT_RADIUS) return { ok: false, message: 'Datang ke bengkel dahulu.' };
  if (!UPGRADE_KEYS.includes(key)) return { ok: false, message: 'Perlengkapan tidak dikenal.' };
  const cost = upgradeCost(state, key);
  if (cost === null) return { ok: false, message: 'Sudah mencapai level maksimal.' };
  if (state.balance < cost) return { ok: false, message: 'Uang belum cukup. Antar paket lagi, yuk!' };
  state.balance -= cost; state.upgrades[key]++;
  if (key === 'jacket') state.player.stamina += 25;
  inform(state, 'Perlengkapan ditingkatkan. Siap jalan!');
  return { ok: true, message: state.notification };
}
export function serialize(state) {
  return JSON.stringify({ version: SAVE_VERSION, seed: state.seed, player: { x: state.player.x, y: state.player.y, health: state.player.health, stamina: state.player.stamina }, balance: state.balance, deliveries: state.deliveries, sequence: state.sequence, upgrades: state.upgrades, parcel: state.parcel, completedIds: state.completedIds });
}
export function restore(raw) {
  try {
    const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const integer = (n, max = 1e9) => Number.isSafeInteger(n) && n >= 0 && n <= max;
    if (!saved || saved.version !== SAVE_VERSION || !integer(saved.balance) || !integer(saved.deliveries, 100000) || !integer(saved.sequence, 100000) || saved.sequence < saved.deliveries || !Number.isSafeInteger(saved.seed)) throw Error('schema');
    if (!saved.upgrades || UPGRADE_KEYS.some(key => !integer(saved.upgrades[key], 3))) throw Error('upgrades');
    if (!saved.player || !Number.isFinite(saved.player.x) || !Number.isFinite(saved.player.y) || !canOccupy(saved.player.x, saved.player.y) || !Number.isFinite(saved.player.health) || saved.player.health <= 0 || saved.player.health > 100 || !Number.isFinite(saved.player.stamina) || saved.player.stamina < 0 || saved.player.stamina > 100 + saved.upgrades.jacket * 25) throw Error('player');
    if (saved.sequence !== saved.deliveries + (saved.parcel === null ? 0 : 1)) throw Error('sequence');
    if (!Array.isArray(saved.completedIds) || saved.completedIds.length !== saved.deliveries || saved.completedIds.some((id, index) => id !== `paket-${index + 1}`)) throw Error('ids');
    if (saved.parcel !== null && (!saved.parcel || saved.parcel.id !== `paket-${saved.sequence}` || saved.completedIds.includes(saved.parcel.id) || !HOMES.some(home => home.id === saved.parcel.homeId) || !integer(saved.parcel.reward, 300) || saved.parcel.reward < 80)) throw Error('parcel');
    const state = createState(saved.seed);
    Object.assign(state, { balance: saved.balance, deliveries: saved.deliveries, sequence: saved.sequence, upgrades: { ...saved.upgrades }, parcel: saved.parcel ? { ...saved.parcel } : null, completedIds: [...saved.completedIds], achievement: saved.deliveries >= 12 });
    Object.assign(state.player, { x: saved.player.x, y: saved.player.y, health: saved.player.health, stamina: saved.player.stamina });
    return state;
  } catch { return createState(); }
}

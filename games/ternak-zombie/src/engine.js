export const WORLD = { width: 2200, height: 1600 };
export const HOME = { x: 1130, y: 800 };
export const CAGE = { x: 865, y: 800, width: 180, height: 180 };
export const COSTS = { turret: 12, repair: 4, upgrades: [10, 18], shot: 3 };
export const UPGRADE_ZONES = [
  { kind: 'cage', label: 'KINETIK', x: 850, y: 1010, size: 64, color: 0x9acbae },
  { kind: 'shelter', label: 'SHELTER', x: 1030, y: 1010, size: 64, color: 0xe4b66c },
  { kind: 'walls', label: 'DINDING', x: 1190, y: 1010, size: 64, color: 0x9ebadc },
  { kind: 'turret', label: 'MENARA', x: 1350, y: 960, size: 64, color: 0xd1a2cb },
];
const UPGRADE_PLANS = { cage: [{ cost: 10, duration: 10 }, { cost: 18, duration: 20 }], shelter: [{ cost: 12, duration: 12 }, { cost: 22, duration: 22 }], walls: [{ cost: 8, duration: 8 }, { cost: 14, duration: 14 }, { cost: 22, duration: 20 }], turret: Array.from({ length: 3 }, () => ({ cost: 12, duration: 8 })) };
export function getUpgradeZone(s, kind) { return kind ? UPGRADE_ZONES.find(z => z.kind === kind) || null : UPGRADE_ZONES.find(z => Math.abs(s.player.x - z.x) <= z.size / 2 && Math.abs(s.player.y - z.y) <= z.size / 2) || null; }
export function getUpgradeInfo(s, kind) {
  const zone = UPGRADE_ZONES.find(z => z.kind === kind); if (!zone) return null;
  const index = kind === 'cage' ? s.cage.level : kind === 'shelter' ? s.shelter.level - 1 : kind === 'walls' ? s.walls.level : s.turrets.length;
  const plan = UPGRADE_PLANS[kind][index], level = index + (kind === 'cage' || kind === 'shelter' ? 1 : 0);
  return { ...zone, level, nextLevel: plan ? level + 1 : null, maxLevel: UPGRADE_PLANS[kind].length + (kind === 'cage' || kind === 'shelter' ? 1 : 0), maxed: !plan, cost: plan?.cost ?? 0, duration: plan?.duration ?? 0 };
}
export const BUILDINGS = [
  { x: 190, y: 150, w: 340, h: 240, kind: 'apartemen' }, { x: 730, y: 120, w: 290, h: 280, kind: 'klinik' },
  { x: 1310, y: 170, w: 330, h: 230, kind: 'pasar' }, { x: 1830, y: 180, w: 230, h: 320, kind: 'menara' },
  { x: 180, y: 650, w: 330, h: 250, kind: 'bengkel' }, { x: 1530, y: 670, w: 360, h: 220, kind: 'sekolah' },
  { x: 250, y: 1170, w: 400, h: 240, kind: 'gudang' }, { x: 870, y: 1160, w: 320, h: 280, kind: 'stasiun' }, { x: 1510, y: 1170, w: 390, h: 240, kind: 'bioskop' },
];
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function random(s) { s.seed = (s.seed * 1664525 + 1013904223) >>> 0; return s.seed / 4294967296; }
function zombie(s, x, y, mode = 'wild') { return { id: s.nextId++, x, y, mode, hp: mode === 'hostile' ? 45 : 60, lureLeft: 0, captureProgress: 0, angle: random(s) * Math.PI * 2, moving: false, attackCooldown: 0, wanderTime: 1 + random(s) * 3 }; }
export function createState({ seed = 2718 } = {}) {
  const s = { seed, nextId: 1, time: 0, day: 1, night: false, phaseTime: 0, nightCount: 0, survivedNights: 0, player: { x: 1120, y: 940, hp: 100, maxHp: 100, facing: 'up', downTimer: 0, hitCooldown: 0, attackCooldown: 0, walking: false }, shelter: { ...HOME, hp: 250, maxHp: 250, level: 1 }, walls: { level: 0, hp: 0, maxHp: 0 }, cage: { capacity: 2, level: 0, running: true }, construction: null, constructionFeedback: null, zoneLatch: [], activeZone: null, battery: 0, batteryCapacity: 200, totalGenerated: 0, spentEnergy: 0, bait: 3, scrap: 10, zombies: [], turrets: [], nodes: [], powerRate: 0, captiveCount: 0, movingCaptives: 0, won: false, lost: false, tutorialStep: 0, message: 'Dekati zombie bertanda, lalu tekan Pancing.', messageTime: 7, lastCapture: 0, accumulator: 0 };
  s.zombies = [zombie(s, 1190, 1040), zombie(s, 660, 520), zombie(s, 1370, 1060), zombie(s, 1970, 1040), zombie(s, 610, 1450), zombie(s, 1220, 470)];
  s.zombies[0].angle = Math.PI * 1.5; s.zombies[0].wanderTime = 20;
  s.nodes = [{ x: 670, y: 620 }, { x: 1250, y: 530 }, { x: 1430, y: 1030 }, { x: 710, y: 1060 }, { x: 2010, y: 900 }, { x: 1350, y: 1420 }].map((n, i) => ({ ...n, id: i, readyAt: 0 }));
  return s;
}
function say(s, message) { s.message = message; s.messageTime = 4; }
function blocked(x, y, radius = 16) { return BUILDINGS.some(b => x > b.x - radius && x < b.x + b.w + radius && y > b.y - radius && y < b.y + b.h + radius); }
function move(body, dx, dy, speed, dt, radius = 16) {
  const length = Math.hypot(dx, dy); if (!length) return 0;
  const oldX = body.x, oldY = body.y, mx = dx / length * speed * dt, my = dy / length * speed * dt;
  const nx = clamp(body.x + mx, 35, WORLD.width - 35), ny = clamp(body.y + my, 35, WORLD.height - 35);
  if (!blocked(nx, body.y, radius)) body.x = nx;
  if (!blocked(body.x, ny, radius)) body.y = ny;
  if (distance(body, { x: oldX, y: oldY }) < speed * dt * .15) {
    const sideX = clamp(oldX - dy / length * speed * dt, 35, WORLD.width - 35), sideY = clamp(oldY + dx / length * speed * dt, 35, WORLD.height - 35);
    if (!blocked(sideX, sideY, radius)) { body.x = sideX; body.y = sideY; }
  }
  return distance(body, { x: oldX, y: oldY });
}
export function useBait(s) {
  if (s.lost || s.player.downTimer > 0) return false;
  if (s.bait <= 0) { say(s, 'Umpan habis. Cari peti persediaan berwarna kuning.'); return false; }
  const target = s.zombies.filter(z => z.mode === 'wild' && distance(z, s.player) < 250).sort((a, b) => distance(a, s.player) - distance(b, s.player))[0];
  if (!target) { say(s, 'Dekati zombie liar hingga jarak pancing 250 m.'); return false; }
  s.bait--; target.mode = 'lured'; target.lureLeft = 25; target.captureProgress = 0; s.tutorialStep = Math.max(1, s.tutorialStep);
  say(s, 'Ia mengikutimu! Bawa zombie ke area Kinetik dari sisi mana pun.'); return true;
}
export function getContext(s) {
  const node = s.nodes.find(n => distance(n, s.player) < 85 && n.readyAt <= s.time);
  if (node) return { type: 'scavenge', node, label: 'Ambil persediaan' };
  if (distance(s.player, HOME) < 230) return { type: 'home', label: s.shelter.hp < s.shelter.maxHp ? 'Perbaiki shelter' : s.walls.hp < s.walls.maxHp ? 'Perbaiki dinding' : 'Periksa shelter' };
  return { type: 'none', label: 'Cari peti terdekat' };
}
export function interact(s) {
  if (s.lost || s.player.downTimer > 0) return false;
  const context = getContext(s);
  if (context.type === 'scavenge') { context.node.readyAt = s.time + 45; s.scrap += 5; s.bait += 2; say(s, '+5 rongsok · +2 umpan. Peti terisi lagi dalam 45 detik.'); return true; }
  if (context.type === 'home') { if (s.shelter.hp < s.shelter.maxHp || s.walls.hp < s.walls.maxHp) return repairShelter(s); say(s, 'Berdiri di kotak tanah untuk membangun. E memperbaiki kerusakan: 4 rongsok.'); return true; }
  say(s, 'Dekati peti persediaan di peta kecil.'); return false;
}
function nearHome(s) { if (distance(s.player, HOME) > 260) { say(s, 'Kembali mendekati shelter untuk membangun.'); return false; } return !s.lost && !s.player.downTimer; }
function updateConstruction(s, dt) {
  const zone = getUpgradeZone(s), entered = s.activeZone !== (zone?.kind ?? null);
  s.activeZone = zone?.kind ?? null; s.zoneLatch = s.zoneLatch.filter(kind => kind === zone?.kind);
  if (s.player.downTimer > 0 || s.player.hp <= 0 || s.lost || s.shelter.hp <= 0) return;
  if (!s.construction && zone && !s.zoneLatch.includes(zone.kind)) {
    const info = getUpgradeInfo(s, zone.kind);
    if (info.maxed) { if (entered) say(s, `${zone.label} sudah maksimal.`); return; }
    if (s.scrap < info.cost) { if (entered || s.messageTime <= 0) say(s, `${zone.label}: butuh ${info.cost} rongsok · ${info.duration} detik.`); return; }
    s.scrap -= info.cost; s.construction = { kind: zone.kind, progress: 0, duration: info.duration, paidCost: info.cost };
    say(s, `${zone.label}: tetap di kotak ${info.duration} detik. Keluar untuk jeda.`);
  }
  const job = s.construction; if (!job || zone?.kind !== job.kind) return;
  job.progress = Math.min(job.duration, job.progress + dt);
  if (job.progress + 1e-8 < job.duration) return;
  if (job.kind === 'cage') { s.cage.level++; s.cage.capacity += 2; }
  if (job.kind === 'shelter') { s.shelter.level++; const next = s.shelter.level === 2 ? 350 : 475; s.shelter.hp = Math.min(next, s.shelter.hp + next - s.shelter.maxHp); s.shelter.maxHp = next; }
  if (job.kind === 'walls') { s.walls.level++; s.walls.maxHp = [0, 100, 180, 280][s.walls.level]; s.walls.hp = s.walls.maxHp; }
  if (job.kind === 'turret') { const positions = [{ x: 1275, y: 880 }, { x: 1300, y: 710 }, { x: 1050, y: 640 }]; s.turrets.push({ ...positions[s.turrets.length], cooldown: 0, flash: 0, targetX: 0, targetY: 0 }); }
  s.zoneLatch.push(job.kind); s.constructionFeedback = { kind: job.kind, until: s.time + 4 }; s.construction = null;
  say(s, `${zone.label} selesai! Keluar lalu masuk lagi untuk tingkat berikutnya.`);
}
export function repairShelter(s) {
  if (!nearHome(s)) return false;
  const target = s.shelter.hp < s.shelter.maxHp ? s.shelter : s.walls;
  if (target.hp >= target.maxHp) { say(s, 'Shelter dan dinding dalam kondisi baik.'); return false; }
  if (s.scrap < 4) { say(s, 'Butuh 4 rongsok untuk perbaikan.'); return false; }
  s.scrap -= 4; const restored = Math.min(70, target.maxHp - target.hp); target.hp += restored; say(s, `${target === s.shelter ? 'Shelter' : 'Dinding'} diperbaiki +${restored}.`); return true;
}
export function toggleGenerator(s) { if (!nearHome(s)) return false; s.cage.running = !s.cage.running; if (!s.cage.running) { s.powerRate = 0; s.movingCaptives = 0; s.zombies.filter(z=>z.mode==='captive').forEach(z=>z.moving=false); } say(s, s.cage.running ? 'Generator berputar. Gerakan zombie menghasilkan listrik.' : 'Zombie beristirahat. Produksi listrik 0 W.'); return true; }
function spawnNight(s) {
  s.nightCount++;
  const points = [{ x: 1140, y: 1480 }, { x: 2100, y: 1000 }, { x: 70, y: 1000 }, { x: 1180, y: 60 }, { x: 650, y: 520 }, { x: 2010, y: 620 }, { x: 700, y: 1490 }];
  for (let i = 0; i < 4 + s.nightCount; i++) { const p = points[i % points.length]; s.zombies.push(zombie(s, p.x + (i > 6 ? 30 : 0), p.y, 'hostile')); }
  say(s, `Malam ${s.nightCount}. Lindungi shelter; zombie terpancing tetap aman dari menara.`);
}
function tick(s, dt, input) {
  s.time += dt; s.phaseTime += dt; s.messageTime = Math.max(0, s.messageTime - dt);
  if ((!s.night && s.phaseTime >= (s.day === 1 ? 90 : 55)) || (s.night && s.phaseTime >= 50)) {
    s.phaseTime = 0; s.night = !s.night;
    if (s.night) spawnNight(s); else { s.survivedNights++; s.day++; s.zombies = s.zombies.filter(z => z.mode !== 'hostile'); s.bait += 2; say(s, 'Fajar! +2 umpan. Jelajahi kota dan perluas peternakan.'); }
  }
  const p = s.player; p.hitCooldown = Math.max(0, p.hitCooldown - dt); p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  if (p.downTimer > 0) { p.downTimer -= dt; if (p.downTimer <= 0) { p.x = 1120; p.y = 940; p.hp = 60; p.hitCooldown = 3; say(s, 'Raya pulih di shelter. Zombie dalam kandang tetap aman.'); } }
  else {
    const dx = clamp(Number(input.x) || 0, -1, 1), dy = clamp(Number(input.y) || 0, -1, 1);
    p.walking = move(p, dx, dy, 170, dt) > .01;
    if (dx || dy) p.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    if (distance(p, HOME) < 185) p.hp = Math.min(100, p.hp + dt * 4);
  }
  let generated = 0, moving = 0; const captives = s.zombies.filter(z => z.mode === 'captive'); s.captiveCount = captives.length;
  for (const z of s.zombies) {
    z.attackCooldown = Math.max(0, z.attackCooldown - dt); z.moving = false;
    if (z.mode === 'captive') {
      if (s.cage.running) { const old = { x: z.x, y: z.y }; z.angle += dt * 1.2; const radius = 36 + (captives.indexOf(z) % 3) * 12; z.x = CAGE.x + Math.cos(z.angle) * radius; z.y = CAGE.y + Math.sin(z.angle) * radius * .8; const traveled = distance(old, z); generated += traveled * .035; z.moving = traveled > .001; if (z.moving) moving++; }
      continue;
    }
    if (z.mode === 'lured') {
      z.lureLeft -= dt;
      if (z.lureLeft <= 0) { z.mode = 'wild'; z.captureProgress = 0; say(s, 'Umpan habis efeknya. Pancing kembali jika perlu.'); }
      else if (Math.abs(z.x - CAGE.x) <= CAGE.width / 2 && Math.abs(z.y - CAGE.y) <= CAGE.height / 2 && s.captiveCount < s.cage.capacity) {
        z.captureProgress += dt;
        if (z.captureProgress >= .8) { z.mode = 'captive'; const r = 36 + s.captiveCount % 3 * 12; z.x = CAGE.x + Math.cos(z.angle) * r; z.y = CAGE.y + Math.sin(z.angle) * r * .8; s.captiveCount++; s.lastCapture = s.time; s.tutorialStep = 2; say(s, 'Tertangkap! Langkah zombie kini mengisi baterai shelter.'); }
      } else { z.captureProgress = 0; if (distance(z, p) > 36) z.moving = move(z, p.x - z.x, p.y - z.y, 112, dt) > .01; if (distance(z, CAGE) <= 145 && s.captiveCount >= s.cage.capacity && s.messageTime <= 0) say(s, 'Kinetik penuh. Berdiri di kotak KINETIK untuk menambah kapasitas.'); }
      continue;
    }
    if (z.mode === 'hostile') {
      const target = distance(z, p) < 180 && !p.downTimer ? p : HOME;
      const wallContact = s.walls.hp > 0 && distance(z, HOME) < 165;
      if (!wallContact) z.moving = move(z, target.x - z.x, target.y - z.y, 51 + s.nightCount * 3, dt) > .01;
      if ((wallContact || distance(z, HOME) < 85) && z.attackCooldown <= 0) { const absorbed = Math.min(5, s.walls.hp); s.walls.hp -= absorbed; s.shelter.hp -= 5 - absorbed; z.attackCooldown = 1.5; }
    } else {
      z.wanderTime -= dt;
      const threatened = distance(z, p) < 110 && !p.downTimer;
      if (threatened) z.moving = move(z, p.x - z.x, p.y - z.y, 85, dt) > .01;
      else { if (z.wanderTime <= 0) { z.angle = random(s) * Math.PI * 2; z.wanderTime = 2 + random(s) * 3; } z.moving = move(z, Math.cos(z.angle), Math.sin(z.angle), 13, dt) > .01; }
    }
    if (!p.downTimer && distance(z, p) < 32 && p.hitCooldown <= 0) { p.hp -= z.mode === 'hostile' ? 10 : 8; p.hitCooldown = 1; }
  }
  s.powerRate = generated / dt; s.movingCaptives = moving; s.totalGenerated += generated; s.battery = Math.min(s.batteryCapacity, s.battery + generated);
  if (!p.downTimer && p.attackCooldown <= 0) { const target = s.zombies.find(z => (z.mode === 'hostile' || z.mode === 'wild') && distance(z, p) < 64); if (target) { target.hp -= 9; p.attackCooldown = .7; } }
  s.basicCooldown = Math.max(0, (s.basicCooldown || 0) - dt);
  if (s.basicCooldown <= 0) { const target = s.zombies.find(z => z.mode === 'hostile' && distance(z, HOME) < 170); if (target) { target.hp -= 7; s.basicCooldown = 1; } }
  for (const t of s.turrets) { t.cooldown = Math.max(0, t.cooldown - dt); t.flash = Math.max(0, t.flash - dt); const target = s.zombies.filter(z => z.mode === 'hostile' && distance(z, t) < 300).sort((a, b) => distance(a, HOME) - distance(b, HOME))[0]; if (target && t.cooldown <= 0 && s.battery >= 3) { s.battery -= 3; s.spentEnergy += 3; target.hp -= 25; t.cooldown = 1.2; t.flash = .2; t.targetX = target.x; t.targetY = target.y; } }
  s.zombies = s.zombies.filter(z => z.hp > 0);
  if (p.hp <= 0 && p.downTimer <= 0) { p.downTimer = 3; p.walking = false; say(s, 'Raya terluka. Kembali ke shelter dalam 3 detik…'); }
  if (s.shelter.hp <= 0) { s.shelter.hp = 0; s.lost = true; say(s, 'Shelter padam. Mulai lagi dan bangun pertahanan lebih awal.'); }
  updateConstruction(s, dt);
  if (!s.won && s.survivedNights >= 1 && s.totalGenerated >= 120 && !s.lost) { s.won = true; say(s, 'Kota kembali menyala. Malam pertama terlewati!'); }
  if (s.time > 25 && s.zombies.filter(z => z.mode === 'wild').length < 4 && s.time - (s.lastWildSpawn || 0) > 25) { s.lastWildSpawn = s.time; const spawn = [{x:670,y:1040},{x:1350,y:520},{x:1410,y:1050}][Math.floor(random(s)*3)]; s.zombies.push(zombie(s, spawn.x, spawn.y)); }
}
export function step(s, seconds, input = {}) {
  if (s.lost || s.paused || s.hidden || input.paused || input.hidden || !Number.isFinite(seconds) || seconds <= 0) return s;
  s.accumulator = (s.accumulator || 0) + Math.min(.25, seconds);
  while (s.accumulator + 1e-9 >= 1/60 && !s.lost) { tick(s, 1/60, input); s.accumulator -= 1/60; }
  return s;
}
export function getObjective(s) { if (s.survivedNights >= 1 && s.totalGenerated >= 120) return 'Kota menyala — terus kembangkan shelter'; if (!s.captiveCount) return s.tutorialStep ? 'Bawa zombie ke area Kinetik dari sisi mana pun' : 'Pancing zombie liar pertama'; if (s.totalGenerated < 120) return `Hasilkan ${Math.floor(s.totalGenerated)}/120 energi dari langkah zombie`; return 'Bertahan hingga fajar pertama'; }

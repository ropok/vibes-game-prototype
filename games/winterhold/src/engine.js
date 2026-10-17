/** Deterministic, DOM-free game rules. Distances are world pixels; time is seconds. */
export const WORLD = Object.freeze({ width: 2600, height: 2000, baseX: 1300, baseY: 1000 });
export const SETTLER_DEFENSE = Object.freeze({ damage: 6, cooldown: 1.5, range: 175, shelterRange: 230 });
export const BUILDINGS = Object.freeze({
  shelter: { name: 'Longhouse', wood: 16, stone: 6, food: 0, max: 2, description: '+4 beds. Make room for more settlers.' },
  barricade: { name: 'Palisade', wood: 18, stone: 8, food: 0, max: 2, description: '+100 hearth health and slows attackers.' },
  watchtower: { name: 'Watchtower', wood: 22, stone: 14, food: 0, max: 2, description: 'An archer fires at nearby threats.' },
  barracks: { name: 'Training yard', wood: 18, stone: 8, food: 0, max: 1, description: 'Unlock training. Each guard costs 5 wood + 5 food.' },
});
const STEP = 1 / 30;
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function random(s) {
  s.rng = (Math.imul(s.rng, 1664525) + 1013904223) >>> 0;
  return s.rng / 4294967296;
}
function event(s, text, tone = 'info') {
  s.events.push({ id: ++s.eventId, text, tone, time: s.elapsed });
  if (s.events.length > 12) s.events.shift();
}
function addSettler(s) {
  const index = s.nextSettlerId++, angle = index * 2.1, radius = 65 + index % 3 * 21;
  const x = s.base.x + Math.cos(angle) * radius, y = s.base.y + Math.sin(angle) * radius * 0.65;
  s.settlers.push({ id: `settler-${index + 1}`, x, y, cooldown: 0, attackFlash: 0, attackX: x, attackY: y });
}
export function createGame({ seed = 4271, winterAt = 150 } = {}) {
  const s = {
    rng: seed >>> 0, elapsed: 0, accumulator: 0, winterAt: Math.max(10, winterAt), status: 'playing', paused: false,
    player: { x: 1300, y: 1130, hp: 100, maxHp: 100, attackCooldown: 0, gatherCooldown: 0, facing: 1 },
    base: { x: 1300, y: 1000, hp: 280, maxHp: 280 },
    resources: { wood: 24, stone: 14, food: 20 }, survivors: 2, capacity: 4, trained: 0,
    structures: [], troops: [], settlers: [], enemies: [], nodes: [], camps: [], events: [], eventId: 0,
    nextEnemyId: 0, nextTroopId: 0, nextSettlerId: 0, nextRaid: 44, warnings: [], gatherCount: 0, rescued: 0,
    wave: { started: false, remaining: 0, spawned: 0, total: 18, nextSpawn: 0 },
    stats: { slain: 0, gathered: 0, recruited: 0, built: 0 },
  };
  for (let i = 0; i < s.survivors; i++) addSettler(s);
  const groves = [
    ['wood', 1000, 1260, 7], ['stone', 1610, 1210, 6], ['food', 1120, 720, 6],
    ['wood', 750, 650, 8], ['stone', 1930, 730, 7], ['food', 1790, 1490, 7],
    ['wood', 650, 1460, 6], ['food', 550, 1050, 6], ['stone', 1000, 450, 5],
  ];
  for (const [type, x, y, count] of groves) {
    for (let i = 0; i < count; i++) {
      const angle = random(s) * Math.PI * 2, r = Math.sqrt(random(s)) * 95;
      s.nodes.push({ id: `node-${s.nodes.length}`, type, x: x + Math.cos(angle) * r, y: y + Math.sin(angle) * r, amount: 24, max: 24 });
    }
  }
  s.camps = [
    { id: 'camp-west', name: 'Pinefolk camp', x: 800, y: 990, people: 3 },
    { id: 'camp-east', name: 'Wayfarer camp', x: 1850, y: 1070, people: 3 },
    { id: 'camp-north', name: 'Ridge camp', x: 1320, y: 470, people: 3 },
  ];
  for (const [x, y] of [[440, 530], [2170, 1450], [2130, 430]]) spawnEnemy(s, 'wolf', x, y, false);
  event(s, 'A hearth in the wild. Build a longhouse, then find the Pinefolk to the west.');
  return s;
}
export function nearestInteraction(s) {
  const choices = [
    ...s.nodes.filter(n => n.amount > 0).map(n => ({ ...n, kind: 'gather', distance: distance(s.player, n) })),
    ...s.camps.filter(c => c.people > 0).map(c => ({ ...c, kind: 'recruit', distance: distance(s.player, c) })),
  ].filter(n => n.distance <= (n.kind === 'recruit' ? 125 : 98));
  choices.sort((a, b) => a.distance - b.distance);
  return choices[0] || null;
}
export function atBase(s) { return distance(s.player, s.base) <= 265; }
export function getBuildInfo(s, kind) {
  const spec = BUILDINGS[kind];
  if (!spec) return { available: false, reason: 'Unknown building' };
  const count = s.structures.filter(b => b.kind === kind).length;
  const reason = s.status !== 'playing' ? 'Game ended' : s.paused ? 'Paused' : !atBase(s) ? 'Return to the hearth to build' : count >= spec.max ? 'Fully built' : Object.keys(s.resources).some(r => s.resources[r] < spec[r]) ? 'Gather more resources' : '';
  return { ...spec, count, available: !reason, reason };
}
export function build(s, kind) {
  if (s.status !== 'playing' || s.paused) return false;
  const info = getBuildInfo(s, kind);
  if (!info.available) { if (info.reason) event(s, info.reason); return false; }
  for (const r of Object.keys(s.resources)) s.resources[r] -= info[r];
  const positions = {
    shelter: [[1190, 945], [1410, 945]], watchtower: [[1150, 1110], [1450, 1110]],
    barracks: [[1300, 860]], barricade: [[1300, 1195], [1300, 795]],
  };
  const [x, y] = positions[kind][info.count];
  s.structures.push({ id: `building-${s.structures.length}`, kind, x, y, cooldown: 0 });
  if (kind === 'shelter') s.capacity += 4;
  if (kind === 'barricade') { s.base.maxHp += 100; s.base.hp += 100; }
  s.stats.built++;
  event(s, `${info.name} built. ${info.description}`, 'success');
  return true;
}
export function train(s) {
  let reason = '';
  if (s.status !== 'playing' || s.paused) return false;
  if (!atBase(s)) reason = 'Return to the hearth to train';
  else if (!s.structures.some(b => b.kind === 'barracks')) reason = 'Build a training yard first';
  else if (s.trained >= s.survivors) reason = 'Recruit more settlers to train';
  else if (s.resources.wood < 5 || s.resources.food < 5) reason = 'A guard needs 5 wood and 5 food';
  if (reason) { event(s, reason); return false; }
  s.resources.wood -= 5; s.resources.food -= 5; s.trained++;
  s.settlers.shift();
  const angle = s.trained * 2.4;
  s.troops.push({ id: `guard-${++s.nextTroopId}`, x: s.base.x + Math.cos(angle) * 110, y: s.base.y + Math.sin(angle) * 110, hp: 85, maxHp: 85, cooldown: 0, homeAngle: angle });
  event(s, 'A new guard stands ready. Guards defend the hearth automatically.', 'success');
  return true;
}
export function interact(s) {
  if (s.status !== 'playing' || s.paused) return false;
  const n = nearestInteraction(s);
  if (!n) { event(s, 'Move close to a tree, rock, berry bush, or survivor camp.'); return false; }
  if (n.kind === 'gather') {
    if (s.player.gatherCooldown > 0) return false;
    const node = s.nodes.find(node => node.id === n.id), amount = Math.min(8, node.amount);
    node.amount -= amount; s.resources[node.type] += amount; s.player.gatherCooldown = 0.65;
    s.gatherCount++; s.stats.gathered += amount;
    event(s, `+${amount} ${node.type}`, 'success');
    return true;
  }
  if (s.survivors >= s.capacity) { event(s, 'No spare beds. Build a longhouse at the hearth.'); return false; }
  if (s.resources.food < 4) { event(s, 'A new settler needs 4 food. Gather berries first.'); return false; }
  const camp = s.camps.find(c => c.id === n.id);
  camp.people--; s.survivors++; s.resources.food -= 4; s.rescued++; s.stats.recruited++;
  addSettler(s);
  event(s, 'A settler joins your refuge and throws stones at nearby intruders. Train them for stronger defense.', 'success');
  return true;
}
export function eat(s) {
  if (s.status !== 'playing' || s.paused || s.resources.food < 4 || s.player.hp >= 100) return false;
  s.resources.food -= 4; s.player.hp = Math.min(100, s.player.hp + 40);
  event(s, 'Berry provisions restore 40 health.', 'success'); return true;
}
export function repair(s) {
  if (s.status !== 'playing' || s.paused || !atBase(s) || s.resources.wood < 8 || s.base.hp >= s.base.maxHp) return false;
  s.resources.wood -= 8; s.base.hp = Math.min(s.base.maxHp, s.base.hp + 65);
  event(s, 'The hearth is repaired for 65 health.', 'success'); return true;
}
function spawnEnemy(s, kind, x, y, wave) {
  s.enemies.push({ id: ++s.nextEnemyId, kind, x, y, hp: kind === 'wolf' ? 38 : 56, maxHp: kind === 'wolf' ? 38 : 56, cooldown: 0, wave, raid: wave || kind === 'raider', originX: x, originY: y, phase: random(s) * 7 });
}
function moveToward(e, target, speed, dt) {
  const dx = target.x - e.x, dy = target.y - e.y, d = Math.hypot(dx, dy);
  if (d > 0.1) { const step = Math.min(d, speed * dt); e.x += dx / d * step; e.y += dy / d * step; }
}
function damageEnemy(s, e, amount) {
  if (e.hp <= 0) return;
  e.hp -= amount;
  if (e.hp <= 0) {
    s.stats.slain++;
    if (e.wave) s.wave.remaining--;
    s.resources.food += e.kind === 'wolf' ? 4 : 1;
  }
}
function simulate(s, dt, input) {
  s.elapsed += dt;
  const p = s.player;
  const magnitude = Math.hypot(input.x || 0, input.y || 0);
  const dx = (input.x || 0) / Math.max(1, magnitude), dy = (input.y || 0) / Math.max(1, magnitude);
  p.x = clamp(p.x + dx * 235 * dt, 80, WORLD.width - 80);
  p.y = clamp(p.y + dy * 235 * dt, 85, WORLD.height - 85);
  if (dx) p.facing = dx < 0 ? -1 : 1;
  p.attackCooldown = Math.max(0, p.attackCooldown - dt);
  p.gatherCooldown = Math.max(0, p.gatherCooldown - dt);
  if (atBase(s)) p.hp = Math.min(100, p.hp + 2 * dt);
  for (const threshold of [60, 30, 10]) if (s.winterAt - s.elapsed <= threshold && !s.warnings.includes(threshold)) {
    s.warnings.push(threshold); event(s, `${threshold} seconds until winter. Return and prepare your defenses!`, 'warning');
  }
  if (!s.wave.started && s.elapsed >= s.winterAt) {
    s.wave.started = true; s.wave.remaining = s.wave.total; s.wave.nextSpawn = s.elapsed;
    event(s, 'WINTER IS HERE. The horde approaches from every trail. Hold the hearth!', 'warning');
  }
  if (s.wave.started && s.wave.spawned < s.wave.total && s.elapsed >= s.wave.nextSpawn) {
    const angle = (s.wave.spawned % 4) * Math.PI / 2 + 0.2 + random(s) * 0.35;
    spawnEnemy(s, 'raider', s.base.x + Math.cos(angle) * 920, s.base.y + Math.sin(angle) * 800, true);
    s.wave.spawned++; s.wave.nextSpawn = s.elapsed + 1.55;
  }
  if (!s.wave.started && s.elapsed >= s.nextRaid) {
    const angle = random(s) * Math.PI * 2;
    spawnEnemy(s, 'raider', s.base.x + Math.cos(angle) * 900, s.base.y + Math.sin(angle) * 800, false);
    s.nextRaid += 42; event(s, 'A bandit has entered the valley. Your hearth needs defenders.', 'warning');
  }
  for (const e of s.enemies) {
    if (e.hp <= 0) continue;
    e.cooldown = Math.max(0, e.cooldown - dt);
    const nearbyGuard = s.troops.filter(t => t.hp > 0 && distance(t, e) < 95).sort((a, b) => distance(a, e) - distance(b, e))[0];
    let target;
    if (distance(p, e) < (e.raid ? 125 : 250)) target = p;
    else if (nearbyGuard) target = nearbyGuard;
    else if (e.raid) target = s.base;
    else target = { x: e.originX + Math.sin(s.elapsed * 0.24 + e.phase) * 80, y: e.originY + Math.cos(s.elapsed * 0.19 + e.phase) * 65 };
    const stop = target === s.base ? 65 : 29;
    if (distance(e, target) > stop) {
      const slow = s.structures.some(b => b.kind === 'barricade') && distance(e, s.base) < 245 ? 0.64 : 1;
      moveToward(e, target, (e.kind === 'wolf' ? 106 : 88) * slow, dt);
    } else if (target.hp !== undefined && e.cooldown <= 0) {
      target.hp -= target === s.base ? 7 : 6; e.cooldown = 1.2;
    }
  }
  const playerTarget = s.enemies.filter(e => e.hp > 0 && distance(e, p) <= 110).sort((a, b) => distance(a, p) - distance(b, p))[0];
  if (playerTarget && p.attackCooldown <= 0) { damageEnemy(s, playerTarget, 22); p.attackCooldown = 0.6; }
  for (const settler of s.settlers) {
    settler.cooldown = Math.max(0, settler.cooldown - dt);
    settler.attackFlash = Math.max(0, settler.attackFlash - dt);
    const target = s.enemies.filter(e => e.hp > 0 && distance(e, s.base) <= SETTLER_DEFENSE.shelterRange && distance(e, settler) <= SETTLER_DEFENSE.range)
      .sort((a, b) => distance(a, s.base) - distance(b, s.base) || a.id - b.id)[0];
    if (target && settler.cooldown <= 0) {
      damageEnemy(s, target, SETTLER_DEFENSE.damage);
      settler.cooldown = SETTLER_DEFENSE.cooldown;
      settler.attackFlash = 0.18;
      settler.attackX = target.x; settler.attackY = target.y;
    }
  }
  for (const t of s.troops) {
    if (t.hp <= 0) continue;
    t.cooldown = Math.max(0, t.cooldown - dt);
    const target = s.enemies.filter(e => e.hp > 0 && distance(e, s.base) < 510).sort((a, b) => distance(a, t) - distance(b, t))[0];
    if (target) {
      if (distance(t, target) > 110) moveToward(t, target, 140, dt);
      else if (t.cooldown <= 0) { damageEnemy(s, target, 16); t.cooldown = 0.8; }
    } else {
      moveToward(t, { x: s.base.x + Math.cos(t.homeAngle) * 135, y: s.base.y + Math.sin(t.homeAngle) * 135 }, 95, dt);
      t.hp = Math.min(t.maxHp, t.hp + 1 * dt);
    }
  }
  for (const b of s.structures) if (b.kind === 'watchtower') {
    b.cooldown = Math.max(0, b.cooldown - dt);
    const target = s.enemies.filter(e => e.hp > 0 && distance(e, b) < 470).sort((a, c) => distance(a, b) - distance(c, b))[0];
    if (target && b.cooldown <= 0) { damageEnemy(s, target, 26); b.cooldown = 1; }
  }
  s.enemies = s.enemies.filter(e => e.hp > 0);
  const fallenGuards = s.troops.filter(t => t.hp <= 0).length;
  if (fallenGuards) { s.survivors -= fallenGuards; event(s, `${fallenGuards === 1 ? 'A guard has' : `${fallenGuards} guards have`} fallen defending the hearth.`, 'warning'); }
  s.troops = s.troops.filter(t => t.hp > 0);
  s.trained = s.troops.length;
  if (p.hp <= 0 || s.base.hp <= 0) { s.status = 'lost'; event(s, p.hp <= 0 ? 'The wilds claimed their keeper.' : 'The hearth has fallen.', 'warning'); }
  else if (s.wave.started && s.wave.spawned === s.wave.total && s.wave.remaining === 0) { s.status = 'won'; event(s, 'The first winter is yours. Your people have a home.', 'success'); }
}
export function stepGame(s, dt, input = {}) {
  if (s.status !== 'playing' || s.paused || !Number.isFinite(dt) || dt <= 0) return s;
  s.accumulator += Math.min(dt, 0.25);
  while (s.accumulator + 1e-9 >= STEP && s.status === 'playing') {
    simulate(s, STEP, input); s.accumulator -= STEP;
  }
  return s;
}

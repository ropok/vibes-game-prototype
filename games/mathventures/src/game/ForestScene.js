import Phaser from 'phaser';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Original procedural artwork: no remote assets, fonts, or image requests. */
export class ForestScene extends Phaser.Scene {
  constructor() { super('forest'); }

  create() {
    const g = this.add.graphics();
    g.fillGradientStyle(0x173d3b, 0x183f3d, 0x092825, 0x0b2927, 1);
    g.fillRect(0, 0, 1000, 450);
    // Distant glimmer, hills, and a cathedral of old trees.
    for (let i = 10; i > 0; i -= 1) {
      g.fillStyle(0x8cc6a1, 0.012);
      g.fillEllipse(500, 210, i * 65, i * 55);
    }
    g.fillStyle(0x97c7ad, 0.075);
    g.fillTriangle(455, 0, 350, 355, 580, 355);
    g.fillTriangle(600, 0, 500, 350, 700, 350);
    [45, 140, 275, 685, 820, 950].forEach((x, i) => {
      g.fillStyle(i % 2 ? 0x153c38 : 0x103430);
      g.fillRoundedRect(x - 18, -90, 36, 440, 16);
      g.lineStyle(16, 0x163d37, 1);
      g.beginPath(); g.moveTo(x, 150); g.lineTo(x - 70, 70); g.lineTo(x - 90, -10); g.strokePath();
      g.beginPath(); g.moveTo(x, 110); g.lineTo(x + 75, 25); g.lineTo(x + 110, -20); g.strokePath();
    });
    // Moonlit ruined arch.
    g.lineStyle(15, 0x688d7f, 0.15);
    g.beginPath(); g.moveTo(425, 300); g.lineTo(425, 165); g.arc(500, 165, 75, Math.PI, Math.PI * 2); g.lineTo(575, 300); g.strokePath();
    g.lineStyle(2, 0x9abf9b, 0.12); g.strokeCircle(500, 181, 43);
    g.lineStyle(1, 0xc6d8ab, 0.16); g.strokeCircle(500, 181, 32);
    g.fillStyle(0xd2dca4, 0.32); g.fillTriangle(500, 155, 511, 179, 500, 200); g.fillTriangle(500, 155, 489, 179, 500, 200);
    // Quiet path and layers of moss.
    g.fillStyle(0x284a3c); g.fillEllipse(500, 432, 1200, 220);
    g.fillStyle(0x365543, 0.7); g.fillEllipse(500, 425, 630, 155);
    g.fillStyle(0x547059, 0.3); g.fillEllipse(480, 450, 350, 180);
    for (let i = 0; i < 22; i += 1) {
      const x = (i * 137 + 30) % 1000; const y = 355 + (i * 31) % 85;
      g.fillStyle(0x0c302b, 0.7); g.fillEllipse(x, y, 45 + i % 4 * 10, 16);
      g.fillStyle(0x8baf78, 0.35); g.fillEllipse(x - 3, y - 6, 24, 8);
    }
    this.drawPlatform(260, 365, 0xc7d3a0);
    this.drawPlatform(740, 365, 0xc7b478);
    this.hero = this.makeHero(260, 320);
    this.enemyIndex = -1;
    this.setEncounter(0);
    // Foreground ferns frame the stage.
    [0, 70, 945, 1000].forEach((x, index) => {
      const sign = index < 2 ? 1 : -1;
      g.lineStyle(3, 0x163d2e); g.lineBetween(x, 450, x + 40 * sign, 330);
      for (let j = 0; j < 7; j += 1) {
        g.fillStyle(j % 2 ? 0x214936 : 0x2b533c);
        g.fillTriangle(x + j * 5 * sign, 430 - j * 13, x + (j * 5 + 40) * sign, 414 - j * 13, x + j * 5 * sign, 405 - j * 13);
        g.fillTriangle(x + j * 5 * sign, 430 - j * 13, x + (j * 5 - 25) * sign, 402 - j * 13, x + j * 5 * sign, 405 - j * 13);
      }
    });
    for (let i = 0; i < 25; i += 1) {
      const x = (i * 179 + 50) % 1000; const y = 50 + (i * 67) % 300;
      const dot = this.add.circle(x, y, i % 3 ? 1.5 : 2.5, 0xf5dd8b, 0.5);
      if (!reducedMotion) this.tweens.add({ targets: dot, y: y - 18, alpha: 0.15, duration: 1600 + i * 80, yoyo: true, repeat: -1 });
    }
    if (!reducedMotion) this.tweens.add({ targets: this.hero, y: 315, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  drawPlatform(x, y, color) {
    const g = this.add.graphics();
    g.fillStyle(0x071c1a, 0.4); g.fillEllipse(x, y + 10, 175, 40);
    g.lineStyle(1, color, 0.28); g.strokeEllipse(x, y, 174, 38);
    g.lineStyle(1, color, 0.12); g.strokeEllipse(x, y, 145, 27);
    [-65, -38, 0, 38, 65].forEach((offset) => { g.fillStyle(color, 0.4); g.fillCircle(x + offset, y, 2); });
  }

  makeHero(x, y) {
    const c = this.add.container(x, y);
    const g = this.add.graphics();
    // Boots and a flowing, ink-blue travelling cloak.
    g.fillStyle(0x182a30); g.fillRoundedRect(-25, 22, 21, 23, 6); g.fillRoundedRect(10, 22, 21, 23, 6);
    g.fillStyle(0x203b4c); g.fillTriangle(0, -60, -46, 32, 42, 32);
    g.fillStyle(0x37576a); g.fillTriangle(-5, -55, -42, 26, -12, 34);
    g.lineStyle(2, 0x8eb3a2, 0.5); g.lineBetween(-35, 27, 25, 31);
    g.fillStyle(0x8ab69f); g.fillCircle(0, -55, 31);
    g.fillTriangle(-26, -68, 7, -109, 29, -63);
    g.fillStyle(0xb2d0ae); g.fillTriangle(-23, -70, 7, -109, -2, -71);
    g.fillStyle(0x203a37); g.fillEllipse(0, -51, 36, 34);
    g.fillStyle(0xf0d9b2); g.fillRoundedRect(-12, -56, 25, 24, 9);
    g.fillStyle(0x293b34); g.fillCircle(-5, -47, 2); g.fillCircle(7, -47, 2);
    g.fillStyle(0xcea861); g.fillRoundedRect(-9, -26, 18, 7, 3);
    g.lineStyle(7, 0x416068); g.lineBetween(20, -15, 50, -4);
    g.fillStyle(0xf0d9b2); g.fillCircle(49, -5, 6);
    g.lineStyle(4, 0xb48c53); g.lineBetween(-33, -19, -45, 39);
    g.lineStyle(2, 0xf1d58e); g.strokeCircle(-30, -26, 7);
    // A warm lantern carried into the forest.
    for (let i = 5; i > 0; i -= 1) { g.fillStyle(0xffda82, 0.025); g.fillCircle(55, 12, i * 11); }
    g.lineStyle(2, 0xdfbe74); g.strokeRoundedRect(45, 0, 20, 29, 4);
    g.lineBetween(50, 0, 50, -7); g.lineBetween(60, 0, 60, -7); g.lineBetween(50, -7, 60, -7);
    g.fillStyle(0xe5bb65); g.fillRect(44, 0, 22, 4); g.fillRect(44, 26, 22, 4);
    g.fillStyle(0xffe4a2, 0.85); g.fillRoundedRect(49, 7, 12, 16, 3);
    c.add(g); return c;
  }

  setEncounter(index) {
    if (this.enemyIndex === index) return;
    this.enemyIndex = index;
    if (this.enemy) { this.tweens.killTweensOf(this.enemy); this.enemy.destroy(); }
    const c = this.add.container(740, 316);
    const g = this.add.graphics();
    const color = [0x93af6c, 0xbe8bc1, 0x8faead, 0xd2b570][index];
    for (let i = 6; i > 0; i -= 1) { g.fillStyle(color, 0.012); g.fillCircle(0, -25, i * 16); }
    if (index === 0) {
      g.fillStyle(0x526e42); g.fillEllipse(-30, 27, 30, 23); g.fillEllipse(31, 27, 30, 23);
      g.fillStyle(0x769450); g.fillRoundedRect(-48, -52, 96, 83, 34);
      g.fillStyle(color); g.fillEllipse(-5, -42, 98, 83);
      g.fillStyle(0xa8bd73); g.fillEllipse(-18, -65, 60, 30);
      g.lineStyle(7, 0x637d46); g.lineBetween(-28, -68, -38, -104); g.lineBetween(26, -67, 33, -99);
      g.fillStyle(0x96b86d); g.fillEllipse(-45, -99, 29, 13); g.fillEllipse(42, -104, 28, 13); g.fillEllipse(-23, -96, 24, 12);
      g.fillStyle(0x638447); g.fillCircle(-46, -35, 14); g.fillCircle(43, -32, 14);
    } else if (index === 1) {
      g.fillStyle(0x75577f); g.fillTriangle(-16, -50, -60, 22, -16, 5); g.fillTriangle(15, -50, 60, 22, 16, 5);
      g.fillStyle(color); g.fillEllipse(0, -32, 67, 89);
      g.fillTriangle(-30, -15, -23, 36, 0, 11); g.fillTriangle(5, 2, 27, 35, 32, -26);
      g.lineStyle(3, 0xd6b0d7); g.lineBetween(-20, -70, -35, -93); g.lineBetween(20, -70, 38, -93);
      g.fillStyle(0xedc1dd); g.fillCircle(-35, -95, 6); g.fillCircle(38, -95, 6);
    } else if (index === 2) {
      g.fillStyle(0x526e6c); g.fillRoundedRect(-42, 1, 32, 39, 10); g.fillRoundedRect(12, 1, 32, 39, 10);
      g.fillStyle(0x718f8d); g.fillRoundedRect(-63, -47, 30, 60, 12); g.fillRoundedRect(34, -47, 30, 60, 12);
      g.fillStyle(color); g.fillRoundedRect(-43, -79, 86, 104, 22);
      g.lineStyle(2, 0x5d817b); g.lineBetween(7, -74, -4, -50); g.lineBetween(-4, -50, 8, -38);
      g.fillStyle(0x68895a); g.fillEllipse(-8, -81, 93, 26);
      g.fillStyle(0xa9b974); g.fillEllipse(-20, -88, 41, 16);
    } else {
      g.fillStyle(0x243c43); g.fillTriangle(0, -85, -65, 35, 65, 35);
      g.fillStyle(0x3a4b50); g.fillTriangle(0, -79, -39, 33, 9, 25);
      g.lineStyle(2, color, 0.75); g.lineBetween(-56, 29, 0, -72); g.lineBetween(56, 29, 0, -72);
      g.fillStyle(0x162e32); g.fillEllipse(0, -56, 66, 74);
      g.fillStyle(color); g.fillRect(-32, -101, 64, 13);
      g.fillTriangle(-32, -101, -38, -129, -12, -103); g.fillTriangle(-12, -101, 0, -137, 12, -101); g.fillTriangle(12, -103, 38, -129, 32, -101);
      g.fillStyle(0xe9cc82); g.fillCircle(0, -112, 4);
      g.fillStyle(0x687863); g.fillTriangle(0, -17, -12, 1, 0, 16); g.fillTriangle(0, -17, 12, 1, 0, 16);
    }
    const eyeY = index === 0 ? -37 : index === 1 ? -39 : -48;
    g.fillStyle(0x17332c); g.fillEllipse(-16, eyeY, 11, 15); g.fillEllipse(16, eyeY, 11, 15);
    g.fillStyle(index === 3 ? 0xffd578 : 0xf0efd1); g.fillCircle(-15, eyeY - 2, 3); g.fillCircle(17, eyeY - 2, 3);
    if (index !== 3) { g.lineStyle(2, 0x415c3c); g.beginPath(); g.arc(0, eyeY + 9, 7, 0.2, 2.9); g.strokePath(); }
    c.add(g); this.enemy = c;
    if (!reducedMotion) this.tweens.add({ targets: c, y: index === 1 ? 300 : 311, angle: index === 1 ? 3 : -1, duration: 1450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  cast(correct, damage) {
    if (!this.hero || !this.enemy) return;
    const fromX = correct ? 315 : 705; const toX = correct ? 735 : 265;
    const color = correct ? 0xffdf8e : 0xc8a6d7;
    const orb = this.add.circle(fromX, 290, 10, color, 0.9);
    if (reducedMotion) { orb.destroy(); return; }
    this.tweens.add({ targets: orb, x: toX, y: 270, duration: 350, ease: 'Sine.easeIn', onComplete: () => {
      orb.destroy();
      for (let i = 0; i < 10; i += 1) {
        const spark = this.add.circle(toX, 270, 3, color);
        this.tweens.add({ targets: spark, x: toX + Math.cos(i * 0.628) * 60, y: 270 + Math.sin(i * 0.628) * 60, alpha: 0, duration: 450, onComplete: () => spark.destroy() });
      }
      const number = this.add.text(toX, 225, `−${damage}`, { fontFamily: 'Georgia, serif', fontSize: '30px', fontStyle: 'bold', color: correct ? '#ffe5a2' : '#ffc0b0' }).setOrigin(0.5);
      this.tweens.add({ targets: number, y: 190, alpha: 0, delay: 250, duration: 600, onComplete: () => number.destroy() });
    } });
  }
}

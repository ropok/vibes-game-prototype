import { WORLD, ROAD_X, ROAD_Y, HOMES, DEPOT, GARAGE } from './data.js';

const ink = 0x244b4a;
export function buildTown(scene) {
  const g = scene.add.graphics();
  g.fillStyle(0xb8d39b).fillRect(0, 0, WORLD.width, WORLD.height);
  for (let row = 0; row < 24; row++) for (let col = 0; col < 32; col++) {
    if ((row * 7 + col * 3) % 5 === 0) g.fillStyle(0xaeca91, .5).fillRoundedRect(col * 100 + 12, row * 100 + 14, 70, 47, 18);
  }
  const road = (x, y, w, h) => {
    g.fillStyle(0x8eaf97).fillRect(x - 16, y - 16, w + 32, h + 32);
    g.fillStyle(0xede1c5).fillRect(x - 9, y - 9, w + 18, h + 18);
    g.fillStyle(0x78908a).fillRect(x, y, w, h);
    g.fillStyle(0x718a84).fillRect(x + 5, y + 5, w - 10, h - 10);
  };
  ROAD_X.forEach(x => road(x - 66, 80, 132, 2240));
  ROAD_Y.forEach(y => road(80, y - 66, 3040, 132));
  g.lineStyle(3, 0xe6dec2, .6);
  ROAD_Y.forEach(y => { for (let x = 110; x < 3100; x += 68) if (!ROAD_X.some(rx => Math.abs(rx - x) < 95)) g.lineBetween(x, y, x + 28, y); });
  ROAD_X.forEach(x => { for (let y = 110; y < 2300; y += 68) if (!ROAD_Y.some(ry => Math.abs(ry - y) < 95)) g.lineBetween(x, y, x, y + 28); });
  for (const x of ROAD_X) for (const y of ROAD_Y) {
    g.fillStyle(0x718a84).fillRect(x - 66, y - 66, 132, 132);
    g.fillStyle(0xf4edda, .8);
    for (let k = -44; k <= 44; k += 22) {
      g.fillRoundedRect(x + k - 6, y - 99, 12, 27, 2);
      g.fillRoundedRect(x + k - 6, y + 72, 12, 27, 2);
    }
  }
  const tree = (x, y, scale = 1) => {
    g.fillStyle(0x547858, .2).fillEllipse(x + 7, y + 12, 55 * scale, 29 * scale);
    g.fillStyle(0x8a7250).fillRoundedRect(x - 4 * scale, y, 8 * scale, 22 * scale, 3);
    g.fillStyle(0x438b69).fillCircle(x, y - 6 * scale, 25 * scale);
    g.fillStyle(0x63a474).fillCircle(x - 8 * scale, y - 13 * scale, 21 * scale);
    g.fillStyle(0x7eb87e).fillCircle(x - 12 * scale, y - 18 * scale, 11 * scale);
    g.fillStyle(0xd5d69b).fillCircle(x + 4 * scale, y - 18 * scale, 3 * scale);
  };
  for (const home of HOMES) {
    const b = home.building;
    g.fillStyle(0xa5c28c).fillRoundedRect(b.x - 34, b.y - 35, b.w + 68, b.h + 90, 15);
    g.fillStyle(0xe8dcc0).fillRect(home.x - 23, b.y + b.h, 46, 64);
    g.fillStyle(0xf1e7cf).fillRoundedRect(home.x - 30, home.y - 12, 60, 22, 4);
    g.fillStyle(0x52745b, .16).fillRoundedRect(b.x + 10, b.y + 10, b.w + 7, b.h + 12, 8);
    g.fillStyle(0xf6ecd6).fillRoundedRect(b.x, b.y + 21, b.w, b.h - 17, 5);
    g.fillStyle(home.color).fillRoundedRect(b.x - 6, b.y, b.w + 12, b.h - 28, 6);
    g.fillStyle(0x2f5551, .15).fillRect(b.x - 6, b.y + 68, b.w + 12, 33);
    g.lineStyle(2, 0xffffff, .15);
    for (let ry = b.y + 16; ry < b.y + 91; ry += 20) g.lineBetween(b.x + 3, ry, b.x + b.w - 3, ry);
    g.lineStyle(5, 0xffeccb, .65).lineBetween(b.x + 3, b.y + 3, b.x + b.w - 3, b.y + 3);
    g.fillStyle(0x436663).fillRoundedRect(home.x - 14, b.y + 100, 28, 30, 3);
    g.fillStyle(0xeab866).fillCircle(home.x + 7, b.y + 116, 2);
    for (const wx of [b.x + 21, b.x + b.w - 48]) {
      g.fillStyle(0xcdbd9b).fillRoundedRect(wx - 3, b.y + 103, 34, 25, 3);
      g.fillStyle(0x7ab6b5).fillRect(wx, b.y + 105, 28, 18);
      g.lineStyle(2, 0xf6ecd6).lineBetween(wx + 14, b.y + 105, wx + 14, b.y + 123);
    }
    g.fillStyle(0xe9dcbe).fillRoundedRect(home.x + 41, home.y - 21, 36, 25, 5);
    scene.add.text(home.x + 59, home.y - 9, String(home.number).padStart(2, '0'), { fontFamily: 'Arial', fontSize: '15px', fontStyle: 'bold', color: '#45635a' }).setOrigin(.5);
    tree(b.x - 20, b.y + 61, .85);
    g.fillStyle(0x729b6c).fillRoundedRect(b.x + b.w + 5, b.y + 88, 34, 45, 12);
    for (let k = 0; k < 4; k++) { g.fillStyle(k % 2 ? 0xf2bd70 : 0xec9d96).fillCircle(b.x + b.w + 13 + k % 2 * 16, b.y + 99 + Math.floor(k / 2) * 18, 4); }
  }
  const station = (site, color, title, subtitle) => {
    const b = site.building;
    g.fillStyle(0x3e6554, .16).fillRoundedRect(b.x + 9, b.y + 10, b.w + 6, b.h + 5, 10);
    g.fillStyle(0xf4e6c8).fillRoundedRect(b.x, b.y, b.w, b.h, 8);
    g.fillStyle(color).fillRoundedRect(b.x - 8, b.y - 7, b.w + 16, 77, 9);
    g.fillStyle(0x214c4b).fillRoundedRect(b.x + 28, b.y + 78, b.w - 56, 52, 4);
    g.fillStyle(0xe5c59a).fillRect(site.x - 28, b.y + b.h, 56, 39);
    scene.add.text(site.x, b.y + 19, title, { fontFamily: 'Arial', fontSize: '22px', fontStyle: 'bold', color: '#fff8e4' }).setOrigin(.5, 0);
    scene.add.text(site.x, b.y + 46, subtitle, { fontFamily: 'Arial', fontSize: '11px', color: '#fff4cd' }).setOrigin(.5, 0);
  };
  station(DEPOT, 0xd66d4b, 'POS PAKET', 'AMBIL PAKET · PULIH GRATIS');
  station(GARAGE, 0x337c78, 'SIAP JALAN', 'BENGKEL PERLENGKAPAN');
  for (let i = 0; i < 3; i++) {
    scene.add.text(110, [720, 1370, 2310][i], ['TAMAN TEDUH', 'KAMPUNG PELANGI', 'KEBUN SORE'][i], { fontFamily: 'Arial', fontSize: '26px', fontStyle: 'bold', color: '#72966b', letterSpacing: 4 });
  }
  for (let i = 0; i < 45; i++) {
    const x = 110 + ((i * 431) % 2900), y = 760 + ((i * 229) % 960);
    if (!ROAD_X.some(rx => Math.abs(rx - x) < 140) && !ROAD_Y.some(ry => Math.abs(ry - y) < 190)) tree(x, y, .7 + i % 3 * .15);
  }
  // Small park lawns and benches keep distant blocks legible without adding obstacles.
  for (const [x, y] of [[1100, 820], [2100, 1450], [2100, 2130]]) {
    g.fillStyle(0x91ba80).fillRoundedRect(x - 100, y - 90, 200, 180, 36);
    g.lineStyle(12, 0xd9d2a8).strokeCircle(x, y, 54);
    g.fillStyle(0x8dc5bd).fillCircle(x, y, 28);
    g.fillStyle(0xc6e1ce).fillCircle(x - 5, y - 6, 12);
    tree(x - 72, y - 58, .9); tree(x + 70, y + 50, .8);
    g.fillStyle(0xb88a55).fillRoundedRect(x + 39, y - 56, 45, 11, 3);
  }
  g.setDepth(0);
}

export function makeTextures(scene) {
  const texture = (key, width, height, draw) => {
    const canvas = scene.textures.createCanvas(key, width, height), ctx = canvas.context;
    draw(ctx); canvas.refresh();
  };
  for (let helmet = 0; helmet < 4; helmet++) for (let jacket = 0; jacket < 4; jacket++) {
    for (const facing of ['down', 'up', 'right', 'left']) for (let frame = 0; frame < 3; frame++) {
      texture(`courier-${helmet}-${jacket}-${facing}-${frame}`, 64, 80, ctx => {
        if (facing === 'left') { ctx.translate(64, 0); ctx.scale(-1, 1); }
        const side = facing === 'left' || facing === 'right', back = facing === 'up';
        const stride = frame === 0 ? 0 : frame === 1 ? -3 : 3;
        const coat = ['#e7774d', '#d36c63', '#337f83', '#315b84'][jacket];
        const cap = ['#ffd16b', '#e1ebdc', '#79b4bf', '#acd5c3'][helmet];
        const rounded = (x, y, w, h, radius, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill(); };
        const ellipse = (x, y, rx, ry, color) => { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); };
        const pack = (x, y, w, h) => {
          rounded(x, y, w, h, 3, '#bb7d42'); rounded(x + 1, y + 1, w - 2, h - 3, 2, '#e9ae61');
          ctx.fillStyle = '#ffe1a2'; ctx.fillRect(x + Math.round(w / 2) - 2, y + 1, 5, h - 3);
          ctx.fillStyle = '#fff1c7'; ctx.fillRect(x + 4, y + 6, 6, 4);
        };
        ellipse(32, 69, side ? 16 : 20, 6, '#284d4730');
        // Opposite leg and arm offsets create two small walking poses, with a still idle pose.
        const legX = side ? [25, 35] : [21, 35];
        for (let leg = 0; leg < 2; leg++) {
          const offset = leg === 0 ? stride : -stride;
          rounded(legX[leg], 52 + offset, 9, 15, 3, '#284b4b');
          rounded(legX[leg] - 2, 64 + offset, side ? 13 : 12, 5, 2, '#f1ecd9');
        }
        if (side) {
          pack(12, 30, 20, 29);
          rounded(25, 29, 24, 30, 8, coat);
          rounded(31, 37 - stride, 10, 18, 5, '#d9a071');
          rounded(31, 35 - stride, 10, 12, 4, coat);
          ctx.fillStyle = '#fff0ac'; ctx.fillRect(32, 43 - stride, 8, 3);
          // A nose, eye, and forward helmet brim distinguish the profile from front/back.
          ellipse(39, 26, 11, 13, '#e3aa7b'); rounded(46, 25, 7, 6, 3, '#e3aa7b');
          ellipse(35, 18, 17, 14, cap); rounded(21, 24, 34, 5, 2, '#365957');
          rounded(48, 24, 10, 4, 2, cap);
          ellipse(29, 10, 7, 3, '#fff4c4');
          if (helmet) { ctx.fillStyle = '#fff8df'; ctx.fillRect(32, 7, 5, 13); }
          ctx.fillStyle = '#2f514b'; ctx.fillRect(45, 30, 3, 3); ctx.fillRect(44, 36, 5, 2);
          ctx.strokeStyle = '#54716a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(39, 29); ctx.lineTo(40, 36); ctx.lineTo(45, 34); ctx.stroke();
        } else {
          // The box sits behind the torso when facing the camera, and fully on the back going north.
          if (!back) pack(10, 32, 43, 25);
          rounded(15, 29, 34, 31, 9, coat);
          rounded(10, 37 + stride, 8, 18, 4, '#e3aa7b'); rounded(46, 37 - stride, 8, 18, 4, '#e3aa7b');
          rounded(10, 34 + stride, 8, 12, 4, coat); rounded(46, 34 - stride, 8, 12, 4, coat);
          if (jacket) { ctx.fillStyle = '#fff0ac'; ctx.fillRect(10, 43 + stride, 8, 3); ctx.fillRect(46, 43 - stride, 8, 3); }
          if (back) {
            pack(18, 31, 28, 30);
            ellipse(32, 22, 14, 14, '#bd855d');
            ellipse(32, 18, 18, 15, cap); rounded(18, 27, 28, 5, 2, '#365957');
            ellipse(25, 10, 7, 3, '#fff4c4');
            if (helmet) { ctx.fillStyle = '#fff8df'; ctx.fillRect(29, 6, 6, 21); }
            ctx.fillStyle = '#f6dd99'; ctx.fillRect(27, 28, 10, 3);
          } else {
            // Front jacket has straps and a zipper; the face remains visible below the helmet.
            ctx.fillStyle = '#f4ce82'; ctx.fillRect(20, 33, 5, 25); ctx.fillRect(39, 33, 5, 25);
            ctx.fillStyle = '#f7ddaa'; ctx.fillRect(31, 40, 2, 18);
            ellipse(32, 27, 13, 13, '#e3aa7b');
            ellipse(32, 17, 18, 14, cap); rounded(13, 24, 38, 5, 2, '#365957');
            ellipse(25, 10, 7, 3, '#fff4c4');
            if (helmet) { ctx.fillStyle = '#fff8df'; ctx.fillRect(29, 5, 6, 17); }
            ctx.fillStyle = '#31534b'; ctx.fillRect(25, 31, 3, 3); ctx.fillRect(37, 31, 3, 3);
            rounded(29, 36, 7, 2, 1, '#a26850');
          }
        }
      });
    }
  }
  for (let i = 0; i < 6; i++) texture(`car-${i}`, 86, 48, ctx => {
    ctx.fillStyle = '#24464135'; ctx.beginPath(); ctx.roundRect(4, 9, 78, 37, 10); ctx.fill();
    ctx.fillStyle = '#2f4949'; ctx.fillRect(16, 2, 13, 44); ctx.fillRect(58, 2, 13, 44);
    ctx.fillStyle = ['#edbe64', '#ed927d', '#f0e6ca', '#69aaa6', '#97b2cf', '#ce9dac'][i]; ctx.beginPath(); ctx.roundRect(3, 5, 78, 36, 11); ctx.fill();
    ctx.fillStyle = '#395e64'; ctx.beginPath(); ctx.roundRect(27, 8, 28, 30, 6); ctx.fill();
    ctx.fillStyle = '#dce8d6'; ctx.fillRect(48, 10, 5, 26);
    ctx.fillStyle = '#fff4bc'; ctx.fillRect(76, 10, 5, 8); ctx.fillRect(76, 29, 5, 8);
    ctx.fillStyle = '#c57465'; ctx.fillRect(3, 10, 4, 7); ctx.fillRect(3, 29, 4, 7);
  });
  texture('pedestrian', 28, 40, ctx => {
    ctx.fillStyle = '#365c4330'; ctx.beginPath(); ctx.ellipse(14, 35, 11, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a6563'; ctx.fillRect(7, 23, 5, 13); ctx.fillRect(16, 23, 5, 13);
    ctx.fillStyle = '#f0ce8d'; ctx.beginPath(); ctx.roundRect(5, 12, 20, 16, 6); ctx.fill();
    ctx.fillStyle = '#be835c'; ctx.beginPath(); ctx.arc(14, 10, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#384c43'; ctx.beginPath(); ctx.ellipse(13, 5, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  });
}

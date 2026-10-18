import Phaser from 'phaser';
import { WORLD, HOME, CAGE, BUILDINGS, UPGRADE_ZONES, getUpgradeInfo, getUpgradeZone } from './engine.js';

export function createWorldScene(api) {
  return class CityScene extends Phaser.Scene {
    constructor() { super('city'); }
    create() {
      this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);
      this.ground = this.add.graphics(); this.paintCity();
      this.actors = this.add.graphics();
      this.focus = this.add.zone(1120, 940, 1, 1);
      this.cameras.main.startFollow(this.focus, true, .12, .12);
      this.resize(); this.scale.on('resize', () => this.resize());
      this.cageLabel = this.label(CAGE.x, CAGE.y - 117, 'KINETIK / LV 1', '#b3d1b2', 11);
      this.homeLabel = this.label(HOME.x, HOME.y + 99, 'SHELTER / LV 1', '#e9be77', 11);
      this.zoneLabels = UPGRADE_ZONES.map(zone => ({ kind: zone.kind, label: this.label(zone.x, zone.y - 62, '', '#e6e6ce', 10).setAlign('center'), status: this.label(zone.x, zone.y + 49, '', '#d8dfce', 9).setAlign('center') }));
      this.label(1180, 1130, 'JL. HARAPAN', '#657e75', 16).setAngle(-90).setAlpha(.6);
      this.label(695, 650, 'SEKTOR 07', '#6c8179', 15).setAlpha(.6);
      this.label(1130, 450, 'KOTA YANG TERTINGGAL', '#72867c', 16).setAlpha(.4);
      api.ready(this);
    }
    resize() { const mobile = this.scale.width < 740; this.cameras.main.setZoom(mobile ? .74 : 1); }
    label(x, y, text, color, size = 10) { return this.add.text(x, y, text, { fontFamily: 'Segoe UI, sans-serif', fontSize: `${size}px`, fontStyle: 'bold', color, letterSpacing: 2, stroke: '#11262b', strokeThickness: 3 }).setOrigin(.5); }
    paintCity() {
      const g = this.ground;
      g.fillStyle(0x233a3d).fillRect(0, 0, WORLD.width, WORLD.height);
      // Wide streets remain connected around all nine city blocks.
      g.fillStyle(0x182e34).fillRect(0, 440, WORLD.width, 150).fillRect(0, 950, WORLD.width, 155).fillRect(550, 0, 150, WORLD.height).fillRect(1110, 0, 160, WORLD.height).fillRect(1950, 0, 160, WORLD.height);
      g.fillStyle(0x2e4647).fillRect(710, 610, 710, 460);
      for (let x = 30; x < WORLD.width; x += 90) { g.fillStyle(0x7c8060, .23).fillRect(x, 510, 40, 4).fillRect(x, 1025, 40, 4); }
      for (let y = 30; y < WORLD.height; y += 90) { g.fillStyle(0x7c8060, .2).fillRect(619, y, 4, 40).fillRect(1188, y, 4, 40).fillRect(2029, y, 4, 40); }
      let seed = 17; const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let i = 0; i < 1000; i++) {
        const x = rand() * WORLD.width, y = rand() * WORLD.height;
        g.fillStyle(i % 3 ? 0x5c7263 : 0x132b30, .26).fillRect(x, y, 2 + rand() * 4, 1 + rand() * 2);
        if (i % 10 === 0) { g.lineStyle(1, 0x0c2228, .65).beginPath().moveTo(x, y).lineTo(x + 12, y - 4).lineTo(x + 20, y + 3).lineTo(x + 34, y - 7).strokePath(); }
      }
      BUILDINGS.forEach((b, idx) => {
        g.fillStyle(0x0a2128, .5).fillRoundedRect(b.x + 17, b.y + 23, b.w + 8, b.h + 5, 3);
        g.fillStyle(idx % 2 ? 0x46514b : 0x3e4d4a).fillRect(b.x, b.y, b.w, b.h);
        g.fillStyle(0x253c3d).fillRect(b.x + 7, b.y + 7, b.w - 14, b.h - 30);
        g.fillStyle(idx % 2 ? 0x4e5d53 : 0x4c5b55).fillRect(b.x + 14, b.y + 14, b.w - 28, b.h - 48);
        g.fillStyle(0x263d3d).fillRect(b.x + 18, b.y + b.h - 30, b.w - 36, 24);
        for (let x = b.x + 30; x < b.x + b.w - 20; x += 40) {
          g.fillStyle(0x122c33).fillRect(x, b.y + b.h - 24, 21, 12);
          if (Math.floor(x) % 3) g.lineStyle(1, 0x879180, .4).lineBetween(x + 2, b.y + b.h - 23, x + 16, b.y + b.h - 13);
        }
        g.fillStyle(0x344a46).fillRect(b.x + 30, b.y + 33, 60, 35);
        g.fillStyle(0x1a3338).fillRect(b.x + 35, b.y + 38, 50, 24);
        g.lineStyle(3, 0x304741).strokeRect(b.x + 22, b.y + 22, b.w - 44, b.h - 65);
        g.lineStyle(2, 0x253b37).beginPath().moveTo(b.x + b.w * .5, b.y + 15).lineTo(b.x + b.w * .45, b.y + 55).lineTo(b.x + b.w * .55, b.y + 85).lineTo(b.x + b.w * .49, b.y + 120).strokePath();
        for (let j = 0; j < 13; j++) { const x = b.x + rand() * b.w, y = b.y + rand() * 20; g.lineStyle(2, 0x466947, .8).lineBetween(x, y, x + rand() * 15, y + 30 + rand() * 30); g.fillStyle(0x52754b, .8).fillEllipse(x + 2, y + 20, 11, 5); }
        this.label(b.x + b.w / 2, b.y + b.h - 45, b.kind.toUpperCase(), '#91a28d', 10).setAlpha(.65);
      });
      const cars = [{x:520,y:1000,c:0x815c43},{x:1360,y:495,c:0x54685e},{x:2020,y:650,c:0x98644a},{x:650,y:830,c:0x846c4c},{x:1750,y:1040,c:0x59695c},{x:1140,y:1360,c:0x85634a}];
      cars.forEach(c => { g.fillStyle(0x0b2329,.7).fillRoundedRect(c.x-20,c.y-10,70,39,7); g.fillStyle(c.c).fillRoundedRect(c.x-25,c.y-19,65,32,7); g.fillStyle(0x223d40).fillRect(c.x-7,c.y-17,26,25); g.lineStyle(2,0x9f8160,.5).lineBetween(c.x-20,c.y-12,c.x+28,c.y+7); g.fillStyle(0x142c2e).fillRect(c.x-15,c.y-23,13,5).fillRect(c.x+15,c.y+12,13,5); });
      // Refuge deck, old power conduits, water barrels and garden beds.
      g.fillStyle(0x22352e).fillRoundedRect(1015,680,245,215,16);
      g.lineStyle(3,0x6f7150,.6).strokeRoundedRect(1015,680,245,215,16);
      for(let y=690;y<890;y+=15) g.lineStyle(1,0x60705a,.24).lineBetween(1025,y,1249,y);
      g.fillStyle(0x0b2429,.6).fillRect(1068,732,150,110);
      g.fillStyle(0x826142).fillRect(1055,714,150,112);
      g.fillStyle(0xae794b).fillTriangle(1040,720,1130,660,1220,720);
      g.lineStyle(3,0xd09d5c).lineBetween(1040,720,1130,660).lineBetween(1130,660,1220,720);
      g.fillStyle(0x514635).fillRect(1112,766,34,60);
      g.fillStyle(0xb59155).fillRect(1075,745,22,25).fillRect(1162,745,22,25);
      g.fillStyle(0x3b4a39).fillRect(1210,760,28,49); g.fillStyle(0x7c8861).fillEllipse(1224,760,28,12);
      g.fillStyle(0x6c583c).fillRect(1040,844,64,21).fillRect(1165,845,60,21);
      for(let i=0;i<7;i++)g.fillStyle(0x73864b).fillCircle(1047+i*8,852,5).fillCircle(1172+i*7,852,5);
      g.lineStyle(3,0x94845a).lineBetween(1245,695,1245,660);g.fillStyle(0xcaa061).fillTriangle(1245,659,1280,669,1245,680);
      g.fillStyle(0x182e2f).fillRoundedRect(CAGE.x-100,CAGE.y-100,200,200,12);
      g.lineStyle(8,0x3d5550).strokeEllipse(CAGE.x,CAGE.y,142,118);
      g.lineStyle(2,0x82937a).strokeEllipse(CAGE.x,CAGE.y,144,120).strokeEllipse(CAGE.x,CAGE.y,105,84);
      g.fillStyle(0x65745a).fillCircle(CAGE.x,CAGE.y,14);g.fillStyle(0x293d3b).fillCircle(CAGE.x,CAGE.y,8);
    }
    person(g, body, isHero, time) {
      const x=body.x,y=body.y, walk=isHero?body.walking:body.moving;
      const swing=walk?Math.sin(time*11+(body.id||0))*5:0;
      const facing=isHero?body.facing:(body.mode==='captive'?(Math.sin(body.angle)>0?'left':'right'):'down');
      const side=facing==='left'?-1:facing==='right'?1:0;
      g.fillStyle(0x0a2028,.55).fillEllipse(x,y+12,30,13);
      if(!isHero&&body.mode==='lured'){g.lineStyle(2,0xf2c96d,.8).strokeCircle(x,y-6,25);g.fillStyle(0xf5d27d).fillTriangle(x-5,y-43,x+5,y-43,x,y-35);}
      if(!isHero&&body.mode==='hostile'){g.lineStyle(1,0xc77965,.6).strokeEllipse(x,y+12,32,13);}
      g.lineStyle(isHero?7:6,isHero?0x203644:0x344b47).lineBetween(x-5,y+2,x-6+swing,y+15).lineBetween(x+5,y+2,x+6-swing,y+15);
      g.fillStyle(isHero?0x132b36:0x263a37).fillRoundedRect(x-10+swing,y+12,9,5,2).fillRoundedRect(x+1-swing,y+12,9,5,2);
      const coat=isHero?0xcb8a4a:body.mode==='hostile'?0x6d6655:0x63796b;
      g.fillStyle(coat).fillRoundedRect(x-10,y-18,20,isHero?27:23,5);
      g.lineStyle(6,coat).lineBetween(x-9,y-13,x-15-side*5,y-1+swing*.5).lineBetween(x+9,y-13,x+15+side*5,y-1-swing*.5);
      g.fillStyle(isHero?0xe3ba91:0x9bac7c).fillCircle(x-15-side*5,y-1+swing*.5,3).fillCircle(x+15+side*5,y-1-swing*.5,3);
      if(isHero){g.fillStyle(0x32454a).fillRoundedRect(x-7,y-15,14,16,2);g.fillStyle(0xc18c50).fillRect(x-9,y-7,18,12);g.fillStyle(0x79444a).fillRect(x-10,y-19,20,6);g.fillTriangle(x+4,y-15,x+13,y-2,x+6,y-5);}
      else{g.fillStyle(0x263f3b).fillTriangle(x-10,y+4,x-3,y+8,x-2,y+2).fillRect(x+2,y-10,6,6);}
      g.fillStyle(isHero?0x26323a:0x52664d).fillCircle(x+side*2,y-28,11);
      g.fillStyle(isHero?0xe5bd97:0xa7b884).fillRoundedRect(x-8+side*2,y-30,16,15,5);
      if(isHero){g.fillStyle(0x273139).fillEllipse(x-side*3,y-34,20,10);g.fillEllipse(x-side*10,y-28,8,16);if(facing==='up')g.fillEllipse(x,y-25,19,19);g.fillStyle(0x6e413b).fillCircle(x-side*11,y-32,3);}
      else{g.fillStyle(0x4b6049).fillRect(x-8,y-34,13,4);g.fillStyle(body.mode==='hostile'?0xe99675:0xd4ca81).fillRect(x-5+side*3,y-25,3,2).fillRect(x+3+side*3,y-25,3,2);}
      if(isHero&&facing!=='up'){g.fillStyle(0x263339).fillRect(x-4+side*4,y-25,2,2).fillRect(x+3+side*4,y-25,2,2);}
      if(!isHero&&body.captureProgress>0){g.fillStyle(0x0b2227).fillRect(x-20,y-49,40,4);g.fillStyle(0xe8c26e).fillRect(x-20,y-49,40*body.captureProgress/.8,4);}
    }
    constructionZones(g, s) {
      const occupied = getUpgradeZone(s)?.kind;
      UPGRADE_ZONES.forEach(zone => {
        const info = getUpgradeInfo(s, zone.kind), job = s.construction?.kind === zone.kind ? s.construction : null;
        const inside = occupied === zone.kind, finished = s.constructionFeedback?.kind === zone.kind && s.constructionFeedback.until > s.time;
        const half = zone.size / 2, color = info.maxed ? 0x657e6b : zone.color;
        g.fillStyle(0x10272b, .85).fillRoundedRect(zone.x-half-5, zone.y-half-5, zone.size+10, zone.size+10, 6);
        g.fillStyle(color, finished ? .38 : inside ? .24 : .1).fillRect(zone.x-half,zone.y-half,zone.size,zone.size);
        g.lineStyle(inside?3:2,color,info.maxed?.45:.9).strokeRect(zone.x-half,zone.y-half,zone.size,zone.size);
        g.lineStyle(1,color,.25).lineBetween(zone.x-half+8,zone.y,zone.x+half-8,zone.y).lineBetween(zone.x,zone.y-half+8,zone.x,zone.y+half-8);
        // Each loading ring is anchored to its own small construction square.
        if(job){g.lineStyle(4,0x122a2d,.95).strokeCircle(zone.x,zone.y,23);g.lineStyle(4,zone.color,.95).beginPath().arc(zone.x,zone.y,23,-Math.PI/2,-Math.PI/2+Math.PI*2*job.progress/job.duration,false).strokePath();}
        else if(finished){g.lineStyle(4,zone.color).beginPath().moveTo(zone.x-12,zone.y).lineTo(zone.x-3,zone.y+9).lineTo(zone.x+14,zone.y-11).strokePath();}
        const text = this.zoneLabels.find(label=>label.kind===zone.kind);
        text.label.setText(`${zone.label} · ${zone.kind==='turret'?info.level+'/3':'LV '+info.level}\n${info.maxed?'MAKSIMAL':`${info.cost} ⚙  /  ${info.duration} dtk`}`);
        const status = job ? `${inside && !s.player.downTimer ? 'MEMBANGUN' : 'JEDA'} · ${Math.ceil(job.duration-job.progress)} dtk` : finished ? 'SELESAI ✓' : info.maxed ? '✓ TERBANGUN' : s.construction ? 'PROYEK LAIN AKTIF' : s.zoneLatch.includes(zone.kind) ? 'KELUAR → MASUK' : s.scrap < info.cost ? 'BUTUH RONGSOK' : 'BERDIRI DI SINI';
        text.status.setText(status).setColor(job && !inside ? '#ebbc78' : '#d8dfce');
      });
    }
    update(_time, delta) {
      api.update(delta/1000);
      const s=api.state(),g=this.actors;g.clear();this.focus.setPosition(s.player.x,s.player.y);
      this.cameras.main.setBackgroundColor(s.night?'#102930':'#243b3f');
      if(s.night)g.fillStyle(0x031622,.21).fillRect(0,0,WORLD.width,WORLD.height);
      const lit=s.battery>1;
      g.fillStyle(0xedba66,lit?.065:.025).fillCircle(HOME.x,HOME.y,225).fillCircle(HOME.x,HOME.y,145);
      g.fillStyle(lit?0xffd184:0x7b704b,.7).fillRect(1077,747,18,21).fillRect(1164,747,18,21).fillRect(1116,773,26,50);
      if(s.shelter.level>=2){g.fillStyle(0x3e625f).fillRect(1060,683,72,28);g.lineStyle(2,0x98b7a1,.8).strokeRect(1060,683,72,28);for(let x=1078;x<1132;x+=18)g.lineBetween(x,684,x,710);g.lineBetween(1061,697,1131,697);g.fillStyle(lit?0xffd087:0x857457).fillCircle(1045,752,5).fillCircle(1217,752,5);}
      if(s.shelter.level>=3){g.fillStyle(0x4b6861).fillRoundedRect(1203,711,46,91,5);g.fillStyle(0xbb8955).fillTriangle(1197,711,1225,687,1256,711);g.fillStyle(lit?0xffd087:0x857457).fillRect(1216,738,20,27);g.lineStyle(3,0x9ba989).lineBetween(1237,681,1237,633);g.fillStyle(0xe7be6b).fillCircle(1237,632,5);}
      if(s.walls.level>0){const intact=s.walls.hp>0, wallColor=intact?(s.walls.level===3?0xa2b3a1:s.walls.level===2?0x819e94:0x788978):0x4f6259;g.lineStyle(6+s.walls.level*2,wallColor,intact?.9:.45);for(let i=0;i<4;i++){const start=i*Math.PI/2+.17,end=(i+1)*Math.PI/2-.17;g.beginPath().arc(HOME.x,HOME.y,160,start,end,false).strokePath();}for(let i=0;i<20;i++){const a=(i+.5)*Math.PI*2/20;g.fillStyle(wallColor,intact?1:.45).fillRect(HOME.x+Math.cos(a)*160-4,HOME.y+Math.sin(a)*160-10,8,intact?19:8);}if(intact){g.fillStyle(0x10272b).fillRect(HOME.x-43,HOME.y-177,86,5);g.fillStyle(0xa8c4ae).fillRect(HOME.x-43,HOME.y-177,86*s.walls.hp/s.walls.maxHp,5);}}
      g.lineStyle(5,0x172c30).beginPath().moveTo(CAGE.x,CAGE.y+60).lineTo(CAGE.x,CAGE.y+106).lineTo(1020,CAGE.y+106).lineTo(1020,830).lineTo(1062,830).strokePath();
      g.lineStyle(2,lit?0xe9c46c:0x6d7b58,lit?.9:.5).beginPath().moveTo(CAGE.x,CAGE.y+60).lineTo(CAGE.x,CAGE.y+106).lineTo(1020,CAGE.y+106).lineTo(1020,830).lineTo(1062,830).strokePath();
      if(s.cage.running&&s.captiveCount){for(let i=0;i<6;i++){const a=s.time*1.2+i*Math.PI/3;g.lineStyle(3,0x71866c,.7).lineBetween(CAGE.x,CAGE.y,CAGE.x+Math.cos(a)*67,CAGE.y+Math.sin(a)*53);}}
      s.nodes.forEach(n=>{const ready=n.readyAt<=s.time;g.fillStyle(0x071f27,.4).fillEllipse(n.x,n.y+15,42,16);g.fillStyle(ready?0x92794c:0x4c5b51).fillRoundedRect(n.x-17,n.y-10,34,26,3);g.fillStyle(ready?0xc4ab64:0x65725e).fillRect(n.x-19,n.y-14,38,9);g.lineStyle(2,0x354d45).strokeRect(n.x-13,n.y-9,26,23);g.fillStyle(ready?0xf7d778:0x8c9980).fillRect(n.x-3,n.y-13,6,25);if(ready){g.lineStyle(1,0xe5cb76,.4+Math.sin(s.time*2)*.2).strokeCircle(n.x,n.y,29);g.fillStyle(0xf1d882).fillTriangle(n.x-4,n.y-31,n.x+4,n.y-31,n.x,n.y-25);}});
      // The entire open deck accepts followers from all directions; no entrance bottleneck.
      const l=CAGE.x-CAGE.width/2,t=CAGE.y-CAGE.height/2;
      g.fillStyle(0x9ac8a4,s.tutorialStep===1?.055+Math.sin(s.time*3)*.025:.025).fillRect(l,t,CAGE.width,CAGE.height);
      g.lineStyle(2,0x97c5a8,.5).strokeRoundedRect(l,t,CAGE.width,CAGE.height,8);
      if(s.cage.level>0){g.lineStyle(2,0x95bba1,.4).strokeEllipse(CAGE.x,CAGE.y,160,140);for(let i=0;i<s.cage.level*2;i++){g.fillStyle(0xa9c7a4,.8).fillRoundedRect(l+12+i*24,t+9,15,5,2);}}
      this.constructionZones(g,s);
      [...s.zombies,{...s.player,hero:true}].sort((a,b)=>a.y-b.y).forEach(a=>{if(a.hero&&a.downTimer>0){g.fillStyle(0xd7ad76,.7).fillCircle(a.x,a.y,15);return;}this.person(g,a,!!a.hero,s.time);});
      s.turrets.forEach(tower=>{g.fillStyle(0x0d252b,.6).fillEllipse(tower.x,tower.y+13,42,18);g.fillStyle(0x72806b).fillRoundedRect(tower.x-13,tower.y-5,26,20,4);g.fillStyle(0x435e5a).fillRect(tower.x-8,tower.y-30,16,31);g.fillStyle(s.battery>=3?0xf6ca6a:0x81927c).fillEllipse(tower.x,tower.y-29,29,12);g.lineStyle(3,0x90aa8c).lineBetween(tower.x-14,tower.y-33,tower.x-14,tower.y-45).lineBetween(tower.x+14,tower.y-33,tower.x+14,tower.y-45);if(tower.flash>0)g.lineStyle(3,0xffdd8a,.9).lineBetween(tower.x,tower.y-33,tower.targetX,tower.targetY-15);});
      if(s.tutorialStep===0){const target=s.zombies.find(z=>z.mode==='wild');if(target){const a=Math.atan2(target.y-s.player.y,target.x-s.player.x),x=s.player.x+Math.cos(a)*54,y=s.player.y+Math.sin(a)*54;g.fillStyle(0xf4c66d,.9).fillTriangle(x+Math.cos(a)*8,y+Math.sin(a)*8,x+Math.cos(a+2.5)*7,y+Math.sin(a+2.5)*7,x+Math.cos(a-2.5)*7,y+Math.sin(a-2.5)*7);}}
      this.cageLabel.setText(`KINETIK / LV ${s.cage.level+1} · ${s.cage.capacity} SLOT`);
      this.homeLabel.setText(`SHELTER / LV ${s.shelter.level} · DINDING ${s.walls.level}${s.walls.level && !s.walls.hp?' RUSAK':''}`);
    }
  };
}

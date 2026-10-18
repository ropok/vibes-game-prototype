// Original canvas illustrations, drawn locally. No remote fonts, stock art, or image requests.
const INK = '#34302d';
function studio(size) {
  const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size;
  const c = canvas.getContext('2d'); c.scale(size / 360, size / 360);
  c.lineWidth = 4.5; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK;
  const shape = (fill, path) => { c.beginPath(); path(); c.fillStyle = fill; c.fill(); c.strokeStyle = INK; c.stroke(); };
  const oval = (x,y,rx,ry,fill) => shape(fill,()=>c.ellipse(x,y,rx,ry,0,0,Math.PI*2));
  const rect = (x,y,w,h,fill,r=9) => shape(fill,()=>c.roundRect(x,y,w,h,r));
  const line = (...points) => { c.beginPath(); points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y)); c.strokeStyle=INK;c.stroke(); };
  const eyes = (x,y,gap=35) => {
    oval(x-gap/2,y,11,16,'#fff9eb'); oval(x+gap/2,y,11,16,'#fff9eb');
    oval(x-gap/2+3,y+2,3.5,6,INK); oval(x+gap/2+3,y+2,3.5,6,INK);
    c.lineWidth=2; line([x-gap/2-13,y-23],[x-gap/2+7,y-27]); line([x+gap/2-7,y-27],[x+gap/2+13,y-22]); c.lineWidth=4.5;
  };
  const mouth=(x,y,w=24)=>shape('#754543',()=>{c.moveTo(x-w,y);c.quadraticCurveTo(x,y+28,x+w,y);c.closePath();});
  const foot=(x,y)=>{line([x,y],[x-3,y+23],[x+14,y+26]);};
  return {canvas,c,shape,oval,rect,line,eyes,mouth,foot};
}

export function characterCanvas(index, size = 440) {
  const {canvas,c,shape,oval,rect,line,eyes,mouth,foot}=studio(size);
  const wheel=(x,y)=>{oval(x,y,25,25,'#df9f6d');oval(x,y,9,9,'#fdf0d5');};
  const steam=(x,y)=>{c.strokeStyle='#a89b8a';c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x-14,y-16,x+15,y-24,x,y-42);c.stroke();c.strokeStyle=INK;};
  const rice=(x,y)=>{ for(let j=0;j<8;j++) oval(x+(j%4)*15-23,y-Math.floor(j/4)*13,12,9,'#fffbed'); };
  const roof=(x,y,w)=>shape('#e47d66',()=>{c.moveTo(x-9,y);c.lineTo(x+w/2,y-40);c.lineTo(x+w+9,y);c.closePath();});
  const building=(x,y,w,h,color)=>{rect(x,y,w,h,color);roof(x,y,w);rect(x+w*.38,y+h-35,w*.25,35,'#9c6860');};
  c.globalAlpha=.13; oval(180,303,130,14,'#50432e'); c.globalAlpha=1;
  if(index<=3) {
    if(index===3){for(const x of [102,144,215,255]){rect(x,244,15,45,'#df8d7c');foot(x+8,276);} line([88,212],[56,184],[46,134]);line([46,134],[38,116]);line([46,134],[49,112]);line([46,134],[60,116]);line([272,212],[304,187],[312,145]);}
    else {foot(120,259);foot(239,259);line([86,215],[65,228],[55,218]);line([274,215],[295,230],[307,217]);}
    if(index===0) {rect(100,107,158,80,'#c1d1cb',24);line([116,122],[240,122]);eyes(180,148,52);}
    if(index===1){shape('#a7c6be',()=>{c.moveTo(100,174);c.lineTo(120,95);c.quadraticCurveTo(178,70,245,108);c.lineTo(263,173);c.closePath();});eyes(183,130,55);}
    if(index===3){shape('#b8c8b5',()=>{c.moveTo(110,130);c.lineTo(138,83);c.lineTo(270,109);c.lineTo(253,153);c.closePath();});}
    rect(82,172,195,88,'#bfd0c5',26);oval(180,177,97,32,'#edf0d9');
    if(index===0){line([151,157],[151,194]);line([209,157],[209,193]);line([104,201],[255,201]);mouth(180,226,21);}
    if(index===1){oval(180,181,71,20,'#73554e');shape('#fff5d9',()=>{c.moveTo(140,168);c.lineTo(148,196);c.lineTo(160,169);c.closePath();});shape('#fff5d9',()=>{c.moveTo(204,168);c.lineTo(213,196);c.lineTo(224,168);c.closePath();});mouth(180,230);}
    if(index>=2){rice(175,159);oval(222,160,25,19,'#fffbed');oval(223,161,11,11,'#e9b940');rect(102,158,34,17,'#8cab6c');line([120,160],[111,139],[128,135]);eyes(179,216,54);mouth(179,239);}
  } else if(index<=5) {
    foot(115,263);foot(242,265);line([83,218],[54,204],[43,212]);line([275,219],[305,207],[317,217]);
    shape(index===5?'#a8a6ce':'#d7bc78',()=>{c.moveTo(77,164);c.lineTo(96,249);c.quadraticCurveTo(180,293,264,249);c.lineTo(283,164);c.closePath();});
    oval(180,163,104,42,index===5?'#9b74bb':'#edbc69');
    if(index===4){for(let j=0;j<4;j++){c.strokeStyle='#fff0bd';c.beginPath();c.moveTo(105+j*25,163);c.bezierCurveTo(110+j*25,147,127+j*25,183,140+j*25,161);c.stroke();}c.strokeStyle=INK;steam(116,113);steam(236,107);line([279,180],[312,188],[321,236],[299,248],[317,262]);}
    else {for(const [x,y,r] of [[113,128,20],[165,103,26],[233,133,18],[255,83,12]]){oval(x,y,r,r,'#c9a2d7');oval(x+3,y,5,8,'#fff9eb');oval(x+4,y,2,4,INK);}rect(114,123,11,38,'#e7c47b');oval(120,121,25,12,'#ed897b');oval(110,120,4,3,'#fff4da');oval(130,117,4,3,'#fff4da');c.strokeStyle='#f1cc64';line([161,171],[176,150],[193,175]);}
    eyes(181,216,56);mouth(181,244,28);
    if(index===4){line([143,224],[125,211],[110,214]);line([219,224],[236,210],[252,213]);}
  } else if(index===6) {
    for(const x of [105,145,216,255]){line([x,248],[x-10,281],[x+4,295]);}
    rect(89,210,182,56,'#b2c3a3',24);
    for(const [x,y] of [[102,150],[180,114],[258,155]]){line([x,222],[x-10,y+30],[x,y]);oval(x,y,42,36,'#c7ceae');eyes(x,y-3,28);mouth(x,y+17,15);}
    c.strokeStyle='#e8ad71';c.lineWidth=7;line([90,188],[141,218],[212,186],[260,212]);c.lineWidth=4.5;
  } else if(index===7) {
    wheel(111,277);wheel(251,277);rect(83,155,194,109,'#d98b70');rect(99,174,160,54,'#594742');
    shape('#f3c96d',()=>{c.moveTo(69,155);c.lineTo(91,112);c.lineTo(270,112);c.lineTo(291,155);c.closePath();});
    for(let i=0;i<6;i++)rect(80+i*34,145,28,17,i%2?'#f0e0b0':'#e8856c',3);
    eyes(178,194,70);mouth(180,235,34);line([101,112],[101,66]);oval(101,67,20,12,'#c9d2b4');line([275,205],[306,192]);oval(307,185,13,15,'#e8bf64');
  } else if(index===8) {
    wheel(119,280);wheel(241,280);rect(110,149,141,121,'#91b8b1',20);rect(125,200,111,53,'#706664');
    oval(182,133,65,17,'#d5d9bd');oval(155,132,14,9,'#6c6b5c');oval(205,132,14,9,'#6c6b5c');
    rect(59,158,51,53,'#c8bb96',14);oval(85,158,30,12,'#e4d3ae');rect(252,158,51,53,'#c8bb96',14);oval(277,158,30,12,'#e4d3ae');
    eyes(182,178,57);mouth(182,224,26);line([180,113],[180,75]);rect(164,45,33,39,'#c8d4bd',5);line([173,47],[173,64]);line([186,47],[186,64]);
  } else if(index===9) {
    foot(115,260);foot(247,260);building(81,144,198,114,'#e8c38e');eyes(181,190,86);mouth(180,237,26);
    rect(122,102,117,18,'#b2c6b5');oval(181,102,62,17,'#dce1c5');rect(146,79,68,18,'#d7ae7d');oval(180,78,37,11,'#f0d6a1');rect(171,63,18,11,'#7b9d91',4);
    line([81,196],[49,175],[39,126]);oval(39,118,15,21,'#d3c598');line([277,194],[307,165]);
  } else if(index===10) {
    for(const x of [57,97,148,203,259,299])foot(x,266);
    rect(44,226,269,43,'#d2b18a');building(41,166,79,88,'#b9c9ad');building(127,119,100,132,'#ebbf89');building(237,171,79,82,'#d7a08b');
    eyes(179,170,46);mouth(178,215,22);oval(80,202,12,16,'#fff2ca');oval(276,206,12,16,'#fff2ca');
    for(const [x,y]of [[75,125],[164,80],[277,131]]){rect(x,y,13,30,'#8aa79b',3);steam(x+6,y-9);}line([120,224],[135,209]);line([226,217],[239,233]);
  } else {
    for(const x of [81,125,233,278])foot(x,281);
    shape('#a6bdb0',()=>{c.moveTo(32,239);c.lineTo(66,283);c.quadraticCurveTo(180,318,298,283);c.lineTo(329,239);c.closePath();});oval(181,239,149,38,'#dce0b8');
    building(58,178,68,60,'#e6b173');building(213,175,82,67,'#c4b5ce');building(133,154,68,88,'#e1c894');
    rect(161,93,17,66,'#9bafa2',4);oval(170,77,25,32,'#e7dbb1');line([170,111],[170,141]);
    oval(263,84,29,29,'#fff3cf');oval(267,85,16,17,'#edb950');for(let i=0;i<8;i++){let a=i*Math.PI/4;line([263+Math.cos(a)*37,84+Math.sin(a)*37],[263+Math.cos(a)*45,84+Math.sin(a)*45]);}
    eyes(180,263,66);mouth(180,284,25);rect(79,211,30,13,'#6d8c82',3);rect(239,212,31,14,'#8d6e96',3);
  }
  // Fine pen hatching gives every plate a paper-comic finish.
  c.lineWidth=1.5;c.globalAlpha=.25;for(let i=0;i<5;i++)line([78+i*8,251],[87+i*8,244]);c.globalAlpha=1;
  return canvas;
}

export function foodCanvas(kind, size=160) {
  const {canvas,c,shape,oval,rect,line,eyes}=studio(size);
  line([143,245],[132,274],[116,274]);line([217,245],[229,274],[245,274]);
  if(kind===0){oval(180,195,86,65,'#fff4d6');for(let i=0;i<12;i++)oval(125+(i%4)*35,160+Math.floor(i/4)*23,13,8,'#fff9e6');}
  if(kind===1){shape('#ed925e',()=>{c.moveTo(114,133);c.quadraticCurveTo(225,101,245,155);c.lineTo(183,266);c.closePath();});line([178,128],[162,72],[190,96],[216,68],[210,119]);line([125,166],[151,172]);line([203,203],[220,193]);}
  if(kind===2){shape('#fff8de',()=>{c.moveTo(110,222);c.bezierCurveTo(84,162,145,82,180,92);c.bezierCurveTo(235,100,279,199,246,237);c.quadraticCurveTo(170,283,110,222);});oval(181,197,42,39,'#edbd4d');}
  if(kind===3){rect(101,132,158,118,'#e6bd79',22);shape('#f5d799',()=>{c.moveTo(101,142);c.lineTo(144,106);c.lineTo(277,123);c.lineTo(258,150);c.closePath();});line([258,150],[277,123],[276,223],[258,248]);}
  if(kind===4){rect(161,175,37,85,'#a6bb7e');for(const [x,y]of[[120,145],[174,114],[228,145],[157,158],[205,164]])oval(x,y,43,38,'#88aa78');}
  if(kind===5){oval(181,188,85,76,'#c4937d');for(const [x,y]of[[136,149],[211,130],[238,191],[141,224]])oval(x,y,5,4,'#a96f5e');}
  eyes(179,195,52);shape('#85594e',()=>{c.moveTo(163,224);c.quadraticCurveTo(181,243,199,224);c.closePath();});
  line([102,192],[77,179],[68,190]);line([258,190],[281,174],[294,181]);
  return canvas;
}

export function backgroundCanvas(width=1100,height=680) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d');
  c.fillStyle='#f2e5c9';c.fillRect(0,0,width,height);c.strokeStyle='#d6c7a8';c.lineWidth=1;
  for(let y=100;y<height;y+=75){c.beginPath();c.moveTo(0,y);c.lineTo(width,y+8);c.stroke();}
  for(let x=-100;x<width;x+=100){c.beginPath();c.moveTo(x,95);c.lineTo(x+120,height);c.stroke();}
  c.fillStyle='#e4c1a3';c.fillRect(0,0,width,93);c.strokeStyle='#716253';c.lineWidth=3;c.beginPath();c.moveTo(0,94);c.lineTo(width,94);c.stroke();
  c.fillStyle='#a9b6a0';c.fillRect(width-235,22,180,47);c.strokeRect(width-235,22,180,47);c.fillStyle='#f6ebd4';for(let i=0;i<6;i++){c.beginPath();c.ellipse(width-218+i*29,43,8,16,0,0,7);c.fill();c.stroke();}
  c.setLineDash([8,7]);c.strokeStyle='#e3d1af';c.lineWidth=5;c.beginPath();c.ellipse(width/2,height*.55,width*.30,height*.31,0,0,7);c.stroke();c.setLineDash([]);
  // Deterministic flecks instead of an image texture.
  c.fillStyle='rgba(100,80,47,.07)';for(let i=0;i<800;i++){const x=(Math.sin(i*19.13)*.5+.5)*width,y=(Math.sin(i*47.71)*.5+.5)*height;c.fillRect(x,y,1.5,1.5);}
  return canvas;
}

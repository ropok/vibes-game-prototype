import Phaser from 'phaser';
import { createState, step, act, serialize, restore, SAVE_KEY, FORMS, FOODS } from './engine.js';
import { characterCanvas, foodCanvas, backgroundCanvas } from './art.js';
import './style.css';

let saved = null, storageAvailable = true;
try { saved = localStorage.getItem(SAVE_KEY); } catch { storageAvailable = false; }
let state = restore(saved);
let selected = 1, manualPause = false, scene = null, lastUI = 0, audioContext;
let prefs = { sound: false, reduced: matchMedia('(prefers-reduced-motion: reduce)').matches };
try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem('mbg-evolution-preferences-v1') || '{}') }; } catch { /* Defaults remain usable. */ }
const drawings = FORMS.map((_,index)=>characterCanvas(index));
const portraits = drawings.map((canvas)=>canvas.toDataURL());

document.querySelector('#app').innerHTML = `
<main id="game">
  <header class="masthead"><a class="wordmark" href="./" aria-label="MBG Evolution, halaman permainan">MBG<span>EVOLUTION</span></a><div class="edition">CATATAN MUTASI<br><b>VOL. 01 / DAPUR</b></div></header>
  <section class="intro"><div><p class="eyebrow">DARI OMPrENG KE KOPDES</p><h1>Sedikit lapar.<br><em>Banyak berubah.</em></h1></div><p class="intro-note">Pukul bahan yang berkeliaran.<br>Serap saat rebah. Lihat apa yang tumbuh!</p></section>
  <section class="play-layout">
    <div class="play-column">
      <section class="specimen-bar" aria-label="Bentuk dan energi"><div class="rank-badge" id="rank-badge">01</div><div class="specimen-name"><span class="eyebrow">SPESIMEN SAAT INI</span><h2 id="form-name" data-form-index="0">Ompreng Kosong</h2><p id="resume-label">Percobaan baru · 12 bentuk menantimu</p></div><button id="pause-button" class="icon-button" aria-label="Jeda permainan" aria-pressed="false">Ⅱ</button></section>
      <div class="energy-strip"><div class="energy-label"><label for="energy-progress">ENERGI MUTASI</label><strong id="energy-value">0 / 40 XP</strong></div><progress id="energy-progress" max="40" value="0">0 / 40</progress><p id="evolution-note">Mutasi otomatis saat energi penuh</p></div>
      <section id="arena-frame" class="arena-frame" data-action="idle" aria-label="Halaman dapur, sentuh bahan untuk mendekat dan memukul lalu menyerap"><div id="arena"></div><div id="food-controls" class="arena-food-controls" role="group" aria-label="Bahan di halaman dapur"></div><div class="arena-toolbar"><button id="collection-button" aria-label="Buka Buku Evolusi">▤ <span>Buku Evolusi</span><b id="discovered-count">1 / 12</b></button><button id="help-button" aria-label="Cara main dan pengaturan">?</button></div><span id="hero-state" class="sr-only" role="status" aria-live="polite">Ompreng siap berburu.</span><div id="pause-veil" hidden><strong>Istirahat dapur</strong><span id="pause-explanation">Tekan Lanjutkan untuk bermain lagi.</span></div><div class="stage-label"><span class="live-dot"></span> LABORATORIUM LAPAR <b id="stage-number">01 / 12</b></div></section>
      <div class="action-caption"><p id="action-status" role="status" aria-live="polite">① Pukul bahan sampai rebah. ② Sentuh lagi untuk serap +10 XP.</p><span id="save-indicator">Tersimpan otomatis</span></div>
      <div class="play-tools"><p><span id="absorbed-count">0</span> bahan diserap · daya pukul <span id="damage-value">1</span><span class="keyboard-hint"> · 1–6 pilih, Spasi beraksi</span></p><button id="reset-button">Mulai ulang</button></div>
    </div>
  </section>
  <footer>MBG EVOLUTION <span>·</span> EKSPERIMEN DAPUR YANG TIDAK PERNAH KENYANG</footer>
</main>
<dialog id="collection-dialog" class="collection-dialog" aria-labelledby="collection-title"><div class="dialog-heading"><div><p class="eyebrow">ARSIP SPESIMEN</p><h2 id="collection-title">Buku Evolusi</h2></div><button class="close-button" data-close="collection-dialog" aria-label="Tutup Buku Evolusi">×</button></div><p class="fiction-note">Komedi fantasi dapur. Tokoh, tempat, dan kejadian sepenuhnya fiktif.</p><div class="collection-layout"><div id="collection-list" class="collection-list"></div><article id="collection-detail" class="collection-detail"></article></div></dialog>
<dialog id="discovery-dialog" class="discovery-dialog" aria-labelledby="discovery-title"><p class="eyebrow" id="discovery-kicker">MUTASI BERHASIL!</p><h2 id="discovery-title"></h2><img id="discovery-art" alt=""/><p id="discovery-lore"></p><div id="discovery-stats" class="discovery-stats"></div><p id="discovery-quirk" class="quirk"></p><p id="ending-line" hidden>Satu ompreng. Dua belas bentuk. Seluruh dapur ikut tumbuh.</p><div class="dialog-actions"><button id="continue-button" class="primary">Lanjut berburu</button><button id="ending-collection" hidden>Lihat Koleksi</button><button id="ending-reset" hidden>Mulai Ulang</button></div></dialog>
<dialog id="help-dialog" class="help-dialog" aria-labelledby="help-title"><div class="dialog-heading"><h2 id="help-title">Resep bermain</h2><button class="close-button" data-close="help-dialog" aria-label="Tutup cara main">×</button></div><ol><li><b>Pukul:</b> klik atau sentuh bahan. Ompreng mendekat, lalu menerjang! Ketahanannya 1–3 pukulan.</li><li><b>Serap:</b> setelah bahan rebah, sentuh sekali lagi. Bahan melayang masuk ke ompreng dan memberi <b>10 XP</b>.</li><li><b>Mutasi otomatis:</b> energi penuh langsung mengubah bentuk. Ada 12 bentuk; tamat setelah 100 serapan.</li></ol><p>Keyboard: <b>1–6</b> memilih bahan, <b>Spasi</b> beraksi. Atau gunakan <b>Tab</b> untuk bahan langsung di arena, lalu <b>Enter</b>. Tunggu ompreng selesai bergerak sebelum aksi berikutnya. Bahan rebah akan menunggumu.</p><label class="setting"><input type="checkbox" id="sound-setting"/> Bunyi dapur</label><label class="setting"><input type="checkbox" id="motion-setting"/> Kurangi gerakan</label><p class="small-note">Progres tersimpan di peramban ini setelah pukulan atau serapan selesai. Tidak ada pertumbuhan saat permainan ditutup. Tombol jeda dan buku menghentikan waktu.</p><button class="primary" data-close="help-dialog">Mengerti, lanjutkan</button></dialog>
<dialog id="reset-dialog" class="reset-dialog" aria-labelledby="reset-title"><p class="eyebrow">PERCOBAAN BARU</p><h2 id="reset-title">Kembali jadi ompreng kosong?</h2><p>Semua energi, catatan serapan, dan penemuan dalam simpanan ini akan dihapus. Pengaturan bunyi tetap disimpan.</p><div class="dialog-actions"><button id="cancel-reset" class="primary">Batal, simpan progres</button><button id="confirm-reset" class="danger">Ya, mulai ulang</button></div></dialog>`;

const $ = (selector) => document.querySelector(selector);
const foodButtons = [];
for(let id=1;id<=6;id++){
  const button=document.createElement('button');button.className='arena-food-target';button.dataset.foodId=id;button.dataset.state='alive';
  button.addEventListener('click',()=>{selected=id;perform(id);});$('#food-controls').append(button);foodButtons.push(button);
}

function save() {
  try { localStorage.setItem(SAVE_KEY,serialize(state));storageAvailable=true; }
  catch { storageAvailable=false; }
  $('#save-indicator').textContent=storageAvailable?'Tersimpan otomatis':'Simpanan tidak tersedia di peramban ini';
}
function savePreferences(){try{localStorage.setItem('mbg-evolution-preferences-v1',JSON.stringify(prefs));}catch{/* Gameplay remains available. */}}
function announce(message){$('#action-status').textContent=message;}
function syncPause(){state.paused=manualPause||Boolean(document.querySelector('dialog[open]'));$('#pause-veil').hidden=!state.paused;$('#pause-button').textContent=manualPause?'▶':'Ⅱ';$('#pause-button').setAttribute('aria-pressed',String(manualPause));$('#pause-button').setAttribute('aria-label',manualPause?'Lanjutkan permainan':'Jeda permainan');renderUI();}
function openDialog(id){$(id).showModal();syncPause();}
function closeDialog(id){$(id).close();syncPause();}
document.querySelectorAll('dialog').forEach((dialog)=>dialog.addEventListener('close',syncPause));
document.querySelectorAll('[data-close]').forEach((button)=>button.addEventListener('click',()=>closeDialog('#'+button.dataset.close)));
function blip(type){
  if(!prefs.sound)return;
  try{audioContext ||= new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const oscillator=audioContext.createOscillator(),gain=audioContext.createGain();oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.type='sine';oscillator.frequency.setValueAtTime(type==='absorb'?640:type==='evolve'?820:190,audioContext.currentTime);oscillator.frequency.exponentialRampToValueAtTime(type==='absorb'?980:90,audioContext.currentTime+.11);gain.gain.setValueAtTime(.045,audioContext.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+.15);oscillator.start();oscillator.stop(audioContext.currentTime+.16);}catch{/* Sound is optional. */}
}
function perform(id){
  if(!scene||state.paused||scene.pending)return;
  const food=state.foods.find((item)=>item.id===id);
  if(!food||food.status==='absorbed')return;
  selected=id;scene.beginAction(id);renderUI();
}
function completeAction(id){
  const event=act(state,id);if(event.type==='blocked'){if(event.reason==='cooldown')announce('Sedikit jeda… pukulan berikutnya siap dalam 0,3 detik.');return;}
  save(); // Commit completed movement and automatic evolution before reward feedback.
  blip(event.type);scene?.actionEffect(id,event.type);renderUI();
  const name=FOODS[event.kind].name;
  announce(event.type==='absorb'?`${name} terserap. +10 XP!`:event.type==='knockout'?`${name} rebah! Sentuh lagi untuk SERAP +10 XP.`:`${name} terpukul. ${Math.ceil(state.foods[id-1].hp/(state.form+1))} pukulan lagi.`);
  if(event.evolution){blip('evolve');announce(state.won?'Kopdes ditemukan! Semua 12 bentuk sudah tercatat.':`${FORMS[state.form].name} ditemukan! Mutasi otomatis berhasil.`);showDiscovery();}
}
function renderUI(){
  const form=FORMS[state.form];$('#form-name').textContent=form.name;$('#form-name').dataset.formIndex=state.form;
  $('#resume-label').textContent=`${state.discovered.length}/12 bentuk · ${state.stats.absorbed} serapan${state.won?' · Semua bentuk ditemukan':''}`;
  $('#rank-badge').textContent=String(form.rank).padStart(2,'0');$('#stage-number').textContent=`${String(form.rank).padStart(2,'0')} / 12`;
  $('#absorbed-count').textContent=state.stats.absorbed;$('#damage-value').textContent=form.damage;$('#discovered-count').textContent=`${state.discovered.length} / 12`;
  $('#energy-value').textContent=state.won?`${state.stats.absorbed*10} XP terkumpul`:`${state.energy} / ${form.threshold} XP`;
  $('#energy-progress').max=state.won?1:form.threshold;$('#energy-progress').value=state.won?1:Math.min(state.energy,form.threshold);
  $('#evolution-note').textContent=state.won?'Semua 12 bentuk ditemukan ✦':'Mutasi otomatis saat energi penuh';
  state.foods.forEach((food,i)=>{const button=foodButtons[i],def=FOODS[food.kind];button.dataset.state=food.status;button.disabled=state.paused||Boolean(scene?.pending)||food.status==='absorbed';button.setAttribute('aria-pressed',String(food.id===selected));button.setAttribute('aria-label',`${food.id}. ${def.name}. ${food.status==='knocked'?'Rebah. Dekati dan serap 10 XP':food.status==='absorbed'?'Sedang muncul kembali':`${food.hp} dari ${food.maxHp} HP. Dekati dan pukul`}`);});
}

function detailMarkup(index){const form=FORMS[index];return `<p class="eyebrow">BENTUK ${String(form.rank).padStart(2,'0')} / 12</p><h3>${form.name}</h3><img class="specimen-art" src="${portraits[index]}" alt="Ilustrasi ${form.name}"/><p class="lore">${form.lore}</p><dl><div><dt>Ukuran fiktif</dt><dd>${form.dimensions}</dd></div><div><dt>Daya pukul</dt><dd>${form.damage}</dd></div><div><dt>Menu favorit</dt><dd>${form.favorite}</dd></div><div><dt>Kemampuan</dt><dd>${form.ability}</dd></div></dl><p class="quirk"><b>Keunikan:</b> ${form.quirk}</p>`;}
function showCollection(focusIndex=state.form){
  const list=$('#collection-list');list.replaceChildren();
  FORMS.forEach((form,index)=>{const unlocked=state.discovered.includes(index);const button=document.createElement('button');button.className='collection-entry';button.dataset.formIndex=index;button.disabled=!unlocked;button.innerHTML=unlocked?`<img src="${portraits[index]}" alt=""/><span><small>BENTUK ${String(index+1).padStart(2,'0')}</small><strong>${form.name}</strong></span><span class="entry-arrow">↗</span>`:`<span class="locked-art" aria-hidden="true">?</span><span><small>BENTUK ${String(index+1).padStart(2,'0')}</small><strong>Belum ditemukan</strong></span><span class="entry-arrow">◇</span>`;if(unlocked)button.addEventListener('click',()=>choose(index));list.append(button);});
  function choose(index){$('#collection-detail').innerHTML=detailMarkup(index);list.querySelectorAll('.collection-entry').forEach((button)=>{button.classList.toggle('active',Number(button.dataset.formIndex)===index);button.setAttribute('aria-pressed',String(Number(button.dataset.formIndex)===index));});}
  choose(focusIndex);openDialog('#collection-dialog');
}
function showDiscovery(){const form=FORMS[state.form];$('#discovery-title').textContent=form.name;$('#discovery-art').src=portraits[state.form];$('#discovery-art').alt=`Ilustrasi ${form.name}`;$('#discovery-lore').textContent=form.lore;$('#discovery-stats').textContent=`Bentuk ${form.rank}/12 · Daya pukul ${form.damage} · ${form.dimensions}`;$('#discovery-quirk').textContent=`Keunikan: ${form.quirk}`;$('#discovery-kicker').textContent=state.won?'SELURUH DAPUR IKUT TUMBUH!':'MUTASI BERHASIL!';$('#ending-line').hidden=!state.won;$('#ending-collection').hidden=!state.won;$('#ending-reset').hidden=!state.won;$('#continue-button').textContent=state.won?'Lanjut Main':'Lanjut berburu';openDialog('#discovery-dialog');}

$('#pause-button').addEventListener('click',()=>{manualPause=!manualPause;syncPause();announce(manualPause?'Permainan dijeda. Progres aman.':'Dapur bergerak lagi.');});
$('#collection-button').addEventListener('click',()=>showCollection());
$('#help-button').addEventListener('click',()=>openDialog('#help-dialog'));
$('#reset-button').addEventListener('click',()=>openDialog('#reset-dialog'));
$('#cancel-reset').addEventListener('click',()=>closeDialog('#reset-dialog'));
$('#continue-button').addEventListener('click',()=>closeDialog('#discovery-dialog'));
$('#ending-collection').addEventListener('click',()=>{closeDialog('#discovery-dialog');showCollection();});
$('#ending-reset').addEventListener('click',()=>openDialog('#reset-dialog'));
$('#confirm-reset').addEventListener('click',()=>{document.querySelectorAll('dialog[open]').forEach((dialog)=>dialog.close());state=createState(Date.now());manualPause=false;selected=1;scene?.resetActor();save();syncPause();$('#resume-label').textContent='Percobaan baru · 12 bentuk menantimu';announce('Ompreng kosong kembali lapar. Pukul, lalu serap!');});
$('#sound-setting').checked=prefs.sound;$('#motion-setting').checked=prefs.reduced;
$('#sound-setting').addEventListener('change',(event)=>{prefs.sound=event.target.checked;savePreferences();blip('absorb');});
$('#motion-setting').addEventListener('change',(event)=>{prefs.reduced=event.target.checked;savePreferences();});
window.addEventListener('keydown',(event)=>{if(event.repeat){if(event.code==='Space'||event.key==='Enter')event.preventDefault();return;}if(state.paused||scene?.pending)return;if(/^[1-6]$/.test(event.key)){event.preventDefault();selected=Number(event.key);renderUI();foodButtons[selected-1].focus();}else if(event.code==='Space'&&(!['BUTTON','INPUT','A'].includes(event.target.tagName)||event.target.classList.contains('arena-food-target'))){event.preventDefault();perform(selected);}});
window.addEventListener('pagehide',save);
document.addEventListener('visibilitychange',()=>{if(document.hidden){save();manualPause=true;syncPause();}});
if(saved&&(state.stats.absorbed>0||state.form>0))$('#resume-label').textContent=`Lanjut dari simpanan · ${state.discovered.length}/12 bentuk · ${state.stats.absorbed} serapan`;
if(!storageAvailable)$('#save-indicator').textContent='Simpanan tidak tersedia di peramban ini';
renderUI();

class KitchenScene extends Phaser.Scene {
  constructor(){super('Kitchen');}
  create(){
    scene=this;this.textures.addCanvas('kitchen',backgroundCanvas());drawings.forEach((canvas,i)=>this.textures.addCanvas('form-'+i,canvas));FOODS.forEach((_,i)=>this.textures.addCanvas('food-'+i,foodCanvas(i)));
    this.backdrop=this.add.image(0,0,'kitchen').setOrigin(0);this.hero=this.add.image(0,0,'form-0').setDepth(7);this.halo=this.add.ellipse(0,0,120,40,0xf5cf75,.45).setStrokeStyle(1,0xa98650,.35).setDepth(1);
    this.heroLabel=this.add.text(0,0,'KAMU',{fontFamily:'Arial',fontSize:'10px',fontStyle:'bold',color:'#73503b',backgroundColor:'#fff6df',padding:{x:6,y:3}}).setOrigin(.5).setDepth(9);
    this.impact=this.add.graphics().setDepth(10);
    this.foodSprites=state.foods.map(()=>{const selection=this.add.ellipse(0,0,70,29,0xefd37d,.70).setStrokeStyle(2,0x9d7750).setDepth(4);const image=this.add.image(0,0,'food-0').setDepth(6);const label=this.add.text(0,0,'',{fontFamily:'Arial, sans-serif',fontSize:'13px',fontStyle:'bold',color:'#3a332d',backgroundColor:'#fff7e4',padding:{x:5,y:4}}).setOrigin(.5,0).setDepth(8);return {image,label,selection};});
    this.game.canvas.setAttribute('aria-hidden','true');this.resetActor();renderUI();
  }
  resetActor(){this.actor={x:450,y:292,facing:1};this.pending=null;$('#arena-frame').dataset.action='idle';$('#arena-frame').removeAttribute('data-target');}
  beginAction(id){
    this.pending={id,phase:'approach',started:state.elapsed};
    $('#arena-frame').dataset.target=id;this.setPhase('approach');
    announce(`Ompreng mendekati ${FOODS[state.foods[id-1].kind].name}…`);
  }
  setPhase(phase){
    this.pending.phase=phase;this.pending.started=state.elapsed;
    $('#arena-frame').dataset.action=phase;
    $('#hero-state').textContent=phase==='approach'?'Ompreng mendekati bahan.':phase==='attack'?'Ompreng menerjang dan memukul.':'Ompreng melahap bahan. Energi bertambah setelah selesai.';
  }
  advanceActor(dt){
    if(!this.pending||state.paused)return;
    const action=this.pending,food=state.foods[action.id-1];
    if(action.phase==='approach'){
      const dx=food.x-this.actor.x,dy=food.y-this.actor.y,distance=Math.hypot(dx,dy);
      this.actor.facing=dx<0?-1:1;
      const reach=66,travel=Math.min(Math.max(0,distance-reach),620*dt);
      if(distance>0){this.actor.x+=dx/distance*travel;this.actor.y+=dy/distance*travel;}
      if(distance-travel<=reach+.1)this.setPhase(food.status==='knocked'?'consume':'attack');
    }else{
      const duration=action.phase==='consume'?.48:.22;
      if(state.elapsed-action.started>=duration&&state.elapsed+1e-9>=state.nextActionAt){
        this.pending=null;$('#arena-frame').dataset.action='idle';$('#arena-frame').removeAttribute('data-target');
        $('#hero-state').textContent='Ompreng siap berburu.';completeAction(action.id);renderUI();
      }
    }
  }
  update(time,delta){
    const previous=state.elapsed;step(state,delta/1000);this.advanceActor(state.elapsed-previous);
    const w=this.scale.width,h=this.scale.height,mobile=w<550,foodSize=mobile?62:78,heroSize=(mobile?102:128)+Math.min(state.form,6)*3;
    const action=this.pending,phase=action?.phase,progress=action?Math.min(1,(state.elapsed-action.started)/(phase==='consume'?.48:.22)):0;
    const lunge=phase==='attack'?Math.sin(progress*Math.PI):0;
    const food=action?state.foods[action.id-1]:null;
    const dx=food?food.x-this.actor.x:0,dy=food?food.y-this.actor.y:0,length=Math.hypot(dx,dy)||1;
    const heroX=(this.actor.x+dx/length*lunge*35)/900*w,heroY=(this.actor.y+dy/length*lunge*35)/560*h;
    const walk=phase==='approach'&&!prefs.reduced?Math.sin(state.elapsed*26):0;
    const eat=phase==='consume'&&!prefs.reduced?Math.sin(progress*Math.PI*4)*.07:0;
    this.backdrop.setDisplaySize(w,h);this.hero.setTexture('form-'+state.form).setPosition(heroX,heroY+walk*2).setDisplaySize(heroSize*(1+eat+lunge*.07),heroSize*(1-eat-lunge*.04)).setAngle(prefs.reduced?0:walk*5-lunge*12*this.actor.facing).setFlipX(this.actor.facing<0);
    this.halo.setPosition(this.actor.x/900*w,this.actor.y/560*h+heroSize*.24).setDisplaySize(heroSize*.8,heroSize*.25);
    this.heroLabel.setPosition(heroX,heroY-heroSize*.37).setText(phase==='consume'?'HAP!':phase==='attack'?'HUP!':'KAMU');
    this.impact.clear();
    if(phase==='attack'&&!prefs.reduced){this.impact.lineStyle(4,0xfdf5d8,1).beginPath().arc(heroX+dx/length*foodSize*.4,heroY+dy/length*foodSize*.4,foodSize*.45,-1.2+lunge,1.2+lunge).strokePath();}
    const frame=$('#arena-frame');frame.dataset.heroX=this.actor.x.toFixed(2);frame.dataset.heroY=this.actor.y.toFixed(2);frame.dataset.heroSize=heroSize;
    state.foods.forEach((food,i)=>{
      const objects=this.foodSprites[i],consuming=phase==='consume'&&food.id===action.id;
      const flight=consuming?progress*progress:0;
      const x=(food.x+(this.actor.x-food.x)*flight)/900*w,y=(food.y+(this.actor.y-food.y)*flight)/560*h-(consuming&&!prefs.reduced?Math.sin(progress*Math.PI)*30:0);
      const size=foodSize*(consuming?Math.max(.06,1-progress*.94):1);
      objects.image.setTexture('food-'+food.kind).setPosition(x,y).setDisplaySize(size,size).setAlpha(food.status==='absorbed'?0:consuming?1-progress*.65:food.status==='knocked'?.78:1).setAngle(consuming?83+progress*(prefs.reduced?0:160):food.status==='knocked'?83:prefs.reduced?0:Math.sin(state.elapsed*4+i)*5);
      objects.selection.setPosition(x,y+foodSize*.34).setDisplaySize(foodSize*.83,foodSize*.29).setVisible(food.id===selected&&food.status!=='absorbed'&&!consuming);
      objects.label.setPosition(x,y+foodSize*.40).setVisible(food.status!=='absorbed'&&!consuming).setText(food.status==='knocked'?`${food.id} · SERAP +10`:`${food.id} · ${'♥'.repeat(Math.ceil(food.hp/(state.form+1)))}`).setColor(food.status==='knocked'?'#8e453b':'#3a332d');
      const button=foodButtons[i];button.style.left=`${food.x/9}%`;button.style.top=`${food.y/5.6}%`;button.style.width=`${foodSize}px`;button.style.height=`${foodSize}px`;button.hidden=food.status==='absorbed';
    });
    this.tweens.timeScale=state.paused?0:1;
    if(time-lastUI>100){renderUI();lastUI=time;}
  }
  actionEffect(id,type){if(prefs.reduced)return;const w=this.scale.width,h=this.scale.height,food=state.foods[id-1];const text=this.add.text((type==='absorb'?this.actor.x:food.x)/900*w,(type==='absorb'?this.actor.y:food.y)/560*h-30,type==='absorb'?'+10 XP':type==='knockout'?'REBAH!':'POK!',{fontFamily:'Arial',fontSize:'20px',fontStyle:'bold',color:type==='absorb'?'#72669c':'#b65742',stroke:'#fff5df',strokeThickness:5}).setOrigin(.5).setDepth(20);this.tweens.add({targets:text,y:text.y-45,alpha:0,duration:600,onComplete:()=>text.destroy()});}
}
new Phaser.Game({type:Phaser.AUTO,parent:'arena',backgroundColor:'#f2e5c9',transparent:false,scale:{mode:Phaser.Scale.RESIZE,width:$('#arena').clientWidth,height:$('#arena').clientHeight},input:{keyboard:false},scene:KitchenScene,render:{antialias:true,roundPixels:false},audio:{noAudio:true}});

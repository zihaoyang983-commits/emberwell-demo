'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=1200,H=650,GROUND=550,JUMP_SPEED=780,BOSS_WINDUP=1.05,BOSS_CAST=.95,keys=new Set();
let mode='title',previousMode='playing',time=0,last=0,room=0,camera=0,shake=0,flash=0,toastTimer=0,music=false,audio=null,particles=[],shots=[],ghosts=[],enemies=[],boss=null,healTime=0,attackId=0,restWalk=null;
let saved={dash:false,won:false,bolt:false,checkpoint:0};
try{const a=JSON.parse(localStorage.getItem('emberwell-v1'));if(a)saved={...a,dash:!!a.dash,won:!!a.won,bolt:!!a.bolt||!!a.won,checkpoint:Number.isInteger(a.checkpoint)&&a.checkpoint>=0&&a.checkpoint<100?a.checkpoint:0};}catch{}
const player={x:260,y:500,w:26,h:46,vx:0,vy:0,face:1,hp:5,soul:0,onGround:false,coyote:0,jumpBuffer:0,inv:0,attack:0,attackDir:'forward',attackCD:0,cast:0,castCD:0,dashTime:0,dashCD:0,airDash:false,airJumped:false,slam:false,dead:0};
const rooms=[
 {name:'静息庭院',label:'THE QUIET COURT',width:1800,color:'#122b30',accent:'#83b3a1',left:3,right:1,ground:[[0,1800]],platforms:[[600,455,180],[950,380,170],[1290,465,200]],lamp:260,enemies:[],sign:470},
 {name:'苔光回廊',label:'THE MOSS GALLERY',width:2100,color:'#112c29',accent:'#8fbc82',left:0,right:2,ground:[[0,750],[970,500],[1690,410]],platforms:[[540,448,150],[860,440,150],[1370,440,150],[1565,405,150]],enemies:[['walker',540,550],['flyer',1100,350],['walker',1280,550],['walker',1910,550]]},
 {name:'风眠圣所',label:'SANCTUM OF THE WIND',width:1500,color:'#192839',accent:'#a8c5df',left:1,right:null,ground:[[0,1500]],platforms:[[370,452,160],[650,375,150],[910,300,270]],lamp:250,relic:1030,enemies:[['flyer',720,290]]},
 {name:'封缄桥',label:'THE SEALED CROSSING',width:1800,color:'#29202a',accent:'#b19bbb',left:4,right:0,ground:[[0,630],[1100,700]],platforms:[[765,455,165]],lamp:1450,gate:1160,enemies:[['walker',350,550],['flyer',730,300]]},
 {name:'余烬王座',label:'THE EMBER THRONE',width:1500,color:'#2d231f',accent:'#d2a06b',left:null,right:3,ground:[[0,1500]],platforms:[],enemies:[],boss:true}
];
function maxHP(){return 5+Math.min(3,Math.floor((saved.fragments||[]).length/3));}
function meleeDamage(){return 1+(saved.blade||0);}
function persist(){try{localStorage.setItem('emberwell-v1',JSON.stringify(saved));return true;}catch{return false;}}
function toast(text,duration=4){const e=document.getElementById('toast');e.textContent=text;e.style.opacity='1';toastTimer=duration;}
function objective(){return saved.won?'已获得余烬弹 · F 向前单发，空中可用':saved.dash?'向西折返，穿越封缄桥，挑战守门者':'向东探索，寻找「风之余烬」';}
function updateLabels(){document.getElementById('location').textContent=String(room+1).padStart(2,'0')+' / '+rooms[room].name;document.getElementById('objective').textContent=objective();}
function resetRoomEncounters(){const r=rooms[room];enemies=r.enemies.map((e,i)=>({type:e[0],x:e[1],y:e[2]-(['flyer','wisp'].includes(e[0])?0:32),origin:e[1],baseY:e[2],w:34,h:32,hp:e[0]==='walker'?3:2,vx:0,dir:i%2?1:-1,t:i*1.7,hit:0,lastAttack:0}));shots=[];ghosts=[];particles=[];boss=r.boss&&!saved.won?{x:650,y:460,w:84,h:90,hp:36,max:36,t:0,phase:'sleep',timer:1.5,dir:1,vx:0,vy:0,hit:0,lastAttack:0}:null;}
function enterRoom(id,side=null){restWalk=null;room=id;const r=rooms[id];resetRoomEncounters();
 if(side==='left')player.x=70;else if(side==='right')player.x=r.width-90;else player.x=r.lamp||260;
 player.y=GROUND-player.h;player.vy=0;player.vx=0;player.dashTime=0;player.onGround=true;player.airDash=false;player.inv=Math.max(player.inv,.6);camera=Math.max(0,Math.min(r.width-W,player.x-W/2));updateLabels();if(mode==='playing')toast(r.name+' / '+r.label,2.6);}
function start(){if(mode!=='title')return;document.getElementById('overlay').classList.add('hidden');mode='playing';player.hp=maxHP();player.soul=0;enterRoom(saved.checkpoint);canvas.focus();toast(saved.bolt?'余烬弹已继承。按 F 向前发射，空中也可使用。':saved.dash?'风之余烬仍在。向西挑战守门者。':'向东探索。灯台附近按 E 休憩。',4);initAudio();}
function respawn(){player.hp=maxHP();player.soul=0;player.dead=0;player.inv=1.5;player.attack=0;player.attackCD=0;player.cast=0;player.castCD=0;player.dashCD=0;healTime=0;enterRoom(saved.checkpoint);toast('火光将你唤回。继续向深处前行。');}
function spawn(x,y,n,color='#d5c18c',speed=140){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,v=Math.random()*speed;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:.35+Math.random()*.6,max:1,size:1+Math.random()*3,color});}}
function harm(amount,fromX){if(player.inv>0||player.dead>0||isDashInvulnerable())return;player.hp=Math.max(0,player.hp-amount);player.inv=1.25;player.vx=(player.x>fromX?1:-1)*330;player.vy=-270;healTime=0;shake=12;flash=.12;spawn(player.x+13,player.y+20,18,'#e5cdb6',210);sound('hurt');if(player.hp<=0){player.dead=1.5;spawn(player.x,player.y,35,'#b6c9ba',200);toast('微光暂息 · 正在返回灯台',2);}}
function attack(){if(mode!=='playing'||player.attackCD>0||player.dead>0||player.dashTime>0)return;player.attackDir=(keys.has('ArrowUp')||keys.has('KeyW'))?'up':!player.onGround&&(keys.has('ArrowDown')||keys.has('KeyS'))?'down':'forward';player.attack=.22;player.attackCD=.34;player.slam=false;healTime=0;attackId++;sound('slash');}
function dash(){if(mode!=='playing'||player.dead>0)return;if(!saved.dash){toast('冲刺尚未解锁。去东侧的圣所寻找风之余烬。',2.5);return;}if(player.dashCD>0||(!player.onGround&&player.airDash))return;player.dashTime=.19;player.dashCD=.55;player.airDash=true;player.vy=0;healTime=0;sound('dash');}
function fireBolt(){if(mode!=='playing'||player.dead>0||player.dashTime>0)return;if(!saved.bolt){toast('击败守门者后，可继承「余烬弹」。',2.5);return;}if(player.castCD>0)return;const x=player.x+13+player.face*28,y=player.y+23;shots.push({x,y,vx:player.face*720,vy:0,life:1.6,owner:'player'});player.cast=.2;player.castCD=.45;healTime=0;spawn(x,y,10,'#f5d1a0',90);sound('bolt');}
function meleeHitbox(){if(player.attackDir==='up')return {x:player.x-18,y:player.y-62,w:62,h:82};if(player.attackDir==='down')return {x:player.x-18,y:player.y+35,w:62,h:78};return {x:player.face===1?player.x+10:player.x-76,y:player.y-3,w:92,h:58};}
function meleeHitsTarget(target,blade){return overlap(blade,target);}
function meleeKnockbackX(){return player.face;}
function recoilFromSlash(){if(player.attackDir!=='down'||player.onGround)return;player.vy=-510;player.slam=false;player.airDash=false;player.airJumped=false;player.coyote=0;spawn(player.x+13,player.y+player.h,10,'#e4e7c3',120);}
function onRestComplete(){}
function beginRest(){const r=rooms[room];restWalk={target:r.lamp-13,settle:0};mode='resting';keys.clear();player.attack=0;player.cast=0;player.dashTime=0;player.jumpBuffer=0;player.slam=false;player.vx=0;player.vy=0;healTime=0;toast('走向灯台，稍作休憩…',3);}
function updateRest(dt){if(!restWalk)return;const distance=restWalk.target-player.x;if(Math.abs(distance)>.01){const step=Math.sign(distance)*Math.min(Math.abs(distance),165*dt);player.x+=step;player.vx=step/dt;player.face=Math.sign(distance);restWalk.settle=0;}else{player.vx=0;restWalk.settle+=dt;if(restWalk.settle>=.5){restWalk=null;mode='playing';player.hp=maxHP();player.soul=0;player.inv=1;resetRoomEncounters();saved.checkpoint=room;persist();spawn(player.x+13,player.y,25);toast('已在灯台休憩 · 生命恢复，归途已记下。');sound('rest');onRestComplete();}}camera+=(Math.max(0,Math.min(rooms[room].width-W,player.x-W*.44))-camera)*Math.min(1,dt*6);}
function interact(){if(mode!=='playing'||player.dead>0)return;const r=rooms[room];if(r.lamp&&Math.abs(player.x-r.lamp)<100&&player.onGround&&Math.abs(player.y+player.h-GROUND)<4){beginRest();return;}
 if(r.relic&&!saved.dash&&Math.abs(player.x-r.relic)<100&&Math.abs(player.y-254)<90){saved.dash=true;persist();spawn(player.x,player.y,60,'#b8e6e3',280);shake=7;toast('获得「风之余烬」！按 X / K 冲刺，可在空中使用。',7);updateLabels();sound('rest');return;}
 if(r.sign&&Math.abs(player.x-r.sign)<100)toast('「西行，越过封缄。守门者的余烬将成为你的力量。」——无名旅人的刻痕',6);
}
function togglePause(){if(mode==='paused'){mode=previousMode;return;}if(mode==='map'){mode='playing';return;}if(mode==='playing'||mode==='resting'){previousMode=mode;mode='paused';keys.clear();healTime=0;}}
function toggleMap(){if(mode==='title')return;if(mode==='map')mode='playing';else if(mode==='playing'){mode='map';keys.clear();healTime=0;}}
window.addEventListener('keydown',e=>{if(handleSettingsKey(e)){e.stopImmediatePropagation?.();return;}e=resolveGameKey(e);if(handleMenuKey(e)){e.stopImmediatePropagation?.();return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','KeyM'].includes(e.code))e.preventDefault();if(e.repeat)return;keys.add(e.code);if(e.code==='Enter'){if(mode==='title')start();else if(mode==='won'||mode==='reward')mode='playing';else if(mode==='paused')togglePause();}if(e.code==='Space'&&mode==='playing')player.jumpBuffer=.14;if(['KeyJ','KeyZ'].includes(e.code))attack();if(['KeyK','KeyX','ShiftLeft','ShiftRight'].includes(e.code))dash();if(e.code==='KeyF')fireBolt();if(e.code==='KeyE')interact();if(e.code==='KeyB')useSupply();if(e.code==='Escape')togglePause();if(e.code==='KeyM')toggleMap();if(e.code==='KeyR'&&mode==='playing')respawn();});
window.addEventListener('keyup',e=>keys.delete(resolveGameKey(e).code));window.addEventListener('blur',()=>{keys.clear();if(mode==='playing'||mode==='resting'){previousMode=mode;mode='paused';}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();if(mode==='playing'||mode==='resting'){previousMode=mode;mode='paused';}}});
document.getElementById('start').onclick=start;document.getElementById('pause-button').onclick=togglePause;document.getElementById('map-button').onclick=toggleMap;
document.getElementById('reset').onclick=()=>{if(window.confirm('清除当前浏览器中的能力、通关和灯台存档？')){saved={dash:false,won:false,bolt:false,checkpoint:0};persist();location.reload();}};
document.getElementById('fullscreen').onclick=()=>{const f=document.getElementById('frame');if(document.fullscreenElement)document.exitFullscreen?.();else f.requestFullscreen?.().catch(()=>toast('浏览器暂不支持全屏'));};
document.querySelectorAll('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);const k=b.dataset.key;keys.add(k);if(k==='Space')player.jumpBuffer=.14;if(k==='KeyZ')attack();if(k==='SlashUp'||k==='SlashDown'){const aim=k==='SlashUp'?'ArrowUp':'ArrowDown',held=keys.has(aim);keys.add(aim);attack();if(!held)keys.delete(aim);}if(k==='KeyX')dash();if(k==='KeyF')fireBolt();if(k==='KeyE')interact();if(k==='KeyB')useSupply();});const release=()=>keys.delete(b.dataset.key);b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);});
canvas.addEventListener('click',()=>{canvas.focus();if(mode==='paused')togglePause();else if(mode==='won'||mode==='reward')mode='playing';else if(mode==='map')return;});
function initAudio(){if(audio||!music)return;try{audio=new(window.AudioContext||window.webkitAudioContext)();const gain=audio.createGain();gain.gain.value=.023;gain.connect(audio.destination);[110,164.81,220,277.18].forEach((f,i)=>{const o=audio.createOscillator();o.type='sine';o.frequency.value=f;const g=audio.createGain();g.gain.value=i===0?.65:.18;o.connect(g);g.connect(gain);o.start();});}catch{music=false;}}
document.getElementById('sound').onclick=async()=>{music=!music;initAudio();if(audio){try{if(music)await audio.resume();else await audio.suspend();}catch{}}document.getElementById('sound').textContent='声音：'+(music?'开':'关');};
function sound(type){if(!music||!audio)return;const o=audio.createOscillator(),g=audio.createGain();o.type=type==='hurt'?'sawtooth':'sine';const freq={slash:440,hurt:90,dash:200,rest:660,hit:150,jump:330,bolt:520,windup:130,cast:740}[type]||220;o.frequency.setValueAtTime(freq,audio.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq/3),audio.currentTime+.17);g.gain.setValueAtTime(.065,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.22);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+.24);}
function enemyCanBeHit(e){return true;}
function handleSettingsKey(e){return false;}
function resolveGameKey(e){return e;}
function isRoomMapped(id){return saved.visited.includes(id);}
function bindingLabel(id){return ({interact:"E",bolt:"F",map:"M",journal:"Tab",supply:"B"}[id]||id);}
function useSupply(){}
function handleMenuKey(e){return false;}
function updateSpeciesEnemy(e,dt){}
function drawEnemyBody(e){return false;}
function drawSpecialShot(s){return false;}
function drawWorldReflection(){}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function developerFlying(){return false;}
function playerMoveScale(){return 1;}
function bossCanBeHit(b){return b.phase!=="sleep"&&b.phase!=="dying";}
function onBossDamaged(b){}
function onBossReward(id){}
function onPlayerBoltHit(target,shot){}
function onMeleeImpact(target,amount){}
function playerBoltDamage(shot){return 2+(saved.blade||0);}
function resolveActorDash(x,y){}
function isDashInvulnerable(){return player.dashTime>0;}
function isDarkSwordActive(){return false;}
function bossContactDamage(b){return 1;}
function hostileShotTouches(s,x,y){return overlap(player,{x:s.x-8,y:s.y-8,w:16,h:16});}
function hitHostileShot(s){harm(s.damage||1,s.x);}
function handlePitFall(){return false;}
function surfaces(){const r=rooms[room];return [...r.ground.map(g=>({x:g[0],y:GROUND,w:g[1]})),...r.platforms.map(g=>({x:g[0],y:g[1],w:g[2]}))];}
function update(dt){time+=dt;toastTimer-=dt;if(toastTimer<=0)document.getElementById('toast').style.opacity='0';shake=Math.max(0,shake-dt*36);flash=Math.max(0,flash-dt);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);ghosts.forEach(p=>p.life-=dt);ghosts=ghosts.filter(p=>p.life>0);
 if(mode==='resting'){updateRest(dt);return;}if(mode!=='playing')return;const r=rooms[room];if(player.dead>0){player.dead-=dt;if(player.dead<=0)respawn();return;}
 for(const k of ['inv','attack','attackCD','cast','castCD','dashTime','dashCD','coyote','jumpBuffer'])player[k]=Math.max(0,player[k]-dt);
 const healing=(keys.has('KeyC')||keys.has('KeyL'))&&player.onGround&&player.soul>=33&&player.hp<maxHP()&&player.attack<=0&&player.cast<=0&&player.dashTime<=0;
 let axis=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);
 if(healing){axis=0;healTime+=dt;if(healTime>=.85){player.hp++;player.soul-=33;healTime=0;spawn(player.x+13,player.y+20,28,'#b6e4bf');sound('rest');}}else healTime=0;
 if(player.onGround){player.coyote=.1;player.airDash=false;player.airJumped=false;}
 if(axis&&player.dashTime<=0)player.face=axis;
 if(player.jumpBuffer>0&&player.coyote>0&&!healing){player.vy=-JUMP_SPEED;player.onGround=false;player.coyote=0;player.jumpBuffer=0;spawn(player.x+13,player.y+46,8,'#9bbaa5',70);sound('jump');}
 if(player.jumpBuffer>0&&saved.doubleJump&&!player.onGround&&player.coyote<=0&&!player.airJumped){player.vy=-JUMP_SPEED*.92;player.jumpBuffer=0;player.airJumped=true;spawn(player.x+13,player.y+46,16,'#c1e5c7',140);sound('jump');}
 const oldBottom=player.y+player.h,oldPlayerX=player.x,oldPlayerY=player.y;
 if(developerFlying()){const vertical=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')||keys.has('Space')?1:0),speed=keys.has('ShiftLeft')||keys.has('ShiftRight')?840:420;player.vx=axis*speed;player.vy=vertical*speed;if(axis)player.face=axis;player.dashTime=player.jumpBuffer=0;player.slam=false;}else if(player.dashTime>0){player.vx=player.face*900*playerMoveScale();player.vy=0;ghosts.push({x:player.x,y:player.y,face:player.face,life:.18});}else{if(player.inv<.95)player.vx+=(axis*265*playerMoveScale()-player.vx)*Math.min(1,dt*14);const holding=keys.has('Space');player.vy+=dt*(player.vy<0&&!holding?2350:1450);player.vy=Math.min(player.slam?1250:850,player.vy);}
 player.x+=player.vx*dt;player.y+=player.vy*dt;player.onGround=false;
 if(developerFlying())player.y=Math.max(12,Math.min(H-player.h-15,player.y));
 if(!developerFlying()&&player.vy>=0){for(const p of surfaces())if(player.x+player.w>p.x&&player.x<p.x+p.w&&oldBottom<=p.y+4&&player.y+player.h>=p.y){player.y=p.y-player.h;player.vy=0;player.onGround=true;}}
 resolveActorDash(oldPlayerX,oldPlayerY);
 if(r.gate&&!saved.dash&&player.x<r.gate){player.x=r.gate;player.vx=0;toast('封缄需要风的力量。先向东寻找风之余烬。',2);}
 if(player.y>H-20&&handlePitFall())return;
 if(player.y>H+100){player.inv=0;harm(1,player.x-1);if(player.hp>0){player.x=r.lamp||(room===1?120:rooms[room].width-160);player.y=440;player.vy=0;player.inv=1.5;}}
 if(player.x<0){if(r.left!==null){enterRoom(r.left,'right');return;}player.x=0;}if(player.x>r.width-player.w){if(r.right!==null&&(!boss||boss.phase==='sleep')){enterRoom(r.right,'left');return;}player.x=r.width-player.w;}
 if(boss&&boss.phase!=='sleep'){player.x=Math.max(45,Math.min(r.width-70,player.x));}
 const blade=meleeHitbox();
 for(const e of enemies){e.t+=dt;e.hit=Math.max(0,e.hit-dt);if(e.hp<=0)continue;if(e.species)updateSpeciesEnemy(e,dt);else if(!['flyer','wisp'].includes(e.type)){e.x+=e.dir*65*dt;const support=r.ground.find(g=>e.x+17>=g[0]&&e.x+17<=g[0]+g[1]);if(!support||Math.abs(e.x-e.origin)>180||e.x<20||e.x>r.width-40){e.dir*=-1;e.x+=e.dir*8;}}else{e.x=e.origin+Math.sin(e.t*1.3)*85;e.y=e.baseY+Math.sin(e.t*2.1)*45;if(Math.abs(player.x-e.x)<240)e.x+=Math.sign(player.x-e.x)*dt*35;}
 if(player.attack>0&&enemyCanBeHit(e)&&meleeHitsTarget(e,blade)&&e.lastAttack!==attackId){e.lastAttack=attackId;e.hp-=meleeDamage();onMeleeImpact(e,meleeDamage());e.hit=.15;if(player.attackDir==='forward')e.x+=meleeKnockbackX()*14;recoilFromSlash();player.soul=Math.min(99,player.soul+12);spawn(e.x+17,e.y+15,12);shake=4;sound('hit');if(e.hp<=0){spawn(e.x,e.y,23,r.accent,180);player.soul=Math.min(99,player.soul+9);}}
 if(e.hp>0&&enemyCanBeHit(e)&&overlap(player,e))harm(1,e.x);
 }
 if(boss){updateBoss(dt);if(player.attack>0&&meleeHitsTarget(boss,blade)&&boss.lastAttack!==attackId&&bossCanBeHit(boss)){boss.lastAttack=attackId;boss.hp-=meleeDamage();onMeleeImpact(boss,meleeDamage());onBossDamaged(boss);boss.hit=.12;recoilFromSlash();player.soul=Math.min(99,player.soul+10);shake=5;spawn(boss.x+40,boss.y+40,14,'#e5bd86');sound('hit');if(boss.hp<=0)win();}if(boss&&boss.phase!=='sleep'&&boss.phase!=='dying'&&bossContactDamage(boss)>0&&overlap(player,boss))harm(bossContactDamage(boss),boss.x+40);}
 for(const s of shots){const oldX=s.x,oldY=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.owner==='player'){
   const hitBox={x:Math.min(oldX,s.x)-8,y:s.y-8,w:Math.abs(s.x-oldX)+16,h:16};
   for(const e of enemies){if(e.hp>0&&enemyCanBeHit(e)&&overlap(hitBox,e)){e.hp=Math.max(0,e.hp-playerBoltDamage(s));e.hit=.15;onPlayerBoltHit(e,s);s.life=0;shake=4;spawn(e.x+17,e.y+16,16,'#f0c593',180);sound('hit');if(e.hp===0)spawn(e.x+17,e.y+16,20,r.accent,190);break;}}
   if(s.life>0&&boss&&bossCanBeHit(boss)&&overlap(hitBox,boss)){boss.hp-=playerBoltDamage(s);onPlayerBoltHit(boss,s);onBossDamaged(boss);boss.hit=.15;s.life=0;spawn(boss.x+42,boss.y+40,18,'#f0c593');sound('hit');if(boss.hp<=0)win();}
 }else if(hostileShotTouches(s,oldX,oldY)){hitHostileShot(s);s.life=0;}}shots=shots.filter(s=>s.life>0&&s.x>-40&&s.x<r.width+40);
 camera+=(Math.max(0,Math.min(r.width-W,player.x-W*.44))-camera)*Math.min(1,dt*6);
}
function updateBoss(dt){const b=boss;b.t+=dt;b.hit=Math.max(0,b.hit-dt);if(b.phase==='sleep'){if(player.x<1170){b.phase='wake';b.timer=1.7;toast('压身拉刃 → 冲刺 · 举刃聚光 → 弹幕',4);sound('hurt');}return;}b.timer-=dt;
 if(b.phase==='wake'&&b.timer<=0){b.phase='idle';b.timer=.8;}
 else if(b.phase==='idle'&&b.timer<=0){b.dir=player.x>b.x?1:-1;b.phase=b.t%3<1.5?'windup':'cast';b.timer=b.phase==='windup'?BOSS_WINDUP:BOSS_CAST;sound(b.phase);}
 else if(b.phase==='windup'&&b.timer<=0){b.phase='charge';b.timer=.65;b.vx=b.dir*(b.hp<18?640:530);sound('dash');}
 else if(b.phase==='charge'){b.x+=b.vx*dt;if(b.x<90||b.x>1320||b.timer<=0){b.x=Math.max(90,Math.min(1320,b.x));b.phase='idle';b.timer=b.hp<18?.55:.95;b.vx=0;shake=8;spawn(b.x+40,GROUND,25,'#c79b70',220);}}
 else if(b.phase==='cast'&&b.timer<=0){const x=b.x+42+b.dir*38,y=b.y-30;for(const angle of(b.hp<18?[-.48,-.24,0,.24,.48]:[-.25,0,.25])){const a=Math.atan2(player.y+23-y,player.x+13-x)+angle;shots.push({x,y,vx:Math.cos(a)*280,vy:Math.sin(a)*280,life:6,owner:'boss'});}b.phase='castRecover';b.timer=.3;sound('bolt');}
 else if(b.phase==='castRecover'&&b.timer<=0){b.phase='idle';b.timer=.75;}
}
function win(){spawn(boss.x+40,boss.y+45,100,'#e8c78e',330);boss=null;shots=[];saved.won=true;saved.bolt=true;persist();player.hp=maxHP();player.castCD=0;shake=15;updateLabels();mode='won';toast('继承「余烬弹」！F 向前发射一颗，地面与空中均可使用。',8);sound('rest');}
function path(points,color,close=true){ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));if(close)ctx.closePath();ctx.fill();}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function text(t,x,y,size=14,color='#d9ddcc',align='left',font='sans-serif'){ctx.fillStyle=color;ctx.font=`${size}px ${font}`;ctx.textAlign=align;ctx.fillText(t,x,y);}
function noise(i){return (Math.sin(i*127.1+311.7)*43758.5453)%1;}
function arch(x,y,w,h,color,width=12){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x,y+w/2);ctx.bezierCurveTo(x,y-w/3,x+w,y-w/3,x+w,y+w/2);ctx.lineTo(x+w,y+h);ctx.stroke();}
function background(){const r=rooms[room];let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#08131e');g.addColorStop(.55,r.color);g.addColorStop(1,'#102126');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 glow(820-camera*.12,180,400,r.accent+'18');glow(220-camera*.08,330,270,'#497e7b16');
 for(let i=-1;i<9;i++){const x=i*230-camera*.2;arch(x,35,155,490,'#35545123',11);arch(x+15,48,125,474,'#4d6e5b16',2);ctx.fillStyle='#0a18243d';ctx.fillRect(x+35,190,88,320);line(x+76,120,x+76,495,'#41625320',3);}
 for(let i=0;i<12;i++){let x=i*170-camera*.4;const height=270+(i%3)*55;path([[x-35,570],[x-28,570-height],[x+8,550-height],[x+32,570-height],[x+46,570]],'#0c1e26bb');line(x-24,565-height,x+23,567-height,'#58736a22',3);for(let j=0;j<4;j++)line(x-20,300+j*75,x+23,300+j*75,'#72958110');}
 ctx.save();ctx.globalAlpha=.055;for(let i=0;i<5;i++)path([[620+i*150,0],[740+i*150,0],[490+i*150,H],[240+i*150,H]],'#bbddcf');ctx.restore();
 for(let i=0;i<60;i++){const x=((i*139.3+Math.sin(time*.2+i)*15-camera*.13)%W+W)%W,y=(i*61.1-time*(4+i%4))%600;ellipse(x,(y+600)%600,i%5===0?1.6:.7,i%5===0?1.6:.7,r.accent+(i%5===0?'65':'25'));}
}
function terrain(){const r=rooms[room];for(const p of surfaces()){const h=p.y===GROUND?H-p.y+50:28;const g=ctx.createLinearGradient(0,p.y,0,p.y+h);g.addColorStop(0,'#34423e');g.addColorStop(.15,'#172c2d');g.addColorStop(1,'#08171c');ctx.fillStyle=g;ctx.fillRect(p.x,p.y,p.w,h);line(p.x,p.y,p.x+p.w,p.y,r.accent+'80',3);for(let j=0;j<p.w;j+=42){const n=Math.abs(noise(j+p.x));line(p.x+j,p.y+9,p.x+j+15,p.y+26,'#68837b20');if(j%84===0)line(p.x+j,p.y+36,p.x+j+39,p.y+36,'#61726818');for(let k=0;k<3;k++)line(p.x+j+k*7,p.y,p.x+j+k*7+Math.sin(j)*6,p.y-6-n*9,r.accent+'75',1);}
 if(p.y!==GROUND){path([[p.x,p.y+27],[p.x+20,p.y+55],[p.x+50,p.y+29],[p.x+p.w-40,p.y+40],[p.x+p.w,p.y+20]],'#163035');}
 }
 for(let i=0;i<r.width;i+=137){if(!r.ground.some(g=>i>g[0]&&i<g[0]+g[1]))continue;const y=GROUND,x=i+17,n=Math.abs(noise(i));for(let j=0;j<3;j++){const h=12+j*9+n*20;line(x+j*7,y,x+j*7-5,y-h,'#78917c70',2);ellipse(x+j*7-5,y-h,8-j*1.5,3,'#97b8a875');glow(x+j*7-5,y-h,15,r.accent+'13');}}
 if(r.lamp){const x=r.lamp;glow(x,440,130,'#e8c18522');path([[x-30,550],[x-25,540],[x-12,537],[x-8,476],[x+8,476],[x+12,537],[x+25,540],[x+30,550]],'#7e8270');arch(x-14,442,28,36,'#c6b789',3);ellipse(x,462,6,9+Math.sin(time*6),'#f5d894');glow(x,460,48,'#efce8055');text('✧',x,427,19,'#e5d4a4','center');if(mode==='playing'&&Math.abs(player.x-x)<95)interactionPrompt('E  休憩 · 存档',x,400);}
 if(r.sign){const x=r.sign;path([[x-19,550],[x-19,504],[x+18,500],[x+20,550]],'#5c706b');line(x-11,517,x+12,515,'#a9b6a070',2);line(x-10,526,x+6,524,'#a9b6a050',2);if(Math.abs(player.x-x)<85&&mode==='playing')interactionPrompt('E  阅读刻痕',x,477);}
 if(r.relic){const x=r.relic;path([[x-55,300],[x-38,282],[x-17,278],[x-12,268],[x+12,268],[x+17,278],[x+38,282],[x+55,300]],'#6e8190');if(!saved.dash){let y=235+Math.sin(time*2)*7;glow(x,y,95,'#b3e3ed30');ctx.save();ctx.translate(x,y);ctx.rotate(time*.3);path([[0,-20],[10,0],[0,20],[-10,0]],'#c4e9e5');ctx.restore();ellipse(x,y,3,5,'#ffffff');for(let i=0;i<8;i++){const a=i*Math.PI/4+time*.5;ellipse(x+Math.cos(a)*45,y+Math.sin(a)*16,1.3,1.3,'#afd4ce');}if(Math.abs(player.x-x)<100&&Math.abs(player.y-254)<90)interactionPrompt('E  唤醒风之余烬',x,180);}else text('风已苏醒',x,251,12,'#abbeca','center');}
 if(r.gate&&!saved.dash){const x=r.gate;glow(x,375,150,'#aa8abc22');for(let i=0;i<6;i++){line(x+Math.sin(time+i)*4,150+i*67,x+Math.cos(time+i)*5,216+i*67,'#b5a2bcaa',3);text('◇',x,195+i*59,17,'#c9b7cc','center');}text('封 缄',x,120,13,'#bcb1c5','center');}
 if(r.boss){arch(600,178,270,370,'#a4865a30',14);arch(620,190,230,360,'#d1a77725',2);path([[650,550],[660,440],[810,440],[822,550]],'#3d3c33');path([[675,450],[675,345],[715,370],[750,326],[785,354],[785,450]],'#5a514033');if(saved.won){glow(740,455,160,'#e4c28230');text('余 烬 未 熄',740,399,18,'#d3c39d','center');}}
}
function interactionPrompt(t,x,y){ctx.fillStyle='#0b181ed9';const width=ctx.measureText(t).width+35;ctx.fillRect(x-width/2,y-17,width,29);text(t,x,y+2,12,'#e1d5b8','center');}
function drawBoss(b){
 const crouching=b.phase==='windup',casting=b.phase==='cast',release=b.phase==='castRecover';
 const p=crouching?Math.min(1,1-b.timer/BOSS_WINDUP):casting?Math.min(1,1-b.timer/BOSS_CAST):0;
 ellipse(b.x+42,GROUND-2,68,9,'#0005');
 if(crouching){
  glow(b.x+42,GROUND-15,110,'#ed93372d');const x=b.x+42+b.dir*60,y=GROUND-8;
  line(x,y,x+b.dir*(110+p*60),y,'#f3bb6988',3);
  for(let i=0;i<3;i++){const a=x+b.dir*(35+i*43);line(a-b.dir*11,y-7,a,y,'#f6c479cc',3);line(a-b.dir*11,y+7,a,y,'#f6c479cc',3);}
  for(let i=0;i<5;i++){const x=b.x+42-b.dir*(50+i*19+((time*95)%19));line(x,GROUND-22-i*6,x+b.dir*18,GROUND-22-i*6,'#d9a46b55',2);}
  text('冲 刺 蓄 力',b.x+42,b.y-45,12,'#f3c486','center');
 }
 if(casting){const x=b.x+42+b.dir*38,y=b.y-30;glow(x,y,70+p*25,'#b6e9f74a');ctx.strokeStyle='#c4e5f0aa';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,18+p*14,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const a=time*2+i*Math.PI/3,d=46-p*15;ellipse(x+Math.cos(a)*d,y+Math.sin(a)*d,2,2,'#d4ecf3');}text('举 刃 聚 光',b.x+42,b.y-105,12,'#c8e6ef','center');}
 ctx.save();ctx.translate(b.x+42-(crouching?b.dir*p*18:0),b.y+48+(crouching?p*10:0));if(b.hit>0)ctx.globalAlpha=.5;
 if(crouching){ctx.rotate(b.dir*p*.28);ctx.scale(1+p*.18,1-p*.3);}else if(b.phase==='charge'){ctx.rotate(b.dir*.2);ctx.scale(1.12,.87);}
 path([[-30,-3],[-47,45],[-23,39],[-7,47],[17,37],[42,47],[28,-8]],'#657267');path([[-29,-8],[-22,-36],[0,-47],[25,-35],[32,-8]],'#b9bba0');
 path([[-25,-24],[-40,-58],[-17,-44],[-6,-66],[6,-43],[32,-57],[24,-20]],'#c6b28c');ellipse(0,-15,27,28,'#d8c7a1');path([[-23,-16],[23,-16],[18,0],[-15,2]],'#46514c');
 ellipse(-10,-13,4,6,crouching?'#ffc577':casting?'#d1efff':'#dab875');ellipse(10,-13,4,6,crouching?'#ffc577':casting?'#d1efff':'#dab875');
 if(crouching){line(b.dir*22,3,-b.dir*35,13,'#b9bba0',10);line(-b.dir*35,13,-b.dir*81,5,'#baaa82',6);path([[-b.dir*79,5],[-b.dir*104,-13],[-b.dir*101,22]],'#e5d0a2');}
 else if(casting){const lift=p;line(b.dir*23,2,b.dir*38,-20-45*lift,'#b9bba0',9);line(b.dir*38,-20-45*lift,b.dir*38,-42-36*lift,'#baaa82',6);path([[b.dir*38,-78],[b.dir*49,-106],[b.dir*50,-62]],'#e5d0a2');glow(b.dir*38,-78,30,'#b7e4f155');ellipse(b.dir*38,-78,5+p*7,5+p*7,'#fce1b0');}
 else if(release){line(b.dir*23,2,b.dir*68,-10,'#b9bba0',9);line(b.dir*68,-10,b.dir*91,-10,'#baaa82',6);path([[b.dir*91,-10],[b.dir*112,-29],[b.dir*111,9]],'#e5d0a2');}
 else{line(b.dir*29,2,b.dir*70,-36,'#baaa82',6);path([[b.dir*69,-37],[b.dir*80,-64],[b.dir*80,-18]],'#e5d0a2');}
 line(-10,26,-13-(crouching?p*10:0),44,'#213b3d',8);line(12,26,16+(crouching?p*10:0),44,'#213b3d',8);ctx.restore();
}
function drawPlayer(x,y,face,alpha=1){ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+13,y+23);ctx.scale(face,1);if(restWalk?.settle>0){ctx.translate(0,5);ctx.scale(1,.8);}const run=Math.abs(player.vx)>30&&player.onGround?Math.sin(time*18)*3:0;ellipse(0,28,18,4,'#0005');path([[-10,3],[-17,23],[3,21],[13,26],[11,0]],'#37565b');path([[-8,1],[-11,19],[1,22],[8,3]],'#79968b');path([[-10,2],[-19+run,11],[-35-Math.abs(player.vx)*.01,9+run],[-22,-2],[-4,-5]],'#a5ac8b');line(-5,18,-6-run,25,'#182f35',4);line(6,18,7+run,25,'#182f35',4);path([[-9,-10],[-10,-26],[-2,-18],[5,-31],[10,-14]],'#d3d7bf');ellipse(0,-11,13,15,'#e0e2c9');ellipse(-3,-11,2.5,4,'#243a40');ellipse(6,-12,2.5,4,'#243a40');path([[-11,-6],[-8,-3],[8,-4],[12,-8],[8,1],[-8,1]],'#c0ccba');if(player.cast>0){line(8,5,27,0,'#bdcbbb',4);glow(31,0,34,'#e7c18455');ellipse(30,0,5,5,'#f4d6a6');}else if(player.attack>0&&player.attackDir==='up'){line(8,4,9,-30,'#d3c8a1',3);line(4,5,8,-4,'#bdcbbb',4);}else if(player.attack>0&&player.attackDir==='down'){line(8,5,9,34,'#d3c8a1',3);line(4,5,8,17,'#bdcbbb',4);}else line(10,10,27,1,'#d3c8a1',2);ellipse(-6,9,3,5,'#eed28b');glow(-6,9,20,'#ddb56635');ctx.restore();}
function drawEnemies(){for(const e of enemies){if(e.hp<=0)continue;ctx.save();ctx.translate(e.x+17,e.y+16);if(e.hit>0)ctx.globalAlpha=.5+Math.sin(time*90)*.5;if(drawEnemyBody(e)){}else if(!['flyer','wisp'].includes(e.type)){ellipse(0,19,25,4,'#0005');for(let i=-1;i<=1;i++)line(i*9,10,i*12+Math.sin(time*9+i)*3,17,'#667b76',3);ellipse(0,3,22,14,'#2e4e51');path([[-23,2],[-15,-12],[-7,-8],[0,-17],[7,-9],[19,-7],[23,3]],'#617b6b');line(-15,-4,14,-3,'#94a487',2);ellipse(player.x>e.x?13:-13,3,3,3,'#d8bf84');}else{const flap=Math.sin(time*10+e.t)*9;path([[-6,0],[-34,-8-flap],[-20,9],[-7,10]],'#8b9b9866');path([[6,0],[34,-8-flap],[20,9],[7,10]],'#8b9b9866');ellipse(0,0,10,15,'#596e72');ellipse(0,-6,6,8,'#b9c9b8');ellipse(-3,-7,1.5,2,'#273943');ellipse(3,-7,1.5,2,'#273943');}ctx.restore();if(e.hit>0){ctx.fillStyle='#d9c79c';ctx.fillRect(e.x,e.y-10,e.w*e.hp/(e.max||(e.type==='walker'?3:2)),2);}}
 if(boss)drawBoss(boss);
 for(const s of shots){if(drawSpecialShot(s))continue;if(s.owner==='player'){line(s.x-Math.sign(s.vx)*29,s.y,s.x,s.y,'#e8c18a88',4);glow(s.x,s.y,30,'#e6b97055');ellipse(s.x,s.y,8,8,'#edd4a2');ellipse(s.x,s.y,3,3,'#fff3d9');}else{glow(s.x,s.y,23,'#e6a44c50');ellipse(s.x,s.y,7,7,'#edc38c');ellipse(s.x,s.y,3,3,'#fff2d6');}}
}
function hud(){ctx.fillStyle='#09141bb5';ctx.fillRect(22,20,290,100);for(let i=0;i<maxHP();i++){const x=48+i*30;path([[x,35],[x+8,42],[x+6,55],[x,61],[x-6,55],[x-8,42]],i<player.hp?'#e0ddc0':'#405354');if(i<player.hp)line(x-2,41,x-2,52,'#fff8df80',2);}ctx.fillStyle='#324647';ctx.fillRect(41,78,170,3);ctx.fillStyle='#dfc48f';ctx.fillRect(41,78,170*player.soul/99,3);text('余烬 '+player.soul,227,83,10,'#bcb795','center');text(saved.dash?'◇ 风之余烬':'◇ 风尚未醒',48,95,9,saved.dash?'#b5d3cb':'#779393');text(saved.bolt?(player.castCD>0?'✧ 余烬弹 · 蓄能中':'✧ '+bindingLabel('bolt')+' 余烬弹 · 已就绪'):'✧ 余烬弹 · 击败守门者解锁',48,110,9,saved.bolt?'#e6c894':'#779393');text(rooms[room].name,W-35,44,20,'#d0d6bf','right','serif');text(rooms[room].label,W-35,64,9,'#89a398','right');
 if(boss&&boss.phase!=='sleep'){text(boss.name||rooms[room].bossName||'守门者',W/2,578,15,'#d3c5a6','center','serif');ctx.fillStyle='#050e14d0';ctx.fillRect(350,594,500,7);ctx.fillStyle='#ba9c70';ctx.fillRect(350,594,500*boss.hp/boss.max,7);line(347,592,853,592,'#b39b6b55');}
}
function mapOverlay(){ctx.fillStyle='#08131beF';ctx.fillRect(0,0,W,H);text('遗迹地图',W/2,100,28,'#dcdcc6','center','serif');text('跟随微光，记住归途。',W/2,133,12,'#92a89c','center');const order=[4,3,0,1,2];for(let j=0;j<5;j++){let id=order[j],x=155+j*185;line(x,306,x+185,306,'#52695b',2);ctx.fillStyle=id===room?'#344d48':'#16292d';ctx.fillRect(x-60,270,150,72);ctx.strokeStyle=id===room?'#dcc89c':'#617566';ctx.strokeRect(x-60,270,150,72);text(rooms[id].name,x+15,311,14,id===room?'#e1d8b7':'#a4b8a8','center');if(rooms[id].lamp)text('✧ 灯台',x+15,370,11,'#b4a885','center');if(id===2)text(saved.dash?'◇ 已唤醒':'◇ 风之余烬',x+15,370,11,'#a9c8cc','center');if(id===4)text(saved.won?'已沉眠':'守门者',x+15,370,11,'#b99977','center');if(id===room){text('你在这里',x+15,244,11,'#dfcea2','center');ellipse(x+15,258,3,3,'#dfcea2');}}text(objective(),W/2,450,15,'#c1c9b5','center');text('M / ESC 返回',W/2,515,12,'#869c91','center');}
function render(){ctx.clearRect(0,0,W,H);background();ctx.save();ctx.translate(-camera+(shake?Math.sin(time*100)*shake:0),shake?Math.cos(time*80)*shake*.35:0);terrain();drawEnemies();for(const g of ghosts)drawPlayer(g.x,g.y,g.face,g.life/.18*.3);if(player.dead<=0&&mode!=='title'&&(player.inv<=0||Math.floor(time*18)%2===0))drawPlayer(player.x,player.y,player.face);
 if(player.attack>0&&!isDarkSwordActive()){ctx.save();ctx.translate(player.x+13,player.y+19);if(player.attackDir==='forward')ctx.scale(player.face,1);else ctx.rotate(player.attackDir==='up'?-Math.PI/2:Math.PI/2);ctx.strokeStyle='#e5e7c2';ctx.lineWidth=5;ctx.shadowColor='#dce5c1';ctx.shadowBlur=14;ctx.beginPath();const progress=1-player.attack/.22;ctx.arc(8,0,67,-1.1+progress*.3,1.1+progress*.3);ctx.stroke();ctx.lineWidth=1;ctx.strokeStyle='#ffffff88';ctx.beginPath();ctx.arc(8,0,76,-1.05,1.05);ctx.stroke();ctx.restore();}
 if(healTime>0){glow(player.x+13,player.y+20,70,'#badbbc44');ctx.strokeStyle='#e6dcab';ctx.lineWidth=3;ctx.beginPath();ctx.arc(player.x+13,player.y+17,30,-Math.PI/2,-Math.PI/2+healTime/.85*Math.PI*2);ctx.stroke();}
 for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*1.8);ellipse(p.x,p.y,p.size,p.size,p.color);}ctx.globalAlpha=1;
 drawWorldReflection();
 for(let i=-1;i<13;i++){let x=i*190-camera*.08;path([[x,650],[x+16,596],[x+33,622],[x+57,576],[x+65,620],[x+84,602],[x+110,650]],'#07141b');line(x+50,630,x+42,595,'#183235',3);}ctx.restore();const v=ctx.createRadialGradient(W/2,H/2,100,W/2,H/2,700);v.addColorStop(0,'transparent');v.addColorStop(1,'#030b1690');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);if(mode!=='title')hud();if(flash>0){ctx.fillStyle='#e7cdaa30';ctx.fillRect(0,0,W,H);}if(mode==='map')mapOverlay();if(mode==='paused'){ctx.fillStyle='#071219cc';ctx.fillRect(0,0,W,H);text('静候回响',W/2,280,34,'#e0ddc4','center','serif');text('已暂停 · 点击画面 / ESC 继续',W/2,330,14,'#b0c2ae','center');text('R 返回灯台 · M 查看地图',W/2,367,11,'#7f978b','center');}if(mode==='won'){ctx.fillStyle='#0b1824d9';ctx.fillRect(0,0,W,H);glow(W/2,270,200,'#e7c07718');text('✧',W/2,200,45,'#dfc397','center');text('微光，终于穿过长夜。',W/2,272,34,'#e6dfc4','center','serif');text('守门者已沉眠 · 余烬之井 DEMO 完成',W/2,315,14,'#b5c7b4','center');text('获得技能「余烬弹」',W/2,365,22,'#edd0a0','center','serif');text('F 向前发射单颗弹丸 · 地面 / 空中均可使用',W/2,402,14,'#c8d3bb','center');text('ENTER / 点击画面，继续探索与试用技能',W/2,466,12,'#d0c299','center');}}
function frame(t){const dt=Math.min(.033,(t-last)/1000||.016);last=t;update(dt);render();requestAnimationFrame(frame);}
enterRoom(0);requestAnimationFrame(frame);

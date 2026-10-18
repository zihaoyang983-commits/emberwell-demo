'use strict';
// A real actor and an invulnerable optical image share one appearance, but not HP.
const MIRROR_LAKE={room:34,left:350,right:1450,y:380,bottom:548,center:900,intro:7,unlock:6};
Object.assign(lateCues,{lakeReveal:[320,650,'sine',1.2],lakeRush:[1500,190,'triangle',.22],lakeRipple:[190,270,'sine',1],lakeRise:[180,1000,'sine',.8],lakeAim:[680,950,'sine',.8],lakePierce:[1250,360,'triangle',.18],lakeReturn:[450,1100,'sine',.32],lakeSwap:[880,220,'sine',.65]});
rooms[34].ground=[[0,1800]];rooms[34].platforms=[];
lateBossDesigns.mirror.intro='站在湖心唤醒残像；上方横刺，下方斜刺，出剑与回收都危险。';
lateBossDesigns.mirror.stages=['湖面与湖底 · 虚实互换','湖面与湖底 · 虚实互换'];
function isMirrorLake(){return room===MIRROR_LAKE.room;}
function lakeIntroActive(){return !!(boss?.lake?.intro&&boss.lake.age<MIRROR_LAKE.intro);}
function lakeInputLocked(){return mode==='playing'&&lakeIntroActive()&&boss.lake.age<MIRROR_LAKE.unlock;}
function lakeSetRealPosition(b){b.y=b.lake.realBelow?MIRROR_LAKE.y:MIRROR_LAKE.y-b.h;}
function initMirrorLake(b,waiting=true){
 if(b.kind!=='mirror'||!isMirrorLake())return;
 b.lake={realBelow:false,intro:false,age:0,wait:waiting,attacks:[],ripples:[],swapIn:3+Math.random()*2,swapFlipped:false,alpha:.76,camera:300};
 b.lateEffects=[];b.lateTrails=[];b.x=Math.max(MIRROR_LAKE.left+100,Math.min(MIRROR_LAKE.right-b.w-100,b.x));lakeSetRealPosition(b);b.phase=waiting?'sleep':'lakeRest';b.timer=1.05;
}
const lakePrepare=prepareCampaignEncounters;
prepareCampaignEncounters=function(id){lakePrepare(id);if(isMirrorLake()&&boss?.kind==='mirror')initMirrorLake(boss,true);};
const lakeEnter=enterRoom;
enterRoom=function(id,side=null){const result=lakeEnter(id,side);if(room===id&&isMirrorLake()){player.y=MIRROR_LAKE.y-player.h;player.vy=0;player.onGround=true;}return result;};
const lakeSurfaces=surfaces;
surfaces=function(){return isMirrorLake()?[{x:0,y:MIRROR_LAKE.y,w:rooms[room].width}]:lakeSurfaces();};
function beginLakeIntro(b){
 const s=b.lake;s.wait=false;s.intro=true;s.age=0;s.anchor={x:player.x,y:MIRROR_LAKE.y-player.h};s.camera=(rooms[room].width-W)/2;s.ripples=[];
 b.phase='lakeIntro';b.x=MIRROR_LAKE.center-b.w/2;b.y=MIRROR_LAKE.y+75;b.lateEffects=[];shots=[];ghosts=[];keys.clear();player.vx=player.vy=player.attack=player.cast=player.dashTime=player.jumpBuffer=0;healTime=0;camera=s.camera;
 soundBoss('mirror','lakeReveal','release');toast('湖底，有一道持剑的影子。',3);
}
function lakeCueOnce(b,key,threshold,cue){const s=b.lake;if(s.age>=threshold&&!s[key]){s[key]=true;soundBoss('mirror',cue,'release');}}
function lakeAdvanceIntro(b,dt){
 const s=b.lake;s.age=Math.min(MIRROR_LAKE.intro,s.age+dt);b.t+=dt;
 lakeCueOnce(b,'rushCue',1.35,'lakeRush');lakeCueOnce(b,'rippleCue',3,'lakeRipple');lakeCueOnce(b,'emergeCue',6,'lakeRise');
 if(s.age>=3&&s.age<6&&(!s.ripples.length||s.age-s.ripples.at(-1).born>.32))s.ripples.push({born:s.age,x:MIRROR_LAKE.center});
 if(s.age>=6){const u=Math.min(1,s.age-6),ease=u*u*(3-2*u);b.y=MIRROR_LAKE.y+75+(MIRROR_LAKE.y-b.h-(MIRROR_LAKE.y+75))*ease;
  if(!s.entranceStab){s.entranceStab={origin:{x:s.anchor.x+13,y:MIRROR_LAKE.y+120},ux:0,uy:-1,reach:265,delay:.52,age:0,warning:.12,extend:.18,hold:.04,retract:.4,width:11,damage:1,entrance:true};}
  s.entranceStab.age=s.age-6;lakeStabCollision(s.entranceStab,s.entranceStab.previousAge??0);s.entranceStab.previousAge=s.entranceStab.age;
 }
 if(s.age>=7){s.intro=false;s.entranceStab=null;s.ripples=[];b.phase='lakeRest';b.timer=.9;s.realBelow=false;lakeSetRealPosition(b);keys.clear();toast('镜湖残像 · 上方横刺，下方斜刺；留意剑刃回收。',5);}
}
function lakeStabProgress(a,age=a.age){
 const t=age-a.delay-a.warning;if(t<=0)return 0;if(t<a.extend)return t/a.extend;if(t<a.extend+a.hold)return 1;return Math.max(0,1-(t-a.extend-a.hold)/a.retract);
}
function lakeStabActive(a,age=a.age){const t=age-a.delay-a.warning;return t>=0&&t<a.extend+a.hold+a.retract;}
function lakeStabCollision(a,oldAge){
 if(!lakeStabActive(a)&&!lakeStabActive(a,oldAge))return;
 const before=100+lakeStabProgress(a,oldAge)*(a.reach-100),after=100+lakeStabProgress(a)*(a.reach-100),min=Math.max(0,Math.min(before,after)-100),max=Math.max(before,after);
 if(max<=0)return;const p={x:a.origin.x+a.ux*min,y:a.origin.y+a.uy*min},q={x:a.origin.x+a.ux*max,y:a.origin.y+a.uy*max};
 if(forgeSegmentHitsRect(p,q,player,a.width))harm(a.damage,a.origin.x);
}
function lakeBeginStabs(b){
 const s=b.lake,center=b.x+b.w/2,dir=player.x+13>=center?1:-1;s.attacks=[];b.dir=dir;
 for(const below of [false,true]){
  const origin={x:center+dir*28,y:MIRROR_LAKE.y+(below?75:-32)};
  let dx=player.x+13-origin.x,dy=below?Math.min(player.y+23,MIRROR_LAKE.y-16)-origin.y:0;
  if(Math.abs(dx)<110)dx=dir*110;const length=Math.hypot(dx,dy)||1;
  s.attacks.push({below,origin,ux:below?dx/length:dir,uy:below?dy/length:0,reach:below?Math.min(610,Math.max(390,length+95)):520,delay:below?.27:0,age:0,warning:.9,extend:.26,hold:.09,retract:.58,width:10,damage:1,releaseCue:false,returnCue:false});
 }
 b.phase='lakeStab';b.timer=2.12;soundBoss('mirror','lakeAim','release');
}
function lakeBeginSwap(b){const s=b.lake;s.attacks=[];s.swapFlipped=false;s.swapIn=3+Math.random()*3;b.phase='lakeSwap';b.timer=.7;soundBoss('mirror','lakeSwap','release');}
function tickLakeAttacks(b,dt){
 for(const a of b.lake.attacks){const old=a.age;a.age+=dt;
  if(!a.releaseCue&&a.age>=a.delay+a.warning){a.releaseCue=true;soundBoss('mirror','lakePierce','release');}
  if(!a.returnCue&&a.age>=a.delay+a.warning+a.extend+a.hold){a.returnCue=true;soundBoss('mirror','lakeReturn','release');}
  lakeStabCollision(a,old);
 }
}
const lakeBossUpdate=updateBoss;
updateBoss=function(dt){
 const b=boss;if(!b?.lake){lakeBossUpdate(dt);return;}const s=b.lake;
 if(s.wait||s.intro||b.phase==='dying')return;b.t+=dt;b.hit=Math.max(0,b.hit-dt);b.timer-=dt;s.swapIn-=dt;
 if(b.phase==='lakeStab'){tickLakeAttacks(b,dt);if(b.timer<=0){s.attacks=[];b.phase='lakeRest';b.timer=.85;}return;}
 if(b.phase==='lakeSwap'){
  if(b.timer<=.35&&!s.swapFlipped){s.swapFlipped=true;s.realBelow=!s.realBelow;lakeSetRealPosition(b);}
  if(b.timer<=0){b.phase='lakeRest';b.timer=.55;}return;
 }
 lakeSetRealPosition(b);
 const direction=player.x+13>b.x+b.w/2?1:-1,target=Math.max(MIRROR_LAKE.left+95,Math.min(MIRROR_LAKE.right-b.w-95,player.x+13-direction*280));
 b.x+=Math.sign(target-b.x)*Math.min(Math.abs(target-b.x),70*dt);b.dir=direction;
 if(b.timer<=0){if(s.swapIn<=0)lakeBeginSwap(b);else lakeBeginStabs(b);}
};
const lakeOnDamage=onBossDamaged;
onBossDamaged=function(b){if(!b.lake){lakeOnDamage(b);return;}if(b.hp<=b.max/2)b.phaseTwo=true;};
const lakeHittable=bossCanBeHit;
bossCanBeHit=function(b){return b.lake?!b.lake.wait&&!b.lake.intro&&!['lakeSwap','dying'].includes(b.phase):lakeHittable(b);};
const lakeContact=bossContactDamage;
bossContactDamage=function(b){return b.lake?0:lakeContact(b);};
const lakeDamagePlayer=harm;
harm=function(n,x){if(lakeInputLocked())return;lakeDamagePlayer(n,x);};
const lakeAttack=attack;attack=function(){if(!lakeIntroActive())lakeAttack();};
const lakeBolt=fireBolt;fireBolt=function(){if(!lakeIntroActive())lakeBolt();};
const lakeDash=dash;dash=function(){if(!lakeInputLocked())lakeDash();};
const lakeMap=toggleMap;toggleMap=function(){if(!lakeIntroActive())lakeMap();};
const lakeInteract=interact;
interact=function(){if(lakeIntroActive())return;if(isMirrorLake()&&mode==='playing'&&!boss&&rooms[room].lamp&&Math.abs(player.x-rooms[room].lamp)<100&&player.onGround){beginRest();return;}lakeInteract();};
const lakeMenuKey=handleMenuKey;
handleMenuKey=function(e){
 if(mode==='playing'&&lakeIntroActive()&&!['Escape','F2'].includes(e.code)){
  const movement=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyW','KeyS','Space','KeyX','KeyK','ShiftLeft','ShiftRight'];
  if(lakeInputLocked()||!movement.includes(e.code)){e.preventDefault();return true;}
 }return lakeMenuKey(e);
};
const lakeUpdate=update;
update=function(dt){
 const b=boss;if(mode==='playing'&&b?.lake?.wait&&isMirrorLake()&&player.onGround&&Math.abs(player.x+13-MIRROR_LAKE.center)<48&&Math.abs(player.y+player.h-MIRROR_LAKE.y)<5)beginLakeIntro(b);
 if(mode==='playing'&&b?.lake?.intro){
  const s=b.lake,locked=s.age<MIRROR_LAKE.unlock;lakeAdvanceIntro(b,dt);
  if(locked){time+=dt;saved.playSeconds+=dt;player.x=s.anchor.x;player.y=s.anchor.y;player.vx=player.vy=player.attack=player.cast=player.dashTime=player.jumpBuffer=0;keys.clear();player.onGround=true;}
  else lakeUpdate(dt);
  if(boss===b&&s.intro)camera=s.camera;return;
 }
 lakeUpdate(dt);
};

// Reflect the actual upper scene before HUD and overlays are painted. The boss
// pair is drawn afterwards at exactly the same opacity, without the water tint.
const lakeTerrain=terrain;
terrain=function(){
 if(!isMirrorLake()){lakeTerrain();return;}
 const L=MIRROR_LAKE;ctx.fillStyle='#102a3d';ctx.fillRect(L.left,L.y,L.right-L.left,H-L.y);
 for(const [x,w]of [[0,L.left],[L.right,rooms[room].width-L.right]]){ctx.fillStyle='#1a2e39';ctx.fillRect(x,L.y,w,H-L.y);line(x,L.y,x+w,L.y,'#9cbbbf',3);for(let i=0;i<w;i+=55){line(x+i,L.y+10,x+i+20,L.y+42,'#4d6573',2);}}
 for(const x of [L.left,L.right]){ellipse(x,L.y+4,45,10,'#526e78');path([[x-26,L.y],[x-13,L.y-13],[x+10,L.y-8],[x+30,L.y]],'#80949a');for(let i=0;i<5;i++)line(x+(i-2)*8,L.y,x+(i-2)*10,L.y-25-i%2*13,'#6c9291',2);}
 if(rooms[room].lamp){const x=rooms[room].lamp;arch(x-13,L.y-67,26,65,'#9caa91',3);glow(x,L.y-42,39,'#e0ce9955');ellipse(x,L.y-43,5,9,'#e7d5a8');}
 for(const body of deathBodies)if(!body.enemy.lake)drawDeathBody(body);
};
const lakeBossDraw=drawBoss;
drawBoss=function(b){if(!b.lake)lakeBossDraw(b);};
function drawLakeSword(a,alpha=.76){
 const active=lakeStabActive(a),progress=lakeStabProgress(a),warning=a.age<a.delay+a.warning;
 if(a.age<a.delay)return;const angle=Math.atan2(a.uy,a.ux),tip=100+progress*(a.reach-100),x=a.origin.x+a.ux*(tip-100),y=a.origin.y+a.uy*(tip-100);
 ctx.save();ctx.globalAlpha=alpha;
 if(warning){line(a.origin.x,a.origin.y,a.origin.x+a.ux*a.reach,a.origin.y+a.uy*a.reach,'#9ce6ff55',1.5);runeRing(a.origin.x,a.origin.y,17,'#b2eaff99',time);}
 if(active){line(a.origin.x,a.origin.y,a.origin.x+a.ux*tip,a.origin.y+a.uy*tip,'#b1ddff33',5);line(a.origin.x,a.origin.y,x,y,'#90b7cf',2);}
 ctx.translate(x,y);ctx.rotate(angle);line(-14,0,2,0,'#dcf3ff',4);line(0,-11,0,11,'#a4d1e6',3);path([[3,-4],[85,-6],[103,0],[85,6],[3,4]],'#80a9cc');line(7,-3,91,-2,'#efffff',2);line(7,3,91,2,'#c7e8fc',1);if(active)glow(82,0,24,'#adf0ff55');ctx.restore();
}
function lakeActorAlpha(b){return b.lake.alpha*(b.phase==='lakeSwap'?.25+.75*Math.abs(1-2*(.7-b.timer)/.7):1);}
function drawLakeActor(b,below,alpha=lakeActorAlpha(b),x=b.x){
 ctx.save();if(below){ctx.translate(0,2*MIRROR_LAKE.y);ctx.scale(1,-1);}
 drawLateModel({...b,x,y:MIRROR_LAKE.y-b.h,phase:'lakeBody',lakeSwordHidden:true},alpha);
 ctx.globalAlpha=alpha*(b.hit>0?.65:1);const cx=x+b.w/2,dir=b.dir||1,shoulderY=MIRROR_LAKE.y-b.h/2+7,handY=MIRROR_LAKE.y+(below?-75:-32);
 line(cx+dir*25,shoulderY,cx+dir*40,(shoulderY+handY)/2,'#9cc3d5',6);line(cx+dir*40,(shoulderY+handY)/2,cx+dir*28,handY,'#d0e8f0',5);ctx.restore();
}
function drawLakeIntro(b){
 const s=b.lake,L=MIRROR_LAKE,t=s.age;
 if(t<3){let x=L.left+70,alpha=0;
  if(t<1.35)alpha=Math.min(1,t/1.35)*.76;
  else if(t<1.62){const u=(t-1.35)/.27;x=L.left+70+u*(L.right-L.left-210);alpha=.76;for(let i=1;i<=6;i++)drawLakeActor({...b,dir:1},true,.1*(1-i/7),x-i*34);}
  else{x=L.right-b.w-140;alpha=.76*Math.max(0,1-(t-1.62)/1.38);}
  drawLakeActor({...b,dir:1},true,alpha,x);drawLakeSword({origin:{x:x+b.w/2+28,y:L.y+75},ux:1,uy:0,reach:130,delay:0,age:0,warning:1,extend:1,hold:0,retract:1},alpha);
 }
 for(const r of s.ripples){const age=t-r.born;ctx.save();ctx.globalAlpha=Math.max(0,1-age/3);ctx.strokeStyle='#b9eaff99';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(r.x,L.y,25+age*95,3+age*7,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 if(t>=5&&t<6){runeRing(s.anchor.x+13,L.y,22+(t-5)*30,'#b8eaff88',t);}
 if(t>=6){drawLateModel({...b,lakeSwordHidden:true},.76);if(s.entranceStab)drawLakeSword(s.entranceStab);}
}
const lakeReflect=drawWorldReflection;
drawWorldReflection=function(){
 lakeReflect();if(!isMirrorLake())return;const L=MIRROR_LAKE;
 ctx.save();ctx.beginPath();ctx.rect(L.left,L.y,L.right-L.left,L.bottom-L.y);ctx.clip();ctx.globalAlpha=.48;
 // Separate strips add subtle moving refraction while sampling only above water.
 for(let y=0;y<L.bottom-L.y;y+=6){const h=Math.min(6,L.bottom-L.y-y),offset=Math.sin(time*1.6+y*.08)*(.4+y*.012);ctx.drawImage(canvas,0,L.y-y-h,W,h,camera+offset,L.y+y,W,h);}
 ctx.globalAlpha=1;const gradient=ctx.createLinearGradient(0,L.y,0,L.bottom);gradient.addColorStop(0,'#16364c22');gradient.addColorStop(1,'#061626b8');ctx.fillStyle=gradient;ctx.fillRect(L.left,L.y,L.right-L.left,L.bottom-L.y);ctx.restore();
 for(const body of deathBodies)if(body.enemy.lake){for(const below of [false,true]){ctx.save();if(below){ctx.translate(0,2*L.y);ctx.scale(1,-1);}drawDeathBody({...body,enemy:{...body.enemy,y:L.y-body.enemy.h}});ctx.restore();}}
 if(boss?.lake&&boss.phase!=='dying'){
  const b=boss,s=b.lake;
  if(s.intro)drawLakeIntro(b);
  else if(!s.wait){drawLakeActor(b,false);drawLakeActor(b,true);for(const a of s.attacks)drawLakeSword(a,lakeActorAlpha(b));
   if(!s.attacks.length){const d=player.x+13>b.x+b.w/2?1:-1;for(const below of [false,true])drawLakeSword({origin:{x:b.x+b.w/2+d*28,y:L.y+(below?75:-32)},ux:d,uy:below?-.28:0,reach:110,delay:0,age:0,warning:1,extend:1,hold:0,retract:1},lakeActorAlpha(b));}
   if(b.phase==='lakeSwap'){for(const side of [-1,1]){const u=(.7-b.timer)/.7;line(b.x+b.w/2+side*Math.sin(u*Math.PI)*40,L.y-65+u*130,b.x+b.w/2-side*Math.sin(u*Math.PI)*40,L.y+65-u*130,'#d0f5ff88',3);}}
  }
 }
 line(L.left,L.y,L.right,L.y,'#c0e3efaa',2);
 for(let i=0;i<12;i++){const x=L.left+30+i*86,y=L.y+Math.sin(time*1.8+i)*1.3;line(x,y,x+44,y,'#b1def044',1);}
 if(player.onGround&&player.x+13>L.left&&player.x+13<L.right){ctx.strokeStyle='#bce6f277';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(player.x+13,L.y+1,17+Math.sin(time*6)*4,3,0,0,Math.PI*2);ctx.stroke();}
};
const lakeHUD=hud;
hud=function(){lakeHUD();if(isMirrorLake()&&boss?.lake?.wait)text('走到湖中央 · 湖面可以站立',W/2,535,13,'#c0e2ef','center');if(lakeIntroActive())text(boss.lake.age<6?'湖底的残像 · 静候湖面波纹':'可以移动了 · 避开上刺',W/2,100,16,'#d0ecf4','center');};
const lakeDevSummon=developerSummonBoss;
developerSummonBoss=function(kind,phase='1'){
 if(kind==='mirror'&&dev.enabled&&!isMirrorLake())enterRoom(MIRROR_LAKE.room);
 const result=lakeDevSummon(kind,phase);if(result&&kind==='mirror'&&isMirrorLake()){initMirrorLake(boss,phase==='intro');if(phase==='intro'){player.x=MIRROR_LAKE.center-13;player.y=MIRROR_LAKE.y-player.h;player.onGround=true;}devMessage('已召唤 镜湖残像 · '+(phase==='intro'?'湖心登场演出':'湖上横刺 / 湖下斜刺，虚实互换')+'。');}return result;
};
const lakeDevRefresh=refreshDeveloperPanel;
refreshDeveloperPanel=function(){const before=devNode('dev-boss-phase').value;lakeDevRefresh();if(devNode('dev-boss').value==='mirror'){const select=devNode('dev-boss-phase');select.innerHTML='<option value="1">直接战斗 · 满血</option><option value="2">直接战斗 · 半血</option><option value="intro">湖心登场演出</option>';select.value=before==='2'||before==='intro'?before:'1';select.disabled=!dev.enabled;}};
devNode('dev-boss').onchange=()=>refreshDeveloperPanel();
const lakeTeleport=developerTeleport;
developerTeleport=function(id,x,y){const result=lakeTeleport(id,x,y);if(result&&isMirrorLake()&&!dev.flying){player.y=Math.min(player.y,MIRROR_LAKE.y-player.h);}return result;};
histories[3][1]+=' 湖中央仍有一片承托旅人的镜水。残像先从水底穿过，再以湖上横刺、湖下斜刺试探来者；虚实换位后，只有真正的残像承受伤害。';
rooms[33].note={x:rooms[33].width-260,text:'无声镜殿：踏上镜湖，走到湖心。先看完湖底的影子，最后一秒方可闪避。\n湖上横刺，湖下斜刺，剑锋收回时同样危险。'};
refreshDeveloperPanel();

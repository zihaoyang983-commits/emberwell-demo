'use strict';
// The last three guardians teach the powers the traveller inherits from them.
// Encounter state belongs to the boss, so room changes and the developer sandbox
// discard or restore a whole encounter together, including its pending attacks.
const lateBossDesigns={
 mirror:{hp:144,w:76,h:126,color:'#a9e5fa',title:'镜湖残像',intro:'镜光连线后穿身突进；跳开轨迹，等实体重新凝聚。',stages:['一阶段 · 湖面独影','二阶段 · 碎镜双身'],reward:'镜行冲刺 · 更远、穿怪、冲刺免伤',death:2.3},
 bell:{hp:288,w:112,h:170,color:'#d3b0f3',title:'深渊钟守',intro:'跳过地面钟波，避开落钟标记；钟守能回生一次。',stages:['第一条生命 · 守钟','第二条生命 · 回生鸣响'],reward:'回生钟誓 · 一次满状态原地复活',death:2.8},
 heart:{hp:576,w:90,h:160,color:'#d4d4ff',title:'无光之王',intro:'剑气锁定后离开判定线；连续斩击之间仍有新的预警。',stages:['一阶段 · 无名王座','二阶段 · 长夜断章'],reward:'无光之剑 · 自动寻敌、100 伤害、半屏斩',death:3.2}
};
const lateCues={
 mirrorWake:[550,850,'sine',.7],mirrorAim:[740,1180,'sine',.65],mirrorRush:[1400,180,'triangle',.24],mirrorSplit:[880,330,'sine',1.1],mirrorEcho:[1040,620,'sine',.38],mirrorBreak:[1550,210,'triangle',1],
 bellWake:[110,110,'sine',1.2],bellLift:[165,220,'triangle',.8],bellToll:[87,65,'sine',1.3],bellDrop:[280,72,'triangle',.45],bellEcho:[330,247,'sine',.75],bellFall:[130,40,'sine',1],bellRise:[65,262,'sine',1.4],bellSilence:[196,32,'sine',1.5],
 kingWake:[55,82,'triangle',1.1],kingAim:[130,390,'sawtooth',.7],kingCut:[95,24,'sawtooth',.36],kingCrown:[420,110,'triangle',.8],kingBreak:[58,230,'sawtooth',1.2],kingCross:[220,660,'triangle',.65],kingFall:[82,25,'triangle',1.6]
};
const lateSoundPlan=bossSoundPlan;
bossSoundPlan=function(kind,phase,stage){
 const cue=lateCues[phase];if(!cue)return lateSoundPlan(kind,phase,stage);
 const [f,end,wave,duration]=cue,metal=kind==='bell';
 return {notes:[{f,end,wave,delay:0,duration,gain:.043},...((metal?[2.756,4.087]:kind==='mirror'?[2,3.01]:[1.5,.5]).map((ratio,i)=>({f:f*ratio,end:end*ratio,wave:metal?'sine':wave,delay:.04+i*.07,duration:duration*(metal?1.15:.65),gain:.016})))],noise:phase.includes('Cut')||phase.includes('Break')||phase==='mirrorRush'?{filter:'highpass',frequency:kind==='heart'?900:2500,duration:.27,gain:.028}:null};
};
function lateSound(b,cue){soundBoss(b.kind,cue,'release');}
function lateCenter(b){return {x:b.x+b.w/2,y:b.y+b.h/2};}
function lateGround(b){b.x=forgeGroundX(b.x+b.w/2,b.w)-b.w/2;b.y=GROUND-b.h;}
function initLateBoss(b){
 const d=lateBossDesigns[b.kind];if(!d)return;
 const asleep=b.phase==='sleep';b.hp=b.max=d.hp;b.w=d.w;b.h=d.h;lateGround(b);b.late=true;b.lateEffects=[];b.lateTrails=[];b.lateTurn=0;b.phaseTwo=false;b.bellRevived=false;b.vx=b.vy=0;b.phase=asleep?'sleep':'lateWake';b.timer=1.2;b.dir=player.x>b.x?1:-1;
}
const latePrepare=prepareCampaignEncounters;
prepareCampaignEncounters=function(id){latePrepare(id);if(boss&&lateBossDesigns[boss.kind])initLateBoss(boss);};
function latePose(b,phase,duration,cue){b.phase=phase;b.timer=duration;b.poseDuration=duration;if(cue)lateSound(b,cue);}
function lateRest(b,duration=.8){latePose(b,'lateRecover',duration);}
function lateClearAttacks(b){b.lateEffects=[];b.lateTrails=[];shots=shots.filter(s=>s.owner==='player');echoAttacks=[];}
function lateStartSecond(b){
 b.hp=b.max/2;b.phaseTwo=true;lateClearAttacks(b);b.vx=b.vy=0;
 latePose(b,b.kind==='mirror'?'mirrorFracture':'kingUnseal',1.9,b.kind==='mirror'?'mirrorSplit':'kingBreak');
 player.inv=Math.max(player.inv,.75);spawn(lateCenter(b).x,lateCenter(b).y,45,lateBossDesigns[b.kind].color,200);shake=12;
 toast(b.kind==='mirror'?'镜面碎裂 · 残像开始交错穿梭。':'王冠崩裂 · 每次剑气都有独立锁定线。',4);
}
function lateStartRevival(b){
 b.hp=1;b.bellRevived=true;lateClearAttacks(b);delete b.emberPoison;b.vx=b.vy=0;latePose(b,'bellFallen',1.15,'bellFall');
 toast('钟守尚未死去 · 巨钟正在召回它的魂火。',4);
}
const lateDamage=onBossDamaged;
onBossDamaged=function(b){lateDamage(b);if(!b.late)return;
 if(b.kind==='bell'&&b.hp<=0&&!b.bellRevived){lateStartRevival(b);return;}
 if(['mirror','heart'].includes(b.kind)&&!b.phaseTwo&&b.hp<=b.max/2)lateStartSecond(b);
};
const lateHitAllowed=bossCanBeHit;
bossCanBeHit=function(b){return lateHitAllowed(b)&&!(b.late&&['mirrorDash','mirrorFracture','bellFallen','bellRebirth','bellGrace','kingUnseal'].includes(b.phase));};
const lateContact=bossContactDamage;
bossContactDamage=function(b){if(!b.late)return lateContact(b);return ['sleep','lateWake','mirrorDash','mirrorFracture','bellFallen','bellRebirth','bellGrace','kingUnseal','dying'].includes(b.phase)?0:1;};

function mirrorAim(b,remaining=b.phaseTwo?2:1){
 b.mirrorRemaining=remaining;const a=lateCenter(b),dx=player.x+13-a.x,dy=player.y+23-a.y,len=Math.hypot(dx,dy)||1,range=b.phaseTwo?760:620;
 const end={x:Math.max(65+b.w/2,Math.min(rooms[room].width-65-b.w/2,a.x+dx/len*range)),y:Math.max(115+b.h/2,Math.min(GROUND-b.h/2,a.y+dy/len*range))};
 b.mirrorPath={a,end};b.dir=dx>=0?1:-1;latePose(b,'mirrorAim',b.phaseTwo?.68:.9,'mirrorAim');
}
function mirrorClones(b){
 const center=Math.max(280,Math.min(rooms[room].width-280,player.x+13));
 for(const [i,side]of [-1,1].entries()){
  const x=Math.max(70,Math.min(rooms[room].width-70,center+side*360)),y=GROUND-65-(i?135:0),tx=center-side*390;
  b.lateEffects.push({type:'echoDash',x,y,tx,ty:y,wait:.95+i*.32,age:0,life:.34,damage:1,width:30,color:'#afe5ff',cue:'mirrorRush',fired:false});
 }
 latePose(b,'mirrorEchoes',1.75,'mirrorEcho');
}
function mirrorShards(b){
 const p=lateCenter(b);b.lateEffects.push({type:'volley',x:p.x,y:p.y-20,tx:player.x+13,ty:player.y+23,wait:.85,life:.25,age:0,count:b.phaseTwo?5:3,speed:330,color:'#afe5ff',shot:'mirrorShard',cue:'mirrorEcho',fired:false});latePose(b,'mirrorPrism',1.3,'mirrorEcho');
}
function updateMirror(b,dt){
 if(b.phase==='mirrorAim'&&b.timer<=0){latePose(b,'mirrorDash',b.phaseTwo?.42:.36,'mirrorRush');b.mirrorDashTime=b.timer;return;}
 if(b.phase==='mirrorDash'){
  const old=lateCenter(b),p=b.mirrorPath,t=Math.min(1,1-b.timer/b.mirrorDashTime),next={x:p.a.x+(p.end.x-p.a.x)*t,y:p.a.y+(p.end.y-p.a.y)*t};
  b.lateTrails.push({x:b.x,y:b.y,age:0});if(forgeSegmentHitsRect(old,next,player,22))harm(1,old.x);b.x=next.x-b.w/2;b.y=next.y-b.h/2;
  if(b.timer<=0){if(--b.mirrorRemaining>0)mirrorAim(b,b.mirrorRemaining);else lateRest(b,.85);}return;
 }
 if(b.phase==='mirrorFracture'){if(b.timer<=0){lateGround(b);lateRest(b,.6);}return;}
 if(['mirrorEchoes','mirrorPrism'].includes(b.phase)&&b.timer<=0)lateRest(b,b.phaseTwo?.6:.95);
}
function bellRing(b,x,wait=0){b.lateEffects.push({type:'ring',x,y:GROUND-8,radius:35,wait,age:0,life:4.8,speed:b.phaseTwo?340:270,width:13,damage:1,color:'#dbb8fa',cue:'bellToll',fired:false});}
function bellToll(b){latePose(b,'bellLift',.95,'bellLift');}
function bellFalling(b){
 const center=Math.max(300,Math.min(rooms[room].width-300,player.x+13));
 for(const [i,offset]of (b.phaseTwo?[-280,-140,0,140,280]:[-210,0,210]).entries())b.lateEffects.push({type:'bellDrop',x:center+offset,y:70,wait:1.05+i*.1,age:0,life:1.5,speed:790,damage:2,color:'#d6b6ed',cue:'bellDrop',fired:false,landed:false});
 latePose(b,'bellSummon',2.3,'bellLift');
}
function bellChorus(b){const p=lateCenter(b);b.lateEffects.push({type:'volley',x:p.x,y:p.y-35,tx:player.x+13,ty:player.y+23,wait:.85,life:.4,age:0,count:b.phaseTwo?5:3,speed:235,color:'#dfb6ff',shot:'bellEcho',cue:'bellEcho',fired:false});latePose(b,'bellChorus',1.5,'bellEcho');}
function updateBell(b,dt){
 if(b.phase==='bellFallen'&&b.timer<=0){latePose(b,'bellRebirth',1.35,'bellRise');return;}
 if(b.phase==='bellRebirth'&&b.timer<=0){b.hp=b.max;b.phaseTwo=true;delete b.emberPoison;latePose(b,'bellGrace',1,'bellRise');spawn(lateCenter(b).x,lateCenter(b).y,55,'#e8d1ff',190);toast('回生已消耗 · 钟守满血归来，钟鸣加快。',4);return;}
 if(b.phase==='bellGrace'&&b.timer<=0){lateRest(b,.6);return;}
 if(b.phase==='bellLift'&&b.timer<=0){bellRing(b,lateCenter(b).x);if(b.phaseTwo)bellRing(b,lateCenter(b).x,.44);latePose(b,'bellRinging',b.phaseTwo?1.1:1.4);return;}
 if(['bellRinging','bellSummon','bellChorus'].includes(b.phase)&&b.timer<=0)lateRest(b,b.phaseTwo?.6:.95);
}
function kingCut(b,remaining=b.phaseTwo?3:1){
 b.kingRemaining=remaining;const p=lateCenter(b),dx=player.x+13-p.x,dy=player.y+23-p.y,len=Math.hypot(dx,dy)||1;
 b.kingAim=Math.atan2(dy,dx);b.dir=dx>=0?1:-1;const duration=b.phaseTwo?.68:.95;
 b.lateEffects.push({type:'cut',x:p.x,y:p.y,tx:p.x+dx/len*600,ty:p.y+dy/len*600,wait:duration,life:.32,age:0,damage:2,width:28,color:'#d5d7ff',cue:'kingCut',fired:false});latePose(b,'kingAim',duration,'kingAim');
}
function kingCross(b){
 const target={x:player.x+13,y:player.y+23},center=lateCenter(b);
 for(const side of [-1,1]){const x=Math.max(65,Math.min(rooms[room].width-65,target.x+side*360)),y=100,dx=target.x-x,dy=target.y-y,len=Math.hypot(dx,dy)||1;b.lateEffects.push({type:'cut',x,y,tx:x+dx/len*600,ty:y+dy/len*600,wait:1.1,life:.32,age:0,damage:2,width:24,color:'#d5d7ff',cue:'kingCut',fired:false});}
 b.kingAim=Math.atan2(target.y-center.y,target.x-center.x);latePose(b,'kingCross',1.7,'kingCross');
}
function kingCrown(b){
 const cx=Math.max(350,Math.min(rooms[room].width-350,player.x+13));
 for(const [i,offset]of [-300,-150,0,150,300].entries())b.lateEffects.push({type:'spike',x:cx+offset,y:GROUND,wait:1.05+(b.phaseTwo?i*.07:0),life:.52,age:0,damage:1,width:36,color:'#c0b7ff',cue:'kingCrown',fired:false});
 latePose(b,'kingCrown',1.95,'kingCrown');
}
function updateKing(b){
 if(b.phase==='kingUnseal'){if(b.timer<=0)lateRest(b,.6);return;}
 if(b.phase==='kingAim'&&b.timer<=0){latePose(b,'kingRelease',.33);return;}
 if(b.phase==='kingRelease'&&b.timer<=0){if(--b.kingRemaining>0)kingCut(b,b.kingRemaining);else lateRest(b,.9);return;}
 if(['kingCross','kingCrown'].includes(b.phase)&&b.timer<=0)lateRest(b,b.phaseTwo?.6:1);
}

function tickLateEffects(b,dt){
 for(const e of b.lateEffects){
  if(e.wait>0){e.wait-=dt;if(e.wait>0)continue;}
  if(!e.fired){e.fired=true;lateSound(b,e.cue);flourish(e.x,e.y,'burst',e.color,.35);}
  e.age+=dt;
  if(e.type==='cut'||e.type==='echoDash'){
   if(forgeSegmentHitsRect({x:e.x,y:e.y},{x:e.tx,y:e.ty},player,e.width/2))harm(e.damage,e.x);
  }else if(e.type==='ring'){
   const old=e.radius;e.radius+=e.speed*dt;
   for(const side of [-1,1])if(forgeSegmentHitsRect({x:e.x+side*old,y:GROUND-41},{x:e.x+side*e.radius,y:GROUND-41},{x:player.x,y:player.y,w:player.w,h:player.h},e.width)){
    if(player.y+player.h>GROUND-82)harm(e.damage,e.x);
   }
  }else if(e.type==='bellDrop'){
   const old=e.y;e.y=Math.min(GROUND-52,e.y+e.speed*dt);
   if(!e.landed&&forgeSegmentHitsRect({x:e.x,y:old},{x:e.x,y:e.y},player,34))harm(e.damage,e.x);
   if(e.y>=GROUND-52&&!e.landed){e.landed=true;e.age=0;e.life=.5;lateSound(b,'bellToll');flourish(e.x,GROUND-15,'impact',e.color,.45);shake=6;}
  }else if(e.type==='spike'){
   if(overlap(player,{x:e.x-e.width/2,y:GROUND-150,w:e.width,h:150}))harm(e.damage,e.x);
  }else if(e.type==='volley'){
   if(!e.released){e.released=true;const a=Math.atan2(e.ty-e.y,e.tx-e.x);for(let i=0;i<e.count;i++){const angle=a+(i-(e.count-1)/2)*.23;shots.push({x:e.x,y:e.y,vx:Math.cos(angle)*e.speed,vy:Math.sin(angle)*e.speed,life:4,owner:'boss',kind:e.shot,color:e.color,damage:1});}}
  }
 }
 b.lateEffects=b.lateEffects.filter(e=>!e.fired||e.age<e.life);
 for(const t of b.lateTrails)t.age+=dt;b.lateTrails=b.lateTrails.filter(t=>t.age<.32).slice(-18);
}
const lateOldBossUpdate=updateBoss;
updateBoss=function(dt){
 const b=boss;if(!b||!lateBossDesigns[b.kind]){lateOldBossUpdate(dt);return;}if(!b.late)initLateBoss(b);
 b.t+=dt;b.hit=Math.max(0,b.hit-dt);if(b.phase==='dying')return;
 if(b.phase==='sleep'){if(Math.abs(player.x-b.x)<950){latePose(b,'lateWake',1.4,{mirror:'mirrorWake',bell:'bellWake',heart:'kingWake'}[b.kind]);toast(b.name+' · '+lateBossDesigns[b.kind].intro,5);}return;}
 tickLateEffects(b,dt);b.timer-=dt;
 if(!['mirrorDash','mirrorAim','kingAim','kingRelease','kingCross'].includes(b.phase))b.dir=player.x+13>lateCenter(b).x?1:-1;
 if(b.kind!=='bell'&&!b.phaseTwo&&b.hp<=b.max/2){lateStartSecond(b);return;}
 if(['lateWake','lateRecover','lateIdle'].includes(b.phase)){
  if(b.kind==='heart'&&Math.abs(player.x+13-lateCenter(b).x)>380){b.x+=Math.sign(player.x+13-lateCenter(b).x)*115*dt;lateGround(b);}
  if(b.phase==='lateRecover'&&b.kind==='mirror'){const targetY=GROUND-b.h;b.y+=(targetY-b.y)*Math.min(1,dt*9);}
  if(b.timer<=0){
   if(b.phase!=='lateIdle'){latePose(b,'lateIdle',b.phaseTwo?.32:.5);return;}
   const turn=b.lateTurn++;
   if(b.kind==='mirror'){if(turn%3===0)mirrorAim(b);else if(turn%3===1)mirrorClones(b);else mirrorShards(b);}
   else if(b.kind==='bell'){if(turn%3===0)bellToll(b);else if(turn%3===1)bellFalling(b);else bellChorus(b);}
   else{if(turn%3===0)kingCut(b);else if(turn%3===1)kingCrown(b);else kingCross(b);}
  }return;
 }
 if(b.kind==='mirror')updateMirror(b,dt);else if(b.kind==='bell')updateBell(b,dt);else updateKing(b);
 // Old debug poses have a short recovery instead of stalling the encounter.
 if(!/^(mirror|bell|king)/.test(b.phase)&&b.timer<=0)lateRest(b,.6);
};

// Every fast or directional attack uses a swept collision test.
const lateShotTouch=hostileShotTouches;
hostileShotTouches=function(s,x,y){return ['mirrorShard','bellEcho'].includes(s.kind)?forgeSegmentHitsRect({x,y},{x:s.x,y:s.y},player,s.kind==='bellEcho'?12:6):lateShotTouch(s,x,y);};
const lateDrawShot=drawSpecialShot;
drawSpecialShot=function(s){
 if(!['mirrorShard','bellEcho'].includes(s.kind))return lateDrawShot(s);
 ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));glow(0,0,30,s.color+'33');
 if(s.kind==='mirrorShard'){path([[-29,0],[-4,-7],[15,0],[-4,7]],'#c6efff');line(-22,0,10,0,'#ffffff',2);}
 else{for(let i=0;i<3;i++)runeRing(-i*9,0,12-i*2,i?'#c89ee966':'#f2d7ff',s.life*.8);ellipse(0,0,4,4,'#ffefc8');}
 ctx.restore();return true;
};

function drawBellShape(x,y,scale=1,color='#c0a3cd',tilt=0){
 ctx.save();ctx.translate(x,y);ctx.rotate(tilt);ctx.scale(scale,scale);
 path([[-49,35],[-38,11],[-34,-32],[-20,-52],[20,-52],[34,-32],[38,11],[49,35]],'#352d4d');
 path([[-40,29],[-31,8],[-27,-30],[-16,-44],[16,-44],[27,-30],[31,8],[40,29]],color);
 path([[-23,-25],[-15,-38],[5,-39],[-3,20],[-25,20]],'#e5d6e533');
 line(-45,32,45,32,'#f0d6df',5);line(-32,15,32,15,'#715c88',3);line(0,35,0,48,'#b69a71',3);ellipse(0,48,8,10,'#e8c88e');
 for(let i=-1;i<=1;i++)path([[i*16-4,-18],[i*16,-27],[i*16+4,-18],[i*16,0]],'#605179');
 path([[-11,-52],[-11,-62],[11,-62],[11,-52]],'#e2bddb');ctx.restore();
}
function drawLateModel(b,alpha=1,death=0){
 const d=lateBossDesigns[b.kind],p=lateCenter(b),c=d.color,phase=b.phase;
 if(!b.lake)ellipse(p.x,GROUND-2,b.kind==='bell'?92:62,9,'#0007');
 ctx.save();ctx.translate(p.x,p.y+Math.sin(b.t*2)*2+death*28);ctx.globalAlpha=alpha*(b.hit>0?.65:1);ctx.scale(b.dir||1,1);
 if(b.kind==='mirror'){
  if(!b.lake){ctx.save();ctx.globalAlpha*=.19;ctx.translate(0,GROUND-p.y+18);ctx.scale(1,-.35);path([[-30,-52],[0,-85],[32,-52],[42,65],[-42,65]],'#9bd6f7');ctx.restore();}
  if(phase==='mirrorDash')ctx.globalAlpha*=.42;
  runeRing(0,-17,71,c+'66',b.t*.25);
  for(let i=0;i<7;i++){const a=i*Math.PI*2/7+b.t*.25;ctx.save();ctx.translate(Math.cos(a)*69,Math.sin(a)*69-17);ctx.rotate(a);path([[-7,0],[0,-15],[8,0],[0,10]],i%2?'#d2f5ff':'#527f9c');line(0,-11,0,8,'#f0ffff',1);ctx.restore();}
  path([[-19,-28],[-40,49],[-23,40],[-10,61],[2,40],[20,60],[41,43],[19,-28]],'#264961');
  for(let i=-2;i<=2;i++)line(i*9,-12,i*16,43,'#b8e4f266',1);
  path([[-26,-29],[0,-43],[29,-27],[20,24],[0,38],[-20,24]],'#98c9de');path([[-18,-22],[0,-32],[19,-21],[10,14],[0,24],[-12,15]],'#193a55');
  path([[-19,-44],[-13,-69],[0,-78],[15,-67],[21,-44],[0,-26]],'#dcf7fb');path([[-13,-51],[12,-56],[8,-38],[-8,-36]],'#26445d');line(-10,-48,11,-48,'#d7ffff',3);
  path([[-7,-71],[1,-92],[9,-70]],'#b1e7fa');
  for(const side of [-1,1]){path([[side*22,-32],[side*43,-45],[side*37,-5],[side*24,3]],'#b7deeb');line(side*12,27,side*20,55,'#9dcbde',7);}
  if(!b.lakeSwordHidden){ctx.save();ctx.translate(30,7);ctx.rotate(phase==='mirrorAim'?-.9:phase==='mirrorDash'?-.1:.25);line(0,0,16,0,'#e5effa',4);path([[14,-5],[90,-9],[108,0],[90,9],[14,5]],'#7ba7d3');line(20,-4,97,-2,'#edffff',3);ctx.restore();}
  if(b.phaseTwo){path([[-6,-26],[5,-10],[-5,2],[7,23]],'#e9ffff',2);glow(0,-15,50,'#9beaff33');}
 }else if(b.kind==='bell'){
  const fallen=['bellFallen','bellRebirth'].includes(phase),swing=phase==='bellLift'?-.24:Math.sin(b.t*2)*.035;
  drawBellShape(-14,-33,.95,'#9d82b9',swing+death*.6);
  for(const side of [-1,1])for(let i=0;i<6;i++){const x=side*44,y=-56+i*17;ctx.strokeStyle='#b2a0bf';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x+(i%2?3:0),y,5,9,side*.2,0,Math.PI*2);ctx.stroke();}
  path([[-30,-10],[-52,76],[-32,83],[-12,74],[6,84],[26,74],[48,81],[32,-8]],'#4e3d64');
  for(let i=-2;i<=2;i++)line(i*10,5,i*18,75,'#bda3ca55',2);
  path([[-27,-21],[0,-32],[30,-20],[24,22],[0,33],[-22,23]],'#88769b');path([[-12,-28],[-22,-49],[-17,-68],[0,-78],[18,-66],[24,-47],[12,-28]],'#5a496c');
  path([[-12,-56],[12,-56],[10,-32],[-10,-32]],'#161b2e');ellipse(0,-44,5,9,fallen?'#7e698f':b.phaseTwo?'#f7ddbe':'#dbc0f4');
  if(b.phaseTwo&&!fallen)glow(0,-43,35,'#edd0ff55');
  line(39,-23,52,71,'#af8b66',6);path([[36,-24],[32,-54],[51,-66],[65,-50],[60,-27]],'#c7abd7');runeRing(48,-45,13,'#f3ddbe',b.t*.3);
  if(phase==='bellLift'||phase==='bellRinging'){runeRing(-5,-39,88,'#e4c3fc99',b.t*.5);glow(0,-35,95,'#c69dea33');}
 }else{
  const shattered=b.phaseTwo||phase==='kingUnseal',aim=['kingAim','kingRelease','kingCross'].includes(phase);
  glow(0,-12,115,'#949de71c');
  for(const side of [-1,1])path([[side*20,-45],[side*50,-24],[side*(56+Math.sin(b.t*3)*3),65],[side*28,52],[side*10,77]],'#171d39');
  for(let i=-2;i<=2;i++)line(i*9,-10,i*18,66,'#8e8bb333',1);
  path([[-29,-35],[0,-49],[31,-33],[26,21],[0,39],[-26,20]],'#53546f');path([[-20,-27],[0,-36],[21,-26],[13,17],[0,29],[-15,16]],'#171d31');
  runeRing(0,-2,17,'#b4b6d777',b.t*.3);path([[0,-15],[9,-2],[0,12],[-9,-2]],shattered?'#d7d8ff':'#b9a982');
  for(const side of [-1,1]){path([[side*25,-33],[side*45,-52],[side*54,-23],[side*35,-11]],'#68647d');line(side*12,25,side*21,67,'#34384e',11);path([[side*13,56],[side*29,56],[side*34,74],[side*11,74]],'#747087');}
  path([[-20,-43],[-20,-68],[0,-81],[20,-68],[20,-43],[0,-30]],'#3c4059');path([[-14,-59],[14,-59],[11,-41],[-11,-41]],'#080f20');line(-11,-51,-3,-48,'#d6d9ff',3);line(4,-48,12,-51,'#d6d9ff',3);
  for(let i=-2;i<=2;i++){const lift=(shattered?Math.sin(b.t*2+i)*7+12:0)+death*90;path([[i*10-6,-70-lift],[i*12,-100-Math.abs(i)*4-lift],[i*10+6,-70-lift]],shattered?'#aba7c9':'#b5a27f');}
  ctx.save();ctx.translate(26,-4);const direction=aim?(b.kingAim||0):.9;ctx.rotate(b.dir<0?Math.PI-direction:direction);if(phase==='kingRelease')ctx.rotate(-.25);
  line(-16,0,8,0,'#a9a0c1',7);line(5,-18,5,18,'#c3b8d8',5);path([[10,-10],[118,-14],[152,0],[118,14],[10,10]],'#060c20');line(14,-9,128,-9,'#bfc7f8',3);line(14,9,128,9,'#8089c4',3);path([[22,0],[110,-3],[135,0],[110,3]],'#7e87bb');if(aim)glow(98,0,58,'#c8cdff55');ctx.restore();
  if(shattered)for(let i=0;i<5;i++)ellipse(Math.sin(b.t+i)*45,-70-i*12,1.5,1.5,'#c5cefa');
 }
 ctx.restore();
}

function drawLateEffects(b){
 for(const e of b.lateEffects){const warning=!e.fired,alpha=warning?.45+.35*Math.sin(b.t*13):Math.max(0,1-e.age/e.life);ctx.save();ctx.globalAlpha=alpha;
  if(e.type==='cut'||e.type==='echoDash'){
   if(e.type==='echoDash'){const t=warning?0:Math.min(1,e.age/e.life);drawLateModel({...b,x:e.x+(e.tx-e.x)*t-b.w/2,y:e.y-b.h/2,phase:'mirrorDash',dir:e.tx>e.x?1:-1},warning?.35:.65);}
   if(warning){line(e.x,e.y,e.tx,e.ty,e.color,2);line(e.x,e.y,e.tx,e.ty,e.color+'22',e.width);runeRing(e.x,e.y,20,e.color,b.t);text(e.type==='cut'?'锁刃 · 离开标线':'残像轨迹',e.x,e.y-28,11,e.color,'center');}
   else{const a=Math.atan2(e.ty-e.y,e.tx-e.x),len=Math.hypot(e.tx-e.x,e.ty-e.y);ctx.translate(e.x,e.y);ctx.rotate(a);glow(len*.55,0,85,e.color+'33');path([[0,-2],[len*.35,-e.width*1.6],[len,-5],[len+20,0],[len,5],[len*.35,e.width*.5],[0,2]],'#080f2a');for(const [w,c]of [[e.width+8,e.color+'33'],[8,e.color],[2,'#ffffff']]){line(0,0,len,0,c,w);}for(let i=0;i<8;i++)line(len*i/8,-10-(i%3)*8,len*i/8+34,12,e.color+'aa',1.5);}
  }else if(e.type==='ring'){
   if(warning){runeRing(e.x,GROUND-70,35,e.color,b.t);}
   else{for(const side of [-1,1]){glow(e.x+side*e.radius,GROUND-37,35,e.color+'44');path([[e.x+side*e.radius-12,GROUND],[e.x+side*e.radius,GROUND-80],[e.x+side*e.radius+12,GROUND]],e.color+'99');}ctx.strokeStyle=e.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x,GROUND-7,e.radius,e.radius*.12,0,0,Math.PI*2);ctx.stroke();}
  }else if(e.type==='bellDrop'){
   if(warning){line(e.x-42,GROUND-4,e.x+42,GROUND-4,e.color,4);line(e.x,90,e.x,GROUND,e.color+'55',2);text('落钟',e.x,GROUND-32,12,e.color,'center');drawBellShape(e.x,85,.48,e.color);}
   else drawBellShape(e.x,e.y,.72,e.color,e.landed?Math.sin(e.age*30)*.08:0);
  }else if(e.type==='spike'){
   if(warning){line(e.x-28,GROUND-4,e.x+28,GROUND-4,e.color,4);text('王冠刺',e.x,GROUND-28,11,e.color,'center');}
   else{glow(e.x,GROUND-70,65,e.color+'44');path([[e.x-24,GROUND],[e.x-13,GROUND-95],[e.x,GROUND-165],[e.x+14,GROUND-95],[e.x+24,GROUND]],'#20233f');line(e.x,GROUND-150,e.x+3,GROUND-12,e.color,3);}
  }else if(e.type==='volley'&&warning){runeRing(e.x,e.y,28+Math.sin(b.t*8)*5,e.color,b.t);line(e.x,e.y,e.tx,e.ty,e.color+'55',1);}
  ctx.restore();
 }
 if(b.kind==='mirror'){
  for(const t of b.lateTrails)drawLateModel({...b,x:t.x,y:t.y},.18*(1-t.age/.32));
  if(b.phase==='mirrorAim'&&b.mirrorPath){const p=b.mirrorPath;line(p.a.x,p.a.y,p.end.x,p.end.y,'#b9f1ff',2);line(p.a.x,p.a.y,p.end.x,p.end.y,'#abe9ff22',44);runeRing(p.end.x,p.end.y,27,'#b8eaff',b.t);text('穿身突进 · 跳离镜线',p.a.x,p.a.y-98,12,'#d1f4ff','center');}
  if(b.phase==='mirrorFracture')for(const side of [-1,1])drawLateModel({...b,x:b.x+side*(65+Math.sin(b.t*2)*20)},.28);
 }else if(b.kind==='bell'&&['bellFallen','bellRebirth','bellGrace'].includes(b.phase)){
  const p=lateCenter(b),r=b.phase==='bellFallen'?65:75+Math.sin(b.t*4)*12;for(let i=0;i<3;i++)runeRing(p.x,p.y,r+i*18,'#e4c4ff88',b.t*(i%2?-.4:.4));text(b.phase==='bellGrace'?'回生 · 满生命 · 1 秒护佑':'钟誓回魂 · 尚未结束',p.x,b.y-40,14,'#ebd1ff','center');
 }else if(b.phase==='kingUnseal'){const p=lateCenter(b);for(let i=0;i<8;i++){const a=i*Math.PI/4+b.t;line(p.x+Math.cos(a)*45,p.y+Math.sin(a)*45,p.x+Math.cos(a)*165,p.y+Math.sin(a)*165,'#c6c5ff88',2);}text('长夜断章',p.x,b.y-45,17,'#e1dbff','center');}
}
const lateTerrain=terrain;
terrain=function(){lateTerrain();if(!boss?.late)return;const b=boss,p=lateCenter(b),c=lateBossDesigns[b.kind].color;
 if(b.kind==='mirror'){ctx.save();ctx.globalAlpha=.2;for(let i=0;i<5;i++){const x=p.x-420+i*210;ctx.strokeStyle=c;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,GROUND-8,95,11,0,0,Math.PI*2);ctx.stroke();}ctx.restore();}
 else if(b.kind==='bell'){for(const side of [-1,1]){const x=p.x+side*230;line(x,90,x,GROUND-5,c+'33',2);drawBellShape(x,140,.5,'#665774');}}
 else{runeRing(p.x,GROUND-13,90,c+'33',b.t*.06);}
 drawLateEffects(b);
};
const lateBossDraw=drawBoss;
drawBoss=function(b){if(!lateBossDesigns[b.kind])return lateBossDraw(b);if(b.phase!=='dying')drawLateModel(b);};
const lateHUD=hud;
hud=function(){lateHUD();if(!boss?.late||boss.phase==='sleep')return;const b=boss,d=lateBossDesigns[b.kind];text(d.stages[b.phaseTwo?1:0]+(b.kind==='bell'?' · 回生 '+(b.bellRevived?'0':'1')+' 次':''),W/2,560,11,d.color,'center');};

const lateBeginDeath=beginCreatureDeath;
beginCreatureDeath=function(e,isBoss=false){const body=lateBeginDeath(e,isBoss);if(!body||!isBoss||!lateBossDesigns[e.kind])return body;body.kind='late-'+e.kind;body.duration=lateBossDesigns[e.kind].death;body.enemy={...e,lateEffects:[],lateTrails:[],phase:'dying'};lateClearAttacks(e);lateSound(e,{mirror:'mirrorBreak',bell:'bellSilence',heart:'kingFall'}[e.kind]);return body;};
const lateWin=win;
win=function(){const b=boss;lateWin();if(b?.late&&bossDeathPending){bossDeathPending.remaining=lateBossDesigns[b.kind].death;player.inv=bossDeathPending.remaining+.3;}};
const lateDrawDeath=drawDeathBody;
drawDeathBody=function(body){
 if(!body.kind.startsWith('late-'))return lateDrawDeath(body);const b=body.enemy,p=Math.min(1,body.age/body.duration),c=lateBossDesigns[b.kind].color,at=lateCenter(b);
 if(b.kind==='mirror'){drawLateModel(b,Math.max(0,1-p*1.4));for(let i=0;i<15;i++){const a=i*Math.PI*2/15,dist=25+p*130,x=at.x+Math.cos(a)*dist,y=at.y+Math.sin(a)*dist+p*p*70;ctx.save();ctx.globalAlpha=1-p;ctx.translate(x,y);ctx.rotate(a+p*2);path([[-4,-12],[7,0],[-3,10]],c);ctx.restore();}}
 else if(b.kind==='bell'){drawLateModel({...b,phase:'bellFallen'},1-p,p);for(let i=0;i<4;i++)runeRing(at.x,at.y,30+p*150+i*17,c+Math.round((1-p)*130).toString(16).padStart(2,'0'),p);}
 else{drawLateModel(b,1-p*.9,p);for(let i=0;i<12;i++){const a=i*Math.PI/6;line(at.x+Math.cos(a)*20,at.y+Math.sin(a)*20,at.x+Math.cos(a)*(40+p*180),at.y+Math.sin(a)*(40+p*180),c+Math.round((1-p)*160).toString(16).padStart(2,'0'),2);}glow(at.x,at.y,100*(1-p),'#bdc5ff33');}
};

// Both stages can be summoned directly without changing the real journey.
const lateDeveloperRefresh=refreshDeveloperPanel;
refreshDeveloperPanel=function(){lateDeveloperRefresh();const d=lateBossDesigns[devNode('dev-boss').value];if(!d)return;const select=devNode('dev-boss-phase'),html=d.stages.map((s,i)=>'<option value="'+(i+1)+'">'+s+'</option>').join('');if(select.innerHTML!==html){select.innerHTML=html;select.value='1';}select.disabled=!dev.enabled;};
const lateDeveloperSummon=developerSummonBoss;
developerSummonBoss=function(kind,phase='1'){const result=lateDeveloperSummon(kind,phase);if(!result||!lateBossDesigns[kind])return result;initLateBoss(boss);if(phase==='2'){boss.phaseTwo=true;boss.bellRevived=kind==='bell';boss.hp=kind==='bell'?boss.max:boss.max/2;}latePose(boss,'lateWake',1.2,{mirror:'mirrorWake',bell:'bellWake',heart:'kingWake'}[kind]);devMessage('已召唤 '+boss.name+' · '+lateBossDesigns[kind].stages[phase==='2'?1:0]+'。');return result;};
histories[3][1]+=' 残像把自己投进镜湖，在实体和倒影之间穿行；它消散后，这种穿身不伤的镜行留给了旅人。';
histories[4][1]+=' 钟守将最后一次心跳封入巨钟，初次倒下仍能满血回生。第二次钟声止息后，它把未用尽的回生钟誓交给旅人。';
histories[5][1]+=' 无光之剑斩向被王冠锁定的身影，纵使背对也能循影出刃。王消逝后，剑记住了新主人的敌人，而不再为封印而挥。';
for(const [id,kind]of [[33,'mirror'],[43,'bell'],[53,'heart']]){const d=lateBossDesigns[kind];rooms[id].note={x:rooms[id].width-260,text:d.title+'的刻痕：'+d.intro+'\n击败后继承「'+d.reward+'」。'};}
devNode('dev-boss').onchange=()=>refreshDeveloperPanel();
refreshDeveloperPanel();

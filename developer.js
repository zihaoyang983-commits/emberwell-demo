'use strict';
// The furnace priestess is a caster. Persistent remains are part of saved world state.
const FORGE_HP=72,FORGE_HALF=36,FORGE_DEATH_TIME=3.4;
chapters[2].hp=FORGE_HP;rooms[24].bossHP=FORGE_HP;
let forgeFurnace=null,forgeRainMarks=[],forgeBeams=[],forgeEmbers=[];
const forgeCues={witchWake:[180,360,'sine',.8,500],channelFire:[110,310,'triangle',1.1,360],liftFire:[280,820,'sine',.6,1100],rainWarn:[600,420,'sine',.6,1600],rainFall:[800,180,'sawtooth',.3,1800],furnaceCrack:[105,48,'square',.8,220],furnaceBurst:[180,30,'sawtooth',.65,900],absorbFire:[130,700,'triangle',1.4,800],witchFlare:[400,960,'sine',.5,2100],blueCharge:[340,1100,'sine',.55,2300],blueRelease:[1000,230,'sawtooth',.16,3200],laserAim:[520,820,'sine',.5,1800],laserFire:[1400,320,'sawtooth',.17,3800],witchFall:[210,70,'triangle',1.2,300],witchExtinguish:[150,35,'sine',1.5,140]};
const forgePreviousSoundPlan=bossSoundPlan;bossSoundPlan=function(kind,phase,stage){if(kind!=='forge'||!forgeCues[phase])return forgePreviousSoundPlan(kind,phase,stage);const [f,end,wave,duration,frequency]=forgeCues[phase];return {notes:[{f,end,wave,delay:0,duration,gain:.043},{f:f*1.51,end:end*.84,wave:'sine',delay:.045,duration:duration*.8,gain:.024}],noise:{filter:phase==='furnaceBurst'?'lowpass':'bandpass',frequency,duration:duration*.65,gain:phase==='furnaceBurst'?.065:.014}};};
function forgeSound(cue){soundBoss('forge',cue,'release');}
function forgeGroundX(desired,width=130){let best=Infinity,result=desired;for(const [x,w]of rooms[room].ground){if(w<width+20)continue;const at=Math.max(x+width/2+8,Math.min(x+w-width/2-8,desired)),d=Math.abs(at-desired);if(d<best){best=d;result=at;}}return result;}
function makeForgeFurnace(x=rooms[room].width/2,intact=true){forgeFurnace={x:forgeGroundX(x),y:GROUND,room,intact,burstAge:intact?0:10};return forgeFurnace;}
function initForgeWitch(b){b.hp=b.max=FORGE_HP;b.w=76;b.h=154;b.y=GROUND-b.h;b.witchStage=1;b.phaseTwo=false;b.turn=0;b.vx=b.vy=0;b.volleyLeft=0;b.laserLeft=0;makeForgeFurnace();}
function forgeStaffTip(b){const raising=['forgeChannel','forgeLift','witchAbsorb','witchFlare'].includes(b.phase),dir=b.dir||1;return {x:b.x+b.w/2+dir*(raising?46:64),y:GROUND-(raising?220:135)};}
function forgeBurst(x,y,count=30,blue=false){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=55+Math.random()*200;forgeEmbers.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-90,age:0,life:.6+Math.random()*1.1,blue,size:2+Math.random()*4});}}
function forgeSavedRemains(){const record=saved.mechanisms?.forgeRemains;if(record&&Number.isInteger(record.room)&&rooms[record.room]&&Number.isFinite(record.x))return record;return {room:24,x:650,dir:1,furnaceX:900};}
function restoreForgeRemains(){if(!saved.bosses.includes('forge')||saved.mechanisms?.forgeRemainsHidden)return;const r=forgeSavedRemains();if(r.room!==room)return;deathBodies.push({enemy:{kind:'forge',x:Math.max(45,Math.min(rooms[room].width-120,r.x)),y:GROUND-154,w:76,h:154,t:0,dir:r.dir===-1?-1:1,witchStage:2,phase:'dying'},kind:'forgeKneel',isBoss:true,permanent:true,duration:FORGE_DEATH_TIME,age:FORGE_DEATH_TIME,room,color:'#687079'});makeForgeFurnace(r.furnaceX??rooms[room].width/2,false);}
const forgePrepare=prepareCampaignEncounters;prepareCampaignEncounters=function(id){forgePrepare(id);forgeFurnace=null;forgeRainMarks=[];forgeBeams=[];forgeEmbers=[];if(boss?.kind==='forge')initForgeWitch(boss);else restoreForgeRemains();};
const forgeClearRuntime=clearJourneyRuntime;clearJourneyRuntime=function(){forgeClearRuntime();forgeFurnace=null;forgeRainMarks=[];forgeBeams=[];forgeEmbers=[];};
const forgeHitAllowed=bossCanBeHit;bossCanBeHit=function(b){return forgeHitAllowed(b)&&!(b.kind==='forge'&&['furnaceCrack','witchAbsorb','witchFlare'].includes(b.phase));};
const forgeContact=bossContactDamage;bossContactDamage=function(b){if(b.kind==='forge'&&!bossCanBeHit(b))return 0;return forgeContact(b);};
function startForgeTransformation(b){if(b.witchStage!==1)return;b.hp=FORGE_HALF;b.witchStage='transform';b.phase='furnaceCrack';b.timer=.85;b.vx=b.vy=0;forgeRainMarks=[];forgeBeams=[];shots=shots.filter(s=>s.owner==='player');player.inv=Math.max(player.inv,1.1);forgeSound('furnaceCrack');toast('熔炉即将炸裂 · 司祭正在吸收炉火！',4);}
const forgeOnDamage=onBossDamaged;onBossDamaged=function(b){forgeOnDamage(b);if(b.kind==='forge'&&b.witchStage===1&&b.hp<=FORGE_HALF)startForgeTransformation(b);};
function beginForgeChannel(b){b.phase='forgeChannel';b.timer=1.1;b.turn++;forgeSound('channelFire');const f=forgeFurnace||makeForgeFurnace();flourish(f.x,GROUND-105,'cast','#f8ae61',1.1);}
function forgeMarkRain(b){const center=Math.max(130,Math.min(rooms[room].width-130,player.x+13));const offsets=b.turn%2?[-310,-155,0,155,310]:[-390,-235,-78,78,235,390];for(let i=0;i<offsets.length;i++)forgeRainMarks.push({x:Math.max(65,Math.min(rooms[room].width-65,center+offsets[i])),wait:.7+i*.08,age:0,fired:false,life:2.65});forgeSound('rainWarn');}
function beginForgeBlueVolley(b){b.phase='blueCharge';b.timer=.62;b.volleyLeft=3;forgeSound('blueCharge');const p=forgeStaffTip(b);flourish(p.x,p.y,'cast','#75cfff',.62);}
function releaseForgeBlue(b){const p=forgeStaffTip(b),angle=Math.atan2(player.y+player.h*.5-p.y,player.x+player.w*.5-p.x);shots.push({x:p.x,y:p.y,vx:Math.cos(angle)*900,vy:Math.sin(angle)*900,life:3,owner:'boss',kind:'forgeBlue',damage:1,color:'#65caff'});forgeSound('blueRelease');forgeBurst(p.x,p.y,8,true);flourish(p.x,p.y,'burst','#91dcff',.28);}
function forgeRayEnd(origin,target){const dx=target.x-origin.x,dy=target.y-origin.y,len=Math.hypot(dx,dy)||1,vx=dx/len,vy=dy/len;let d=rooms[room].width*2;for(const [v,dist]of [[vx,rooms[room].width-35-origin.x],[-vx,origin.x-35],[vy,GROUND-origin.y],[-vy,origin.y-55]])if(v>1e-6)d=Math.min(d,dist/v);return {x:origin.x+vx*Math.max(0,d),y:origin.y+vy*Math.max(0,d)};}
function beginForgeLaser(b,first=false){if(first)b.laserLeft=4;b.dir=player.x+13>b.x+b.w/2?1:-1;b.phase='forgeLaserAim';b.timer=.6;b.laserOrigin=forgeStaffTip(b);b.laserTarget=forgeRayEnd(b.laserOrigin,{x:player.x+13,y:player.y+23});forgeSound('laserAim');}
function releaseForgeLaser(b){const p=b.laserOrigin,q=b.laserTarget;forgeBeams.push({x:p.x,y:p.y,tx:q.x,ty:q.y,life:.18,age:0});b.laserLeft--;forgeSound('laserFire');forgeBurst(q.x,q.y,10,true);shake=3;}
const forgeOldUpdateBoss=updateBoss;updateBoss=function(dt){const b=boss;if(!b||b.kind!=='forge'){forgeOldUpdateBoss(dt);return;}b.t+=dt;b.hit=Math.max(0,b.hit-dt);if(b.phase==='dying')return;if(!['forgeLaserAim','forgeLaserGap'].includes(b.phase))b.dir=player.x+13>b.x+b.w/2?1:-1;if(b.witchStage===1&&b.hp<=FORGE_HALF)startForgeTransformation(b);
 if(b.phase==='sleep'){if(Math.abs(player.x-b.x)<850){b.phase='witchWake';b.timer=1.2;forgeSound('witchWake');toast('熔炉司祭 · 留意法杖牵引的炉火与地面的火雨标记。',4);}return;}b.timer-=dt;
 if(b.phase==='furnaceCrack'){if(b.timer<=0){const f=forgeFurnace||makeForgeFurnace();f.intact=false;f.burstAge=0;b.phase='witchAbsorb';b.timer=1.6;forgeBurst(f.x,GROUND-90,65);flourish(f.x,GROUND-80,'burst','#ffaf66',1);shake=18;forgeSound('furnaceBurst');forgeSound('absorbFire');}return;}
 if(b.phase==='witchAbsorb'){if(b.timer<=0){b.witchStage=2;b.phaseTwo=true;b.phase='witchFlare';b.timer=.5;forgeSound('witchFlare');forgeBurst(b.x+b.w/2,b.y+55,35,true);flourish(b.x+b.w/2,b.y+75,'burst','#92d9ff',.6);toast('Ⅱ · 赤袍蓝焰 · 火球急射，激光连锁。',4);}return;}
 if(b.phase==='witchFlare'){if(b.timer<=0){b.phase='forgeIdle';b.timer=.32;b.turn=0;}return;}
 if(['witchWake','forgeIdle','forgeRecover'].includes(b.phase)){if(b.timer<=0){if(b.witchStage===2){b.turn++;if(b.turn%3===0)beginForgeLaser(b,true);else beginForgeBlueVolley(b);}else beginForgeChannel(b);}return;}
 if(b.phase==='forgeChannel'){if(b.timer<=0){b.phase='forgeLift';b.timer=.6;forgeSound('liftFire');}return;}
 if(b.phase==='forgeLift'){if(b.timer<=0){forgeMarkRain(b);b.phase='forgeRain';b.timer=2.4;}return;}
 if(b.phase==='forgeRain'){if(b.timer<=0){b.phase='forgeRecover';b.timer=.85;}return;}
 if(b.phase==='blueCharge'||b.phase==='blueVolley'){if(b.timer<=0){releaseForgeBlue(b);b.volleyLeft--;if(b.volleyLeft>0){b.phase='blueVolley';b.timer=.22;}else{b.phase='forgeRecover';b.timer=.38;}}return;}
 if(b.phase==='forgeLaserAim'){if(b.timer<=0){releaseForgeLaser(b);b.phase='forgeLaserGap';b.timer=.14;}return;}
 if(b.phase==='forgeLaserGap'){if(b.timer<=0){if(b.laserLeft>0)beginForgeLaser(b);else{b.phase='forgeRecover';b.timer=.4;}}return;}
 // Legacy debug poses resume safely under the new caster AI.
 if(b.timer<=0){b.phase='forgeIdle';b.timer=.3;}
};
function forgeSegmentHitsRect(a,b,r,pad=0){let lo=0,hi=1;for(const [pos,delta,min,max]of [[a.x,b.x-a.x,r.x-pad,r.x+r.w+pad],[a.y,b.y-a.y,r.y-pad,r.y+r.h+pad]]){if(Math.abs(delta)<1e-8){if(pos<min||pos>max)return false;continue;}let near=(min-pos)/delta,far=(max-pos)/delta;if(near>far)[near,far]=[far,near];lo=Math.max(lo,near);hi=Math.min(hi,far);if(lo>hi)return false;}return true;}
const forgeOrdinaryShotTouch=hostileShotTouches;hostileShotTouches=function(s,x,y){return s.kind==='forgeBlue'?forgeSegmentHitsRect({x,y},{x:s.x,y:s.y},player,8):forgeOrdinaryShotTouch(s,x,y);};
const forgeBeginDeath=beginCreatureDeath;beginCreatureDeath=function(e,isBoss=false){if(!isBoss||e.kind!=='forge')return forgeBeginDeath(e,isBoss);if(e.deathPlayed)return null;e.deathPlayed=true;const body={enemy:{...e,phase:'dying',hit:0},kind:'forgeKneel',duration:FORGE_DEATH_TIME,age:0,isBoss:true,permanent:true,room,color:'#646c78'};deathBodies.push(body);forgeRainMarks=[];forgeBeams=[];forgeEmbers=[];if(forgeFurnace)forgeFurnace.intact=false;if(!dev.enabled){saved.mechanisms.forgeRemains={room,x:e.x,dir:e.dir,furnaceX:forgeFurnace?.x??rooms[room].width/2};delete saved.mechanisms.forgeRemainsHidden;}forgeSound('witchFall');return body;};
const forgeDeathWin=win;win=function(){const isForge=boss?.kind==='forge';forgeDeathWin();if(isForge&&bossDeathPending){bossDeathPending.remaining=FORGE_DEATH_TIME;player.inv=FORGE_DEATH_TIME+.3;toast('司祭倚杖跪地，眼中的炉火渐渐熄灭…',4);}};
const forgePreviousDeathDraw=drawDeathBody;drawDeathBody=function(body){if(body.kind==='forgeKneel'){drawForgeWitch(body.enemy,body.age);return;}forgePreviousDeathDraw(body);};
const forgePreviousUpdate=update;update=function(dt){const active=['playing','resting','bossDying'].includes(mode),oldRoom=room;forgePreviousUpdate(dt);if(!active||room!==oldRoom)return;if(forgeFurnace&&!forgeFurnace.intact)forgeFurnace.burstAge=Math.min(10,forgeFurnace.burstAge+dt);
 if(mode==='playing'&&player.dead<=0&&boss?.kind==='forge'){
 for(const m of forgeRainMarks){m.age+=dt;m.wait-=dt;if(m.wait<=0&&!m.fired){m.fired=true;shots.push({x:m.x,y:55,vx:0,vy:420,life:1.3,owner:'boss',kind:'forgeRain',damage:1,color:'#ffb35f'});forgeSound('rainFall');}m.life-=dt;}forgeRainMarks=forgeRainMarks.filter(m=>m.life>0);
 for(const beam of forgeBeams){beam.life-=dt;beam.age+=dt;if(beam.life>0&&forgeSegmentHitsRect({x:beam.x,y:beam.y},{x:beam.tx,y:beam.ty},player,7))harm(1,beam.x);}forgeBeams=forgeBeams.filter(b=>b.life>0);
 for(const shot of shots)if(['forgeRain','forgeBlue'].includes(shot.kind)&&shot.y>=GROUND-3){shot.life=0;forgeBurst(shot.x,GROUND-5,6,shot.kind==='forgeBlue');}shots=shots.filter(s=>s.life>0);
 }else if(!boss||boss.kind!=='forge'){forgeRainMarks=[];forgeBeams=[];}
 for(const p of forgeEmbers){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=120*dt;}forgeEmbers=forgeEmbers.filter(p=>p.age<p.life);
 for(const body of deathBodies)if(body.kind==='forgeKneel'&&body.age-dt<1.65&&body.age>=1.65)forgeSound('witchExtinguish');
};
function forgeMix(a,b,t){const n=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),x=n(a),y=n(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*Math.max(0,Math.min(1,t))).toString(16).padStart(2,'0')).join('');}
function forgeFlame(x,y,size,color,clock=time){ctx.save();ctx.translate(x,y);const sway=Math.sin(clock*9+x)*size*.1;path([[-size*.5,0],[-size*.66,-size*.4],[-size*.18,-size*.7],[sway,-size*1.5],[size*.22,-size*.72],[size*.5,-size*.95],[size*.6,-size*.25],[size*.33,0]],color);path([[-size*.22,-size*.07],[0,-size*.7],[size*.23,-size*.08]],'#fff0c5');ctx.restore();}
function drawForgeWitch(b,deathAge=null){const dead=deathAge!==null,age=deathAge||0,kneel=dead?Math.min(1,age/1.05):0,fade=dead?Math.max(0,Math.min(1,(age-.8)/2.5)):0,trans=b.phase==='witchAbsorb'?1-Math.max(0,b.timer/1.6):b.witchStage===2?1:0,dir=b.dir||1,cx=b.x+b.w/2;
 const robe=forgeMix(forgeMix('#3155a4','#b63746',trans),'#4b505b',fade),trim=forgeMix('#b5c5e0','#76777b',fade),staff=forgeMix(forgeMix('#d94c55','#4bafff',trans),'#777379',fade),headY=-135+47*kneel+(dead?0:Math.sin((b.t||time)*2)*1.3),flamePower=trans*(dead?Math.max(0,1-(age-.8)/1.8):1),t=b.t||time;
 ctx.save();ctx.translate(cx,GROUND);ctx.scale(dir,1);illustrationDepth++;ellipse(0,-3,48,10,'#0007');
 const cloth=ctx.createLinearGradient(-45,0,45,-120);cloth.addColorStop(0,forgeMix(robe,'#141e32',.45));cloth.addColorStop(.48,robe);cloth.addColorStop(.72,forgeMix(robe,'#d8e1ed',.16));cloth.addColorStop(1,forgeMix(robe,'#171e34',.5));
 if(kneel<.8){line(-14,-21+15*kneel,-14,-3,'#283343',12);line(14,-21+15*kneel,18,-3,'#283343',12);}else{sculptEllipse(-18,-10,19,10,forgeMix(robe,'#737783',.15));path([[0,-22],[28,-16],[39,-7],[12,-5]],forgeMix(robe,'#1c2739',.25));}
 path([[-21,headY+25],[-34,headY+54],[-39,-43],[-50+12*kneel,-8],[-17,-14],[0,-6],[22,-12],[48-10*kneel,-8],[34,headY+59],[21,headY+25]],cloth);
 for(const side of [-1,1]){line(side*19,headY+41,side*(35-7*kneel),-16,forgeMix(robe,'#e1e6f3',.25),1.5);path([[side*22,headY+32],[side*39,headY+43],[side*35,headY+70],[side*19,headY+60]],robe);}
 path([[-22,headY+29],[0,headY+50],[23,headY+29],[10,headY+23],[-12,headY+23]],forgeMix(robe,'#d5e0f1',.3));line(-10,headY+36,0,-18,trim,2);line(10,headY+36,0,-18,trim,2);
 for(let i=0;i<4;i++){const y=headY+57+i*17;path([[-4,y],[0,y-4],[4,y],[0,y+5]],forgeMix('#edc98a','#777a7b',fade));}line(-30,-18,30,-18,forgeMix('#bba46c','#727277',fade),2);
 // White hair, a narrow face, pointed hat and articulated sleeves keep her silhouette readable.
 path([[-20,headY-9],[-30,headY+11],[-23,headY+45],[-10,headY+28],[17,headY+34],[28,headY+16],[18,headY-9]],forgeMix('#c0cee0','#777f8d',fade));sculptEllipse(0,headY+5,16,20,forgeMix('#e2c7bb','#92918e',fade));path([[-17,headY-5],[-7,headY-16],[11,headY-13],[21,headY+2],[8,headY-1],[1,headY+7],[-4,headY-1]],'#a3b4cd');line(0,headY+8,3,headY+14,'#b59c97',1);line(-4,headY+20,4,headY+20,dead?'#6b7075':'#865f66',1.5);
 line(-10,headY+5,-4,headY+6,flamePower>0?'#ffe2a2':'#4b5064',2);line(5,headY+6,11,headY+5,flamePower>0?'#ffe2a2':'#4b5064',2);
 
 ellipse(0,headY-13,37,7,forgeMix(robe,'#121d32',.35));path([[-24,headY-13],[-14,headY-47],[4,headY-78],[12,headY-46],[25,headY-31],[22,headY-14]],cloth);line(-16,headY-26,20,headY-26,trim,3);path([[-2,headY-24],[3,headY-31],[8,headY-24],[3,headY-18]],staff);
 if(flamePower>0){ctx.globalAlpha=flamePower;for(const eye of [-7,8]){glow(eye,headY+4,25,'#ffb34c66');forgeFlame(eye,headY+7,12+Math.sin(t*11)*2,'#ffa53e',t);}ctx.globalAlpha=1;}
 const raised=!dead&&['forgeChannel','forgeLift','witchAbsorb','witchFlare'].includes(b.phase),hx=dead?43:raised?46:64,hy=dead?-62:raised?-155:-88;
 path([[20,headY+35],[34,headY+45],[hx+9,hy+17],[hx-1,hy+8],[27,headY+57],[17,headY+52]],robe);line(26,headY+45,hx,hy+9,trim,1.5);sculptEllipse(hx,hy+5,5,7,forgeMix('#dfc2b1','#8b8b8c',fade));
 // The dead staff is planted vertically; the hand remains braced against it.
 const sx=dead?43:raised?46:64,sy=dead?-123:raised?-220:-135;line(sx,-4,sx,sy+12,forgeMix(staff,'#151b2c',.4),6);line(sx-1,-8,sx-1,sy+13,staff,2);for(let i=0;i<4;i++)line(sx-4,sy+27+i*11,sx+4,sy+24+i*11,forgeMix('#d9c690','#79797b',fade),1.4);
 path([[sx-11,sy+11],[sx-15,sy-5],[sx-5,sy-16],[sx,sy-27],[sx+6,sy-15],[sx+15,sy-5],[sx+11,sy+11],[sx,sy+17]],forgeMix(staff,'#edf4ff',.2));sculptEllipse(sx,sy,8,12,staff);if(!dead||fade<.95){ctx.globalAlpha=1-fade;glow(sx,sy,33,staff+'44');ellipse(sx-2,sy-4,2,4,'#f3f7ff');ctx.globalAlpha=1;}
 if(b.hit>0&&!dead){ctx.globalAlpha=.25;ellipse(0,headY+5,20,24,'#fff4d9');ctx.globalAlpha=1;}illustrationDepth--;ctx.restore();
 if(!dead){if(b.phase==='blueCharge'){const p=forgeStaffTip(b);runeRing(p.x,p.y,21+(1-b.timer/.62)*12,'#9cdeffbb',t*3);text('蓝焰聚能 · 急射',cx,b.y-111,12,'#a4dcff','center');}if(['forgeChannel','forgeLift'].includes(b.phase))text('引炉火 · 升焰成雨',cx,b.y-111,12,'#f7c18a','center');if(b.phase==='witchAbsorb')text('吸收炉火 · 赤袍觉醒',cx,b.y-111,12,'#ffb47c','center');if(b.phase==='forgeLaserAim')text('激光锁定 '+(5-b.laserLeft)+'/4 · 离开标线',cx,b.y-111,12,'#b9e8ff','center');}
}
function drawForgeFurnace(f){if(!f||f.room!==room)return;const x=f.x,y=GROUND;ctx.save();ctx.translate(x,y);ellipse(0,-2,85,13,'#0008');if(f.intact){const g=ctx.createLinearGradient(-70,0,60,-120);g.addColorStop(0,'#2a303b');g.addColorStop(.5,'#727080');g.addColorStop(1,'#292b37');path([[-72,-90],[-52,-15],[-33,-4],[36,-4],[56,-20],[72,-90]],g);for(let i=-2;i<=2;i++){line(i*21,-75,i*17,-16,'#a7917a',2);path([[i*19-5,-48],[i*19,-57],[i*19+5,-48],[i*19,-39]],'#eb9b5a');}ellipse(0,-90,76,18,'#3b3440');ellipse(0,-94,62,13,'#d8793e');glow(0,-98,100,'#e68c3733');for(let i=-2;i<=2;i++)forgeFlame(i*20,-93,25+(i%2?9:0),'#ed8f3e',time+i);ellipse(0,-89,78,8,'#9b7865');line(-55,-19,55,-19,'#b19775',3);if(boss?.phase==='furnaceCrack'){for(let i=-2;i<=2;i++)line(i*24,-80,i*20+11,-17,'#ffdda7',3);glow(0,-70,110,'#ffb86355');text('熔炉崩裂',0,-155,13,'#ffd1a0','center');}}else{for(let i=-3;i<=3;i++){ctx.save();ctx.translate(i*22,-4);ctx.rotate(i*.4);path([[-13,0],[-9,-16-Math.abs(i)*3],[12,-8],[15,3]],i%2?'#595666':'#78717a');line(-5,-7,8,-4,'#a99a86',1.5);ctx.restore();}if(f.burstAge<1.1)for(let i=0;i<9;i++){const a=i*Math.PI*2/9,p=f.burstAge;ctx.save();ctx.translate(Math.cos(a)*p*160,-60+Math.sin(a)*p*130+p*p*95);ctx.rotate(a+p*3);path([[-9,-8],[10,-6],[7,9],[-8,6]],'#817685');ctx.restore();}}ctx.restore();}
const forgeOldBossDraw=drawBoss;drawBoss=function(b){if(b.kind==='forge'){if(b.phase!=='dying')drawForgeWitch(b);return;}forgeOldBossDraw(b);};
const forgeOldShotDraw=drawSpecialShot;drawSpecialShot=function(s){if(!['forgeBlue','forgeRain'].includes(s.kind))return forgeOldShotDraw(s);const blue=s.kind==='forgeBlue',c=blue?'#66caff':'#f8a35a';ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx)-Math.PI/2);glow(0,0,blue?38:26,c+'44');forgeFlame(0,10,blue?15:11,c);ellipse(0,0,blue?6:4,blue?9:6,'#e6f7ff');ctx.restore();return true;};
const forgeOldTerrain=terrain;terrain=function(){forgeOldTerrain();drawForgeFurnace(forgeFurnace);const b=boss;if(b?.kind==='forge'){
 if(['forgeChannel','forgeLift','witchAbsorb'].includes(b.phase)&&forgeFurnace){const f=forgeFurnace,p=forgeStaffTip(b);for(let i=0;i<17;i++){const t=(time*.7+i/17)%1,absorb=b.phase==='witchAbsorb',tx=absorb?b.x+b.w/2:p.x,ty=absorb?b.y+65:p.y,x=f.x+(tx-f.x)*t,y=GROUND-110+(ty-(GROUND-110))*t-Math.sin(t*Math.PI)*75;forgeFlame(x,y,6+3*Math.sin(t*Math.PI),'#ffb55f');}if(b.phase==='forgeLift'){const p=forgeStaffTip(b),v=1-b.timer/.6;glow(p.x,p.y-(p.y-80)*v,30,'#ffb45f55');forgeFlame(p.x,p.y-(p.y-80)*v,21,'#ffc178');}}
 if(b.phase==='forgeLaserAim'&&b.laserOrigin&&b.laserTarget){const p=b.laserOrigin,q=b.laserTarget;ctx.save();ctx.setLineDash([12,9]);line(p.x,p.y,q.x,q.y,'#ffa6bc',2);ctx.setLineDash([]);runeRing(q.x,q.y,14,'#ffd0db99',time*3);runeRing(p.x,p.y,18+6*Math.sin(time*15),'#8fd8ffcc',time);ctx.restore();}
 }for(const m of forgeRainMarks){const alpha=m.fired?.4:.85;ctx.save();ctx.globalAlpha=alpha;ellipse(m.x,GROUND-3,27,5,'#e8974c66');line(m.x-22,GROUND-5,m.x+22,GROUND-5,'#ffd19c',2);path([[m.x-6,GROUND-20],[m.x,GROUND-12],[m.x+6,GROUND-20]],'#f6b16e');if(!m.fired){line(m.x,75,m.x,GROUND-24,'#ffc17e33',1);forgeFlame(m.x,85,11,'#e7a35f');}ctx.restore();}
 for(const q of forgeBeams){line(q.x,q.y,q.tx,q.ty,'#368fd955',29);line(q.x,q.y,q.tx,q.ty,'#69cfffdd',15);line(q.x,q.y,q.tx,q.ty,'#e8f9ff',3);glow(q.x,q.y,37,'#9cddff44');}for(const p of forgeEmbers){ctx.save();ctx.globalAlpha=Math.max(0,1-p.age/p.life);ellipse(p.x,p.y,p.size,p.size*.55,p.blue?'#83d5ff':'#f9b76b');ctx.restore();}
};
const forgeOldHUD=hud;hud=function(){forgeOldHUD();if(boss?.kind==='forge'&&!['sleep','dying'].includes(boss.phase))text((boss.witchStage===2?'Ⅱ · 赤袍蓝焰':boss.witchStage==='transform'?'转阶段 · 炉火归身':'Ⅰ · 蓝袍引火')+' · '+Math.ceil(Math.max(0,boss.hp))+'/'+FORGE_HP,W/2,625,11,boss.witchStage===2?'#a6dcff':'#f0bc85','center');};

;
'use strict';
const chronicleNames=[['观星旧梯','守灯密库'],['攀根花径','林卫伏巷'],['断链吊桥','熔炉运兵室'],['倒影飞廊','溺光藏室'],['悬钟回廊','归音哨所'],['星尘长阶','旧王禁库']];
const chronicleParents=[2,10,20,30,40,50];
const relics=[['逐风扣','冲刺冷却缩短 0.08 秒'],['露光瓶','疗愈蓄力更快'],['余温纹章','余烬弹冷却缩短至 0.38 秒'],['寻路棱镜','地图显示相邻房间与支路'],['回声坠饰','受伤后的无敌时间延长'],['不熄灯芯','击中敌人时额外积蓄余烬']];
const histories=[
 ['井城的第一盏灯','井下曾是逃离地表寒灾的避难城。守灯人负责把归乡的路线刻在灯塔上。为了让灯火长明，居民学会将记忆化成余烬；代价是逐渐忘记自己的名字。守门者守着出口，等待最后一位携灯的旅人。'],
 ['净水之藤','荆棘林原本是井城的净水花园。寄主吸收污染，根脉却在失控的记忆中疯长。它不是入侵者，而是最后一株仍在工作的净水藤。藤体中的花朵保留着园丁的呼唤，毒液来自无法再净化的积水。'],
 ['熔炉停火之夜','铸匠们造出五枚灯芯，将各区的灯塔连成归途。寒灾结束后，井城却没能开门：王将最后的记忆投进熔炉，以封印阻止污水涌入。司祭不断重演停火之夜，仍在等待一张已经烧毁的撤离命令。'],
 ['湖中的证词','镜湖保存了被献出的记忆。学者发现，王曾请求居民自愿献出一夜的往事，祭灯仪式却吞下了所有归乡的记忆。湖中的残像既是证人，也是困住众人的誓言。找回证词，才能让幸存者重新记起地面。'],
 ['没有敲响的钟','钟守接到的命令是：归途安全时敲响晨钟。封井后，钟域成了传递求救声的中继站。失音旅人一直在修复断裂的回声。那些游荡的幽灯不是敌军，是未被接回家的名字。'],
 ['最后的守灯人','无光之王用自己的名字维持封印，直到忘记为何守候。你携带的微光来自居民共同留下的一段归乡愿望。带回灯芯可以封住污水；带回记忆与沿途的证词，才可以让井城的人一起走向黎明。守灯人的回响，是这份愿望留给你的回答。']
];
let parkourMarks=new Set(),encounterState=null,echoAttacks=[],supplyCooldown=0,activeServiceNPC=null,serviceCard=null,storyOpen=false,storyReturn='playing',expansionDust=0;
for(let ch=0;ch<6;ch++){
 const parent=chronicleParents[ch],id=rooms.length,z=chapters[ch],base={label:'THE WAY HOME',chapter:ch,color:z.color,accent:z.accent,optional:true,left:null,right:null,enemies:[],pickups:[],doors:[],switches:[],barriers:[],mechanisms:[]};
 const route=[[260,440,150],[500,340,140],[750,250,145],[1010,350,130],[1260,275,130],[1510,185,145],[1760,290,150],[2010,215,145],[2250,130,160],[2480,240,160],[2740,170,210]].map(([x,y,w],i)=>[x,Math.min(465,y+(ch%2&&i%3===1?20:0)),w]);
 const r={...base,mechanisms:[],enemies:[],pickups:[],switches:[],barriers:[],name:chronicleNames[ch][0],width:3300,ground:[[0,700],[920,620],[1780,400],[2440,860]],platforms:route,parkour:true,parkourMarks:[{x:820,y:225},{x:1580,y:160},{x:2330,y:105}],parent,mapX:10.05,mapY:ch+.34,doors:[{x:125,target:parent,name:'返回营地'},{x:3100,target:id+1,name:chronicleNames[ch][1]}]};
 rooms.push(r);rooms[parent].doors.push({x:rooms[parent].width-200,target:id,name:r.name});
 const v={...base,mechanisms:[],enemies:[],pickups:[],switches:[],barriers:[],name:chronicleNames[ch][1],width:2400,ground:[[0,2400]],platforms:[[720,420,170],[1190,345,170],[1690,420,170]],mapX:10.05,mapY:ch+.68,encounter:true,parent:id,doors:[{x:125,target:id,name:'返回跑酷路线'},{x:2270,target:parent,name:'返回营地'}]};rooms.push(v);
 const device=addDevice(id,['crumble','spring','lift','ferry','bell','beam'][ch],1900);delete device.cache;
}
for(const id of [1,8,18,28,38,48])rooms[id].encounter=true;
function loreCount(){return saved.collected.filter(id=>id.startsWith('testimony-')).length;}
function encounterCount(){return saved.quests.filter(id=>id.startsWith('encounter-')).length;}
isRoomMapped=function(id){return saved.visited.includes(id)||saved.quests.includes('chart-'+rooms[id].chapter)||(hasRelic(3)&&saved.visited.some(v=>rooms[v]&&(rooms[v].left===id||rooms[v].right===id||rooms[v].doors?.some(d=>d.target===id))));};
function hasRelic(ch){return saved.collected.includes('relic-'+ch);}
function revealChapter(ch){const id='chart-'+ch;if(!saved.quests.includes(id))saved.quests.push(id);}
function expansionComplete(){return loreCount()===6&&[70,72,74,76,78,80].every(id=>saved.quests.includes('encounter-'+id));}
const chroniclesPrepare=prepareCampaignEncounters;prepareCampaignEncounters=function(id){chroniclesPrepare(id);parkourMarks=new Set();encounterState=null;echoAttacks=[];activeServiceNPC=null;serviceCard=null;};
function markParkour(i){if(parkourMarks.has(i))return;parkourMarks.add(i);const p=rooms[room].parkourMarks[i];spawn(p.x,p.y,20,rooms[room].accent,120);flourish(p.x,p.y,'cast',rooms[room].accent,.7);sound('rest');toast('归途路标 '+parkourMarks.size+'/3',2);}
function collectParkourRelic(){const r=rooms[room],id='relic-'+r.chapter;if(!r.parkour||saved.collected.includes(id)||!parkourMarks.has(1)||Math.abs(player.x+13-1580)>45||Math.abs(player.y+23-150)>60)return false;saved.collected.push(id);persist();flourish(1580,150,'burst',r.accent,.8);showCard('获得护符 · '+relics[r.chapter][0],relics[r.chapter][1]+'。\n携带即生效，无需装备。继续点亮第三枚路标，寻找归途证词。');return true;}
function collectTestimony(){const r=rooms[room],id='testimony-'+r.chapter;if(!r.parkour||parkourMarks.size<3||saved.collected.includes(id)||Math.abs(player.x+13-2835)>48||Math.abs(player.y+23-140)>65)return false;saved.collected.push(id);saved.coins+=100+r.chapter*35;persist();spawn(2835,140,42,r.accent,180);flourish(2835,140,'burst','#e8d5a4',1);showCard('归途证词 '+loreCount()+'/6 · '+histories[r.chapter][0],histories[r.chapter][1]+'\n\n获得 '+(100+r.chapter*35)+' 光屑。带回给守灯人和记忆学者，可以完成新的委托。');return true;}
function makeEncounterEnemy(species,x,hp,elite=false){const d=creatureBook[species],e={species,type:d.air?'flyer':'walker',x,y:d.air?300:518,origin:x,baseY:d.air?300:550,w:34,h:32,hp,max:hp,vx:0,vy:0,dir:player.x>x?1:-1,t:Math.random(),hit:0,lastAttack:-1,rewarded:false,elite};initCreature(e,species);return e;}
function spawnEncounterWave(){const a=encounterState,r=rooms[room],ch=r.chapter;a.wave++;a.wait=.9;a.started=true;const pool=creatureSets[ch],count=a.wave===1?2+Math.floor(ch/2):3+Math.floor(ch/2);
 for(let i=0;i<count;i++){const wanted=Math.max(a.left+55,Math.min(a.right-55,player.x+(i%2?-1:1)*(190+i*38))),floors=r.ground.filter(([x,w])=>w>90),g=floors.reduce((best,g)=>Math.abs(g[0]+g[1]/2-wanted)<Math.abs(best[0]+best[1]/2-wanted)?g:best,floors[0]),x=Math.max(g[0]+25,Math.min(g[0]+g[1]-65,wanted)),elite=a.wave===2&&i===count-1;const e=makeEncounterEnemy(pool[(i+a.wave)%3],x,(elite?9:3)+ch,elite);e.encounterTag=room;enemies.push(e);}
 spawn(player.x+13,GROUND,20,r.accent,140);soundBoss(chapters[ch].boss||'keeper','wake','warn');toast('遭遇战 '+a.wave+'/2 · '+(a.wave===2?'精英守卫现身':'留意侧翼与空中敌人'),4);
}
function finishEncounter(){const r=rooms[room],id='encounter-'+room;if(saved.quests.includes(id)){encounterState=null;return;}saved.quests.push(id);saved.coins+=90+r.chapter*25;if(r.optional)saved.fragments.push('encounter-heart-'+room);else saved.supplies=Math.min(3,(saved.supplies||0)+1);player.hp=Math.min(maxHP(),player.hp+1);persist();flourish(player.x+13,player.y+20,'burst',r.accent,1);encounterState=null;toast('遭遇战完成 · '+(r.optional?'心灯碎片 + ':'补给 + ')+(90+r.chapter*25)+' 光屑',5);}
function useSupplyNow(){if(mode!=='playing'||player.dead>0||supplyCooldown>0)return false;if(!(saved.supplies>0)){toast('没有补给。锻火匠可铸造补给，遭遇战也会掉落。',3);return false;}if(player.hp>=maxHP()&&player.soul>=99){toast('生命与余烬已满，补给没有消耗。');return false;}saved.supplies--;player.hp=Math.min(maxHP(),player.hp+2);player.soul=Math.min(99,player.soul+33);supplyCooldown=2;persist();spawn(player.x+13,player.y+20,30,'#b4e1bd',150);flourish(player.x+13,player.y+20,'cast','#bce2c4',.8);sound('rest');toast('补给生效 · 恢复 2 点生命与 33 余烬。',3);return true;}
useSupply=useSupplyNow;
const chroniclesHarm=harm;harm=function(n,x){if(player.inv<=0&&player.dead<=0&&player.dashTime<=0&&saved.ward){saved.ward=0;player.inv=1;persist();flourish(player.x+13,player.y+20,'burst','#d2bcea',.6);soundBoss('bell','cast','release');toast('回声祝福挡下了一次攻击。',3);return;}const hp=player.hp;chroniclesHarm(n,x);if(player.hp<hp&&hasRelic(4))player.inv+=.25;};
const chroniclesDash=dash;dash=function(){const before=player.dashCD;chroniclesDash();if(hasRelic(0)&&player.dashCD>before)player.dashCD=Math.max(.1,player.dashCD-.08);};
const chroniclesBolt=fireBolt;fireBolt=function(){const before=player.castCD;chroniclesBolt();if(hasRelic(2)&&player.castCD>before)player.castCD=.38;};
const npcServices={guide:['守灯补给','恢复生命与余烬；集齐三份证词后交还送信委托。'],cartographer:['测绘本章 · 35 光屑','显示本章所有房间名称与支路。'],smith:['铸造补给 · 45 光屑','携带最多三份；使用后恢复 2 点生命与 33 余烬。'],archivist:['解读归途证词','四份证词可还原封井的原因，解读全部六份完成证词档案。'],wanderer:['回声祝福 · 40 光屑','抵挡下一次普通攻击；不会抵挡毒液的持续伤害。'],echo:['点亮归乡门','打开通往静息庭院的门；六份证词与六座密库完成后，接回失散的居民。']};
function setServiceCard(n){activeServiceNPC={...n};serviceCard=rewardCard;if(rewardCard)rewardCard.body+='\n\n'+npcServices[n.role][1]+'\n归途证词 '+loreCount()+'/6 · 已完成遭遇战 '+encounterCount()+' 场。';}
const chroniclesSpeak=speak;speak=function(n){chroniclesSpeak(n);const ch=dev?.enabled?n.chapter??rooms[room].chapter:rooms[room].chapter;if(rewardCard)rewardCard.body+='\n\n「'+histories[ch][0]+'」\n'+histories[ch][1];setServiceCard(n);};
function performNPCService(){const n=activeServiceNPC;if(!n)return false;const role=n.role,ch=n.chapter??rooms[room].chapter;let body='';
 if(role==='guide'){player.hp=maxHP();player.soul=99;if(loreCount()>=3&&!saved.quests.includes('courier-relay')){saved.quests.push('courier-relay');saved.coins+=120;saved.fragments.push('courier-heart');body='你把三段失散的归途交回灯塔。获得 120 光屑与一枚心灯碎片。';}else body='灯火为你恢复了生命与余烬。新的委托：找回至少三份归途证词，带回灯台。';}
 if(role==='cartographer'){if(saved.quests.includes('chart-'+ch))body='这一章的测绘已经完成。地图会显示所有房间与支路名称。';else if(saved.coins<35)body='测绘需要 35 光屑。跑酷路线与遭遇战都可以获得光屑。';else{saved.coins-=35;revealChapter(ch);body='本章测绘完成。地图中的未知房间和支路已经标出。';}}
 if(role==='smith'){if(saved.supplies>=3)body='补给已经装满三份。';else if(saved.coins<45)body='铸造一份补给需要 45 光屑。';else{saved.coins-=45;saved.supplies++;body='铸造完成。按 '+bindingLabel('supply')+' 使用补给，恢复 2 点生命与 33 余烬。';}}
 if(role==='archivist'){if(loreCount()<4)body='先找回四份证词。那些封井的记载，必须由亲历者的记忆互相印证。';else{if(!saved.quests.includes('lantern-truth')){saved.quests.push('lantern-truth');saved.coins+=140;}body='证词还原：王封住的不是出口，而是涌入的污水。失控的献灯仪式让居民忘记了撤离。你带回的记忆，正在修复这道命令。获得 140 光屑（仅首次）。';if(loreCount()===6&&!saved.quests.includes('archive-complete')){saved.quests.push('archive-complete');saved.fragments.push('archive-heart');body+='\n六份证词全部归档。获得一枚心灯碎片；井心的回响会告诉你如何接回居民。';}}}
 if(role==='wanderer'){if(saved.ward)body='回声祝福仍然守护着你。';else if(saved.coins<40)body='请带回 40 光屑，修补这枚失音的钟。';else{saved.coins-=40;saved.ward=1;body='回声将抵挡下一次普通攻击。祝你将那些失落的名字带回家。';}}
 if(role==='echo'){if(!saved.quests.includes('home-beacon'))saved.quests.push('home-beacon');body='归乡门已点亮。在井底灯台右侧的金色门旁互动，即可回到静息庭院。';if(expansionComplete()){if(!saved.quests.includes('homecoming')){saved.quests.push('homecoming');saved.coins+=240;}body+='\n\n六座密库的道路已经清空，六份证词也找回了居民的名字。失音旅人终于敲响晨钟，净水花园留下新的种子，锻火匠带着灯芯走在队伍最后。\n你完成了「灯火归乡」。获得 240 光屑（仅首次）。';}else body+='\n归乡委托：找回六份证词，清除六座新密库的守卫。当前证词 '+loreCount()+'/6，密库 '+[70,72,74,76,78,80].filter(id=>saved.quests.includes('encounter-'+id)).length+'/6。';}
 persist();showCard(n.name+' · '+npcServices[role][0],body);setServiceCard(n);flourish(player.x+13,player.y+20,'cast',chapters[ch].accent,.65);sound('rest');return true;
}
function openStoryArchive(){storyReturn=mode;storyOpen=true;mode='chronicle';keys.clear();document.getElementById('story-panel').hidden=false;document.getElementById('story-content').innerHTML=histories.map(([title,body],ch)=>'<article><span>CHAPTER 0'+(ch+1)+(saved.collected.includes('testimony-'+ch)?' · 证词已找回':' · 沿途见闻')+'</span><h3>'+title+'</h3><p>'+body+'</p></article>').join('')+'<article><h3>灯火归乡</h3><p>六份证词与六座密库连接成居民的撤离路线。去井心向守灯人的回响交还这份归途。'+(saved.quests.includes('homecoming')?'你已经接回了失散的居民。':'这项委托可以在主线结束后继续完成。')+'</p></article>';}
function closeStoryArchive(){storyOpen=false;document.getElementById('story-panel').hidden=true;mode=storyReturn;keys.clear();}
const chroniclesMenuKey=handleMenuKey;handleMenuKey=function(e){if(storyOpen){if(e.code==='Escape'){e.preventDefault();closeStoryArchive();}return true;}return chroniclesMenuKey(e);};
const chroniclesInteract=interact;interact=function(){if(mode==='playing'){if(encounterState&&rooms[room].optional){toast('先解决密库守卫，门上的封印才会解除。');return;}if(room===45&&saved.quests.includes('home-beacon')&&Math.abs(player.x-700)<75){enterRoom(0);return;}}chroniclesInteract();};
const strongerBosses={mirror:1.34,bell:1.3,heart:1.42};
const chroniclesBossUpdate=updateBoss;updateBoss=function(dt){const b=boss;if(!b){chroniclesBossUpdate(dt);return;}const phase=b.phase,start=shots.length,hr=hazards.length,rate=strongerBosses[b.kind];chroniclesBossUpdate(rate&&['idle','recover','castRecover'].includes(phase)?dt*rate:dt);if(!rate||boss!==b)return;
 if(phase==='cast'&&b.phase==='castRecover'&&['forge','heart'].includes(b.kind)){const x=b.x+42+b.dir*38,y=b.y-30,a=Math.atan2(player.y+23-y,player.x+13-x);for(const d of [-.5,.5])shots.push({x,y,vx:Math.cos(a+d)*285,vy:Math.sin(a+d)*285,life:6,owner:'boss',color:chapters[rooms[room].chapter].accent,shape:'shard'});}
 if(phase==='cast'&&b.phase==='castRecover'&&b.kind==='mirror'&&b.phaseTwo)echoAttacks.push({x:Math.max(100,Math.min(rooms[room].width-100,player.x+(b.x>player.x?-260:260))),y:380,targetX:player.x+13,targetY:player.y+23,wait:.85});
 if(phase==='rain'&&b.phase==='recover'&&['bell','heart'].includes(b.kind))for(const d of [-3,3])shots.push({x:Math.max(80,Math.min(rooms[room].width-80,b.targetX+d*130)),y:100,vx:0,vy:330,life:3,owner:'boss',color:rooms[room].accent,shape:'shard'});
 if(hazards.length>hr)for(const h of hazards.slice(hr))if(h.kind==='laser'){h.y-=5;h.h+=10;}
 for(const s of shots.slice(start))if(s.owner==='boss'&&!s.kind){s.color=s.color||rooms[room].accent;s.shape=s.shape||'shard';}
};
const chroniclesFinishEnding=finishEnding;finishEnding=function(kind){chroniclesFinishEnding(kind);rewardCard.body+='\n\n'+(saved.quests.includes('homecoming')?'晨钟为归来的居民响起。你为长夜作出的选择，终于有了见证。':'灯芯已经归位，失散的名字仍在等待。你可以继续寻找归途证词、清理六座密库，再去井心接回居民。');};
const chroniclesUpdate=update;update=function(dt){const active=mode==='playing',oldRoom=room,soul=player.soul;if(active&&hasRelic(1)&&healTime>0)healTime+=dt*.18;chroniclesUpdate(dt);if(!active||mode!=='playing'||room!==oldRoom||player.dead>0)return;supplyCooldown=Math.max(0,supplyCooldown-dt);const r=rooms[room];
 if(hasRelic(5)&&player.soul>soul)player.soul=Math.min(99,player.soul+3);
 if(r.parkour){r.parkourMarks.forEach((p,i)=>{if(Math.abs(player.x+13-p.x)<48&&Math.abs(player.y+23-p.y)<62)markParkour(i);});if(collectParkourRelic())return;if(collectTestimony())return;}
 if(r.encounter&&!saved.quests.includes('encounter-'+room)){if(!encounterState&&!dev.enabled&&player.x>450&&player.x<r.width-400){encounterState={room,wave:0,wait:.75,started:false,left:r.optional?360:Math.max(80,player.x-430),right:r.optional?r.width-270:Math.min(r.width-80,player.x+650)};flourish(player.x+13,GROUND-20,'burst',r.accent,.8);toast('遭遇战 · 留意两侧的守卫。',3);}if(encounterState){if(r.optional)player.x=Math.max(encounterState.left,Math.min(encounterState.right-player.w,player.x));if(!encounterState.started||enemies.filter(e=>e.encounterTag===room).every(e=>e.hp<=0)){encounterState.wait-=dt;if(encounterState.wait<=0){if(encounterState.wave===2)finishEncounter();else spawnEncounterWave();}}}}
 for(const e of echoAttacks){e.wait-=dt;if(e.wait<=0){const a=Math.atan2(e.targetY-e.y,e.targetX-e.x);for(const d of [-.17,.17])shots.push({x:e.x,y:e.y,vx:Math.cos(a+d)*265,vy:Math.sin(a+d)*265,life:4,owner:'boss',color:'#b6dbe9',shape:'shard'});flourish(e.x,e.y,'burst','#b5d9ed',.5);soundBoss('mirror','blink','release');}}echoAttacks=echoAttacks.filter(e=>e.wait>0&&!!boss);
 expansionDust+=dt;if(expansionDust>.12){expansionDust=0;const x=camera+Math.random()*W;if(Math.random()<.6)particles.push({x,y:80+Math.random()*420,vx:r.chapter===3?15:-8,vy:r.chapter===2?-18:12,life:1.2,size:1.2,color:r.accent});}
};
const chroniclesTerrain=terrain;terrain=function(){chroniclesTerrain();const r=rooms[room],c=r.accent;
 if(r.parkour){for(let i=0;i<r.parkourMarks.length;i++){const p=r.parkourMarks[i],lit=parkourMarks.has(i);runeRing(p.x,p.y,17,lit?'#f2dfaa':c+'88',time*.4);text(String(i+1),p.x,p.y+4,11,lit?'#fff1c4':c,'center');if(lit)glow(p.x,p.y,38,c+'22');}
 if(!hasRelic(r.chapter)){const x=1580,y=150+Math.sin(time*2)*4;runeRing(x,y,25,c+'77',time);path([[x,y-12],[x+10,y],[x,y+12],[x-10,y]],'#ded6a8');glow(x,y,38,c+'33');text(relics[r.chapter][0],x,y-40,12,c,'center');}
 if(!saved.collected.includes('testimony-'+r.chapter)){const x=2835,y=140+Math.sin(time*2)*4;path([[x-12,y-16],[x+12,y-12],[x+11,y+16],[x-13,y+11]],'#e0d5b0');for(let i=0;i<3;i++)line(x-7,y-6+i*5,x+7,y-4+i*5,'#887b60',1);glow(x,y,45,c+'33');text('归途证词 · 需点亮三枚路标',x,y-38,12,c,'center');}}
 if(encounterState){for(const x of [encounterState.left,encounterState.right]){if(!r.optional)continue;for(let y=215;y<550;y+=32)path([[x-5,y],[x+6,y+15],[x-5,y+29]],c+'88');}text('遭遇战 '+Math.max(1,encounterState.wave)+'/2',player.x+13,player.y-35,13,c,'center');}
 for(const e of enemies)if(e.elite&&e.hp>0){runeRing(e.x+17,e.y+16,30,'#e5c47c77',time*.5);text('精英',e.x+17,e.y-20,10,'#e6ca8d','center');}
 for(const e of echoAttacks){runeRing(e.x,e.y,25+e.wait*15,'#b5d9ed88',time);line(e.x,e.y,e.targetX,e.targetY,'#add6e655',1);text('镜像追射',e.x,e.y-45,11,'#c4e5ef','center');}
 if(room===45&&saved.quests.includes('home-beacon')){arch(670,435,60,115,'#d6c49a',3);text('归乡门',700,416,12,'#e1cea1','center');if(Math.abs(player.x-700)<75)interactionPrompt(bindingLabel('interact')+' 返回静息庭院',700,385);}
};
const chroniclesHUD=hud;hud=function(){chroniclesHUD();text('补给 '+bindingLabel('supply')+' ×'+(saved.supplies||0)+(saved.ward?' · ◇ 回声祝福':''),W-35,88,11,'#c9d7b7','right');if(rooms[room].parkour)text('归途路标 '+parkourMarks.size+'/3 · 护符与证词在高台',W-35,110,10,rooms[room].accent,'right');};
const chroniclesRender=render;render=function(){chroniclesRender();const active=activeServiceNPC&&rewardCard===serviceCard&&['reward','shop'].includes(mode);document.getElementById('npc-services').hidden=!active;if(active)document.getElementById('npc-service-action').textContent=npcServices[activeServiceNPC.role][0];if(mode==='journal'){text('归途证词 '+loreCount()+'/6 · 遭遇战 '+encounterCount()+'/12 · 护符 '+saved.collected.filter(id=>id.startsWith('relic-')).length+'/6',W/2,590,11,'#d5c595','center');}};
document.getElementById('npc-service-action').onclick=performNPCService;document.getElementById('npc-story-action').onclick=openStoryArchive;document.getElementById('story-button').onclick=openStoryArchive;document.getElementById('story-close').onclick=closeStoryArchive;
refreshMenu();

;
'use strict';
// A reversible play session: generated actors and progression never touch save slots.
const dev={enabled:false,invincible:false,flying:false,panelOpen:false,returnMode:'title',returnOverlayHidden:false,snapshot:null,npcs:[],mapPointer:null};
let devPhaseKind='';
const devNPCs=rooms.filter(r=>r.npc).map(r=>({...r.npc,chapter:r.chapter}));
const devBosses=rooms.filter(r=>r.bossId).map(r=>({kind:r.bossId,name:r.bossName,hp:r.bossHP||36,chapter:r.chapter,accent:r.accent}));
const devNode=id=>document.getElementById(id);
function devMessage(s){devNode('dev-status').textContent=s;}
function refreshDeveloperPanel(){devNode('dev-enabled').checked=dev.enabled;devNode('dev-invincible').checked=dev.invincible;devNode('dev-flight').checked=dev.flying;devNode('dev-state').textContent=dev.enabled?'已开启 · 独立试验':'已关闭';
 for(const id of ['dev-invincible','dev-flight','dev-npc','dev-monster','dev-boss','dev-spawn-npc','dev-spawn-monster','dev-spawn-boss','dev-clear','dev-heal','dev-map'])devNode(id).disabled=!dev.enabled;
 devNode('dev-encounter').disabled=!dev.enabled||!rooms[room].encounter;const phaseKind=devNode('dev-boss').value;if(devPhaseKind!==phaseKind){devPhaseKind=phaseKind;devNode('dev-boss-phase').innerHTML=phaseKind==='forge'?'<option value="1">一阶段 · 蓝袍引火</option><option value="2">二阶段 · 赤袍蓝焰</option>':'<option value="1">一阶段 · 扎根巨藤</option><option value="2">二阶段 · 毒息食人花</option>';devNode('dev-boss-phase').value='1';}devNode('dev-boss-phase').disabled=!dev.enabled||!['thorn','forge'].includes(phaseKind);devNode('dev-clear-forge').disabled=!dev.enabled;devNode('dev-panel-button').setAttribute?.('aria-pressed',String(dev.enabled));
}
function openDeveloperPanel(){if(dev.panelOpen)return closeDeveloperPanel();dev.returnMode=mode;dev.returnOverlayHidden=devNode('overlay').classList.contains('hidden');dev.panelOpen=true;keys.clear();mode='developer';devNode('overlay').classList.add('hidden');devNode('dev-panel').hidden=false;devNode('dev-panel').scrollTop=0;refreshDeveloperPanel();devNode('dev-enabled').focus();}
function closeDeveloperPanel(){if(!dev.panelOpen)return;dev.panelOpen=false;devNode('dev-panel').hidden=true;mode=dev.returnMode;devNode('overlay').classList[dev.returnOverlayHidden?'add':'remove']('hidden');keys.clear();if(mode==='playing')canvas.focus();}
function enableDeveloper(){if(dev.enabled)return;const originalMode=dev.panelOpen?dev.returnMode:mode,originalHidden=dev.panelOpen?dev.returnOverlayHidden:devNode('overlay').classList.contains('hidden');
 dev.snapshot={saved,room,camera,mode:originalMode,overlayHidden:originalHidden,player:{...player},sessionStarted,menuReturnMode,previousMode,menuPage,menuConfirmation,
  runtime:{darkSwordCuts,inheritanceBursts,phaseCrossings:new Set(phaseCrossings),forgeFurnace,forgeRainMarks,forgeBeams,forgeEmbers,parkourMarks:new Set(parkourMarks),encounterState,echoAttacks,supplyCooldown,activeServiceNPC,serviceCard,expansionDust,enemies,boss,shots,ghosts,particles,hazards,creatureHazards,deathBodies,bossDeathPending,restWalk,arenaState,rewardCard,roomDevices,thornRoots,thornPoison,thornPetals,combatFlourishes,depthMarks:new Set(depthMarks)},
  clocks:{time,varietyClock,campaignClock,saveClock,shake,flash,healTime,depthEntryFade}};
 dev.enabled=true;dev.invincible=false;dev.flying=false;dev.npcs=[];saved=cloneProgress(saved);clearJourneyRuntime();depthMarks=new Set();for(const k of Object.keys(abilities))saved[k]=true;
 sessionStarted=true;menuReturnMode='playing';mode='playing';enterRoom(originalMode==='title'||originalMode==='exited'?saved.checkpoint:room);player.hp=maxHP();player.soul=99;devNode('overlay').classList.add('hidden');devNode('exit-screen').hidden=true;
 dev.returnMode='playing';dev.returnOverlayHidden=true;if(dev.panelOpen)mode='developer';refreshDeveloperPanel();devMessage('已开启。所有能力可用；试验不会覆盖正式存档。');
}
function disableDeveloper(keepPanel=false){if(!dev.enabled)return;const s=dev.snapshot;dev.enabled=false;dev.invincible=false;dev.flying=false;dev.npcs=[];dev.snapshot=null;dev.mapPointer=null;
 saved=s.saved;room=s.room;camera=s.camera;Object.assign(player,s.player);sessionStarted=s.sessionStarted;menuReturnMode=s.menuReturnMode;previousMode=s.previousMode;menuPage=s.menuPage;menuConfirmation=s.menuConfirmation;
 ({darkSwordCuts,inheritanceBursts,phaseCrossings,forgeFurnace,forgeRainMarks,forgeBeams,forgeEmbers,parkourMarks,encounterState,echoAttacks,supplyCooldown,activeServiceNPC,serviceCard,expansionDust,enemies,boss,shots,ghosts,particles,hazards,creatureHazards,deathBodies,bossDeathPending,restWalk,arenaState,rewardCard,roomDevices,thornRoots,thornPoison,thornPetals,combatFlourishes,depthMarks}=s.runtime);
 ({time,varietyClock,campaignClock,saveClock,shake,flash,healTime,depthEntryFade}=s.clocks);mode=s.mode;keys.clear();syncBossLamps();updateLabels();setMenuPanel(menuPage);refreshMenu();
 dev.returnMode=s.mode;dev.returnOverlayHidden=s.overlayHidden;devNode('overlay').classList[s.overlayHidden?'add':'remove']('hidden');devNode('exit-screen').hidden=s.mode!=='exited';
 if(keepPanel){dev.panelOpen=true;mode='developer';devNode('overlay').classList.add('hidden');devNode('dev-panel').hidden=false;}else{dev.panelOpen=false;devNode('dev-panel').hidden=true;}
 refreshDeveloperPanel();devMessage('已关闭，已恢复原来的位置、战斗状态和旅程进度。');
}
const developerPersist=persist;persist=function(){return dev.enabled?true:developerPersist();};
const developerSaveSlot=writeSaveSlot;writeSaveSlot=function(i){if(dev.enabled){toast('开发者试验不写入存档。关闭开发者模式即可继续正常存档。',4);return false;}return developerSaveSlot(i);};
const developerRefreshMenu=refreshMenu;refreshMenu=function(){developerRefreshMenu();if(dev.enabled){devNode('menu-save').disabled=true;devNode('menu-status').textContent='开发者试验中 · 关闭开发者模式后恢复正式旅程';}};
const developerApplyProgress=applyJourneyProgress;applyJourneyProgress=function(p){if(dev.enabled)disableDeveloper();return developerApplyProgress(p);};
const developerExitJourney=exitJourney;exitJourney=function(){if(dev.enabled)disableDeveloper();developerExitJourney();};
devNode('menu-exit').onclick=exitJourney;
const developerOpenMenu=openMainMenu;openMainMenu=function(){if(dev.panelOpen)closeDeveloperPanel();developerOpenMenu();};togglePause=openMainMenu;devNode('menu-button').onclick=openMainMenu;devNode('pause-button').onclick=openMainMenu;
const developerHas=has;has=function(r){return dev.enabled||developerHas(r);};
const developerPrepare=prepareCampaignEncounters;prepareCampaignEncounters=function(id){developerPrepare(id);if(dev.enabled){dev.npcs=[];arenaState=null;if(boss)boss.devSummoned=true;}};
developerFlying=function(){return dev.enabled&&dev.flying;};
const developerHarm=harm;harm=function(n,x){if(dev.enabled&&dev.invincible)return;developerHarm(n,x);};
const developerPoison=applyThornPoison;applyThornPoison=function(x){return dev.enabled&&dev.invincible?false:developerPoison(x);};
const developerPoisonTick=poisonTick;poisonTick=function(){if(dev.enabled&&dev.invincible){thornPoison=null;return;}developerPoisonTick();};
const developerDash=dash;dash=function(){if(!developerFlying())developerDash();};
function setDeveloperInvincible(on){dev.invincible=dev.enabled&&!!on;if(dev.invincible){thornPoison=null;player.dead=0;player.hp=maxHP();}refreshDeveloperPanel();devMessage('无敌'+(dev.invincible?'已开启：免疫攻击、陷阱和毒液。':'已关闭。'));}
function setDeveloperFlight(on){dev.flying=dev.enabled&&!!on;player.vx=player.vy=player.dashTime=player.jumpBuffer=0;player.slam=false;keys.clear();refreshDeveloperPanel();devMessage(dev.flying?'飞行已开启：方向键 / WASD 移动，空格上升，Shift 加速。':'飞行已关闭，恢复重力。');}
function developerSpawnX(width=34,distance=210){const desired=player.x+player.face*distance;let best=Infinity,x=null;for(const [a,w] of rooms[room].ground){if(w<width+32)continue;const candidate=Math.max(a+16,Math.min(a+w-width-16,desired)),d=Math.abs(candidate-desired);if(d<best){best=d;x=candidate;}}return x??Math.max(20,Math.min(rooms[room].width-width-20,desired));}
function developerSummonNPC(role){if(!dev.enabled)return false;const n=devNPCs.find(n=>n.role===role);if(!n)return false;dev.npcs.push({...n,x:developerSpawnX(30,130)+15});devMessage('已召唤 '+n.name+' · 靠近后按 E 交谈。');return true;}
function developerSummonMonster(species){if(!dev.enabled||!creatureBook[species])return false;const d=creatureBook[species],source=rooms.flatMap(r=>r.enemies).find(a=>a[4]===species),hp=source?.[3]||3,x=developerSpawnX(),y=d.air?Math.max(130,Math.min(380,player.y-110)):GROUND-32;
 const e={type:d.air?'flyer':'walker',x,y,origin:x,baseY:d.air?y:GROUND,w:34,h:32,hp,max:hp,vx:0,vy:0,dir:player.x>x?1:-1,t:0,hit:0,lastAttack:-1,rewarded:false,devSummoned:true};initCreature(e,species);enemies.push(e);devMessage('已召唤 '+d.name+'。');return true;
}
function developerSummonBoss(kind,phase='1'){if(!dev.enabled)return false;const d=devBosses.find(b=>b.kind===kind);if(!d)return false;
 shots=[];hazards=[];creatureHazards=[];thornRoots=[];thornPoison=null;thornPetals=[];bossDeathPending=null;deathBodies=deathBodies.filter(b=>!b.isBoss);arenaState=null;
 const b={kind,name:d.name,x:developerSpawnX(84,300),y:GROUND-90,w:84,h:90,hp:d.hp,max:d.hp,t:0,phase:'wake',timer:1.2,dir:player.face*-1,vx:0,vy:0,hit:0,lastAttack:-1,turn:0,targetX:player.x+13,targetY:player.y+23,phaseTwo:false,devSummoned:true,visualAccent:d.accent};
 if(kind==='forge'){initForgeWitch(b);b.phase='witchWake';b.timer=1.2;if(phase==='2'){b.witchStage=2;b.phaseTwo=true;b.hp=FORGE_HALF;b.phase='witchFlare';b.timer=.8;}}
 if(kind==='thorn'){initThornBoss(b);b.phase='vineWake';b.timer=1.2;if(phase==='2'){b.thornStage=2;b.phaseTwo=true;b.hp=THORN_HALF;b.w=170;b.h=148;b.y=GROUND-b.h;b.phase='flowerBloom';b.timer=1;}}
 b.x=developerSpawnX(b.w,300);b.dir=player.x+13>b.x+b.w/2?1:-1;b.mouthAngle=Math.atan2(player.y+23-(b.y+48),player.x+13-(b.x+b.w/2));boss=b;if(kind==='forge')makeForgeFurnace(developerSpawnX(130,150)+65,phase!=='2');else{forgeFurnace=null;forgeRainMarks=[];forgeBeams=[];}player.dead=0;player.hp=maxHP();player.inv=1;player.attack=player.cast=0;
 if(kind==='thorn')thornSound(phase==='2'?'flowerBloom':'vineWake');else soundBoss(kind,'wake','warn');
 devMessage('已召唤 '+d.name+(kind==='thorn'?(phase==='2'?' · 食人花阶段':' · 巨藤阶段'):'')+'。');return true;
}
const developerWin=win;win=function(){if(!dev.enabled||!boss?.devSummoned){developerWin();return;}const b=boss;beginCreatureDeath(b,true);boss=null;bossDeathPending=null;shots=[];hazards=[];creatureHazards=[];thornRoots=[];thornPoison=null;mode='playing';player.hp=maxHP();toast('试验战斗结束 · '+b.name+'，可以再次召唤。',4);devMessage(b.name+' 已倒下，正式旅程未改变。');};
function developerClearActors(){if(!dev.enabled)return;enemies=[];boss=null;dev.npcs=[];shots=[];hazards=[];creatureHazards=[];deathBodies=[];bossDeathPending=null;thornRoots=[];thornPoison=null;thornPetals=[];combatFlourishes=[];arenaState=null;encounterState=null;echoAttacks=[];forgeFurnace=null;forgeRainMarks=[];forgeBeams=[];forgeEmbers=[];darkSwordCuts=[];inheritanceBursts=[];phaseCrossings=new Set();saved.mechanisms.forgeRemainsHidden=true;devMessage('已清除当前房间的敌人、召唤的 NPC 与攻击效果。');}
function developerTeleport(id,x,y){if(!dev.enabled||!Number.isInteger(id)||!rooms[id]||!Number.isFinite(x)||!Number.isFinite(y))return false;if(dev.panelOpen)closeDeveloperPanel();mode='playing';devNode('overlay').classList.add('hidden');enterRoom(id);
 player.x=Math.max(16,Math.min(rooms[id].width-player.w-16,x));player.y=Math.max(12,Math.min(H-player.h-20,y));if(!dev.flying&&rooms[id].ground.some(([a,w])=>player.x+player.w>a&&player.x<a+w))player.y=Math.min(player.y,GROUND-player.h);player.vx=player.vy=player.dashTime=0;player.attack=player.cast=player.jumpBuffer=0;player.dead=0;player.inv=1;player.onGround=false;player.slam=false;keys.clear();camera=Math.max(0,Math.min(rooms[id].width-W,player.x-W*.44));canvas.focus();dev.mapPointer=null;const message='开发者传送 · '+rooms[id].name+' ('+Math.round(player.x)+', '+Math.round(player.y)+')';devMessage(message);toast(message,3);return true;
}
const developerInteract=interact;interact=function(){if(dev.enabled&&mode==='playing'){const n=dev.npcs.find(n=>Math.abs(player.x+13-n.x)<80&&Math.abs(player.y+player.h-GROUND)<65);if(n){const r=rooms[room],chapter=r.chapter;r.chapter=n.chapter;try{speak(n);}finally{r.chapter=chapter;}return;}}developerInteract();};
const developerDrawBoss=drawBoss;drawBoss=function(b){if(!b.visualAccent){developerDrawBoss(b);return;}const r=rooms[room],accent=r.accent;r.accent=b.visualAccent;try{developerDrawBoss(b);}finally{r.accent=accent;}};
const developerTerrain=terrain;terrain=function(){developerTerrain();if(dev.enabled)for(const n of dev.npcs)drawArtNPC(n,{accent:chapters[n.chapter].accent});};
const developerHUD=hud;hud=function(){developerHUD();if(dev.enabled)text('开发者模式'+(dev.invincible?' · 无敌':'')+(dev.flying?' · 飞行':'')+' · F2 面板 · M 右键传送',W/2,28,12,'#e6cf95','center');};
const developerUpdate=update;update=function(dt){if(dev.enabled&&dev.invincible){player.hp=maxHP();player.dead=0;thornPoison=null;}developerUpdate(dt);};
const developerRender=render;render=function(){developerRender();if(dev.enabled&&mode==='map')devNode('campaign-actions').hidden=true;};
const developerMenuKey=handleMenuKey;handleMenuKey=function(e){if(e.code==='F2'){e.preventDefault();if(!e.repeat)openDeveloperPanel();return true;}if(dev.panelOpen){if(e.code==='Escape'){e.preventDefault();closeDeveloperPanel();}return true;}
 if(dev.enabled&&mode==='map'&&e.code==='Escape'){e.preventDefault();mode='playing';keys.clear();canvas.focus();return true;}
 if(dev.enabled&&developerFlying()&&['Space','KeyV','ShiftLeft','ShiftRight'].includes(e.code)&&mode==='playing'){e.preventDefault();if(e.code!=='KeyV')keys.add(e.code);return true;}
 if(dev.enabled&&mode==='playing'&&/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||''))return true;return developerMenuKey(e);
};
function developerMapCell(id){const r=rooms[id];return {x:155+r.mapX*98,y:120+r.mapY*65,w:r.optional?56:90,h:r.optional?19:26};}
const devMapPreview={x:70,y:535,w:1060,h:85};
function developerMapTarget(x,y){const p=devMapPreview;if(x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h)return {id:mapSelection,x:(x-p.x)/p.w*rooms[mapSelection].width,y:(y-p.y)/p.h*H};
 const id=rooms.findIndex((r,i)=>{const c=developerMapCell(i);return x>=c.x&&x<=c.x+c.w&&y>=c.y&&y<=c.y+c.h;});if(id<0)return null;const c=developerMapCell(id);return {id,x:(x-c.x)/c.w*rooms[id].width,y:(y-c.y)/c.h*(GROUND-player.h)};
}
const developerMapOverlay=mapOverlay;mapOverlay=function(){if(!dev.enabled){developerMapOverlay();return;}ctx.fillStyle='#081923f7';ctx.fillRect(0,0,W,H);text('开发者地图 · 全部房间',W/2,47,25,'#e1d3ad','center','serif');text('右键房间任意位置传送 · 左键选中房间后，可右键下方缩略图精确定位 · M / ESC 返回',W/2,77,11,'#b9c7b3','center');
 for(let ch=0;ch<=5;ch++)text(chapters[ch].name,42,137+ch*65,10,chapters[ch].accent);
 for(let i=0;i<rooms.length;i++){const r=rooms[i],c=developerMapCell(i);ctx.fillStyle=i===room?'#6e6041':i===mapSelection?'#37554b':'#233c40';ctx.fillRect(c.x,c.y,c.w,c.h);ctx.strokeStyle=i===mapSelection?'#e5cc92':r.accent+'88';ctx.lineWidth=i===mapSelection?2:1;ctx.strokeRect(c.x,c.y,c.w,c.h);text(r.name,c.x+c.w/2,c.y+c.h*.73,r.optional?7:9,'#cfdbc2','center');if(r.bossId)text('◇',c.x+c.w-6,c.y-4,10,r.accent);}
 const r=rooms[mapSelection],p=devMapPreview,sx=x=>p.x+x/r.width*p.w,sy=y=>p.y+y/H*p.h;text(r.name+' · 缩略图内右键 = 对应房间坐标',p.x,520,12,'#ddcda6');ctx.fillStyle='#132d32';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.strokeStyle='#697d6d';ctx.strokeRect(p.x,p.y,p.w,p.h);
 for(const [x,w] of r.ground){ctx.fillStyle='#55765b';ctx.fillRect(sx(x),sy(GROUND),w/r.width*p.w,p.h-(GROUND/H*p.h));}for(const [x,y,w] of r.platforms)line(sx(x),sy(y),sx(x+w),sy(y),'#a8bd91',2);
 if(r.lamp)ellipse(sx(r.lamp),sy(510),3,3,'#efd29a');if(r.npc)ellipse(sx(r.npc.x),sy(510),3,3,'#96cde3');if(r.bossId)text('◇',sx(r.width*.5),sy(420),13,'#deb093','center');
 if(mapSelection===room)ellipse(sx(player.x+13),sy(player.y+23),3,3,'#fff1c7');if(dev.mapPointer?.id===mapSelection){const m=dev.mapPointer,x=sx(m.x),y=sy(m.y);line(x-7,y,x+7,y,'#f7d59b',1);line(x,y-7,x,y+7,'#f7d59b',1);text(Math.round(m.x)+', '+Math.round(m.y),p.x+p.w,520,11,'#dfcd9e','right');}
 text('开发者传送不需要解锁区域或靠近灯台；关闭模式后回到原旅程。',W/2,641,10,'#95ad9c','center');
};
function developerCanvasPoint(e){const b=canvas.getBoundingClientRect();return {x:(e.clientX-b.left)*W/b.width,y:(e.clientY-b.top)*H/b.height};}
function developerMapContext(e){if(!dev.enabled||mode!=='map')return false;e.preventDefault();const p=developerCanvasPoint(e),target=developerMapTarget(p.x,p.y);if(target)return developerTeleport(target.id,target.x,target.y);toast('右键房间方格传送，或选中房间后右键下方缩略图。',3);return false;}
canvas.addEventListener('contextmenu',developerMapContext);canvas.addEventListener('pointermove',e=>{if(dev.enabled&&mode==='map'){const p=developerCanvasPoint(e);dev.mapPointer=developerMapTarget(p.x,p.y);}});
const options=(items,key,label)=>items.map(x=>'<option value="'+x[key]+'">'+x[label]+'</option>').join('');
devNode('dev-npc').innerHTML=options(devNPCs,'role','name');devNode('dev-npc').value=devNPCs[0].role;
devNode('dev-boss').innerHTML=options(devBosses,'kind','name');devNode('dev-boss').value='keeper';
devNode('dev-monster').innerHTML=Object.entries(creatureBook).map(([key,d])=>'<option value="'+key+'">'+d.name+'</option>').join('');devNode('dev-monster').value='shellbeetle';
devNode('dev-boss-phase').value='1';devNode('dev-panel-button').onclick=openDeveloperPanel;devNode('dev-menu-entry').onclick=openDeveloperPanel;devNode('dev-close').onclick=closeDeveloperPanel;
devNode('dev-enabled').onchange=e=>{if(e.target.checked)enableDeveloper();else disableDeveloper(true);};
devNode('dev-invincible').onchange=e=>setDeveloperInvincible(e.target.checked);devNode('dev-flight').onchange=e=>setDeveloperFlight(e.target.checked);devNode('dev-boss').onchange=refreshDeveloperPanel;
devNode('dev-spawn-npc').onclick=()=>developerSummonNPC(devNode('dev-npc').value);devNode('dev-spawn-monster').onclick=()=>developerSummonMonster(devNode('dev-monster').value);devNode('dev-spawn-boss').onclick=()=>developerSummonBoss(devNode('dev-boss').value,devNode('dev-boss-phase').value);
devNode('dev-clear').onclick=developerClearActors;devNode('dev-heal').onclick=()=>{if(!dev.enabled)return;player.hp=maxHP();player.soul=99;player.dead=0;thornPoison=null;devMessage('生命与余烬已恢复。');};
devNode('dev-map').onclick=()=>{if(!dev.enabled)return;dev.returnMode='playing';dev.returnOverlayHidden=true;closeDeveloperPanel();mode='playing';toggleMap();};refreshDeveloperPanel();

devNode('dev-encounter').onclick=()=>{if(!dev.enabled||!rooms[room].encounter)return;developerClearActors();saved.quests=saved.quests.filter(q=>q!=='encounter-'+room);encounterState={room,wave:0,wait:0,started:false,left:360,right:rooms[room].width-270};spawnEncounterWave();devMessage('已触发当前房间的遭遇战，可关闭面板开始测试。');};

function developerClearForgeRemains(){if(!dev.enabled)return false;deathBodies=deathBodies.filter(b=>b.kind!=='forgeKneel');saved.mechanisms.forgeRemainsHidden=true;devMessage('已清除司祭遗体。关闭开发者模式后仍会恢复正式旅程中的遗体。');return true;}
devNode('dev-clear-forge').onclick=developerClearForgeRemains;

;
'use strict';
const bossInheritance=[
 {boss:'keeper',flag:'bolt',name:'守门者的余烬',effect:'获得普通冲刺与单发余烬弹。普通冲刺撞到敌人会受伤并弹开。'},
 {boss:'thorn',flag:'poisonBolt',name:'荆毒余烬',effect:'余烬弹使目标中毒：每秒 0.5 伤害，持续 5 秒；再次命中刷新，不叠加。另保留枝羽之翼用于探索。'},
 {boss:'forge',flag:'emberBolt',name:'熔火余烬',effect:'余烬弹速度由 720 提高至 1200，直接命中伤害翻倍；毒效保留。另保留坠星破印用于探索。'},
 {boss:'mirror',flag:'phaseDash',name:'镜行冲刺',effect:'冲刺时间由 0.19 增至 0.32 秒，距离加长；可穿过敌人与 Boss，冲刺期间无敌。'},
 {boss:'bell',flag:'bellRevive',name:'回生钟誓',effect:'获得一次原地复活：满生命、满余烬、清除中毒、重置全部技能冷却与空中次数，1 秒无敌。消耗后休憩不会补回。'},
 {boss:'heart',flag:'darkSword',name:'无光之剑',effect:'近战变为 100 点伤害的无光斩，自动朝屏幕内最近的敌人斩出，半屏距离、无视地形；无目标时按人物朝向挥斩；按住挥刀键可每秒连续挥斩。'}
];
let darkSwordCuts=[],inheritanceBursts=[],phaseCrossings=new Set();
function synchronizeInheritance(p){const owned=new Set(Array.isArray(p.bosses)?p.bosses:[]);p.dash=p.bolt=owned.has('keeper');for(const reward of bossInheritance.slice(1))p[reward.flag]=owned.has(reward.boss);if(owned.has('thorn'))p.doubleJump=true;if(owned.has('forge'))p.slam=true;p.reviveSpent=owned.has('bell')&&!!p.reviveSpent;p.inheritanceVersion=1;return p;}
const inheritanceFresh=freshProgress;freshProgress=function(){return {...inheritanceFresh(),dash:false,bolt:false,poisonBolt:false,emberBolt:false,bellRevive:false,reviveSpent:false,darkSword:false,inheritanceVersion:1};};
const inheritanceNormalize=normalizedProgress;normalizedProgress=function(raw){if(!raw||typeof raw!=='object'||Array.isArray(raw))return null;const input=synchronizeInheritance({...raw});const p=inheritanceNormalize(input);return p?synchronizeInheritance(p):null;};
synchronizeInheritance(saved);
abilities.dash=['守门者冲刺','击败守门者解锁；普通冲刺不能穿怪或免伤'];abilities.poisonBolt=['荆毒余烬','击败荆冠寄主，弹丸附带每秒 0.5 伤害的毒效'];abilities.emberBolt=['熔火余烬','击败熔炉司祭，弹丸加速，直接伤害翻倍'];abilities.bellRevive=['回生钟誓','击败深渊钟守，一次满状态原地复活'];abilities.darkSword=['无光之剑','击败无光之王，自动瞄准最近敌人 / 100 伤害 / 半屏 / 每秒一斩'];
delete rooms[3].gate;delete rooms[2].relic;rooms[2].note={x:1030,text:'风眠圣所的刻痕：风与余烬被封存在西侧守门者的刃中。\n旅人最初只带着一柄旧刃。向西越过封缄桥，击败守门者后再归来。'};
storyNotes[0]='守灯人：你尚未继承任何力量。西侧守门者封存着冲刺与余烬弹。用跳跃越过封缄桥，击败它后，再去荆棘林寻找下一段归途。';
const inheritanceGoal=chapterGoal;chapterGoal=function(){return !saved.bosses.includes('keeper')?'序章：向西穿越封缄桥，击败守门者，继承冲刺与余烬弹':inheritanceGoal();};objective=chapterGoal;
onBossReward=function(id){synchronizeInheritance(saved);const reward=bossInheritance.find(r=>r.boss===id);if(!reward)return;const details=reward.effect+(id==='keeper'?'\n按 '+bindingLabel('dash')+' 冲刺；按 '+bindingLabel('bolt')+' 向前发射一颗余烬弹，空中也可使用。':'');if(id==='heart'){rewardCard.title='获得「无光之剑」 · 井心的抉择';rewardCard.body=details+'\n\n'+rewardCard.body;}else showCard('继承「'+reward.name+'」',details+(id==='bell'?'\n第四枚灯芯也已归来。':''));inheritanceBursts.push({x:player.x+13,y:player.y+23,age:0,life:1.2,kind:'inherit',color:id==='heart'?'#d4c8ff':'#c5ddeb'});updateLabels();};
function isDarkSwordActive(){return !!saved.darkSword;}
isDashInvulnerable=function(){return !!saved.phaseDash&&player.dashTime>0;};
const inheritanceDamage=meleeDamage;meleeDamage=function(){return saved.darkSword?100:inheritanceDamage();};
// Freeze the origin and direction for each swing; reacquire on the next attack.
function darkSwordTarget(){
 const visible={x:camera,y:0,w:W,h:H},x=player.x+13,y=player.y+23;
 const candidates=[...enemies.filter(e=>e.hp>0&&enemyCanBeHit(e)),...(boss&&boss.hp>0&&bossCanBeHit(boss)?[boss]:[])];
 let target=null,nearest=Infinity;
 for(const e of candidates){if(!overlap(visible,e))continue;const distance=(e.x+e.w/2-x)**2+(e.y+e.h/2-y)**2;if(distance<nearest){nearest=distance;target=e;}}
 return target;
}
function activeDarkSwordCut(){return darkSwordCuts.find(c=>c.id===attackId);}
function darkSwordCorners(c){const n={x:-c.uy,y:c.ux};return [[0,-118],[W/2,-118],[W/2,117],[0,117]].map(([u,v])=>({x:c.x+c.ux*u+n.x*v,y:c.y+c.uy*u+n.y*v}));}
const inheritanceHitbox=meleeHitbox;meleeHitbox=function(){
 if(!saved.darkSword)return inheritanceHitbox();const c=activeDarkSwordCut();if(!c)return {x:player.x+13,y:player.y+23,w:0,h:0};
 const corners=darkSwordCorners(c),xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
};
const inheritanceMeleeHits=meleeHitsTarget;meleeHitsTarget=function(target,blade){
 if(!saved.darkSword)return inheritanceMeleeHits(target,blade);const c=activeDarkSwordCut();if(!c||!overlap(blade,target))return false;
 const wave=darkSwordCorners(c),body=[{x:target.x,y:target.y},{x:target.x+target.w,y:target.y},{x:target.x+target.w,y:target.y+target.h},{x:target.x,y:target.y+target.h}];
 // Separating axes keep diagonal attacks from damaging empty bounding-box corners.
 for(const [x,y]of [[1,0],[0,1],[c.ux,c.uy],[-c.uy,c.ux]]){const a=wave.map(p=>p.x*x+p.y*y),b=body.map(p=>p.x*x+p.y*y);if(Math.max(...a)<Math.min(...b)||Math.max(...b)<Math.min(...a))return false;}
 return true;
};
const inheritanceKnockbackX=meleeKnockbackX;meleeKnockbackX=function(){const c=activeDarkSwordCut();return saved.darkSword&&c?c.ux:inheritanceKnockbackX();};
playerBoltDamage=function(s){return s.damage??((2+(saved.blade||0))*(saved.emberBolt?2:1));};
const inheritanceBolt=fireBolt;fireBolt=function(){const count=shots.length;inheritanceBolt();if(shots.length<=count)return;for(const s of shots.slice(count))if(s.owner==='player'){s.damage=(2+(saved.blade||0))*(saved.emberBolt?2:1);s.poison=!!saved.poisonBolt;s.ember=!!saved.emberBolt;if(s.ember)s.vx=Math.sign(s.vx)*1200;s.color=s.ember?'#8fdfff':s.poison?'#b9dd78':'#efd3a0';}};
onPlayerBoltHit=function(target,shot){if(!shot.poison||target.hp<=0)return;target.emberPoison={ticksLeft:5,next:1};spawn(target.x+target.w/2,target.y+target.h/2,9,'#afd878',65);};
const inheritanceDash=dash;dash=function(){if(!saved.dash&&mode==='playing'){toast('尚未获得冲刺。击败西侧的守门者后解锁。',3);return;}const before=player.dashCD;inheritanceDash();if(player.dashCD>before){phaseCrossings=new Set();if(saved.phaseDash){player.dashTime=.32;inheritanceBursts.push({x:player.x+13,y:player.y+23,age:0,life:.4,kind:'mirror',color:'#c1c1ff'});}}};
function inheritanceActors(){return [...enemies.filter(e=>e.hp>0&&enemyCanBeHit(e)),...(boss&&boss.hp>0&&!['sleep','dying'].includes(boss.phase)&&bossContactDamage(boss)>0?[boss]:[])];}
resolveActorDash=function(oldX,oldY){if(player.dashTime<=0||developerFlying())return;const a={x:oldX+13,y:oldY+23},b={x:player.x+13,y:player.y+23};const actors=inheritanceActors().filter(e=>forgeSegmentHitsRect(a,b,{x:e.x-13,y:e.y-23,w:e.w+26,h:e.h+46})).sort((e,f)=>Math.abs(e.x-oldX)-Math.abs(f.x-oldX));if(saved.phaseDash){for(const e of actors)if(!phaseCrossings.has(e)){phaseCrossings.add(e);flourish(e.x+e.w/2,e.y+e.h/2,'burst','#bcb8ff',.35);}return;}const e=actors[0];if(!e)return;const movingRight=player.face>0;player.x=movingRight?Math.min(player.x,e.x-player.w-2):Math.max(player.x,e.x+e.w+2);player.dashTime=0;harm(boss===e?Math.max(1,bossContactDamage(e)):1,e.x+e.w/2);player.vx=movingRight?-330:330;player.vy=-270;player.onGround=false;flourish(player.x+13,player.y+23,'impact','#e3bc9d',.4);};
function bellReviveAvailable(){return !!saved.bellRevive&&!saved.reviveSpent;}
function tryBellRevive(){if(player.hp>0||!bellReviveAvailable()||mode!=='playing'||dev.enabled&&dev.invincible)return false;saved.reviveSpent=true;saved.deaths++;player.hp=maxHP();player.soul=99;player.dead=0;player.inv=1;player.vx=player.vy=0;player.attack=player.attackCD=player.cast=player.castCD=player.dashTime=player.dashCD=player.jumpBuffer=0;player.airDash=player.airJumped=player.slam=false;healTime=0;supplyCooldown=0;thornPoison=null;keys.clear();inheritanceBursts.push({x:player.x+13,y:player.y+23,age:0,life:1.2,kind:'revive',color:'#e7d6a1'});spawn(player.x+13,player.y+23,65,'#e4d5b1',250);flash=.2;shake=10;soundBoss('bell','phaseTwo','release');persist();toast('回生钟誓已消耗 · 满生命、满余烬，1 秒无敌。',5);return true;}
const inheritanceHarm=harm;harm=function(n,x){if(player.dashTime>0&&!saved.phaseDash&&player.inv<=0&&player.dead<=0)player.dashTime=0;inheritanceHarm(n,x);tryBellRevive();};
const inheritancePoisonTick=poisonTick;poisonTick=function(){inheritancePoisonTick();tryBellRevive();};
const inheritanceSoundPlan=bossSoundPlan;bossSoundPlan=function(kind,phase,stage){if(phase!=='voidCut')return inheritanceSoundPlan(kind,phase,stage);return {notes:[{f:65,end:28,wave:'sawtooth',delay:0,duration:.48,gain:.06},{f:760,end:110,wave:'triangle',delay:.025,duration:.35,gain:.035}],noise:{filter:'highpass',frequency:1700,duration:.34,gain:.045}};};
const inheritanceAttack=attack;attack=function(){if(!saved.darkSword){inheritanceAttack();return;}if(mode!=='playing'||player.dead>0||player.attackCD>0||player.dashTime>0)return;player.attackDir='forward';player.attack=.26;player.attackCD=1;player.slam=false;healTime=0;attackId++;const x=player.x+13,y=player.y+23,target=darkSwordTarget(),angle=target?Math.atan2(target.y+target.h/2-y,target.x+target.w/2-x):player.face>0?0:Math.PI,ux=Math.cos(angle),uy=Math.sin(angle);darkSwordCuts.push({x,y,angle,ux,uy,age:0,life:.55,id:attackId});spawn(x+ux*160,y+uy*160,34,'#b9c8ff',250);shake=10;flash=.08;soundBoss('heart','voidCut','release');};
onMeleeImpact=function(target,amount){if(!saved.darkSword)return;inheritanceBursts.push({x:target.x+target.w/2,y:target.y+target.h/2,age:0,life:.48,kind:'swordHit',color:'#d5deff'});};
function tickEmberPoison(target,dt,isBoss){const p=target.emberPoison;if(!p||target.hp<=0){delete target.emberPoison;return;}p.next-=dt;while(p.next<=1e-8&&p.ticksLeft>0&&target.hp>0){p.next+=1;p.ticksLeft--;if(isBoss&&!bossCanBeHit(target))continue;target.hp=Math.max(0,target.hp-.5);target.hit=.12;spawn(target.x+target.w/2,target.y+target.h/2,5,'#b7da77',60);if(isBoss){onBossDamaged(target);if(target.hp<=0)win();}else if(target.hp<=0){if(!target.rewarded){target.rewarded=true;saved.kills++;saved.coins+=12+rooms[room].chapter*4;persist();}beginCreatureDeath(target);}}if(p.ticksLeft===0||target.hp<=0)delete target.emberPoison;}
const inheritancePrepare=prepareCampaignEncounters;prepareCampaignEncounters=function(id){inheritancePrepare(id);darkSwordCuts=[];inheritanceBursts=[];phaseCrossings=new Set();};
const inheritanceClear=clearJourneyRuntime;clearJourneyRuntime=function(){inheritanceClear();darkSwordCuts=[];inheritanceBursts=[];phaseCrossings=new Set();};
const inheritanceUpdate=update;update=function(dt){const active=['playing','resting','bossDying'].includes(mode),beforeRoom=room;if(mode==='playing'&&player.dead<=0&&saved.darkSword&&(keys.has('KeyJ')||keys.has('KeyZ'))&&player.attackCD<=0)attack();inheritanceUpdate(dt);if(!active||room!==beforeRoom)return;for(const c of darkSwordCuts)c.age+=dt;darkSwordCuts=darkSwordCuts.filter(c=>c.age<c.life);for(const f of inheritanceBursts)f.age+=dt;inheritanceBursts=inheritanceBursts.filter(f=>f.age<f.life);if(mode!=='playing'||player.dead>0)return;for(const e of enemies)tickEmberPoison(e,dt,false);if(boss)tickEmberPoison(boss,dt,true);};
function drawDarkSwordCut(c){
 const p=Math.min(1,c.age/c.life),r=W/2,alpha=Math.max(0,1-p)**.7;
 ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.angle);ctx.globalAlpha=alpha;
 glow(r*.58,-36,165,'#acb6ff33');runeRing(0,0,20+p*70,'#bcc6ff77',p);
 // A curved dark blade cuts between several luminous wavefronts.
 for(let band=3;band>=0;band--){const spread=band*10;ctx.beginPath();ctx.moveTo(0,5);ctx.bezierCurveTo(r*.23,-40-spread,r*.7,-155-spread,r,-9);ctx.bezierCurveTo(r*.75,-73+spread,r*.3,54+spread,0,16);ctx.closePath();ctx.fillStyle=band===0?'#070e25':band===1?'#e3eaffdd':band===2?'#919cff99':'#6c75d733';ctx.fill();}
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor='#a7cfff';ctx.shadowBlur=20;
 for(const [width,color]of [[16,'#7379dd55'],[6,'#c4d7ffbb'],[2,'#ffffff']]){ctx.beginPath();ctx.moveTo(4,5);ctx.bezierCurveTo(r*.25,-40,r*.73,-145,r,-9);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
 ctx.shadowBlur=0;ctx.beginPath();ctx.moveTo(10,15);ctx.bezierCurveTo(r*.4,48,r*.78,-38,r,-9);ctx.strokeStyle='#b2baff';ctx.lineWidth=2;ctx.stroke();ctx.restore();
 for(let i=0;i<19;i++){const u=(i+.5)/19,x=20+u*(r-20),y=-Math.sin(u*Math.PI)*62+(i%2?-1:1)*(18+(i%4)*14)*(1+p*.7);ctx.save();ctx.translate(x,y);ctx.rotate(-.45+(i%4)*.3);path([[-10-i%4,0],[9+(i%3)*10,-3],[3,3]],i%3?'#c5d9ff':'#f4efff');ctx.restore();if(i%3===0)path([[x-12,y-25],[x+6,y-7],[x-1,y+9],[x+19,y+30]],'#a9aaff88',false);}
 for(let i=0;i<5;i++)line(15+i*62,-16-i*10,120+i*90,-44-i*11,'#d7e8ff66',1.2);
 ctx.restore();
}
const inheritanceDrawPlayer=drawPlayer;drawPlayer=function(x,y,face,alpha=1){inheritanceDrawPlayer(x,y,face,alpha);if(!saved.darkSword)return;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+13,y+25);ctx.scale(face,1);ctx.rotate(player.attack>0?-.7+(1-player.attack/.26)*1.3:-.7);line(9,8,22,8,'#c0a9ed',4);line(22,-1,22,17,'#d8d5fc',3);path([[23,3],[65,1],[81,8],[65,15],[23,13]],'#0c142b');line(26,3,66,2,'#cadbff',2);line(26,13,66,14,'#878bdb',2);glow(66,7,25,'#9bbcff22');ctx.restore();};
const inheritanceShotDraw=drawSpecialShot;drawSpecialShot=function(s){if(s.owner!=='player'||!s.poison&&!s.ember)return inheritanceShotDraw(s);const c=s.ember?'#8edaff':'#b9dc7b',a=Math.atan2(s.vy,s.vx);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(a);glow(0,0,s.ember?45:31,c+'44');path([[-54,-4],[-14,-10],[8,-8],[19,0],[8,8],[-14,10],[-54,4],[-26,0]],c);ellipse(5,0,8,5,'#eff8e6');if(s.poison)for(let i=0;i<4;i++)ellipse(-20-i*11,Math.sin(time*14+i)*6,2.5,2.5,'#c1e68c');if(s.ember)runeRing(0,0,14,'#a5dfffa1',time*5);ctx.restore();return true;};
const inheritanceRender=render;render=function(){inheritanceRender();if(mode==='journal'){document.getElementById('campaign-card-title').textContent='旅人札记 · Boss 继承';document.getElementById('campaign-card-body').textContent=chapterGoal()+'\n\n'+bossInheritance.map(r=>(saved[r.flag]?'✓ ':'◇ ')+r.name+(r.flag==='bellRevive'&&saved[r.flag]?(saved.reviveSpent?' · 已消耗':' · 剩余 1 次'):'')+'\n'+(saved[r.flag]?r.effect:'击败'+(rooms.find(x=>x.bossId===r.boss)?.bossName||r.boss)+'后获得')).join('\n\n')+'\n\n探索 '+saved.visited.length+'/'+rooms.length+' · 记忆 '+saved.memories.length+'/8 · 光屑 '+saved.coins;return;}if(!['playing','resting','bossDying'].includes(mode))return;ctx.save();ctx.translate(-camera,0);for(const c of darkSwordCuts)drawDarkSwordCut(c);for(const f of inheritanceBursts){const p=f.age/f.life;ctx.save();ctx.globalAlpha=1-p;runeRing(f.x,f.y,22+p*(f.kind==='revive'?130:f.kind==='swordHit'?35:65),f.color,p);if(f.kind==='swordHit')text('100',f.x,f.y-18-p*35,23,'#f4f2ff','center','serif');for(let i=0;i<9;i++){const a=i*Math.PI*2/9+p*.6;line(f.x+Math.cos(a)*20,f.y+Math.sin(a)*20,f.x+Math.cos(a)*(40+p*130),f.y+Math.sin(a)*(40+p*130),f.color,2);}ctx.restore();}for(const target of [...enemies,...(boss?[boss]:[])])if(target.emberPoison&&target.hp>0){const x=target.x+target.w/2,y=target.y;glow(x,y+target.h/2,36,'#afd77922');text('毒 · 0.5 / 秒',x,y-17,10,'#c6df95','center');for(let i=0;i<3;i++)ellipse(x+Math.sin(time*4+i)*15,y+target.h-(time*22+i*9)%target.h,2,3,'#bbda7e');}ctx.restore();};
const inheritanceHUD=hud;hud=function(){inheritanceHUD();for(let i=0;i<bossInheritance.length;i++){const r=bossInheritance[i],x=30+i*49,owned=!!saved[r.flag],spent=r.flag==='bellRevive'&&saved.reviveSpent;ctx.fillStyle=owned?'#203344c9':'#0c1822aa';ctx.fillRect(x,605,44,26);ctx.strokeStyle=spent?'#7d685b':owned?'#a3b5cf':'#3a4e53';ctx.strokeRect(x,605,44,26);text(['守门','荆毒','炉焰','镜行',spent?'已耗':'回生','无光'][i],x+22,622,10,spent?'#8e8176':owned?'#d5dfed':'#52686c','center');}};
drawJournal=function(){ctx.fillStyle='#09151bf5';ctx.fillRect(0,0,W,H);text('旅人札记 · Boss 继承',W/2,56,25,'#ddd9bd','center','serif');text(chapterGoal(),65,97,13,'#e3cca0');for(let i=0;i<bossInheritance.length;i++){const r=bossInheritance[i],owned=!!saved[r.flag],y=146+i*61;const hint=r.effect.split('另保留')[0];text((owned?'✓ ':'◇ ')+r.name+(r.flag==='bellRevive'&&owned?(saved.reviveSpent?' · 已消耗':' · 剩余 1 次'):''),65,y,14,owned?'#d4dfc7':'#687f79');wrapText(owned?hint:'击败'+(rooms.find(x=>x.bossId===r.boss)?.bossName||r.boss)+'后获得',320,y,800,11,owned?'#adc2c0':'#687f79',18);}text('探索能力：二段跳 '+(saved.doubleJump?'已获得':'未获得')+' · 破印 '+(saved.slam?'已获得':'未获得')+' · 光屑 '+saved.coins+' · 生命上限 '+maxHP(),65,541,12,'#bbc9bb');text('记忆 '+saved.memories.length+'/8 · Boss '+saved.bosses.length+'/6 · 探索 '+saved.visited.length+'/'+rooms.length+' · 挥刀 '+bindingLabel('attack')+' / 余烬弹 '+bindingLabel('bolt'),65,565,12,'#a5b9b4');text(bindingLabel('journal')+' / ESC 返回',W/2,612,12,'#d1c59f','center');};
function developerInheritancePreset(level){if(!dev.enabled)return false;level=Math.max(0,Math.min(6,Number(level)||0));saved.bosses=bossInheritance.slice(0,level).map(r=>r.boss);saved.doubleJump=level>=2;saved.slam=level>=3;saved.reviveSpent=false;synchronizeInheritance(saved);player.attack=player.attackCD=player.cast=player.castCD=player.dashTime=player.dashCD=0;player.hp=maxHP();player.soul=99;thornPoison=null;keys.clear();syncBossLamps();updateLabels();devMessage('试验继承：'+(level?bossInheritance[level-1].name:'原始旅人，无继承能力')+'。正式存档未改变。');return true;}
const inheritanceDeveloperEnable=enableDeveloper;enableDeveloper=function(){const was=dev.enabled;inheritanceDeveloperEnable();if(!was&&dev.enabled){saved.reviveSpent=false;devNode('dev-inheritance').value='6';}};
const inheritanceDeveloperRefresh=refreshDeveloperPanel;refreshDeveloperPanel=function(){inheritanceDeveloperRefresh();for(const id of ['dev-inheritance','dev-apply-inheritance'])devNode(id).disabled=!dev.enabled;};
devNode('dev-inheritance').innerHTML='<option value="0">原始旅人 · 无技能</option>'+bossInheritance.map((r,i)=>'<option value="'+(i+1)+'">'+(i+1)+' · '+r.name+'</option>').join('');devNode('dev-inheritance').value='6';devNode('dev-apply-inheritance').onclick=()=>developerInheritancePreset(devNode('dev-inheritance').value);refreshDeveloperPanel();updateLabels();refreshMenu();

;
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

;
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

;
'use strict';
const CONTROL_KEY='emberwell-controls-v1';
const controlActions={left:['向左','KeyA','ArrowLeft',['ArrowLeft']],right:['向右','KeyD','ArrowRight',['ArrowRight']],up:['向上 / 上劈','KeyW','ArrowUp',['ArrowUp']],down:['向下 / 下劈','KeyS','ArrowDown',['ArrowDown']],jump:['跳跃','Space','Space',[]],attack:['挥刀','KeyJ','KeyJ',['KeyZ']],dash:['冲刺','KeyX','KeyX',['KeyK','ShiftLeft','ShiftRight']],bolt:['余烬弹','KeyF','KeyF',[]],slam:['下坠','KeyV','KeyV',[]],heal:['疗愈','KeyC','KeyC',['KeyL']],interact:['互动','KeyE','KeyE',[]],supply:['使用补给','KeyB','KeyB',[]],map:['地图','KeyM','KeyM',[]],journal:['札记','Tab','Tab',['KeyQ']],pause:['菜单 / 暂停','Escape','Escape',[]],developer:['开发者面板','F2','F2',[]],respawn:['返回灯台','KeyR','KeyR',[]]};
let controlBindings=Object.fromEntries(Object.entries(controlActions).map(([id,a])=>[id,a[1]])),settingsOpen=false,settingsReturnMode='title',settingsOverlayHidden=false,captureControl=null;
function isControlCode(code){return typeof code==='string'&&/^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|Tab|Escape|F[1-9]|F1[0-2]|ShiftLeft|ShiftRight|ControlLeft|ControlRight|Backspace|Backquote|BracketLeft|BracketRight|Comma|Period|Slash|Semicolon|Quote|Minus|Equal)$/.test(code);}
try{const data=JSON.parse(localStorage.getItem(CONTROL_KEY));if(data?.version===1){const next={...controlBindings},used=new Set();for(const id of Object.keys(next)){const c=data.bindings?.[id];if(!isControlCode(c)||used.has(c))throw Error('Invalid controls');next[id]=c;used.add(c);}controlBindings=next;}}catch{}
function controlCodeLabel(code){return ({Space:'空格',Tab:'Tab',Escape:'ESC',ArrowLeft:'←',ArrowRight:'→',ArrowUp:'↑',ArrowDown:'↓',ShiftLeft:'左 Shift',ShiftRight:'右 Shift',ControlLeft:'左 Ctrl',ControlRight:'右 Ctrl',Backquote:'`',Backspace:'退格',Comma:',',Period:'.',Slash:'/'}[code]||code.replace(/^Key|^Digit/,''));}
bindingLabel=function(id){return controlCodeLabel(controlBindings[id]||id);};
function physicalControl(code){for(const [id,a] of Object.entries(controlActions))if(controlBindings[id]===code)return id;for(const [id,a] of Object.entries(controlActions))if(controlBindings[id]===a[1]&&a[3].includes(code))return id;return null;}
resolveGameKey=function(e){if(['Escape','F2','Enter'].includes(e.code)||developerFlying()&&['ShiftLeft','ShiftRight'].includes(e.code))return e;const mapped=physicalControl(e.code);if(!['playing','resting','map','journal'].includes(mode)&&!(['paused','title','developer'].includes(mode)&&['pause','developer'].includes(mapped))||/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName||''))return e;if(mapped)e.preventDefault();const action=mapped,code=action?controlActions[action][2]:'Unbound';return {code,repeat:e.repeat,target:e.target,preventDefault:()=>e.preventDefault(),stopImmediatePropagation:()=>e.stopImmediatePropagation?.()};};
function saveControlBindings(){try{localStorage.setItem(CONTROL_KEY,JSON.stringify({version:1,bindings:controlBindings}));return true;}catch{return false;}}
function setControlBinding(id,code){if(!controlActions[id]||!isControlCode(code)||['Enter','F5','F11','F12'].includes(code)||(['Escape','F2'].includes(code)&&controlActions[id][1]!==code)){document.getElementById('settings-status').textContent='这个按键保留给菜单或浏览器，请选择其他按键。';return false;}
 const other=physicalControl(code),old=controlBindings[id];if(other&&other!==id)controlBindings[other]=old;controlBindings[id]=code;keys.clear();captureControl=null;const ok=saveControlBindings();refreshControlSettings();document.getElementById('settings-status').textContent=(other&&other!==id?'按键冲突已交换「'+controlActions[other][0]+'」与「'+controlActions[id][0]+'」。':'已修改「'+controlActions[id][0]+'」。')+(ok?' 刷新后仍会保留。':' 本次有效；浏览器未允许保存。');return true;
}
function refreshControlSettings(){for(const [id,a] of Object.entries(controlActions)){const b=document.getElementById('bind-'+id);if(b){b.textContent=captureControl===id?'请按新按键…':bindingLabel(id);b.setAttribute?.('aria-pressed',String(captureControl===id));}}
 const hints=Object.entries(controlActions).slice(0,14).map(([id,a])=>a[0]+' '+bindingLabel(id)).join(' · ');document.getElementById('control-summary').textContent=hints;
 for(const [id,a] of Object.entries(controlActions))document.querySelectorAll?.('[data-control="'+id+'"]').forEach(n=>n.textContent=bindingLabel(id));
 if(typeof abilities!=='undefined'){abilities.dash[1]=bindingLabel('dash')+' 冲刺，地面与空中均可使用';abilities.bolt[1]=bindingLabel('bolt')+' 向前发射单颗余烬弹，空中可用';abilities.slam[1]='空中按 '+bindingLabel('slam')+' 下坠破印';}
}
function openControlSettings(){if(settingsOpen)return;if(storyOpen)closeStoryArchive();if(dev.panelOpen)closeDeveloperPanel();settingsReturnMode=mode;settingsOverlayHidden=document.getElementById('overlay').classList.contains('hidden');settingsOpen=true;captureControl=null;mode='settings';keys.clear();document.getElementById('overlay').classList.add('hidden');document.getElementById('settings-panel').hidden=false;refreshControlSettings();document.getElementById('settings-close').focus();}
function closeControlSettings(){if(!settingsOpen)return;settingsOpen=false;captureControl=null;document.getElementById('settings-panel').hidden=true;mode=settingsReturnMode;document.getElementById('overlay').classList[settingsOverlayHidden?'add':'remove']('hidden');keys.clear();if(mode==='playing')canvas.focus();}
handleSettingsKey=function(e){if(!settingsOpen)return false;if(e.code==='Escape'){e.preventDefault();if(captureControl){captureControl=null;refreshControlSettings();document.getElementById('settings-status').textContent='已取消改键。';}else closeControlSettings();return true;}if(captureControl&&!e.repeat){e.preventDefault();setControlBinding(captureControl,e.code);return true;}return true;};
document.getElementById('control-list').innerHTML=Object.entries(controlActions).map(([id,a])=>'<div class="binding-row"><span>'+a[0]+'</span><button id="bind-'+id+'" type="button" aria-label="修改'+a[0]+'按键">'+bindingLabel(id)+'</button></div>').join('');
for(const id of Object.keys(controlActions))document.getElementById('bind-'+id).onclick=()=>{captureControl=id;refreshControlSettings();document.getElementById('settings-status').textContent='按下新按键；ESC 取消。若与其他动作冲突，会交换按键。';};
document.getElementById('settings-menu-entry').onclick=openControlSettings;document.getElementById('settings-button').onclick=openControlSettings;document.getElementById('settings-close').onclick=closeControlSettings;
document.getElementById('settings-reset').onclick=()=>{controlBindings=Object.fromEntries(Object.entries(controlActions).map(([id,a])=>[id,a[1]]));captureControl=null;saveControlBindings();keys.clear();refreshControlSettings();document.getElementById('settings-status').textContent='已恢复默认按键。ESC 菜单与 F2 开发者入口始终可用。';};refreshControlSettings();

function formatControlHint(t){if(typeof t!=='string')return t;const replacements={E:'interact',F:'bolt',M:'map',V:'slam',TAB:'journal',Q:'journal',B:'supply'};if(replacements[t])return bindingLabel(replacements[t]);return t.replace(/\b(E|F|M|V|TAB|Q|B)(?=\s*(?:[\u4e00-\u9fff]|\/))/g,k=>bindingLabel(replacements[k]));}
const controlsText=text;text=function(t,...args){controlsText(formatControlHint(t),...args);};const controlsToast=toast;toast=function(t,...args){controlsToast(formatControlHint(t),...args);};
// The buttons below the canvas can switch panels while another panel is open.
function leaveAuxiliaryPanels(){if(settingsOpen)closeControlSettings();if(storyOpen)closeStoryArchive();if(dev.panelOpen)closeDeveloperPanel();}
const controlsStory=openStoryArchive;openStoryArchive=function(){leaveAuxiliaryPanels();controlsStory();};
const controlsDeveloper=openDeveloperPanel;openDeveloperPanel=function(){if(settingsOpen)closeControlSettings();if(storyOpen)closeStoryArchive();controlsDeveloper();};
const controlsMenu=openMainMenu;openMainMenu=function(){leaveAuxiliaryPanels();controlsMenu();};togglePause=openMainMenu;
document.getElementById('story-button').onclick=openStoryArchive;document.getElementById('npc-story-action').onclick=openStoryArchive;
document.getElementById('dev-panel-button').onclick=openDeveloperPanel;document.getElementById('dev-menu-entry').onclick=openDeveloperPanel;
document.getElementById('pause-button').onclick=openMainMenu;document.getElementById('menu-button').onclick=openMainMenu;

'use strict';
// The thorn host is a rooted organism; its second phase breaks out of the stem.
const THORN_HP=36*1.5,THORN_HALF=THORN_HP/2;
chapters[1].hp=THORN_HP;rooms[14].bossHP=THORN_HP;
let thornRoots=[],thornPoison=null,thornPetals=[];
const thornCues={
 vineWake:[70,160,'triangle',.7,420],rootWarn:[115,52,'triangle',.6,190],rootRise:[55,330,'sawtooth',.25,760],rootSink:[135,38,'sine',.4,240],
 roar:[85,39,'sawtooth',.55,480],vineBurst:[210,32,'sawtooth',.65,1300],flowerBloom:[145,450,'triangle',.75,640],
 spitWarn:[260,410,'sine',.7,1050],spitRelease:[500,130,'triangle',.24,2100],poisonLand:[340,85,'sine',.3,1600],poisonTick:[610,240,'sine',.15,2600],
 rushWarn:[125,70,'triangle',.8,370],rushRelease:[90,510,'sawtooth',.28,2900],flowerSettle:[230,110,'triangle',.4,880]
};
const previousThornSoundPlan=bossSoundPlan;
bossSoundPlan=function(kind,phase,stage){if(kind!=='thorn'||!thornCues[phase])return previousThornSoundPlan(kind,phase,stage);const [f,end,wave,duration,frequency]=thornCues[phase];return {notes:[{f,end,wave,delay:0,duration,gain:phase==='roar'?.07:.045},{f:f*1.37,end:end*.84,wave:phase==='flowerBloom'?'sine':wave,delay:.035,duration:duration*.8,gain:.023}],noise:{filter:['roar','vineBurst'].includes(phase)?'lowpass':'bandpass',frequency,duration:duration*.75,gain:phase==='vineBurst'?.06:.025}};};
function thornSound(cue){soundBoss('thorn',cue,'release');}
function thornCenter(b){return b.x+b.w/2;}
function thornMouth(b){return {x:thornCenter(b)+Math.cos(b.mouthAngle||0)*45,y:b.y+48+Math.sin(b.mouthAngle||0)*45};}
function initThornBoss(b){b.hp=b.max=THORN_HP;b.w=132;b.h=220;b.x=780;b.y=GROUND-b.h;b.thornStage=1;b.mouthAngle=0;b.rootTurn=0;b.flowerTurn=0;b.phaseTwo=false;b.roars=0;b.vx=b.vy=0;}
const previousThornPrepare=prepareCampaignEncounters;prepareCampaignEncounters=function(id){previousThornPrepare(id);thornRoots=[];thornPoison=null;thornPetals=[];if(boss?.kind==='thorn')initThornBoss(boss);};
const ordinaryBossHit= bossCanBeHit;
bossCanBeHit=function(b){return ordinaryBossHit(b)&&!(b.kind==='thorn'&&['thornRoar','vineBurst','flowerBloom'].includes(b.phase));};
const previousThornBossHit=onBossDamaged;onBossDamaged=function(b){previousThornBossHit(b);if(b.kind==='thorn'&&b.thornStage===1&&b.hp<=THORN_HALF)beginThornTransformation(b);};
function beginThornTransformation(b){b.hp=THORN_HALF;b.thornStage='transform';b.phase='thornRoar';b.timer=2.05;b.roars=0;b.vx=b.vy=0;thornRoots=[];shots=shots.filter(s=>s.owner==='player');toast('荆冠寄主蜕变 · 三次怒吼后，藤体将炸开！',5);}
const ordinaryBossContact=bossContactDamage;bossContactDamage=function(b){if(b.kind!=='thorn')return ordinaryBossContact(b);if(!bossCanBeHit(b))return 0;return b.phase==='flowerRush'?2:1;};
playerMoveScale=function(){return thornPoison?.remaining>0?.55:1;};
function applyThornPoison(x){if(mode!=='playing'||player.dead>0||player.inv>0||isDashInvulnerable()||thornPoison)return false;thornPoison={remaining:3,next:.3,ticks:0,sourceX:x};healTime=0;flourish(player.x+13,player.y+23,'cast','#a9d26a',.6);spawn(player.x+13,player.y+23,15,'#b0d267',90);thornSound('poisonLand');toast('中毒 · 移速降低，连续受到两次 1 点伤害。',3);return true;}
const ordinaryHostileShot=hitHostileShot;hitHostileShot=function(s){if(s.kind==='thornPoison'){applyThornPoison(s.x);return;}ordinaryHostileShot(s);};
function poisonTick(){if(!thornPoison||player.dead>0)return;player.hp=Math.max(0,player.hp-1);thornPoison.ticks++;thornSound('poisonTick');spawn(player.x+13,player.y+24,11,'#b0d267',70);flourish(player.x+13,player.y+23,'impact','#a9d26a',.4);flash=.1;healTime=0;if(player.hp===0){player.dead=1.5;spawn(player.x,player.y,35,'#9fc978',170);toast('毒息吞没了微光 · 正在返回灯台',2);}}
function thornRoarPulse(b){b.roars++;thornSound('roar');flourish(thornCenter(b),b.y+90,'burst','#cfcd87',.7);for(let i=0;i<9;i++)spawn(thornCenter(b),GROUND-10,2,'#b5be76',150);shake=10;const away=Math.sign(player.x+13-thornCenter(b))||-1;player.dashTime=0;player.vx=away*365;player.vy=-190;player.onGround=false;player.inv=Math.max(player.inv,1.4);}
function shedThornPetals(b,count=22){for(let i=0;i<count;i++){const a=i*Math.PI*2/count;thornPetals.push({x:thornCenter(b),y:b.y+95,vx:Math.cos(a)*(110+Math.random()*130),vy:Math.sin(a)*180-70,t:0,life:1.3+Math.random()*.7,rotation:a,color:i%3?'#829e54':'#d4b58a'});}}
function makeThornRoot(x,delay=0){thornRoots.push({x:Math.max(85,Math.min(rooms[room].width-85,x)),wait:.85+delay,age:0,height:0,risen:false,sunk:false,life:1.3});}
function startRootAttack(b){b.phase='rootWindup';b.timer=.65;b.targetX=Math.max(170,Math.min(rooms[room].width-170,player.x+13));b.rootTurn++;thornSound('rootWarn');flourish(thornCenter(b),GROUND-12,'cast','#94bc70',.65);const offsets=b.rootTurn%2?[0,-135,135]:[-240,-120,0,120,240];offsets.forEach((x,i)=>makeThornRoot(b.targetX+x,b.rootTurn%2?0:i*.12));}
function startFlowerSpit(b){b.phase='flowerSpitWarn';b.timer=.85;b.targetX=Math.max(80,Math.min(rooms[room].width-80,player.x+13+player.vx*.2));b.targetY=player.y+23;thornSound('spitWarn');const m=thornMouth(b);flourish(m.x,m.y,'cast','#b8db67',.85);}
function releaseFlowerPoison(b){const m=thornMouth(b);for(let i=-1;i<=1;i++){const flight=Math.max(.7,Math.abs(b.targetX+i*75-m.x)/420)+Math.abs(i)*.08,g=800/(flight*flight);shots.push({x:m.x,y:m.y,vx:(b.targetX+i*75-m.x)/flight,vy:(b.targetY-m.y-.5*g*flight*flight)/flight,gravity:g,life:flight+.7,owner:'boss',kind:'thornPoison',color:'#a6ce62',shape:'venom'});}thornSound('spitRelease');flourish(m.x,m.y,'burst','#b8dc71',.5);spawn(m.x,m.y,16,'#bfdb72',130);}
function startFlowerRush(b){b.phase='flowerRushWarn';b.timer=.95;b.rushDir=player.x+13>thornCenter(b)?1:-1;thornSound('rushWarn');flourish(thornCenter(b),b.y+48,'cast','#e4b68c',.9);}
const ordinaryThornBossUpdate=updateBoss;
updateBoss=function(dt){const b=boss;if(!b||b.kind!=='thorn'){ordinaryThornBossUpdate(dt);return;}b.t+=dt;b.hit=Math.max(0,b.hit-dt);b.dir=player.x+13>thornCenter(b)?1:-1;b.mouthAngle=Math.atan2(player.y+23-(b.y+48),player.x+13-thornCenter(b));
 if(b.phase==='dying')return;
 if(b.thornStage===1&&b.hp<=THORN_HALF)beginThornTransformation(b);
 if(b.phase==='sleep'){if(player.x<1170){b.phase='vineWake';b.timer=1.25;thornSound('vineWake');toast('巨藤扎根于地面 · 留意脚下隆起的土浪。',4);}return;}
 b.timer-=dt;
 if(b.phase==='thornRoar'){const elapsed=2.05-b.timer;while(b.roars<3&&elapsed>=b.roars*.62)thornRoarPulse(b);if(b.timer<=0){b.phase='vineBurst';b.timer=.6;thornSound('vineBurst');shedThornPetals(b,36);spawn(thornCenter(b),b.y+95,85,'#b6c887',270);shake=14;}return;}
 if(b.phase==='vineBurst'){if(b.timer<=0){const center=thornCenter(b);b.w=170;b.h=148;b.x=center-b.w/2;b.y=GROUND-b.h;b.thornStage=2;b.phaseTwo=true;b.phase='flowerBloom';b.timer=1;thornSound('flowerBloom');shedThornPetals(b,16);flourish(center,b.y+48,'burst','#d8a3b4',1);}return;}
 if(b.phase==='flowerBloom'){if(b.timer<=0){b.phase='flowerIdle';b.timer=.7;}return;}
 if(['vineWake','rootRecover','vineIdle'].includes(b.phase)){if(b.timer<=0)startRootAttack(b);return;}
 if(b.phase==='rootWindup'){if(b.timer<=0){b.phase='rootRecover';b.timer=2;}return;}
 if(['flowerIdle','flowerRecover'].includes(b.phase)){if(b.timer<=0){b.flowerTurn++;if(b.flowerTurn%3===0)startFlowerRush(b);else startFlowerSpit(b);}return;}
 if(b.phase==='flowerSpitWarn'){if(b.timer<=0){releaseFlowerPoison(b);b.phase='flowerRecover';b.timer=1.45;}return;}
 if(b.phase==='flowerRushWarn'){if(b.timer<=0){b.phase='flowerRush';b.timer=.68;b.vx=b.rushDir*550;thornSound('rushRelease');shedThornPetals(b,8);}return;}
 if(b.phase==='flowerRush'){b.x+=b.vx*dt;if(b.x<65||b.x>rooms[room].width-b.w-65||b.timer<=0){b.x=Math.max(65,Math.min(rooms[room].width-b.w-65,b.x));b.vx=0;b.phase='flowerRecover';b.timer=1.25;thornSound('flowerSettle');spawn(thornCenter(b),GROUND,22,'#9abb78',150);}else if(b.t%(dt*3)<dt){flourish(thornCenter(b),b.y+70,'trail','#d6a8a1',.35,b.rushDir);spawn(thornCenter(b),GROUND,2,'#a5b36d',65);}return;}
};
const previousThornUpdate=update;update=function(dt){const active=mode==='playing',id=room;previousThornUpdate(dt);if(!active||room!==id)return;if(player.dead>0||mode==='bossDying'||mode==='reward'){thornPoison=null;thornRoots=[];return;}if(mode!=='playing')return;
 if(thornPoison){thornPoison.remaining-=dt;thornPoison.next-=dt;while(thornPoison&&thornPoison.ticks<2&&thornPoison.next<=0&&player.dead<=0){poisonTick();if(thornPoison)thornPoison.next+=.95;}if(thornPoison&&(thornPoison.remaining<=0||player.dead>0))thornPoison=null;}
 for(const s of shots)if(s.kind==='thornPoison'&&s.y>=GROUND-3&&s.vy>0){s.life=0;spawn(s.x,GROUND-3,13,'#a9c971',90);flourish(s.x,GROUND-3,'impact','#adcd75',.3);thornSound('poisonLand');}
 shots=shots.filter(s=>s.life>0);
 if(boss?.kind==='thorn')for(const root of thornRoots){root.wait-=dt;if(root.wait>0)continue;root.age+=dt;if(!root.risen){root.risen=true;thornSound('rootRise');spawn(root.x,GROUND,18,'#a5c078',120);}root.height=root.age<.25?165*root.age/.25:root.age<1.1?165:165*Math.max(0,1-(root.age-1.1)/.4);if(root.age>1.1&&!root.sunk){root.sunk=true;thornSound('rootSink');}if(root.height>18&&overlap(player,{x:root.x-19,y:GROUND-root.height,w:38,h:root.height}))harm(1,root.x);}
 thornRoots=thornRoots.filter(r=>r.wait>0||r.age<1.5);
 for(const p of thornPetals){p.t+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=190*dt;p.rotation+=dt*2;}thornPetals=thornPetals.filter(p=>p.t<p.life);
};
function vineRibbon(points,width,color){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
function thornLeaf(x,y,angle,size,color){ctx.save();ctx.translate(x,y);ctx.rotate(angle);path([[0,0],[size*.3,-size*.4],[size,-size*.16],[size*.66,size*.27],[0,0]],color);line(0,0,size*.8,-size*.05,'#d2df9c88',1.2);ctx.restore();}
function drawThornPlant(b){const cx=thornCenter(b),base=b.y+b.h,flower=b.thornStage===2,breathe=Math.sin(b.t*2)*4,burst=b.phase==='vineBurst'?1-Math.max(0,b.timer/.6):0;
 ctx.save();if(b.hit>0)ctx.globalAlpha=.58;illustrationDepth++;ellipse(cx,base-2,95,11,'#0006');
 for(const side of [-1,1]){vineRibbon([[cx,base-15],[cx+side*40,base-11],[cx+side*96,base-4],[cx+side*120,base-3]],12,'#304b35');vineRibbon([[cx,base-18],[cx+side*43,base-15],[cx+side*96,base-7]],4,'#8ead60');thornLeaf(cx+side*32,base-16,side<0?Math.PI+.2:-.2,55,'#6d985a');}
 if(!flower){ctx.save();ctx.translate(cx,base);const shakeStem=b.phase==='thornRoar'?Math.sin(b.t*35)*5:0;ctx.rotate(shakeStem*.006);
 const g=ctx.createLinearGradient(-50,0,55,0);g.addColorStop(0,'#233d2e');g.addColorStop(.35,'#608653');g.addColorStop(.55,'#a5b46e');g.addColorStop(1,'#304b35');
 path([[-39,-5],[-51,-60],[-39,-110],[-47,-158],[-26,-214],[-7,-240],[19,-226],[42,-194],[30,-144],[46,-102],[35,-50],[42,-4]],g);
 for(let i=0;i<7;i++){const y=-28-i*27;vineRibbon([[-38,y+12],[-13,y-4],[15,y+3],[38,y-11]],6,'#3f6740');line(-22,y-1,15,y-9,'#c5d6a877',1.5);for(const side of [-1,1])path([[side*35,y],[side*(59+burst*45),y-18],[side*38,y-14]],'#acc58a');}
 for(let i=0;i<5;i++)thornLeaf((i%2?1:-1)*35,-45-i*32,(i%2?-.2:Math.PI+.3)+Math.sin(b.t+i)*.06,60-i*3,'#799958');
 const top=-214+breathe;sculptEllipse(0,top,27,34,'#b9c280');path([[-22,top],[-30,top-28],[-7,top-22],[0,top-45],[11,top-21],[33,top-32],[23,top+2]],'#71924c');line(-10,top+4,-5,top+11,'#e5d8a0',3);line(10,top+2,5,top+10,'#e5d8a0',3);
 sculptEllipse(0,-126,17,25,b.phase==='thornRoar'?'#d7cf88':'#8fba6c');runeRing(0,-126,24,'#bfd38d66',b.t*.15);
 if(b.phase==='vineBurst'){for(let i=0;i<6;i++){const y=-30-i*34;line(-34-burst*20,y,34+burst*20,y-8,'#f5e6b5',2+burst*3);}glow(0,-125,100,'#e9d59a'+Math.round(burst*90).toString(16).padStart(2,'0'));}
 if(b.phase==='thornRoar'){for(let i=0;i<3;i++){ctx.strokeStyle='#d6d091'+Math.round((1-(b.t*.9+i*.32)%1)*150).toString(16).padStart(2,'0');ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,-125,45+(b.t*.9+i*.32)%1*100,55+(b.t*.9+i*.32)%1*75,0,0,Math.PI*2);ctx.stroke();}}
 ctx.restore();
 }else{
 const headY=b.y+48;vineRibbon([[cx,base-10],[cx-18,base-46],[cx+12,headY+37],[cx,headY]],23,'#3f633d');vineRibbon([[cx-4,base-15],[cx-21,base-45],[cx+4,headY+40]],7,'#a0b873');
 thornLeaf(cx-15,base-35,Math.PI-.3,80,'#7ba15e');thornLeaf(cx+5,base-50,-.3,75,'#8aa76a');
 ctx.save();ctx.translate(cx,headY+breathe*.3);ctx.rotate(b.mouthAngle||0);const bloom=b.phase==='flowerBloom'?Math.min(1,1-b.timer):1;ctx.scale(.6+.4*bloom,.6+.4*bloom);
 for(let i=0;i<10;i++){const a=i*Math.PI/5+Math.sin(b.t*2)*.035;ctx.save();ctx.rotate(a);path([[-12,-8],[-25,-48],[-10,-80],[13,-90],[29,-58],[19,-15]],i%2?'#bd758b':'#d19a9d');line(3,-18,7,-69,'#f0b9b077',2);ctx.restore();}
 sculptEllipse(0,0,49,54,'#718b50');sculptEllipse(22,0,43,46,'#cad17e');
 const gape=b.phase==='flowerSpitWarn'?1.16:b.phase==='flowerRushWarn'?.83:1;ctx.save();ctx.translate(30,0);ctx.scale(1,gape);
 ellipse(0,0,33,40,'#322639');ellipse(5,0,23,31,'#542d46');
 // One radial ring: every tooth is rooted on the lip and points into the mouth.
 for(let i=0;i<16;i++){const a=i*Math.PI*2/16,spread=.125,depth=i%2?11:13;
  const left=[Math.cos(a-spread)*32,Math.sin(a-spread)*39],right=[Math.cos(a+spread)*32,Math.sin(a+spread)*39],tip=[Math.cos(a)*(32-depth),Math.sin(a)*(39-depth)];
  path([left,right,tip],'#e6e4b1');line(left[0],left[1],tip[0],tip[1],'#fff6d477',.8);
 }
 ctx.strokeStyle='#a6b66a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,33,40,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 line(6,34,23,37,'#b9d171',3);line(43,-38,52,-27,'#e8e4a977',2);ellipse(-14,-20,5,7,'#e7da83');ellipse(-14,-20,2,5,'#243a2a');
 if(b.phase==='flowerSpitWarn'){glow(36,0,47,'#c0db6a44');ellipse(35,5,9+Math.sin(b.t*22)*2,12,'#a9d364');runeRing(31,0,46,'#badb78aa',-b.t);for(let i=0;i<4;i++)ellipse(26+i*5,15+Math.sin(b.t*7+i)*10,2,3,'#e1eeac');}
 if(b.phase==='flowerRushWarn'){line(67,-31,102,-18,'#ecbc8e',3);line(70,31,106,19,'#ecbc8e',3);runeRing(28,0,52,'#e7b99599',b.t*.6);}
 if(b.phase==='flowerRush'){for(let i=0;i<3;i++)line(-95-i*20,-12+i*11,-46, -12+i*11,'#d7b4a177',3);}
 ctx.restore();
 }
 illustrationDepth--;ctx.restore();
 if(['rootWindup','rootRecover'].includes(b.phase))text('根脉苏醒 · 留意脚下',cx,b.y-42,12,'#b6ce89','center');
 if(b.phase==='thornRoar')text('怒吼 '+Math.min(3,b.roars)+'/3 · 即将破藤',cx,b.y-45,13,'#e2d3a1','center');
 if(b.phase==='vineBurst')text('藤体炸裂',cx,b.y-45,13,'#e3d5ad','center');
 if(b.phase==='flowerBloom')text('破藤绽放 · 食人花',cx,b.y-78,13,'#e3b8bf','center');
 if(b.phase==='flowerSpitWarn'){text('毒囊鼓动 · 毒液连吐',cx,b.y-90,12,'#cbdf91','center');runeRing(b.targetX,b.targetY,19,'#bfd67677',b.t);}
 if(b.phase==='flowerRushWarn'){text('收口伏身 · 冲撞造成 2 点伤害',cx,b.y-93,12,'#efc598','center');for(let i=0;i<4;i++){const x=cx+b.rushDir*(105+i*34);line(x-b.rushDir*13,GROUND-15,x,GROUND-8,'#e8c497',2);line(x-b.rushDir*13,GROUND-1,x,GROUND-8,'#e8c497',2);}}
};
const previousThornDraw=drawBoss;drawBoss=function(b){if(b.kind==='thorn')drawThornPlant(b);else previousThornDraw(b);};
const previousThornShot=drawSpecialShot;drawSpecialShot=function(s){if(s.kind!=='thornPoison')return previousThornShot(s);ctx.save();ctx.translate(s.x,s.y);ctx.rotate(Math.atan2(s.vy,s.vx));glow(0,0,31,'#acda6533');path([[-25,-2],[-9,-7],[5,-10],[13,0],[5,10],[-9,7]],'#abc85f');sculptEllipse(3,0,10,9,'#d1e288');ellipse(5,-3,3,2,'#f1f7b9');for(let i=0;i<3;i++)ellipse(-16-i*9,Math.sin(time*12+i)*4,3-i*.6,3-i*.6,'#a8ca6488');ctx.restore();return true;};
const previousThornTerrain=terrain;terrain=function(){previousThornTerrain();for(const r of thornRoots){if(r.wait>0){const p=1-Math.min(1,r.wait/.85);ellipse(r.x,GROUND-1,25+p*15,5+p*3,'#99b96166');line(r.x-24,GROUND-4,r.x+24,GROUND-4,'#c5d893',2);for(let i=-1;i<=1;i++)line(r.x+i*16,GROUND-5,r.x+i*16+5,GROUND+4,'#b5c787',1.5);text('!',r.x,GROUND-29,16,'#cadd9d','center');}else if(r.height>0){ctx.save();ctx.translate(r.x,GROUND);illustrationDepth++;path([[-19,0],[-13,-r.height*.35],[-16,-r.height*.64],[0,-r.height],[15,-r.height*.72],[11,-r.height*.35],[19,0]],'#8eb867');line(-4,-8,2,-r.height*.88,'#d2df9a',2);for(let i=0;i<3;i++){const y=-r.height*(.22+i*.22);thornLeaf(i%2?-9:9,y,i%2?Math.PI+.2:-.2,25,'#a5c77d');}illustrationDepth--;ctx.restore();}}
 for(const p of thornPetals){ctx.save();ctx.globalAlpha=Math.max(0,1-p.t/p.life);ctx.translate(p.x,p.y);ctx.rotate(p.rotation);path([[-4,-9],[8,-6],[6,8],[-3,10]],p.color);ctx.restore();}
 if(thornPoison){glow(player.x+13,player.y+23,42,'#b0d36a25');runeRing(player.x+13,player.y+24,26,'#afca7288',-time);for(let i=0;i<4;i++)ellipse(player.x+Math.sin(time*5+i)*15+13,player.y+46-(time*27+i*9)%48,2,3,'#c2db8388');}
};
const previousThornHUD=hud;hud=function(){previousThornHUD();if(boss?.kind==='thorn'&&boss.phase!=='sleep'&&boss.phase!=='dying')text((boss.thornStage===2?'Ⅱ · 毒息食人花':boss.thornStage==='transform'?'蜕变 · 怒吼 / 破藤':'Ⅰ · 扎根巨藤')+' · '+Math.ceil(Math.max(0,boss.hp))+'/'+THORN_HP,W/2,625,11,'#c4d39b','center');if(thornPoison)text('中毒 · 移速 55% · 剩余扣血 '+(2-thornPoison.ticks)+' · '+thornPoison.remaining.toFixed(1)+' 秒',W/2,149,12,'#c1dc8a','center');};

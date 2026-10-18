'use strict';
// Layered, shaded illustrations retain the original collision shapes.
let illustrationDepth=0,combatFlourishes=[];
const plainPath=path;
path=function(points,color,close=true){
 if(!illustrationDepth||!close||!/^#[a-f0-9]{6}$/i.test(color)){plainPath(points,color,close);return;}
 const top=Math.min(...points.map(p=>p[1])),bottom=Math.max(...points.map(p=>p[1]));
 const g=ctx.createLinearGradient(0,top,0,Math.max(top+1,bottom));g.addColorStop(0,color);g.addColorStop(.5,color);g.addColorStop(1,'#18252c');plainPath(points,g,close);
 ctx.strokeStyle='#101c26';ctx.lineWidth=1.2;ctx.lineJoin='round';ctx.stroke();
};
function sculptEllipse(x,y,rx,ry,c){const g=ctx.createRadialGradient(x-rx*.35,y-ry*.4,1,x,y,Math.max(rx,ry)*1.3);g.addColorStop(0,c);g.addColorStop(1,'#1b2933');ellipse(x,y,rx,ry,g);ctx.strokeStyle='#13232a';ctx.lineWidth=1;ctx.stroke();}
function runeRing(x,y,r,c,t=0){ctx.save();ctx.translate(x,y);ctx.rotate(t);ctx.strokeStyle=c;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();for(let i=0;i<6;i++){const a=i*Math.PI/3;line(Math.cos(a)*(r-4),Math.sin(a)*(r-4),Math.cos(a)*(r+4),Math.sin(a)*(r+4),c,1.5);}ctx.restore();}
function flourish(x,y,kind,color='#ccebd9',life=.45,dir=1){combatFlourishes.push({x,y,kind,color,age:0,life,dir});if(combatFlourishes.length>100)combatFlourishes.splice(0,combatFlourishes.length-100);}
drawPlayer=function(x,y,face,alpha=1){
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+13,y+23);ctx.scale(face,1);illustrationDepth++;
 const stride=Math.abs(player.vx)>30&&player.onGround?Math.sin(time*18):0,breathe=Math.sin(time*3)*.7;
 if(restWalk?.settle>0){ctx.translate(0,5);ctx.scale(1,.82);}ctx.translate(0,breathe);
 ellipse(0,27,20,4,'#0005');
 path([[-8,1],[-21,8+stride*2],[-38-Math.abs(player.vx)*.015,3+Math.sin(time*9)*3],[-29,-5],[-10,-6]],'#9fac94');
 line(-13,0,-30,3+Math.sin(time*9)*2,'#e2dbb966',1);line(-16,4,-30,5,'#506e67',1);
 line(-6,16,-7-stride*4,24,'#233d46',5);line(6,16,7+stride*4,24,'#233d46',5);
 path([[-10,0],[-16,20],[-9,24],[-2,20],[4,23],[15,21],[10,-2]],'#45717a');
 path([[-6,0],[-8,19],[0,17],[4,1]],'#91b3a3');line(-8,8,-11,19,'#b5d0b355',1);line(6,5,10,18,'#223d48',1.5);
 path([[-11,-9],[-13,-28],[-6,-24],[-2,-15],[5,-32],[10,-27],[13,-9]],'#dce0c4');
 sculptEllipse(0,-10,14,16,'#f1eed5');path([[-12,-17],[-5,-23],[4,-22],[11,-16],[9,-6],[-9,-5]],'#edf0d9');
 line(0,-22,-1,-4,'#d0d4bb',.8);line(-10,-15,-6,-19,'#fffced',1.2);line(7,-19,10,-15,'#fffced',1.2);
 ellipse(-4,-10,2.6,4.2,'#102832');ellipse(6,-11,2.6,4.2,'#102832');ellipse(-4.4,-11,1,1.2,'#81bec1');ellipse(5.6,-12,1,1.2,'#81bec1');
 path([[-12,-3],[-7,2],[8,1],[13,-5],[8,5],[-8,6]],'#7a9d90');line(-7,3,7,3,'#c0cfad',1);
 sculptEllipse(-7,8,4,5,'#e5be6f');runeRing(-7,8,5,'#f6d69099',time);glow(-7,8,23,'#d9c07728');
 let handX=16,handY=9,bladeA=-.65;
 if(player.cast>0){handX=26;handY=1;}else if(player.attack>0){const p=1-player.attack/.22;bladeA=player.attackDir==='up'?-Math.PI/2:player.attackDir==='down'?Math.PI/2:-1.3+p*2.6;handX=Math.cos(bladeA)*17;handY=5+Math.sin(bladeA)*17;}
 line(7,5,handX,handY,'#92ada5',4);sculptEllipse(handX,handY,3,3,'#d6d9bc');
 if(player.cast>0){runeRing(32,0,14+player.cast*24,'#e5cd92aa',time*4);glow(32,0,45,'#e8ba6633');ellipse(32,0,4,4,'#fff1bf');}
 else{ctx.save();ctx.translate(handX,handY);ctx.rotate(bladeA);line(-4,0,1,0,'#806852',3);line(1,-5,1,5,'#e2bf80',2);path([[2,-2],[29,-2],[37,0],[29,3],[2,3]],'#d6e5df');line(4,-1,28,-1,'#fff8d9',1);ctx.restore();}
 illustrationDepth--;ctx.restore();
 if(alpha===1&&player.attack>0){ctx.save();ctx.translate(x+13,y+19);if(player.attackDir==='forward')ctx.scale(face,1);else ctx.rotate(player.attackDir==='up'?-Math.PI/2:Math.PI/2);const p=1-player.attack/.22;ctx.globalAlpha=Math.sin(p*Math.PI)*.6;
 for(let k=0;k<4;k++){ctx.strokeStyle=k===0?'#f6ffe5':'#96dace';ctx.lineWidth=9-k*2;ctx.beginPath();ctx.arc(8,0,60+k*7,-1.15+p*.6,1.12+p*.6);ctx.stroke();}ctx.globalAlpha=.6*(1-p);path([[10,-5],[63,-50],[83,-27],[86,15],[64,49]],'#cef1d633');ctx.restore();}
};
const simpleCreatureDraw=drawEnemyBody;
drawEnemyBody=function(e){if(!e.species)return simpleCreatureDraw(e);ctx.save();illustrationDepth++;const result=simpleCreatureDraw(e);const d=creatureBook[e.species],c=d.color;
 // The burrow renderer clips all ornamentation below the soil line as well.
 if(d.shape==='worm'){ctx.beginPath();ctx.rect(-45,-100,90,GROUND-e.y-16+100);ctx.clip();}
 if(d.shape==='beetle'){for(let i=-2;i<=2;i++){line(i*6,-13+Math.abs(i)*3,i*8,3,c,1);ellipse(i*7,-6,1.2,1.2,'#e4dfbf');}path([[12,-9],[22,-6],[25,1],[17,-1]],'#dde1c3');}
 if(['moth','bat'].includes(d.shape)){const f=Math.sin(e.t*10)*8;for(const side of [-1,1]){line(side*6,0,side*29,-18-f,'#e9dcc777',1);line(side*6,0,side*28,11,'#eee6ce77',1);runeRing(side*21,-3-f*.3,4,c+'99');}sculptEllipse(0,4,5,8,c);}
 if(['statue','hammer','bell','crown','oracle'].includes(d.shape)){path([[-11,1],[-4,-3],[5,-2],[12,2],[9,10],[-8,11]],c);line(-11,3,11,3,'#efe3c088',1);sculptEllipse(0,5,3,4,'#e8d7a2');for(const side of [-1,1]){sculptEllipse(side*14,1,4,5,c);line(side*9,11,side*10,17,'#1a2a34',3);line(side*7,14,side*12,14,c,2);}if(d.shape==='statue'){line(-9,-17,-3,-9,'#33474c',1);line(6,-19,2,-15,'#e3dfc788',1);}if(d.shape==='hammer')for(let i=0;i<3;i++)line(19+i*6,e.warn>0?-32:7,19+i*6,e.warn>0?-26:12,'#4c4139',1);}
 if(['root','flower','mantis'].includes(d.shape)){for(let i=0;i<4;i++){const x=-13+i*8;line(x,4,x-5,12,'#cee2a177',1);ellipse(x,-4+Math.sin(i)*4,1.5,1.5,'#e9e8c6');}if(d.shape==='flower'){runeRing(0,-5,18,'#e7cce866',e.t*.4);sculptEllipse(0,-5,6,6,'#eecfdc');}if(d.shape==='mantis')for(const side of [-1,1])line(side*25,e.warn>0?-20:5,side*32,e.warn>0?-32:-5,'#e9f0bc',1);}
 if(['flea','drone'].includes(d.shape)){for(let i=-1;i<=1;i++){line(i*7,-5,i*7,7,'#553f37',2);ellipse(i*7,-2,1.5,1.5,'#ffd296');}if(d.shape==='drone'){runeRing(0,2,13,'#e5c09588',e.t);line(-21,-16,-21,-3,c,2);line(21,-16,21,-3,c,2);}}
 if(['skate','jelly'].includes(d.shape)){for(let i=-1;i<=1;i++){path([[i*10-5,-3],[i*10,-17+Math.abs(i)*4],[i*10+5,-3]],'#dcebf3');line(i*10,-13,i*10,0,'#749caf',1);}if(d.shape==='jelly')for(let i=-2;i<=2;i++)ellipse(i*7,10,2,2,'#e4f2ed');}
 if(d.shape==='wisp'){runeRing(0,-2,17,'#cdf2e777',e.t*.7);path([[-11,7],[-17,15],[-10,22],[-5,10]],c);}
 if(d.shape==='eye'){runeRing(0,0,29,'#e6d1a377',e.t*.3);line(-16,-6,-9,-9,'#fff0d5',1);ellipse(-3,-4,2,2,'#fff7e4');}
 if(d.shape==='worm'){for(let i=0;i<4;i++){sculptEllipse(-13,3+i*5,3,3,c);sculptEllipse(13,3+i*5,3,3,c);}for(let i=-1;i<=1;i++)path([[i*6-2,-6],[i*6,-13],[i*6+2,-6]],'#efdfce');}
 if(e.state==='warning'&&enemyCanBeHit(e)){runeRing(0,0,30+Math.sin(e.t*12)*2,c+'bb',-e.t*1.4);glow(0,0,42,c+'22');}
 illustrationDepth--;ctx.restore();return result;
};
function drawArtNPC(n,r){ctx.save();ctx.translate(n.x,GROUND);illustrationDepth++;const c=r.accent,role=n.role,sway=Math.sin(time*2)*1.5;
 ellipse(0,-3,24,5,'#0007');line(-7,-17,-9,-2,'#253b46',5);line(7,-17,9,-2,'#253b46',5);
 path([[-12,-42],[-23,-5],[-10,-8],[-1,-3],[12,-9],[22,-6],[12,-45]],role==='smith'?'#926b4b':'#567c75');
 path([[-8,-39],[-10,-10],[1,-6],[7,-40]],c);for(let i=-1;i<=1;i++)line(i*9,-32,i*12,-10,'#e3d6aa44',1);
 sculptEllipse(0,-51+sway,13,15,role==='echo'?'#b7dacd':'#e0d8be');ellipse(-4,-51+sway,2,3,'#233e46');ellipse(4,-51+sway,2,3,'#233e46');
 if(role==='guide'||role==='echo'){path([[-14,-52],[-17,-65],[0,-77],[17,-65],[13,-52],[7,-66],[-7,-65]],c);line(-13,-47,-6,-37,c,3);line(11,-34,24,-26,c,4);line(24,-26,24,-13,'#b1a381',2);arch(16,-14,16,17,'#d3bf84',2);glow(24,-5,40,'#efd58233');ellipse(24,-7,4,5,'#ffe0a1');}
 if(role==='cartographer'){path([[-17,-59],[-9,-72],[8,-68],[16,-57]],'#a2b981');line(-20,-57,21,-57,'#d4cfac',3);path([[10,-31],[33,-28],[29,-11],[9,-16]],'#ddd3a7');line(15,-24,26,-20,'#927f62',1);line(-14,-34,-22,-23,c,4);}
 if(role==='smith'){path([[-14,-45],[-14,-61],[14,-61],[16,-45]],'#aab0a0');line(-11,-55,13,-55,'#e7d4aa',2);path([[-10,-36],[-13,-9],[14,-9],[9,-38]],'#936c4e');line(16,-35,24,-18,c,5);line(24,-18,29,-36,'#6e6255',3);path([[19,-43],[39,-43],[39,-34],[19,-34]],'#c3ac86');}
 if(role==='archivist'){runeRing(0,-51,21,c+'77',time*.2);path([[8,-30],[27,-34],[27,-15],[10,-11],[-6,-16],[-6,-34]],'#d4ddca');line(9,-30,9,-13,'#768f89',2);for(let k=0;k<3;k++)line(13,-27+k*4,23,-29+k*4,'#728a82',1);}
 if(role==='wanderer'){path([[-15,-46],[-18,-62],[-9,-73],[8,-72],[16,-59],[13,-46],[7,-63],[-7,-63]],'#a39ac0');line(21,-48,21,-3,'#b6a783',3);ellipse(21,-49,5,5,'#d2b7df');path([[-14,-40],[-21,-23],[-15,-14],[-7,-36]],'#89799d');}
 if(role==='echo'){glow(0,-42,65,'#9fd9ca18');for(let i=0;i<5;i++)ellipse(Math.sin(time+i)*24,-10-i*11,1.2,1.2,c+'99');}
 illustrationDepth--;ctx.restore();text(n.name,n.x,GROUND-89,11,c,'center');if(Math.abs(player.x-n.x)<90)interactionPrompt('E 交谈',n.x,GROUND-119);
}
drawBoss=function(b){
 const kind=b.kind||'keeper',c=rooms[room].accent,charge=b.phase==='windup',casting=b.phase==='cast',p=charge?Math.max(0,Math.min(1,1-b.timer/BOSS_WINDUP)):casting?Math.max(0,Math.min(1,1-b.timer/BOSS_CAST)):0;
 const metal={keeper:'#c9c19c',thorn:'#a8c381',forge:'#c79d70',mirror:'#b1d7e8',bell:'#baabd0',heart:'#dbc491'}[kind];
 ellipse(b.x+42,GROUND-2,67,9,'#0006');ctx.save();ctx.translate(b.x+42-(charge?b.dir*p*18:0),b.y+45+(charge?p*12:Math.sin(b.t*2)*1.5));ctx.scale(b.dir,1);
 if(b.hit>0)ctx.globalAlpha=.6;if(charge){ctx.rotate(p*.27);ctx.scale(1+p*.12,1-p*.22);}if(b.phase==='charge'){ctx.rotate(.2);ctx.scale(1.12,.9);}illustrationDepth++;
 const cloth=kind==='bell'?'#645578':kind==='mirror'?'#416c87':kind==='thorn'?'#456b49':'#475d5b';
 path([[-27,-15],[-42,38],[-27,43],[-15,34],[-5,45],[10,36],[25,44],[43,34],[26,-15]],cloth);
 for(let i=-2;i<=2;i++)line(i*10,-5,i*15,34,'#d7d3b333',1.5);
 line(-13,21,-18,43,'#24343f',10);line(12,21,19,43,'#24343f',10);path([[-25,35],[-11,35],[-8,44],[-29,44]],metal);path([[12,34],[25,33],[30,44],[10,44]],metal);
 path([[-27,-14],[-20,-32],[19,-31],[29,-12],[19,21],[0,28],[-20,18]],metal);path([[-17,-16],[0,-24],[17,-17],[15,8],[0,18],[-15,8]],cloth);
 for(let i=-1;i<=1;i++){line(-15,-7+i*8,15,-7+i*8,metal,2);ellipse(i*9,19,2,2,'#eed8a6');}
 sculptEllipse(-29,-11,13,15,metal);sculptEllipse(29,-11,13,15,metal);path([[-36,-17],[-26,-26],[-17,-17]],metal);path([[20,-19],[31,-27],[39,-16]],metal);
 sculptEllipse(0,-41,25,27,metal);path([[-22,-49],[-12,-61],[12,-61],[22,-48],[17,-25],[-17,-25]],metal);path([[-19,-43],[19,-43],[15,-28],[-15,-28]],'#233842');
 ellipse(-8,-38,3.5,5,charge?'#ffd18a':casting?'#dff5ff':c);ellipse(9,-38,3.5,5,charge?'#ffd18a':casting?'#dff5ff':c);line(0,-59,0,-44,'#fff0cd88',2);line(-18,-49,-11,-54,'#eee4c888',1);line(13,-54,19,-49,'#eee4c888',1);
 if(kind==='keeper'){for(let i=-2;i<=2;i++)path([[i*9-6,-61],[i*12,-83-Math.abs(i)*5],[i*9+5,-59]],metal);runeRing(0,0,9,'#e9d29a99',b.t*.2);}
 if(kind==='thorn'){for(const side of [-1,1]){line(side*16,-61,side*32,-83,'#92b577',5);line(side*32,-83,side*22,-101,'#92b577',3);line(side*30,-81,side*47,-90,'#a9c88a',3);for(let i=0;i<3;i++)path([[side*(28+i*4),-20+i*17],[side*(53+i*2),-31+i*17],[side*(38+i*4),-14+i*17]],metal);}for(let i=0;i<3;i++)ellipse(-16+i*16,-66,5,6,'#d7b5b8');}
 if(kind==='forge'){path([[-22,-53],[-23,-75],[22,-75],[24,-52]],'#9e866b');for(let i=-1;i<=1;i++)line(i*12,-69,i*12,-61,'#f4c488',3);sculptEllipse(0,0,11,13,'#ffb163');for(const side of [-1,1])path([[side*30,-6],[side*40,-25],[side*45,15],[side*28,16]],metal);glow(0,0,40,'#f28d3033');}
 if(kind==='mirror'){runeRing(0,-31,59,c+'88',b.t*.2);for(let i=0;i<5;i++){const a=b.t*.2+i*Math.PI*.4;path([[Math.cos(a)*54-4,Math.sin(a)*54-31],[Math.cos(a)*65,Math.sin(a)*65-31-7],[Math.cos(a)*54+5,Math.sin(a)*54-25]],metal);}path([[-10,-64],[0,-94],[11,-64]],'#dce9ed');}
 if(kind==='bell'){path([[-30,-44],[-25,-72],[0,-86],[25,-72],[30,-44],[20,-47],[15,-67],[-15,-67],[-20,-47]],metal);line(-28,-42,28,-42,'#e8d3b6',3);line(0,18,0,39,'#aa8d75',3);sculptEllipse(0,37,8,10,'#e5caa0');for(let i=-1;i<=1;i++)line(i*14,-64,i*13,-49,'#e3d6cc77',1.5);}
 if(kind==='heart'){for(let i=-2;i<=2;i++)path([[i*10-6,-62],[i*12,-94-Math.abs(i)*6],[i*10+6,-62]],metal);sculptEllipse(0,0,10,12,'#edd4a1');runeRing(0,0,16,'#e6d09d99',-b.t*.6);for(const side of [-1,1])path([[side*32,-11],[side*45,-37],[side*54,-17],[side*43,8]],metal);}
 let hx=54,hy=-36;if(charge){hx=-55;hy=13;}else if(casting){hx=38;hy=-48-p*54;}else if(b.phase==='castRecover'){hx=76;hy=-16;}
 line(29,-7,40,(hy-7)*.5,metal,9);sculptEllipse(40,(hy-7)*.5,5,6,metal);line(40,(hy-7)*.5,hx,hy,metal,7);sculptEllipse(hx,hy,5,5,'#dfd9ba');
 const weapon=kind==='forge'?'hammer':kind==='bell'?'bell':'blade';ctx.save();ctx.translate(hx,hy);ctx.rotate(charge?-.1:casting?-.1:-.65);
 line(-7,0,38,0,'#9b8262',5);line(5,-11,5,11,'#e6c38e',3);
 if(weapon==='hammer'){path([[31,-17],[57,-17],[57,19],[31,19]],metal);for(let i=0;i<3;i++)line(37+i*6,-12,37+i*6,13,'#e7c493',1);}
 else if(weapon==='bell'){path([[29,-17],[48,-12],[55,10],[23,10]],metal);line(22,10,56,10,'#dfc5a4',3);ellipse(40,14,4,5,'#e6d1ad');}
 else{path([[9,-5],[66,-5],[83,0],[64,7],[9,6]],kind==='mirror'?'#d5eff5':'#e3d5aa');line(15,-3,62,-3,'#fff5dc',2);for(let i=0;i<3;i++)line(24+i*12,-1,28+i*12,3,c,1);}
 ctx.restore();illustrationDepth--;ctx.restore();
 if(charge){glow(b.x+42,GROUND-12,115,'#eea75428');for(let i=0;i<4;i++){const x=b.x+42+b.dir*(75+i*30);line(x-b.dir*12,GROUND-18,x,GROUND-10,'#ffd397',2);line(x-b.dir*12,GROUND-2,x,GROUND-10,'#ffd397',2);}text('压身拉刃 · 冲刺',b.x+42,b.y-100,12,'#f2c38e','center');}
 if(casting){const x=b.x+42+b.dir*38,y=b.y-55-p*35;runeRing(x,y,22+p*14,c+'cc',b.t*2);runeRing(x,y,35+p*11,c+'66',-b.t);glow(x,y,75,c+'33');ellipse(x,y,5+p*5,'#fff3d0');text('举刃聚光 · 弹幕',b.x+42,b.y-145,12,c,'center');}
 if(['stomp','rain'].includes(b.phase)){runeRing(b.targetX,GROUND-8,48,c+'88',b.t);line(b.targetX-55,GROUND-4,b.targetX+55,GROUND-4,c,3);text(b.phase==='stomp'?'落击预兆':'落雨预兆',b.targetX,GROUND-47,13,c,'center');}
 if(b.phase==='laser'){line(80,b.targetY,rooms[room].width-80,b.targetY,c+'99',2);text('光束蓄能 · 离开标线',b.x+42,b.y-130,13,c,'center');}
 if(b.phase==='blink'){runeRing(b.targetX,b.y+42,40,c+'77',b.t);text('残像移位',b.targetX,b.y-75,13,c,'center');}
 if(b.phaseTwo)runeRing(b.x+42,b.y+45,74,c+'44',b.t*.3);
};
const originalArtShot=drawSpecialShot;
drawSpecialShot=function(s){
 const c=s.owner==='player'?'#e6cb93':s.color||rooms[room].accent,dir=Math.atan2(s.vy,s.vx);
 ctx.save();ctx.translate(s.x,s.y);ctx.rotate(dir);glow(0,0,s.owner==='player'?39:27,c+'33');
 for(let k=0;k<3;k++){ctx.globalAlpha=.42-k*.1;path([[-10,-3-k],[-44-k*11,Math.sin(time*20+k)*3],[-10,4+k]],c);}ctx.globalAlpha=1;
 if(s.owner==='player'){path([[-16,-6],[4,-8],[14,0],[4,8],[-16,6],[-8,0]],'#efd6a3');ellipse(2,0,7,4,'#fff8d8');runeRing(0,0,12,c+'aa',time*4);ctx.restore();return true;}
 ctx.restore();const handled=originalArtShot(s);if(!handled){sculptEllipse(s.x,s.y,8,8,c);ellipse(s.x-2,s.y-2,2,2,'#fff2db');}return true;
};
const originalArtAttack=attack;attack=function(){const old=attackId;originalArtAttack();if(attackId!==old)flourish(player.x+13,player.y+21,'slash','#c5e5d6',.4,player.attackDir==='up'?-Math.PI/2:player.attackDir==='down'?Math.PI/2:player.face<0?Math.PI:0);};
const originalArtCast=fireBolt;fireBolt=function(){const old=shots.length;originalArtCast();if(shots.length>old)flourish(player.x+13+player.face*28,player.y+23,'cast','#e8ca90',.45,player.face);};
const originalArtCreatureAttack=creatureAttack;creatureAttack=function(e,ai){originalArtCreatureAttack(e,ai);const c=creatureBook[e.species].color;flourish(e.x+17,e.y+12,['hammer','resonate','rainmark'].includes(ai)?'burst':'cast',c,.5,e.dir);};
const originalArtPrepare=prepareCampaignEncounters;prepareCampaignEncounters=function(id){originalArtPrepare(id);combatFlourishes=[];};
const originalArtUpdate=update;update=function(dt){const active=mode==='playing'||mode==='bossDying',id=room,health=enemies.map(e=>e.hp),oldBoss=boss,phase=boss?.phase;originalArtUpdate(dt);if(!active||id!==room)return;
 for(const f of combatFlourishes)f.age+=dt;combatFlourishes=combatFlourishes.filter(f=>f.age<f.life);
 enemies.forEach((e,i)=>{if(e.hp<health[i])flourish(e.x+17,e.y+16,'impact',creatureBook[e.species]?.color||'#dcd3ad',.3);if(e.motion>0&&e.species&&['lunge','chain','dive'].includes(creatureBook[e.species].ai)&&e.t%(dt*4)<dt)flourish(e.x+17,e.y+16,'trail',creatureBook[e.species].color,.26,e.dir);});
 if(oldBoss&&boss===oldBoss&&phase!==boss.phase&&phase!=='sleep')flourish(boss.x+42,boss.y+40,'burst',rooms[room].accent,.7);
 if(boss?.phase==='charge'&&boss.t%(dt*4)<dt){flourish(boss.x+42,boss.y+42,'trail',rooms[room].accent,.3,boss.dir);spawn(boss.x+42,GROUND-4,2,rooms[room].accent,65);}
};
const originalArtTerrain=terrain;terrain=function(){originalArtTerrain();for(const f of combatFlourishes){const p=f.age/f.life;ctx.save();ctx.globalAlpha=(1-p)*.8;
 if(f.kind==='impact'||f.kind==='burst'){runeRing(f.x,f.y,8+p*(f.kind==='burst'?72:37),f.color+'99',p);for(let i=0;i<8;i++){const a=i*Math.PI/4;line(f.x+Math.cos(a)*(10+p*12),f.y+Math.sin(a)*(10+p*12),f.x+Math.cos(a)*(19+p*40),f.y+Math.sin(a)*(19+p*40),f.color,2*(1-p)+.5);}}
 if(f.kind==='cast'){runeRing(f.x,f.y,10+p*30,f.color, p*2);for(let i=0;i<6;i++){const a=i*Math.PI/3+p;ellipse(f.x+Math.cos(a)*(10+p*30),f.y+Math.sin(a)*(10+p*30),2,2,'#fff3cd');}}
 if(f.kind==='slash'){ctx.translate(f.x,f.y);ctx.rotate(f.dir);ctx.strokeStyle=f.color;ctx.lineWidth=2*(1-p);ctx.beginPath();ctx.arc(8,0,67+p*14,-1+p*.5,1.3+p*.5);ctx.stroke();}
 if(f.kind==='trail'){line(f.x-f.dir*(20+p*30),f.y,f.x+f.dir*12,f.y,f.color,6*(1-p));}
 ctx.restore();}
};

'use strict';
// Chapter-specific creatures, optional room challenges, and procedural boss audio.
const creatureSets=[
 ['shellbeetle','lamprunner','shardsentry'],['roothopper','sporebud','thornmantis'],
 ['cinderflea','bombdrone','hammerguard'],['mirrorskate','glassjelly','echooracle'],
 ['bellknight','sonarbat','tombwisp'],['crownshade','astraleye','voidlarva']
];
const creatureBook={
 shellbeetle:{name:'石壳巡虫',shape:'beetle',ai:'scuttle',color:'#b9b8a0',hint:'沿地面巡逻，靠近后加速'},
 lamprunner:{name:'灯蛾',shape:'moth',ai:'dive',air:true,color:'#dfd4a1',hint:'闪光蓄力后斜向俯冲'},
 shardsentry:{name:'断碑卫',shape:'statue',ai:'arrow',color:'#94a6a4',hint:'停步发射水平石片，跳跃避开'},
 roothopper:{name:'根团跃虫',shape:'root',ai:'hop',color:'#91b976',hint:'屈身后跳向你，下劈可反弹'},
 sporebud:{name:'孢囊花',shape:'flower',ai:'spore',color:'#ceabcc',hint:'扎根不动，抛出三颗弧线孢子'},
 thornmantis:{name:'荆刃螳螂',shape:'mantis',ai:'lunge',color:'#b7d387',hint:'举起双镰，突刺后有恢复空隙'},
 cinderflea:{name:'炉渣跳蚤',shape:'flea',ai:'emberhop',color:'#ed9d59',hint:'跃起后落下余火，避开落点'},
 bombdrone:{name:'投炉浮械',shape:'drone',ai:'bomb',air:true,color:'#d3a56f',hint:'在空中投下重力熔弹'},
 hammerguard:{name:'铸锤卫',shape:'hammer',ai:'hammer',color:'#c5b49a',hint:'蓄锤砸地，地波可以跳过'},
 mirrorskate:{name:'镜鳍游灵',shape:'skate',ai:'skate',color:'#b7e1e5',hint:'贴地滑行，转向时短暂停顿'},
 glassjelly:{name:'碎晶水母',shape:'jelly',ai:'ring',air:true,color:'#b2cee9',hint:'收拢触须后向四周放出晶针'},
 echooracle:{name:'倒影咏者',shape:'oracle',ai:'fork',color:'#c7c1eb',hint:'射出两束交叉倒影，近身可打断'},
 bellknight:{name:'持钟傀儡',shape:'bell',ai:'resonate',color:'#c6b0db',hint:'敲钟后向两侧放出地面声波'},
 sonarbat:{name:'回声蝠',shape:'bat',ai:'sonar',air:true,color:'#b4a1d4',hint:'折翼鸣叫，扩散声环有可穿过的间隙'},
 tombwisp:{name:'失音幽灯',shape:'wisp',ai:'blinkshot',air:true,color:'#a9ced2',hint:'留下预兆后移位，再发射慢速追踪光'},
 crownshade:{name:'无光王裔',shape:'crown',ai:'chain',color:'#ddc48f',hint:'双段连冲，第一次冲刺后仍需躲避'},
 astraleye:{name:'星烬之眼',shape:'eye',ai:'rainmark',air:true,color:'#e8c7ab',hint:'标记三处地面，稍后落下星烬'},
 voidlarva:{name:'潜井噬虫',shape:'worm',ai:'burrow',color:'#b4a4b7',hint:'土浪沿地底移动，停下隆起后钻出地面'}
};
let varietyClock=0,roomDevices=[],creatureHazards=[],suppressBossSound=false;
saved.mechanisms=saved.mechanisms&&typeof saved.mechanisms==='object'&&!Array.isArray(saved.mechanisms)?saved.mechanisms:{};
for(const [id,r] of rooms.entries()){
 r.enemies=r.enemies.map((a,i)=>{const species=creatureSets[r.chapter][i%3],d=creatureBook[species];return [d.air?'flyer':'walker',a[1],d.air?Math.min(375,a[2]>400?315+i%2*55:a[2]):550,a[3]|| (d.ai==='scuttle'?3:2),species];});
 r.mechanisms=[];
}
function deviceSpot(r){const g=[...r.ground].sort((a,b)=>b[1]-a[1])[0];return Math.max(350,Math.min(r.width-450,g[0]+g[1]/2));}
function addDevice(id,kind,x=null){const r=rooms[id],m={id:'device-'+id+'-'+r.mechanisms.length,kind,x:x??deviceSpot(r),y:GROUND,phase:(id%5)*.47};r.mechanisms.push(m);
 if(['spring','lift','ferry'].includes(kind)){const y=kind==='ferry'?300:250;r.platforms.push([m.x+145,y,180]);m.cache={x:m.x+230,y:y-25,value:55+r.chapter*12};}
 if(['prism','bell'].includes(kind)){m.y=kind==='prism'?385:365;r.platforms.push([m.x-160,440,145]);m.cache={x:m.x+235,y:275,value:70+r.chapter*12};}
 if(kind==='runes')m.cache={x:m.x+240,y:515,value:120};
 if(kind==='crumble'){m.y=410;r.platforms.push([m.x-190,465,130],[m.x+190,330,160]);m.cache={x:m.x+260,y:305,value:75};}
 return m;
}
addDevice(0,'pendulum',1100);addDevice(1,'crumble',1230);addDevice(2,'lift',1100);
const deviceFamilies=[null,['spore','pendulum','spring'],['piston','steam','lift'],['ferry','prism','ferry'],['bell','pendulum','bell'],['beam','runes','beam']];
for(let ch=1;ch<=5;ch++)for(let k=0;k<3;k++){const id=5+(ch-1)*10+[1,3,5][k];addDevice(id,deviceFamilies[ch][k],k===2?1100:null);}
for(let n=0;n<8;n++)addDevice(55+n,['crumble','spring','piston','lift','ferry','prism','bell','runes'][n],1350);
function initCreature(e,species){e.species=species;e.state='ready';e.clock=1.2+e.t%1;e.motion=0;e.chain=0;e.warn=0;e.vy=0;e.targetX=e.x;e.targetY=e.y;e.airborne=!!creatureBook[species].air;e.groundY=GROUND-e.h;if(species==='voidlarva')initBurrowingWorm(e);}
function initBurrowingWorm(e){const floors=rooms[room].ground.filter(g=>g[1]>e.w+36);let closest=null,best=Infinity;for(const g of floors){const min=g[0]+18,max=g[0]+g[1]-e.w-18,x=Math.max(min,Math.min(max,e.x)),distance=Math.abs(x-e.x);if(distance<best){best=distance;closest={min,max,x};}}e.burrowFloor=closest;e.y=GROUND+12;e.burrowPhase='travel';e.state='buried';e.trail=[];e.soilTick=0;e.clock=1.2;if(closest)e.x=closest.x;}
enemyCanBeHit=function(e){if(e.species!=='voidlarva')return true;return e.burrowPhase==='surface'||e.burrowPhase==='emerge'&&e.y<GROUND-10;};
function updateBurrowingWorm(e,dt){const floor=e.burrowFloor;if(!floor){e.y=GROUND+12;return;}e.x=Math.max(floor.min,Math.min(floor.max,e.x));e.vy=0;e.warn=0;e.clock-=dt;e.trail=e.trail.filter(p=>e.t-p.t<1.35);
 if(e.burrowPhase==='travel'){const target=Math.max(floor.min,Math.min(floor.max,player.x+13-e.w/2)),dx=target-e.x,step=Math.sign(dx)*Math.min(Math.abs(dx),145*dt);e.x+=step;e.dir=Math.sign(dx)||e.dir;e.y=GROUND+12;e.state='buried';e.soilTick+=dt;if(e.soilTick>.09){e.soilTick=0;e.trail.push({x:e.x+17,t:e.t});if(Math.abs(step)>.1)spawn(e.x+17,GROUND,2,creatureBook[e.species].color,30);}if(e.clock<=0&&Math.abs(player.x-e.x)<135){e.burrowPhase='warning';e.clock=.85;e.targetX=e.x+17;e.state='warning';}}
 else if(e.burrowPhase==='warning'){e.state='warning';e.warn=Math.max(.01,1-e.clock/.85);if(e.clock<=0){e.burrowPhase='emerge';e.clock=.3;e.state='emerging';spawn(e.x+17,GROUND,12,creatureBook[e.species].color,90);}}
 else if(e.burrowPhase==='emerge'){const p=Math.min(1,1-e.clock/.3);e.y=GROUND+12-(e.h+12)*p;if(p>=1){e.y=GROUND-e.h;e.burrowPhase='surface';e.state='recover';e.clock=1.1;}}
 else if(e.burrowPhase==='surface'){e.y=GROUND-e.h;if(e.clock<=0){e.burrowPhase='sink';e.state='sinking';e.clock=.4;}}
 else if(e.burrowPhase==='sink'){const p=Math.min(1,1-e.clock/.4);e.y=GROUND-e.h+(e.h+12)*p;if(p>=1){e.y=GROUND+12;e.burrowPhase='travel';e.state='buried';e.clock=1.2;}}
 e.x=Math.max(floor.min,Math.min(floor.max,e.x));
}
function drawBurrowTrail(e){const floor=e.burrowFloor;if(!floor)return;const c=creatureBook[e.species].color;ctx.save();ctx.beginPath();ctx.rect(floor.min-18,GROUND-35,floor.max-floor.min+e.w+36,70);ctx.clip();for(const p of e.trail){const fade=Math.max(0,1-(e.t-p.t)/1.35);ellipse(p.x,GROUND+3,13*fade,4*fade,c+'33');line(p.x-7,GROUND-1,p.x+6,GROUND+2,c+'44',2);}if(e.burrowPhase==='travel'){for(let i=0;i<5;i++){const x=e.x+17-e.dir*i*12,y=GROUND-1-Math.sin(e.t*17-i)*2;ellipse(x,y,9-i,3+i%2,c+'77');}ellipse(e.x+17,GROUND-2,18,5,c+'55');}if(e.burrowPhase==='warning'){glow(e.x+17,GROUND-5,45,c+'33');ellipse(e.x+17,GROUND-1,26,5+e.warn*5,c+'99');for(let i=-1;i<=1;i++)line(e.x+17+i*15,GROUND-5,e.x+22+i*15,GROUND+6,c,2);}ctx.restore();}
const previousPrepare=prepareCampaignEncounters;
prepareCampaignEncounters=function(id){previousPrepare(id);const r=rooms[id];enemies.forEach((e,i)=>initCreature(e,r.enemies[i]?.[4]||creatureSets[r.chapter][i%3]));roomDevices=r.mechanisms.map(m=>({...m,progress:0,hits:0,until:0,fallAt:0,fallen:false,usedAt:-10,lastAttack:-1}));creatureHazards=[];};
const previousWave=spawnWave;
spawnWave=function(){previousWave();enemies.forEach((e,i)=>{const species=creatureSets[rooms[room].chapter][(i+arenaState.wave-1)%3],d=creatureBook[species];e.type=d.air?'flyer':'walker';e.y=d.air?300:518;e.baseY=d.air?300:550;initCreature(e,species);});};
function creatureShot(e,a,speed=230,extra={}){const d=creatureBook[e.species];shots.push({x:e.x+17,y:e.y+16,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,life:4,owner:'enemy',color:d.color,shape:d.ai==='sonar'?'ring':'shard',...extra});}
function patrolCreature(e,dt,speed=55,span=160){const r=rooms[room],nx=e.x+e.dir*speed*dt;if(r.ground.some(g=>nx+17>g[0]+25&&nx+17<g[0]+g[1]-25)&&Math.abs(nx-e.origin)<span)e.x=nx;else e.dir*=-1;}
function creatureAttack(e,ai){const a=Math.atan2(e.targetY-(e.y+16),e.targetX-(e.x+17)),dir=Math.sign(e.targetX-e.x)||1;
 if(ai==='arrow')creatureShot(e,dir>0?0:Math.PI,270);
 if(ai==='spore')for(const k of [-1,0,1])creatureShot(e,-Math.PI/2+dir*.65+k*.3,260,{gravity:540,shape:'spore'});
 if(['hop','emberhop'].includes(ai)){e.motion=.8;e.vy=-420;e.vx=dir*130;}
 if(['dive','lunge','chain'].includes(ai)){e.motion=ai==='dive'?.42:.38;e.vx=ai==='dive'?Math.cos(a)*360:dir*410;e.vy=ai==='dive'?Math.sin(a)*360:0;if(ai==='chain'){e.chain=e.followup?0:1;e.followup=false;}}
 if(ai==='bomb')creatureShot(e,Math.PI/2,70,{gravity:660,shape:'bomb',life:2.5});
 if(['hammer','resonate'].includes(ai)){for(const side of [-1,1])creatureShot(e,side>0?0:Math.PI,ai==='hammer'?290:240,{y:535,vy:0,shape:'wave'});shake=3;}
 if(ai==='fork')for(const k of [-.28,.28])creatureShot(e,a+k,240);
 if(['ring','sonar'].includes(ai)){const n=ai==='ring'?4:6;for(let i=0;i<n;i++)creatureShot(e,a+i*Math.PI*2/n,ai==='ring'?170:150,{shape:ai==='sonar'?'ring':'shard'});}
 if(ai==='blinkshot'){e.x=Math.max(80,Math.min(rooms[room].width-120,e.targetX-dir*210));e.y=Math.max(220,Math.min(420,e.targetY-130));creatureShot(e,a,140,{homing:.45});spawn(e.x+17,e.y,12,creatureBook[e.species].color);}
 if(ai==='rainmark')for(let i=-1;i<=1;i++)creatureHazards.push({kind:'star',x:e.targetX+i*100,y:GROUND,wait:.8,life:1.25,color:creatureBook[e.species].color});
 // Burrowing creatures use a grounded state machine, never a teleport attack.
}
updateSpeciesEnemy=function(e,dt){const d=creatureBook[e.species],ai=d.ai,distance=Math.abs(player.x-e.x);
 if(ai==='burrow'){updateBurrowingWorm(e,dt);return;}
 if(e.hit>0&&e.state==='warning'){e.state='recover';e.clock=.75;e.warn=0;}
 if(ai==='scuttle'){patrolCreature(e,dt,distance<180?115:48,210);return;}
 if(ai==='skate'){if((e.pause||0)>0){e.pause-=dt;return;}const dir=e.dir,speed=170*Math.max(0,Math.sin(e.t*1.8));patrolCreature(e,dt,speed,230);if(e.dir!==dir)e.pause=.3;return;}
 if(e.motion>0){e.motion-=dt;if(['hop','emberhop'].includes(ai)){const old=e.y;e.vy+=1100*dt;e.y+=e.vy*dt;e.dir=Math.sign(e.vx);patrolCreature(e,dt,Math.abs(e.vx),220);if(e.y>=518){e.y=518;e.motion=0;if(ai==='emberhop'&&old<518)creatureHazards.push({kind:'ember',x:e.x+17,y:GROUND,wait:.3,life:1.1,color:d.color});}}
  else if(['dive','lunge','chain'].includes(ai)){if(ai==='dive'){e.x+=e.vx*dt;e.y=Math.max(160,Math.min(510,e.y+e.vy*dt));}else{e.dir=Math.sign(e.vx);patrolCreature(e,dt,Math.abs(e.vx),360);}if(e.motion<=0&&ai==='chain'&&e.chain){e.chain=0;e.followup=true;e.state='warning';e.clock=.4;e.warn=.1;e.targetX=player.x+13;e.targetY=player.y+23;}}
 }else if(d.air){const tx=e.origin+Math.sin(e.t*(ai==='bomb'?.8:1.2))*85,ty=e.baseY+Math.sin(e.t*1.7)*28;e.x+=(tx-e.x)*Math.min(1,dt*2);e.y+=(ty-e.y)*Math.min(1,dt*2);}
 else if(['lunge','chain','hop','emberhop'].includes(ai)&&e.state==='ready')patrolCreature(e,dt,30,180);
 if(distance>760||player.dead>0){e.warn=0;return;}
 e.clock-=dt;
 if(e.state==='ready'&&e.clock<=0){e.state='warning';e.clock=ai==='rainmark'?1:ai==='burrow'?.9:.65;e.targetX=player.x+13;e.targetY=player.y+23;e.warn=.01;}
 else if(e.state==='warning'){e.warn=Math.max(.01,1-e.clock);if(e.clock<=0){creatureAttack(e,ai);e.state='recover';e.clock=ai==='sonar'?3.6:ai==='rainmark'?3.5:2.3;e.warn=0;}}
 else if(e.state==='recover'&&e.clock<=0){e.state='ready';e.clock=.9;}
};
drawEnemyBody=function(e){if(!e.species)return false;const d=creatureBook[e.species],c=d.color,t=e.t,flap=Math.sin(t*10)*8;ctx.scale(e.dir||1,1);
 if(!d.air&&d.ai!=='burrow')ellipse(0,19,23,4,'#0006');
 const eye=(x=9,y=0)=>{ellipse(x,y,2.8,3.5,'#f0edd5');ellipse(x,y,1,2,'#273239');};
 if(d.shape==='beetle'){ellipse(0,4,22,13,'#526864');path([[-23,4],[-14,-15],[0,-19],[17,-11],[23,5]],c);line(-1,-17,2,10,'#526864',3);for(const x of [-16,-6,7,17])line(x,10,x+Math.sin(t*12+x)*5,18,c,2);eye(17,3);}
 if(d.shape==='moth'){for(const side of [-1,1])path([[side*4,0],[side*32,-20-flap],[side*29,17],[side*8,10]],c+'bb');ellipse(0,1,7,18,'#5c6b66');eye(-2,-7);eye(3,-7);line(-2,-12,-10,-24,c,2);line(3,-12,12,-24,c,2);}
 if(d.shape==='statue'){path([[-17,17],[-13,-19],[13,-22],[19,18]],c);path([[-7,-11],[9,-14],[8,-2],[-5,0]],'#344b52');line(-9,7,13,5,'#667978',3);eye(3,-7);}
 if(d.shape==='root'){ellipse(0,6,20,e.warn>0?9:15,'#4c7250');for(let i=0;i<5;i++)line(-20+i*10,9,-28+i*13,18,c,3);path([[-17,0],[-23,-14],[-9,-7],[-4,-24],[3,-8],[19,-17],[15,2]],c);eye(8,3);}
 if(d.shape==='flower'){line(0,16,0,-2,'#759367',5);for(let i=0;i<6;i++){const a=i*Math.PI/3;ellipse(Math.cos(a)*13,Math.sin(a)*13-5,9,8,c);}ellipse(0,-5,10,10,'#655a7c');eye(3,-5);path([[-3,13],[-24,5],[-17,17]],'#94aa7d');}
 if(d.shape==='mantis'){line(-5,8,-21,19,c,3);line(5,8,24,19,c,3);ellipse(0,0,9,17,'#45624b');path([[-8,-12],[0,-21],[10,-12],[5,-5],[-5,-5]],c);for(const side of [-1,1]){line(side*7,0,side*25,e.warn>0?-20:5,c,3);path([[side*25,e.warn>0?-20:5],[side*35,e.warn>0?-36:-8],[side*30,e.warn>0?-9:13]],c);}eye(3,-11);}
 if(d.shape==='flea'){ellipse(0,2,16,13,'#674b36');path([[-17,0],[-6,-17],[6,-20],[18,-2]],c);line(-12,8,-26,18,'#d89353',4);line(10,8,26,18,'#d89353',4);glow(0,0,28,'#ee873344');eye(7,0);}
 if(d.shape==='drone'){ellipse(0,2,20,12,'#736453');ctx.strokeStyle=c;ctx.lineWidth=4;ctx.strokeRect(-16,-12,32,24);line(-27,-18,27,-18,c,3);ellipse(-23,-18,10,3,c);ellipse(23,-18,10,3,c);ellipse(0,10,7,8,'#f1ad66');glow(0,10,23,'#ef983a44');eye(3,-1);}
 if(d.shape==='hammer'){path([[-14,18],[-14,-10],[13,-14],[20,18]],'#806b56');ctx.fillStyle=c;ctx.fillRect(-12,-17,25,13);line(17,8,28,e.warn>0?-25:10,c,4);ctx.fillStyle='#cc9b64';ctx.fillRect(16,e.warn>0?-36:3,24,12);eye(4,-10);}
 if(d.shape==='skate'){path([[-29,8],[-11,-6],[10,-14],[24,7],[5,17]],c+'bb');line(-25,9,21,9,'#edf3e8',2);for(let i=0;i<3;i++)line(-22-i*7,12,-37-i*7,12,c+'55',2);eye(12,1);}
 if(d.shape==='jelly'){ellipse(0,-5,20,15,c+'aa');for(let i=-2;i<=2;i++)line(i*7,5,i*8+Math.sin(t*5+i)*6,24,c,2);path([[-18,-2],[0,-25],[19,-2]],c+'88');eye(6,-4);}
 if(d.shape==='oracle'){path([[-12,-9],[-23,20],[22,20],[12,-9]],c+'aa');ellipse(0,-12,10,10,'#d9e5e1');ctx.strokeStyle=c;ctx.strokeRect(-17,-29,34,20);ellipse(0,0,7,5,'#35576b');eye(4,-12);}
 if(d.shape==='bell'){arch(-21,-25,42,42,c,3);path([[-16,2],[-23,17],[23,17],[16,2]],'#6b5e82');line(0,0,0,20,c,3);ellipse(0,18,5,6,'#e4d4ae');eye(5,-11);}
 if(d.shape==='bat'){for(const side of [-1,1])path([[side*5,-4],[side*35,-19-flap],[side*29,9],[side*20,2],[side*10,12]],c+'bb');ellipse(0,0,8,15,'#5c4d70');path([[-8,-10],[-7,-23],[-1,-16],[7,-24],[8,-10]],c);eye(3,-5);}
 if(d.shape==='wisp'){glow(0,0,38,c+'33');path([[-12,-15],[14,-15],[19,9],[3,26],[-17,9]],c+'88');ellipse(0,-2,7,10,'#e0ead3');for(let i=0;i<3;i++)ellipse(-13-i*6,13+i*5,3,3,c+'66');eye(2,-2);}
 if(d.shape==='crown'){path([[-15,17],[-10,-11],[13,-11],[23,18]],'#605755');for(let i=-1;i<=1;i++)path([[i*10-6,-12],[i*10,-29-Math.abs(i)*3],[i*10+6,-12]],c);ellipse(1,-7,10,8,'#9d957f');line(15,5,34,-6,c,3);eye(5,-7);}
 if(d.shape==='eye'){glow(0,0,35,c+'33');path([[-25,0],[-11,-15],[11,-15],[26,0],[10,15],[-10,15]],c);ellipse(0,0,11,14,'#7b5866');ellipse(Math.sin(t)*4,0,4,10,'#f5edd9');for(let i=0;i<4;i++){const a=t+i*Math.PI/2;ellipse(Math.cos(a)*31,Math.sin(a)*22,3,3,c);}}
 if(d.shape==='worm'){if(e.y>GROUND)return true;ctx.save();ctx.beginPath();ctx.rect(-50,-150,100,GROUND-e.y-16+150);ctx.clip();ellipse(0,3,16,17,'#695b71');for(let i=0;i<4;i++)line(-13,1+i*5,13,1+i*5,c,2);path([[-14,-7],[-7,-19],[0,-11],[8,-21],[16,-7]],c);eye(5,-5);ctx.restore();}
 return true;
};
drawSpecialShot=function(s){if(!s.color)return false;glow(s.x,s.y,24,s.color+'33');ctx.save();ctx.translate(s.x,s.y);if(s.shape==='ring'){ctx.strokeStyle=s.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.stroke();}else if(s.shape==='wave'){path([[-17,9],[-4,-13],[3,-5],[17,9]],s.color);}else if(s.shape==='bomb'){ellipse(0,0,10,10,'#66513c');ellipse(0,0,5,5,s.color);line(0,-10,5,-16,s.color,2);}else if(s.shape==='spore'){ellipse(0,0,8,9,s.color);ellipse(2,-2,3,3,'#edf2d6');}else{ctx.rotate(Math.atan2(s.vy,s.vx));path([[-12,-4],[12,0],[-12,4]],s.color);}ctx.restore();return true;};
function devicePlatform(m){if(m.kind==='lift')return {x:m.x-60,y:400+Math.sin(varietyClock*.8+m.phase)*135,w:145};if(m.kind==='ferry')return {x:m.x-70+Math.sin(varietyClock*.85+m.phase)*175,y:385,w:150};if(m.kind==='crumble'&&!m.fallen)return {x:m.x-65,y:m.y,w:150};if((m.kind==='prism'&&saved.mechanisms[m.id])||(m.kind==='bell'&&m.until>varietyClock))return {x:m.x+30,y:300,w:285};return null;}
const previousSurfaces=surfaces;surfaces=function(){return [...previousSurfaces(),...roomDevices.map(devicePlatform).filter(Boolean)];};
function solveDevice(m){if(saved.mechanisms[m.id])return;saved.mechanisms[m.id]=true;persist();spawn(m.x,m.y-70,25,rooms[room].accent,150);toast(m.kind==='runes'?'三枚星文依次亮起，封印开启。':'折光镜已对齐 · 上方的光桥展开。',4);sound('rest');}
function collectDeviceCache(m){if(!m.cache||saved.collected.includes(m.id+'-cache'))return;const allowed=!['prism','runes'].includes(m.kind)||saved.mechanisms[m.id];if(allowed&&Math.abs(player.x+13-m.cache.x)<35&&Math.abs(player.y+23-m.cache.y)<40){saved.collected.push(m.id+'-cache');saved.coins+=m.cache.value;persist();spawn(m.cache.x,m.cache.y,18,'#dfc797');toast('机关秘藏 · 获得 '+m.cache.value+' 光屑',3);}}
const previousInteract=interact;interact=function(){if(mode==='playing'&&player.dead<=0)for(const m of roomDevices){if(m.kind!=='runes'||saved.mechanisms[m.id])continue;const index=[-160,0,160].findIndex(dx=>Math.abs(player.x+13-(m.x+dx))<45&&player.onGround);if(index<0)continue;const order=[2,0,1];if(index===order[m.progress]){m.progress++;spawn(m.x+[-160,0,160][index],510,10,'#e9d2a0');sound('rest');if(m.progress===3)solveDevice(m);else toast('星文 '+m.progress+'/3 · 刻痕提示：右 → 左 → 中');}else{m.progress=0;toast('星文熄灭 · 按「右 → 左 → 中」重新点亮。');sound('hit');}return;}previousInteract();};
function updateDevices(dt){for(const m of roomDevices){
 if(m.kind==='spring'&&player.onGround&&Math.abs(player.x+13-m.x)<35&&Math.abs(player.y+player.h-GROUND)<6&&varietyClock-m.usedAt>.7){player.vy=-1040;player.onGround=false;player.airJumped=false;player.airDash=false;player.jumpBuffer=0;m.usedAt=varietyClock;spawn(m.x,GROUND,20,'#b8dca0');sound('jump');}
 if(m.kind==='prism'&&!saved.mechanisms[m.id])for(const s of shots)if(s.owner==='player'&&s.life>0&&Math.abs(s.x-m.x)<30&&Math.abs(s.y-m.y)<32){s.life=0;m.hits++;sound('hit');if(m.hits===2)solveDevice(m);else toast('折光镜旋转一次 · 再用余烬弹转向光桥。');}
 if(m.kind==='bell'&&player.attack>0&&m.lastAttack!==attackId&&overlap(meleeHitbox(),{x:m.x-22,y:m.y-25,w:44,h:50})){m.lastAttack=attackId;m.until=varietyClock+6;spawn(m.x,m.y,18,'#c8b6df');soundBoss('bell','cast','release');toast('钟声架起光桥 · 六秒后消散',3);}
 if(m.kind==='pendulum'){const a=Math.sin(varietyClock*1.5+m.phase)*.75,x=m.x+Math.sin(a)*350,y=155+Math.cos(a)*350;if(circleHitsPlayer(x,y,25))harm(1,x);}
 if(['spore','steam'].includes(m.kind)){const t=(varietyClock+m.phase)%4.6;if(t>2.3&&t<3.35&&overlap(player,{x:m.x-28,y:445,w:56,h:105}))harm(1,m.x);}
 if(m.kind==='piston'){const p=pistonPosition(m);if(p.y+95>470&&p.danger&&overlap(player,{x:m.x-42,y:p.y,w:84,h:95}))harm(1,m.x);}
 if(m.kind==='beam'){const t=(varietyClock+m.phase)%5.5,x=m.x+Math.sin(varietyClock*1.4)*170;if(t>1.8&&t<3.1&&overlap(player,{x:x-8,y:220,w:16,h:330}))harm(1,x);}
 collectDeviceCache(m);
 }}
function circleHitsPlayer(x,y,r){const cx=Math.max(player.x,Math.min(player.x+player.w,x)),cy=Math.max(player.y,Math.min(player.y+player.h,y));return (x-cx)**2+(y-cy)**2<r*r;}
function pistonPosition(m){const t=(varietyClock+m.phase)%5.7;let y=220;if(t>=2.3&&t<2.65)y=220+(t-2.3)/.35*235;else if(t>=2.65&&t<3.5)y=455;else if(t>=3.5&&t<4.1)y=455-(t-3.5)/.6*235;return {y,danger:t>=2.3&&t<4.1,warning:t>=1.3&&t<2.3};}
const previousVarietyUpdate=update;
update=function(dt){const id=room,active=mode==='playing'&&player.dead<=0;
 if(active){const before=roomDevices.map(m=>devicePlatform(m));varietyClock+=dt;roomDevices.forEach((m,i)=>{const p=before[i],next=devicePlatform(m);if(p&&next&&player.onGround&&Math.abs(player.y+player.h-p.y)<5&&player.x+player.w>p.x&&player.x<p.x+p.w){player.x+=next.x-p.x;player.y+=next.y-p.y;if(m.kind==='crumble'){m.fallAt+=dt;if(m.fallAt>.65){m.fallen=true;m.until=varietyClock+2.8;spawn(m.x,m.y,20,'#aeb3aa');}}}else if(m.kind==='crumble'&&!m.fallen)m.fallAt=0;if(m.fallen&&varietyClock>m.until){m.fallen=false;m.fallAt=0;}});
  for(const s of shots){if(s.gravity)s.vy+=s.gravity*dt;if(s.homing){const a=Math.atan2(player.y+23-s.y,player.x+13-s.x),v=Math.hypot(s.vx,s.vy);s.vx+=(Math.cos(a)*v-s.vx)*s.homing*dt;s.vy+=(Math.sin(a)*v-s.vy)*s.homing*dt;}}
 }
 previousVarietyUpdate(dt);if(!active||room!==id||mode!=='playing'||player.dead>0)return;
 updateDevices(dt);for(const h of creatureHazards){h.wait-=dt;if(h.wait<=0){h.life-=dt;if(h.kind==='star'){if(overlap(player,{x:h.x-16,y:280,w:32,h:270}))harm(1,h.x);}else if(overlap(player,{x:h.x-35,y:520,w:70,h:30}))harm(1,h.x);}}creatureHazards=creatureHazards.filter(h=>h.life>0);
};
const deviceNames={pendulum:'古井摆锤 · 观察摆动',crumble:'碎石桥 · 踩踏后坍塌',spring:'弹跳蘑菇 · 跃向秘藏',spore:'孢子喷口 · 发光后喷发',steam:'蒸汽阀 · 等待间歇',piston:'铸压机 · 红光后砸下',lift:'升降货台 · 站上随行',ferry:'浮镜渡台 · 随潮往返',prism:'折光镜 · F 击中两次',bell:'悬钟光桥 · 上劈鸣钟',beam:'扫光封印 · 躲过蓄能线',runes:'星文封印 · E：右 → 左 → 中'};
const previousVarietyTerrain=terrain;
terrain=function(){previousVarietyTerrain();const r=rooms[room];
 for(const m of roomDevices){const c=r.accent,p=devicePlatform(m);if(p){ctx.fillStyle=m.kind==='crumble'?'#7c867c':'#557778aa';ctx.fillRect(p.x,p.y,p.w,13);line(p.x,p.y,p.x+p.w,p.y,c,3);if(m.kind==='crumble')for(let i=0;i<4;i++)line(p.x+i*35,p.y,p.x+i*35+18,p.y+12,'#263c3b',2);if(['bell','prism'].includes(m.kind))glow(p.x+p.w/2,p.y,60,c+'22');}
  if(m.kind==='pendulum'){const a=Math.sin(varietyClock*1.5+m.phase)*.75,x=m.x+Math.sin(a)*350,y=155+Math.cos(a)*350;line(m.x,155,x,y,'#81918b',4);ellipse(x,y,28,28,'#526a6c');ellipse(x,y,15,15,c);for(let i=0;i<6;i++){const ang=i*Math.PI/3;line(x+Math.cos(ang)*23,y+Math.sin(ang)*23,x+Math.cos(ang)*37,y+Math.sin(ang)*37,c,3);}}
  if(m.kind==='spring'){const stretch=varietyClock-m.usedAt<.35?10:0;line(m.x,GROUND,m.x,GROUND-20-stretch,'#84976b',9);ellipse(m.x,GROUND-25-stretch,38,13,'#9eb982');for(const x of [-17,0,17])ellipse(m.x+x,GROUND-30-stretch,4,3,'#e5e3b9');}
  if(['spore','steam'].includes(m.kind)){const t=(varietyClock+m.phase)%4.6,active=t>2.3&&t<3.35,warn=t>1.4&&t<2.3;ellipse(m.x,GROUND,35,8,'#658274');if(warn)glow(m.x,GROUND-12,65,'#eac48455');if(active){for(let i=0;i<7;i++)ellipse(m.x+Math.sin(i+varietyClock*8)*22,GROUND-10-i*14,11,9,c+'aa');glow(m.x,480,70,c+'33');}}
  if(m.kind==='piston'){const d=pistonPosition(m);line(m.x,110,m.x,d.y,'#766456',14);ctx.fillStyle='#827262';ctx.fillRect(m.x-42,d.y,84,95);for(let i=0;i<4;i++)line(m.x-33+i*21,d.y+60,m.x-43+i*21,d.y+83,'#dfb06f',4);if(d.warning){line(m.x-45,GROUND,m.x+45,GROUND,'#eaac72',4);text('!',m.x,515,23,'#eaac72','center');}}
  if(m.kind==='prism'){ctx.save();ctx.translate(m.x,m.y);ctx.rotate((saved.mechanisms[m.id]?2:m.hits)*Math.PI/3);path([[-20,-20],[20,-20],[20,20],[-20,20]],'#809ab9');line(-15,-15,15,15,'#eceddd',3);ctx.restore();line(m.x,m.y,m.x+200,saved.mechanisms[m.id]?300:200,'#c6e2e766',2);}
  if(m.kind==='bell'){arch(m.x-24,m.y-26,48,44,c,3);line(m.x,m.y-40,m.x,m.y-26,'#8f819d',3);ellipse(m.x,m.y+18,6,6,'#e2cfab');if(m.until>varietyClock)text(Math.ceil(m.until-varietyClock)+'s',m.x,m.y-55,13,c,'center');}
  if(m.kind==='beam'){const t=(varietyClock+m.phase)%5.5,x=m.x+Math.sin(varietyClock*1.4)*170;path([[x-15,200],[x,181],[x+15,200],[x,216]],c);if(t>1.1&&t<1.8)line(x,220,x,GROUND,c+'77',2);if(t>1.8&&t<3.1){line(x,220,x,GROUND,c+'bb',16);line(x,220,x,GROUND,'#fff1d2',3);}}
  if(m.kind==='runes'){const order=[2,0,1];for(let i=0;i<3;i++){const x=m.x+[-160,0,160][i],lit=saved.mechanisms[m.id]||order.slice(0,m.progress).includes(i);path([[x-23,550],[x-18,495],[x+18,495],[x+23,550]],lit?'#a49670':'#5d6068');text(['◁','◇','▷'][i],x,531,22,lit?'#f8e5b6':'#a9aab5','center');}}
  if(m.cache&&!saved.collected.includes(m.id+'-cache')){const open=!['prism','runes'].includes(m.kind)||saved.mechanisms[m.id];glow(m.cache.x,m.cache.y,28,open?'#e3c38a33':'#7e789322');path([[m.cache.x-10,m.cache.y-8],[m.cache.x+10,m.cache.y-8],[m.cache.x+10,m.cache.y+8],[m.cache.x-10,m.cache.y+8]],open?'#d1b982':'#766c86');text(open?'✧':'◇',m.cache.x,m.cache.y+5,12,'#eddfb7','center');}
  if(Math.abs(player.x-m.x)<210&&mode==='playing')interactionPrompt(deviceNames[m.kind],m.x,m.kind==='prism'||m.kind==='bell'?m.y-70:430);
 }
 for(const h of creatureHazards){if(h.wait>0){line(h.x-25,GROUND,h.x+25,GROUND,h.color,3);text('!',h.x,515,18,h.color,'center');}else if(h.kind==='star'){line(h.x,280,h.x,GROUND,h.color+'aa',25);line(h.x,280,h.x,GROUND,'#fff1d4',3);}else{for(let i=-1;i<=1;i++)path([[h.x+i*20-12,550],[h.x+i*20,519+Math.sin(varietyClock*10+i)*5],[h.x+i*20+12,550]],h.color+'aa');}}
 for(const e of enemies){if(!e.species||e.hp<=0)continue;const d=creatureBook[e.species];if(d.ai==='burrow')drawBurrowTrail(e);if(e.state==='warning'&&d.ai==='burrow'){line(e.targetX-35,GROUND,e.targetX+35,GROUND,d.color,3);text('出土预兆',e.targetX,510,11,d.color,'center');}if(e.state==='warning'&&d.ai==='rainmark')for(let i=-1;i<=1;i++)line(e.targetX+i*100-20,GROUND,e.targetX+i*100+20,GROUND,d.color,3);if(e.y<550&&Math.abs(e.x-player.x)<160)text(d.name,e.x+17,e.y-(e.state==='warning'?36:15),10,d.color,'center');}
};
// Each skill has a distinct contour; each boss also has its own register and timbre.
const bossVoices={keeper:{base:110,wave:'square',ratios:[1,1.5]},thorn:{base:92.5,wave:'triangle',ratios:[1,1.334]},forge:{base:164.8,wave:'sawtooth',ratios:[1,2.77]},mirror:{base:392,wave:'sine',ratios:[1,2]},bell:{base:130.8,wave:'sine',ratios:[1,2.756,4.087]},heart:{base:55,wave:'triangle',ratios:[1,1.5,2.01]}};
function bossSoundPlan(kind,phase,stage='warn'){const v=bossVoices[kind]||bossVoices.keeper,b=v.base,release=stage==='release';let notes=[],noise=null;
 const note=(f,end=f,wave=v.wave,delay=0,duration=.35,gain=.045)=>notes.push({f,end,wave,delay,duration,gain});
 if(['windup','charge'].includes(phase)){note(b*.55,b*(release?2.2:.85),'sawtooth',0,release?.16:.5);noise={filter:'highpass',frequency:release?1600:400,duration:release?.22:.42,gain:.028};}
 else if(['cast','castRecover'].includes(phase)){[1,1.5,2].forEach((k,i)=>note(b*k,b*k*(release?.65:1.08),v.wave,i*(release?.035:.11),release?.32:.2));}
 else if(['stomp','leap'].includes(phase)){note(b*(release?.5:1),b*.3,'triangle',0,release?.45:.55,.07);noise={filter:'lowpass',frequency:release?550:180,duration:.32,gain:.045};}
 else if(phase==='rain'){[4,3,5,2,4.5].forEach((k,i)=>note(b*k,b*k*.8,'sine',i*.065,.2,.025));}
 else if(phase==='blink'){note(b*2,b*6,'sine',0,.18,.04);note(b*4,b*.5,'sine',.08,.35,.026);}
 else if(phase==='laser'){note(b,b*(release?4:3),'sawtooth',0,release?.65:.8,.035);note(b*1.01,b*3.04,'sine',0,.65,.026);noise={filter:'bandpass',frequency:1800,duration:.32,gain:.018};}
 else if(phase==='phaseTwo'){[1,1.059,1.5].forEach((k,i)=>note(b*k,b*k*.7,v.wave,i*.05,.65,.035));}
 else{v.ratios.forEach((k,i)=>note(b*k,b*k*.92,v.wave,i*.08,.5,.04));}
 // Metal and bell partials ring after the main cue; glass has a short high echo.
 if(['forge','bell'].includes(kind))v.ratios.slice(1).forEach((k,i)=>note(b*k,b*k,'sine',.03+i*.025,.45,.018));
 if(kind==='mirror')note(b*2,b*2,'sine',.2,.28,.012);
 return {notes,noise};
}
function soundBoss(kind,phase,stage){if(!music||!audio)return;const plan=bossSoundPlan(kind,phase,stage),now=audio.currentTime;
 for(const n of plan.notes){const o=audio.createOscillator(),g=audio.createGain(),t=now+n.delay;o.type=n.wave;o.frequency.setValueAtTime(n.f,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,n.end),t+n.duration);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(n.gain,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+n.duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+n.duration+.02);}
 if(plan.noise){const n=plan.noise,buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*n.duration),audio.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length);const source=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();source.buffer=buffer;filter.type=n.filter;filter.frequency.value=n.frequency;gain.gain.value=n.gain;source.connect(filter);filter.connect(gain);gain.connect(audio.destination);source.start(now);source.stop(now+n.duration);}
}
const previousSound=sound;sound=function(type){if(suppressBossSound&&['cast','windup','dash','bolt','hurt'].includes(type))return;previousSound(type);};
const previousVarietyBossUpdate=updateBoss;
updateBoss=function(dt){const b=boss;if(!b)return;const phase=b.phase,two=b.phaseTwo,kind=b.kind||'keeper';suppressBossSound=true;try{previousVarietyBossUpdate(dt);}finally{suppressBossSound=false;}
 if(!two&&b.phaseTwo)soundBoss(kind,'phaseTwo','release');
 if(b.phase!==phase){if(phase==='sleep'&&b.phase==='wake')soundBoss(kind,'wake','warn');else if(phase==='idle'&&['windup','cast','stomp','rain','blink','laser'].includes(b.phase))soundBoss(kind,b.phase,'warn');else if((phase==='windup'&&b.phase==='charge')||(phase==='cast'&&b.phase==='castRecover')||['stomp','rain','blink','laser'].includes(phase))soundBoss(kind,phase,'release');else if(phase==='leap'&&b.phase==='recover')soundBoss(kind,'stomp','release');}
};
const previousVarietyHUD=hud;hud=function(){previousVarietyHUD();const e=enemies.find(e=>e.species&&e.hp>0&&Math.abs(e.x-player.x)<190);if(e)text(creatureBook[e.species].hint,38,181,10,'#bdc9b6');};
// The engine started on the title before chapter content was decorated.
resetRoomEncounters();prepareCampaignEncounters(room);

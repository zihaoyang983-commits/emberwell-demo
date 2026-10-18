'use strict';
// Bodies remain visible after the gameplay hitbox has been removed.
const creatureDeaths={
 shellbeetle:{kind:'flip',duration:1.05},lamprunner:{kind:'flutter',duration:1.2},shardsentry:{kind:'stone',duration:1.15},
 roothopper:{kind:'root',duration:1.1},sporebud:{kind:'petal',duration:1.3},thornmantis:{kind:'blades',duration:1},
 cinderflea:{kind:'ember',duration:.9},bombdrone:{kind:'metal',duration:1.25},hammerguard:{kind:'hammer',duration:1.3},
 mirrorskate:{kind:'water',duration:1.1},glassjelly:{kind:'crystal',duration:1.25},echooracle:{kind:'mirror',duration:1.15},
 bellknight:{kind:'bell',duration:1.4},sonarbat:{kind:'fold',duration:1.2},tombwisp:{kind:'wisp',duration:1.4},
 crownshade:{kind:'crown',duration:1.2},astraleye:{kind:'star',duration:1.3},voidlarva:{kind:'earth',duration:1}
};
const bossDeaths={keeper:'stone',thorn:'petal',forge:'metal',mirror:'mirror',bell:'bell',heart:'star'};
let deathBodies=[],bossDeathPending=null;
function beginCreatureDeath(e,isBoss=false){if(e.deathPlayed)return null;e.deathPlayed=true;const profile=isBoss?{kind:bossDeaths[e.kind]||'stone',duration:1.65}:creatureDeaths[e.species]||{kind:'stone',duration:1.1};const body={enemy:{...e,hit:0,warn:0,state:'ready',phase:'idle'},kind:profile.kind,duration:profile.duration,age:0,isBoss,room,color:isBoss?rooms[room].accent:creatureBook[e.species]?.color||rooms[room].accent};deathBodies.push(body);spawn(e.x+(isBoss?42:17),e.y+(isBoss?40:16),isBoss?30:7,body.color,isBoss?160:70);return body;}
function tickDeathBodies(dt){for(const body of deathBodies)body.age+=dt;deathBodies=deathBodies.filter(b=>(b.permanent||b.age<b.duration)&&b.room===room);}
function deathFragments(body,p,count=6,style='stone'){const size=body.isBoss?1.8:1,c=body.color;for(let i=0;i<count;i++){const a=i*Math.PI*2/count+.3,spread=20+55*p,x=Math.cos(a)*spread*size,y=Math.sin(a)*spread*.5*size+65*p*p*size;ctx.save();ctx.translate(x,y);ctx.rotate(a+p*3);if(style==='petal')ellipse(0,0,(5-i%2)*size,3*size,c);else if(style==='light')ellipse(0,0,(3-i%2)*size,2*size,c);else if(style==='metal'){line(-6*size,0,6*size,0,c,3);line(0,-4*size,0,4*size,c,2);}else path([[-4*size,-3*size],[6*size,-2*size],[3*size,5*size],[-5*size,2*size]],c);ctx.restore();}}
const livingBossDraw=drawBoss;drawBoss=function(b){if(b.phase!=='dying')livingBossDraw(b);};
function drawDeathSprite(body){const e=body.enemy;if(body.isBoss)livingBossDraw({...e,x:-42,y:-45});else{const sprite={...e,y:e.species==='voidlarva'?GROUND-e.h:e.y,t:e.t+body.age*2};if(!drawEnemyBody(sprite)){ellipse(0,0,18,15,body.color);}}}
function drawDeathBody(body){const e=body.enemy,p=Math.min(1,body.age/body.duration),ease=1-(1-p)**3,k=body.kind,size=body.isBoss?1.8:1,x=e.x+(body.isBoss?42:17),y=e.y+(body.isBoss?45:16);ctx.save();if(k==='earth'){ctx.beginPath();ctx.rect(e.x-80,GROUND-90,180,90);ctx.clip();}ctx.translate(x,y);ctx.globalAlpha=Math.max(0,1-p**2);
 ctx.save();
 if(k==='flip'){ctx.translate(-e.dir*18*p,18*p*p);ctx.rotate(e.dir*Math.PI*ease);ctx.scale(1,1-p*.3);}
 if(k==='flutter'){ctx.translate(e.dir*30*Math.sin(p*4),42*p*p);ctx.rotate(Math.sin(p*6)*.5);ctx.scale(1-p*.65,1-p*.4);}
 if(k==='stone'){ctx.translate(0,18*p*p);ctx.rotate(e.dir*.3*p);ctx.scale(1+p*.2,1-p*.75);}
 if(k==='root'){ctx.translate(0,16*p);ctx.rotate(-.4*ease);ctx.scale(1+p*.2,1-p*.8);}
 if(k==='petal'){ctx.translate(0,18*p);ctx.scale(1-p*.65,1-p*.6);}
 if(k==='blades'){ctx.translate(-e.dir*16*p,14*p);ctx.rotate(e.dir*.9*ease);ctx.scale(1-p*.4,1-p*.4);}
 if(k==='ember'){ctx.translate(0,-18*Math.sin(p*Math.PI));ctx.scale(1-p,1-p);glow(0,0,45*size*(1-p),'#f5bd8055');}
 if(k==='metal'){ctx.translate(e.dir*12*p,Math.min(55*p*p,Math.max(0,GROUND-y-20)));ctx.rotate(e.dir*p*.8);ctx.scale(1-p*.4,1-p*.35);}
 if(k==='hammer'){ctx.translate(0,16*p*p);ctx.rotate(e.dir*.55*ease);ctx.scale(1,1-p*.7);}
 if(k==='water'){ctx.translate(0,18*p);ctx.scale(1+p*1.6,1-p*.93);}
 if(k==='crystal'){ctx.translate(0,10*p);ctx.scale(1-p*.7,1-p*.8);ctx.rotate(.2*Math.sin(p*16));}
 if(k==='mirror'){ctx.scale(1-p*.85,1-p*.15);ctx.rotate(-.2*p);}
 if(k==='bell'){ctx.translate(e.dir*30*p,Math.min(24*p*p,GROUND-y-20));ctx.rotate(e.dir*1.1*ease);}
 if(k==='fold'){ctx.translate(e.dir*20*p,42*p*p);ctx.rotate(e.dir*.7*p);ctx.scale(1-p*.85,1-p*.15);}
 if(k==='wisp'){ctx.translate(Math.sin(p*9)*8,-28*p);ctx.scale(1-p*.6,1+p*.5);ctx.globalAlpha*=.75+.25*Math.sin(p*35);}
 if(k==='crown'){ctx.translate(0,14*p*p);ctx.scale(1+p*.1,1-p*.7);}
 if(k==='star'){ctx.rotate(p*1.4);ctx.scale(Math.max(.02,1-ease),Math.max(.02,1-ease));}
 if(k==='earth'){ctx.translate(0,18);ctx.scale(1,1-p*.97);ctx.translate(0,-18);}
 drawDeathSprite(body);ctx.restore();
 if(['stone','metal','hammer'].includes(k))deathFragments(body,p,k==='metal'?9:5,k==='metal'?'metal':'stone');
 if(['mirror','crystal'].includes(k)){deathFragments(body,p,k==='crystal'?8:4);for(let i=-1;i<=1;i++)line(i*8*size,-26*size,i*8*size+p*14,28*size,body.color+'99',1);}
 if(['petal','root'].includes(k))deathFragments(body,p,k==='petal'?8:5,'petal');
 if(k==='blades')for(const dir of [-1,1]){ctx.save();ctx.translate(dir*(20+p*40),20*p*p);ctx.rotate(dir*p*2);path([[0,0],[10,-19],[8,8]],body.color);ctx.restore();}
 if(['flutter','fold'].includes(k))for(const dir of [-1,1]){ctx.save();ctx.translate(dir*(13+p*15),20*p*p);ctx.rotate(dir*p);path([[0,0],[dir*23,-12*(1-p)],[dir*13,9]],body.color+'99');ctx.restore();}
 if(k==='water'){ctx.strokeStyle=body.color+'88';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,22,20+65*p,3+8*p,0,0,Math.PI*2);ctx.stroke();}
 if(k==='bell'){for(let i=0;i<3;i++){ctx.strokeStyle=body.color+'88';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,8,(18+i*9+50*p)*size,0,Math.PI*2);ctx.stroke();}ellipse(e.dir*25*p,22*p*p,5*size,6*size,body.color);}
 if(['wisp','star','ember'].includes(k)){for(let i=0;i<8;i++){const a=i*Math.PI/4+p*4,r=(k==='star'?65*(1-p):20+30*p)*size;ellipse(Math.cos(a)*r,Math.sin(a)*r-(k==='wisp'?30*p:0),3*(1-p)+.5,3*(1-p)+.5,body.color);}if(k==='star')glow(0,0,60*size*(1-p),body.color+'44');}
 if(k==='crown'){ctx.save();ctx.translate(0,-28-32*Math.sin(p*Math.PI));ctx.rotate(p*.7);for(let i=-1;i<=1;i++)path([[i*10-5,0],[i*10,-15-Math.abs(i)*4],[i*10+5,0]],body.color);ctx.restore();}
 if(k==='earth'){ellipse(0,GROUND-y-2,15+20*p,6*(1-p),body.color+'88');for(let i=-2;i<=2;i++)ellipse(i*9,GROUND-y-3+Math.sin(p*8+i)*2,3*(1-p),2*(1-p),body.color);}
 ctx.restore();}
const previousDeathTerrain=terrain;terrain=function(){previousDeathTerrain();for(const body of deathBodies)drawDeathBody(body);};
const previousDeathPrepare=prepareCampaignEncounters;prepareCampaignEncounters=function(id){deathBodies=[];bossDeathPending=null;previousDeathPrepare(id);};
const previousDeathWin=win;win=function(){if(!boss||boss.phase==='dying')return;boss.hp=0;beginCreatureDeath(boss,true);boss.phase='dying';boss.vx=boss.vy=0;bossDeathPending={body:boss,remaining:1.65,room};shots=[];hazards=[];creatureHazards=[];keys.clear();player.vx=player.vy=0;player.attack=player.cast=0;player.inv=2;mode='bossDying';toast((boss.name||'守门者')+'的微光正在散去…',2);};
const previousDeathUpdate=update;update=function(dt){if(mode==='paused'||mode==='exited')return;const active=['playing','resting','bossDying'].includes(mode),oldRoom=room,foes=active?enemies.filter(e=>e.hp>0):[];previousDeathUpdate(dt);if(active&&room===oldRoom){for(const e of foes)if(e.hp<=0)beginCreatureDeath(e);tickDeathBodies(dt);}if(mode==='bossDying'&&bossDeathPending){bossDeathPending.remaining-=dt;if(bossDeathPending.remaining<=0){const pending=bossDeathPending;bossDeathPending=null;if(room===pending.room&&boss===pending.body)previousDeathWin();}}};

'use strict';
// Campaign data and systems sit on top of the small Canvas combat engine.
const chapters=[
 {name:'沉睡遗迹',label:'THE SLEEPING RUINS',color:'#122b30',accent:'#a6bca0'},
 {name:'荆棘林',label:'THE THORNWOOD',color:'#16342c',accent:'#9dc484',boss:'thorn',bossName:'荆冠寄主',hp:60,reward:'doubleJump',names:['林缘驿站','根脉长廊','种灯小径','断枝水道','缠根石室','旅人营火','古树冠廊','孢子试炼','荆冠门庭','寄主之巢']},
 {name:'熔炉遗城',label:'THE ASHEN FORGE',color:'#36261f',accent:'#dda16c',boss:'forge',bossName:'熔炉司祭',hp:72,reward:'slam',names:['锻火驿站','炉渣甬道','熔铜引桥','灰雨工坊','齿轮密室','余温营火','祭火高台','铸兵试炼','司祭门庭','旧日熔炉']},
 {name:'镜湖',label:'THE MIRROR MERE',color:'#192d40',accent:'#a5d2e9',boss:'mirror',bossName:'镜湖残像',hp:80,reward:'phaseDash',names:['湖畔书斋','倒影步道','碎镜廊桥','寂静渡口','银波石室','蓝灯营火','潮汐钟楼','残像试炼','镜月门庭','无声镜殿']},
 {name:'深渊钟域',label:'THE SUNKEN BELFRY',color:'#292236',accent:'#baa5da',boss:'bell',bossName:'深渊钟守',hp:88,reward:'sigil',names:['钟域驿站','回声阶道','紫灯长桥','失音墓道','悬钟暗室','归音营火','残钟高台','回声试炼','钟守门庭','沉钟圣堂']},
 {name:'井心',label:'THE HEART BELOW',color:'#2a252b',accent:'#e0c296',boss:'heart',bossName:'无光之王',hp:120,reward:'ending',names:['井底灯台','封印阶道','旧王引桥','星烬长廊','无名石室','最后营火','追忆高台','王裔试炼','无光门庭','余烬之心']}
];
const abilities={dash:['风之余烬','X / K 冲刺，地面与空中均可使用'],bolt:['余烬弹','F 向角色朝向发射单颗弹丸，空中也可用'],doubleJump:['枝羽之翼','空中再次按跳跃，可完成二段跳'],slam:['坠星之力','空中按 V 下坠，击碎地面的破印屏障'],phaseDash:['镜行之力','使用冲刺穿越蓝色屏障']};
const engine={enter:enterRoom,interact,update,render,terrain,background,hud,drawBoss,updateBoss,start,map:mapOverlay};
let campaignClock=0,saveClock=0,rewardCard=null,journalScroll=0,mapSelection=0,canTravel=false,hazards=[],arenaState=null;
rooms.forEach((r,i)=>{r.chapter=0;r.mapX=[2,3,4,1,0][i];r.mapY=0;r.pickups=[];r.doors=[];});
rooms[4].bossId='keeper';rooms[4].bossName='守门者';rooms[4].left=5;
rooms[0].npc={x:510,role:'guide',name:'守灯人'};rooms[0].doors=[{x:1450,target:5,require:'bolt',name:'林缘捷径'}];
const storyNotes=[
 '守灯人：井下的五座灯塔熄灭了。先向东唤醒风，再击败西侧守门者。带着他的余烬弹进入荆棘林。',
 '巡林者：寄主用根脉封住了门庭。唤醒三盏种灯——一盏需要余烬弹，一盏踏上石盘，一盏藏在高台。',
 '锻火匠：熔炉曾为旅人铸造灯芯。三枚炉印仍能唤醒司祭；若光屑足够，我可以磨亮你的刃。',
 '记忆学者：湖里倒映的不是面容，而是遗忘的人。三座镜灯连接残像。带回四份记忆，就能理解井心。',
 '失音旅人：这不是钟声消失的地方，是钟声被留住的地方。唤醒三枚回声印，去见沉钟之下的守卫。',
 '守灯人的回响：四枚灯芯已经归来。最后三盏星灯引向井心。你将决定，是封住长夜，还是唤醒它的黎明。'
];
function newPassage(ch,j){
 const z=chapters[ch],id=5+(ch-1)*10+j,width=j===9?1800:3400+(j%3)*580;
 const r={name:z.names[j],label:z.label,width,color:z.color,accent:z.accent,chapter:ch,left:j===9&&ch===5?null:id+1,right:id===5?4:id-1,ground:[],platforms:[],enemies:[],pickups:[],doors:[],switches:[],barriers:[],mapX:9-j,mapY:ch};
 if(j===9){r.ground=[[0,width]];r.boss=true;r.bossId=z.boss;r.bossName=z.bossName;r.bossHP=z.hp;r.bossReward=z.reward;return r;}
 const quiet=j===0||j===5;let cursor=0;
 if(quiet)r.ground=[[0,width]];else{
  for(let k=0;k<3;k++){const edge=800+k*980,gap=150+ch*35+(j%2)*30;r.ground.push([cursor,edge-cursor]);r.platforms.push([edge+gap/2-75,440-(k%2)*30,150]);cursor=edge+gap;}
  r.ground.push([cursor,width-cursor]);
 }
 // Optional upper routes reward traversal; all mandatory seals have reachable stairs.
 if(!quiet){const x=width*.6;r.platforms.push([x-430,440,180],[x-220,340,180],[x,250,210]);r.pickups.push({id:'coin-'+id,x:width*.32,y:510,type:'coins',value:35+ch*8});}
 if(j===0||j===5||j===8)r.lamp=150;
 if(j===0)r.npc={x:360,role:['','cartographer','smith','archivist','wanderer','echo'][ch],name:['','巡林者','锻火匠','记忆学者','失音旅人','守灯人的回响'][ch]};
 if(j===0)r.enterRequire=['','bolt','doubleJump','slam','phaseDash','fourSigils'][ch];
 if(j===2)r.switches.push({id:ch+'-shot',x:width*.6+100,y:400,kind:'shot',name:['','种灯','炉印','镜灯','回声印','星灯'][ch]});
 if(j===4)r.switches.push({id:ch+'-plate',x:width-380,y:540,kind:'plate',name:'踏印石盘'});
 if(j===6)r.switches.push({id:ch+'-high',x:width*.6+105,y:230,kind:'touch',name:'高台灯印'});
 if(j===8)r.barriers.push({id:'seal-'+ch,x:width*.5,kind:'seal',need:[ch+'-shot',ch+'-plate',ch+'-high']});
 if(j===1&&ch===3)r.barriers.push({id:'break-'+id,x:width*.5,kind:'break'});
 if(j===1&&ch===4)r.barriers.push({id:'phase-'+id,x:width*.5,kind:'phase'});
 if(j===7){r.trial=true;r.ground=[[0,width]];r.platforms=[[1100,435,170],[2100,415,170]];}
 if(j===3||j===6){r.pickups.push({id:'fragment-'+id,x:width*.6+95,y:220,type:'fragment'});}
 if(j===3)r.note={x:width-500,text:storyNotes[ch]};
 if(!quiet&&!r.trial){for(let k=0;k<5+ch;k++){const x=350+k*(width-700)/(4+ch);if(!r.ground.some(g=>x>=g[0]+35&&x<g[0]+g[1]-35))continue;const type=k%4===1?'flyer':k%4===2?'spitter':k%4===3?'rusher':'walker';r.enemies.push([type,x,type==='flyer'?335:550,Math.min(8,2+ch)]);}}
 if(!quiet&&j%3===1)r.hazardPoints=[650,width-600];
 return r;
}
for(let ch=1;ch<=5;ch++)for(let j=0;j<10;j++)rooms.push(newPassage(ch,j));
const sideNames=['迷途树窟','根中旧居','炉底密库','弃铸地窖','镜后藏书','湖底空房','遗音墓室','失落王庭'];
const sideParents=[7,11,17,21,27,31,37,47];
for(let n=0;n<8;n++){
 const parent=sideParents[n],ch=rooms[parent].chapter,id=rooms.length,z=chapters[ch];
 const r={name:sideNames[n],label:'A MEMORY LEFT BEHIND',width:2800,color:z.color,accent:z.accent,chapter:ch,left:parent,right:null,ground:[[0,700],[920,800],[1940,860]],platforms:[[735,425,150],[1775,390,150],[2300,350,220]],enemies:[['spitter',1400,550,5],['flyer',1100,320,4],['rusher',2470,550,6]],pickups:[{id:'memory-'+n,x:2420,y:325,type:'memory'},{id:'side-coins-'+n,x:1300,y:510,type:'coins',value:80}],doors:[{x:130,target:parent,name:'返回主路'}],mapX:rooms[parent].mapX,mapY:ch+.48,optional:true};
 rooms.push(r);rooms[parent].doors.push({x:rooms[parent].width-440,target:id,require:n===1?'doubleJump':n===3?'slam':n===5?'phaseDash':null,name:r.name});
}
function freshProgress(){return {version:3,bosses:[],switches:[],broken:[],collected:[],fragments:[],memories:[],visited:[0],lamps:[0],trials:[],quests:[],blade:0,coins:0,playSeconds:0,deaths:0,kills:0,doubleJump:false,slam:false,phaseDash:false,ending:null};}
const wasOldWin=saved.version!==3&&saved.won;
saved={...freshProgress(),...saved};
for(const field of ['bosses','switches','broken','collected','fragments','memories','visited','lamps','trials','quests'])if(!Array.isArray(saved[field]))saved[field]=[];
for(const field of ['coins','playSeconds','deaths','kills'])saved[field]=Math.max(0,Number(saved[field])||0);
saved.blade=Math.max(0,Math.min(2,Number(saved.blade)||0));
if(wasOldWin){saved.bosses=['keeper'];saved.bolt=true;saved.won=false;saved.ending=null;}
saved.version=3;if(!rooms[saved.checkpoint])saved.checkpoint=0;
function has(requirement){if(!requirement)return true;if(requirement==='fourSigils')return ['thorn','forge','mirror','bell'].every(k=>saved.bosses.includes(k));return !!saved[requirement];}
function sealReady(r){return !r.barriers?.some(b=>b.kind==='seal'&&!b.need.every(id=>saved.switches.includes(id)));}
function chapterGoal(){
 if(saved.ending)return '结局已达成 · 继续寻找失落记忆与支路';
 if(!saved.dash)return '序章：向东进入风眠圣所，唤醒风之余烬';
 if(!saved.bosses.includes('keeper'))return '序章：向西穿越封缄桥，击败守门者并继承余烬弹';
 const ch=chapters.slice(1).findIndex(c=>!saved.bosses.includes(c.boss))+1;
 if(ch===0)return '进入井心，决定余烬之井的命运';
 const z=chapters[ch],count=['shot','plate','high'].filter(k=>saved.switches.includes(ch+'-'+k)).length;
 return `第 ${ch+1} 章 · ${z.name}：唤醒灯印 ${count}/3，挑战${z.bossName}`;
}
objective=chapterGoal;
function showCard(title,body,kind='reward'){rewardCard={title,body};mode=kind;keys.clear();healTime=0;}
function grantAbility(key){saved[key]=true;const [name,hint]=abilities[key];showCard('获得「'+name+'」',hint+'。\n新的路已经向你敞开。');}
function saveAt(r=room){saved.checkpoint=r;if(!saved.lamps.includes(r))saved.lamps.push(r);persist();}
enterRoom=function(id,side=null){
 const r=rooms[id];if(!r)return false;if(!has(r.enterRequire)){toast('这条路径需要'+(abilities[r.enterRequire]?.[0]||'四枚灯芯')+'。先完成当前章节。',4);player.x=Math.max(60,Math.min(rooms[room].width-100,player.x));return false;}
 const completed=r.bossId&&saved.bosses.includes(r.bossId),realBoss=r.boss,completedCampaign=saved.won;r.boss=realBoss&&!completed;saved.won=false;
 engine.enter(id,side);r.boss=realBoss;saved.won=completedCampaign;
 if(completed){boss=null;r.lamp=150;}
 if(boss){boss.kind=r.bossId||'keeper';boss.name=r.bossName||'守门者';boss.hp=boss.max=r.bossHP||36;boss.turn=0;boss.targetX=0;boss.phaseTwo=false;}
 prepareCampaignEncounters(id);
 if(!saved.visited.includes(id))saved.visited.push(id);updateLabels();persist();return true;
};
function prepareCampaignEncounters(id){const r=rooms[id];
 enemies.forEach((e,i)=>{e.hp=e.max=r.enemies[i]?.[3]||e.hp;e.fireTimer=1.5+i*.3;e.rushTimer=2+i*.4;e.rush=0;e.warn=0;e.rewarded=false;});
 hazards=[];player.airJumped=false;player.slam=false;arenaState=r.trial&&!saved.trials.includes(id)?{wave:0,timer:1.5,started:false}:null;
 if(r.bossId&&saved.bosses.includes(r.bossId))boss=null;
}
onRestComplete=function(){prepareCampaignEncounters(room);saveAt();toast('灯台已记录 · M 地图，可传送至已休憩的灯台。',4);};
start=function(){engine.start();player.hp=maxHP();if(saved.ending)toast('长夜已过。仍可寻找记忆，或在灯台重访旧路。');else toast(chapterGoal(),6);};
const originalRespawn=respawn;respawn=function(){saved.deaths++;originalRespawn();persist();};
function activateSwitch(s){if(saved.switches.includes(s.id))return;saved.switches.push(s.id);spawn(s.x,s.y,35,rooms[room].accent,200);sound('rest');toast('灯印已唤醒 · '+chapterGoal(),4);updateLabels();persist();}
function speak(npc){
 const ch=rooms[room].chapter;if(npc.role==='smith'){
  const cost=saved.blade===0?90:220;if(saved.blade>=2){showCard('锻火匠','你的刃已重铸两次。去将灯芯带回井底吧。');return;}
  showCard('锻火匠 · 重铸旅人刃',`当前刃等级：${saved.blade+1} / 3\n重铸需要 ${cost} 光屑，你拥有 ${saved.coins}。\n按 1 重铸（近战与余烬弹伤害提高） · ENTER 离开`,'shop');return;
 }
 if(npc.role==='cartographer'&&saved.memories.length>=2&&!saved.quests.includes('trail')){saved.quests.push('trail');saved.fragments.push('quest-trail');saved.coins+=80;persist();showCard('巡林者 · 迷途者的归处','你找回了两份旧日记忆。\n获得一枚心灯碎片与 80 光屑。');return;}
 if(npc.role==='archivist'&&saved.memories.length>=4&&!saved.quests.includes('truth')){saved.quests.push('truth');saved.fragments.push('quest-truth');persist();showCard('记忆学者 · 井的真相','井里的黑暗曾是为旅人遮雨的夜。\n四份记忆让你记起它的名字。井心将出现另一种选择。');return;}
 showCard(npc.name,storyNotes[ch]+(npc.role==='cartographer'?'\n支线：找回两份支路记忆，带回给巡林者。':npc.role==='archivist'?'\n支线：找回四份记忆，带回给记忆学者。':''));
}
interact=function(){
 if(mode==='map'){travelToSelection();return;}
 if(mode!=='playing'||player.dead>0)return;const r=rooms[room];
 if(r.npc&&Math.abs(player.x-r.npc.x)<80){speak(r.npc);return;}
 if(r.note&&Math.abs(player.x-r.note.x)<75){showCard('遗迹刻痕',r.note.text);return;}
 for(const s of r.switches||[])if(s.kind==='touch'&&Math.abs(player.x+13-s.x)<65&&Math.abs(player.y+23-s.y)<70){activateSwitch(s);return;}
 for(const d of r.doors||[])if(Math.abs(player.x-d.x)<75){if(!has(d.require)){toast('入口需要「'+abilities[d.require]?.[0]+'」。记下位置，获得能力后归来。',4);return;}const target=rooms[d.target],back=target.optional;enterRoom(d.target,back?'left':null);player.x=back?140:(target.doors?.find(a=>a.target===room)?.x||target.lamp||target.width-450);player.y=504;camera=Math.max(0,Math.min(target.width-W,player.x-500));return;}
 if(r.lamp&&Math.abs(player.x-r.lamp)<100&&player.onGround&&Math.abs(player.y+player.h-GROUND)<4){if(boss&&boss.phase!=='sleep'){toast('战斗中无法在灯台休憩。');return;}engine.interact();return;}
 engine.interact();
};
function spawnWave(){
 const ch=rooms[room].chapter,a=arenaState;a.wave++;a.started=true;
 const cx=Math.max(750,Math.min(rooms[room].width-750,player.x));
 enemies=Array.from({length:3+Math.min(2,ch)},(_,i)=>{const type=['walker','flyer','spitter','rusher'][i%4],x=cx+(i%2?1:-1)*(240+Math.floor(i/2)*170);return {type,x,y:type==='flyer'?300:518,origin:x,baseY:300,w:34,h:32,hp:2+ch,max:2+ch,vx:0,dir:i%2?-1:1,t:i,hit:0,lastAttack:-1,fireTimer:1.8+i*.2,rushTimer:2.2+i*.3,rush:0,warn:0,rewarded:false};});
 toast(`试炼 ${a.wave}/3 · 清除来袭的敌人`,3);sound('hurt');
}
function finishTrial(){saved.trials.push(room);saved.coins+=65+rooms[room].chapter*15;saved.fragments.push('trial-'+room);arenaState=null;player.hp=Math.min(maxHP(),player.hp+2);persist();toast('试炼完成 · 获得心灯碎片与光屑，两格生命恢复。',5);}
function damageEnemy(e,n){if(e.hp<=0)return;e.hp-=n;e.hit=.2;spawn(e.x+17,e.y+16,15,'#e2c691');sound('hit');}
update=function(dt){
 if(mode!=='playing'){engine.update(dt);return;}saved.playSeconds+=dt;saveClock+=dt;
 const r=rooms[room],oldRoom=room,oldX=player.x,wasSlam=player.slam,foes=[...enemies];
 if(saved.slam&&keys.has('KeyV')&&!player.onGround&&!player.slam&&player.attack<=0&&player.dashTime<=0){player.slam=true;player.vy=1050;player.vx=0;spawn(player.x+13,player.y+20,12,'#e9c18e');}
 engine.update(dt);if(mode!=='playing'||player.dead>0)return;if(room!==oldRoom)return;
 if(player.slam&&player.onGround){player.slam=false;shake=12;spawn(player.x+13,GROUND,40,'#e8c28a',230);for(const e of enemies)if(Math.abs(e.x-player.x)<150)damageEnemy(e,4+saved.blade);for(const b of r.barriers||[])if(b.kind==='break'&&Math.abs(player.x-b.x)<150&&!saved.broken.includes(b.id)){saved.broken.push(b.id);toast('破印已碎 · 新的路径已开启。');persist();}}
 for(const e of foes)if(e.hp<=0&&!e.rewarded){e.rewarded=true;saved.kills++;saved.coins+=12+r.chapter*4;spawn(e.x+17,e.y+16,10,'#dfc281');}
 for(const e of enemies){if(e.hp<=0)continue;
  if(e.type==='spitter'&&Math.abs(e.x-player.x)<800){e.fireTimer-=dt;e.warn=e.fireTimer<.55?.55-e.fireTimer:0;if(e.fireTimer<=0){const a=Math.atan2(player.y+23-(e.y+12),player.x+13-(e.x+17));shots.push({x:e.x+17,y:e.y+12,vx:Math.cos(a)*225,vy:Math.sin(a)*225,life:4,owner:'enemy'});e.fireTimer=2.8;}}
  if(e.type==='rusher'){e.rushTimer-=dt;if(e.rushTimer<.6&&e.rushTimer>0){e.warn=.6-e.rushTimer;e.dir=player.x>e.x?1:-1;}if(e.rushTimer<=0){e.rush=.5;e.rushTimer=3.2;e.warn=0;}if(e.rush>0){const nx=e.x+e.dir*350*dt;if(r.ground.some(g=>nx+17>g[0]+10&&nx+17<g[0]+g[1]-10))e.x=nx;e.rush-=dt;}}
 }
 for(const s of r.switches||[]){if(saved.switches.includes(s.id))continue;if(s.kind==='plate'&&player.onGround&&Math.abs(player.x+13-s.x)<45)activateSwitch(s);if(s.kind==='shot')for(const shot of shots)if(shot.owner==='player'&&Math.abs(shot.x-s.x)<36&&Math.abs(shot.y-s.y)<35){shot.life=0;activateSwitch(s);}}
 for(const b of r.barriers||[]){const open=b.kind==='seal'?b.need.every(id=>saved.switches.includes(id)):b.kind==='break'?saved.broken.includes(b.id):saved.phaseDash&&player.dashTime>0;if(open)continue;const gx=b.x;
  if((oldX>=gx&&player.x<gx+32)||(oldX+player.w<=gx+32&&player.x+player.w>gx)){player.x=oldX>=gx?gx+35:gx-player.w-2;player.vx=0;}
 }
 for(const p of r.pickups||[]){if(saved.collected.includes(p.id))continue;if(Math.abs(player.x+13-p.x)<35&&Math.abs(player.y+23-p.y)<42){saved.collected.push(p.id);if(p.type==='coins'){saved.coins+=p.value;toast('拾得 '+p.value+' 光屑',2);}if(p.type==='fragment'){saved.fragments.push(p.id);player.hp=Math.min(maxHP(),player.hp+1);toast('获得心灯碎片 · 每三枚增加一格生命上限。',4);}if(p.type==='memory'){saved.memories.push(p.id);showCard('找回一份旧日记忆',`失落记忆 ${saved.memories.length}/8\n「灯曾经为每一位归来的旅人亮着。」\n带回给林缘巡林者或镜湖学者。`);}spawn(p.x,p.y,30,r.accent,190);persist();}}
 for(const x of r.hazardPoints||[]){const t=(time+x*.001)%4.5;if(t>2.4&&t<3.7&&Math.abs(player.x-x)<40&&player.y+player.h>465)harm(1,x);}
 for(const h of hazards){h.life-=dt;if(h.kind==='laser'&&h.life>0&&overlap(player,h))harm(1,h.x);}hazards=hazards.filter(h=>h.life>0);
 if(arenaState){if(!arenaState.started||enemies.every(e=>e.hp<=0)){arenaState.timer-=dt;if(arenaState.timer<=0){if(arenaState.wave===3)finishTrial();else{spawnWave();arenaState.timer=1.4;}}}if(arenaState)player.x=Math.max(80,Math.min(r.width-100,player.x));}
 if(saveClock>5){saveClock=0;persist();}
};
const originalBossUpdate=engine.updateBoss;
updateBoss=function(dt){
 const b=boss;if(!b)return;if(b.kind==='keeper'||!b.kind){originalBossUpdate(dt);return;}
 b.t+=dt;b.hit=Math.max(0,b.hit-dt);if(b.phase==='sleep'){if(player.x<1170){b.phase='wake';b.timer=1.6;toast(b.name+'苏醒 · 留意举刃、落点与光束的预兆',4);}return;}
 b.timer-=dt;
 if(b.hp<b.max/2&&!b.phaseTwo){b.phaseTwo=true;spawn(b.x+42,b.y+20,40,rooms[room].accent,220);toast(b.name+'进入第二阶段',3);}
 if(b.phase==='wake'||b.phase==='recover'||b.phase==='castRecover'){if(b.timer<=0){b.phase='idle';b.timer=b.phaseTwo?.55:.85;}return;}
 if(b.phase==='idle'&&b.timer<=0){const patterns={thorn:['stomp','cast','rain'],forge:['stomp','windup','cast'],mirror:['blink','cast','windup'],bell:['laser','rain','stomp'],heart:['windup','rain','laser','stomp','cast']};b.phase=patterns[b.kind][b.turn++%patterns[b.kind].length];b.dir=player.x>b.x?1:-1;b.targetX=Math.max(130,Math.min(rooms[room].width-160,player.x));b.targetY=player.y+23;b.timer=b.phase==='windup'?BOSS_WINDUP:b.phase==='cast'?BOSS_CAST:1.05;sound(b.phase==='windup'?'windup':'cast');return;}
 if(b.phase==='windup'&&b.timer<=0){b.phase='charge';b.timer=.65;b.vx=b.dir*(b.phaseTwo?625:510);return;}
 if(b.phase==='charge'){b.x+=b.vx*dt;if(b.x<90||b.x>rooms[room].width-180||b.timer<=0){b.x=Math.max(90,Math.min(rooms[room].width-180,b.x));b.phase='recover';b.timer=.85;shake=7;}return;}
 if(b.phase==='cast'&&b.timer<=0){const x=b.x+42+b.dir*38,y=b.y-30,n=b.phaseTwo?5:3;for(let i=0;i<n;i++){const a=Math.atan2(player.y+23-y,player.x+13-x)+(i-(n-1)/2)*.22;shots.push({x,y,vx:Math.cos(a)*260,vy:Math.sin(a)*260,life:6,owner:'boss'});}b.phase='castRecover';b.timer=.45;return;}
 if(b.phase==='stomp'&&b.timer<=0){b.phase='leap';b.timer=.6;b.vx=(b.targetX-b.x)/.6;b.vy=-460;return;}
 if(b.phase==='leap'){b.x+=b.vx*dt;b.vy+=1800*dt;b.y+=b.vy*dt;if(b.y>=GROUND-b.h){b.y=GROUND-b.h;b.x=Math.max(80,Math.min(rooms[room].width-180,b.x));for(const d of [-1,1])shots.push({x:b.x+42,y:535,vx:d*350,vy:0,life:4,owner:'boss'});b.phase='recover';b.timer=1;shake=12;spawn(b.x+42,GROUND,32,rooms[room].accent,230);}return;}
 if(b.phase==='rain'&&b.timer<=0){for(let i=-2;i<=2;i++){const x=Math.max(80,Math.min(rooms[room].width-80,b.targetX+i*130));shots.push({x,y:100,vx:0,vy:310+(b.phaseTwo?60:0),life:3,owner:'boss'});}b.phase='recover';b.timer=1.1;return;}
 if(b.phase==='blink'&&b.timer<=0){b.x=Math.max(100,Math.min(rooms[room].width-180,b.targetX+(player.x<b.x?-300:230)));spawn(b.x+42,b.y,35,'#b8dceb');b.dir=player.x>b.x?1:-1;b.phase='cast';b.timer=BOSS_CAST;return;}
 if(b.phase==='laser'&&b.timer<=0){hazards.push({kind:'laser',x:80,y:b.targetY-10,w:rooms[room].width-160,h:20,life:.85});b.phase='recover';b.timer=1.2;return;}
};
win=function(){
 const r=rooms[room],id=r.bossId||'keeper';spawn(boss.x+42,boss.y+40,100,r.accent,330);boss=null;shots=[];hazards=[];shake=15;player.hp=maxHP();
 if(!saved.bosses.includes(id)){saved.bosses.push(id);saved.coins+=100+r.chapter*30;}r.lamp=150;saveAt(room);
 if(id==='keeper')grantAbility('bolt');else if(r.bossReward==='ending'){showCard('余烬之井的命运','四枚灯芯已归来。\n你可以封住井口，让长夜沉眠。\n若已向学者交还四份记忆，也可以唤醒黎明。','endingChoice');}
 else if(abilities[r.bossReward])grantAbility(r.bossReward);else showCard('获得第四枚灯芯','沉钟已止。返回灯台，向井心前行。');
 persist();updateLabels();sound('rest');
};
function finishEnding(kind){if(kind==='dawn'&&!saved.quests.includes('truth'))return;saved.ending=kind;saved.won=true;persist();showCard(kind==='dawn'?'结局 · 井下黎明':'结局 · 长夜归眠',kind==='dawn'?'你将记忆放回井心。黑暗记起了自己的名字。\n每一盏灯都为归来的旅人亮起。':'你将灯芯留在井底，封住了长夜。\n地面重新迎来星光，井下的故事仍在等待被记起。','epilogue');updateLabels();}
function forgeBlade(){const cost=saved.blade===0?90:220;if(saved.blade>=2)return;if(saved.coins<cost){showCard('光屑不足',`重铸需要 ${cost} 光屑，你拥有 ${saved.coins}。\n探索遗迹与击败敌人可以获取光屑。`);return;}saved.coins-=cost;saved.blade++;persist();showCard('旅人刃已重铸',`刃等级 ${saved.blade+1}/3\n近战伤害 ${meleeDamage()} · 余烬弹伤害 ${2+saved.blade}`);}
mapOverlay=function(){
 ctx.fillStyle='#08131bef';ctx.fillRect(0,0,W,H);text('余烬之井 · 遗迹全图',W/2,60,25,'#dcdcc6','center','serif');text('灰色：未知 · 金色：当前位置 · ✧：灯台 · ◇：Boss · 小方格：支路',W/2,86,11,'#9cad9b','center');
 for(let ch=0;ch<=5;ch++)text(chapters[ch].name,42,132+ch*65,10,chapters[ch].accent,'left');
 for(let i=0;i<rooms.length;i++){const r=rooms[i],x=155+r.mapX*98,y=120+r.mapY*65,w=r.optional?56:90,h=r.optional?19:26;const seen=saved.visited.includes(i);
  if(r.left!==null&&rooms[r.left]?.chapter===r.chapter){const next=rooms[r.left];line(x+w/2,y+h/2,155+next.mapX*98+45,120+next.mapY*65+13,'#45605566');}
  ctx.fillStyle=i===room?'#746447':seen?'#2c453d':'#12252c';ctx.fillRect(x,y,w,h);ctx.strokeStyle=i===mapSelection?'#eddbab':seen?r.accent+'80':'#314543';ctx.lineWidth=i===mapSelection?2:1;ctx.strokeRect(x,y,w,h);
  text(seen?r.name:'· · ·',x+w/2,y+h*.7,r.optional?7:9,seen?'#d1d8bf':'#567268','center');if(saved.lamps.includes(i))text('✧',x+6,y-3,11,'#d6bd83');if(r.bossId)text(saved.bosses.includes(r.bossId)?'✓':'◇',x+w-9,y-3,10,r.accent);
 }
 const selected=rooms[mapSelection];text((saved.visited.includes(mapSelection)?selected.name:'未知遗迹')+' · '+chapters[selected.chapter].name,W/2,515,16,'#d2d4ba','center');text(canTravel&&saved.lamps.includes(mapSelection)?'E / 下方传送按钮：前往所选灯台':'点击选择房间 · 在灯台旁打开地图可传送',W/2,541,12,'#b9c8b2','center');text('M / ESC 返回 · TAB / Q 旅人札记',W/2,569,11,'#8ea498','center');
};
const originalToggleMap=toggleMap;toggleMap=function(){if(mode==='playing'){canTravel=player.onGround&&!!rooms[room].lamp&&Math.abs(player.x-rooms[room].lamp)<100&&!boss;mapSelection=room;toastTimer=0;document.getElementById('toast').style.opacity='0';}originalToggleMap();};
function travelToSelection(){if(!canTravel||!saved.lamps.includes(mapSelection)){toast('传送需要站在灯台旁，并选择已休憩的灯台。');return;}mode='playing';enterRoom(mapSelection);player.hp=maxHP();saveAt(mapSelection);toast('灯光将你带回 '+rooms[mapSelection].name);}
canvas.addEventListener('pointerdown',e=>{if(mode!=='map')return;const b=canvas.getBoundingClientRect(),x=(e.clientX-b.left)*W/b.width,y=(e.clientY-b.top)*H/b.height;const i=rooms.findIndex(r=>x>=155+r.mapX*98&&x<155+r.mapX*98+(r.optional?56:90)&&y>=120+r.mapY*65&&y<120+r.mapY*65+(r.optional?19:26));if(i>=0){mapSelection=i;}});
window.addEventListener('keydown',e=>{
 if(e.repeat&&['Tab','KeyQ','Enter','Digit1','Digit2'].includes(e.code)){if(e.code==='Tab')e.preventDefault();return;}
 if(e.code==='Tab'||e.code==='KeyQ'){e.preventDefault();if(mode==='playing'){mode='journal';keys.clear();}else if(mode==='journal')mode='playing';}
 if(e.code==='Escape'&&mode==='journal')mode='playing';
 if(e.code==='Enter'&&['shop','epilogue'].includes(mode))mode='playing';
 if(e.code==='Digit1'&&mode==='shop')forgeBlade();
 if(e.code==='Digit1'&&mode==='endingChoice')finishEnding('seal');if(e.code==='Digit2'&&mode==='endingChoice')finishEnding('dawn');
 if(mode==='map'&&['ArrowLeft','ArrowRight'].includes(e.code))mapSelection=(mapSelection+(e.code==='ArrowLeft'?-1:1)+rooms.length)%rooms.length;
});
function wrapText(str,x,y,width,size=15,color='#c5d2bd',gap=29){ctx.font=size+'px sans-serif';for(const paragraph of str.split('\n')){let lineText='';for(const char of paragraph){if(ctx.measureText(lineText+char).width>width){text(lineText,x,y,size,color);y+=gap;lineText='';}lineText+=char;}text(lineText,x,y,size,color);y+=gap;}return y;}
terrain=function(){engine.terrain();const r=rooms[room];
 for(const p of r.pickups||[]){if(saved.collected.includes(p.id))continue;const y=p.y+Math.sin(time*2+p.x)*5;glow(p.x,y,35,r.accent+'33');if(p.type==='coins'){ellipse(p.x,y,7,10,'#d5bd86');line(p.x,y-5,p.x,y+5,'#fff0bc',2);}else if(p.type==='fragment'){path([[p.x,y-12],[p.x+10,y],[p.x,y+13],[p.x-10,y]],'#e3d9b3');}else{text('✧',p.x,y+8,28,'#dae6dc','center');}}
 for(const s of r.switches||[]){const active=saved.switches.includes(s.id);glow(s.x,s.y,60,active?r.accent+'55':'#78686a25');ellipse(s.x,s.y,16,16,active?r.accent:'#4c5961');ellipse(s.x,s.y,7,7,active?'#f7ebbe':'#182832');text(active?'✓':s.kind==='shot'?'F':s.kind==='plate'?'▼':'E',s.x,s.y+5,13,active?'#fff0c4':'#cad2bf','center');if(Math.abs(player.x-s.x)<110&&!active)interactionPrompt(s.kind==='shot'?'余烬弹击中灯印':s.kind==='plate'?'踏上石盘':'E 唤醒高台灯印',s.x,s.y-35);}
 for(const b of r.barriers||[]){const open=b.kind==='seal'?b.need.every(id=>saved.switches.includes(id)):b.kind==='break'?saved.broken.includes(b.id):false;if(open)continue;const color=b.kind==='phase'?'#9adbef':b.kind==='break'?'#d7b080':'#c2a3cf';for(let y=170;y<550;y+=40){line(b.x,y,b.x+28,y+28,color+'99',3);line(b.x+28,y,b.x,y+28,color+'77',2);}glow(b.x+14,365,150,color+'18');text(b.kind==='phase'?'冲刺穿镜':b.kind==='break'?'下坠破印':`灯印 ${b.need.filter(id=>saved.switches.includes(id)).length}/3`,b.x+14,135,12,color,'center');}
 for(const d of r.doors||[]){arch(d.x-28,440,56,110,r.accent+'80',4);glow(d.x,492,54,r.accent+'19');text('↥',d.x,480,20,r.accent,'center');if(Math.abs(player.x-d.x)<90)interactionPrompt('E '+d.name,d.x,419);}
 if(r.npc){const n=r.npc;ellipse(n.x,543,22,5,'#0007');path([[n.x-14,515],[n.x-23,541],[n.x+24,541],[n.x+10,508]],r.accent+'88');ellipse(n.x,498,12,15,'#c7cbb8');ellipse(n.x-4,496,2,3,'#24353a');ellipse(n.x+4,496,2,3,'#24353a');text(n.name,n.x,468,11,r.accent,'center');if(Math.abs(player.x-n.x)<90)interactionPrompt('E 交谈',n.x,438);}
 if(r.note){path([[r.note.x-20,550],[r.note.x-20,503],[r.note.x+20,503],[r.note.x+20,550]],'#5d7065');text('✧',r.note.x,529,15,'#bec7ac','center');if(Math.abs(player.x-r.note.x)<80)interactionPrompt('E 阅读刻痕',r.note.x,476);}
 for(const x of r.hazardPoints||[]){const t=(time+x*.001)%4.5;if(t>1.5&&t<2.4){line(x-25,GROUND,x+25,GROUND,'#e6b283',3);text('!',x,510,19,'#e6b283','center');}if(t>2.4&&t<3.7){glow(x,510,80,r.accent+'66');path([[x-27,550],[x-15,465],[x,440],[x+20,480],[x+27,550]],r.accent+'a0');}}
 for(const h of hazards){ctx.fillStyle='#d8bbf2aa';ctx.fillRect(h.x,h.y,h.w,h.h);line(h.x,h.y+h.h/2,h.x+h.w,h.y+h.h/2,'#fff3e4',4);}
 for(const e of enemies)if(e.hp>0&&e.warn>0){glow(e.x+17,e.y+12,45,'#e4b47855');text('!',e.x+17,e.y-14,17,'#f2c687','center');}
};
background=function(){engine.background();const ch=rooms[room].chapter;ctx.save();ctx.globalAlpha=.25;
 for(let i=0;i<9;i++){const x=i*175-camera*.15;if(ch===1){line(x,0,x+Math.sin(i)*55,450,'#638860',5);for(let k=0;k<8;k++)ellipse(x+Math.sin(i+k)*35,k*55,22,8,'#67866c');}if(ch===2){ctx.fillStyle='#956c40';ctx.fillRect(x,410,60,170);glow(x+30,500,100,'#ff8f3b44');}if(ch===3){ellipse(x,270,80,105,'#719ab122');line(x-40,270,x+40,270,'#9fbdd0',2);}if(ch===4){arch(x,70,80,220,'#9b7cb8',3);ellipse(x+40,225,45,26,'#8a759b');}if(ch===5){line(x,0,600-camera*.08,400,'#ad9676',2);text('◇',x,140+i%3*30,35,'#dbcba0','center');}}
 ctx.restore();
};
drawBoss=function(b){
 engine.drawBoss(b);if(!b.kind||b.kind==='keeper')return;const color=rooms[room].accent;const x=b.x+42,y=b.y+15;
 if(b.kind==='thorn'){for(let i=0;i<7;i++){const a=i*Math.PI/3.5;line(x+Math.cos(a)*27,y+Math.sin(a)*23,x+Math.cos(a)*55,y+Math.sin(a)*45,color,4);ellipse(x+Math.cos(a)*52,y+Math.sin(a)*45,9,5,color);}}
 if(b.kind==='forge'){glow(x,y,65,'#e8954350');text('♜',x,y-48,27,'#e5aa6a','center');}
 if(b.kind==='mirror'){ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,60,82,0,0,Math.PI*2);ctx.stroke();}
 if(b.kind==='bell'){arch(x-47,y-60,94,90,color,4);line(x,y+20,x,y+65,color,3);ellipse(x,y+68,9,11,color);}
 if(b.kind==='heart'){for(let i=-2;i<=2;i++)path([[x+i*16-5,y-45],[x+i*16,y-78-Math.abs(i)*6],[x+i*16+7,y-45]],color);glow(x,y,90,'#e2c88c22');}
 if(['stomp','rain'].includes(b.phase)){const tx=b.targetX;glow(tx,GROUND-10,90,color+'33');line(tx-55,GROUND-4,tx+55,GROUND-4,color,3);text(b.phase==='stomp'?'落击预兆':'落雨预兆',tx,GROUND-45,13,color,'center');}
 if(b.phase==='laser'){line(80,b.targetY,rooms[room].width-80,b.targetY,color+'99',2);text('光束蓄能 · 离开标线',b.x+42,b.y-115,13,color,'center');}
 if(b.phase==='blink'){text('残像移位',b.targetX,b.y-70,13,color,'center');ellipse(b.targetX,b.y+40,32,50,color+'22');}
};
hud=function(){engine.hud();text('光屑 '+saved.coins+' · 刃 '+(saved.blade+1)+' · 心灯碎片 '+saved.fragments.length,38,140,10,'#c7ba94');text('记忆 '+saved.memories.length+'/8 · TAB 札记',38,158,10,'#a6b7a2');if(arenaState)text('试炼 '+Math.max(1,arenaState.wave)+'/3',W/2,150,17,rooms[room].accent,'center');};
function drawJournal(){ctx.fillStyle='#09151bf5';ctx.fillRect(0,0,W,H);text('旅人札记',W/2,62,28,'#ddd9bd','center','serif');text('主线 · 能力 · 记忆',W/2,91,11,'#a1b19e','center');wrapText(chapterGoal(),70,135,1050,18,'#e3cca0');
 let y=200;for(const [key,[name,hint]] of Object.entries(abilities)){text((saved[key]?'✓ ':'◇ ')+name,75,y,14,saved[key]?'#d1dbbe':'#647d75');text(saved[key]?hint:'尚未获得',280,y,12,saved[key]?'#a8bcac':'#647d75');y+=37;}
 text('支线：巡林者收集 2 份记忆；学者收集 4 份记忆。',75,415,13,'#b1c1ac');text('心灯碎片 '+saved.fragments.length+' · 生命上限 '+maxHP()+' · 光屑 '+saved.coins+' · 刃等级 '+(saved.blade+1),75,451,13,'#d3c299');
 text('探索 '+saved.visited.length+'/'+rooms.length+' · Boss '+saved.bosses.length+'/6 · 记忆 '+saved.memories.length+'/8',75,485,13,'#afc2ae');text('旅途 '+Math.floor(saved.playSeconds/60)+' 分钟 · 倒下 '+saved.deaths+' 次 · 击败敌人 '+saved.kills,75,519,12,'#91a89c');text('在灯台旁打开 M 地图，可传送到已休憩灯台。',75,553,12,'#b4c5ae');text('TAB / Q / ESC 返回',W/2,612,12,'#d1c59f','center');}
render=function(){engine.render();if(mode==='journal')drawJournal();if(['reward','shop','endingChoice','epilogue'].includes(mode)&&rewardCard){ctx.fillStyle='#081620ef';ctx.fillRect(0,0,W,H);glow(W/2,260,230,'#d4bc8819');text('✧',W/2,158,44,'#ddc69a','center');text(rewardCard.title,W/2,238,28,'#e1d9be','center','serif');wrapText(rewardCard.body,250,297,700,16,'#b7cbb6',34);text(mode==='endingChoice'?'1 封井 · 2 唤醒黎明（需完成学者支线）':'ENTER / 下方按钮继续',W/2,532,12,'#d2bf96','center');}
 const card=document.getElementById('campaign-card');if(card){const isJournal=mode==='journal',active=isJournal||['reward','shop','endingChoice','epilogue'].includes(mode);card.hidden=!active;if(active){const title=isJournal?'旅人札记':rewardCard?.title||'';const body=isJournal?chapterGoal()+'\n\n'+Object.entries(abilities).map(([key,[name,hint]])=>(saved[key]?'✓ ':'◇ ')+name+' · '+(saved[key]?hint:'尚未获得')).join('\n')+'\n\n探索 '+saved.visited.length+'/'+rooms.length+' · Boss '+saved.bosses.length+'/6 · 记忆 '+saved.memories.length+'/8\n生命上限 '+maxHP()+' · 刃等级 '+(saved.blade+1)+' · 光屑 '+saved.coins+'\n旅途 '+Math.floor(saved.playSeconds/60)+' 分钟 · 倒下 '+saved.deaths+' 次\n\n支线：两份记忆交给巡林者；四份记忆交给镜湖学者。\n在灯台旁打开地图，可以传送。':rewardCard?.body||'';const titleNode=document.getElementById('campaign-card-title'),bodyNode=document.getElementById('campaign-card-body');if(titleNode.textContent!==title)titleNode.textContent=title;if(bodyNode.textContent!==body)bodyNode.textContent=body;document.getElementById('toast').style.opacity='0';}}
 const actions=document.getElementById('campaign-actions');if(actions){const active=['reward','shop','endingChoice','epilogue','journal','map'].includes(mode);actions.hidden=!active;const choice=document.getElementById('ending-options');if(choice)choice.hidden=mode!=='endingChoice';const keep=document.getElementById('campaign-continue');if(keep)keep.hidden=mode==='endingChoice';const forge=document.getElementById('campaign-forge');if(forge)forge.hidden=mode!=='shop';const dawn=document.getElementById('ending-dawn');if(dawn)dawn.disabled=!saved.quests.includes('truth');const travel=document.getElementById('campaign-travel');if(travel){travel.hidden=mode!=='map';travel.disabled=!canTravel||!saved.lamps.includes(mapSelection);}}
};
document.getElementById('campaign-continue')?.addEventListener('click',()=>{mode='playing';canvas.focus();});
document.getElementById('campaign-forge')?.addEventListener('click',forgeBlade);
document.getElementById('campaign-travel')?.addEventListener('click',travelToSelection);
document.getElementById('ending-seal')?.addEventListener('click',()=>finishEnding('seal'));
document.getElementById('ending-dawn')?.addEventListener('click',()=>finishEnding('dawn'));
document.getElementById('journal-button')?.addEventListener('click',()=>{if(mode==='playing'){mode='journal';keys.clear();}else if(mode==='journal')mode='playing';});
document.getElementById('new-game')?.addEventListener('click',()=>{if(window.confirm('开始新的旅途？这会重置当前浏览器中的游戏进度。')){saved={dash:false,bolt:false,won:false,checkpoint:0,...freshProgress()};persist();location.reload();}});
if(saved.visited.length>1||saved.dash)document.getElementById('start').innerHTML='继续旅途 <span>↗</span>';
document.getElementById('start').onclick=start;
document.getElementById('map-button').onclick=toggleMap;
updateLabels();

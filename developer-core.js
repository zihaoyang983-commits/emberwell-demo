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

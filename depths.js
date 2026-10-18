'use strict';
// Real drop entrances lead into optional chambers below the existing route.
const depthParents=[1,6,16,26,36,46],depthNames=['棘齿旧井','孢根暗渠','炉底压舱','镜潮沉窟','断钟墓井','星锁深穴'];
const depthHints=['跳过棘齿，观察摆锤的回摆。','孢子发亮后喷发；等待喷口熄灭。','压机红光后落下；蒸汽喷发前有蓄压。','浮镜台随潮往返；水晶尖刺留在岸边。','跳过摆锤，利用上劈敲钟的光桥。','扫光封印发亮前离开标线，星刺按次序亮起。'];
let depthMarks=new Set(),depthEntryFade=0;
for(let ch=0;ch<6;ch++){
 const parent=depthParents[ch],r=rooms[parent],id=rooms.length,z=chapters[ch],first=r.ground[0],next=r.ground[1],gap={x:first[0]+first[1],w:next[0]-(first[0]+first[1])};
 r.depthEntrance={...gap,target:id};
 const under={name:depthNames[ch],label:'BENEATH THE BROKEN PATH',width:2450,color:z.color,accent:z.accent,chapter:ch,left:null,right:null,optional:true,depth:true,parent,returnX:gap.x+gap.w+75,mapX:10.05,mapY:ch,ground:ch===3?[[0,680],[880,820],[1900,550]]:[[0,2450]],platforms:[[340,440,120],[910,405,140],[1510,420,145]],enemies:[],pickups:[],doors:[],switches:[],barriers:[],mechanisms:[],spikes:[{x:550,w:105},{x:1120,w:130},{x:1750,w:105}],beacons:[460,1030,1620],rewardX:2210};
 rooms.push(under);
 const kinds=[['pendulum'],['spore','spore'],['piston','steam'],['ferry','ferry'],['pendulum','bell'],['beam','beam']][ch];
 kinds.forEach((kind,i)=>{const m=addDevice(id,kind,[800,1430][i]);delete m.cache;});
 if(ch===4){under.platforms.push([1265,440,120]);}
}
function depthRewardId(r=rooms[room]){return 'depth-clear-'+r.chapter;}
function claimDepthReward(){const r=rooms[room];if(!r.depth||depthMarks.size!==3||Math.abs(player.x+13-r.rewardX)>85||Math.abs(player.y+23-510)>90)return false;
 if(saved.collected.includes(depthRewardId(r))){toast('此处的秘藏已经领取。出口仍可返回主路。',3);return true;}
 saved.collected.push(depthRewardId(r));saved.fragments.push('depth-heart-'+r.chapter);saved.coins+=90+r.chapter*30;player.soul=Math.min(99,player.soul+33);persist();spawn(r.rewardX,490,45,r.accent,200);flourish(r.rewardX,490,'burst',r.accent,.8);sound('rest');
 showCard('井下秘藏 · '+r.name,'点亮三枚路灯，穿过了机关路线。\n获得 '+(90+r.chapter*30)+' 光屑、1 枚心灯碎片与 33 余烬。\n心灯碎片每累计三枚提高生命上限。\n右侧升井出口可返回原来的主路。');return true;
}
function leaveDepth(){const r=rooms[room];if(!r.depth)return false;const parent=r.parent,x=r.returnX;enterRoom(parent);player.x=x;player.y=GROUND-player.h;player.vy=0;player.onGround=true;camera=Math.max(0,Math.min(rooms[parent].width-W,x-W*.44));toast('升井归来 · '+rooms[parent].name,3);return true;}
handlePitFall=function(){const r=rooms[room];
 if(r.depth){player.inv=0;harm(1,player.x-1);if(player.hp>0){player.x=90;player.y=170;player.vx=player.vy=0;player.inv=1.5;depthMarks.clear();camera=0;toast('跌落尖刺深处 · 回到井口，已领取的秘藏仍然保留。');}return true;}
 const e=r.depthEntrance;if(!e||player.x+13<e.x-8||player.x+13>e.x+e.w+8)return false;
 enterRoom(e.target);player.x=90;player.y=150;player.vx=0;player.vy=130;player.onGround=false;camera=0;depthEntryFade=.65;toast('落入 '+rooms[room].name+' · 点亮三枚路灯后，在秘藏旁按 E。入口也能返回主路。',6);return true;
};
const previousDepthEnter=enterRoom;enterRoom=function(id,side=null){const result=previousDepthEnter(id,side);depthMarks.clear();depthEntryFade=0;return result;};
const previousDepthInteract=interact;interact=function(){const r=rooms[room];if(mode==='playing'&&player.dead<=0&&r.depth){if(Math.abs(player.x+13-120)<65||Math.abs(player.x+13-2350)<65){leaveDepth();return;}if(claimDepthReward())return;if(Math.abs(player.x+13-r.rewardX)<85){toast('秘藏尚未开启 · 点亮路线上的三枚路灯 '+depthMarks.size+'/3',4);return;}}previousDepthInteract();};
const previousDepthUpdate=update;update=function(dt){const id=room,active=mode==='playing'&&player.dead<=0;previousDepthUpdate(dt);if(!active||room!==id||mode!=='playing'||player.dead>0)return;depthEntryFade=Math.max(0,depthEntryFade-dt);
 const r=rooms[room];if(!r.depth)return;
 for(let i=0;i<r.beacons.length;i++)if(!depthMarks.has(i)&&Math.abs(player.x+13-r.beacons[i])<55&&player.y+23>260&&player.y+23<560){depthMarks.add(i);spawn(r.beacons[i],470,16,r.accent,90);sound('rest');toast('井下路灯 '+depthMarks.size+'/3 · '+depthHints[r.chapter],4);}
 for(const s of r.spikes){const active=r.chapter!==5||(varietyClock+s.x*.003)%3.8>1.5;if(active&&overlap(player,{x:s.x,y:530,w:s.w,h:20}))harm(1,s.x+s.w/2);}
};
function drawDepthGate(x,name,c){arch(x-24,445,48,105,c+'99',3);line(x-6,485,x+6,475,c,2);line(x+6,475,x+6,496,c,2);line(x+6,475,x+17,484,c,2);glow(x,502,42,c+'22');text(name,x,425,11,c,'center');if(Math.abs(player.x+13-x)<65)interactionPrompt('E 升井返回主路',x,395);}
const previousDepthTerrain=terrain;terrain=function(){previousDepthTerrain();const r=rooms[room],e=r.depthEntrance;
 if(e){const x=e.x+e.w/2;ctx.save();ctx.globalAlpha=.8;line(e.x,GROUND+6,e.x+18,GROUND+65,'#9bb8a188',3);line(e.x+e.w,GROUND+6,e.x+e.w-18,GROUND+65,'#9bb8a188',3);for(let i=0;i<7;i++){const y=GROUND+20+i*12;ellipse(x+Math.sin(time+i)*8,y,1.5,1.5,r.accent+'aa');}ctx.restore();text('↓ 井下秘境',x,GROUND+74,11,r.accent,'center');if(Math.abs(player.x+13-x)<190)interactionPrompt('可落入探索 · 出口返回主路',x,GROUND-28);}
 // Non-entrance gaps show the danger at the bottom rather than an empty void.
 if(!r.depth){for(let i=1;i<r.ground.length;i++){const x=r.ground[i-1][0]+r.ground[i-1][1],end=r.ground[i][0];if(e&&x===e.x)continue;for(let sx=x+5;sx<end;sx+=21)path([[sx,H],[sx+10,H-26],[sx+20,H]],'#62737a');}return;}
 const c=r.accent;for(let x=0;x<r.width;x+=240){line(x,70,x+30,360,c+'22',2);for(let y=80;y<330;y+=50)line(x+6,y,x+18,y+12,c+'33',1);}
 for(const m of roomDevices){if(m.kind==='piston'){const p=pistonPosition(m);ctx.strokeStyle='#d4b58c88';ctx.lineWidth=2;ctx.strokeRect(m.x-37,p.y+5,74,84);for(let i=-1;i<=1;i++){ellipse(m.x+i*25,p.y+13,2,2,'#e8cc9e');ellipse(m.x+i*25,p.y+81,2,2,'#e8cc9e');}for(let i=0;i<5;i++)path([[m.x-39+i*16,p.y+95],[m.x-31+i*16,p.y+107],[m.x-23+i*16,p.y+95]],'#a9967d');runeRing(m.x,p.y+38,12,p.warning?'#ffc187':'#967e61',varietyClock*.4);}if(['steam','spore'].includes(m.kind)){for(const side of [-1,1])line(m.x+side*19,548,m.x+side*32,536,c+'88',3);runeRing(m.x,540,13,c+'66',varietyClock*.3);}}
 drawDepthGate(120,'原路升井',c);drawDepthGate(2350,'秘藏出口',c);
 for(const s of r.spikes){const t=(varietyClock+s.x*.003)%3.8,on=r.chapter!==5||t>1.5;for(let x=s.x;x<s.x+s.w;x+=18){path([[x,550],[x+8,on?526:543],[x+17,550]],on?c:'#4e5b69');line(x+8,on?529:546,x+12,546,'#edf2d577',1);}if(r.chapter===5&&t>.75&&t<1.5){line(s.x,546,s.x+s.w,546,c,2);text('!',s.x+s.w/2,515,15,c,'center');}}
 for(let i=0;i<r.beacons.length;i++){const x=r.beacons[i],lit=depthMarks.has(i)||saved.collected.includes(depthRewardId(r));line(x,487,x,550,'#6b7c77',4);runeRing(x,473,14,lit?c:'#677e7c',time*.3);ellipse(x,473,5,7,lit?'#f7ecc0':'#687a78');if(lit)glow(x,473,43,c+'22');text(String(i+1),x,450,11,lit?'#e9dfbc':'#7f9a91','center');}
 const unlocked=depthMarks.size===3,claimed=saved.collected.includes(depthRewardId(r)),x=r.rewardX;illustrationDepth++;path([[x-23,549],[x-23,521],[x-17,509],[x+17,509],[x+23,521],[x+23,549]],claimed?'#637b77':unlocked?'#d5bd84':'#817866');line(x-23,523,x+23,523,'#e9d4a599',2);runeRing(x,522,6,claimed?'#798980':'#f0d7a3',time*.4);illustrationDepth--;if(unlocked&&!claimed)glow(x,510,75,c+'33');text(claimed?'秘藏已领取':'光屑 + 心灯碎片',x,485,12,c,'center');if(Math.abs(player.x+13-x)<85)interactionPrompt(claimed?'已领取 · 右侧升井返回':unlocked?'E 开启井下秘藏':'路灯 '+depthMarks.size+'/3',x,450);
};
const previousDepthHud=hud;hud=function(){previousDepthHud();if(rooms[room].depth){text('井下路灯 '+depthMarks.size+'/3 · 首次奖励：光屑 + 心灯碎片',W/2,178,12,rooms[room].accent,'center');text(depthHints[rooms[room].chapter],W/2,199,11,'#b4cabc','center');}};
const previousDepthRender=render;render=function(){previousDepthRender();if(mode==='playing'&&depthEntryFade>0){ctx.fillStyle='#06161e'+Math.round(depthEntryFade/.65*120).toString(16).padStart(2,'0');ctx.fillRect(0,0,W,H);}};

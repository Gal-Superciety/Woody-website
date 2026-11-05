'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createForestAudio } from './audio';
import { renderForest3D } from './renderer3d.mjs';
import { createDragonGuardian, createSmallDragon, dragonVolley, hitDragon } from './dragons.mjs';
import Leaderboard from './Leaderboard';
import ForestPlayerGate from './ForestPlayerGate';

const W = 960, H = 540, WORLD = 7900, FLOOR = 456;
const LEVELS=[
 {name:'The Enchanted Forest',difficulty:'EASY',start:65,end:2550,seconds:90},
 {name:'The Dangerous Woods',difficulty:'MEDIUM',start:2950,end:5500,seconds:78},
 {name:'Shadow WOODY Kingdom',difficulty:'HARD',start:5980,end:WORLD-90,seconds:95}
];
const ROUND_SECONDS=LEVELS[0].seconds;
const solids = [
  {x:0,y:FLOOR,w:620,h:120},{x:760,y:FLOOR,w:570,h:120},
  {x:1440,y:FLOOR,w:590,h:120},{x:2140,y:FLOOR,w:620,h:120},
  {x:2890,y:FLOOR,w:1010,h:120},
  {x:310,y:365,w:160,h:20},{x:550,y:298,w:145,h:20},
  {x:845,y:352,w:155,h:20},{x:1100,y:305,w:145,h:20},
  {x:1500,y:355,w:155,h:20},{x:1740,y:292,w:150,h:20},
  {x:2020,y:338,w:130,h:20},{x:2310,y:354,w:165,h:20},
  {x:2610,y:305,w:160,h:20},{x:2960,y:365,w:160,h:20},
  {x:3280,y:320,w:180,h:20},
  {x:4020,y:FLOOR,w:460,h:120},{x:4620,y:FLOOR,w:510,h:120},
  {x:5280,y:FLOOR,w:410,h:120},{x:5910,y:FLOOR,w:470,h:120},
  {x:6550,y:FLOOR,w:530,h:120},{x:7220,y:FLOOR,w:680,h:120},
  {x:4200,y:326,w:125,h:20},{x:4790,y:342,w:120,h:20},
  {x:5400,y:335,w:120,h:20},{x:6100,y:328,w:125,h:20},
  {x:6750,y:345,w:135,h:20},{x:7370,y:310,w:145,h:20},
  // Short, reachable stair runs teach the jump rhythm before later hazards.
  {x:430,y:320,w:88,h:17},{x:1000,y:315,w:84,h:17},{x:2475,y:315,w:90,h:17},
  {x:3430,y:277,w:92,h:17},{x:3570,y:235,w:92,h:17},{x:4328,y:282,w:88,h:17},
  {x:6200,y:286,w:90,h:17},{x:6300,y:246,w:90,h:17},{x:6660,y:300,w:92,h:17},
  {x:7500,y:270,w:90,h:17},{x:7620,y:230,w:90,h:17}
];
const coinPositions = [
  [350,323],[410,323],[585,254],[642,254],[825,405],[900,310],
  [1150,264],[1210,264],[1515,312],[1580,312],[1770,249],[1850,249],
  [2080,290],[2350,312],[2410,312],[2660,262],[3020,320],
  [3330,277],[3410,277],[3660,410],
  [4050,407],[4240,285],[4470,375],[4680,408],[4830,300],
  [5090,402],[5320,402],[5430,295],[5720,365],[5970,406],
  [6130,285],[6380,380],[6600,400],[6800,300],[7080,380],
  [7270,405],[7420,265],[7580,375],[7750,404]
];
const enemyPositions = [960,1630,2380,3070,3500,4180,4800,5440,6080,6690,7410];
// Low fallen trunks and thorny stumps are ground hazards: jump OVER them.
// Positions avoid the start, checkpoints and landing zones beside water gaps.
const logPositions = [
 {x:235,w:62,h:33,type:'log'},{x:1040,w:42,h:42,type:'stump'},
 {x:1540,w:66,h:32,type:'log'},{x:1850,w:42,h:43,type:'stump'},
 {x:2460,w:64,h:35,type:'log'},{x:3150,w:46,h:46,type:'stump'},
 {x:3650,w:65,h:32,type:'log'},{x:4310,w:43,h:44,type:'stump'},
 {x:4890,w:64,h:33,type:'log'},{x:5530,w:43,h:45,type:'stump'},
 {x:6190,w:70,h:34,type:'log'},{x:6850,w:44,h:43,type:'stump'},
 {x:7520,w:65,h:35,type:'log'},
 {x:3820,w:54,h:42,type:'stump'},{x:6365,w:58,h:40,type:'stump'}
];
const crumblePositions = [
 {x:3870,y:360,w:95,h:18},{x:4480,y:370,w:98,h:18},
 {x:5140,y:351,w:95,h:18},{x:5700,y:350,w:104,h:18},
 {x:6385,y:352,w:98,h:18},{x:7100,y:345,w:100,h:18}
];
const powerups = [[1120,265],[2570,267],[4140,285],[5580,295],[6950,292]];
// Amber flame orbs grant limited ranged attacks against forest creatures.
const flamePickups = [[850,403],[2220,407],[3370,279],[4750,405],[6030,403],[6620,403],[7040,403],[7310,405],[7590,403]];
const movingPlatforms = [{x:1280,y:348,w:106,h:17,range:65,phase:0},{x:2740,y:335,w:115,h:17,range:70,phase:2},
 {x:4560,y:324,w:108,h:17,range:48,phase:1},
 {x:5800,y:332,w:108,h:17,range:52,phase:3},
 {x:7100,y:310,w:110,h:17,range:46,phase:4}];
const START = {x:65,y:FLOOR-58,vx:0,vy:0,w:43,h:58,ground:false,facing:1,invuln:0,jumps:0,doubleJump:0,flame:0,shotCooldown:0,jumpHeld:false};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function createGame(level=1){
 const config=LEVELS[level-1];
 return {level,config,player:{...START,x:config.start},coins:coinPositions.map(([x,y])=>({x,y,taken:false})),
 enemies:enemyPositions.map((x,i)=>createSmallDragon(x,i*1.8,level)),
 guardian:createDragonGuardian(level),
 keys:{left:false,right:false,jump:false,shoot:false},camera:Math.max(0,config.start-180),score:0,lives:3,checkpoint:config.start,
 powerups:powerups.map(([x,y])=>({x,y,taken:false})),moving:movingPlatforms.map(v=>({...v,currentY:v.y})),
 crumble:crumblePositions.map(v=>({...v,triggered:false,timer:0,fallen:false})),
 logs:logPositions.map(v=>({...v,y:FLOOR-v.h})),
 flames:flamePickups.map(([x,y])=>({x,y,taken:false})),shots:[],
 shadows:level===3?[{x:6250,origin:6250,hp:2,last:0},{x:6790,origin:6790,hp:2,last:0},{x:7380,origin:7380,hp:2,last:0}]:[],
 boss:level===3?{x:7680,y:FLOOR-75,w:65,h:75,hp:10,maxHp:10,last:0,alive:true}:null,
 enemyShots:[],bossCleared:false,
 elapsed:0,remaining:config.seconds,timeouts:0,notice:'',noticeUntil:0,ended:false,won:false,particles:[],last:0};
}
export default function ForestAdventure(){
 const canvas=useRef(null),game=useRef(null),sprite=useRef(null),smallDragonSprite=useRef(null),guardianDragonSprite=useRef(null),raf=useRef(null),arcade=useRef(null),audio=useRef(null);
 const [soundOn,setSoundOn]=useState(true);
 const [profileReady,setProfileReady]=useState(false);
 const toggleSound=()=>{const next=!soundOn;setSoundOn(next);audio.current?.setEnabled(next);};
 useEffect(()=>{audio.current=createForestAudio();return()=>{audio.current?.dispose();audio.current=null;};},[]);
 const [fullScreen,setFullScreen]=useState(false);
 const enterFullscreen=async()=>{
   try{
     if(!document.fullscreenElement){await arcade.current?.requestFullscreen?.();try{await screen.orientation?.lock?.('landscape');}catch{}}
     else await document.exitFullscreen?.();
   }catch{ /* Browser may disallow orientation lock; responsive layout still works. */ }
 };
 useEffect(()=>{
   const onChange=()=>setFullScreen(Boolean(document.fullscreenElement));
   document.addEventListener('fullscreenchange',onChange);
   return()=>document.removeEventListener('fullscreenchange',onChange);
 },[]);
 const [selectedLevel,setSelectedLevel]=useState(1),[unlocked,setUnlocked]=useState(1);
 const [records,setRecords]=useState({times:{},bossWins:0});
 const [mode,setMode]=useState('ready'),[best,setBest]=useState(0),[hud,setHud]=useState({score:0,lives:3,time:0,progress:0,boost:0,ammo:0,remaining:ROUND_SECONDS,notice:''});
 const start=useCallback((level=selectedLevel)=>{audio.current?.setBoss(false);audio.current?.start(level);game.current=createGame(level);setHud({score:0,lives:3,time:0,progress:0,boost:0,ammo:0,remaining:LEVELS[level-1].seconds,notice:''});setMode('playing');},[selectedLevel]);
 useEffect(()=>{
   try { setBest(Number(localStorage.getItem('woody-adventure-best-v1')) || 0);setUnlocked(Math.min(3,Math.max(1,Number(localStorage.getItem('woody-adventure-unlocked-v1'))||1)));const saved=JSON.parse(localStorage.getItem('woody-adventure-records-v1')||'{}');setRecords({times:saved.times||{},bossWins:Number(saved.bossWins)||0}); } catch {}
   const img=new Image();img.src='/woody-adventure-sprite.svg';img.onload=()=>{sprite.current=img;};
   const smallDragon=new Image();smallDragon.src='/forest-dragon-small.svg';smallDragon.onload=()=>{smallDragonSprite.current=smallDragon;};
   const guardianDragon=new Image();guardianDragon.src='/forest-dragon-guardian.svg';guardianDragon.onload=()=>{guardianDragonSprite.current=guardianDragon;};
 },[]);
 useEffect(()=>{
  const key=(e,down)=>{
   const g=game.current;if(!g)return;
   if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyF'].includes(e.code))e.preventDefault();
   if(['ArrowLeft','KeyA'].includes(e.code))g.keys.left=down;
   if(['ArrowRight','KeyD'].includes(e.code))g.keys.right=down;
   if(['ArrowUp','Space','KeyW'].includes(e.code))g.keys.jump=down;
   if(e.code==='KeyF')g.keys.shoot=down;
  };
  const kd=e=>key(e,true),ku=e=>key(e,false);
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  const blur=()=>{if(game.current)game.current.keys={left:false,right:false,jump:false,shoot:false};};
  window.addEventListener('blur',blur);
  return ()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);window.removeEventListener('blur',blur);};
 },[]);
 useEffect(()=>{
  if(!profileReady)return;
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;
  let alive=true,previous=0,uiClock=0;
  const draw=(now)=>{
   if(!alive)return;
   // Expand the actual world viewport instead of stretching a 16:9 picture.
   // Keep the original 540-unit vertical scale so WOODY stays proportional.
   const stage=canvas.current?.parentElement;
   const ratio=stage?.clientHeight?stage.clientWidth/stage.clientHeight:W/H;
   const viewW=Math.max(W,Math.min(2400,Math.round(H*ratio)));
   if(canvas.current&&canvas.current.width!==viewW)canvas.current.width=viewW;
   const dt=Math.min((now-previous)/1000||0,.035);previous=now;
   const g=game.current;
   if(g&&!g.ended){
    const p=g.player,oldBottom=p.y+p.h;
    g.elapsed+=dt;g.remaining=Math.max(0,g.remaining-dt);p.invuln=Math.max(0,p.invuln-dt);
    if(g.remaining<=0){
      // Time-out is the only hazard that ignores checkpoints. Keep earned score,
      // collected coins, crystals and defeated enemies, but restart the map.
      audio.current?.play('hit');g.lives--;g.timeouts++;g.checkpoint=g.config.start;g.remaining=g.config.seconds;
      g.crumble=crumblePositions.map(v=>({...v,triggered:false,timer:0,fallen:false}));
      p.x=g.config.start;p.y=START.y;p.vx=0;p.vy=0;p.ground=false;p.jumps=0;p.jumpHeld=false;
      p.invuln=1.5;g.camera=0;g.keys.jump=false;g.keys.shoot=false;g.shots=[];
      g.notice=g.lives>0?'TIME UP! ONE LIFE LOST — BACK TO START':'TIME UP! GAME OVER';
      g.noticeUntil=g.elapsed+3;
      if(g.lives<=0){g.ended=true;setMode('over');audio.current?.play('over');audio.current?.stop();}
    }
    p.vx=(Number(g.keys.right)-Number(g.keys.left))*280;
    if(p.vx)p.facing=Math.sign(p.vx);
    if(g.keys.jump&&!p.jumpHeld){audio.current?.play(p.ground?'jump':'double');
      if(p.ground){p.vy=-620;p.ground=false;p.jumps=1;}
      else if(p.doubleJump>0&&p.jumps===1){p.vy=-570;p.jumps=2;p.doubleJump--;g.score+=15;
       for(let i=0;i<16;i++)g.particles.push({x:p.x+p.w/2,y:p.y+p.h,vx:(Math.random()-.5)*250,vy:(Math.random()-.5)*140,life:.65});}
    }
    p.jumpHeld=g.keys.jump;
    p.shotCooldown=Math.max(0,p.shotCooldown-dt);
    if(g.keys.shoot&&p.flame>0&&p.shotCooldown===0){
      p.flame--;p.shotCooldown=.28;audio.current?.play('fire');
      g.shots.push({x:p.x+p.w/2+p.facing*24,y:p.y+25,vx:p.facing*650,life:.85});
      for(let i=0;i<6;i++)g.particles.push({x:p.x+p.w/2+p.facing*26,y:p.y+25,vx:p.facing*(80+Math.random()*160),vy:(Math.random()-.5)*100,life:.28});
    }
    p.x=Math.max(g.config.start,Math.min(g.config.end-p.w/2,p.x+p.vx*dt));
    p.vy=Math.min(1000,p.vy+1750*dt);p.y+=p.vy*dt;p.ground=false;
    for(const platform of g.moving){platform.currentY=platform.y+Math.sin(g.elapsed*1.4+platform.phase)*platform.range;}
    for(const platform of g.crumble){
      if(platform.triggered&&!platform.fallen){platform.timer+=dt;if(platform.timer>=0.85)platform.fallen=true;}
    }
    for(const s of [...solids,...g.moving.map(v=>({...v,y:v.currentY})),...g.crumble.filter(v=>!v.fallen)]){
     if(p.x+p.w>s.x+5&&p.x<s.x+s.w-5&&oldBottom<=s.y+9&&p.y+p.h>=s.y&&p.vy>=0){
       p.y=s.y-p.h;p.vy=0;p.ground=true;p.jumps=0;
       if('triggered' in s&&!s.triggered){s.triggered=true;s.timer=0;}
     }
    }
    if(g.level===1&&p.x>2200)g.checkpoint=2200;
    if(g.level===2&&p.x>4680)g.checkpoint=4700;
    if(g.level===3&&p.x>6610)g.checkpoint=6610;
    if(g.level===3&&p.x>7270)g.checkpoint=7310;
    for(const power of g.powerups){
      if(!power.taken&&overlap(p,{x:power.x-18,y:power.y-18,w:36,h:36})){
        power.taken=true;audio.current?.play('power');p.doubleJump=Math.min(3,p.doubleJump+3);g.score+=100;
        for(let i=0;i<24;i++)g.particles.push({x:power.x,y:power.y,vx:(Math.random()-.5)*320,vy:(Math.random()-.5)*240,life:1});
      }
    }
    for(const flame of g.flames){
      if(!flame.taken&&overlap(p,{x:flame.x-16,y:flame.y-17,w:32,h:34})){
        flame.taken=true;audio.current?.play('power');p.flame=Math.min(12,p.flame+5);g.score+=50;
        g.notice='FLAME POWER! +5 FIREBALLS';g.noticeUntil=g.elapsed+2;
      }
    }
    for(const c of g.coins){
      if(!c.taken&&overlap(p,{x:c.x-12,y:c.y-12,w:24,h:24})){
       c.taken=true;g.score+=25;audio.current?.play('coin');
       for(let i=0;i<7;i++)g.particles.push({x:c.x,y:c.y,vx:(Math.random()-.5)*130,vy:-Math.random()*170,life:.5});
      }
    }
    // Shadow soldiers and the king take fireball damage; the king has 3 attack phases.
    if(g.level===3){
      for(const soldier of g.shadows){
        if(soldier.hp<=0)continue;
        soldier.x=soldier.origin+Math.sin(g.elapsed*1.7+soldier.origin)*35;
        if(g.elapsed-soldier.last>2.15&&Math.abs(p.x-soldier.x)<510){
          soldier.last=g.elapsed;
          g.enemyShots.push({x:soldier.x,y:FLOOR-36,vx:p.x<soldier.x?-230:230,vy:0,life:2.6});
        }
      }
      const b=g.boss;
      if(b?.alive&&Math.abs(p.x-b.x)<650){audio.current?.setBoss(true);
        const phase=b.hp<=3?3:b.hp<=5?2:1;
        const cadence=phase===3?.68:phase===2?1.05:1.6;
        if(g.elapsed-b.last>cadence){
          b.last=g.elapsed;
          const dir=p.x<b.x?-1:1;
          for(const vy of (phase===1?[0]:phase===2?[-95,0,95]:[-155,-75,0,75,155])){
            g.enemyShots.push({x:b.x+32,y:b.y+32,vx:dir*(phase===3?330:270),vy,life:2.4});
          }
        }
      }
    }
    // Small dragons weave through the air and fire at WOODY; guardians join the fight in later stages.
    for(const dragon of [...g.enemies,g.guardian].filter(Boolean)){
      if(!dragon.alive)continue;
      dragon.facing=p.x<dragon.x?-1:1;
      if(dragon.kind!=='small'){
        dragon.x=dragon.origin+Math.sin(g.elapsed*.72+dragon.phase)*18;
        dragon.y=dragon.baseY+Math.sin(g.elapsed*1.25+dragon.phase)*6;
      }
      const volley=dragonVolley(dragon,p.x,g.elapsed);dragon.lastShot=volley.lastShot;
      g.enemyShots.push(...volley.shots);
    }
    for(const shot of g.enemyShots){
      shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
      if(shot.life>0&&p.invuln===0&&overlap({x:shot.x-9,y:shot.y-9,w:18,h:18},p)){
        shot.life=0;audio.current?.play('hit');g.lives--;p.invuln=1.5;
        if(g.lives<=0){g.ended=true;setMode('over');audio.current?.play('over');audio.current?.stop();}
        else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;g.enemyShots=[];}
      }
    }
    g.enemyShots=g.enemyShots.filter(v=>v.life>0);
    // Fireballs hit the first living enemy they reach and cannot pass through terrain.
    for(const shot of g.shots){
      shot.x+=shot.vx*dt;shot.life-=dt;
      for(const enemy of g.enemies){
        if(enemy.alive&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},enemy)){
          Object.assign(enemy,hitDragon(enemy));shot.life=0;
          if(!enemy.alive){g.score+=75;audio.current?.play('enemy');
            for(let i=0;i<18;i++)g.particles.push({x:enemy.x+enemy.w/2,y:enemy.y+enemy.h/2,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*230,life:.7});
          }else{g.score+=15;}
          break;
        }
      }
      if(shot.life>0&&g.guardian?.alive&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},g.guardian)){
        Object.assign(g.guardian,hitDragon(g.guardian));shot.life=0;g.score+=30;
        if(!g.guardian.alive){g.score+=500;audio.current?.play('boss');g.notice=`${g.guardian.kind==='ancient'?'ANCIENT':'ELDER'} DRAGON DEFEATED!`;g.noticeUntil=g.elapsed+3.5;
          for(let i=0;i<36;i++)g.particles.push({x:g.guardian.x+g.guardian.w/2,y:g.guardian.y+g.guardian.h/2,vx:(Math.random()-.5)*360,vy:(Math.random()-.5)*300,life:1});
        }else{audio.current?.play('enemy');}
      }
      if(g.level===3&&shot.life>0){
        for(const soldier of g.shadows){
          if(soldier.hp>0&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},{x:soldier.x,y:FLOOR-55,w:43,h:55})){
            soldier.hp--;shot.life=0;if(!soldier.hp){g.score+=150;audio.current?.play('enemy');}break;
          }
        }
        const b=g.boss;
        if(shot.life>0&&b?.alive&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},b)){
          b.hp--;shot.life=0;g.score+=35;
          if(b.hp<=0){audio.current?.setBoss(false);audio.current?.play('boss');b.alive=false;g.bossCleared=true;g.score+=1000;g.notice='SHADOW WOODY KING DEFEATED!';g.noticeUntil=g.elapsed+4;}
        }
      }
      if(solids.some(v=>overlap({x:shot.x-5,y:shot.y-5,w:10,h:10},v)))shot.life=0;
    }
    g.shots=g.shots.filter(v=>v.life>0);
    // Keep both dragon and king encounters beatable if WOODY spends every flame orb.
    if(g.guardian?.alive&&p.x>g.guardian.x-90&&p.flame===0&&g.elapsed-(g.lastAmmoRefill||0)>7){
      p.flame=5;g.lastAmmoRefill=g.elapsed;g.notice='DRAGON ARENA: +5 FIREBALLS';g.noticeUntil=g.elapsed+1.8;
    }
    if(g.level===3&&g.boss?.alive&&p.x>7480&&p.flame===0&&g.elapsed-(g.lastAmmoRefill||0)>7){
      p.flame=5;g.lastAmmoRefill=g.elapsed;
      g.notice='BOSS ARENA: +5 FIREBALLS';g.noticeUntil=g.elapsed+1.8;
    }
    for(const e of g.enemies){
     if(!e.alive)continue;
     e.x=e.origin+Math.sin(g.elapsed*1.4+e.phase)*50;e.y=FLOOR-91+Math.sin(g.elapsed*2.5+e.phase)*13;e.facing=p.x<e.x?-1:1;
     if(overlap(p,e)&&p.invuln===0){
      if(p.vy>120&&oldBottom<=e.y+14){Object.assign(e,hitDragon(e));p.vy=-390;g.score+=e.alive?15:75;audio.current?.play('enemy');}
      else{
       audio.current?.play('hit');g.lives--;p.invuln=1.4;
       if(g.lives<=0){g.ended=true;setMode('over');audio.current?.play('over');audio.current?.stop();}
       else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
      }
     }
    }
    if(g.guardian?.alive&&p.invuln===0&&overlap(p,g.guardian)){
      audio.current?.play('hit');g.lives--;p.invuln=1.5;
      if(g.lives<=0){g.ended=true;setMode('over');audio.current?.play('over');audio.current?.stop();}
      else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
    }
    if(g.level===3&&!g.ended&&p.invuln===0){
      for(const soldier of g.shadows){
        if(soldier.hp>0&&overlap(p,{x:soldier.x,y:FLOOR-55,w:43,h:55})){
          audio.current?.play('hit');g.lives--;p.invuln=1.5;
          if(g.lives<=0){g.ended=true;setMode('over');audio.current?.play('over');audio.current?.stop();}
          else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
          break;
        }
      }
      if(g.boss?.alive&&p.invuln===0&&overlap(p,g.boss)){
        audio.current?.play('hit');g.lives--;p.invuln=1.5;
        if(g.lives<=0){g.ended=true;setMode('over');audio.current?.play('over');audio.current?.stop();}
        else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
      }
    }
    // Logs and stumps cannot be defeated by stomping: clear them with a jump.
    if(p.invuln===0&&!g.ended){
      for(const obstacle of g.logs){
        // Tight hitbox allows the bird's feet to visually clear the wood.
        if(overlap({x:p.x+7,y:p.y+9,w:p.w-14,h:p.h-15},{x:obstacle.x+5,y:obstacle.y+4,w:obstacle.w-10,h:obstacle.h-5})){
          audio.current?.play('hit');g.lives--;p.invuln=1.5;
          if(g.lives<=0){g.ended=true;setMode('over');audio.current?.play('over');audio.current?.stop();}
          else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vx=0;p.vy=0;p.jumps=0;p.ground=false;}
          break;
        }
      }
    }
    if(p.y>H+150&&!g.ended){audio.current?.play('hit');g.lives--;if(g.lives<=0){g.ended=true;setMode('over');audio.current?.play('over');audio.current?.stop();}else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}}
    if(!g.ended&&p.x>=g.config.end-155&&(g.level!==3||g.bossCleared)){
      g.ended=true;g.won=true;g.score+=500;audio.current?.play('win');audio.current?.stop();
      setRecords(old=>{const times={...old.times,[g.level]:Math.min(old.times[g.level]??Infinity,Math.ceil(g.elapsed))};const next={times,bossWins:old.bossWins+(g.level===3?1:0)};try{localStorage.setItem('woody-adventure-records-v1',JSON.stringify(next));}catch{}return next;});
      if(g.level<3){const next=g.level+1;setUnlocked(old=>Math.max(old,next));try{localStorage.setItem('woody-adventure-unlocked-v1',String(next));}catch{}setSelectedLevel(next);}
      setMode('won');
    }
    g.camera+=(Math.max(0,Math.min(WORLD-viewW,p.x-viewW*.34))-g.camera)*Math.min(1,dt*5);
    g.particles=g.particles.filter(v=>v.life>0);
    for(const v of g.particles){v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=250*dt;v.life-=dt;}
    uiClock+=dt;
    if(g.ended){setBest(previous=>{const next=Math.max(previous,g.score);try{localStorage.setItem('woody-adventure-best-v1',String(next));}catch{}return next;});}
    if(uiClock>.12){setHud({score:g.score,lives:g.lives,time:Math.floor(g.elapsed),progress:Math.min(100,Math.floor((p.x-g.config.start)/(g.config.end-g.config.start)*100)),boost:p.doubleJump,ammo:p.flame,remaining:Math.ceil(g.remaining),notice:g.elapsed<g.noticeUntil?g.notice:''});uiClock=0;}
   }
   const cam=g?.camera||0,clock=g?.elapsed||now/1000;
   renderForest3D(ctx,{g,cam,viewW,H,WORLD,solids,clock,sprite:sprite.current,smallDragonSprite:smallDragonSprite.current,guardianDragonSprite:guardianDragonSprite.current});
   raf.current=requestAnimationFrame(draw);
  };
  raf.current=requestAnimationFrame(draw);
  return()=>{alive=false;cancelAnimationFrame(raf.current);};
 },[profileReady]);
 const press=(key,down)=>{if(game.current)game.current.keys[key]=down;};
 const button=(key,label)=>(
   <button type="button" aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}}
    onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)}
    className="woody-control min-w-0 flex-1 select-none rounded-xl border border-emerald-300/50 bg-emerald-900/80 px-2 py-3 text-sm font-bold text-white active:bg-orange-500 touch-none sm:px-5 sm:py-4 sm:text-lg">{label}</button>
 );
 if(!profileReady)return <ForestPlayerGate onReady={()=>setProfileReady(true)} />;
 return <main className="woody-page mx-auto max-w-6xl px-2 py-3 md:px-8 md:py-8">
   <section className="woody-intro mb-3 rounded-3xl border border-emerald-300/20 bg-gradient-to-r from-emerald-950/90 to-sky-950/80 p-6">
    <span className="text-xs font-bold uppercase tracking-[.3em] text-emerald-300">WOODY ARCADE · THREE LEVELS</span>
    <h1 className="mt-2 text-3xl font-black text-orange-300 md:text-5xl">{LEVELS[game.current?.level-1||selectedLevel-1].name}</h1>
    <p className="mt-2 text-sm text-white/75">Explore the forest, leap over fallen trees and sharp stumps, collect golden WOODY coins and reach the portal before time runs out.</p>
   </section>
   <section ref={arcade} className="woody-arcade overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950 p-1.5 shadow-[0_0_50px_rgba(16,185,129,.12)] md:rounded-3xl md:p-4">
    <div className="woody-hud mb-1.5 flex flex-wrap items-center gap-1 text-[10px] font-bold text-white/90 sm:mb-3 sm:gap-3 sm:text-sm">
      <button type="button" onClick={toggleSound} aria-label={soundOn?'Mute game sounds':'Enable game sounds'} className="woody-sound rounded-lg border border-cyan-300/50 bg-cyan-900/70 px-2 py-1.5 text-white">{soundOn?'🔊 SOUND':'🔇 MUTED'}</button>
      <button type="button" onClick={enterFullscreen} className="woody-fullscreen rounded-lg border border-orange-300/60 bg-orange-600/70 px-2 py-1.5 text-white">{fullScreen?'⤢ EXIT FULLSCREEN':'⛶ FULLSCREEN'}</button>
      <span className="rounded-full bg-violet-500/30 px-2 py-1">LEVEL {game.current?.level||selectedLevel} / 3</span>
      <span className="rounded-full bg-amber-500/20 px-2 py-1">✦ {hud.score} POINTS</span>
      <span className="rounded-full bg-rose-500/20 px-2 py-1">♥ {hud.lives} LIVES</span>
      <span className="woody-secondary rounded-full bg-orange-500/20 px-2 py-1">★ {best} BEST</span>
      <span className="rounded-full bg-cyan-500/20 px-2 py-1">✦ {hud.boost||0} DOUBLE JUMPS</span>
      <span className="rounded-full bg-orange-500/20 px-2 py-1">🔥 {hud.ammo||0} FIREBALLS</span>
      <span className="woody-secondary rounded-full bg-sky-500/20 px-2 py-1">◷ {hud.time}s</span>
      <span aria-live="polite" className={hud.remaining<=20?"rounded-full bg-red-600 px-2 py-1 text-white animate-pulse":"rounded-full bg-emerald-500/20 px-2 py-1"}>⏳ {Math.floor(hud.remaining/60)}:{String(hud.remaining%60).padStart(2,"0")} LEFT</span>
      <span className="woody-secondary rounded-full bg-emerald-500/20 px-2 py-1">MAP {hud.progress}%</span>
    </div>
    <div className="woody-stage relative mx-auto w-full overflow-hidden rounded-xl">
      {mode==="playing"&&hud.notice&&<div role="status" className="pointer-events-none absolute left-1/2 top-6 z-10 w-max max-w-[90%] -translate-x-1/2 rounded-xl border-2 border-orange-300 bg-red-950/95 px-5 py-3 text-center text-sm font-black text-white shadow-xl md:text-xl">{hud.notice}</div>}
      {mode==="playing"&&hud.remaining<=20&&<div className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg bg-red-700/95 px-3 py-2 text-sm font-black text-white animate-pulse">HURRY UP!</div>}
      <canvas ref={canvas} width={W} height={H} aria-label="WOODY Forest Adventure playable level" className="woody-canvas block aspect-[16/9] w-full"/>
      {mode!=='playing'&&<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 px-4 text-center">
        {mode==='won'&&game.current?.level===3&&<div className="mb-1 text-4xl drop-shadow-[0_0_20px_rgba(251,191,36,.85)] animate-bounce" aria-label="Forest Conqueror trophy">🏆✨</div>}
        <h2 className="text-xl font-black text-orange-200 md:text-4xl">{mode==='won'?(game.current?.level===3?'FOREST CONQUEROR!':'LEVEL COMPLETE!'):mode==='over'?'GAME OVER':'CHOOSE YOUR LEVEL'}</h2>
        <p className="mt-1 max-w-md text-xs text-white/80 sm:mt-3 sm:text-sm">{mode==='won'?(game.current?.level===3?'🏆 You defeated Shadow WOODY King!':'Portal reached! Next challenge unlocked.'):mode==='over'?'Try again — your unlocked levels and records are saved.':'Find crystals, collect coins and conquer the forest.'}</p>
        {mode==='won'&&<div className="mt-2 flex flex-wrap justify-center gap-2 text-xs font-bold text-white"><span className="rounded-lg bg-amber-700/80 px-2 py-1">✦ {game.current?.score} POINTS</span><span className="rounded-lg bg-sky-800/80 px-2 py-1">⏱ {Math.ceil(game.current?.elapsed||0)}s</span><span className="rounded-lg bg-emerald-800/80 px-2 py-1">★ BEST {records.times[game.current?.level]??'—'}s</span></div>}
        {mode==='ready'&&<div className="mt-2 text-xs text-amber-200">{records.bossWins>0?'🏆 FOREST CONQUEROR · '+records.bossWins+' victories':'🏆 Forest Conqueror trophy awaits'} · Best times: {LEVELS.map((_,i)=>'L'+(i+1)+' '+(records.times[i+1]??'—')+'s').join(' · ')}</div>}
        {mode==='ready'&&<div className="mt-2 flex flex-wrap justify-center gap-2">{LEVELS.map((level,i)=><button key={level.name} type="button" disabled={i+1>unlocked} onClick={()=>setSelectedLevel(i+1)} className={'rounded-lg px-3 py-2 text-xs font-bold '+(selectedLevel===i+1?'bg-emerald-500 text-slate-950':'bg-slate-700 text-white')+' disabled:opacity-40'}>LEVEL {i+1} {i+1>unlocked?'🔒':''}</button>)}</div>}
        <button onClick={()=>start(mode==='won'&&game.current?.level<3?game.current.level+1:selectedLevel)} className="mt-3 rounded-xl bg-orange-500 px-6 py-2 font-black text-white hover:bg-orange-400">{mode==='won'&&game.current?.level<3?'NEXT LEVEL':mode==='ready'?'START ADVENTURE':'PLAY AGAIN'}</button>
      </div>}
    </div>
    <div className="woody-controls mt-2 grid grid-cols-2 gap-2 sm:mt-4">
      <div className="flex min-w-0 gap-1.5">{button('left','◀')}{button('right','▶')}</div>
      <div className="flex min-w-0 gap-1.5">{button('shoot','🔥 FIRE')}{button('jump','▲ JUMP')}</div>
    </div>
    <p className="woody-help mt-4 text-xs text-white/60">Keyboard: A / D or ← / → to move · SPACE / ↑ / W to jump · F to shoot. Mobile: hold the buttons. Amber fire orbs grant five fireballs; shoot dragons from a distance. Blue crystals grant three mid-air double jumps. Jump over logs and stumps: touching them costs one life and returns you to the last checkpoint. Cracked platforms collapse 0.85 seconds after you land. Beat the clock: Level 1 has 1:30, Level 2 has 1:18, and Level 3 has 1:35. Time-out costs a life and restarts the current level; enemies and water return you to the last checkpoint. Coins are in-game points only. Progress and records are stored in this browser.</p>
   </section>
   <Leaderboard />
   <p className="woody-footer mt-4 text-center text-xs text-white/50">WOODY Forest Adventure · Season 1. Three levels, one final boss. Your unlocked levels and personal records are saved on this device.</p>
   <style jsx global>{`
     /* Keep all four touch buttons and the stage visible together on a phone. */
     @media (max-width: 900px) and (orientation: landscape) and (max-height: 600px) {
       .woody-page { max-width: none !important; padding: 0 !important; }
       .woody-intro, .woody-help, .woody-footer, .woody-secondary { display: none !important; }
       .woody-arcade { display: flex; flex-direction: column; height: 100dvh; width: 100%; border-radius: 0; padding: 3px 8px max(3px,env(safe-area-inset-bottom)); }
       .woody-hud { flex: 0 0 auto; margin-bottom: 2px; gap: 3px; font-size: 10px; }
       .woody-hud > span { padding: 2px 6px; }
       .woody-stage { width: min(100%, calc((100dvh - 95px) * 16 / 9)); flex: 1 1 auto; min-height: 0; aspect-ratio: 16 / 9; }
       .woody-canvas { width: 100%; height: 100%; object-fit: contain; }
       .woody-controls { flex: 0 0 45px; margin-top: 3px; gap: 14px; }
       .woody-control { padding: 6px 8px; font-size: 14px; }
       body:has(.woody-page) { overflow: hidden; }
     }
     /* Mobile browsers may report >900 CSS px in landscape, so do not gate
        the playable layout on max-width. Pin the arcade to the VISUAL viewport:
        the site's navigation and browser chrome no longer push controls away. */
     @media (orientation: landscape) and (pointer: coarse) {
       .woody-arcade {
         position: fixed !important; inset: 0 !important; z-index: 99999 !important;
         box-sizing: border-box !important; display: flex !important;
         flex-direction: column !important; align-items: center !important;
         width: 100vw !important; height: 100dvh !important;
         max-width: none !important; margin: 0 !important;
         padding: 2px max(8px,env(safe-area-inset-right)) max(3px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)) !important;
         border-radius: 0 !important; overflow: hidden !important;
         background: #020617 !important;
       }
       .woody-arcade .woody-help, .woody-arcade .woody-secondary { display:none !important; }
       .woody-arcade .woody-hud {
         align-self: stretch !important; display: flex !important;
         flex-wrap: nowrap !important; justify-content: center !important;
         flex: 0 0 29px !important; min-height: 0 !important;
         margin: 0 0 2px !important; gap: 4px !important;
         overflow: hidden !important; font-size: 10px !important;
       }
       .woody-arcade .woody-hud > span { padding: 3px 6px !important; white-space: nowrap !important; }
       .woody-arcade .woody-sound { flex-shrink:0 !important; padding:3px 6px !important; font-size:10px !important; }
       .woody-arcade .woody-fullscreen { flex-shrink: 0 !important; padding: 3px 6px !important; font-size: 10px !important; }
       .woody-arcade .woody-stage {
         flex: 1 1 0 !important; min-height: 0 !important;
         width: 100% !important;
         max-width: 100% !important; aspect-ratio: auto !important;
         margin: 0 auto !important; overflow: hidden !important;
       }
       .woody-arcade .woody-canvas {
         display: block !important; width: 100% !important;
         height: 100% !important; aspect-ratio: auto !important;
         object-fit: contain !important;
       }
       .woody-arcade .woody-controls {
         align-self: stretch !important; width: 100% !important;
         flex: 0 0 54px !important; min-height: 0 !important;
         display: grid !important; grid-template-columns: 1fr 1fr !important;
         margin: 3px 0 0 !important; gap: 12px !important;
       }
       .woody-arcade .woody-controls > div { min-width: 0 !important; gap: 8px !important; }
       .woody-arcade .woody-control {
         min-width: 0 !important; height: 100% !important;
         padding: 4px 5px !important; font-size: 14px !important;
         line-height: 1 !important; border-radius: 12px !important;
       }
       .woody-arcade:fullscreen { inset: 0 !important; }
     }
     @media (max-width: 600px) and (orientation: portrait) {
       .woody-intro { padding: 10px; margin-bottom: 6px; }
       .woody-intro h1 { font-size: 20px; margin-top: 2px; }
       .woody-intro p { display: none; }
       .woody-secondary, .woody-help, .woody-footer { display: none; }
       .woody-arcade { padding: 4px; }
       .woody-control { padding: 12px 4px; font-size: 13px; }
     }
     .woody-arcade:fullscreen { display:flex; flex-direction:column; width:100vw; height:100dvh; padding:4px 8px max(4px,env(safe-area-inset-bottom)); border-radius:0; }
     .woody-arcade:fullscreen .woody-help, .woody-arcade:fullscreen .woody-secondary { display:none; }
     .woody-arcade:fullscreen .woody-hud { flex:0 0 auto; gap:3px; margin-bottom:3px; }
     .woody-arcade:fullscreen .woody-stage { flex:1 1 auto; min-height:0; width:100%; aspect-ratio:auto; }
     .woody-arcade:fullscreen .woody-canvas { width:100%; height:100%; aspect-ratio:auto; object-fit:contain; }
     .woody-arcade:fullscreen .woody-controls { flex:0 0 48px; margin-top:3px; }
   `}</style>
 </main>;
}

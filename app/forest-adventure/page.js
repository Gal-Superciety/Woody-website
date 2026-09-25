'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  {x:6750,y:345,w:135,h:20},{x:7370,y:310,w:145,h:20}
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
 {x:7520,w:65,h:35,type:'log'}
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
 enemies:enemyPositions.map((x,i)=>({x,y:FLOOR-38,w:36,h:38,origin:x,phase:i*1.8,alive:true})),
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
 const canvas=useRef(null),game=useRef(null),sprite=useRef(null),raf=useRef(null),arcade=useRef(null);
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
 const [mode,setMode]=useState('ready'),[best,setBest]=useState(0),[hud,setHud]=useState({score:0,lives:3,time:0,progress:0,boost:0,ammo:0,remaining:ROUND_SECONDS,notice:''});
 const start=useCallback((level=selectedLevel)=>{game.current=createGame(level);setHud({score:0,lives:3,time:0,progress:0,boost:0,ammo:0,remaining:LEVELS[level-1].seconds,notice:''});setMode('playing');},[selectedLevel]);
 useEffect(()=>{
   try { setBest(Number(localStorage.getItem('woody-adventure-best-v1')) || 0);setUnlocked(Math.min(3,Math.max(1,Number(localStorage.getItem('woody-adventure-unlocked-v1'))||1))); } catch {}
   const img=new Image();img.src='/woody-adventure-sprite.svg';img.onload=()=>{sprite.current=img;};
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
      g.lives--;g.timeouts++;g.checkpoint=g.config.start;g.remaining=g.config.seconds;
      g.crumble=crumblePositions.map(v=>({...v,triggered:false,timer:0,fallen:false}));
      p.x=g.config.start;p.y=START.y;p.vx=0;p.vy=0;p.ground=false;p.jumps=0;p.jumpHeld=false;
      p.invuln=1.5;g.camera=0;g.keys.jump=false;g.keys.shoot=false;g.shots=[];
      g.notice=g.lives>0?'TIME UP! ONE LIFE LOST — BACK TO START':'TIME UP! GAME OVER';
      g.noticeUntil=g.elapsed+3;
      if(g.lives<=0){g.ended=true;setMode('over');}
    }
    p.vx=(Number(g.keys.right)-Number(g.keys.left))*280;
    if(p.vx)p.facing=Math.sign(p.vx);
    if(g.keys.jump&&!p.jumpHeld){
      if(p.ground){p.vy=-620;p.ground=false;p.jumps=1;}
      else if(p.doubleJump>0&&p.jumps===1){p.vy=-570;p.jumps=2;p.doubleJump--;g.score+=15;
       for(let i=0;i<16;i++)g.particles.push({x:p.x+p.w/2,y:p.y+p.h,vx:(Math.random()-.5)*250,vy:(Math.random()-.5)*140,life:.65});}
    }
    p.jumpHeld=g.keys.jump;
    p.shotCooldown=Math.max(0,p.shotCooldown-dt);
    if(g.keys.shoot&&p.flame>0&&p.shotCooldown===0){
      p.flame--;p.shotCooldown=.28;
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
        power.taken=true;p.doubleJump=Math.min(3,p.doubleJump+3);g.score+=100;
        for(let i=0;i<24;i++)g.particles.push({x:power.x,y:power.y,vx:(Math.random()-.5)*320,vy:(Math.random()-.5)*240,life:1});
      }
    }
    for(const flame of g.flames){
      if(!flame.taken&&overlap(p,{x:flame.x-16,y:flame.y-17,w:32,h:34})){
        flame.taken=true;p.flame=Math.min(12,p.flame+5);g.score+=50;
        g.notice='FLAME POWER! +5 FIREBALLS';g.noticeUntil=g.elapsed+2;
      }
    }
    for(const c of g.coins){
      if(!c.taken&&overlap(p,{x:c.x-12,y:c.y-12,w:24,h:24})){
       c.taken=true;g.score+=25;
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
      if(b?.alive&&Math.abs(p.x-b.x)<650){
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
      for(const shot of g.enemyShots){
        shot.x+=shot.vx*dt;shot.y+=shot.vy*dt;shot.life-=dt;
        if(shot.life>0&&p.invuln===0&&overlap({x:shot.x-9,y:shot.y-9,w:18,h:18},p)){
          shot.life=0;g.lives--;p.invuln=1.5;
          if(g.lives<=0){g.ended=true;setMode('over');}
          else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;g.enemyShots=[];}
        }
      }
      g.enemyShots=g.enemyShots.filter(v=>v.life>0);
    }
    // Fireballs hit the first living enemy they reach and cannot pass through terrain.
    for(const shot of g.shots){
      shot.x+=shot.vx*dt;shot.life-=dt;
      for(const enemy of g.enemies){
        if(enemy.alive&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},enemy)){
          enemy.alive=false;shot.life=0;g.score+=75;
          for(let i=0;i<14;i++)g.particles.push({x:enemy.x+18,y:enemy.y+17,vx:(Math.random()-.5)*240,vy:(Math.random()-.5)*210,life:.65});
          break;
        }
      }
      if(g.level===3&&shot.life>0){
        for(const soldier of g.shadows){
          if(soldier.hp>0&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},{x:soldier.x,y:FLOOR-55,w:43,h:55})){
            soldier.hp--;shot.life=0;if(!soldier.hp)g.score+=150;break;
          }
        }
        const b=g.boss;
        if(shot.life>0&&b?.alive&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},b)){
          b.hp--;shot.life=0;g.score+=35;
          if(b.hp<=0){b.alive=false;g.bossCleared=true;g.score+=1000;g.notice='SHADOW WOODY KING DEFEATED!';g.noticeUntil=g.elapsed+4;}
        }
      }
      if(solids.some(v=>overlap({x:shot.x-5,y:shot.y-5,w:10,h:10},v)))shot.life=0;
    }
    g.shots=g.shots.filter(v=>v.life>0);
    // Boss arena never becomes impossible if earlier shots were spent.
    if(g.level===3&&g.boss?.alive&&p.x>7480&&p.flame===0&&g.elapsed-(g.lastAmmoRefill||0)>7){
      p.flame=5;g.lastAmmoRefill=g.elapsed;
      g.notice='BOSS ARENA: +5 FIREBALLS';g.noticeUntil=g.elapsed+1.8;
    }
    for(const e of g.enemies){
     if(!e.alive)continue;
     e.x=e.origin+Math.sin(g.elapsed*1.4+e.phase)*50;
     if(overlap(p,e)&&p.invuln===0){
      if(p.vy>120&&oldBottom<=e.y+14){e.alive=false;p.vy=-390;g.score+=75;}
      else{
       g.lives--;p.invuln=1.4;
       if(g.lives<=0){g.ended=true;setMode('over');}
       else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
      }
     }
    }
    if(g.level===3&&!g.ended&&p.invuln===0){
      for(const soldier of g.shadows){
        if(soldier.hp>0&&overlap(p,{x:soldier.x,y:FLOOR-55,w:43,h:55})){
          g.lives--;p.invuln=1.5;
          if(g.lives<=0){g.ended=true;setMode('over');}
          else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
          break;
        }
      }
      if(g.boss?.alive&&p.invuln===0&&overlap(p,g.boss)){
        g.lives--;p.invuln=1.5;
        if(g.lives<=0){g.ended=true;setMode('over');}
        else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
      }
    }
    // Logs and stumps cannot be defeated by stomping: clear them with a jump.
    if(p.invuln===0&&!g.ended){
      for(const obstacle of g.logs){
        // Tight hitbox allows the bird's feet to visually clear the wood.
        if(overlap({x:p.x+7,y:p.y+9,w:p.w-14,h:p.h-15},{x:obstacle.x+5,y:obstacle.y+4,w:obstacle.w-10,h:obstacle.h-5})){
          g.lives--;p.invuln=1.5;
          if(g.lives<=0){g.ended=true;setMode('over');}
          else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vx=0;p.vy=0;p.jumps=0;p.ground=false;}
          break;
        }
      }
    }
    if(p.y>H+150&&!g.ended){g.lives--;if(g.lives<=0){g.ended=true;setMode('over');}else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}}
    if(!g.ended&&p.x>=g.config.end-155&&(g.level!==3||g.bossCleared)){
      g.ended=true;g.won=true;g.score+=500;
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
   // Layered fantasy forest: distant sky, mountains, canopies, trunks and foreground.
   const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#071c37');sky.addColorStop(.6,'#1d6475');sky.addColorStop(1,'#b0c98c');ctx.fillStyle=sky;ctx.fillRect(0,0,viewW,H);
   ctx.fillStyle='#c8e8ba';ctx.shadowBlur=45;ctx.shadowColor='#b6f6c0';ctx.beginPath();ctx.arc(790,105,43,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   for(let layer=0;layer<3;layer++){
    const step=layer===0?320:layer===1?230:155,shift=cam*(.1+layer*.17);
    ctx.fillStyle=['#225b69','#1d595c','#184e46'][layer];
    for(let i=-2;i<Math.ceil(viewW/step)+3;i++){
     const x=i*step-shift%step;
     ctx.beginPath();ctx.moveTo(x-85,380);ctx.lineTo(x+step*.4,125+layer*37);ctx.lineTo(x+step+80,380);ctx.fill();
     if(layer>0){
      ctx.fillStyle=layer===1?'#275e54':'#224e3f';ctx.fillRect(x+step*.37,160+layer*28,17,280);
      ctx.fillStyle=layer===1?'#2e806b':'#276b51';
      for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(x-38,235+n*32);ctx.lineTo(x+step*.4,65+n*35);ctx.lineTo(x+step*.85,235+n*32);ctx.fill();}
      ctx.fillStyle=['#225b69','#1d595c','#184e46'][layer];
     }
    }
   }
   // Distant cascading falls, shafts of light and luminous forest atmosphere.
   for(const wx of [455,1510,2480,3500]){
    const x=wx-cam*.3;
    if(x<-150||x>viewW+150)continue;
    const fall=ctx.createLinearGradient(x,140,x+110,140);fall.addColorStop(0,'rgba(91,222,230,0)');fall.addColorStop(.5,'rgba(164,250,245,.44)');fall.addColorStop(1,'rgba(91,222,230,0)');
    ctx.fillStyle=fall;ctx.beginPath();ctx.moveTo(x,162);ctx.lineTo(x+92,162);ctx.lineTo(x+108,393);ctx.lineTo(x-10,393);ctx.fill();
    ctx.fillStyle='rgba(190,251,233,.27)';for(let n=0;n<9;n++){ctx.beginPath();ctx.ellipse(x+Math.sin(clock*2+n)*40+45,390+n%3*4,14,3,0,0,Math.PI*2);ctx.fill();}
   }
   ctx.save();ctx.translate(-cam,0);
   // Floating spores and collectible fireflies.
   for(let x=0;x<WORLD;x+=115){
    const sx=x+Math.sin(clock*.7+x)*8,y=125+Math.sin(x*.027)*66;
    ctx.fillStyle='rgba(222,252,156,.55)';ctx.beginPath();ctx.arc(sx,y,2.2,0,Math.PI*2);ctx.fill();
   }
   for(const s of solids){
    ctx.fillStyle='#4a352f';ctx.fillRect(s.x,s.y,s.w,s.h);
    ctx.fillStyle='#78a54b';ctx.fillRect(s.x,s.y,s.w,11);
    ctx.fillStyle='#a4cf68';ctx.fillRect(s.x,s.y,s.w,3);
    ctx.fillStyle='rgba(24,18,22,.23)';
    for(let x=s.x+22;x<s.x+s.w;x+=65)ctx.fillRect(x,s.y+15,5,Math.min(45,s.h-15));
    for(let x=s.x+12;x<s.x+s.w;x+=87){
      ctx.fillStyle='#a9ce64';ctx.beginPath();ctx.ellipse(x,s.y-4,12,7,0,0,Math.PI*2);ctx.fill();
    }
   }
   // Suspended rune stones move vertically and require timed jumps.
   for(const platform of g?.moving||[]){
    const y=platform.currentY;ctx.shadowColor='#7fffe0';ctx.shadowBlur=18;
    ctx.fillStyle='#426f71';ctx.fillRect(platform.x,y,platform.w,platform.h);
    ctx.fillStyle='#b6fbd3';ctx.fillRect(platform.x,y,platform.w,4);ctx.shadowBlur=0;
    for(let j=16;j<platform.w;j+=29){ctx.strokeStyle='#a3f7d9';ctx.beginPath();ctx.arc(platform.x+j,y+10,5,0,Math.PI);ctx.stroke();}
   }
   // Giant mushrooms, dangling vines and stone ruins define the forest's silhouette.
   for(let x=175;x<WORLD;x+=390){
    const y=FLOOR-4;
    ctx.strokeStyle='#275a4b';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+110,0);ctx.bezierCurveTo(x+98,70,x+146,114,x+125,171+Math.sin(clock+x)*8);ctx.stroke();
    if(solids.some(v=>v.y===FLOOR&&x>=v.x&&x<v.x+v.w)){
      ctx.fillStyle='#d5bda1';ctx.fillRect(x,y-28,12,27);ctx.fillStyle='#b84f69';ctx.beginPath();ctx.ellipse(x+6,y-27,27,14,0,Math.PI,0);ctx.fill();
      ctx.fillStyle='#f4d9a3';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(x-8+k*13,y-35+(k%2)*5,3,0,Math.PI*2);ctx.fill();}
    }
   }
   // Fallen trunks and jagged stumps introduce a different ground-level hazard.
   for(const obstacle of g?.logs||[]){
     const {x,y,w,h,type}=obstacle;
     ctx.save();
     if(type==='log'){
       ctx.fillStyle='#593622';ctx.beginPath();ctx.roundRect(x,y+4,w,h-4,9);ctx.fill();
       ctx.strokeStyle='#b17d47';ctx.lineWidth=3;
       for(let n=9;n<w-6;n+=16){ctx.beginPath();ctx.moveTo(x+n,y+9);ctx.quadraticCurveTo(x+n+5,y+h*.5,x+n,y+h-6);ctx.stroke();}
       ctx.fillStyle='#ba925d';ctx.beginPath();ctx.ellipse(x+w-7,y+h/2+2,8,h*.43,0,0,Math.PI*2);ctx.fill();
       ctx.strokeStyle='#674024';ctx.beginPath();ctx.ellipse(x+w-7,y+h/2+2,4,h*.25,0,0,Math.PI*2);ctx.stroke();
       ctx.fillStyle='#71a24b';ctx.beginPath();ctx.ellipse(x+16,y+4,15,5,0,0,Math.PI*2);ctx.fill();
     }else{
       ctx.fillStyle='#583a29';ctx.beginPath();ctx.moveTo(x,y+h);ctx.lineTo(x+4,y+9);ctx.lineTo(x+12,y+4);ctx.lineTo(x+22,y+12);ctx.lineTo(x+w-5,y+3);ctx.lineTo(x+w,y+h);ctx.closePath();ctx.fill();
       ctx.fillStyle='#c69b68';ctx.beginPath();ctx.ellipse(x+w/2,y+8,w*.45,7,-.1,0,Math.PI*2);ctx.fill();
       ctx.strokeStyle='#805334';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x+w/2,y+8,w*.27,4,-.1,0,Math.PI*2);ctx.stroke();
       ctx.strokeStyle='#9b7146';for(let n=0;n<3;n++){ctx.beginPath();ctx.moveTo(x+8+n*11,y+17);ctx.lineTo(x+5+n*11,y+h-3);ctx.stroke();}
     }
     ctx.restore();
   }
   // Crumbling stone bridges shake as soon as WOODY lands on them.
   for(const platform of g?.crumble||[]){
     if(platform.fallen)continue;
     const shake=platform.triggered?Math.sin(clock*58)*Math.min(5,platform.timer*7):0;
     ctx.save();ctx.translate(shake,platform.triggered?Math.sin(clock*43)*2:0);
     ctx.fillStyle=platform.triggered?'#bb7660':'#78908c';ctx.fillRect(platform.x,platform.y,platform.w,platform.h);
     ctx.fillStyle=platform.triggered?'#ffd49d':'#b9f5d3';ctx.fillRect(platform.x,platform.y,platform.w,4);
     ctx.strokeStyle='#253e45';ctx.lineWidth=2;
     for(let j=20;j<platform.w;j+=26){ctx.beginPath();ctx.moveTo(platform.x+j,platform.y+5);ctx.lineTo(platform.x+j-5,platform.y+13);ctx.stroke();}
     if(platform.triggered){ctx.fillStyle='#fff2b5';ctx.font='bold 12px sans-serif';ctx.fillText('!',platform.x+platform.w/2,platform.y-9);}
     ctx.restore();
   }
   // Waterfalls and ravines are hazards, not invisible ground.
   for(const [a,b] of [[620,760],[1330,1440],[2030,2140],[2760,2890],[3900,4020],[4480,4620],[5130,5280],[5690,5910],[6380,6550],[7080,7220]]){
    const water=ctx.createLinearGradient(0,FLOOR,0,H);water.addColorStop(0,'#64dfdc');water.addColorStop(1,'#0a6487');
    ctx.fillStyle=water;ctx.fillRect(a,FLOOR+24,b-a,H-FLOOR);
    ctx.strokeStyle='rgba(204,255,245,.7)';ctx.lineWidth=2;
    for(let i=0;i<4;i++){const yy=FLOOR+34+i*19;ctx.beginPath();ctx.moveTo(a,yy);ctx.quadraticCurveTo((a+b)/2,yy+Math.sin(clock*3+i)*7,b,yy);ctx.stroke();}
   }
   for(const power of g?.powerups||[]){
    if(power.taken)continue;const bob=Math.sin(clock*3+power.x)*7;
    ctx.save();ctx.translate(power.x,power.y+bob);ctx.rotate(clock*.65);ctx.shadowBlur=26;ctx.shadowColor='#63f8ff';
    ctx.fillStyle='#67e8f9';ctx.beginPath();ctx.moveTo(0,-20);ctx.lineTo(16,0);ctx.lineTo(0,20);ctx.lineTo(-16,0);ctx.closePath();ctx.fill();
    ctx.fillStyle='#0b5774';ctx.font='bold 19px sans-serif';ctx.fillText('✦',-9,7);ctx.restore();
   }
   // Glowing amber orbs are the separate ranged-attack power-up.
   for(const flame of g?.flames||[]){
     if(flame.taken)continue;
     const bob=Math.sin(clock*3+flame.x)*6;
     ctx.save();ctx.translate(flame.x,flame.y+bob);ctx.shadowBlur=22;ctx.shadowColor='#ff8b29';
     ctx.fillStyle='#ffb02e';ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#f45c1e';ctx.beginPath();ctx.moveTo(-5,7);ctx.quadraticCurveTo(-14,-3,2,-19);ctx.quadraticCurveTo(1,-5,10,-7);ctx.quadraticCurveTo(13,10,-1,10);ctx.fill();
     ctx.fillStyle='#fff3b1';ctx.beginPath();ctx.ellipse(1,3,4,6,0,0,Math.PI*2);ctx.fill();ctx.restore();
   }
   for(const shot of g?.shots||[]){
     ctx.save();ctx.shadowBlur=22;ctx.shadowColor='#ff6a16';ctx.fillStyle='#ffc447';ctx.beginPath();ctx.arc(shot.x,shot.y,9,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#ff6320';ctx.beginPath();ctx.ellipse(shot.x-Math.sign(shot.vx)*8,shot.y,10,5,0,0,Math.PI*2);ctx.fill();ctx.restore();
   }
   for(const c of g?.coins||[]){
    if(c.taken)continue;
    const bob=Math.sin(clock*4+c.x)*5;
    ctx.fillStyle='#ffda68';ctx.shadowBlur=14;ctx.shadowColor='#ffda68';ctx.beginPath();ctx.arc(c.x,c.y+bob,12,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='#fff1a8';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#855122';ctx.font='bold 13px sans-serif';ctx.fillText('viewW',c.x-6,c.y+5+bob);
   }
   for(const e of g?.enemies||[]){
    if(!e.alive)continue;
    ctx.fillStyle='#763f75';ctx.beginPath();ctx.ellipse(e.x+18,e.y+17,21,23,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e8a8f6';ctx.beginPath();ctx.arc(e.x+12,e.y+12,5,0,Math.PI*2);ctx.arc(e.x+25,e.y+12,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#2d1640';ctx.fillRect(e.x+12,e.y+12,3,6);ctx.fillRect(e.x+25,e.y+12,3,6);
    ctx.strokeStyle='#f2a4e4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x+7,e.y+32);ctx.lineTo(e.x-4,e.y+38);ctx.moveTo(e.x+29,e.y+32);ctx.lineTo(e.x+41,e.y+38);ctx.stroke();
   }
   // Shadow WOODY soldiers and the stronger final king are unique to level three.
   for(const soldier of g?.shadows||[]){
     if(soldier.hp<=0)continue;
     ctx.save();ctx.shadowColor='#c364ff';ctx.shadowBlur=13;
     ctx.fillStyle='#392257';ctx.beginPath();ctx.ellipse(soldier.x+22,FLOOR-27,22,28,0,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#e950b5';ctx.beginPath();ctx.arc(soldier.x+13,FLOOR-38,5,0,Math.PI*2);ctx.arc(soldier.x+30,FLOOR-38,5,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#ff7b36';ctx.beginPath();ctx.moveTo(soldier.x+12,FLOOR-53);ctx.lineTo(soldier.x+19,FLOOR-71);ctx.lineTo(soldier.x+30,FLOOR-52);ctx.fill();
     ctx.restore();
     ctx.fillStyle='#fb98ed';ctx.fillRect(soldier.x,FLOOR-66,43*(soldier.hp/2),4);
   }
   if(g?.boss?.alive){
     const b=g.boss;ctx.save();ctx.shadowColor='#bb39fa';ctx.shadowBlur=25;
     ctx.fillStyle='#281238';ctx.beginPath();ctx.ellipse(b.x+33,b.y+38,33,39,0,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#e449ec';ctx.beginPath();ctx.arc(b.x+22,b.y+25,7,0,Math.PI*2);ctx.arc(b.x+46,b.y+25,7,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#ff8b3c';ctx.beginPath();ctx.moveTo(b.x+12,b.y+5);ctx.lineTo(b.x+25,b.y-22);ctx.lineTo(b.x+39,b.y+5);ctx.fill();
     ctx.restore();ctx.fillStyle='#3c1648';ctx.fillRect(b.x-12,b.y-36,90,11);
     ctx.fillStyle='#fa3d72';ctx.fillRect(b.x-12,b.y-36,90*b.hp/b.maxHp,11);
     ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.fillText('SHADOW WOODY KING',b.x-32,b.y-43);
   }
   for(const shot of g?.enemyShots||[]){
     ctx.save();ctx.shadowColor='#d355ff';ctx.shadowBlur=17;ctx.fillStyle='#d56dff';
     ctx.beginPath();ctx.arc(shot.x,shot.y,9,0,Math.PI*2);ctx.fill();ctx.restore();
   }
   // Checkpoint and portal.
   ctx.fillStyle='#9c7949';ctx.fillRect(2160,355,7,101);ctx.fillStyle='#8df4be';ctx.beginPath();ctx.moveTo(2167,358);ctx.lineTo(2222,371);ctx.lineTo(2167,389);ctx.fill();
   for(const cp of [4700,5980,7310]){
    ctx.fillStyle='#9c7949';ctx.fillRect(cp,355,7,101);ctx.fillStyle='#8df4be';ctx.beginPath();ctx.moveTo(cp+7,358);ctx.lineTo(cp+58,371);ctx.lineTo(cp+7,389);ctx.fill();
   }
   ctx.shadowBlur=25;ctx.shadowColor='#9ce6ff';ctx.strokeStyle='#a5eaff';ctx.lineWidth=11;ctx.beginPath();ctx.ellipse(g?.config.end-90||WORLD-90,FLOOR-61,31,65,0,0,Math.PI*2);ctx.stroke();
   ctx.fillStyle='rgba(125,225,248,.3)';ctx.fill();ctx.shadowBlur=0;
   for(const v of g?.particles||[]){ctx.fillStyle='rgba(255,219,112,'+Math.max(0,v.life*2)+')';ctx.beginPath();ctx.arc(v.x,v.y,4,0,Math.PI*2);ctx.fill();}
   const p=g?.player||START;
   if(p.invuln===0||Math.floor(clock*12)%2===0){
    ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.scale(p.facing,1);
    const stride=p.ground&&Math.abs(p.vx)>20?Math.sin(clock*19):0;
    const tilt=p.ground?stride*.055:Math.max(-.25,Math.min(.28,p.vy/1300));
    ctx.rotate(tilt);
    const bob=p.ground&&Math.abs(p.vx)>20?Math.abs(stride)*-3:0;
    // Until the supplied bird art is packaged as an animation sprite sheet, render the site's existing mascot.
    if(sprite.current){ctx.save();ctx.beginPath();ctx.ellipse(0,bob,24,29,0,0,Math.PI*2);ctx.clip();ctx.drawImage(sprite.current,-32,-42+bob,64,86);ctx.restore();}
    else{
     ctx.fillStyle='#f9a044';ctx.beginPath();ctx.ellipse(0,bob,22,27,0,0,Math.PI*2);ctx.fill();
     ctx.fillStyle='#b0ffb7';ctx.beginPath();ctx.arc(9,-9+bob,6,0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle='#f5a444';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-12,17+bob);ctx.lineTo(-18+stride*5,29+bob);ctx.moveTo(8,17+bob);ctx.lineTo(13-stride*5,29+bob);ctx.stroke();
    ctx.restore();
   }
   ctx.restore();
   raf.current=requestAnimationFrame(draw);
  };
  raf.current=requestAnimationFrame(draw);
  return()=>{alive=false;cancelAnimationFrame(raf.current);};
 },[]);
 const press=(key,down)=>{if(game.current)game.current.keys[key]=down;};
 const button=(key,label)=>(
   <button type="button" aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}}
    onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)}
    className="woody-control min-w-0 flex-1 select-none rounded-xl border border-emerald-300/50 bg-emerald-900/80 px-2 py-3 text-sm font-bold text-white active:bg-orange-500 touch-none sm:px-5 sm:py-4 sm:text-lg">{label}</button>
 );
 return <main className="woody-page mx-auto max-w-6xl px-2 py-3 md:px-8 md:py-8">
   <section className="woody-intro mb-3 rounded-3xl border border-emerald-300/20 bg-gradient-to-r from-emerald-950/90 to-sky-950/80 p-6">
    <span className="text-xs font-bold uppercase tracking-[.3em] text-emerald-300">WOODY ARCADE · THREE LEVELS</span>
    <h1 className="mt-2 text-3xl font-black text-orange-300 md:text-5xl">{LEVELS[game.current?.level-1||selectedLevel-1].name}</h1>
    <p className="mt-2 text-sm text-white/75">Explore the forest, leap over fallen trees and sharp stumps, collect golden WOODY coins and reach the portal before time runs out.</p>
   </section>
   <section ref={arcade} className="woody-arcade overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950 p-1.5 shadow-[0_0_50px_rgba(16,185,129,.12)] md:rounded-3xl md:p-4">
    <div className="woody-hud mb-1.5 flex flex-wrap items-center gap-1 text-[10px] font-bold text-white/90 sm:mb-3 sm:gap-3 sm:text-sm">
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
      <canvas ref={canvas} width={viewW} height={H} aria-label="WOODY Forest Adventure playable level" className="woody-canvas block aspect-[16/9] w-full"/>
      {mode!=='playing'&&<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 px-4 text-center">
        <h2 className="text-xl font-black text-orange-200 md:text-4xl">{mode==='won'?(game.current?.level===3?'FOREST CONQUEROR!':'LEVEL COMPLETE!'):mode==='over'?'GAME OVER':'CHOOSE YOUR LEVEL'}</h2>
        <p className="mt-3 max-w-md text-sm text-white/80">{mode==='won'?'You reached the portal! Can you improve your score?':'Find the glowing blue crystals to unlock double jumps. Time your moves across shifting platforms.'}</p>
        {mode==='ready'&&<div className="mt-2 flex flex-wrap justify-center gap-2">{LEVELS.map((level,i)=><button key={level.name} type="button" disabled={i+1>unlocked} onClick={()=>setSelectedLevel(i+1)} className={'rounded-lg px-3 py-2 text-xs font-bold '+(selectedLevel===i+1?'bg-emerald-500 text-slate-950':'bg-slate-700 text-white')+' disabled:opacity-40'}>LEVEL {i+1} {i+1>unlocked?'🔒':''}</button>)}</div>}
        <button onClick={()=>start(mode==='won'&&game.current?.level<3?game.current.level+1:selectedLevel)} className="mt-3 rounded-xl bg-orange-500 px-6 py-2 font-black text-white hover:bg-orange-400">{mode==='won'&&game.current?.level<3?'NEXT LEVEL':mode==='ready'?'START ADVENTURE':'PLAY AGAIN'}</button>
      </div>}
    </div>
    <div className="woody-controls mt-2 grid grid-cols-2 gap-2 sm:mt-4">
      <div className="flex min-w-0 gap-1.5">{button('left','◀')}{button('right','▶')}</div>
      <div className="flex min-w-0 gap-1.5">{button('shoot','🔥 FIRE')}{button('jump','▲ JUMP')}</div>
    </div>
    <p className="woody-help mt-4 text-xs text-white/60">Keyboard: A / D or ← / → to move · SPACE / ↑ / viewW to jump · F to shoot. Mobile: hold the buttons. Amber fire orbs grant five fireballs; shoot creatures from a distance. Blue crystals grant three mid-air double jumps. Jump over logs and stumps: touching them costs one life and returns you to the last checkpoint. Cracked platforms collapse 0.85 seconds after you land. Beat the 1:50 countdown: time-out costs a life AND sends you to the beginning; enemies and water send you to the last checkpoint. Coins are in-game points only.</p>
   </section>
   <p className="woody-footer mt-4 text-center text-xs text-white/50">Chapter 1 time trial: reach the portal before the 1:50 timer expires. Time-outs restart the entire map; other hazards use checkpoints. Hand-painted production art is still in progress.</p>
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

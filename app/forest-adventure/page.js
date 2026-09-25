'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

const W = 960, H = 540, WORLD = 7900, FLOOR = 456;
const ROUND_SECONDS = 110; // Full-map countdown; checkpoints do not reset the clock.
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
const crumblePositions = [
 {x:3870,y:360,w:95,h:18},{x:4480,y:370,w:98,h:18},
 {x:5140,y:351,w:95,h:18},{x:5700,y:350,w:104,h:18},
 {x:6385,y:352,w:98,h:18},{x:7100,y:345,w:100,h:18}
];
const powerups = [[1120,265],[2570,267],[4140,285],[5580,295],[6950,292]];
const movingPlatforms = [{x:1280,y:348,w:106,h:17,range:65,phase:0},{x:2740,y:335,w:115,h:17,range:70,phase:2},
 {x:4560,y:324,w:108,h:17,range:48,phase:1},
 {x:5800,y:332,w:108,h:17,range:52,phase:3},
 {x:7100,y:310,w:110,h:17,range:46,phase:4}];
const START = {x:65,y:FLOOR-58,vx:0,vy:0,w:43,h:58,ground:false,facing:1,invuln:0,jumps:0,doubleJump:0,jumpHeld:false};
const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function createGame(){
 return {player:{...START},coins:coinPositions.map(([x,y])=>({x,y,taken:false})),
 enemies:enemyPositions.map((x,i)=>({x,y:FLOOR-38,w:36,h:38,origin:x,phase:i*1.8,alive:true})),
 keys:{left:false,right:false,jump:false},camera:0,score:0,lives:3,checkpoint:65,
 powerups:powerups.map(([x,y])=>({x,y,taken:false})),moving:movingPlatforms.map(v=>({...v,currentY:v.y})),
 crumble:crumblePositions.map(v=>({...v,triggered:false,timer:0,fallen:false})),
 elapsed:0,remaining:ROUND_SECONDS,timeouts:0,notice:'',noticeUntil:0,ended:false,won:false,particles:[],last:0};
}
export default function ForestAdventure(){
 const canvas=useRef(null),game=useRef(null),sprite=useRef(null),raf=useRef(null);
 const [mode,setMode]=useState('ready'),[best,setBest]=useState(0),[hud,setHud]=useState({score:0,lives:3,time:0,progress:0,boost:0,remaining:ROUND_SECONDS,notice:''});
 const start=useCallback(()=>{game.current=createGame();setHud({score:0,lives:3,time:0,progress:0,boost:0,remaining:ROUND_SECONDS,notice:''});setMode('playing');},[]);
 useEffect(()=>{
   try { setBest(Number(localStorage.getItem('woody-adventure-best-v1')) || 0); } catch {}
   const img=new Image();img.src='/woody-adventure-sprite.svg';img.onload=()=>{sprite.current=img;};
 },[]);
 useEffect(()=>{
  const key=(e,down)=>{
   const g=game.current;if(!g)return;
   if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW'].includes(e.code))e.preventDefault();
   if(['ArrowLeft','KeyA'].includes(e.code))g.keys.left=down;
   if(['ArrowRight','KeyD'].includes(e.code))g.keys.right=down;
   if(['ArrowUp','Space','KeyW'].includes(e.code))g.keys.jump=down;
  };
  const kd=e=>key(e,true),ku=e=>key(e,false);
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  const blur=()=>{if(game.current)game.current.keys={left:false,right:false,jump:false};};
  window.addEventListener('blur',blur);
  return ()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);window.removeEventListener('blur',blur);};
 },[]);
 useEffect(()=>{
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;
  let alive=true,previous=0,uiClock=0;
  const draw=(now)=>{
   if(!alive)return;
   const dt=Math.min((now-previous)/1000||0,.035);previous=now;
   const g=game.current;
   if(g&&!g.ended){
    const p=g.player,oldBottom=p.y+p.h;
    g.elapsed+=dt;g.remaining=Math.max(0,g.remaining-dt);p.invuln=Math.max(0,p.invuln-dt);
    if(g.remaining<=0){
      // Time-out is the only hazard that ignores checkpoints. Keep earned score,
      // collected coins, crystals and defeated enemies, but restart the map.
      g.lives--;g.timeouts++;g.checkpoint=65;g.remaining=ROUND_SECONDS;
      g.crumble=crumblePositions.map(v=>({...v,triggered:false,timer:0,fallen:false}));
      p.x=START.x;p.y=START.y;p.vx=0;p.vy=0;p.ground=false;p.jumps=0;p.jumpHeld=false;
      p.invuln=1.5;g.camera=0;g.keys.jump=false;
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
    p.x=Math.max(0,Math.min(WORLD-p.w,p.x+p.vx*dt));
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
    if(p.x>2050)g.checkpoint=2170;
    if(p.x>4650)g.checkpoint=4700;
    if(p.x>5960)g.checkpoint=5980;
    if(p.x>7280)g.checkpoint=7310;
    for(const power of g.powerups){
      if(!power.taken&&overlap(p,{x:power.x-18,y:power.y-18,w:36,h:36})){
        power.taken=true;p.doubleJump=Math.min(3,p.doubleJump+3);g.score+=100;
        for(let i=0;i<24;i++)g.particles.push({x:power.x,y:power.y,vx:(Math.random()-.5)*320,vy:(Math.random()-.5)*240,life:1});
      }
    }
    for(const c of g.coins){
      if(!c.taken&&overlap(p,{x:c.x-12,y:c.y-12,w:24,h:24})){
       c.taken=true;g.score+=25;
       for(let i=0;i<7;i++)g.particles.push({x:c.x,y:c.y,vx:(Math.random()-.5)*130,vy:-Math.random()*170,life:.5});
      }
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
    if(p.y>H+150){g.lives--;if(g.lives<=0){g.ended=true;setMode('over');}else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}}
    if(p.x>WORLD-155){g.ended=true;g.won=true;g.score+=500;setMode('won');}
    g.camera+=(Math.max(0,Math.min(WORLD-W,p.x-W*.34))-g.camera)*Math.min(1,dt*5);
    g.particles=g.particles.filter(v=>v.life>0);
    for(const v of g.particles){v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=250*dt;v.life-=dt;}
    uiClock+=dt;
    if(g.ended){setBest(previous=>{const next=Math.max(previous,g.score);try{localStorage.setItem('woody-adventure-best-v1',String(next));}catch{}return next;});}
    if(uiClock>.12){setHud({score:g.score,lives:g.lives,time:Math.floor(g.elapsed),progress:Math.min(100,Math.floor(p.x/WORLD*100)),boost:p.doubleJump,remaining:Math.ceil(g.remaining),notice:g.elapsed<g.noticeUntil?g.notice:''});uiClock=0;}
   }
   const cam=g?.camera||0,clock=g?.elapsed||now/1000;
   // Layered fantasy forest: distant sky, mountains, canopies, trunks and foreground.
   const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#071c37');sky.addColorStop(.6,'#1d6475');sky.addColorStop(1,'#b0c98c');ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
   ctx.fillStyle='#c8e8ba';ctx.shadowBlur=45;ctx.shadowColor='#b6f6c0';ctx.beginPath();ctx.arc(790,105,43,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   for(let layer=0;layer<3;layer++){
    const step=layer===0?320:layer===1?230:155,shift=cam*(.1+layer*.17);
    ctx.fillStyle=['#225b69','#1d595c','#184e46'][layer];
    for(let i=-2;i<Math.ceil(W/step)+3;i++){
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
    if(x<-150||x>W+150)continue;
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
   for(const c of g?.coins||[]){
    if(c.taken)continue;
    const bob=Math.sin(clock*4+c.x)*5;
    ctx.fillStyle='#ffda68';ctx.shadowBlur=14;ctx.shadowColor='#ffda68';ctx.beginPath();ctx.arc(c.x,c.y+bob,12,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.strokeStyle='#fff1a8';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#855122';ctx.font='bold 13px sans-serif';ctx.fillText('W',c.x-6,c.y+5+bob);
   }
   for(const e of g?.enemies||[]){
    if(!e.alive)continue;
    ctx.fillStyle='#763f75';ctx.beginPath();ctx.ellipse(e.x+18,e.y+17,21,23,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e8a8f6';ctx.beginPath();ctx.arc(e.x+12,e.y+12,5,0,Math.PI*2);ctx.arc(e.x+25,e.y+12,5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#2d1640';ctx.fillRect(e.x+12,e.y+12,3,6);ctx.fillRect(e.x+25,e.y+12,3,6);
    ctx.strokeStyle='#f2a4e4';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(e.x+7,e.y+32);ctx.lineTo(e.x-4,e.y+38);ctx.moveTo(e.x+29,e.y+32);ctx.lineTo(e.x+41,e.y+38);ctx.stroke();
   }
   // Checkpoint and portal.
   ctx.fillStyle='#9c7949';ctx.fillRect(2160,355,7,101);ctx.fillStyle='#8df4be';ctx.beginPath();ctx.moveTo(2167,358);ctx.lineTo(2222,371);ctx.lineTo(2167,389);ctx.fill();
   for(const cp of [4700,5980,7310]){
    ctx.fillStyle='#9c7949';ctx.fillRect(cp,355,7,101);ctx.fillStyle='#8df4be';ctx.beginPath();ctx.moveTo(cp+7,358);ctx.lineTo(cp+58,371);ctx.lineTo(cp+7,389);ctx.fill();
   }
   ctx.shadowBlur=25;ctx.shadowColor='#9ce6ff';ctx.strokeStyle='#a5eaff';ctx.lineWidth=11;ctx.beginPath();ctx.ellipse(WORLD-90,FLOOR-61,31,65,0,0,Math.PI*2);ctx.stroke();
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
    className="select-none rounded-2xl border border-emerald-300/50 bg-emerald-900/70 px-6 py-4 text-lg font-bold text-white active:bg-orange-500 touch-none">{label}</button>
 );
 return <main className="mx-auto max-w-6xl px-3 py-8 md:px-8">
   <section className="mb-5 rounded-3xl border border-emerald-300/20 bg-gradient-to-r from-emerald-950/90 to-sky-950/80 p-6">
    <span className="text-xs font-bold uppercase tracking-[.3em] text-emerald-300">WOODY ARCADE · CHAPTER ONE</span>
    <h1 className="mt-2 text-3xl font-black text-orange-300 md:text-5xl">The Enchanted Forest</h1>
    <p className="mt-2 text-sm text-white/75">Explore the forest, collect golden WOODY coins, defeat creatures and reach the portal.</p>
   </section>
   <section className="overflow-hidden rounded-3xl border border-emerald-400/30 bg-slate-950 p-2 shadow-[0_0_50px_rgba(16,185,129,.12)] md:p-4">
    <div className="mb-3 flex flex-wrap gap-3 text-xs font-bold text-white/90 md:text-sm">
      <span className="rounded-full bg-amber-500/20 px-3 py-2">✦ {hud.score} POINTS</span>
      <span className="rounded-full bg-rose-500/20 px-3 py-2">♥ {hud.lives} LIVES</span>
      <span className="rounded-full bg-orange-500/20 px-3 py-2">★ {best} BEST</span>
      <span className="rounded-full bg-cyan-500/20 px-3 py-2">✦ {hud.boost||0} DOUBLE JUMPS</span>
      <span className="rounded-full bg-sky-500/20 px-3 py-2">◷ {hud.time}s</span>
      <span aria-live="polite" className={hud.remaining<=20?"rounded-full bg-red-600 px-3 py-2 text-white animate-pulse":"rounded-full bg-emerald-500/20 px-3 py-2"}>⏳ {Math.floor(hud.remaining/60)}:{String(hud.remaining%60).padStart(2,"0")} LEFT</span>
      <span className="rounded-full bg-emerald-500/20 px-3 py-2">MAP {hud.progress}%</span>
    </div>
    <div className="relative overflow-hidden rounded-2xl">
      {mode==="playing"&&hud.notice&&<div role="status" className="pointer-events-none absolute left-1/2 top-6 z-10 w-max max-w-[90%] -translate-x-1/2 rounded-xl border-2 border-orange-300 bg-red-950/95 px-5 py-3 text-center text-sm font-black text-white shadow-xl md:text-xl">{hud.notice}</div>}
      {mode==="playing"&&hud.remaining<=20&&<div className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg bg-red-700/95 px-3 py-2 text-sm font-black text-white animate-pulse">HURRY UP!</div>}
      <canvas ref={canvas} width={W} height={H} aria-label="WOODY Forest Adventure playable level" className="block aspect-[16/9] w-full"/>
      {mode!=='playing'&&<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 px-4 text-center">
        <h2 className="text-2xl font-black text-orange-200 md:text-4xl">{mode==='won'?'FOREST CONQUERED!':mode==='over'?'GAME OVER':'THE FOREST AWAITS'}</h2>
        <p className="mt-3 max-w-md text-sm text-white/80">{mode==='won'?'You reached the portal! Can you improve your score?':'Find the glowing blue crystals to unlock double jumps. Time your moves across shifting platforms.'}</p>
        <button onClick={start} className="mt-5 rounded-xl bg-orange-500 px-8 py-3 font-black text-white hover:bg-orange-400">{mode==='ready'?'START ADVENTURE':'PLAY AGAIN'}</button>
      </div>}
    </div>
    <div className="mt-4 flex items-center justify-between gap-3">
      <div className="flex gap-2">{button('left','◀ LEFT')}{button('right','RIGHT ▶')}</div>
      {button('jump','▲ JUMP')}
    </div>
    <p className="mt-4 text-xs text-white/60">Keyboard: A / D or ← / → to move · SPACE / ↑ / W to jump. Mobile: hold the buttons. Blue crystals grant three mid-air double jumps. Cracked platforms collapse 0.85 seconds after you land. Beat the 1:50 countdown: time-out costs a life AND sends you to the beginning; enemies and water send you to the last checkpoint. Coins are in-game points only.</p>
   </section>
   <p className="mt-4 text-center text-xs text-white/50">Chapter 1 time trial: reach the portal before the 1:50 timer expires. Time-outs restart the entire map; other hazards use checkpoints. Hand-painted production art is still in progress.</p>
 </main>;
}

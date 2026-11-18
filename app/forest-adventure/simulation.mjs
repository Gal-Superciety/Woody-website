import { createDragonGuardian, createSmallDragon, dragonVolley, hitDragon } from './dragons.mjs';

export const FOREST_STEP_SECONDS = 1 / 60;

const W = 960, H = 540, WORLD = 7900, FLOOR = 456;
const LEVELS=[
 {name:'The Enchanted Forest',difficulty:'EASY',start:65,end:2550,seconds:90},
 {name:'The Dangerous Woods',difficulty:'MEDIUM',start:2950,end:5500,seconds:78},
 {name:'Shadow WOODY Kingdom',difficulty:'HARD',start:5980,end:WORLD-90,seconds:95}
];
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
export { createGame, W, H, WORLD, FLOOR, LEVELS, solids };

export function stepForest(g, { audio, visuals = false } = {}) {
  if (g.ended) return;
  const dt = FOREST_STEP_SECONDS;
    const p=g.player,oldBottom=p.y+p.h;
    g.elapsed+=dt;g.remaining=Math.max(0,g.remaining-dt);p.invuln=Math.max(0,p.invuln-dt);
    if(g.remaining<=0){
      // Time-out is the only hazard that ignores checkpoints. Keep earned score,
      // collected coins, crystals and defeated enemies, but restart the map.
      audio?.play('hit');g.lives--;g.timeouts++;g.checkpoint=g.config.start;g.remaining=g.config.seconds;
      g.crumble=crumblePositions.map(v=>({...v,triggered:false,timer:0,fallen:false}));
      p.x=g.config.start;p.y=START.y;p.vx=0;p.vy=0;p.ground=false;p.jumps=0;p.jumpHeld=false;
      p.invuln=1.5;g.camera=0;g.keys.jump=false;g.keys.shoot=false;g.shots=[];
      g.notice=g.lives>0?'TIME UP! ONE LIFE LOST — BACK TO START':'TIME UP! GAME OVER';
      g.noticeUntil=g.elapsed+3;
      if(g.lives<=0){g.ended=true;audio?.play('over');audio?.stop();}
    }
    p.vx=(Number(g.keys.right)-Number(g.keys.left))*280;
    if(p.vx)p.facing=Math.sign(p.vx);
    if(g.keys.jump&&!p.jumpHeld){audio?.play(p.ground?'jump':'double');
      if(p.ground){p.vy=-620;p.ground=false;p.jumps=1;}
      else if(p.doubleJump>0&&p.jumps===1){p.vy=-570;p.jumps=2;p.doubleJump--;g.score+=15;
       if(visuals) for(let i=0;i<16;i++)g.particles.push({x:p.x+p.w/2,y:p.y+p.h,vx:(Math.random()-.5)*250,vy:(Math.random()-.5)*140,life:.65});}
    }
    p.jumpHeld=g.keys.jump;
    p.shotCooldown=Math.max(0,p.shotCooldown-dt);
    if(g.keys.shoot&&p.flame>0&&p.shotCooldown===0){
      p.flame--;p.shotCooldown=.28;audio?.play('fire');
      g.shots.push({x:p.x+p.w/2+p.facing*24,y:p.y+25,vx:p.facing*650,life:.85});
      if(visuals) for(let i=0;i<6;i++)g.particles.push({x:p.x+p.w/2+p.facing*26,y:p.y+25,vx:p.facing*(80+Math.random()*160),vy:(Math.random()-.5)*100,life:.28});
    }
    p.x=Math.max(g.config.start,Math.min(g.config.end-p.w/2,p.x+p.vx*dt));
    // Tap for a quick hop; hold jump for a higher platform jump.
    const jumpGravity=p.vy<0?(g.keys.jump?1950:2500):2100;
    p.vy=Math.min(1000,p.vy+jumpGravity*dt);p.y+=p.vy*dt;p.ground=false;
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
        power.taken=true;audio?.play('power');p.doubleJump=Math.min(3,p.doubleJump+3);g.score+=100;
        if(visuals) for(let i=0;i<24;i++)g.particles.push({x:power.x,y:power.y,vx:(Math.random()-.5)*320,vy:(Math.random()-.5)*240,life:1});
      }
    }
    for(const flame of g.flames){
      if(!flame.taken&&overlap(p,{x:flame.x-16,y:flame.y-17,w:32,h:34})){
        flame.taken=true;audio?.play('power');p.flame=Math.min(12,p.flame+5);g.score+=50;
        g.notice='FLAME POWER! +5 FIREBALLS';g.noticeUntil=g.elapsed+2;
      }
    }
    for(const c of g.coins){
      if(!c.taken&&overlap(p,{x:c.x-12,y:c.y-12,w:24,h:24})){
       c.taken=true;g.score+=25;audio?.play('coin');
       if(visuals) for(let i=0;i<7;i++)g.particles.push({x:c.x,y:c.y,vx:(Math.random()-.5)*130,vy:-Math.random()*170,life:.5});
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
      if(b?.alive&&Math.abs(p.x-b.x)<650){audio?.setBoss(true);
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
        shot.life=0;audio?.play('hit');g.lives--;p.invuln=1.5;
        if(g.lives<=0){g.ended=true;audio?.play('over');audio?.stop();}
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
          if(!enemy.alive){g.score+=75;audio?.play('enemy');
            if(visuals) for(let i=0;i<18;i++)g.particles.push({x:enemy.x+enemy.w/2,y:enemy.y+enemy.h/2,vx:(Math.random()-.5)*260,vy:(Math.random()-.5)*230,life:.7});
          }else{g.score+=15;}
          break;
        }
      }
      if(shot.life>0&&g.guardian?.alive&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},g.guardian)){
        Object.assign(g.guardian,hitDragon(g.guardian));shot.life=0;g.score+=30;
        if(!g.guardian.alive){g.score+=500;audio?.play('boss');g.notice=`${g.guardian.kind==='ancient'?'ANCIENT':'ELDER'} DRAGON DEFEATED!`;g.noticeUntil=g.elapsed+3.5;
          if(visuals) for(let i=0;i<36;i++)g.particles.push({x:g.guardian.x+g.guardian.w/2,y:g.guardian.y+g.guardian.h/2,vx:(Math.random()-.5)*360,vy:(Math.random()-.5)*300,life:1});
        }else{audio?.play('enemy');}
      }
      if(g.level===3&&shot.life>0){
        for(const soldier of g.shadows){
          if(soldier.hp>0&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},{x:soldier.x,y:FLOOR-55,w:43,h:55})){
            soldier.hp--;shot.life=0;if(!soldier.hp){g.score+=150;audio?.play('enemy');}break;
          }
        }
        const b=g.boss;
        if(shot.life>0&&b?.alive&&overlap({x:shot.x-8,y:shot.y-8,w:16,h:16},b)){
          b.hp--;shot.life=0;g.score+=35;
          if(b.hp<=0){audio?.setBoss(false);audio?.play('boss');b.alive=false;g.bossCleared=true;g.score+=1000;g.notice='SHADOW WOODY KING DEFEATED!';g.noticeUntil=g.elapsed+4;}
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
      if(p.vy>120&&oldBottom<=e.y+14){Object.assign(e,hitDragon(e));p.vy=-390;g.score+=e.alive?15:75;audio?.play('enemy');}
      else{
       audio?.play('hit');g.lives--;p.invuln=1.4;
       if(g.lives<=0){g.ended=true;audio?.play('over');audio?.stop();}
       else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
      }
     }
    }
    if(g.guardian?.alive&&p.invuln===0&&overlap(p,g.guardian)){
      audio?.play('hit');g.lives--;p.invuln=1.5;
      if(g.lives<=0){g.ended=true;audio?.play('over');audio?.stop();}
      else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
    }
    if(g.level===3&&!g.ended&&p.invuln===0){
      for(const soldier of g.shadows){
        if(soldier.hp>0&&overlap(p,{x:soldier.x,y:FLOOR-55,w:43,h:55})){
          audio?.play('hit');g.lives--;p.invuln=1.5;
          if(g.lives<=0){g.ended=true;audio?.play('over');audio?.stop();}
          else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
          break;
        }
      }
      if(g.boss?.alive&&p.invuln===0&&overlap(p,g.boss)){
        audio?.play('hit');g.lives--;p.invuln=1.5;
        if(g.lives<=0){g.ended=true;audio?.play('over');audio?.stop();}
        else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}
      }
    }
    // Logs and stumps cannot be defeated by stomping: clear them with a jump.
    if(p.invuln===0&&!g.ended){
      for(const obstacle of g.logs){
        // Tight hitbox allows the bird's feet to visually clear the wood.
        if(overlap({x:p.x+7,y:p.y+9,w:p.w-14,h:p.h-15},{x:obstacle.x+5,y:obstacle.y+4,w:obstacle.w-10,h:obstacle.h-5})){
          audio?.play('hit');g.lives--;p.invuln=1.5;
          if(g.lives<=0){g.ended=true;audio?.play('over');audio?.stop();}
          else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vx=0;p.vy=0;p.jumps=0;p.ground=false;}
          break;
        }
      }
    }
    if(p.y>H+150&&!g.ended){audio?.play('hit');g.lives--;if(g.lives<=0){g.ended=true;audio?.play('over');audio?.stop();}else{p.x=g.checkpoint;p.y=FLOOR-p.h;p.vy=0;p.jumps=0;p.ground=false;}}
    if(!g.ended&&p.x>=g.config.end-155&&(g.level!==3||g.bossCleared)){
      g.ended=true;g.won=true;g.score+=500;audio?.play('win');audio?.stop();

    }
    if (!visuals) return;
    g.particles=g.particles.filter(v=>v.life>0);
    for(const v of g.particles){v.x+=v.vx*dt;v.y+=v.vy*dt;v.vy+=250*dt;v.life-=dt;}
}

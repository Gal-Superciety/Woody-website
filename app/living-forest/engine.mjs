import { makeLevel, LEVELS } from './levels.mjs';
export { LEVELS };
export const SAVE_KEY='woody-forest-campaign-v2';
export const WIDTH=960,HEIGHT=540;
const box=(x,y,w,h)=>({x,y,w,h});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
export function createGame(level=1,gear){
 level=Number.isInteger(level)?clamp(level,1,5):1;
 const map=makeLevel(level);
 const g={...map,level,player:{...box(70,map.floor-48,32,48),vx:0,vy:0,ground:true,facing:1,shield:1,weapon:1,lives:3,inv:0,cool:0},
 shots:[],particles:[],keys:{},jumpHeld:false,peckHeld:false,time:0,camera:{x:0,y:map.floor-440},checkpoint:null,checkpointIndex:-1,water:false,fallArmed:false,won:false,over:false,paused:true,events:[],coins:0,message:'Follow the lanterns. Climb the canopy. Your equipment travels with you.'};
 if(gear){for(const k of ['shield','weapon','lives'])g.player[k]=gear.player[k];g.coins=gear.coins;}
 g.checkpoint={x:g.player.x,y:g.player.y};return g;
}
export function snapshot(g){return {version:2,level:g.level,player:{shield:g.player.shield,weapon:g.player.weapon,lives:g.player.lives},checkpointIndex:g.checkpointIndex,broken:g.blocks.map(b=>b.broken),defeated:g.enemies.map(e=>e.hp<=0),taken:g.pickups.map(c=>c.taken),water:g.water,coins:g.coins,won:g.won};}
export function restore(data){
 if(!data||data.version!==2||!Number.isInteger(data.level)||data.level<1||data.level>5)return createGame();
 const p=data.player;
 if(!p||!Number.isInteger(p.shield)||p.shield<0||p.shield>3||![1,2,3].includes(p.weapon)||!Number.isInteger(p.lives)||p.lives<1||p.lives>3)return createGame();
 const g=createGame(data.level);Object.assign(g.player,{shield:p.shield,weapon:p.weapon,lives:p.lives});
 g.checkpointIndex=Number.isInteger(data.checkpointIndex)?clamp(data.checkpointIndex,-1,g.checkpoints.length-1):-1;
 if(g.checkpointIndex>=0)g.checkpoint={...g.checkpoints[g.checkpointIndex]};
 Object.assign(g.player,g.checkpoint);g.player.ground=false;
 g.blocks.forEach((b,i)=>b.broken=data.broken?.[i]===true);g.enemies.forEach((e,i)=>{if(data.defeated?.[i]===true)e.hp=0;});g.pickups.forEach((c,i)=>c.taken=data.taken?.[i]===true);
 g.water=data.water===true;g.coins=Number.isSafeInteger(data.coins)?clamp(data.coins,0,1000000):0;g.won=data.won===true;if(g.won)g.boss.hp=0;
 g.camera={x:clamp(g.player.x-380,0,g.width-WIDTH),y:clamp(g.player.y-300,0,g.height-HEIGHT)};return g;
}
export function advance(g){if(!g.won||g.level===5)return false;Object.assign(g,createGame(g.level+1,g));return true;}
// Return true on relocation so simulation never continues with stale collision state.
export function damage(g,fatal=false){
 const p=g.player;if(g.over||g.won||(!fatal&&p.inv>0))return false;
 g.events.push('hit');burst(g,p.x+16,p.y+20,'#88ffe0');
 if(!fatal&&p.shield>0){p.shield--;p.inv=1.2;g.message='Shield absorbed the hit.';return false;}
 p.lives--;if(p.lives<=0){g.over=true;g.keys={};g.message='Adventure over. Begin a new run.';return true;}
 Object.assign(p,g.checkpoint,{vx:0,vy:0,inv:2,ground:false,coyote:0,buffer:0});g.shots=[];g.fallArmed=false;g.jumpHeld=false;
 g.message='One life lost. Equipment kept — back at the checkpoint.';return true;
}
function move(body,dt,solids,width){
 body.vy=Math.min(650,body.vy+1100*dt);body.x=clamp(body.x+body.vx*dt,0,width-body.w);
 for(const s of solids)if(s.kind&&overlaps(body,s))body.x=body.vx>0?s.x-body.w:s.x+s.w;
 const bottom=body.y+body.h;body.y+=body.vy*dt;body.ground=false;
 for(const s of solids)if(overlaps(body,s)&&(s.kind||(body.vy>=0&&bottom<=s.y+1))){body.y=body.vy>=0?s.y-body.h:s.y+s.h;body.ground=body.vy>=0;body.vy=0;}
}
export function step(g,dt){
 if(g.paused||g.over||g.won)return;dt=clamp(dt,0,1/30);g.time+=dt;const p=g.player,k=g.keys;
 p.inv=Math.max(0,p.inv-dt);p.cool=Math.max(0,p.cool-dt);p.vx=((k.right?1:0)-(k.left?1:0))*245;if(p.vx)p.facing=Math.sign(p.vx);
 p.coyote=p.ground?.1:Math.max(0,(p.coyote||0)-dt);
 if(k.jump&&!g.jumpHeld)p.buffer=.12;else p.buffer=Math.max(0,(p.buffer||0)-dt);
 if(p.buffer>0&&p.coyote>0){p.vy=-570;p.buffer=0;p.coyote=0;g.events.push('jump');}
 if(!k.jump&&g.jumpHeld&&p.vy<-240)p.vy=-240;g.jumpHeld=!!k.jump;
 for(const b of g.blocks)if(!b.broken&&p.vy<0&&p.x+p.w>b.x&&p.x<b.x+b.w&&p.y>=b.y+b.h&&p.y+p.vy*dt<=b.y+b.h)breakBlock(g,b);
 if(k.peck&&!g.peckHeld){const hit=box(p.facing>0?p.x+p.w:p.x-55,p.y-12,55,75);g.blocks.filter(b=>!b.broken&&overlaps(hit,b)).forEach(b=>breakBlock(g,b));}g.peckHeld=!!k.peck;
 move(p,dt,[...g.platforms,...g.blocks.filter(b=>!b.broken)],g.width);
 // The starting floor is safe until WOODY lands on the second canopy tier.
 if(p.ground&&p.y+p.h<=g.floor-195)g.fallArmed=true;
 if(p.y>g.floor+120||(g.fallArmed&&p.ground&&p.y+p.h>=g.floor-1)){damage(g,true);return;}
 if(k.shoot&&p.cool===0){p.cool=.3;g.events.push('fire');for(let i=0;i<p.weapon;i++)g.shots.push({...box(p.x+16,p.y+20,10,6),vx:p.facing*550,vy:(i-(p.weapon-1)/2)*65,life:1.5,enemy:false});}
 for(const e of g.enemies){
  if(e.hp<=0)continue;e.cool=Math.max(0,e.cool-dt);const near=Math.abs(p.x-e.x)<430&&Math.abs(p.y-e.y)<190;
  e.vx=near?Math.sign(p.x-e.x)*(115+g.level*7):Math.sin(g.time+e.home)*30;
  if(near&&e.ground&&p.y<e.y-45&&e.cool===0){e.vy=-540;e.cool=1.3;}move(e,dt,g.platforms,g.width);
  if(e.y>g.floor+150)e.hp=0;
  if(overlaps(p,e)&&damage(g))return;
 }
 g.checkpoints.forEach((c,i)=>{if(i>g.checkpointIndex&&p.ground&&Math.abs(p.x-c.x)<100&&Math.abs(p.y-c.y)<3){g.checkpointIndex=i;g.checkpoint={...c};g.events.push('checkpoint');g.message='Checkpoint reached. Your equipment and coins are saved.';}});
 if(!g.water&&p.ground&&Math.abs(p.x-g.spring.x)<95&&Math.abs(p.y+p.h-(g.spring.y+62))<5&&k.peck){g.water=true;p.shield=Math.min(3,p.shield+1);g.message='Spring awakened. One shield charge restored.';g.events.push('pickup');}
 for(const c of g.pickups)if(!c.taken&&overlaps(p,c)){c.taken=true;g.coins++;g.events.push('pickup');}
 for(const q of g.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=180*dt;q.life-=dt;}g.particles=g.particles.filter(q=>q.life>0);
 const b=g.boss;
 if(b.hp>0&&p.x>g.arena.x-210&&p.y<g.arena.y+80){
  b.active=true;b.timer+=dt;const enraged=b.hp<=b.maxHp*.5;
  const charge=enraged?.85:1.2,attackEnd=charge+.65,cycleEnd=attackEnd+1.1;
  b.phase=b.timer<charge?'charging':b.timer<attackEnd?'attacking':'exposed';
  if(b.timer>=charge&&!b.fired){b.fired=true;g.events.push('roar');const count=b.kind==='wolf'?3:enraged?5:3;
   const angle=Math.atan2(p.y+24-(b.y+45),p.x+16-b.x);
   for(let i=0;i<count;i++){const a=angle+(i-(count-1)/2)*.19;g.shots.push({...box(b.x,b.y+45,14,14),vx:Math.cos(a)*(enraged?280:235),vy:Math.sin(a)*(enraged?280:235),life:4,enemy:true});}
  }
  if(b.kind==='wolf'&&b.phase==='attacking')b.x=clamp(b.x+Math.sign(p.x-b.x)*(enraged?240:180)*dt,g.arena.x+25,g.arena.x+g.arena.w-b.w-10);
  if(b.timer>=cycleEnd){b.timer=0;b.fired=false;b.cycle++;}
  if(overlaps(p,b)&&damage(g))return;
 }else if(b.hp>0){b.active=false;b.phase='dormant';b.timer=0;b.fired=false;}
 for(const s of g.shots){
  if(s.life<=0)continue;s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
  if(s.enemy){if(overlaps(p,s)){s.life=0;if(damage(g))return;}}
  else {
   for(const e of [...g.enemies,b])if(e.hp>0&&overlaps(e,s)){s.life=0;
    if(e!==b||b.phase==='exposed'){e.hp--;burst(g,s.x,s.y,'#ffc785');g.events.push('impact');}else{burst(g,s.x,s.y,'#a8b8d9');g.message='Armour closed — dodge the volley, then strike the glowing core.';}break;
   }
   if(s.life>0)for(const block of g.blocks)if(!block.broken&&overlaps(s,block)){breakBlock(g,block);s.life=0;break;}
  }
 }
 g.shots=g.shots.filter(s=>s.life>0);
 if(b.hp<=0&&!g.won){g.won=true;g.keys={};g.shots=[];g.coins+=50;g.events.push('pickup');g.message=g.level===5?'The Ember Crown has fallen. All five chapters completed.':'Guardian defeated. Your equipment continues into the next chapter.';}
 g.camera.x+=(clamp(p.x-380,0,g.width-WIDTH)-g.camera.x)*Math.min(1,dt*6);g.camera.y+=(clamp(p.y-300,0,g.height-HEIGHT)-g.camera.y)*Math.min(1,dt*6);
}
function breakBlock(g,b){b.broken=true;g.events.push('pickup');burst(g,b.x+22,b.y+22,'#ffcb7f');g.coins+=5;if(b.kind==='weapon')g.player.weapon=Math.min(3,g.player.weapon+1);else g.player.shield=Math.min(3,g.player.shield+1);g.message=b.kind==='weapon'?'Weapon upgraded — carries into the next chapter.':'Shield charge collected.';}
function burst(g,x,y,color){for(let i=0;i<14;i++)g.particles.push({x,y,vx:Math.cos(i*2.4)*95,vy:Math.sin(i*2.4)*95,life:.8,color});}

export const SAVE_KEY = 'woody-living-forest-v1';
export const WIDTH = 960, HEIGHT = 540;
const box = (x,y,w,h) => ({x,y,w,h});
export const overlaps = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
export function createGame() {
  return { player: {...box(80,1430,32,48),vx:0,vy:0,ground:false,facing:1,shield:1,weapon:1,lives:3,inv:0,cool:0},
    platforms:[box(0,1500,1900,100),box(250,1380,230,24),box(530,1260,220,24),box(800,1140,220,24),box(530,1020,220,24),box(240,900,240,24),box(510,780,220,24),box(800,660,230,24),box(1080,540,240,24),box(1380,430,460,28)],
    blocks:[{...box(340,1280,44,44),kind:'weapon',broken:false},{...box(610,1160,44,44),kind:'shield',broken:false},{...box(320,800,44,44),kind:'shield',broken:false}],
    enemies:[{...box(620,1460,35,40),hp:2,vx:0,vy:0,ground:false,cool:0},{...box(840,1100,35,40),hp:2,vx:0,vy:0,ground:false,cool:0}],
    boss:{...box(1710,350,65,80),hp:12,maxHp:12,timer:0},shots:[],particles:[],keys:{},jumpHeld:false,peckHeld:false,time:0,camera:{x:0,y:1060},checkpoint:null,checkpointActive:false,water:false,won:false,over:false,paused:true,message:'Climb the ancient tree. Break glowing blocks. Restore the spring.',coins:0 };
}
export function snapshot(g) { return {version:1,player:{x:g.player.x,y:g.player.y,shield:g.player.shield,weapon:g.player.weapon,lives:g.player.lives},broken:g.blocks.map(b=>b.broken),defeated:g.enemies.map(e=>e.hp<=0),water:g.water,coins:g.coins,checkpointActive:g.checkpointActive}; }
export function restore(data) {
 const g=createGame();
 if(!data || data.version!==1 || !data.player || !['x','y','shield','weapon','lives'].every(k=>Number.isFinite(data.player[k]))) return g;
 const p=data.player;
 if(p.x<0||p.x>1868||p.y<0||p.y>1500||!Number.isInteger(p.shield)||p.shield<0||p.shield>3||![1,2,3].includes(p.weapon)||!Number.isInteger(p.lives)||p.lives<1||p.lives>3) return g;
 Object.assign(g.player,p);g.blocks.forEach((b,i)=>b.broken=data.broken?.[i]===true);g.enemies.forEach((e,i)=>{if(data.defeated?.[i]===true)e.hp=0;});g.water=data.water===true;g.coins=Number.isFinite(data.coins)?Math.max(0,Math.min(100,data.coins)):0;g.checkpointActive=data.checkpointActive===true;g.checkpoint=snapshot(g);g.camera={x:Math.max(0,p.x-350),y:Math.max(0,p.y-280)};return g;
}
export function damage(g) {
 const p=g.player;if(p.inv>0||g.over||g.won)return;
 p.inv=1.2;
 if(p.shield>0){p.shield--;g.message='Shield absorbed the hit!';return;}
 const lives=p.lives-1;if(lives<=0){g.over=true;g.message='Adventure over. Start a new run.';return;}
 const loaded=g.checkpoint?restore(g.checkpoint):createGame();Object.assign(g,loaded,{paused:false});g.player.lives=lives;g.player.inv=2;g.message='Back at checkpoint. Equipment restored.';
 if(g.checkpoint)g.checkpoint.player.lives=lives;
}
function move(body,dt,solids){
 body.vy=Math.min(650,body.vy+1100*dt);body.x+=body.vx*dt;body.x=Math.max(0,Math.min(1900-body.w,body.x));
 for(const s of solids)if(s.kind&&overlaps(body,s)){body.x=body.vx>0?s.x-body.w:s.x+s.w;}
 const previousBottom=body.y+body.h;body.y+=body.vy*dt;body.ground=false;
 for(const s of solids)if(overlaps(body,s)&&(s.kind||(body.vy>=0&&previousBottom<=s.y+1))){if(body.vy>=0){body.y=s.y-body.h;body.ground=true;}else body.y=s.y+s.h;body.vy=0;}
}
export function step(g,dt){
 if(g.paused||g.over||g.won)return;dt=Math.min(dt,1/30);g.time+=dt;const p=g.player,k=g.keys;
 p.inv=Math.max(0,p.inv-dt);p.cool=Math.max(0,p.cool-dt);p.vx=((k.right?1:0)-(k.left?1:0))*245;if(p.vx)p.facing=Math.sign(p.vx);
 if(k.jump&&!g.jumpHeld&&p.ground)p.vy=-570;g.jumpHeld=!!k.jump;
 const solids=[...g.platforms,...g.blocks.filter(b=>!b.broken)];
 // Upward head strikes release block rewards before collision resolution.
 for(const b of g.blocks)if(!b.broken&&p.vy<0&&p.x+p.w>b.x&&p.x<b.x+b.w&&p.y>=b.y+b.h&&p.y+p.vy*dt<=b.y+b.h)breakBlock(g,b);
 if(k.peck&&!g.peckHeld){const hit=box(p.facing>0?p.x+p.w:p.x-55,p.y-12,55,75);g.blocks.filter(b=>!b.broken&&overlaps(hit,b)).forEach(b=>breakBlock(g,b));}g.peckHeld=!!k.peck;
 move(p,dt,solids.filter(s=>!s.broken));
 if(k.shoot&&p.cool===0){p.cool=.3;for(let i=0;i<p.weapon;i++)g.shots.push({...box(p.x+16,p.y+20,10,6),vx:p.facing*550,vy:(i-(p.weapon-1)/2)*90,life:1.5,enemy:false});}
 for(const e of g.enemies){if(e.hp<=0)continue;e.cool=Math.max(0,e.cool-dt);const near=Math.abs(p.x-e.x)<420&&Math.abs(p.y-e.y)<180;e.vx=near?Math.sign(p.x-e.x)*110:Math.sin(g.time)*35;if(near&&e.ground&&p.y<e.y-45&&e.cool===0){e.vy=-540;e.cool=1.3;}move(e,dt,g.platforms);if(overlaps(p,e))damage(g);}
 if(!g.checkpointActive&&p.y<800&&p.x>480&&p.x<750&&p.ground){g.checkpointActive=true;g.checkpoint=snapshot(g);g.message='Checkpoint saved — your equipment stays with you.';}
 if(!g.water&&p.x>1130&&p.x<1330&&p.y<560&&k.peck){g.water=true;p.shield=3;p.weapon=3;g.checkpointActive=true;g.checkpoint=snapshot(g);g.message='Spring restored! Triple shot and full shield. Reach the guardian.';}
 const boss=g.boss;if(boss.hp>0&&p.y<610&&p.x>1250){boss.timer+=dt;if(boss.timer>=2.5){boss.timer=0;for(let i=-1;i<=1;i++)g.shots.push({...box(boss.x,boss.y+36,14,14),vx:-230,vy:i*70,life:4,enemy:true});}}
 for(const s of g.shots){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(s.enemy){if(overlaps(p,s)){damage(g);s.life=0;}}else{for(const e of [...g.enemies,boss])if(e.hp>0&&overlaps(e,s)){e.hp--;s.life=0;break;}for(const b of g.blocks)if(!b.broken&&overlaps(s,b)){breakBlock(g,b);s.life=0;}}}
 g.shots=g.shots.filter(s=>s.life>0);if(p.y>1650) {p.inv=0;damage(g);}
 if(boss.hp<=0&&!g.won){g.won=true;g.message='The canopy is alive again. Playtest complete!';}
 g.camera.x+= (Math.max(0,Math.min(940,p.x-380))-g.camera.x)*Math.min(1,dt*6);g.camera.y+=(Math.max(0,Math.min(1060,p.y-300))-g.camera.y)*Math.min(1,dt*6);
}
function breakBlock(g,b){b.broken=true;g.coins+=5;if(b.kind==='weapon')g.player.weapon=Math.min(3,g.player.weapon+1);else g.player.shield=Math.min(3,g.player.shield+1);g.message=b.kind==='weapon'?'Double shot unlocked!':'Shield charge collected!';}

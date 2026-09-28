import { drawWolf, drawDragon } from './creatures.mjs';
import { WIDTH as W, HEIGHT as H } from './engine.mjs';
export function render(ctx,g,assets={}){
 const {x:cx,y:cy}=g.camera;
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#071b2b');bg.addColorStop(1,g.config.color);ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 if(assets.forest?.complete&&assets.forest.naturalWidth){ctx.drawImage(assets.forest,-((cx*.04)%90),-((cy*.025)%60),W+100,H+65);ctx.fillStyle='#04121e35';ctx.fillRect(0,0,W,H);}
 for(let i=0;i<38;i++){ctx.fillStyle=`rgba(146,255,203,${.2+.25*Math.sin(g.time*2+i)})`;ctx.beginPath();ctx.arc((i*137-cx*.3+2000)%W,(i*79-cy*.2+2000)%H,2,0,Math.PI*2);ctx.fill();}
 ctx.save();ctx.translate(-cx,-cy);
 for(const s of g.platforms){const rock=ctx.createLinearGradient(0,s.y,0,s.y+Math.min(s.h,90));rock.addColorStop(0,g.config.color);rock.addColorStop(1,'#101f2a');ctx.fillStyle=rock;ctx.fillRect(s.x,s.y,s.w,s.h);ctx.fillStyle='#78cda0';ctx.fillRect(s.x,s.y,s.w,5);ctx.fillStyle='#356653';for(let i=10;i<s.w;i+=24)ctx.fillRect(s.x+i,s.y+5,4,9);}
 for(const b of g.blocks)if(!b.broken){ctx.shadowBlur=15;ctx.shadowColor=b.kind==='weapon'?'#ffb15f':'#67dce9';ctx.fillStyle='#75543b';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.shadowBlur=0;ctx.strokeStyle='#ffd39a';ctx.strokeRect(b.x+3,b.y+3,b.w-6,b.h-6);ctx.fillStyle='#fff0bc';ctx.font='bold 25px sans-serif';ctx.fillText(b.kind==='weapon'?'↑':'◇',b.x+12,b.y+30);}
 const spring=g.spring;
 ctx.fillStyle=g.water?'#7affdf':'#677d85';ctx.shadowColor='#6effdd';ctx.shadowBlur=g.water?22:0;ctx.fillRect(spring.x,spring.y,spring.w,spring.h);ctx.beginPath();ctx.arc(spring.x+14,spring.y,22,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.font='13px sans-serif';ctx.fillStyle='#ceeee2';ctx.fillText('SPRING · E / PECK',spring.x-55,spring.y-30);
 for(const [i,c] of g.checkpoints.entries()){ctx.fillStyle=g.checkpointIndex>=i?'#71ffd5':'#9aaab1';ctx.fillRect(c.x,c.y-9,4,57);ctx.beginPath();ctx.moveTo(c.x+4,c.y-9);ctx.lineTo(c.x+37,c.y+4);ctx.lineTo(c.x+4,c.y+18);ctx.fill();}
 for(const coin of g.pickups)if(!coin.taken){ctx.fillStyle='#ecca84';ctx.shadowColor='#d7ba6b';ctx.shadowBlur=8;ctx.beginPath();ctx.ellipse(coin.x+7,coin.y+7+Math.sin(g.time*3+coin.x)*3,5,8,0,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;
 if(g.fallArmed){ctx.fillStyle='#a6423d88';ctx.fillRect(0,g.floor,g.width,6);}
 for(const e of g.enemies)if(e.hp>0)drawWolf(ctx,e,g.time);
 const b=g.boss;if(b.hp>0){
 if(b.phase==='charging'){ctx.fillStyle='#ed915b33';ctx.beginPath();ctx.ellipse(b.x+45,b.y+45,95+Math.sin(g.time*14)*6,90,0,0,Math.PI*2);ctx.fill();}
 if(b.kind==='wolf'){ctx.save();ctx.translate(b.x,b.y);ctx.scale(2,2);drawWolf(ctx,{...b,x:0,y:0,w:40,h:40,vx:-1},g.time);ctx.restore();}else drawDragon(ctx,b,g.time);
 ctx.fillStyle='#152329';ctx.fillRect(b.x-20,b.y-63,125,7);ctx.fillStyle=b.phase==='exposed'?'#7affdf':'#d7b888';ctx.fillRect(b.x-20,b.y-63,125*b.hp/b.maxHp,7);
 ctx.font='bold 12px sans-serif';ctx.fillStyle=b.phase==='exposed'?'#7affdf':'#ffe0b0';ctx.fillText(b.phase==='exposed'?'STRIKE NOW':b.phase==='charging'?'INCOMING':b.phase==='attacking'?'DODGE':'GUARDIAN',b.x-20,b.y-76);
 }
 for(const particle of g.particles){ctx.globalAlpha=Math.max(0,particle.life);ctx.fillStyle=particle.color;ctx.fillRect(particle.x,particle.y,3,3);}ctx.globalAlpha=1;
 for(const s of g.shots){ctx.shadowBlur=12;ctx.shadowColor=s.enemy?'#ff8b98':'#6ef9ff';ctx.fillStyle=ctx.shadowColor;ctx.beginPath();ctx.ellipse(s.x+5,s.y+3,s.enemy?8:9,s.enemy?8:3,0,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;
 const p=g.player;if(p.inv===0||Math.floor(g.time*12)%2===0){ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.scale(p.facing,1);if(p.shield){ctx.strokeStyle='#7bffde';ctx.lineWidth=2;ctx.shadowColor='#7bffde';ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(0,0,30,37,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
 ctx.fillStyle='#172b41';ctx.beginPath();ctx.ellipse(0,12,16,20,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1c9ff2';ctx.beginPath();ctx.ellipse(0,-9,18,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff843a';ctx.beginPath();ctx.moveTo(-15,-17);ctx.lineTo(-21,-38);ctx.lineTo(2,-25);ctx.lineTo(0,-37);ctx.lineTo(15,-18);ctx.fill();ctx.fillStyle='#fff4d4';ctx.beginPath();ctx.ellipse(6,-6,10,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#072531';ctx.beginPath();ctx.arc(10,-10,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd061';ctx.beginPath();ctx.moveTo(13,-5);ctx.lineTo(34,2);ctx.lineTo(12,6);ctx.fill();ctx.fillStyle='#ffa35c';const stride=p.ground?Math.sin(g.time*18)*Math.min(1,Math.abs(p.vx)/100)*4:0;ctx.fillRect(-14,25+stride,13,5);ctx.fillRect(3,25-stride,13,5);ctx.restore();}
 ctx.restore();
 const vignette=ctx.createRadialGradient(W/2,H/2,130,W/2,H/2,570);vignette.addColorStop(0,'#0000');vignette.addColorStop(1,'#02081299');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#d7e8dc';ctx.font='12px sans-serif';ctx.fillText(`CHAPTER ${g.level} / 5 · ${g.config.name.toUpperCase()}`,22,28);
 if(g.fallArmed){ctx.fillStyle='#edbfa1';ctx.fillText('FLOOR IS FATAL · LAND ON A LEDGE',22,48);}
}

import { WIDTH as W, HEIGHT as H } from './engine.mjs';
export function render(ctx,g){
 const {x:cx,y:cy}=g.camera;
 const bg=ctx.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#071b2b');bg.addColorStop(1,'#123b3b');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
 // Layered silhouettes use world coordinates at different camera speeds.
 for(let layer=0;layer<3;layer++){ctx.fillStyle=['#102d39','#174044','#195052'][layer];for(let i=-2;i<12;i++){const x=i*190-cx*(.12+layer*.12);ctx.fillRect(x,0,25+layer*15,H);for(let j=0;j<4;j++){ctx.beginPath();ctx.ellipse(x+12,j*190-cy*.18,100-layer*13,40, -.2,0,Math.PI*2);ctx.fill();}}}
 for(let i=0;i<38;i++){ctx.fillStyle=`rgba(146,255,203,${.2+.25*Math.sin(g.time*2+i)})`;ctx.beginPath();ctx.arc((i*137-cx*.3+2000)%W,(i*79-cy*.2+2000)%H,2,0,Math.PI*2);ctx.fill();}
 ctx.save();ctx.translate(-cx,-cy);
 ctx.fillStyle='#254440';ctx.fillRect(405,150,130,1400);ctx.fillStyle='#416057';ctx.fillRect(430,150,8,1400);
 for(const s of g.platforms){ctx.fillStyle='#203e3d';ctx.fillRect(s.x,s.y,s.w,s.h);ctx.fillStyle='#78cda0';ctx.fillRect(s.x,s.y,s.w,5);ctx.fillStyle='#356653';for(let i=10;i<s.w;i+=24)ctx.fillRect(s.x+i,s.y+5,4,9);}
 for(const b of g.blocks)if(!b.broken){ctx.shadowBlur=15;ctx.shadowColor=b.kind==='weapon'?'#ffb15f':'#67dce9';ctx.fillStyle='#75543b';ctx.fillRect(b.x,b.y,b.w,b.h);ctx.shadowBlur=0;ctx.strokeStyle='#ffd39a';ctx.strokeRect(b.x+3,b.y+3,b.w-6,b.h-6);ctx.fillStyle='#fff0bc';ctx.font='bold 25px sans-serif';ctx.fillText(b.kind==='weapon'?'↑':'◇',b.x+12,b.y+30);}
 ctx.fillStyle=g.water?'#7affdf':'#677d85';ctx.shadowColor='#6effdd';ctx.shadowBlur=g.water?22:0;ctx.fillRect(1200,478,28,62);ctx.beginPath();ctx.arc(1214,474,25,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 if(g.water){ctx.strokeStyle='#6ddce7';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(1214,530);ctx.bezierCurveTo(1160,840,1480,1040,1400,1500);ctx.stroke();}
 ctx.font='14px sans-serif';ctx.fillStyle='#ceeee2';ctx.fillText('RESTORE SPRING · E / PECK',1090,455);
 ctx.fillStyle=g.checkpointActive?'#71ffd5':'#9aaab1';ctx.fillRect(560,723,4,57);ctx.beginPath();ctx.moveTo(564,723);ctx.lineTo(600,736);ctx.lineTo(564,751);ctx.fill();
 for(const e of g.enemies)if(e.hp>0){ctx.fillStyle='#be778b';ctx.beginPath();ctx.ellipse(e.x+18,e.y+22,19,20,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffdfba';ctx.fillRect(e.x+5,e.y+10,8,7);ctx.fillRect(e.x+22,e.y+10,8,7);}
 const b=g.boss;if(b.hp>0){ctx.fillStyle=b.timer>1.8?'#edb164':'#745d80';ctx.beginPath();ctx.ellipse(b.x+32,b.y+42,39,44,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff4bb';ctx.fillRect(b.x+9,b.y+20,12,10);ctx.fillRect(b.x+42,b.y+20,12,10);ctx.fillStyle='#203238';ctx.fillRect(b.x-10,b.y-20,85,7);ctx.fillStyle='#ffb879';ctx.fillRect(b.x-10,b.y-20,85*b.hp/b.maxHp,7);if(b.timer>1.8){ctx.font='bold 18px sans-serif';ctx.fillText('!',b.x+27,b.y-30);}}
 for(const s of g.shots){ctx.shadowBlur=12;ctx.shadowColor=s.enemy?'#ff8b98':'#6ef9ff';ctx.fillStyle=ctx.shadowColor;ctx.beginPath();ctx.ellipse(s.x+5,s.y+3,s.enemy?8:9,s.enemy?8:3,0,0,Math.PI*2);ctx.fill();}ctx.shadowBlur=0;
 const p=g.player;if(p.inv===0||Math.floor(g.time*12)%2===0){ctx.save();ctx.translate(p.x+p.w/2,p.y+p.h/2);ctx.scale(p.facing,1);if(p.shield){ctx.strokeStyle='#7bffde';ctx.lineWidth=2;ctx.shadowColor='#7bffde';ctx.shadowBlur=10;ctx.beginPath();ctx.ellipse(0,0,30,37,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
 ctx.fillStyle='#172b41';ctx.beginPath();ctx.ellipse(0,12,16,20,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#1c9ff2';ctx.beginPath();ctx.ellipse(0,-9,18,18,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff843a';ctx.beginPath();ctx.moveTo(-15,-17);ctx.lineTo(-21,-38);ctx.lineTo(2,-25);ctx.lineTo(0,-37);ctx.lineTo(15,-18);ctx.fill();ctx.fillStyle='#fff4d4';ctx.beginPath();ctx.ellipse(6,-6,10,11,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#072531';ctx.beginPath();ctx.arc(10,-10,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd061';ctx.beginPath();ctx.moveTo(13,-5);ctx.lineTo(34,2);ctx.lineTo(12,6);ctx.fill();ctx.fillStyle='#ffa35c';const stride=p.ground?Math.sin(g.time*18)*Math.min(1,Math.abs(p.vx)/100)*4:0;ctx.fillRect(-14,25+stride,13,5);ctx.fillRect(3,25-stride,13,5);ctx.restore();}
 ctx.restore();
}

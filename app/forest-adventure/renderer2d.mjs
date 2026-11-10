// Original 2D side-scrolling art for WOODY Forest Adventure.
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const polygon=(ctx,points,fill,stroke,width=1)=>{ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}};
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function tree(ctx,x,base,scale,clock,worldSeed=x){
 // Use a world-space seed for fixed geometry. Screen-space x moves with the
 // camera, so deriving tree height from it makes crowns flicker while scrolling.
 const sx=x, trunkH=(158+hash(Math.round(worldSeed))*85)*scale,tw=16*scale;
 ctx.save();
 ctx.fillStyle='rgba(8,23,30,.25)';ctx.beginPath();ctx.ellipse(sx,base+3,38*scale,8*scale,0,0,Math.PI*2);ctx.fill();
 const wood=ctx.createLinearGradient(sx-tw,0,sx+tw,0);wood.addColorStop(0,'#352c32');wood.addColorStop(.35,'#72503c');wood.addColorStop(.7,'#503b34');wood.addColorStop(1,'#2f3036');
 polygon(ctx,[[sx-tw*.55,base],[sx-tw*.7,base-trunkH],[sx+tw*.55,base-trunkH],[sx+tw,base]],wood);
 ctx.strokeStyle='rgba(203,155,95,.42)';ctx.lineWidth=2*scale;ctx.beginPath();ctx.moveTo(sx-3*scale,base-14*scale);ctx.lineTo(sx-7*scale,base-trunkH+20*scale);ctx.stroke();
 for(const [dx,dy,rx,ry,col] of [
   [-22,-trunkH-17,35,29,'#21664c'],[15,-trunkH-25,39,34,'#2b7c57'],[-3,-trunkH-53,33,31,'#409469'],[42,-trunkH-3,29,24,'#1e5e49'],[-43,-trunkH+2,28,25,'#347d5c']
 ]){ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(sx+dx*scale,base+dy*scale,rx*scale,ry*scale,0,0,Math.PI*2);ctx.fill();}
 ctx.fillStyle='rgba(157,223,135,.3)';ctx.beginPath();ctx.ellipse(sx-6*scale,base-trunkH-49*scale,16*scale,9*scale,-.35,0,Math.PI*2);ctx.fill();
 const moteX=sx+Math.sin(clock*.8+x)*25*scale;ctx.shadowColor='#e8ffad';ctx.shadowBlur=10*scale;ctx.fillStyle='#d6f6a0';ctx.beginPath();ctx.arc(moteX,base-trunkH-32*scale,2.2*scale,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 ctx.restore();
}
function background(ctx,cam,viewW,H,clock){
 const sky=ctx.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#091a37');sky.addColorStop(.42,'#20516d');sky.addColorStop(.72,'#5c9a87');sky.addColorStop(1,'#a7c982');ctx.fillStyle=sky;ctx.fillRect(0,0,viewW,H);
 const sunX=viewW*.82,sunY=91+Math.sin(clock*.08)*4;ctx.save();ctx.shadowColor='#c9ffbd';ctx.shadowBlur=40;ctx.fillStyle='#d7f5b2';ctx.beginPath();ctx.arc(sunX,sunY,31,0,Math.PI*2);ctx.fill();ctx.restore();
 // Soft light columns make the canopy feel deep without obscuring the playfield.
 for(let i=0;i<5;i++){const x=((i*260-cam*.12)%(viewW+300)+viewW+300)%(viewW+300)-100;const beam=ctx.createLinearGradient(x,130,x+90,360);beam.addColorStop(0,'rgba(203,244,185,.11)');beam.addColorStop(1,'rgba(203,244,185,0)');ctx.fillStyle=beam;ctx.beginPath();ctx.moveTo(x,125);ctx.lineTo(x+55,125);ctx.lineTo(x+165,365);ctx.lineTo(x+28,365);ctx.fill();}
 for(let layer=0;layer<3;layer++){
  const par=[.12,.22,.34][layer],base=[365,383,405][layer],step=[390,315,245][layer],offset=(cam*par)%step;
  ctx.fillStyle=['#244e66','#1b5b58','#164a3d'][layer];
  for(let i=-2;i<Math.ceil(viewW/step)+3;i++){
   const x=i*step-offset;
   ctx.beginPath();ctx.moveTo(x-90,base);ctx.bezierCurveTo(x+25,base-65,x+75,base-140+layer*20,x+step*.48,base-185+layer*29);ctx.bezierCurveTo(x+step*.83,base-105,x+step+35,base-70,x+step+115,base);ctx.closePath();ctx.fill();
  }
 }
 // Distant waterfalls shimmer between the ridges.
 for(const wx of [480,1510,2540,3520]){const x=wx-cam*.22;if(x<-130||x>viewW+130)continue;const fall=ctx.createLinearGradient(x,155,x+80,390);fall.addColorStop(0,'rgba(102,230,232,0)');fall.addColorStop(.52,'rgba(161,250,235,.33)');fall.addColorStop(1,'rgba(102,230,232,0)');ctx.fillStyle=fall;ctx.beginPath();ctx.moveTo(x,170);ctx.lineTo(x+60,170);ctx.lineTo(x+90,390);ctx.lineTo(x-12,390);ctx.fill();}
 // Motes drift in front of the mountains.
 for(let i=0;i<28;i++){const x=((i*179-cam*.28+Math.sin(clock*.5+i)*16)%(viewW+40)+viewW+40)%(viewW+40)-20,y=145+(i*71)%230;ctx.fillStyle='rgba(229,255,177,.55)';ctx.beginPath();ctx.arc(x,y,1.3+(i%3)*.45,0,Math.PI*2);ctx.fill();}
}
function drawTerrain(ctx,s,cam,H,FLOOR,clock){
 const x=s.x-cam,y=s.y,w=s.w,h=s.h,ground=y>=FLOOR-1;
 ctx.save();
 ctx.fillStyle='rgba(10,22,21,.26)';ctx.shadowColor='rgba(6,18,19,.35)';ctx.shadowBlur=ground?10:12;ctx.shadowOffsetY=8;ctx.fillRect(x+3,y+5,w,h);ctx.restore();
 const dirt=ctx.createLinearGradient(0,y,0,y+h);dirt.addColorStop(0,ground?'#67503a':'#77533a');dirt.addColorStop(.32,'#514034');dirt.addColorStop(1,'#302f34');ctx.fillStyle=dirt;ctx.fillRect(x,y+7,w,h-7);
 // Irregular bark-and-soil strata on the vertical face.
 ctx.strokeStyle='rgba(194,150,94,.3)';ctx.lineWidth=2;
 for(let n=0;n<Math.min(3,Math.floor(h/23));n++){const yy=y+22+n*23;ctx.beginPath();ctx.moveTo(x+10,yy);ctx.bezierCurveTo(x+w*.3,yy-5,x+w*.55,yy+6,x+w-10,yy-2);ctx.stroke();}
 for(let xx=x+25;xx<x+w-8;xx+=71){const seed=hash(Math.floor(xx+cam));ctx.fillStyle=seed>.5?'rgba(215,182,121,.38)':'rgba(22,31,32,.34)';ctx.beginPath();ctx.ellipse(xx,y+25+seed*42,3+seed*4,2+seed*2,seed,0,Math.PI*2);ctx.fill();}
 const grass=ctx.createLinearGradient(0,y,0,y+12);grass.addColorStop(0,'#c4e888');grass.addColorStop(.35,'#83b957');grass.addColorStop(1,'#4e8d4d');ctx.fillStyle=grass;ctx.fillRect(x,y,w,11);
 ctx.fillStyle='#d8efa0';ctx.fillRect(x,y,w,2.5);ctx.fillStyle='rgba(38,78,51,.8)';ctx.fillRect(x,y+10,w,2);
 for(let xx=x+12;xx<x+w-8;xx+=23){const k=hash(Math.floor(xx+cam));ctx.strokeStyle=k>.5?'#b9d873':'#6da54e';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(xx,y+1);ctx.lineTo(xx-2-k*3,y-3-k*4);ctx.moveTo(xx+4,y+2);ctx.lineTo(xx+6+k*2,y-2-k*4);ctx.stroke();}
 if(!ground){ // rock lip and a clear, shaded landing edge
  ctx.fillStyle='rgba(213,240,142,.24)';ctx.fillRect(x+8,y+13,w-16,2);
  ctx.fillStyle='rgba(24,29,32,.34)';ctx.fillRect(x+4,y+h-5,w-8,5);
  for(let xx=x+18;xx<x+w-12;xx+=42){ctx.fillStyle='rgba(182,143,95,.28)';ctx.beginPath();ctx.moveTo(xx,y+18);ctx.lineTo(xx+8,y+13+hash(xx)*5);ctx.lineTo(xx+15,y+18);ctx.fill();}
 }
 ctx.restore();
}
function drawWater(ctx,a,b,cam,FLOOR,H,clock){
 const x=a-cam,w=b-a;if(x+w<-20||x>ctx.canvas.width+20)return;
 const water=ctx.createLinearGradient(0,FLOOR+5,0,H);water.addColorStop(0,'#70e4dc');water.addColorStop(.16,'#32b9c1');water.addColorStop(1,'#075a83');ctx.fillStyle=water;ctx.fillRect(x,FLOOR+6,w,H-FLOOR);
 ctx.fillStyle='rgba(201,255,230,.36)';ctx.fillRect(x,FLOOR+5,w,3);
 for(let row=0;row<4;row++){ctx.strokeStyle=row===0?'rgba(219,255,245,.85)':'rgba(132,234,228,.58)';ctx.lineWidth=row===0?2:1.2;ctx.beginPath();for(let xx=x;xx<=x+w+2;xx+=16){const yy=FLOOR+17+row*19+Math.sin(clock*3+xx*.035+row)*3;if(xx===x)ctx.moveTo(xx,yy);else ctx.lineTo(xx,yy);}ctx.stroke();}
 for(let n=0;n<6;n++){const bx=x+((clock*42+n*37)%Math.max(1,w));const by=FLOOR+29+(n*23)%Math.max(1,H-FLOOR-40);ctx.fillStyle='rgba(221,255,242,.45)';ctx.beginPath();ctx.arc(bx,by,1.5+n%2,0,Math.PI*2);ctx.fill();}
}
function drawTreeRows(ctx,cam,viewW,clock){
 for(const layer of [0,1]){const step=layer===0?385:560,par=layer===0?.52:.72,first=Math.floor(cam*par/step)*step-step;for(let worldX=first;worldX<cam*par+viewW+step;worldX+=step){const sc=layer===0?.76:1.02;tree(ctx,worldX-cam*par,446,sc,clock,worldX);}}
}
function drawMovingPlatform(ctx,m,cam,clock){
 const x=m.x-cam,y=m.currentY,w=m.w,h=m.h;
 ctx.save();ctx.shadowColor='#73fff0';ctx.shadowBlur=17;ctx.fillStyle='rgba(55,176,176,.35)';ctx.fillRect(x-4,y-7,w+8,h+9);ctx.restore();
 ctx.fillStyle='#233e51';ctx.fillRect(x,y+5,w,h+10);const g=ctx.createLinearGradient(x,y,x,y+9);g.addColorStop(0,'#d5fff0');g.addColorStop(.45,'#6ce5d2');g.addColorStop(1,'#307e83');ctx.fillStyle=g;ctx.fillRect(x,y,w,9);
 ctx.strokeStyle='rgba(225,255,232,.85)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x+8,y+3);ctx.lineTo(x+w-8,y+3);ctx.stroke();
 for(let xx=x+18;xx<x+w-8;xx+=28){ctx.fillStyle='rgba(195,255,236,.7)';ctx.beginPath();ctx.arc(xx,y+5+Math.sin(clock*2+xx)*1.4,1.5,0,Math.PI*2);ctx.fill();}
}
function coin(ctx,c,clock,cam){
 if(c.taken)return;const x=c.x-cam,y=c.y+Math.sin(clock*4+c.x)*4,spin=.28+.72*Math.abs(Math.cos(clock*5+c.x));
 ctx.save();ctx.translate(x,y);ctx.scale(spin,1);ctx.shadowColor='#ffdf70';ctx.shadowBlur=13;const g=ctx.createLinearGradient(-12,-13,12,13);g.addColorStop(0,'#fff4b3');g.addColorStop(.34,'#ffd45e');g.addColorStop(.72,'#e79a2e');g.addColorStop(1,'#9d541f');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,10,13,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff1a3';ctx.lineWidth=2;ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#7d4b25';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('W',0,4);ctx.restore();
}
function drawDragon(ctx,e,img,clock,cam,big=false){
 if(!img)return;const bob=Math.sin(clock*(big?1.35:2.8)+e.phase)*5,wing=Math.sin(clock*5+e.phase)*.035,x=e.x+e.w/2-cam,y=e.y+e.h/2+bob;
 ctx.save();ctx.translate(x,y);if(e.facing<0)ctx.scale(-1,1);ctx.rotate(wing);ctx.shadowColor=big?'rgba(157,78,218,.5)':'rgba(105,205,103,.38)';ctx.shadowBlur=big?17:8;
 const scale=big?1.32:1.3;ctx.drawImage(img,-e.w*scale/2,-e.h*scale/2,e.w*scale,e.h*scale);ctx.restore();
 if(e.hp<e.maxHp){const bw=e.w*(big?.86:.7),bx=x-bw/2,by=e.y-cam*0+e.h*.04+bob-10;ctx.fillStyle='rgba(20,27,35,.8)';ctx.fillRect(bx,by,bw,5);ctx.fillStyle='#ffc36b';ctx.fillRect(bx,by,bw*e.hp/e.maxHp,5);}
}
function drawGuardianBar(ctx,d,clock,cam){
 const x=d.x-cam,y=d.y+bobless(clock,d.phase);const w=d.w;
 ctx.fillStyle='rgba(20,16,28,.88)';ctx.fillRect(x,y-24,w,8);ctx.fillStyle=d.kind==='ancient'?'#d56ce6':'#e3ad67';ctx.fillRect(x,y-24,w*d.hp/d.maxHp,8);
 ctx.strokeStyle='rgba(255,255,255,.52)';ctx.lineWidth=1;ctx.strokeRect(x,y-24,w,8);
 ctx.fillStyle='#fff1d8';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(d.kind==='ancient'?'ANCIENT DRAGON':'ELDER DRAGON',x+w/2,y-30);ctx.textAlign='left';
}
function bobless(clock,phase){return Math.sin(clock*1.35+phase)*5;}
function drawWoody(ctx,p,sprite,clock,cam){
 const x=p.x+p.w/2-cam,y=p.y+p.h/2,run=p.ground&&Math.abs(p.vx)>20?Math.sin(clock*18):0;
 const scale=p.ground&&Math.abs(p.vx)>20?1+Math.abs(run)*.012:1;
 ctx.save();ctx.translate(x,y+(p.ground?Math.abs(run)*-1.3:0));if(p.invuln>0&&Math.floor(clock*12)%2)ctx.globalAlpha=.35;
 ctx.scale((p.facing||1)*1.22,scale);ctx.rotate(p.ground?run*.018:clamp(p.vy/900,-.12,.1));
 if(sprite){ctx.shadowColor='rgba(5,17,26,.45)';ctx.shadowBlur=8;ctx.drawImage(sprite,-36,-43,72,86);}
 else{ctx.fillStyle='#244b70';ctx.beginPath();ctx.ellipse(0,0,19,27,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
function drawBoss(ctx,b,sprite,clock,cam){
 const x=b.x+b.w/2-cam,y=b.y+b.h/2+bobless(clock,.4);
 ctx.save();ctx.translate(x,y);ctx.shadowColor='#bb39fa';ctx.shadowBlur=24;
 if(sprite){ctx.filter='hue-rotate(245deg) saturate(1.4) brightness(.62)';ctx.drawImage(sprite,-b.w*.65,-b.h*.69,b.w*1.3,b.h*1.38);ctx.filter='none';}
 else{ctx.fillStyle='#311543';ctx.beginPath();ctx.ellipse(0,0,36,42,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();ctx.fillStyle='#32113e';ctx.fillRect(x-52,y-b.h*.72,104,10);ctx.fillStyle='#f34c91';ctx.fillRect(x-52,y-b.h*.72,104*b.hp/b.maxHp,10);ctx.strokeStyle='#ffc5ec';ctx.strokeRect(x-52,y-b.h*.72,104,10);ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('SHADOW WOODY KING',x,y-b.h*.72-7);ctx.textAlign='left';
}
function drawObstacle(ctx,o,cam,clock,FLOOR){
 const x=o.x-cam,y=o.y;
 ctx.save();ctx.shadowColor='rgba(10,15,17,.55)';ctx.shadowBlur=7;ctx.shadowOffsetY=5;
 if(o.type==='stump'){
  const g=ctx.createLinearGradient(x,0,x+o.w,0);g.addColorStop(0,'#4d372d');g.addColorStop(.5,'#976444');g.addColorStop(1,'#3b302d');ctx.fillStyle=g;ctx.fillRect(x+5,FLOOR-o.h+8,o.w-10,o.h-8);ctx.beginPath();ctx.ellipse(x+o.w/2,FLOOR-o.h+8,(o.w-10)/2,9,0,0,Math.PI*2);ctx.fill();ctx.restore();ctx.fillStyle='#d1a36a';ctx.beginPath();ctx.ellipse(x+o.w/2,FLOOR-o.h+7,(o.w-10)/2-4,5,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#77523b';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x+o.w/2,FLOOR-o.h+7,5,2,0,0,Math.PI*2);ctx.stroke();
 }else{
  const cy=FLOOR-o.h/2,g=ctx.createLinearGradient(0,cy-o.h/2,0,cy+o.h/2);g.addColorStop(0,'#b9824f');g.addColorStop(.4,'#704832');g.addColorStop(1,'#392d2b');ctx.fillStyle=g;ctx.beginPath();ctx.roundRect(x,cy-o.h/2,o.w,o.h,o.h/2);ctx.fill();ctx.restore();ctx.strokeStyle='#d0a06b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+12,cy-3);ctx.bezierCurveTo(x+26,cy-12,x+32,cy+8,x+48,cy);ctx.moveTo(x+o.w-22,cy-5);ctx.lineTo(x+o.w-12,cy+5);ctx.stroke();ctx.fillStyle='#b58a61';ctx.beginPath();ctx.ellipse(x+4,cy,o.h*.4,o.h*.42,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#674934';ctx.stroke();
 }
}
function drawShadow(ctx,p,g,cam,FLOOR,solids){
 const center=p.x+p.w/2,bottom=p.y+p.h,surfaces=[...solids,...(g?.moving||[]).map(v=>({...v,y:v.currentY}))],under=surfaces.filter(s=>center>=s.x-25&&center<=s.x+s.w+25&&s.y>=bottom-8).sort((a,b)=>a.y-b.y)[0]||{y:FLOOR};
 const height=Math.max(0,under.y-bottom),size=1-clamp(height/470,0,.65),alpha=.32*(1-clamp(height/300,0,.75)),x=center-cam,y=under.y+2;
 ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle='#132524';ctx.shadowColor='#162322';ctx.shadowBlur=6;ctx.beginPath();ctx.ellipse(x,y,24*size,7*size,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawItems(ctx,g,clock,cam,FLOOR,H){
 for(const c of g?.coins||[])coin(ctx,c,clock,cam);
 for(const power of g?.powerups||[]){if(power.taken)continue;const x=power.x-cam,y=power.y+Math.sin(clock*3+power.x)*6;ctx.save();ctx.translate(x,y);ctx.rotate(clock*.7);ctx.shadowColor='#72f2ff';ctx.shadowBlur=20;const grad=ctx.createLinearGradient(-15,-15,15,15);grad.addColorStop(0,'#dcffff');grad.addColorStop(.5,'#66e8f6');grad.addColorStop(1,'#4489c2');polygon(ctx,[[0,-19],[15,0],[0,19],[-15,0]],grad,'#d8ffff',2);ctx.restore();}
 for(const f of g?.flames||[]){if(f.taken)continue;const x=f.x-cam,y=f.y+Math.sin(clock*3+f.x)*5;ctx.save();ctx.shadowColor='#ff8d32';ctx.shadowBlur=17;ctx.fillStyle='#ffb537';ctx.beginPath();ctx.arc(x,y,12,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ef5428';ctx.beginPath();ctx.moveTo(x,y-16);ctx.bezierCurveTo(x-15,y+1,x-7,y+12,x,y+9);ctx.bezierCurveTo(x+12,y+11,x+13,y-4,x+4,y-12);ctx.bezierCurveTo(x+5,y-2,x-1,y+1,x,y-16);ctx.fill();ctx.restore();}
 for(const s of g?.shots||[]){const x=s.x-cam,y=s.y;ctx.save();ctx.shadowColor='#ff751e';ctx.shadowBlur=17;ctx.fillStyle='#ffc33f';ctx.beginPath();ctx.ellipse(x,y,9,7,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0a5';ctx.beginPath();ctx.arc(x+Math.sign(s.vx)*2,y-1,3,0,Math.PI*2);ctx.fill();ctx.restore();}
 for(const s of g?.enemyShots||[]){const x=s.x-cam,y=s.y;ctx.save();ctx.shadowColor=s.kind==='dragon-fire'?'#ff542a':'#ca54f2';ctx.shadowBlur=14;ctx.fillStyle=s.kind==='dragon-fire'?'#ff9d34':'#d67afa';ctx.beginPath();ctx.arc(x,y,8,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff0b3';ctx.beginPath();ctx.arc(x-2,y-2,2.5,0,Math.PI*2);ctx.fill();ctx.restore();}
 for(const v of g?.particles||[]){ctx.globalAlpha=clamp(v.life*2,0,1);ctx.fillStyle='#ffe18b';ctx.beginPath();ctx.arc(v.x-cam,v.y,3.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}
}
export function renderForest2D(ctx,{g,cam,viewW,H,WORLD,FLOOR,solids,clock,sprite,smallDragonSprite,guardianDragonSprite}){
 background(ctx,cam,viewW,H,clock);drawTreeRows(ctx,cam,viewW,clock);
 const gaps=[[620,760],[1330,1440],[2030,2140],[2760,2890],[3900,4020],[4480,4620],[5130,5280],[5690,5910],[6380,6550],[7080,7220]];
 for(const s of solids)drawTerrain(ctx,s,cam,H,FLOOR,clock);
 for(const [a,b] of gaps)drawWater(ctx,a,b,cam,FLOOR,H,clock);
 for(const m of g?.moving||[])drawMovingPlatform(ctx,m,cam,clock);
 for(const c of g?.crumble||[]){if(c.fallen)continue;const wobble=c.triggered?Math.sin(clock*46)*3:0;ctx.save();ctx.translate(wobble,c.triggered?Math.sin(clock*37)*2:0);const x=c.x-cam,y=c.y;ctx.shadowColor='rgba(6,16,21,.4)';ctx.shadowBlur=8;ctx.fillStyle=c.triggered?'#805440':'#6e5140';ctx.fillRect(x,y,c.w,c.h);ctx.shadowBlur=0;ctx.fillStyle=c.triggered?'#e6ad75':'#b9db7a';ctx.fillRect(x,y,c.w,5);ctx.strokeStyle='#382f35';ctx.lineWidth=2;for(let xx=x+19;xx<x+c.w-8;xx+=25){ctx.beginPath();ctx.moveTo(xx,y+5);ctx.lineTo(xx-6,y+15);ctx.stroke();}ctx.restore();}
 for(const o of g?.logs||[])drawObstacle(ctx,o,cam,clock,FLOOR);
 // Trees and gates are placed behind collectible and combat actors.
 for(const cp of [2160,4700,5980,7310]){const x=cp-cam;if(x<-30||x>viewW+30)continue;ctx.fillStyle='#8c704c';ctx.fillRect(x,355,7,101);ctx.fillStyle='#8ff0be';polygon(ctx,[[x+7,358],[x+57,372],[x+7,389]],'#47d49c','#c1ffe1',1);}
 const end=g?.config?.end??WORLD-90,portalX=end-90-cam;ctx.save();ctx.shadowColor='#8feaff';ctx.shadowBlur=22;ctx.strokeStyle='#b6f4ff';ctx.lineWidth=8;ctx.beginPath();ctx.ellipse(portalX,FLOOR-61,27,58,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(84,215,245,.12)';ctx.fill();ctx.restore();
 drawItems(ctx,g,clock,cam,FLOOR,H);
 for(const e of g?.enemies||[]){if(!e.alive)continue;drawDragon(ctx,e,smallDragonSprite,clock,cam,false);if(e.hp<e.maxHp){const x=e.x-cam,y=e.y-8;ctx.fillStyle='rgba(15,25,25,.75)';ctx.fillRect(x+15,y,e.w-30,4);ctx.fillStyle='#ffc36b';ctx.fillRect(x+15,y,(e.w-30)*e.hp/e.maxHp,4);}}
 if(g?.guardian?.alive){drawDragon(ctx,g.guardian,guardianDragonSprite,clock,cam,true);drawGuardianBar(ctx,g.guardian,clock,cam);}
 for(const s of g?.shadows||[]){if(s.hp<=0)continue;const x=s.x-cam;ctx.save();ctx.shadowColor='#c052ff';ctx.shadowBlur=17;ctx.fillStyle='#392257';ctx.beginPath();ctx.ellipse(x+22,FLOOR-28,22,28,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ec55cb';ctx.beginPath();ctx.arc(x+14,FLOOR-38,4,0,Math.PI*2);ctx.arc(x+30,FLOOR-38,4,0,Math.PI*2);ctx.fill();ctx.restore();}
 if(g?.boss?.alive)drawBoss(ctx,g.boss,sprite,clock,cam);
 if(g?.player){drawShadow(ctx,g.player,g,cam,FLOOR,solids);drawWoody(ctx,g.player,sprite,clock,cam);}
}

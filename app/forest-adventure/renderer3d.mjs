// Lightweight 3D-style renderer for the side-scrolling Forest Adventure.
// Geometry is built from shaded facets and projected through a shallow perspective camera.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function project(x,y,z,cam,viewW){
 const depth=1+(z/900);
 return {x:viewW*.34+(x-cam-viewW*.34)*depth,y:456-y*depth-z*.08,s:depth};
}
function polygon(ctx,pts,color,stroke=null){
 ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}
}
function ellipsoid(ctx,cx,cy,cz,rx,ry,rz,color,cam,viewW,segments=8,rings=5){
 const verts=[];for(let j=0;j<=rings;j++){const lat=-Math.PI/2+Math.PI*j/rings,row=[];for(let i=0;i<=segments;i++){const lon=2*Math.PI*i/segments;row.push(project(cx+rx*Math.cos(lat)*Math.cos(lon),cy+ry*Math.sin(lat),cz+rz*Math.cos(lat)*Math.sin(lon),cam,viewW));}verts.push(row);}
 for(let j=0;j<rings;j++)for(let i=0;i<segments;i++){const light=.74+((i+j)%3)*.12;const c=shade(color,light);polygon(ctx,[verts[j][i],verts[j][i+1],verts[j+1][i+1],verts[j+1][i]],c);}
}
function shade(hex,m){const n=parseInt(hex.slice(1),16),r=clamp(((n>>16)&255)*m,0,255),g=clamp(((n>>8)&255)*m,0,255),b=clamp((n&255)*m,0,255);return `rgb(${r|0},${g|0},${b|0})`;}
function box(ctx,x,y,z,w,h,d,top,side,cam,viewW){
 const a=project(x,y,z,cam,viewW),b=project(x+w,y,z,cam,viewW),c=project(x+w,y+h,z,cam,viewW),e=project(x,y+h,z,cam,viewW),f=project(x,y,z+d,cam,viewW),g=project(x+w,y,z+d,cam,viewW),h1=project(x+w,y+h,z+d,cam,viewW),i=project(x,y+h,z+d,cam,viewW);
 polygon(ctx,[a,b,c,e],top);polygon(ctx,[f,g,h1,i],side);polygon(ctx,[b,g,h1,c],shade(side,.7));polygon(ctx,[e,c,h1,i],shade(side,.82));
}
function line3(ctx,a,b,color,width,cam,viewW){const p=project(...a,cam,viewW),q=project(...b,cam,viewW);ctx.strokeStyle=color;ctx.lineWidth=width*p.s;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}
function coin(ctx,x,y,clock,cam,viewW){const p=project(x,y+Math.sin(clock*4+x)*5,18,cam,viewW),s=12*p.s;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(clock*.7);ctx.shadowBlur=15;ctx.shadowColor='#ffe37b';const g=ctx.createLinearGradient(-s,-s,s,s);g.addColorStop(0,'#fff7bf');g.addColorStop(.45,'#ffc33b');g.addColorStop(1,'#a96518');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,s*.72,s,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff0a0';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
function woody(ctx,p,clock,cam,viewW,sprite){
 const worldX=p.x+p.w/2,worldY=456-(p.y+p.h/2),q=project(worldX,worldY,0,cam,viewW);
 const stride=p.ground&&Math.abs(p.vx)>20?Math.sin(clock*18):0;
 const stretch=p.ground?1:1+Math.min(.08,Math.abs(p.vy)/900);
 ctx.save();ctx.translate(q.x,q.y+(p.ground?Math.abs(stride)*-1.5:0));
 if(p.invuln>0&&Math.floor(clock*12)%2)ctx.globalAlpha=.4;
 ctx.scale((p.facing||1)*1.08,stretch);
 ctx.rotate(p.ground?stride*.018:clamp(p.vy/850,-.1,.12));
 if(sprite){ctx.shadowColor='rgba(8,18,24,.34)';ctx.shadowBlur=7;ctx.drawImage(sprite,-39,-46,78,92);}
 else{
   ellipsoid(ctx,0,-4,0,17,21,10,'#f08b35',0,viewW,10,7);
   ellipsoid(ctx,0,18,0,18,18,12,'#244b70',0,viewW,10,7);
   ellipsoid(ctx,8,20,-11,4,4,2,'#b8f2a4',0,viewW);
   polygon(ctx,[project(15,15,-5,0,viewW),project(33,12,-4,0,viewW),project(16,8,-4,0,viewW)],'#f7a332','#b95621');
 }
 ctx.restore();
}
function dragon(ctx,e,clock,cam,viewW,big=false){
 const x=e.x+e.w/2,y=456-(e.y+e.h/2),z=0,scale=big?1.8:.78,pulse=Math.sin(clock*4+e.phase)*4;
 ellipsoid(ctx,x-8*scale,y-2,z,19*scale,13*scale,12*scale,big?'#765099':'#5a9a57',cam,viewW,10,6);
 // Raised wings, jointed legs, long neck, horns and glowing eyes.
 const flap=Math.sin(clock*6+e.phase)*9;
 polygon(ctx,[project(x-7*scale,y+3*scale,z+4,cam,viewW),project(x-35*scale,y+25*scale+flap,z+6,cam,viewW),project(x-23*scale,y-1*scale,z+4,cam,viewW)],big?'#563a7d':'#376c4a');
 polygon(ctx,[project(x+1*scale,y+4*scale,z-5,cam,viewW),project(x+27*scale,y+27*scale-flap,z-5,cam,viewW),project(x+17*scale,y-2*scale,z-4,cam,viewW)],big?'#9368ac':'#76b96b');
 for(const leg of [-1,1]){line3(ctx,[x+leg*9*scale,y-9*scale,z],[x+leg*12*scale,y-19*scale,z],big?'#51366b':'#356c48',5*scale,cam,viewW);}
 ellipsoid(ctx,x+17*scale,y+7*scale+pulse,z,10*scale,8*scale,8*scale,big?'#8862a8':'#75b762',cam,viewW,8,5);
 line3(ctx,[x+17*scale,y+13*scale,z],[x+10*scale,y+23*scale,z],big?'#e7c785':'#f1da89',3*scale,cam,viewW);
 line3(ctx,[x+23*scale,y+13*scale,z],[x+28*scale,y+22*scale,z],big?'#e7c785':'#f1da89',3*scale,cam,viewW);
 ellipsoid(ctx,x+20*scale,y+9*scale,z-6,2.4*scale,2.2*scale,1.4,'#fff5bc',cam,viewW,7,4);
}
function tree(ctx,x,height,cam,viewW,clock){
 box(ctx,x-8,0,75,16,height,16,'#574336','#302b31',cam,viewW);
 for(const [dx,dy,r,col] of [[0,height-12,44,'#267254'],[-27,height+4,31,'#348662'],[30,height+2,34,'#1c664f'],[2,height+28,25,'#438d67']])ellipsoid(ctx,x+dx,dy,45,r,r*.68,35,col,cam,viewW,9,5);
 const q=project(x,height+8+Math.sin(clock+x)*4,8,cam,viewW);ctx.fillStyle='rgba(219,255,170,.65)';ctx.beginPath();ctx.arc(q.x,q.y,2.5,0,7);ctx.fill();
}
export function renderForest3D(ctx,{g,cam,viewW,H,WORLD,FLOOR,solids,clock,sprite,smallDragonSprite,guardianDragonSprite}){
 const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#051934');grad.addColorStop(.55,'#286679');grad.addColorStop(1,'#afd08d');ctx.fillStyle=grad;ctx.fillRect(0,0,viewW,H);
 ctx.fillStyle='#d4f1bd';ctx.shadowColor='#b9ffc7';ctx.shadowBlur=36;ctx.beginPath();ctx.arc(viewW*.82,86,37,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 // Layered distant ridges and a depth plane of original forest trees.
 for(let layer=0;layer<3;layer++){const step=370-layer*68,shift=cam*(.08+layer*.12);ctx.fillStyle=['#244f68','#1b5d58','#164b3d'][layer];for(let i=-2;i<viewW/step+3;i++){const x=i*step-shift%step;polygon(ctx,[{x:x-140,y:350},{x:x+step*.45,y:105+layer*38},{x:x+step+120,y:350}],ctx.fillStyle);}}
 // Give every walkable floor segment a clear grass top and an earth side.
 // Ravine intervals are intentionally omitted here and rendered as water below.
 for(const s of solids){if(s.y!==FLOOR)continue;
   const left=project(s.x,0,18,cam,viewW),right=project(s.x+s.w,0,18,cam,viewW);
   const edgeY=(left.y+right.y)/2;
   const terrain=ctx.createLinearGradient(0,edgeY,0,H);
   terrain.addColorStop(0,'#628a47');terrain.addColorStop(.12,'#47713f');terrain.addColorStop(1,'#29463a');
   polygon(ctx,[left,right,{x:right.x,y:H+8},{x:left.x,y:H+8}],terrain);
   ctx.strokeStyle='#a6d47a';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.stroke();
   ctx.strokeStyle='rgba(210,239,155,.65)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(left.x,left.y-3);ctx.lineTo(right.x,right.y-3);ctx.stroke();
   for(let x=s.x+28;x<s.x+s.w-12;x+=58){const q=project(x,0,16,cam,viewW);ctx.fillStyle='rgba(193,220,128,.42)';ctx.beginPath();ctx.ellipse(q.x,q.y+16,3,1.5,0,0,Math.PI*2);ctx.fill();}
 }
 for(let x=Math.floor(cam/320)*320-640;x<cam+viewW+650;x+=320)tree(ctx,x,170+(Math.sin(x)*.5+.5)*70,cam,viewW,clock);
 // Platform world, shaded soil depth, grass tops and individual stones.
 for(const s of solids){box(ctx,s.x,FLOOR-s.y-s.h,18,s.w,s.h,80,'#85b558','#493c33',cam,viewW);const a=project(s.x,FLOOR-s.y,18,cam,viewW),b=project(s.x+s.w,FLOOR-s.y,18,cam,viewW);ctx.strokeStyle='#c7e580';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();for(let x=s.x+35;x<s.x+s.w;x+=95){ellipsoid(ctx,x,FLOOR-s.y+5,6,7,4,5,'#b3d477',cam,viewW,6,3);}}
 for(const [a,b] of [[620,760],[1330,1440],[2030,2140],[2760,2890],[3900,4020],[4480,4620],[5130,5280],[5690,5910],[6380,6550],[7080,7220]]){const p=project(a,0,25,cam,viewW),q=project(b,0,25,cam,viewW);const y=project(0,0,0,cam,viewW).y;const w=ctx.createLinearGradient(0,y,0,H);w.addColorStop(0,'#73eee2');w.addColorStop(1,'#086486');ctx.fillStyle=w;ctx.fillRect(p.x,y,q.x-p.x,H-y);ctx.strokeStyle='rgba(220,255,248,.65)';for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(p.x,y+10+j*17+Math.sin(clock*3+j)*3);ctx.quadraticCurveTo((p.x+q.x)/2,y+12+j*17,q.x,y+10+j*17);ctx.stroke();}}
 for(const m of g?.moving||[]){box(ctx,m.x,FLOOR-m.currentY-m.h,8,m.w,m.h,52,'#b9f1d0','#477177',cam,viewW);}
 for(const c of g?.coins||[])if(!c.taken)coin(ctx,c.x,FLOOR-c.y,clock,cam,viewW);
 for(const power of g?.powerups||[])if(!power.taken){const q=project(power.x,FLOOR-power.y+Math.sin(clock*3)*7,10,cam,viewW);ctx.shadowColor='#64f8ff';ctx.shadowBlur=22;polygon(ctx,[{x:q.x,y:q.y-17},{x:q.x+15,y:q.y},{x:q.x,y:q.y+17},{x:q.x-15,y:q.y}], '#71eafa');ctx.shadowBlur=0;}
 for(const f of g?.flames||[])if(!f.taken){const q=project(f.x,FLOOR-f.y+Math.sin(clock*3)*5,10,cam,viewW);ctx.shadowColor='#ff9b31';ctx.shadowBlur=20;ellipsoid(ctx,q.x,q.y,0,12,14,2,'#ffad37',0,viewW,8,5);ctx.shadowBlur=0;}
 for(const o of g?.logs||[]){const q=project(o.x+o.w/2,o.h/2,24,cam,viewW);ctx.fillStyle='#745039';ctx.shadowColor='#151b18';ctx.shadowBlur=9;ctx.beginPath();ctx.ellipse(q.x,q.y,o.w/2,12,0,0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#c89657';ctx.lineWidth=3;ctx.stroke();}
 for(const e of g?.enemies||[])if(e.alive)dragon(ctx,e,clock,cam,viewW);
 if(g?.guardian?.alive)dragon(ctx,g.guardian,clock,cam,viewW,true);
 for(const s of g?.shadows||[])if(s.hp>0){const q=project(s.x+20,20,2,cam,viewW);ellipsoid(ctx,q.x,q.y+436,0,18,28,9,'#4b2665',0,viewW,8,5);}
 if(g?.boss?.alive){const b=g.boss;ellipsoid(ctx,b.x+32,456-b.y-b.h/2,0,36,41,18,'#311543',cam,viewW,10,7);}
 for(const s of g?.enemyShots||[]){const q=project(s.x,FLOOR-s.y,18,cam,viewW);ctx.shadowColor=s.kind==='dragon-fire'?'#ff6325':'#d355ff';ctx.shadowBlur=16;ellipsoid(ctx,q.x,456-q.y,0,9,9,6,s.kind==='dragon-fire'?'#ff9a32':'#d56dff',0,viewW,7,4);ctx.shadowBlur=0;}
 for(const s of g?.shots||[]){const q=project(s.x,FLOOR-s.y,20,cam,viewW);ctx.shadowColor='#ff7926';ctx.shadowBlur=18;ellipsoid(ctx,q.x,456-q.y,0,8,8,5,'#ffc447',0,viewW,7,4);ctx.shadowBlur=0;}
 const portal=project(g?.config.end-90||WORLD-90,0,16,cam,viewW);ctx.save();ctx.shadowColor='#9ce6ff';ctx.shadowBlur=22;ctx.strokeStyle='#a5eaff';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(portal.x,portal.y-60,25,57,0,0,Math.PI*2);ctx.stroke();ctx.restore();
 for(const c of g?.checkpoints||[]){const q=project(c,0,12,cam,viewW);ctx.fillStyle='#8df4be';ctx.fillRect(q.x,q.y-95,4,95);}
 if(g?.player){
   const p=g.player,ground=project(p.x+p.w/2,0,0,cam,viewW);
   const height=Math.max(0,FLOOR-(p.y+p.h)),shadowScale=1-clamp(height/520,0,.58),shadowAlpha=.34*(1-clamp(height/280,0,.72));
   ctx.save();ctx.globalAlpha=shadowAlpha;ctx.fillStyle='#0b1918';ctx.shadowColor='#101b18';ctx.shadowBlur=5;
   ctx.beginPath();ctx.ellipse(ground.x,ground.y-3,25*shadowScale,8*shadowScale,0,0,Math.PI*2);ctx.fill();ctx.restore();
   woody(ctx,p,clock,cam,viewW,sprite);
 }
}

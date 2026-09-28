// Preserve the original three routes, then extend each into the canopy.
const box=(x,y,w,h)=>({x,y,w,h});
const ORIGINAL = [
  {x:0,y:2200,w:620,h:120},{x:760,y:2200,w:570,h:120},
  {x:1440,y:2200,w:590,h:120},{x:2140,y:2200,w:620,h:120},
  {x:2890,y:2200,w:1010,h:120},
  {x:310,y:365,w:160,h:20},{x:550,y:298,w:145,h:20},
  {x:845,y:352,w:155,h:20},{x:1100,y:305,w:145,h:20},
  {x:1500,y:355,w:155,h:20},{x:1740,y:292,w:150,h:20},
  {x:2020,y:338,w:130,h:20},{x:2310,y:354,w:165,h:20},
  {x:2610,y:305,w:160,h:20},{x:2960,y:365,w:160,h:20},
  {x:3280,y:320,w:180,h:20},
  {x:4020,y:2200,w:460,h:120},{x:4620,y:2200,w:510,h:120},
  {x:5280,y:2200,w:410,h:120},{x:5910,y:2200,w:470,h:120},
  {x:6550,y:2200,w:530,h:120},{x:7220,y:2200,w:680,h:120},
  {x:4200,y:326,w:125,h:20},{x:4790,y:342,w:120,h:20},
  {x:5400,y:335,w:120,h:20},{x:6100,y:328,w:125,h:20},
  {x:6750,y:345,w:135,h:20},{x:7370,y:310,w:145,h:20}
];

export const LEVELS = [
 {name:'The Enchanted Forest',subtitle:'Roots of the guardian',start:0,end:2760,steps:12,color:'#376959',boss:'wolf'},
 {name:'The Dangerous Woods',subtitle:'The hunters below',start:2890,end:5690,steps:14,color:'#355974',boss:'wolf'},
 {name:'Shadow WOODY Kingdom',subtitle:'Beyond the fallen kingdom',start:5910,end:7900,steps:16,color:'#51476e',boss:'dragon'},
 {name:'The Moonwood',subtitle:'Wake the ancient spring',steps:18,color:'#285e69',boss:'dragon'},
 {name:'The Ember Crown',subtitle:'The last ascent',steps:18,color:'#794d3f',boss:'dragon'}
];
export function makeLevel(level){
 const c=LEVELS[level-1],floor=2200;
 let approach,platforms;
 if(level<=3){approach=c.end-c.start;platforms=ORIGINAL.filter(s=>s.x>=c.start&&s.x<c.end).map(s=>({...s,x:s.x-c.start,y:s.y===2200?2200:s.y+1744}));}
 else {approach=2400;platforms=[box(0,floor,550,100),box(690,floor,570,100),box(1400,floor,460,100),box(2010,floor,390,100)];
  const heights=level===4?[90,155,105,150,95,160,100,145]:[125,175,90,160,120,180,95,165];
  heights.forEach((h,i)=>platforms.push(box(260+i*275,floor-h,160,24)));
 }
 platforms.push(box(approach,floor,1900,100));
 const climb=[];
 // Alternating runs create a long climb with distinct terraces and recovery ledges.
 const xs=[250,530,800,530,240,510,800,1080,800,530,800,1080,800,530,800,1080,800,1080];
 for(let i=0;i<c.steps;i++)climb.push(box(approach+xs[i],floor-(i+1)*100,230,24));
 const top=climb.at(-1),arena=box(top.x+300,top.y-90,490,28);platforms.push(...climb,arena);
 const blocks=[];
 platforms.filter(s=>s.h<50).forEach((s,i)=>{if(i%3===0)blocks.push({...box(s.x+60,s.y-104,42,42),kind:i%2?'shield':'weapon',broken:false});});
 const enemies=[];
 platforms.filter(s=>s.h>=100&&s.w>=460).forEach((s,i)=>{if(i||s.x>0)enemies.push({...box(s.x+Math.min(280,s.w-80),s.y-40,40,40),hp:3+Math.floor(level/2),vx:0,vy:0,ground:false,cool:0,home:s.x});});
 climb.forEach((s,i)=>{if(i%4===3)enemies.push({...box(s.x+130,s.y-40,40,40),hp:3+Math.floor(level/2),vx:0,vy:0,ground:false,cool:0,home:s.x});});
 const checkpoints=[{x:approach+90,y:floor-48},...climb.filter((_,i)=>i===5||i===11).map(s=>({x:s.x+80,y:s.y-48})),{x:top.x+80,y:top.y-48}];
 const pickups=platforms.filter(s=>s.h<50).flatMap(s=>[40,110,180].filter(x=>x<s.w-10).map(x=>({...box(s.x+x,s.y-38,15,15),taken:false})));
 return {config:c,floor,width:Math.max(approach+1900,arena.x+arena.w+60),height:floor+100,platforms,climb,blocks,enemies,checkpoints,pickups,
  spring:{x:top.x+150,y:top.y-62,w:28,h:62},arena,
  boss:{...box(arena.x+arena.w-125,arena.y-90,c.boss==='wolf'?80:90,90),kind:c.boss,hp:18+level*4,maxHp:18+level*4,timer:0,cycle:0,active:false,phase:'dormant'}};
}

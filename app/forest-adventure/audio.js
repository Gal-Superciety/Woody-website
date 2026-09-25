// Self-contained synthesized game soundtrack: no third-party files or licensing.
export function createForestAudio(){
 let ctx=null,enabled=true,musicTimer=null,step=0;
 const notes=[220,261.63,329.63,392,440,523.25,659.25,784];
 function ensure(){if(typeof window==='undefined')return null;try{ctx??=new (window.AudioContext||window.webkitAudioContext)();if(ctx.state==='suspended')ctx.resume().catch(()=>{});return ctx;}catch{return null;}}
 function tone(freq,duration=.13,type='sine',volume=.08,delay=0,slide=0){
  if(!enabled)return;const c=ensure();if(!c)return;
  const t=c.currentTime+delay,o=c.createOscillator(),gain=c.createGain();
  o.type=type;o.frequency.setValueAtTime(Math.max(30,freq),t);
  if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),t+duration);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.012);
  gain.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(gain);gain.connect(c.destination);o.start(t);o.stop(t+duration+.02);
 }
 function play(name){if(!enabled)return;
  switch(name){
   case 'coin':tone(880,.075,'sine',.09);tone(1320,.16,'sine',.075,.075);break;
   case 'jump':tone(290,.19,'triangle',.07,0,260);break;
   case 'double':tone(430,.15,'triangle',.08,0,440);tone(880,.2,'sine',.06,.12);break;
   case 'fire':tone(390,.14,'sawtooth',.065,0,-300);tone(130,.09,'triangle',.06);break;
   case 'hit':tone(190,.23,'sawtooth',.11,0,-135);break;
   case 'enemy':tone(490,.12,'square',.055,0,-280);tone(310,.16,'triangle',.065,.09,-190);break;
   case 'power':tone(523,.13,'sine',.08);tone(659,.13,'sine',.08,.11);tone(1046,.3,'sine',.09,.22);break;
   case 'boss':tone(90,.4,'sawtooth',.09);tone(75,.48,'triangle',.07,.15);break;
   case 'win':for(let i=0;i<6;i++)tone(notes[[0,2,4,5,6,7][i]],.27,'triangle',.085,i*.14);break;
   case 'over':for(let i=0;i<4;i++)tone([440,370,294,220][i],.3,'triangle',.085,i*.18);break;
  }
 }
 // Gentle looping forest melody, deliberately quieter than gameplay effects.
 function musicTick(){if(!enabled||!ctx)return;const melody=[0,2,4,2,5,4,2,null,0,2,5,4,6,5,4,null];const n=melody[step%melody.length];if(n!==null)tone(notes[n],.32,'sine',.017);if(step%4===0)tone(notes[(step/4)%4|0]/2,.7,'triangle',.012);step++;}
 function start(){if(!enabled)return;ensure();if(musicTimer===null){musicTick();musicTimer=setInterval(musicTick,340);}}
 function stop(){if(musicTimer!==null){clearInterval(musicTimer);musicTimer=null;}}
 function setEnabled(value){enabled=value;if(!value){stop();ctx?.suspend().catch(()=>{});}else{ensure();start();}}
 function dispose(){stop();ctx?.close().catch(()=>{});ctx=null;}
 return {play,start,stop,setEnabled,dispose};
}

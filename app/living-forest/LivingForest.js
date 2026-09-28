'use client';
import { useEffect, useRef, useState } from 'react';
import { createGame, restore, snapshot, step, SAVE_KEY } from './engine.mjs';
import { createSound } from './sound.mjs';
import { render } from './render.mjs';
import styles from './forest.module.css';
export default function LivingForest(){
 const canvas=useRef(null),game=useRef(null),sound=useRef(null),[audio,setAudio]=useState(false),[hud,setHud]=useState(null),[storageWarning,setStorageWarning]=useState(false);
 useEffect(()=>{
  let g=createGame();try{const raw=localStorage.getItem(SAVE_KEY);if(raw)g=restore(JSON.parse(raw));}catch{setStorageWarning(true);}game.current=g; sound.current=createSound();const forest=new Image();forest.src="/living-forest/moonwood.webp";
  const c=canvas.current,ctx=c.getContext('2d');let frame,last=0,update=0,saved=null;
  const save=()=>{try{if(g.over)localStorage.removeItem(SAVE_KEY);else if(g.checkpoint)localStorage.setItem(SAVE_KEY,JSON.stringify(g.checkpoint));}catch{setStorageWarning(true);}};
  const pause=()=>{g.paused=true;g.keys={};sound.current?.mute();setAudio(false);save();};
  const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyJ:'shoot',KeyE:'peck'};
  const key=(e)=>{if(document.activeElement!==c)return;if(map[e.code]){e.preventDefault();g.keys[map[e.code]]=e.type==='keydown';}if(e.code==='Escape'&&e.type==='keydown')pause();};
  const visibility=()=>{if(document.hidden)pause();};
  window.addEventListener('keydown',key);window.addEventListener('keyup',key);window.addEventListener('blur',pause);document.addEventListener('visibilitychange',visibility);
  function tick(t){const dt=last?(t-last)/1000:0;last=t;step(g,dt);render(ctx,g,{forest});for(const event of g.events.splice(0))sound.current?.play(event);if(g.checkpoint!==saved){saved=g.checkpoint;save();}if(t-update>100){update=t;setHud({shield:g.player.shield,weapon:g.player.weapon,lives:g.player.lives,coins:g.coins,message:g.message,paused:g.paused,won:g.won,over:g.over});}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);sound.current?.close();save();window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',pause);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 function play(){game.current.paused=false;canvas.current.focus();}
 function restart(){if(!window.confirm('Start a new adventure? This replaces only your Living Forest save.'))return;Object.assign(game.current,createGame());try{localStorage.removeItem(SAVE_KEY);}catch{setStorageWarning(true);}play();}
 const controls=[['left','←'],['right','→'],['jump','Jump'],['peck','Peck'],['shoot','Fire']];
 return <main className={styles.page}>
  <div className={styles.heading}><div><span className={styles.eyebrow}>FOREST ADVENTURE / EXPANSION PLAYTEST</span><h1>The <em>Moonwood.</em></h1><p>Wake the spring. Climb the canopy. Bring the forest back to life.</p></div><a href="/forest-adventure">Play Forest Adventure ↗</a></div>
  <section className={styles.shell} aria-label="Living Forest game">
   <div className={styles.hud}><button onClick={async()=>{if(audio){sound.current?.mute();setAudio(false);}else setAudio(await sound.current?.enable());}}>Sound {audio?"on":"off"}</button><span>♥ {hud?.lives??3} lives</span><span>◇ {hud?.shield??1}/3 shield</span><span>↗ {hud?.weapon??1} shot</span><span>✦ {hud?.coins??0}</span><button onClick={()=>{game.current.paused=true;game.current.keys={};sound.current?.mute();setAudio(false);}}>Pause</button></div>
   <div className={styles.stage}><canvas ref={canvas} width="960" height="540" tabIndex={0} aria-label="Living Forest. Arrow keys move, Space jumps, J fires, E pecks, Escape pauses."/>
    {(hud?.paused||hud?.won||hud?.over)&&<div className={styles.overlay}><span className={styles.eyebrow}>LEVEL 04 CONCEPT · THE ANCIENT TREE</span><h2>{hud.won?'The forest breathes again.':hud.over?'A new beginning?':'A forest worth exploring.'}</h2><p>{hud.won?'You completed the first playtest. More chapters are not available yet.': 'Climb the mossy ledges. Break glowing blocks for upgrades. Peck the spring to awaken it before facing the guardian.'}</p><div>{!hud.won&&!hud.over&&<button onClick={play}>Enter the forest →</button>}<button onClick={restart}>New adventure</button></div></div>}
   </div>
   <div className={styles.message} aria-live="polite">{hud?.message||'Preparing the forest…'}</div>
   <div className={styles.controls}>{controls.map(([action,label])=><button key={action} aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);game.current.keys[action]=true;}} onPointerUp={()=>{game.current.keys[action]=false;}} onPointerCancel={()=>{game.current.keys[action]=false;}} onLostPointerCapture={()=>{game.current.keys[action]=false;}}>{label}</button>)}</div>
  </section>
  <div className={styles.notes}><p><b>Keyboard</b> A/D or arrows · Space to jump · J to fire · E to peck</p><p><b>Your adventure</b> Checkpoints save equipment on this device. Expansion playtest with separate saves. The public game is unchanged.</p><p><b>Playtest</b> One playable level, illustrated scenery and experimental combat. No token transactions. Landscape mode gives more room on a phone.</p>{storageWarning&&<p role="alert">Saving is unavailable in this browser. You can still play, but progress may be lost.</p>}</div>
 </main>;
}

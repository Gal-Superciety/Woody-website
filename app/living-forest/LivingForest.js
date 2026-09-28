'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createGame, restore, snapshot, step, advance, SAVE_KEY, LEVELS } from './engine.mjs';
import { createSound } from './sound.mjs';
import { render } from './render.mjs';
import styles from './forest.module.css';
export default function LivingForest(){
 const canvas=useRef(null),game=useRef(null),sound=useRef(null),saveRef=useRef(()=>{}),[audio,setAudio]=useState(false),[hud,setHud]=useState(null),[storageWarning,setStorageWarning]=useState(false);
 useEffect(()=>{
  let g=createGame();try{const raw=localStorage.getItem(SAVE_KEY);if(raw)g=restore(JSON.parse(raw));}catch{setStorageWarning(true);}game.current=g;sound.current=createSound();const forest=new Image();forest.src='/living-forest/moonwood.webp';
  const c=canvas.current,ctx=c.getContext('2d');let frame,last=0,update=0,saved='',saveClock=0,accumulator=0;
  const save=()=>{try{const data=g.over?'':JSON.stringify(snapshot(g));if(data!==saved){if(data)localStorage.setItem(SAVE_KEY,data);else localStorage.removeItem(SAVE_KEY);saved=data;}}catch{setStorageWarning(true);}};saveRef.current=save;
  const pause=()=>{g.paused=true;g.keys={};sound.current?.mute();setAudio(false);save();};
  const map={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyJ:'shoot',KeyF:'shoot',KeyE:'peck'};
  const held=new Set();
  const key=e=>{if(e.type==='keyup'){held.delete(e.code);if(map[e.code])g.keys[map[e.code]]=[...held].some(code=>map[code]===map[e.code]);return;}if(document.activeElement!==c)return;if(map[e.code]){e.preventDefault();held.add(e.code);g.keys[map[e.code]]=true;}if(e.code==='Escape')pause();};
  const blur=()=>{held.clear();pause();};const visibility=()=>{if(document.hidden)blur();};
  window.addEventListener('keydown',key);window.addEventListener('keyup',key);window.addEventListener('blur',blur);document.addEventListener('visibilitychange',visibility);
  function tick(t){const dt=last?Math.min((t-last)/1000,.1):0;last=t;accumulator+=dt;while(accumulator>=1/60){step(g,1/60);accumulator-=1/60;}render(ctx,g,{forest});for(const event of g.events.splice(0))sound.current?.play(event);saveClock+=dt;if(saveClock>.5||g.over||g.won){saveClock=0;save();}if(t-update>100){update=t;setHud({level:g.level,shield:g.player.shield,weapon:g.player.weapon,lives:g.player.lives,coins:g.coins,message:g.message,paused:g.paused,won:g.won,over:g.over});}frame=requestAnimationFrame(tick);}frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);sound.current?.close();save();window.removeEventListener('keydown',key);window.removeEventListener('keyup',key);window.removeEventListener('blur',blur);document.removeEventListener('visibilitychange',visibility);};
 },[]);
 function play(){game.current.paused=false;canvas.current.focus();}
 function restart(){if(!window.confirm('Start a new five-chapter adventure? This replaces your campaign checkpoint.'))return;Object.assign(game.current,createGame());saveRef.current();play();}
 function next(){if(advance(game.current)){saveRef.current();play();}}
 const controls=[['left','←'],['right','→'],['jump','Jump'],['peck','Peck'],['shoot','Fire']];const level=hud?.level??1,chapter=LEVELS[level-1];
 return <main className={styles.page}>
  <div className={styles.heading}><div><span className={styles.eyebrow}>WOODY ARCADE / FIVE-CHAPTER PREVIEW</span><h1>Forest <em>Adventure.</em></h1><p>{chapter.name} · {chapter.subtitle}</p></div><Link href='/'>Back to WOODY ↗</Link></div>
  <nav className={styles.chapters} aria-label='Campaign chapters'>{LEVELS.map((l,i)=><span key={l.name} aria-current={i+1===level?'step':undefined} className={i+1===level?styles.current:''}>{String(i+1).padStart(2,'0')} {l.name}</span>)}</nav>
  <section className={styles.shell} aria-label='Forest Adventure game'>
   <div className={styles.hud}><button onClick={async()=>{if(audio){sound.current?.mute();setAudio(false);}else setAudio(await sound.current?.enable());}}>Sound {audio?'on':'off'}</button><span>♥ {hud?.lives??3} lives</span><span>◇ {hud?.shield??1}/3 shield</span><span>↗ {hud?.weapon??1} shot</span><span>✦ {hud?.coins??0}</span><button onClick={()=>{game.current.paused=true;game.current.keys={};sound.current?.mute();setAudio(false);saveRef.current();}}>Pause</button></div>
   <div className={styles.stage}><canvas ref={canvas} width='960' height='540' tabIndex={0} aria-label='Forest Adventure. Arrow keys move, Space jumps, J or F fires, E pecks, Escape pauses.'/>
    {(hud?.paused||hud?.won||hud?.over)&&<div className={styles.overlay}><span className={styles.eyebrow}>CHAPTER {level} OF 5 · {chapter.name.toUpperCase()}</span><h2>{hud.won?(level===5?'The forest is yours.':'Guardian defeated.'):hud.over?'A new beginning?':'Enter the Moonwood.'}</h2><p>{hud.won?(level===5?'All five chapters completed. Thank you for playing.':'Your shields, weapon, lives and coins carry into the next chapter.'):hud.over?'Your run has ended. Start again to explore the five chapters.':'Break glowing blocks for upgrades. After the second canopy ledge, reaching the forest floor costs one life. Dodge a guardian’s volley, then attack when its armour opens.'}</p><div>{!hud.won&&!hud.over&&<button onClick={play}>Continue adventure →</button>}{hud.won&&level<5&&<button onClick={next}>Next chapter →</button>}<button onClick={restart}>New adventure</button></div></div>}
   </div>
   <div className={styles.message} aria-live='polite'>{hud?.message||'Preparing the forest…'}</div>
   <div className={styles.controls}>{controls.map(([action,label])=><button key={action} aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);game.current.keys[action]=true;}} onPointerUp={()=>{game.current.keys[action]=false;}} onPointerCancel={()=>{game.current.keys[action]=false;}} onLostPointerCapture={()=>{game.current.keys[action]=false;}}>{label}</button>)}</div>
  </section>
  <div className={styles.notes}><p><b>Keyboard</b>A/D or arrows · Space to jump · J/F to fire · E to peck. Release jump early for a shorter hop.</p><p><b>Your adventure</b>Equipment carries between chapters. Progress saves on this device; returning starts at the latest flag. Old Season 1 records remain stored.</p><p><b>Five chapters</b>Three extended original routes and two new challenges. Unlimited firing, up to triple shot. No token transactions. Turn your phone sideways for more room.</p>{storageWarning&&<p role='alert'>Saving is unavailable in this browser. You can still play, but progress may be lost.</p>}</div>
 </main>;
}

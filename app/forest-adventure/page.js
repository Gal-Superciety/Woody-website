'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createForestAudio } from './audio';
import { renderForest2D } from './renderer2d.mjs';
import { createGame, stepForest, FOREST_STEP_SECONDS, W, H, WORLD, FLOOR, LEVELS, solids } from './simulation.mjs';
import { FOREST_REPLAY_VERSION, forestInputFrame } from './replay.mjs';
import Leaderboard from './Leaderboard';
import ForestPlayerGate from './ForestPlayerGate';
import { enqueueForestRun, flushForestRuns } from '../lib/forestPersistence.mjs';

const ROUND_SECONDS = LEVELS[0].seconds;

export default function ForestAdventure(){
 const canvas=useRef(null),game=useRef(null),sprite=useRef(null),smallDragonSprite=useRef(null),guardianDragonSprite=useRef(null),raf=useRef(null),arcade=useRef(null),audio=useRef(null);
 const [soundOn,setSoundOn]=useState(true);
 const [profileReady,setProfileReady]=useState(false);
 const [playerWallet,setPlayerWallet]=useState('');
 const [syncStatus,setSyncStatus]=useState('loading');
 const toggleSound=()=>{const next=!soundOn;setSoundOn(next);audio.current?.setEnabled(next);};
 useEffect(()=>{audio.current=createForestAudio();return()=>{audio.current?.dispose();audio.current=null;};},[]);
 const [fullScreen,setFullScreen]=useState(false);
 const enterFullscreen=async()=>{
   try{
     if(!document.fullscreenElement){await arcade.current?.requestFullscreen?.();try{await screen.orientation?.lock?.('landscape');}catch{}}
     else await document.exitFullscreen?.();
   }catch{ /* Browser may disallow orientation lock; responsive layout still works. */ }
 };
 useEffect(()=>{
   const onChange=()=>setFullScreen(Boolean(document.fullscreenElement));
   document.addEventListener('fullscreenchange',onChange);
   return()=>document.removeEventListener('fullscreenchange',onChange);
 },[]);
 const [selectedLevel,setSelectedLevel]=useState(1),[unlocked,setUnlocked]=useState(1);
 const [records,setRecords]=useState({times:{},bossWins:0});
 const [mode,setMode]=useState('ready'),[best,setBest]=useState(0),[hud,setHud]=useState({score:0,lives:3,time:0,progress:0,boost:0,ammo:0,remaining:ROUND_SECONDS,notice:''});
 const applyCloudProgress=useCallback(progress=>{
   if(!progress)return;
   const bestScore=Math.max(0,Number(progress.best_score)||0);
   const cloudUnlocked=Math.min(3,Math.max(1,Number(progress.unlocked_level)||1));
   setBest(old=>{
     const next=Math.max(old,bestScore);
     try{localStorage.setItem('woody-adventure-best-v1',String(next));}catch{}
     return next;
   });
   setUnlocked(old=>{
     const next=Math.max(old,cloudUnlocked);
     try{localStorage.setItem('woody-adventure-unlocked-v1',String(next));}catch{}
     return next;
   });
   setRecords(old=>{
     const times={...old.times};
     for(const [level,value] of Object.entries(progress.best_times||{})){
       const seconds=Number(value);
       if(Number.isFinite(seconds)&&seconds>0)times[level]=Math.min(Number(times[level])||Infinity,seconds);
     }
     const next={times,bossWins:Math.max(old.bossWins,Number(progress.boss_wins)||0)};
     try{localStorage.setItem('woody-adventure-records-v1',JSON.stringify(next));}catch{}
     return next;
   });
 },[]);
 const saveResult=useCallback(async run=>{
   try{
     enqueueForestRun(localStorage,run);
     setSyncStatus('saving');
     const progress=await flushForestRuns(localStorage,run.wallet);
     applyCloudProgress(progress);
     setSyncStatus('saved');
     window.dispatchEvent(new Event('woody:forest-run-saved'));
   }catch{
     setSyncStatus('pending');
   }
 },[applyCloudProgress]);
 useEffect(()=>{
   if(!profileReady||!playerWallet)return;
   let mounted=true;
   const restore=async()=>{
     setSyncStatus('loading');
     try{
       let local={};
       try{local=JSON.parse(localStorage.getItem('woody-adventure-records-v1')||'{}')||{};}catch{}
       const legacy={
         action:'import',wallet:playerWallet,
         bestScore:Math.max(0,Math.min(100000,Math.round(Number(localStorage.getItem('woody-adventure-best-v1'))||0))),
         unlockedLevel:Math.max(1,Math.min(3,Math.round(Number(localStorage.getItem('woody-adventure-unlocked-v1'))||1))),
         bestTimes:local.times||{},
         bossWins:Math.max(0,Math.min(100000,Math.round(Number(local.bossWins)||0))),
       };
       const response=await fetch('/api/forest/progress?wallet='+encodeURIComponent(playerWallet),{cache:'no-store'});
       if(!response.ok)throw Error('progress_unavailable');
       const data=await response.json();
       if(mounted)applyCloudProgress(data.progress);
       // Import old achievements once a real provider session is re-established.
       // Historical runs are NOT fabricated in the public leaderboard.
       const migrated=await fetch('/api/forest/progress',{
         method:'POST',headers:{'Content-Type':'application/json'},
         body:JSON.stringify(legacy),
       });
       if(!migrated.ok)throw Error('legacy_import_failed');
       const imported=await migrated.json();
       if(mounted)applyCloudProgress(imported.progress);
       const recovered=await flushForestRuns(localStorage,playerWallet);
       if(mounted){applyCloudProgress(recovered);setSyncStatus('ready');}
     }catch{if(mounted)setSyncStatus('pending');}
   };
   void restore();
   return()=>{mounted=false;};
 },[profileReady,playerWallet,applyCloudProgress]);
 useEffect(()=>{
   if(!profileReady||!playerWallet)return;
   const heartbeat=()=>{
     if(document.visibilityState==='hidden')return;
     void fetch('/api/forest/progress',{
       method:'POST',headers:{'Content-Type':'application/json'},
       body:JSON.stringify({action:'heartbeat',wallet:playerWallet,playing:mode==='playing'}),
     }).catch(()=>{});
   };
   heartbeat();
   const timer=setInterval(heartbeat,45_000);
   return()=>clearInterval(timer);
 },[profileReady,playerWallet,mode]);
 const start=useCallback((level=selectedLevel)=>{audio.current?.setBoss(false);audio.current?.start(level);game.current=createGame(level);setHud({score:0,lives:3,time:0,progress:0,boost:0,ammo:0,remaining:LEVELS[level-1].seconds,notice:''});setMode('playing');},[selectedLevel]);
 useEffect(()=>{
   try { setBest(Number(localStorage.getItem('woody-adventure-best-v1')) || 0);setUnlocked(Math.min(3,Math.max(1,Number(localStorage.getItem('woody-adventure-unlocked-v1'))||1)));const saved=JSON.parse(localStorage.getItem('woody-adventure-records-v1')||'{}');setRecords({times:saved.times||{},bossWins:Number(saved.bossWins)||0}); } catch {}
   const img=new Image();img.src='/woody-adventure-sprite.svg';img.onload=()=>{sprite.current=img;};
   const smallDragon=new Image();smallDragon.src='/forest-dragon-small.svg';smallDragon.onload=()=>{smallDragonSprite.current=smallDragon;};
   const guardianDragon=new Image();guardianDragon.src='/forest-dragon-guardian.svg';guardianDragon.onload=()=>{guardianDragonSprite.current=guardianDragon;};
 },[]);
 useEffect(()=>{
  const key=(e,down)=>{
   const g=game.current;if(!g)return;
   if(['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyF'].includes(e.code))e.preventDefault();
   if(['ArrowLeft','KeyA'].includes(e.code))g.keys.left=down;
   if(['ArrowRight','KeyD'].includes(e.code))g.keys.right=down;
   if(['ArrowUp','Space','KeyW'].includes(e.code))g.keys.jump=down;
   if(e.code==='KeyF')g.keys.shoot=down;
  };
  const kd=e=>key(e,true),ku=e=>key(e,false);
  window.addEventListener('keydown',kd);window.addEventListener('keyup',ku);
  const blur=()=>{if(game.current)game.current.keys={left:false,right:false,jump:false,shoot:false};};
  window.addEventListener('blur',blur);
  return ()=>{window.removeEventListener('keydown',kd);window.removeEventListener('keyup',ku);window.removeEventListener('blur',blur);};
 },[]);
 useEffect(()=>{
  if(!profileReady)return;
  const ctx=canvas.current?.getContext('2d');if(!ctx)return;
  let alive=true,previous=0,uiClock=0;
  let simulatedGame, accumulated = 0, inputs = '';
  const draw=(now)=>{
   if(!alive)return;
   // Expand the actual world viewport instead of stretching a 16:9 picture.
   // Keep the original 540-unit vertical scale so WOODY stays proportional.
   const stage=canvas.current?.parentElement;
   const ratio=stage?.clientHeight?stage.clientWidth/stage.clientHeight:W/H;
   const viewW=Math.max(W,Math.min(2400,Math.round(H*ratio)));
   if(canvas.current&&canvas.current.width!==viewW)canvas.current.width=viewW;
   const dt=previous ? Math.min((now-previous)/1000,.1) : 0;previous=now;
   const g=game.current;
   if(g&&!g.ended){
    if (simulatedGame !== g) {
      simulatedGame = g;
      accumulated = 0;
      inputs = '';
    }
    accumulated += dt;
    while (accumulated >= FOREST_STEP_SECONDS && !g.ended) {
      inputs += forestInputFrame(g.keys);
      stepForest(g, { audio: audio.current, visuals: true });
      accumulated -= FOREST_STEP_SECONDS;
    }
    const p = g.player;
    if (g.won) {
      setRecords(old=>{const times={...old.times,[g.level]:Math.min(old.times[g.level]??Infinity,Math.ceil(g.elapsed))};const next={times,bossWins:old.bossWins+(g.level===3?1:0)};try{localStorage.setItem('woody-adventure-records-v1',JSON.stringify(next));}catch{}return next;});
      if(g.level<3){const next=g.level+1;setUnlocked(old=>Math.max(old,next));try{localStorage.setItem('woody-adventure-unlocked-v1',String(next));}catch{}setSelectedLevel(next);}
      setMode('won');
    } else if (g.ended) {
      setMode('over');
    }
    g.camera += (Math.max(0, Math.min(WORLD - viewW, p.x - viewW * .34)) - g.camera) * Math.min(1, dt * 5);
    uiClock+=dt;
    if(g.ended){
      setBest(previous=>{const next=Math.max(previous,g.score);try{localStorage.setItem('woody-adventure-best-v1',String(next));}catch{}return next;});
      if(playerWallet&&!g.reported){
        g.reported=true;
        void saveResult({
          wallet:playerWallet,id:crypto.randomUUID(),level:g.level,score:Math.round(g.score),
          durationMs:Math.min(7200000,Math.max(1000,Math.round(g.elapsed*1000))),
          completed:Boolean(g.won),
          replay: { version: FOREST_REPLAY_VERSION, inputs },
        });
      }
    }
    if(g.ended||uiClock>.12){setHud({score:g.score,lives:g.lives,time:Math.floor(g.elapsed),progress:Math.min(100,Math.floor((p.x-g.config.start)/(g.config.end-g.config.start)*100)),boost:p.doubleJump,ammo:p.flame,remaining:Math.ceil(g.remaining),notice:g.elapsed<g.noticeUntil?g.notice:''});uiClock=0;}
   }
   const cam=g?.camera||0,clock=g?.elapsed||now/1000;
   renderForest2D(ctx,{g,cam,viewW,H,WORLD,FLOOR,solids,clock,sprite:sprite.current,smallDragonSprite:smallDragonSprite.current,guardianDragonSprite:guardianDragonSprite.current});
   raf.current=requestAnimationFrame(draw);
  };
  raf.current=requestAnimationFrame(draw);
  return()=>{alive=false;cancelAnimationFrame(raf.current);};
 },[profileReady,playerWallet,saveResult]);
 const press=(key,down)=>{if(game.current)game.current.keys[key]=down;};
 const button=(key,label)=>(
   <button type="button" aria-label={label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);press(key,true);}}
    onPointerUp={()=>press(key,false)} onPointerCancel={()=>press(key,false)}
    className="woody-control min-w-0 flex-1 select-none rounded-xl border border-emerald-300/25 bg-gradient-to-b from-emerald-800 to-emerald-950 px-2 py-3 text-xs font-black uppercase tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_8px_22px_rgba(0,0,0,.25)] transition hover:border-emerald-200/60 active:scale-[.98] active:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 touch-none sm:px-5 sm:py-4 sm:text-base">{label}</button>
 );
 if(!profileReady)return <ForestPlayerGate onReady={profile=>{setPlayerWallet(profile?.wallet||'');setProfileReady(true);}} />;
 return <main className="woody-page mx-auto max-w-6xl px-2 py-3 md:px-8 md:py-8">
   <section className="woody-intro relative mb-4 overflow-hidden rounded-[28px] border border-emerald-300/20 bg-[radial-gradient(ellipse_at_90%_10%,rgba(34,211,153,.16),transparent_38%),linear-gradient(120deg,#041b1a,#0b2131_70%,#111827)] p-5 shadow-[0_18px_60px_rgba(0,0,0,.22)] sm:p-7 md:mb-6 md:p-8">
    <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-48 w-48 rounded-full border border-emerald-200/10 sm:h-64 sm:w-64" />
    <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
     <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.24em] text-emerald-300 sm:text-xs"><span>WOODY ARCADE</span><span className="text-white/25">/</span><span>FOREST ADVENTURE</span></div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
       <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">{LEVELS[game.current?.level-1||selectedLevel-1].name}</h1>
       <span className="rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-amber-200">{LEVELS[game.current?.level-1||selectedLevel-1].difficulty}</span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-200/80 sm:text-base">Explore the woods, collect WOODY coins and reach the portal. Dodge dragons, jump over fallen logs and keep an eye on the clock.</p>
     </div>
     <div className="grid min-w-0 grid-cols-3 gap-2 lg:min-w-[280px]">
      {[[String(LEVELS.length).padStart(2,'0'),'LEVELS'],[best.toLocaleString(),'PERSONAL BEST'],['FREE','NO ENTRY FEE']].map(([value,label])=><div key={label} className="rounded-2xl border border-white/10 bg-black/20 px-2 py-3 text-center sm:px-3"><strong className="block text-lg font-black text-emerald-200 sm:text-xl">{value}</strong><span className="mt-1 block text-[8px] font-bold uppercase tracking-[.14em] text-slate-400 sm:text-[9px]">{label}</span></div>)}
     </div>
    </div>
   </section>
   <section ref={arcade} className="woody-arcade overflow-hidden rounded-2xl border border-emerald-400/30 bg-slate-950 p-1.5 shadow-[0_0_50px_rgba(16,185,129,.12)] md:rounded-3xl md:p-4">
    <div className="woody-hud mb-1.5 flex flex-wrap items-center gap-1 text-[10px] font-bold text-white/90 sm:mb-3 sm:gap-3 sm:text-sm">
      <button type="button" onClick={toggleSound} aria-label={soundOn?'Mute game sounds':'Enable game sounds'} className="woody-sound rounded-lg border border-cyan-300/50 bg-cyan-900/70 px-2 py-1.5 text-white">{soundOn?'🔊 SOUND':'🔇 MUTED'}</button>
      <button type="button" onClick={enterFullscreen} className="woody-fullscreen rounded-lg border border-orange-300/60 bg-orange-600/70 px-2 py-1.5 text-white">{fullScreen?'⤢ EXIT FULLSCREEN':'⛶ FULLSCREEN'}</button>
      <span className="rounded-full bg-violet-500/30 px-2 py-1">LEVEL {game.current?.level||selectedLevel} / 3</span>
      <span className="rounded-full bg-amber-500/20 px-2 py-1">✦ {hud.score} POINTS</span>
      <span className="rounded-full bg-rose-500/20 px-2 py-1">♥ {hud.lives} LIVES</span>
      <span className="woody-secondary rounded-full bg-orange-500/20 px-2 py-1">★ {best} BEST</span>
      <span className="rounded-full bg-cyan-500/20 px-2 py-1">✦ {hud.boost||0} DOUBLE JUMPS</span>
      <span className="rounded-full bg-orange-500/20 px-2 py-1">🔥 {hud.ammo||0} FIREBALLS</span>
      <span className="woody-secondary rounded-full bg-sky-500/20 px-2 py-1">◷ {hud.time}s</span>
      <span aria-live="polite" className={hud.remaining<=20?"rounded-full bg-red-600 px-2 py-1 text-white animate-pulse":"rounded-full bg-emerald-500/20 px-2 py-1"}>⏳ {Math.floor(hud.remaining/60)}:{String(hud.remaining%60).padStart(2,"0")} LEFT</span>
      <span className="woody-secondary rounded-full bg-emerald-500/20 px-2 py-1">MAP {hud.progress}%</span>
    </div>
    <div className="woody-stage relative mx-auto w-full overflow-hidden rounded-xl">
      {mode==="playing"&&hud.notice&&<div role="status" className="pointer-events-none absolute left-1/2 top-6 z-10 w-max max-w-[90%] -translate-x-1/2 rounded-xl border-2 border-orange-300 bg-red-950/95 px-5 py-3 text-center text-sm font-black text-white shadow-xl md:text-xl">{hud.notice}</div>}
      {mode==="playing"&&hud.remaining<=20&&<div className="pointer-events-none absolute right-3 top-3 z-10 rounded-lg bg-red-700/95 px-3 py-2 text-sm font-black text-white animate-pulse">HURRY UP!</div>}
      <canvas ref={canvas} width={W} height={H} aria-label="WOODY Forest Adventure playable level" className="woody-canvas block aspect-[16/9] w-full"/>
      {mode!=='playing'&&<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 px-4 text-center">
        {mode==='won'&&game.current?.level===3&&<div className="mb-1 text-4xl drop-shadow-[0_0_20px_rgba(251,191,36,.85)] animate-bounce" aria-label="Forest Conqueror trophy">🏆✨</div>}
        <h2 className="text-xl font-black text-orange-200 md:text-4xl">{mode==='won'?(game.current?.level===3?'FOREST CONQUEROR!':'LEVEL COMPLETE!'):mode==='over'?'GAME OVER':'CHOOSE YOUR LEVEL'}</h2>
        <p className="mt-1 max-w-md text-xs text-white/80 sm:mt-3 sm:text-sm">{mode==='won'?(game.current?.level===3?'🏆 You defeated Shadow WOODY King!':'Portal reached! Next challenge unlocked.'):mode==='over'?'Try again — your unlocked levels and records are saved.':'Find crystals, collect coins and conquer the forest.'}</p>
        {mode==='won'&&<div className="mt-2 flex flex-wrap justify-center gap-2 text-xs font-bold text-white"><span className="rounded-lg bg-amber-700/80 px-2 py-1">✦ {game.current?.score} POINTS</span><span className="rounded-lg bg-sky-800/80 px-2 py-1">⏱ {Math.ceil(game.current?.elapsed||0)}s</span><span className="rounded-lg bg-emerald-800/80 px-2 py-1">★ BEST {records.times[game.current?.level]??'—'}s</span></div>}
        {mode==='ready'&&<div className="mt-2 text-xs text-amber-200">{records.bossWins>0?'🏆 FOREST CONQUEROR · '+records.bossWins+' victories':'🏆 Forest Conqueror trophy awaits'} · Best times: {LEVELS.map((_,i)=>'L'+(i+1)+' '+(records.times[i+1]??'—')+'s').join(' · ')}</div>}
        {mode==='ready'&&<div className="mt-2 flex flex-wrap justify-center gap-2">{LEVELS.map((level,i)=><button key={level.name} type="button" disabled={i+1>unlocked} onClick={()=>setSelectedLevel(i+1)} className={'rounded-lg px-3 py-2 text-xs font-bold '+(selectedLevel===i+1?'bg-emerald-500 text-slate-950':'bg-slate-700 text-white')+' disabled:opacity-40'}>LEVEL {i+1} {i+1>unlocked?'🔒':''}</button>)}</div>}
        <button onClick={()=>start(mode==='won'&&game.current?.level<3?game.current.level+1:selectedLevel)} className="mt-3 rounded-xl bg-orange-500 px-6 py-2 font-black text-white hover:bg-orange-400">{mode==='won'&&game.current?.level<3?'NEXT LEVEL':mode==='ready'?'START ADVENTURE':'PLAY AGAIN'}</button>
      </div>}
    </div>
    <div className="woody-controls mt-2 grid grid-cols-2 gap-2 sm:mt-4">
      <div className="flex min-w-0 gap-1.5">{button('left','◀ LEFT')}{button('right','RIGHT ▶')}</div>
      <div className="flex min-w-0 gap-1.5">{button('shoot','🔥 FIRE')}{button('jump','▲ JUMP')}</div>
    </div>
    <p role="status" className="mt-3 text-xs font-semibold text-emerald-200/80">
      {syncStatus==='saving'?'Saving your game to WOODY Gaming…':syncStatus==='saved'?'Game saved to your profile.':syncStatus==='pending'?'Cloud sync unavailable. Finished games are queued on this device for retry.':syncStatus==='loading'?'Syncing your saved profile…':'Progress sync enabled for this profile.'}
    </p>
    <p className="woody-help mt-4 text-xs text-white/60">Keyboard: A / D or ← / → to move · SPACE / ↑ / W to jump · F to shoot. Mobile: hold the buttons. Amber fire orbs grant five fireballs; shoot dragons from a distance. Blue crystals grant three mid-air double jumps. Jump over logs and stumps: touching them costs one life and returns you to the last checkpoint. Cracked platforms collapse 0.85 seconds after you land. Beat the clock: Level 1 has 1:30, Level 2 has 1:18, and Level 3 has 1:35. Time-out costs a life and restarts the current level; enemies and water return you to the last checkpoint. Coins are in-game points only. Progress and records are backed up to your player profile after a finished game. Offline results remain queued on this device.</p>
   </section>
   <Leaderboard />
   <p className="woody-footer mt-4 text-center text-xs text-white/50">WOODY Forest Adventure · Season 1. Three levels, one final boss. Unlocked levels and personal records are saved to your player profile after finished games; the browser keeps an offline copy.</p>
   <style jsx global>{`
     /* Keep all four touch buttons and the stage visible together on a phone. */
     @media (max-width: 900px) and (orientation: landscape) and (max-height: 600px) {
       .woody-page { max-width: none !important; padding: 0 !important; }
       .woody-intro, .woody-help, .woody-footer, .woody-secondary { display: none !important; }
       .woody-arcade { display: flex; flex-direction: column; height: 100dvh; width: 100%; border-radius: 0; padding: 3px 8px max(3px,env(safe-area-inset-bottom)); }
       .woody-hud { flex: 0 0 auto; margin-bottom: 2px; gap: 3px; font-size: 10px; }
       .woody-hud > span { padding: 2px 6px; }
       .woody-stage { width: min(100%, calc((100dvh - 95px) * 16 / 9)); flex: 1 1 auto; min-height: 0; aspect-ratio: 16 / 9; }
       .woody-canvas { width: 100%; height: 100%; object-fit: contain; }
       .woody-controls { flex: 0 0 45px; margin-top: 3px; gap: 14px; }
       .woody-control { padding: 6px 8px; font-size: 14px; }
       body:has(.woody-page) { overflow: hidden; }
     }
     /* Mobile browsers may report >900 CSS px in landscape, so do not gate
        the playable layout on max-width. Pin the arcade to the VISUAL viewport:
        the site's navigation and browser chrome no longer push controls away. */
     @media (orientation: landscape) and (pointer: coarse) {
       .woody-arcade {
         position: fixed !important; inset: 0 !important; z-index: 99999 !important;
         box-sizing: border-box !important; display: flex !important;
         flex-direction: column !important; align-items: center !important;
         width: 100vw !important; height: 100dvh !important;
         max-width: none !important; margin: 0 !important;
         padding: 2px max(8px,env(safe-area-inset-right)) max(3px,env(safe-area-inset-bottom)) max(8px,env(safe-area-inset-left)) !important;
         border-radius: 0 !important; overflow: hidden !important;
         background: #020617 !important;
       }
       .woody-arcade .woody-help, .woody-arcade .woody-secondary { display:none !important; }
       .woody-arcade .woody-hud {
         align-self: stretch !important; display: flex !important;
         flex-wrap: nowrap !important; justify-content: center !important;
         flex: 0 0 29px !important; min-height: 0 !important;
         margin: 0 0 2px !important; gap: 4px !important;
         overflow: hidden !important; font-size: 10px !important;
       }
       .woody-arcade .woody-hud > span { padding: 3px 6px !important; white-space: nowrap !important; }
       .woody-arcade .woody-sound { flex-shrink:0 !important; padding:3px 6px !important; font-size:10px !important; }
       .woody-arcade .woody-fullscreen { flex-shrink: 0 !important; padding: 3px 6px !important; font-size: 10px !important; }
       .woody-arcade .woody-stage {
         flex: 1 1 0 !important; min-height: 0 !important;
         width: 100% !important;
         max-width: 100% !important; aspect-ratio: auto !important;
         margin: 0 auto !important; overflow: hidden !important;
       }
       .woody-arcade .woody-canvas {
         display: block !important; width: 100% !important;
         height: 100% !important; aspect-ratio: auto !important;
         object-fit: contain !important;
       }
       .woody-arcade .woody-controls {
         align-self: stretch !important; width: 100% !important;
         flex: 0 0 54px !important; min-height: 0 !important;
         display: grid !important; grid-template-columns: 1fr 1fr !important;
         margin: 3px 0 0 !important; gap: 12px !important;
       }
       .woody-arcade .woody-controls > div { min-width: 0 !important; gap: 8px !important; }
       .woody-arcade .woody-control {
         min-width: 0 !important; height: 100% !important;
         padding: 4px 5px !important; font-size: 14px !important;
         line-height: 1 !important; border-radius: 12px !important;
       }
       .woody-arcade:fullscreen { inset: 0 !important; }
     }
     @media (max-width: 600px) and (orientation: portrait) {
       .woody-intro { padding: 10px; margin-bottom: 6px; }
       .woody-intro h1 { font-size: 20px; margin-top: 2px; }
       .woody-intro p { display: none; }
       .woody-secondary, .woody-help, .woody-footer { display: none; }
       .woody-arcade { padding: 4px; }
       .woody-control { padding: 12px 4px; font-size: 13px; }
     }
     .woody-arcade:fullscreen { display:flex; flex-direction:column; width:100vw; height:100dvh; padding:4px 8px max(4px,env(safe-area-inset-bottom)); border-radius:0; }
     .woody-arcade:fullscreen .woody-help, .woody-arcade:fullscreen .woody-secondary { display:none; }
     .woody-arcade:fullscreen .woody-hud { flex:0 0 auto; gap:3px; margin-bottom:3px; }
     .woody-arcade:fullscreen .woody-stage { flex:1 1 auto; min-height:0; width:100%; aspect-ratio:auto; }
     .woody-arcade:fullscreen .woody-canvas { width:100%; height:100%; aspect-ratio:auto; object-fit:contain; }
     .woody-arcade:fullscreen .woody-controls { flex:0 0 48px; margin-top:3px; }
   `}</style>
 </main>;
}

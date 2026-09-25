'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const WIDTH = 900;
const HEIGHT = 430;
const GROUND = 342;
const BIRD_X = 158;
const BIRD_SIZE = 65;
const GRAVITY = 1550;
const JUMP = -635;
const STORAGE_KEY = 'woody-forest-run-best-v1';

export default function ForestRun() {
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const frameRef = useRef(null);
  const mascotRef = useRef(null);
  const [status, setStatus] = useState('ready');
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);

  useEffect(() => {
    try { setBest(Number(localStorage.getItem(STORAGE_KEY)) || 0); } catch {}
    const image = new window.Image();
    image.src = '/woody-logo.png';
    image.onload = () => { mascotRef.current = image; };
  }, []);

  const start = useCallback(() => {
    gameRef.current = {
      birdY: GROUND - BIRD_SIZE, velocity: 0, objects: [], elapsed: 0,
      spawnIn: 1, distance: 0, coins: 0, lastTime: null, ended: false
    };
    setScore(0);
    setStatus('playing');
  }, []);

  const jump = useCallback(() => {
    const game = gameRef.current;
    if (!game || game.ended) { start(); return; }
    if (game.birdY >= GROUND - BIRD_SIZE - 3) game.velocity = JUMP;
  }, [start]);

  useEffect(() => {
    const onKey = (event) => {
      if (['Space', 'ArrowUp', 'KeyW'].includes(event.code)) {
        event.preventDefault();
        if (!event.repeat) jump();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    let mounted = true;
    const draw = (time) => {
      if (!mounted) return;
      const game = gameRef.current;
      const dt = game?.lastTime == null ? 0 : Math.min((time - game.lastTime) / 1000, 0.04);
      if (game) game.lastTime = time;
      const distance = game?.distance || 0;

      // Sky, parallax woodland and ground. All visuals render without external game assets.
      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, '#092c45'); sky.addColorStop(0.72, '#287b70'); sky.addColorStop(1, '#9cba6a');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.fillStyle = '#f8d882'; ctx.beginPath(); ctx.arc(730, 85, 37, 0, Math.PI * 2); ctx.fill();
      for (let layer = 0; layer < 2; layer++) {
        const speed = layer ? 0.45 : 0.17;
        const gap = layer ? 126 : 180;
        const offset = (distance * speed) % gap;
        for (let x = -gap; x < WIDTH + gap; x += gap) {
          const tx = x - offset;
          ctx.fillStyle = layer ? '#285e47' : '#367e6c';
          ctx.fillRect(tx + 38, layer ? 160 : 135, layer ? 20 : 14, 215);
          ctx.fillStyle = layer ? '#226348' : '#438b72';
          for (let n = 0; n < 3; n++) {
            ctx.beginPath();
            ctx.moveTo(tx - 22 - n * 6, (layer ? 205 : 175) - n * 42);
            ctx.lineTo(tx + 48, (layer ? 94 : 67) - n * 15);
            ctx.lineTo(tx + 117 + n * 6, (layer ? 205 : 175) - n * 42);
            ctx.closePath(); ctx.fill();
          }
        }
      }
      ctx.fillStyle = '#385b2f'; ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
      ctx.fillStyle = '#7ba846'; ctx.fillRect(0, GROUND, WIDTH, 11);
      ctx.fillStyle = '#2a472d';
      for (let x = -(distance % 75); x < WIDTH; x += 75) ctx.fillRect(x, 380, 30, 4);

      if (game && !game.ended) {
        game.elapsed += dt;
        const speed = Math.min(490, 275 + game.elapsed * 7);
        game.distance += speed * dt;
        game.velocity += GRAVITY * dt;
        game.birdY = Math.min(GROUND - BIRD_SIZE, game.birdY + game.velocity * dt);
        if (game.birdY >= GROUND - BIRD_SIZE) game.velocity = 0;
        game.spawnIn -= dt;
        if (game.spawnIn <= 0) {
          const coin = Math.random() < 0.42;
          game.objects.push({ type: coin ? 'coin' : 'log', x: WIDTH + 25, y: coin ? GROUND - 108 - Math.random() * 48 : GROUND - 36, hit: false });
          game.spawnIn = 0.95 + Math.random() * 0.62 - Math.min(0.28, game.elapsed / 180);
        }
        for (const object of game.objects) {
          object.x -= speed * dt;
          const birdLeft = BIRD_X + 14, birdRight = BIRD_X + BIRD_SIZE - 13;
          const birdTop = game.birdY + 12, birdBottom = game.birdY + BIRD_SIZE - 7;
          if (!object.hit && birdRight > object.x + 7 && birdLeft < object.x + 39) {
            if (object.type === 'coin' && birdTop < object.y + 31 && birdBottom > object.y - 3) {
              object.hit = true; game.coins++;
            } else if (object.type === 'log' && birdBottom > object.y + 5 && birdTop < object.y + 34) {
              game.ended = true;
              const total = Math.floor(game.distance / 18) + game.coins * 25;
              setScore(total);
              setBest(prev => {
                const next = Math.max(prev, total);
                try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
                return next;
              });
              setStatus('over');
            }
          }
        }
        game.objects = game.objects.filter(item => item.x > -55 && !item.hit);
        if (Math.floor(game.distance / 18) !== Math.floor((game.distance - speed * dt) / 18)) setScore(Math.floor(game.distance / 18) + game.coins * 25);
      }
      for (const object of game?.objects || []) {
        if (object.type === 'coin') {
          ctx.fillStyle = '#ffcf4c'; ctx.strokeStyle = '#fff2a4'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(object.x + 18, object.y + 14, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#986319'; ctx.font = 'bold 18px sans-serif'; ctx.fillText('W', object.x + 10, object.y + 20);
        } else {
          ctx.fillStyle = '#78432c'; ctx.fillRect(object.x, object.y, 43, 36);
          ctx.fillStyle = '#aa7042'; ctx.beginPath(); ctx.ellipse(object.x + 21, object.y + 5, 23, 9, 0, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#e0a76a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(object.x + 21, object.y + 5, 11, 5, 0, 0, Math.PI * 2); ctx.stroke();
        }
      }
      const birdY = game?.birdY ?? GROUND - BIRD_SIZE;
      const mascot = mascotRef.current;
      if (mascot) {
        ctx.save();
        ctx.shadowColor = '#f5a83a'; ctx.shadowBlur = 18;
        ctx.beginPath(); ctx.arc(BIRD_X + 32, birdY + 32, 32, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(mascot, BIRD_X, birdY, BIRD_SIZE, BIRD_SIZE);
        ctx.restore();
      } else {
        ctx.fillStyle = '#f9a43e'; ctx.beginPath(); ctx.arc(BIRD_X + 32, birdY + 32, 29, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(BIRD_X + 42, birdY + 23, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#10263c'; ctx.beginPath(); ctx.arc(BIRD_X + 45, birdY + 23, 4, 0, Math.PI * 2); ctx.fill();
      }
      frameRef.current = requestAnimationFrame(draw);
    };
    frameRef.current = requestAnimationFrame(draw);
    return () => { mounted = false; cancelAnimationFrame(frameRef.current); };
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <section className="card mb-5 p-5 md:p-8">
        <span className="badge">WOODY ARCADE</span>
        <h1 className="mt-3 text-3xl font-black text-orange-300 md:text-5xl">WOODY Forest Run</h1>
        <p className="mt-3 text-white/70">Run with the WOODY mascot. Jump over logs, collect coins and beat your personal best!</p>
        <p className="mt-2 text-xs text-sky-200">Free arcade game. Coins and scores are in-game points only — no token payouts.</p>
      </section>
      <section className="card overflow-hidden p-3 md:p-5">
        <div className="mb-3 flex flex-wrap gap-3 text-sm">
          <span className="chip">Score: <strong className="text-orange-300">{score}</strong></span>
          <span className="chip">Personal best: <strong className="text-emerald-300">{best}</strong></span>
          <span className="chip">Status: <strong>{status === 'playing' ? 'RUNNING' : status === 'over' ? 'GAME OVER' : 'READY'}</strong></span>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-400/30">
          <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} onPointerDown={status === 'playing' ? jump : undefined} aria-label="WOODY Forest Run game" className="block w-full touch-manipulation" />
          {status !== 'playing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/55 p-3 text-center">
              <p className="mb-4 text-xl font-black text-white md:text-3xl">{status === 'over' ? 'Nice run! Try again?' : 'Ready to enter the forest?'}</p>
              <button onClick={start} className="cta cta-orange text-lg">{status === 'over' ? 'Play Again' : 'Start Running'}</button>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/70">Desktop: SPACE / ↑ / W · Mobile: tap the game or JUMP.</p>
          <button type="button" onClick={jump} className="cta cta-orange min-w-36 text-lg" aria-label="Jump or start game">⬆ JUMP</button>
        </div>
      </section>
      <p className="mt-4 text-center text-xs text-white/50">Your best score is saved on this device. Online leaderboards and wallet integration are not enabled yet.</p>
    </main>
  );
}

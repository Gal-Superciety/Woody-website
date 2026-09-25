'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const W = 960, H = 540, FLOOR = 446, WORLD = 4300;
const PLAYER = { w: 40, h: 55 };
const LEVEL = [
  { x: 0, y: FLOOR, w: 800 }, { x: 955, y: FLOOR, w: 730 },
  { x: 1820, y: FLOOR, w: 650 }, { x: 2620, y: FLOOR, w: 730 },
  { x: 3500, y: FLOOR, w: 800 },
  { x: 430, y: 345, w: 170 }, { x: 690, y: 295, w: 145 },
  { x: 1100, y: 340, w: 175 }, { x: 1450, y: 305, w: 140 },
  { x: 1950, y: 345, w: 170 }, { x: 2240, y: 285, w: 140 },
  { x: 2820, y: 350, w: 170 }, { x: 3110, y: 300, w: 140 },
  { x: 3690, y: 340, w: 190 }, { x: 3980, y: 290, w: 160 }
];
const COINS = [180, 285, 470, 525, 730, 770, 1040, 1170, 1220, 1510, 1970, 2040, 2290, 2330, 2800, 2860, 3160, 3210, 3750, 3810, 4040, 4110].map((x, i) => ({
  x, y: [360, 340, 305, 305, 255, 250, 375, 300, 290, 255, 305, 300, 245, 245, 365, 310, 260, 260, 300, 300, 250, 250][i]
}));
const ENEMIES = [620, 1320, 2130, 2960, 3620].map((x, i) => ({ x, min: x - 65, max: x + 65, dir: i % 2 ? -1 : 1 }));
const SAVE = 'woody-adventure-best-v1';
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
function fresh() {
  return { x: 60, y: FLOOR - PLAYER.h, vx: 0, vy: 0, onGround: true, facing: 1, camera: 0,
    coins: new Set(), enemies: ENEMIES.map(e => ({ ...e })), checkpoint: 60, lives: 3,
    elapsed: 0, completed: false, over: false, invincible: 0, jumpHeld: false, score: 0 };
}
export default function ForestAdventure() {
  const canvas = useRef(null), frame = useRef(null), game = useRef(null);
  const keys = useRef({ left: false, right: false, jump: false });
  const mascot = useRef(null), last = useRef(null);
  const [ui, setUi] = useState({ phase: 'ready', coins: 0, lives: 3, time: 0, best: null });
  useEffect(() => {
    try { setUi(s => ({ ...s, best: Number(localStorage.getItem(SAVE)) || null })); } catch {}
    const img = new Image();
    img.src = '/woody-logo.png';
    img.onload = () => { mascot.current = img; };
    return () => { mascot.current = null; };
  }, []);
  const start = useCallback(() => {
    game.current = fresh(); last.current = null;
    keys.current = { left: false, right: false, jump: false };
    setUi(s => ({ ...s, phase: 'playing', coins: 0, lives: 3, time: 0 }));
  }, []);
  const setKey = useCallback((name, value) => { keys.current[name] = value; }, []);
  useEffect(() => {
    const down = e => {
      const key = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
        ArrowUp: 'jump', KeyW: 'jump', Space: 'jump' }[e.code];
      if (key) { e.preventDefault(); keys.current[key] = true; }
    };
    const up = e => {
      const key = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
        ArrowUp: 'jump', KeyW: 'jump', Space: 'jump' }[e.code];
      if (key) { e.preventDefault(); keys.current[key] = false; }
    };
    const blur = () => { keys.current = { left: false, right: false, jump: false }; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    let alive = true, lastHud = 0;
    function paint(now) {
      if (!alive) return;
      const g = game.current;
      const dt = last.current == null ? 0 : Math.min(0.034, (now - last.current) / 1000);
      last.current = now;
      if (g && !g.completed && !g.over) {
        const k = keys.current;
        g.elapsed += dt; g.invincible = Math.max(0, g.invincible - dt);
        const axis = Number(k.right) - Number(k.left);
        g.vx += (axis * 1900 - g.vx * (axis ? 3.2 : 10)) * dt;
        g.vx = clamp(g.vx, -300, 300);
        if (axis) g.facing = axis;
        if (k.jump && !g.jumpHeld && g.onGround) { g.vy = -665; g.onGround = false; }
        g.jumpHeld = k.jump;
        const oldBottom = g.y + PLAYER.h;
        g.x = clamp(g.x + g.vx * dt, 0, WORLD - PLAYER.w);
        g.vy = Math.min(950, g.vy + 1640 * dt);
        g.y += g.vy * dt;
        g.onGround = false;
        if (g.vy >= 0) {
          for (const p of LEVEL) {
            if (g.x + PLAYER.w > p.x + 7 && g.x < p.x + p.w - 7 &&
              oldBottom <= p.y + 10 && g.y + PLAYER.h >= p.y) {
              g.y = p.y - PLAYER.h; g.vy = 0; g.onGround = true;
            }
          }
        }
        COINS.forEach((c, i) => {
          if (!g.coins.has(i) && Math.abs(g.x + 20 - c.x) < 29 && Math.abs(g.y + 28 - c.y) < 34) {
            g.coins.add(i); g.score += 25;
          }
        });
        g.enemies.forEach(e => {
          e.x += e.dir * dt * 76;
          if (e.x < e.min || e.x > e.max) e.dir *= -1;
          if (g.invincible <= 0 && g.x + 32 > e.x && g.x + 8 < e.x + 36 &&
            g.y + 48 > FLOOR - 32 && g.y + 10 < FLOOR) {
            if (g.vy > 70 && oldBottom < FLOOR - 22) { e.x = -1000; g.vy = -380; g.score += 50; }
            else {
              g.lives--; g.invincible = 1.8; g.x = g.checkpoint; g.y = FLOOR - PLAYER.h; g.vy = 0; g.vx = 0;
            }
          }
        });
        if (g.x > 1900) g.checkpoint = 1910;
        if (g.x > 3520) g.checkpoint = 3540;
        if (g.y > H + 170) { g.lives--; g.x = g.checkpoint; g.y = FLOOR - PLAYER.h; g.vy = 0; g.vx = 0; g.invincible = 1; }
        if (g.lives <= 0) { g.over = true; setUi(s => ({ ...s, phase: 'over' })); }
        if (g.x > WORLD - 125) {
          g.completed = true;
          const final = g.score + Math.max(0, 2000 - Math.floor(g.elapsed * 12)) + g.lives * 100;
          setUi(s => {
            const best = Math.max(s.best || 0, final);
            try { localStorage.setItem(SAVE, String(best)); } catch {}
            return { ...s, phase: 'won', coins: g.coins.size, lives: g.lives, time: Math.floor(g.elapsed), score: final, best };
          });
        }
        g.camera += (clamp(g.x - 300, 0, WORLD - W) - g.camera) * Math.min(1, dt * 6);
        if (now - lastHud > 180) {
          lastHud = now;
          setUi(s => ({ ...s, coins: g.coins.size, lives: g.lives, time: Math.floor(g.elapsed) }));
        }
      }
      const camera = g?.camera || 0;
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#10274d'); sky.addColorStop(.56, '#417f84'); sky.addColorStop(1, '#b6c58a');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#fce0a4'; ctx.beginPath(); ctx.arc(800 - camera * .025, 85, 48, 0, Math.PI * 2); ctx.fill();
      // Hand-painted-style layered woodland, atmospheric depth and parallax.
      for (let layer = 0; layer < 3; layer++) {
        const step = 180 - layer * 20, scroll = camera * (.12 + layer * .17);
        for (let i = -2; i < 10; i++) {
          const x = i * step - (scroll % step);
          const base = 360 + layer * 35;
          ctx.fillStyle = ['#356e79', '#2b6764', '#194d48'][layer];
          ctx.fillRect(x + 53, base - 125, 20 + layer * 4, 170);
          for (let t = 0; t < 3; t++) {
            ctx.beginPath();
            ctx.moveTo(x + 65, base - 265 + t * 49);
            ctx.lineTo(x - 25 - layer * 6, base - 100 + t * 32);
            ctx.lineTo(x + 150 + layer * 6, base - 100 + t * 32);
            ctx.closePath(); ctx.fill();
          }
        }
      }
      ctx.save(); ctx.translate(-camera, 0);
      // Mist-filled chasms and distant waterfalls.
      ctx.fillStyle = '#274f59';
      for (const [x, width] of [[800, 155], [1685, 135], [2470, 150], [3350, 150]]) {
        ctx.fillRect(x, FLOOR + 10, width, H - FLOOR);
        ctx.fillStyle = '#70b8b6'; ctx.fillRect(x + width / 2 - 12, 260, 24, H - 260);
        ctx.fillStyle = '#274f59';
      }
      for (const p of LEVEL) {
        ctx.fillStyle = '#503c35'; ctx.fillRect(p.x, p.y + 10, p.w, H - p.y);
        ctx.fillStyle = '#759e55'; ctx.fillRect(p.x, p.y, p.w, 15);
        ctx.fillStyle = '#b3c777'; ctx.fillRect(p.x, p.y, p.w, 4);
        ctx.fillStyle = '#3a5743';
        for (let x = p.x + 15; x < p.x + p.w; x += 44) {
          ctx.beginPath(); ctx.ellipse(x, p.y + 28, 13, 6, -.3, 0, Math.PI * 2); ctx.fill();
        }
      }
      COINS.forEach((c, i) => {
        if (g?.coins.has(i)) return;
        const bob = Math.sin(now / 270 + i) * 4;
        ctx.shadowBlur = 15; ctx.shadowColor = '#ffd25c';
        ctx.fillStyle = '#ffd35a'; ctx.beginPath(); ctx.arc(c.x, c.y + bob, 12, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#fff0a4'; ctx.lineWidth = 3; ctx.stroke(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#8d5a24'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('W', c.x - 6, c.y + 5 + bob);
      });
      for (const e of g?.enemies || ENEMIES) {
        if (e.x < 0) continue;
        ctx.fillStyle = '#713b7e'; ctx.beginPath(); ctx.ellipse(e.x + 18, FLOOR - 16, 21, 18, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#d4a2df'; ctx.beginPath(); ctx.arc(e.x + 10, FLOOR - 20, 4, 0, Math.PI * 2);
        ctx.arc(e.x + 26, FLOOR - 20, 4, 0, Math.PI * 2); ctx.fill();
      }
      // Checkpoint banners and final portal.
      for (const x of [1910, 3540]) {
        ctx.fillStyle = '#ddc79a'; ctx.fillRect(x, FLOOR - 130, 6, 130);
        ctx.fillStyle = '#ec9a44'; ctx.beginPath(); ctx.moveTo(x + 6, FLOOR - 130);
        ctx.lineTo(x + 70, FLOOR - 108); ctx.lineTo(x + 6, FLOOR - 88); ctx.fill();
      }
      ctx.shadowColor = '#71f0dc'; ctx.shadowBlur = 25;
      ctx.strokeStyle = '#89f7df'; ctx.lineWidth = 13;
      ctx.beginPath(); ctx.ellipse(WORLD - 90, FLOOR - 64, 37, 65, 0, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
      if (g && !(g.invincible > 0 && Math.floor(now / 90) % 2 === 0)) {
        ctx.save();
        const bounce = g.onGround ? Math.sin(now / 95) * Math.min(3, Math.abs(g.vx) / 80) : -3;
        ctx.translate(g.x + 20, g.y + 28 + bounce);
        ctx.scale(g.facing, 1);
        ctx.shadowColor = '#f4a34b'; ctx.shadowBlur = 14;
        if (mascot.current) {
          ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.clip();
          ctx.drawImage(mascot.current, -29, -29, 58, 58);
        } else {
          ctx.fillStyle = '#e99a42'; ctx.beginPath(); ctx.ellipse(0, 0, 22, 26, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();
      frame.current = requestAnimationFrame(paint);
    }
    frame.current = requestAnimationFrame(paint);
    return () => { alive = false; cancelAnimationFrame(frame.current); };
  }, []);
  const control = (name, label) => (
    <button type="button" aria-label={label}
      onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); setKey(name, true); }}
      onPointerUp={() => setKey(name, false)} onPointerCancel={() => setKey(name, false)}
      onLostPointerCapture={() => setKey(name, false)}
      className="min-w-20 select-none rounded-xl border border-sky-300/40 bg-sky-500/20 px-5 py-4 text-lg font-black text-sky-100 active:bg-orange-400/40 touch-none">
      {label}
    </button>
  );
  return (
    <main className="mx-auto max-w-7xl px-3 py-6 md:px-8">
      <section className="mb-5 rounded-3xl border border-emerald-400/20 bg-slate-900/80 p-5">
        <span className="badge">WOODY ARCADE · CHAPTER ONE</span>
        <h1 className="mt-3 text-3xl font-black text-orange-300 md:text-5xl">The Enchanted Forest</h1>
        <p className="mt-3 text-white/75">A real side-scrolling platform adventure: explore, jump across ravines, collect coins, defeat forest creatures and reach the portal.</p>
        <p className="mt-2 text-xs text-sky-200">Free game · In-game points only · No token rewards</p>
      </section>
      <section className="overflow-hidden rounded-2xl border border-emerald-400/25 bg-slate-950 p-2 md:p-4">
        <div className="mb-3 flex flex-wrap gap-3 text-sm font-bold">
          <span className="chip">🪙 {ui.coins}/{COINS.length}</span>
          <span className="chip">❤️ {ui.lives}</span>
          <span className="chip">⏱ {ui.time}s</span>
          <span className="chip">🏆 Best {ui.best ?? '—'}</span>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-white/10">
          <canvas ref={canvas} width={W} height={H} aria-label="WOODY Forest Adventure platform game" className="block w-full" />
          {ui.phase !== 'playing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/70 p-4 text-center">
              <h2 className="text-xl font-black text-orange-200 md:text-4xl">
                {ui.phase === 'won' ? 'Forest conquered!' : ui.phase === 'over' ? 'Game over — try again!' : 'Ready for an adventure?'}
              </h2>
              {ui.phase === 'won' && <p>Final score: {ui.score}</p>}
              <button type="button" onClick={start} className="rounded-xl bg-orange-500 px-8 py-3 text-lg font-black text-white hover:bg-orange-400">
                {ui.phase === 'ready' ? 'START ADVENTURE' : 'PLAY AGAIN'}
              </button>
            </div>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-2">{control('left', '◀')}{control('right', '▶')}</div>
          {control('jump', '⬆ JUMP')}
        </div>
        <p className="mt-3 text-center text-xs text-white/60">Desktop: A / D or ← / → to move · SPACE / W / ↑ to jump. Mobile: hold the on-screen buttons. Checkpoint flags save your position.</p>
      </section>
      <p className="mt-4 text-center text-xs text-white/50">Preview level. Character sprite animation and final illustrated art are being developed; the current character uses the existing WOODY site logo.</p>
    </main>
  );
}

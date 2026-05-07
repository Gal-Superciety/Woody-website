'use client';

import Image from 'next/image';

const monitorItems = [
  { title: 'Monitoring', value: '24/7', note: 'Wallet flow and momentum tracking' },
  { title: 'Liquidity', value: 'Multi-pool', note: 'Depth watch across WOODY pairs' },
  { title: 'Swaps', value: 'Live-ready', note: 'Fast routing through ecosystem venues' },
  { title: 'Holders', value: 'Growing', note: 'Community wallet base expanding' },
];

const aiItems = [
  'Future smart signal scoring for meme-market timing',
  'On-chain pattern analysis for wallet and liquidity behavior',
  'AI-assisted direction layer for market awareness',
];

const gameItems = [
  { title: 'Collectible Cards', text: 'WOODY card drops with rarity tiers and utility hooks.' },
  { title: 'Poker Energy', text: 'Cinematic poker-style aesthetics for social game modes.' },
  { title: 'Arcade Teasers', text: 'Fast mini-game concepts connected to community seasons.' },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:gap-12 md:px-8 md:py-12">
      <section className="card cyber-grid relative overflow-hidden p-6 md:p-10">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="badge mb-4">WOODY Ecosystem</p>
            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">WOODY</h1>
            <p className="mt-4 max-w-xl text-white/75 md:text-lg">A cinematic crypto brand focused on signals, games, and community momentum.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="https://e-compass.io/token/WOODY-5f9d9c" target="_blank" rel="noopener noreferrer" className="cta cta-orange">Buy WOODY</a>
              <a href="https://t.me/wooodymeme" target="_blank" rel="noopener noreferrer" className="cta cta-blue">Telegram</a>
              <a href="https://x.com/WOODY_EX" target="_blank" rel="noopener noreferrer" className="cta cta-green">Twitter / X</a>
            </div>
          </div>
          <div className="glow-card rounded-2xl p-5">
            <Image src="/woody-hero.png" alt="WOODY mascot full body" width={640} height={820} priority className="mx-auto h-auto w-full max-w-sm object-contain" />
          </div>
        </div>
      </section>

      <section className="card glow-card p-6 md:p-8">
        <h2 className="section-title">WOODY Monitor</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {monitorItems.map((item) => (
            <article key={item.title} className="holo-panel rounded-xl p-4">
              <p className="text-xs uppercase tracking-widest text-white/50">{item.title}</p>
              <p className="mt-2 text-xl font-bold text-white">{item.value}</p>
              <p className="mt-1 text-xs text-white/65">{item.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card glow-card p-6 md:p-8">
        <h2 className="section-title">AI Signals</h2>
        <ul className="mt-5 space-y-3">
          {aiItems.map((item) => (
            <li key={item} className="signal-widget text-sm text-white/80">{item}</li>
          ))}
        </ul>
      </section>

      <section className="card glow-card p-6 md:p-8">
        <h2 className="section-title">Games & Cards</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {gameItems.map((item) => (
            <article key={item.title} className="playing-card">
              <p className="text-xs uppercase tracking-[0.2em] text-orange-300">Future</p>
              <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-white/75">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="card glow-card p-6 md:p-8">
        <h2 className="section-title">Community</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href="https://t.me/wooodymeme" target="_blank" rel="noopener noreferrer" className="cta cta-blue">Telegram</a>
          <a href="https://x.com/WOODY_EX" target="_blank" rel="noopener noreferrer" className="cta cta-green">Twitter / X</a>
          <a href="https://e-compass.io/token/WOODY-5f9d9c" target="_blank" rel="noopener noreferrer" className="cta cta-orange">Buy</a>
        </div>
      </section>
    </main>
  );
}

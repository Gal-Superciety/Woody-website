'use client';

import Image from 'next/image';

const monitorPanels = [
  { title: 'Wallet Drift', value: '+18%', detail: 'Smart-wallet flow over 24h' },
  { title: 'Volatility Heat', value: 'High', detail: 'Rapid meme-sector movement' },
  { title: 'Liquidity Pulse', value: '$2.4M', detail: 'Tracked cross-pool depth' },
];

const aiSignals = [
  { label: 'Momentum', score: 84, tone: 'sky' },
  { label: 'Whale Intent', score: 71, tone: 'orange' },
  { label: 'Narrative Strength', score: 92, tone: 'sky' },
  { label: 'Risk Spread', score: 46, tone: 'orange' },
];

const cardCollection = [
  { name: 'Woody Prime', trait: 'Genesis Rare', metric: 'Signal Boost +14' },
  { name: 'Neon Raider', trait: 'Arcade Epic', metric: 'Liquidity Scan +11' },
  { name: 'Chain Phantom', trait: 'Holo Ultra', metric: 'Whale Trace +9' },
];

const gameCards = [
  { title: 'Signal Sprint', text: 'Time-based prediction rounds with live momentum checkpoints.' },
  { title: 'Vault Breaker', text: 'Card-powered strategy mode with rotating market events.' },
  { title: 'Deck Arena', text: 'Competitive WOODY card battles tied to weekly leaderboards.' },
];

export default function Home() {
  return (
    <main className="woody-shell mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:gap-12 md:px-8 md:py-12">
      <section className="card cyber-grid relative overflow-hidden p-6 shadow-[0_0_55px_rgba(59,130,246,0.2)] md:p-10">
        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="badge mb-4">Crypto Meme Ecosystem</p>
            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">WOODY Control Layer</h1>
            <p className="mt-4 max-w-2xl text-base text-white/75 md:text-lg">Dark premium dashboard design with live-style widgets, holographic cards, and game-ready visuals built fully in CSS + HTML.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="https://e-compass.io/token/WOODY-5f9d9c" target="_blank" rel="noopener noreferrer" className="cta cta-orange">Buy</a>
              <a href="https://t.me/wooodymeme" target="_blank" rel="noopener noreferrer" className="cta cta-blue">Telegram</a>
              <a href="https://x.com/WOODY_EX" target="_blank" rel="noopener noreferrer" className="cta cta-green">X</a>
            </div>
          </div>
          <div className="glow-card relative overflow-hidden rounded-2xl p-5">
            <Image src="/woody-hero.png" alt="WOODY mascot full body" width={640} height={820} priority sizes="(max-width: 1024px) 100vw, 36vw" className="mx-auto h-auto w-full max-w-sm object-contain" />
          </div>
        </div>
      </section>

      <div className="divider-wave" aria-hidden="true" />

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card glow-card p-6 md:p-8">
          <h2 className="section-title">Woody Monitor</h2>
          <p className="mt-2 text-sm text-white/70">Holographic monitoring panel for trend awareness and liquidity flow.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {monitorPanels.map((panel) => (
              <div key={panel.title} className="holo-panel rounded-xl p-4">
                <p className="text-xs uppercase tracking-widest text-white/50">{panel.title}</p>
                <p className="mt-2 text-2xl font-bold text-white">{panel.value}</p>
                <p className="mt-1 text-xs text-white/60">{panel.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card glow-card p-6 md:p-8">
          <h2 className="section-title">AI Signals</h2>
          <p className="mt-2 text-sm text-white/70">Signal widgets translate market behavior into fast visual confidence bands.</p>
          <div className="mt-5 space-y-4">
            {aiSignals.map((signal) => (
              <div key={signal.label} className="signal-widget">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">{signal.label}</span>
                  <span className="text-white/70">{signal.score}/100</span>
                </div>
                <div className="signal-track">
                  <span
                    className={`signal-fill ${signal.tone === 'orange' ? 'signal-orange' : 'signal-sky'}`}
                    style={{ width: `${signal.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <div className="divider-angle" aria-hidden="true" />

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card glow-card p-6 md:p-8">
          <h2 className="section-title">Card Collection</h2>
          <p className="mt-2 text-sm text-white/70">Playing card previews rendered with layered gradients and neon accents.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cardCollection.map((item) => (
              <div key={item.name} className="playing-card">
                <p className="text-xs uppercase tracking-[0.2em] text-orange-300">WOODY</p>
                <h3 className="mt-3 text-lg font-bold text-white">{item.name}</h3>
                <p className="mt-1 text-sm text-white/75">{item.trait}</p>
                <p className="mt-6 text-xs text-sky-300">{item.metric}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="card glow-card p-6 md:p-8">
          <h2 className="section-title">Games</h2>
          <p className="mt-2 text-sm text-white/70">Game section cards for upcoming interactive WOODY experiences.</p>
          <div className="mt-5 grid gap-4">
            {gameCards.map((game) => (
              <div key={game.title} className="game-card rounded-xl p-4">
                <h3 className="text-lg font-bold text-white">{game.title}</h3>
                <p className="mt-2 text-sm text-white/75">{game.text}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <div className="divider-wave" aria-hidden="true" />

      <section className="card glow-card p-6 md:p-8">
        <h2 className="section-title">White Paper</h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-white/75 md:text-base">WOODY combines community energy with monitor tooling, AI-assisted signal logic, collectible card mechanics, and game-ready utility loops. The white paper details token behavior, ecosystem modules, and phased execution across analytics, engagement, and entertainment layers.</p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <span className="chip">Token Framework</span>
          <span className="chip">Signal Architecture</span>
          <span className="chip">Card Utility</span>
          <span className="chip">Game Economics</span>
        </div>
      </section>
    </main>
  );
}

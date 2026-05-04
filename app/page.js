const botFeatures = [
  'Smart wallet alerts',
  'Price movement notifications',
  'Liquidity pool tracking',
  'Signal-ready trend summaries',
];

const roadmap = [
  'Phase 1 — Launch & community growth',
  'Phase 2 — Bot upgrades + analytics',
  'Phase 3 — Partnerships & utility expansions',
  'Phase 4 — Cross-chain visibility',
];

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <section className="card shadow-glow relative overflow-hidden p-8 md:p-12">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative z-10 max-w-3xl">
          <p className="mb-3 inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-accent">
            Meme Token Ecosystem
          </p>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">WOODY Meme</h1>
          <p className="mt-4 max-w-2xl text-sm text-white/70 md:text-base">
            Fast, fun, and community-driven meme energy with a utility-focused monitor bot.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#" className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110">Buy</a>
            <a href="#" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold hover:border-accent/60">Telegram</a>
            <a href="#" className="rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold hover:border-accent/60">X</a>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="section-title">About WOODY</h2>
          <p className="mt-3 text-sm text-white/75">
            WOODY is a meme-powered community token built for momentum, culture, and crypto-native engagement.
          </p>
        </div>
        <div className="card p-6">
          <h2 className="section-title">Token Info</h2>
          <div className="mt-4 grid gap-2 text-sm text-white/80">
            <p><span className="text-white/55">Ticker:</span> WOODY</p>
            <p><span className="text-white/55">Token ID:</span> WOODY-5f9d9c</p>
            <p><span className="text-white/55">Chain:</span> MultiversX</p>
          </div>
        </div>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="section-title">WOODY Monitor Bot</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {botFeatures.map((feature) => (
            <div key={feature} className="rounded-xl border border-white/10 bg-soft/60 px-4 py-3 text-sm text-white/85">
              {feature}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <h2 className="section-title">Liquidity</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg border border-accent/35 bg-accent/10 px-3 py-1 text-accent">OneDex</span>
            <span className="rounded-lg border border-accent/35 bg-accent/10 px-3 py-1 text-accent">xExchange</span>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="section-title">Community</h2>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a href="#" className="rounded-lg border border-white/20 px-3 py-1.5 hover:border-accent/60">Telegram</a>
            <a href="#" className="rounded-lg border border-white/20 px-3 py-1.5 hover:border-accent/60">X</a>
            <a href="#" className="rounded-lg border border-white/20 px-3 py-1.5 hover:border-accent/60">Docs</a>
          </div>
        </div>
      </section>

      <section className="mt-6 card p-6">
        <h2 className="section-title">Roadmap</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {roadmap.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-soft/60 px-4 py-3 text-sm text-white/85">
              {item}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

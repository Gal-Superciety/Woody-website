import Image from 'next/image';

const quickStats = [
  { label: 'Ticker', value: 'WOODY' },
  { label: 'Network', value: 'MultiversX' },
  { label: 'Launch Type', value: 'Community Meme' },
  { label: 'Status', value: 'Live & Growing' },
];

const monitorFeatures = [
  'Whale wallet movement alerts in real time',
  'Pump/dump volatility pings for faster reactions',
  'Liquidity change monitor for early warning signals',
  'Momentum snapshots with meme market context',
];

const roadmap = [
  'Phase 1: Brand launch, social momentum, first listings',
  'Phase 2: WOODY Monitor Bot v2 + premium signals',
  'Phase 3: Partnerships, raids, and creator integrations',
  'Phase 4: Expanded utility and multi-chain visibility',
];

const infoCards = [/* unchanged */
  {
    title: 'Token Info',
    content: (
      <dl className="grid grid-cols-2 gap-3 text-sm text-white/85">
        <dt className="text-white/50">Token Name</dt><dd className="font-semibold">WOODY Meme</dd>
        <dt className="text-white/50">Symbol</dt><dd className="font-semibold text-sky-300">$WOODY</dd>
        <dt className="text-white/50">Supply Model</dt><dd className="font-semibold">Transparent</dd>
        <dt className="text-white/50">Contract</dt><dd className="truncate font-semibold">WOODY-5f9d9c</dd>
      </dl>
    ),
  },
  {
    title: 'WOODY Monitor Bot',
    content: (
      <ul className="space-y-2 text-sm text-white/85">
        {monitorFeatures.map((item) => (<li key={item} className="rounded-lg border border-sky-400/20 bg-sky-400/5 px-3 py-2">{item}</li>))}
      </ul>
    ),
  },
  {
    title: 'Liquidity',
    content: (
      <div className="space-y-3 text-sm"><p className="text-white/75">Designed for smooth trading access across major MultiversX venues.</p><div className="flex flex-wrap gap-2"><span className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 font-medium text-emerald-300">xExchange</span><span className="rounded-lg border border-orange-400/40 bg-orange-400/10 px-3 py-1.5 font-medium text-orange-300">OneDex</span><span className="rounded-lg border border-sky-400/40 bg-sky-400/10 px-3 py-1.5 font-medium text-sky-300">Aggregator-ready</span></div></div>
    ),
  },
  {
    title: 'Roadmap',
    content: (
      <ol className="space-y-2 text-sm text-white/85">{roadmap.map((step, index) => (<li key={step} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"><span className="mr-2 font-semibold text-orange-300">0{index + 1}</span>{step}</li>))}</ol>
    ),
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-8 md:gap-14 md:px-8 md:py-12">
      <section className="card relative overflow-hidden p-6 shadow-[0_0_50px_rgba(59,130,246,0.16)] md:p-10">
        <div className="absolute -left-20 -top-16 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative z-10 grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-emerald-400/40 bg-emerald-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Crypto Meme Ecosystem</p>
            <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">WOODY Meme<span className="mt-2 block text-2xl text-sky-300 md:text-4xl">Built for Community, Speed & Hype</span></h1>
            <p className="mt-5 max-w-2xl text-base text-white/75 md:text-lg">A professional meme-token presence with real-time monitoring tools, clean liquidity access, and a roadmap focused on long-term expansion.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="https://e-compass.io/token/WOODY-5f9d9c" target="_blank" rel="noopener noreferrer" className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-orange-400">Buy</a>
              <a href="https://t.me/wooodymeme" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-sky-400/60 bg-sky-400/10 px-6 py-3 text-sm font-semibold text-sky-200 transition hover:bg-sky-400/20">Telegram</a>
              <a href="https://x.com/WOODY_EX" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-400/60 bg-emerald-400/10 px-6 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20">X</a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0b1324]/80 p-5">
            <Image src="/woody-hero.png" alt="WOODY mascot full body" width={640} height={820} priority sizes="(max-width: 1024px) 100vw, 36vw" className="mx-auto h-auto w-full max-w-sm object-contain" />
            <h2 className="mt-4 text-lg font-bold text-white">WOODY Pulse</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{quickStats.map((item) => (<div key={item.label} className="rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-xs uppercase tracking-widest text-white/50">{item.label}</p><p className="mt-1 text-sm font-semibold text-white">{item.value}</p></div>))}</div>
          </div>
        </div>
      </section>
      <section className="grid gap-6 md:grid-cols-2">{infoCards.map((card) => (<article key={card.title} className="card p-6 md:p-7"><h3 className="section-title">{card.title}</h3><div className="mt-4">{card.content}</div></article>))}</section>
    </main>
  );
}

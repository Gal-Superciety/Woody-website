import Link from 'next/link';

export const metadata = {
  title: 'WOODY Arcade | Forest Adventure & Mini Games',
  description: 'Explore WOODY games and use one MultiversX wallet-linked player profile.',
};

const games = [
  {
    href: '/forest-adventure',
    eyebrow: 'ARCADE / ADVENTURE',
    name: 'Forest Adventure',
    description: 'A 2D WOODY adventure with progressive levels, challenges and a leaderboard.',
    symbol: '🌲',
    accent: 'from-emerald-700/30 to-cyan-900/20',
  },
  {
    href: '/woody-casino',
    eyebrow: 'ARCADE / DEMO',
    name: 'Mini Games',
    description: 'Slots, roulette and blackjack with fictional credits. No token betting.',
    symbol: '🎮',
    accent: 'from-orange-700/25 to-violet-900/20',
  },
];

export default function ArcadeHub() {
  return (
    <main className="min-h-[80vh] bg-[#080d14] px-4 py-12 text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[.25em] text-orange-300">WOODY UNIVERSE / ARCADE</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-6xl">Pick your adventure<span className="text-orange-300">.</span></h1>
            <p className="mt-3 max-w-2xl text-white/65">All games in one place. Connect once, find your existing player profile and explore the WOODY universe.</p>
          </div>
          <Link href="/profile" className="rounded-xl border border-orange-300/40 bg-orange-400/15 px-5 py-3 text-sm font-bold text-orange-200 hover:bg-orange-400/25">My Player Profile →</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {games.map(game => (
            <Link key={game.href} href={game.href} className={`group rounded-3xl border border-white/15 bg-gradient-to-br ${game.accent} p-7 shadow-xl transition hover:border-orange-300/60 hover:-translate-y-1 sm:p-9`}>
              <span className="text-xs font-bold tracking-[.22em] text-white/55">{game.eyebrow}</span>
              <div className="my-8 text-7xl" aria-hidden="true">{game.symbol}</div>
              <h2 className="text-3xl font-black">{game.name}</h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-white/70">{game.description}</p>
              <span className="mt-6 inline-flex text-sm font-black text-orange-200 group-hover:text-white">PLAY NOW ↗</span>
            </Link>
          ))}
        </div>
        <div className="mt-7 rounded-2xl border border-sky-200/15 bg-slate-900/50 p-5 text-sm text-white/70">
          Your wallet address can load the same public player name across WOODY games. Demo game points have no cryptocurrency value. Reward eligibility requires separately verified wallet ownership and game results.
        </div>
      </div>
    </main>
  );
}

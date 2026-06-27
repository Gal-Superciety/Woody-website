const navItems = [
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Monitor', href: '#woody-monitor' },
  { label: 'Premium', href: '#premium-access' },
  { label: 'Missions', href: '#daily-missions' },
  { label: 'AI', href: '#ai-assistant' },
  { label: 'NFTs', href: '#nft-center' },
  { label: 'Admin', href: '#admin-panel' },
];

const dashboardCards = [
  {
    icon: '📡',
    title: 'WOODY Monitor',
    description: 'Track ecosystem health, market signals, and community momentum from one command center.',
    status: 'Active',
  },
  {
    icon: '💎',
    title: 'Premium Access',
    description: 'Preview gated tools, advanced insights, and future holder-only utilities.',
    status: 'Coming Soon',
  },
  {
    icon: '🏆',
    title: 'Holder Levels',
    description: 'A foundation for future wallet tiers, progression, and status-based perks.',
    status: 'Coming Soon',
  },
  {
    icon: '🎯',
    title: 'Daily Missions',
    description: 'Mission hub concept for community tasks, streaks, and ecosystem participation.',
    status: 'Coming Soon',
  },
  {
    icon: '🤖',
    title: 'AI Assistant',
    description: 'A future assistant space for guided WOODY ecosystem insights and workflows.',
    status: 'Coming Soon',
  },
  {
    icon: '🖼️',
    title: 'NFT Center',
    description: 'Future home for WOODY collectibles, card drops, rarity views, and NFT utilities.',
    status: 'Coming Soon',
  },
  {
    icon: '📈',
    title: 'Leaderboard',
    description: 'Rank community activity, mission performance, and seasonal ecosystem achievements.',
    status: 'Coming Soon',
  },
  {
    icon: '🎁',
    title: 'Rewards',
    description: 'Prepare the reward layer for future campaigns, milestones, and holder benefits.',
    status: 'Coming Soon',
  },
  {
    icon: '🛡️',
    title: 'Admin Panel',
    description: 'Protected operations area placeholder for future ecosystem management tools.',
    status: 'Coming Soon',
  },
];

export const metadata = {
  title: 'WOODY App | Dashboard',
  description: 'The utility hub for the WOODY ecosystem',
};

export default function WoodyApp() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <section className="card cyber-grid relative overflow-hidden p-5 md:p-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="badge mb-4">Dashboard Foundation</p>
            <h1 className="text-3xl font-black leading-tight text-white md:text-5xl">WOODY App</h1>
            <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-lg">The utility hub for the WOODY ecosystem</p>
          </div>
          <button type="button" className="cta cta-orange w-full sm:w-fit">Connect Wallet</button>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="card glow-card h-fit p-3 lg:sticky lg:top-24">
          <nav aria-label="WOODY App navigation" className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="app-nav-link whitespace-nowrap"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <section id="dashboard" className="card glow-card p-5 md:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">Dashboard</h2>
              <p className="mt-2 text-sm text-white/65">Visual structure only — wallet, blockchain, and AI logic will be connected in later phases.</p>
            </div>
            <span className="module-pill w-fit">APP PREVIEW</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {dashboardCards.map((card) => (
              <article key={card.title} id={card.title.toLowerCase().replaceAll(' ', '-')} className="app-dashboard-card">
                <div className="flex items-start justify-between gap-3">
                  <span className="app-card-icon" aria-hidden="true">{card.icon}</span>
                  <span className={card.status === 'Active' ? 'status-badge status-active' : 'status-badge status-soon'}>{card.status}</span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{card.title}</h3>
                <p className="mt-2 min-h-16 text-sm leading-relaxed text-white/70">{card.description}</p>
                <button type="button" className="mt-5 w-full rounded-xl border border-sky-400/50 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20">Open</button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

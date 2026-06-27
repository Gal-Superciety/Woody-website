import Link from 'next/link';

const WOODY_TOKEN_ID = 'WOODY-5f9d9c';
// TODO: Replace this placeholder with the official xExchange WOODY pair URL when it is available.
const XEXCHANGE_BUY_URL = '#';
const XEXCHANGE_APP_URL = 'https://xexchange.com';

const infoCards = [
  {
    title: 'View Chart',
    eyebrow: 'Market View',
    body: 'Chart access will be linked here once the official verified WOODY market page is ready.',
    action: 'Chart coming soon',
  },
  {
    title: 'Contract Address / Token ID',
    eyebrow: 'Verified ID',
    body: `Official token ID: ${WOODY_TOKEN_ID}. Always compare this exact ID before swapping.`,
    action: 'Copy Token ID',
  },
  {
    title: 'Liquidity Status',
    eyebrow: 'Pool Health',
    body: 'Liquidity information is a static placeholder for now. Live blockchain fetching will be added in a later step.',
    action: 'Status pending',
  },
];

const howToBuySteps = [
  'Open xExchange',
  'Connect your MultiversX wallet',
  'Search or paste WOODY token ID',
  'Swap EGLD or another supported token for WOODY',
];

export const metadata = {
  title: 'Buy WOODY | WOODY Meme',
  description: 'Official WOODY buying links, token ID, and safety information.',
};

export default function BuyWoodyPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <section className="card cyber-grid relative overflow-hidden p-6 md:p-10">
        <div className="relative z-10 max-w-3xl">
          <p className="badge mb-4">Official Buy Hub</p>
          <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">Buy WOODY</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/72 md:text-lg">
            This page will be the official place to find verified buying links and token information for WOODY. Use it to confirm the token ID, check launch status, and follow safe buying steps before swapping.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/" className="cta cta-blue">Back Home</Link>
            <Link href="/app" className="cta cta-orange">Launch App</Link>
            <Link href="/spin" className="cta cta-buy">WOODY Spin</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card glow-card p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Primary verified venue</p>
              <h2 className="mt-2 section-title">Buy on xExchange</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                The official xExchange pair link will be published here after verification. Until then, use the token ID below when searching manually.
              </p>
            </div>
            <span className="module-pill w-fit">Placeholder</span>
          </div>
          <div className="mt-6 rounded-2xl border border-orange-300/25 bg-orange-400/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-orange-200/80">Official token ID</p>
            <p className="mt-2 break-all font-mono text-2xl font-black text-white">{WOODY_TOKEN_ID}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a href={XEXCHANGE_BUY_URL} className="cta cta-orange text-center" aria-disabled="true">Buy on xExchange</a>
            <button type="button" className="cta cta-buy text-center">Copy Token ID</button>
            <a href={XEXCHANGE_APP_URL} target="_blank" rel="noopener noreferrer" className="cta cta-blue text-center">Open xExchange</a>
          </div>
          <p className="mt-3 text-xs text-white/50">Copy button is visual only for this structure step; clipboard logic is not implemented yet.</p>
        </article>

        <aside className="card glow-card p-6 md:p-8">
          <p className="badge mb-4">Safety Notice</p>
          <h2 className="section-title">Verify Before Buying</h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/75">
            <li>Always verify the token ID before buying.</li>
            <li>Official token ID: <span className="font-mono font-bold text-orange-200">{WOODY_TOKEN_ID}</span></li>
            <li>Use only official links from this page.</li>
          </ul>
        </aside>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {infoCards.map((card) => (
          <article key={card.title} className="app-dashboard-card">
            <p className="text-[11px] uppercase tracking-[0.22em] text-sky-300/90">{card.eyebrow}</p>
            <h3 className="mt-3 text-lg font-bold text-white">{card.title}</h3>
            <p className="mt-3 min-h-20 text-sm leading-relaxed text-white/70">{card.body}</p>
            <button type="button" className="mt-5 w-full rounded-xl border border-sky-400/50 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:bg-sky-400/20">{card.action}</button>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card glow-card p-6 md:p-8">
          <h2 className="section-title">How to Buy WOODY</h2>
          <ol className="mt-6 space-y-4">
            {howToBuySteps.map((step, index) => (
              <li key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-300/50 bg-orange-400/15 font-bold text-orange-100">{index + 1}</span>
                <span className="pt-2 text-sm font-semibold text-white/80">{step}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="card glow-card p-6 md:p-8">
          <h2 className="section-title">Liquidity Status</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Liquidity status, live chart data, and verified pool routing are intentionally placeholders in this step. No real blockchain fetching is implemented on this page yet.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="wallet-status-card"><p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Status</p><p className="mt-2 text-lg font-black text-orange-200">Pending</p></div>
            <div className="wallet-status-card"><p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Fetching</p><p className="mt-2 text-lg font-black text-white">Not enabled</p></div>
          </div>
        </article>
      </section>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';

const WOODY_TOKEN_ID = 'WOODY-5f9d9c';

const venues = [
  {
    name: 'xExchange',
    href: 'https://xexchange.com/trade?firstToken=EGLD&secondToken=WOODY-5f9d9c',
    detail: 'WOODY/EGLD and other monitored WOODY pools',
    status: 'Verified venue',
  },
  {
    name: 'OneDex',
    href: 'https://swap.onedex.app/swap?firstToken=EGLD&secondToken=WOODY-5f9d9c',
    detail: 'WOODY/EGLD liquidity is tracked by WOODY Monitor',
    status: 'Verified venue',
  },
  {
    name: 'JEX',
    href: 'https://app.jexchange.io/?buyToken=WOODY-5f9d9c&paymentToken=EGLD',
    detail: 'WOODY/JEX, WOODY/BOBER and WOODY/OLV pools are tracked',
    status: 'Verified venue',
  },
];

export default function BuyWoodyPage() {
  const [copied, setCopied] = useState(false);

  const copyTokenId = async () => {
    try {
      await navigator.clipboard.writeText(WOODY_TOKEN_ID);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 md:px-8 md:py-10">
      <section className="card cyber-grid relative overflow-hidden p-5 md:p-9">
        <div className="relative z-10 max-w-3xl">
          <p className="badge mb-4">WOODY Buy Hub</p>
          <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">Buy WOODY</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70 md:text-lg">
            Verify the official token identifier first, then choose a confirmed MultiversX trading venue.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/app" className="cta cta-orange text-center">Open Command Center</Link>
            <Link href="/" className="cta cta-blue text-center">Home</Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="card glow-card p-5 md:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Official token ID</p>
          <div className="mt-4 rounded-2xl border border-orange-300/25 bg-orange-400/10 p-4 md:p-5">
            <p className="break-all font-mono text-xl font-black text-white md:text-3xl">{WOODY_TOKEN_ID}</p>
          </div>
          <button type="button" onClick={copyTokenId} className="cta cta-orange mt-4 w-full sm:w-auto">
            {copied ? 'Copied ✓' : 'Copy Token ID'}
          </button>
          <p className="mt-3 text-xs text-white/50">Compare the complete identifier before every swap.</p>
        </article>

        <aside className="card glow-card p-5 md:p-7">
          <p className="badge mb-4">Safety</p>
          <h2 className="section-title">Wallet stays in control</h2>
          <div className="mt-4 space-y-2 text-sm leading-relaxed text-white/70">
            <p>✓ Verify <span className="font-mono text-orange-200">{WOODY_TOKEN_ID}</span>.</p>
            <p>✓ Review token, amount, route and slippage before signing.</p>
            <p>✓ Never enter a seed phrase or private key on a trading link.</p>
            <p>✓ If a venue cannot find WOODY, stop instead of selecting a similar ticker.</p>
          </div>
        </aside>
      </section>

      <section className="card glow-card p-5 md:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Confirmed MultiversX access</p>
          <h2 className="mt-2 text-2xl font-black text-white">Choose a trading venue</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/55">
            These venues are included because WOODY Monitor tracks WOODY liquidity associated with them. Availability and routing can change, so always verify the token ID in the venue before signing.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          {venues.map((venue) => (
            <article key={venue.name} className="app-dashboard-card flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-white">{venue.name}</h3>
                <span className="status-badge status-active">{venue.status}</span>
              </div>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">{venue.detail}</p>
              <a href={venue.href} target="_blank" rel="noopener noreferrer" className="cta cta-blue mt-5 text-center">
                Open {venue.name}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-sky-400/15 bg-sky-400/5 p-4 text-xs leading-relaxed text-white/55">
        <span className="font-semibold text-sky-200">Aggregator note:</span> XOXNO&apos;s MultiversX aggregator API is still documented as routing across xExchange, OneDex and JEX, but no current public WOODY swap UI is linked here until the user-facing route is independently confirmed.
      </section>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';

const WOODY_TOKEN_ID = 'WOODY-5f9d9c';
const XEXCHANGE_APP_URL = 'https://xexchange.com';

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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-8 md:py-10">
      <section className="card cyber-grid relative overflow-hidden p-6 md:p-10">
        <div className="relative z-10 max-w-3xl">
          <p className="badge mb-4">Official Buy Hub</p>
          <h1 className="text-4xl font-black leading-tight text-white md:text-6xl">Buy WOODY</h1>
          <p className="mt-4 text-sm leading-relaxed text-white/72 md:text-lg">Use the official token ID below, connect your MultiversX wallet, and continue to the trading venue. Never send WOODY to an address supplied in a random message.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/app" className="cta cta-orange">Launch dApp</Link>
            <a href={XEXCHANGE_APP_URL} target="_blank" rel="noopener noreferrer" className="cta cta-blue">Open xExchange</a>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="card glow-card p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">Official token ID</p>
          <div className="mt-4 rounded-2xl border border-orange-300/25 bg-orange-400/10 p-5">
            <p className="break-all font-mono text-2xl font-black text-white md:text-3xl">{WOODY_TOKEN_ID}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={copyTokenId} className="cta cta-orange">{copied ? 'Copied ✓' : 'Copy Token ID'}</button>
            <a href={XEXCHANGE_APP_URL} target="_blank" rel="noopener noreferrer" className="cta cta-blue text-center">Open xExchange</a>
          </div>
          <p className="mt-4 text-xs text-white/50">Always compare the complete token identifier before swapping.</p>
        </article>

        <aside className="card glow-card p-6 md:p-8">
          <p className="badge mb-4">Safety</p>
          <h2 className="section-title">Verify before you swap</h2>
          <ul className="mt-5 space-y-3 text-sm leading-relaxed text-white/75">
            <li>✓ Verify the token ID exactly: <span className="font-mono text-orange-200">{WOODY_TOKEN_ID}</span></li>
            <li>✓ Use the official WOODY site links.</li>
            <li>✓ Keep your seed phrase and private key private.</li>
            <li>✓ Review the transaction in your wallet before signing.</li>
          </ul>
        </aside>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="card glow-card p-6 md:p-8">
          <h2 className="section-title">How to Buy WOODY</h2>
          <ol className="mt-6 space-y-4">
            {['Open xExchange', 'Connect xPortal or another MultiversX wallet', 'Search or paste WOODY-5f9d9c', 'Choose the asset and amount, then review the quote', 'Approve and sign the transaction in your wallet'].map((step, index) => (
              <li key={step} className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-300/50 bg-orange-400/15 font-bold text-orange-100">{index + 1}</span>
                <span className="pt-2 text-sm font-semibold text-white/80">{step}</span>
              </li>
            ))}
          </ol>
        </article>

        <article className="card glow-card p-6 md:p-8">
          <h2 className="section-title">dApp status</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="wallet-status-card"><p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Token ID</p><p className="mt-2 break-all font-mono text-sm font-black text-white">{WOODY_TOKEN_ID}</p></div>
            <div className="wallet-status-card"><p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Wallet</p><p className="mt-2 text-lg font-black text-emerald-200">Supported</p></div>
            <div className="wallet-status-card"><p className="text-[10px] uppercase tracking-[0.2em] text-white/50">On-chain balances</p><p className="mt-2 text-lg font-black text-emerald-200">Live</p></div>
            <div className="wallet-status-card"><p className="text-[10px] uppercase tracking-[0.2em] text-white/50">Signing</p><p className="mt-2 text-lg font-black text-white">Wallet-confirmed</p></div>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-white/60">The dApp does not custody funds. Wallets remain in control of signing.</p>
        </article>
      </section>
    </main>
  );
}

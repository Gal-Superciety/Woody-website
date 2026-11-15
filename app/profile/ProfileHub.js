'use client';

import Link from 'next/link';
import { useState } from 'react';
import WalletConnectPanel from '../app/WalletConnectPanel';
import ForestProfileRegistration from '../app/ForestProfileRegistration';

export default function ProfileHub() {
  const [wallet, setWallet] = useState('');
  return (
    <main className="min-h-[80vh] bg-[#080d14] px-4 py-10 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.25em] text-orange-300">WOODY ID / PLAYER CENTER</p>
            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">Your profile. Your games.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65">Use one connected MultiversX wallet to find your player name and access all WOODY experiences.</p>
          </div>
          <Link href="/arcade" className="rounded-xl border border-white/20 px-5 py-3 text-sm font-bold text-white/85 hover:bg-white/10">Explore Arcade ↗</Link>
        </div>
        <section className="dashboard-section wallet-section rounded-2xl border border-white/15 bg-slate-900/50 p-5 sm:p-8" aria-label="Wallet connection">
          <WalletConnectPanel onWalletChange={setWallet} />
        </section>
        {wallet ? (
          <ForestProfileRegistration key={wallet} wallet={wallet} gameTitle="WOODY Arcade" leaderboardHref="/arcade" leaderboardLabel="Explore games →" />
        ) : (
          <section className="mt-5 rounded-2xl border border-white/10 bg-slate-900/40 p-5 text-sm text-white/60">
            Connect xPortal to look up the profile linked to your wallet. No transaction is needed to view your balance or an existing player profile.
          </section>
        )}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link href="/forest-adventure" className="rounded-xl border border-emerald-400/25 bg-emerald-900/20 p-5 hover:bg-emerald-900/35"><strong className="block text-lg">🌲 Forest Adventure</strong><span className="mt-2 block text-sm text-white/65">Adventure and leaderboard →</span></Link>
          <Link href="/woody-casino" className="rounded-xl border border-orange-400/25 bg-orange-900/20 p-5 hover:bg-orange-900/35"><strong className="block text-lg">🎮 Mini Games</strong><span className="mt-2 block text-sm text-white/65">Free demo games →</span></Link>
        </div>
      </div>
    </main>
  );
}

'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

const TOKEN_ID = 'WOODY-5f9d9c';

const POOLS = [
  {
    key: 'onedex',
    label: 'OneDex',
    address: 'erd1qqqqqqqqqqqqqpgqqz6vp9y50ep867vnr296mqf3dduh6guvmvlsu3sujc',
    displaySymbol: 'EGLD',
  },
  {
    key: 'xexchange',
    label: 'xExchange',
    address: 'erd1qqqqqqqqqqqqqpgqvmgnk26tfvz6sj5yasw7p6yfvqpv628d2jpsnvmeaz',
    displaySymbol: 'EGLD',
  },
  {
    key: 'usdc',
    label: 'USDC pool',
    address: 'erd1qqqqqqqqqqqqqpgqjhy8hut0d9rzwqlz37e5nsmlj2rch6vd2jpss7a69j',
    displaySymbol: 'USDC',
  },
];

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

const infoCards = [
  {
    title: 'Token Info',
    content: (
      <dl className="grid grid-cols-2 gap-3 text-sm text-white/85">
        <dt className="text-white/50">Token Name</dt><dd className="font-semibold">WOODY Meme</dd>
        <dt className="text-white/50">Symbol</dt><dd className="font-semibold text-sky-300">$WOODY</dd>
        <dt className="text-white/50">Supply Model</dt><dd className="font-semibold">Transparent</dd>
        <dt className="text-white/50">Contract</dt><dd className="truncate font-semibold">{TOKEN_ID}</dd>
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

const liveDataDefaults = {
  price: 'Data unavailable',
  holders: 'Data unavailable',
  pools: POOLS.reduce((acc, pool) => ({ ...acc, [pool.key]: 'Data unavailable' }), {}),
  totalLiquidity: 'Data unavailable',
};

const formatAmount = (value, maxFractionDigits = 2) => value.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });

const getTokenUsdPrice = (token) => {
  const price = Number(token?.price ?? token?.priceUsd ?? token?.usdPrice);
  return Number.isFinite(price) && price > 0 ? price : null;
};

export default function Home() {
  const [liveData, setLiveData] = useState(liveDataDefaults);
  const [loadingLiveData, setLoadingLiveData] = useState(true);
  const [liveDataError, setLiveDataError] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadLiveData() {
      setLoadingLiveData(true);
      setLiveDataError(false);

      try {
        const [tokenRes, holdersRes, ...poolResponses] = await Promise.allSettled([
          fetch(`https://api.multiversx.com/tokens/${TOKEN_ID}`),
          fetch(`https://api.multiversx.com/tokens/${TOKEN_ID}/accounts/count`),
          ...POOLS.map((pool) => fetch(`https://api.multiversx.com/accounts/${pool.address}/tokens?size=200`)),
        ]);

        let nextPrice = liveDataDefaults.price;
        let nextHolders = liveDataDefaults.holders;
        const nextPools = { ...liveDataDefaults.pools };
        let nextTotalLiquidity = liveDataDefaults.totalLiquidity;
        let hasError = false;
        let totalUsd = 0;
        let hasUsdEstimate = false;

        if (tokenRes.status === 'fulfilled' && tokenRes.value.ok) {
          const tokenData = await tokenRes.value.json();
          const numericPrice = Number(tokenData.priceUsd ?? tokenData.usdPrice ?? tokenData.price);
          if (Number.isFinite(numericPrice) && numericPrice > 0) {
            nextPrice = `$${numericPrice.toLocaleString(undefined, { maximumFractionDigits: 8 })}`;
          }
        } else {
          hasError = true;
        }

        if (holdersRes.status === 'fulfilled' && holdersRes.value.ok) {
          const holdersValue = await holdersRes.value.json();
          const count = typeof holdersValue === 'number' ? holdersValue : Number(holdersValue?.count);
          if (Number.isFinite(count)) {
            nextHolders = count.toLocaleString();
          }
        } else {
          hasError = true;
        }

        for (let i = 0; i < POOLS.length; i += 1) {
          const pool = POOLS[i];
          const poolResponse = poolResponses[i];
          if (!(poolResponse?.status === 'fulfilled' && poolResponse.value.ok)) {
            hasError = true;
            continue;
          }

          const tokens = await poolResponse.value.json();
          const woodyToken = tokens.find((token) => token.identifier === TOKEN_ID);
          const pairedToken = tokens.find((token) => token.identifier !== TOKEN_ID && (pool.displaySymbol === 'USDC' ? token.ticker?.toUpperCase().includes('USDC') : token.ticker?.toUpperCase().includes('EGLD') || token.identifier?.toUpperCase().includes('EGLD')));

          if (!woodyToken || !pairedToken) {
            hasError = true;
            continue;
          }

          const pairBalance = Number(pairedToken.balance) / 10 ** Number(pairedToken.decimals ?? 18);
          if (!Number.isFinite(pairBalance)) {
            hasError = true;
            continue;
          }

          nextPools[pool.key] = `${formatAmount(pairBalance, 4)} ${pool.displaySymbol}`;

          const woodyBalance = Number(woodyToken.balance) / 10 ** Number(woodyToken.decimals ?? 18);
          const woodyUsdPrice = getTokenUsdPrice(woodyToken);
          const pairUsdPrice = getTokenUsdPrice(pairedToken);

          if (Number.isFinite(woodyBalance) && woodyUsdPrice && pairUsdPrice) {
            totalUsd += (woodyBalance * woodyUsdPrice) + (pairBalance * pairUsdPrice);
            hasUsdEstimate = true;
          }
        }

        if (hasUsdEstimate && totalUsd > 0) {
          nextTotalLiquidity = `~$${formatAmount(totalUsd, 2)}`;
        }

        if (mounted) {
          setLiveData({
            price: nextPrice,
            holders: nextHolders,
            pools: nextPools,
            totalLiquidity: nextTotalLiquidity,
          });
          setLiveDataError(hasError);
        }
      } catch {
        if (mounted) {
          setLiveData(liveDataDefaults);
          setLiveDataError(true);
        }
      } finally {
        if (mounted) {
          setLoadingLiveData(false);
        }
      }
    }

    loadLiveData();

    return () => {
      mounted = false;
    };
  }, []);

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

      <section className="card p-6 md:p-7">
        <div className="flex items-center justify-between gap-3">
          <h3 className="section-title">Live Data</h3>
          <a href="https://e-compass.io/token/WOODY-5f9d9c" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold uppercase tracking-wider text-sky-300 hover:text-sky-200">View on e-Compass</a>
        </div>
        <p className="mt-2 text-sm text-white/65">Real-time market snapshot for {TOKEN_ID}.</p>
        {liveDataError && !loadingLiveData ? <p className="mt-3 text-sm text-orange-300">Some endpoints failed. Data unavailable where needed.</p> : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            { title: 'Price', value: liveData.price, note: 'USD, sourced from public token API' },
            { title: 'Holders', value: liveData.holders, note: 'Unique wallets' },
            { title: 'OneDex', value: liveData.pools.onedex, note: 'WOODY/EGLD paired balance' },
            { title: 'xExchange', value: liveData.pools.xexchange, note: 'WOODY/EGLD paired balance' },
            { title: 'USDC pool', value: liveData.pools.usdc, note: 'WOODY/USDC paired balance' },
            { title: 'Total liquidity', value: liveData.totalLiquidity, note: 'Estimated USD when both token prices are available' },
          ].map((card) => (
            <article key={card.title} className="rounded-xl border border-white/10 bg-[#0b1324]/80 p-4">
              <p className="text-xs uppercase tracking-widest text-white/50">{card.title}</p>
              <p className="mt-2 text-2xl font-bold text-white">{loadingLiveData ? 'Loading...' : card.value}</p>
              <p className="mt-2 text-xs text-white/60">{card.note}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="card mt-2 p-6 md:p-7">
        <h3 className="section-title">Community</h3>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <a href="https://t.me/wooodymeme" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-sky-400/50 bg-sky-400/10 px-4 py-2 font-semibold text-sky-200 transition hover:bg-sky-400/20">Telegram</a>
          <a href="https://x.com/WOODY_EX" target="_blank" rel="noopener noreferrer" className="rounded-lg border border-emerald-400/50 bg-emerald-400/10 px-4 py-2 font-semibold text-emerald-200 transition hover:bg-emerald-400/20">X / Twitter</a>
        </div>
        <p className="mt-5 text-sm text-white/80">Contract: <span className="font-semibold text-orange-300">WOODY-5f9d9c</span></p>
        <p className="mt-2 text-xs text-white/60">WOODY is a community meme project. Nothing on this site is financial advice.</p>
      </footer>
    </main>
  );
}

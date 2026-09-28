'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Leaderboard() {
  const [period,setPeriod] = useState('weekly');
  const [data,setData] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    fetch('/api/forest/leaderboard?period='+period,{signal:controller.signal})
      .then(r=>r.json()).then(setData).catch(e=>{if(e.name!=='AbortError')setData({status:'unavailable',rows:[]});});
    return ()=>controller.abort();
  },[period]);
  const rows = data?.rows || [];
  return <section id="leaderboard" className="mt-6 rounded-2xl border border-emerald-500/30 bg-slate-900 p-5 text-white">
    <div className="mb-4 rounded-xl border border-emerald-400/30 bg-emerald-950/40 p-4"><h3 className="text-lg font-bold text-emerald-200">PLAYER PROFILE</h3><p className="mt-1 text-sm text-slate-200">Choose a unique game name linked to your MultiversX wallet. Verified scores will appear here once secure score submission is enabled.</p><Link href="/app#player-profile" className="mt-3 inline-block rounded-lg bg-emerald-400 px-4 py-3 font-bold text-slate-950">CREATE YOUR GAME NAME ↗</Link></div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-2xl font-black text-emerald-300">FOREST LEADERBOARD</h2><p className="text-sm text-slate-300">Only verified game scores count. No ads, entry fees or automatic prizes.</p></div>
      <div className="flex gap-2">
        {['weekly','all'].map(value=><button key={value} type="button" onClick={()=>setPeriod(value)}
          className={'rounded-lg px-3 py-2 text-sm font-bold '+(period===value?'bg-emerald-500 text-slate-950':'bg-slate-700 text-white')}>
          {value==='weekly'?'This week':'All time'}</button>)}
      </div>
    </div>
    {data?.season && period==='weekly' && <p className="mt-3 text-xs text-slate-400">Season: {new Date(data.season.starts_at).toLocaleDateString()} – {new Date(data.season.ends_at).toLocaleDateString()} · {data.season.status}</p>}
    {!data && <p className="mt-5 text-slate-300">Loading leaderboard…</p>}
    {data?.status==='setup' && <p className="mt-5 rounded-lg bg-amber-950/60 p-3 text-amber-200">Competition database setup is in progress. Scores are not being collected yet.</p>}
    {data?.status==='no-season' && <p className="mt-5 text-slate-300">The first weekly season has not started.</p>}
    {data?.status==='unavailable' && <p className="mt-5 text-amber-200">Leaderboard temporarily unavailable.</p>}
    {data?.status==='ok' && !rows.length && <p className="mt-5 text-slate-300">No verified scores yet.</p>}
    {rows.length>0 && <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b border-white/20 text-slate-400"><th className="py-2">Rank</th><th>Player</th><th>Games</th><th className="text-right">Total points</th></tr></thead>
      <tbody>{rows.map((row,i)=><tr key={row.username} className="border-b border-white/10"><td className="py-3">{i+1}</td><td className="font-semibold">{row.username}</td><td>{row.games}</td><td className="text-right font-bold text-emerald-300">{Number(row.points).toLocaleString()}</td></tr>)}</tbody></table></div>}
    <p className="mt-4 text-xs text-slate-400">Only server-verified scores count. Game-name registration uses a wallet signature; score submission and season automation are still being completed. <Link href="/app#player-profile" className="underline text-emerald-300">Create your player profile</Link>.</p>
  </section>;
}

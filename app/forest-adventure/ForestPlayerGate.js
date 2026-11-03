'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ForestProfileRegistration from '../app/ForestProfileRegistration';
import { forestRequest } from '../lib/forestRequest.mjs';

const SESSION_KEY = 'woody:multiversx-wallet-session';

export default function ForestPlayerGate({ onReady }) {
  const [session, setSession] = useState(null);
  const [state, setState] = useState('checking-session');
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let active = true;
    let saved;
    try {
      saved = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || 'null');
    } catch { /* A damaged browser session can be re-created by reconnecting. */ }

    if (!saved?.address) {
      setState('connect');
      return () => { active = false; };
    }

    setSession(saved);
    setState('loading');
    forestRequest(`/api/forest/profile?wallet=${encodeURIComponent(saved.address)}`, { cache: 'no-store' })
      .then(result => {
        if (!active) return;
        setProfile(result.profile);
        setState('registered');
      })
      .catch(error => {
        if (!active) return;
        if (error.message === 'profile_not_found') {
          setState(saved.authToken ? 'create' : 'reconnect');
          return;
        }
        setState('unavailable');
      });

    return () => { active = false; };
  }, []);

  const enterForest = () => onReady(profile);

  return (
    <main className="mx-auto min-h-[75vh] max-w-4xl px-4 py-8 text-white md:py-14">
      <section className="rounded-3xl border border-emerald-300/25 bg-gradient-to-br from-emerald-950/95 via-slate-950 to-sky-950/90 p-5 shadow-[0_0_60px_rgba(16,185,129,.12)] md:p-9">
        <p className="text-xs font-bold uppercase tracking-[.3em] text-emerald-300">WOODY ARCADE · PLAYER CHECK-IN</p>
        <h1 className="mt-3 text-3xl font-black text-orange-300 md:text-5xl">Before you enter the forest</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/75 md:text-base">Create a player profile linked to your MultiversX wallet. Once it is ready, the game will unlock.</p>

        {state === 'checking-session' || state === 'loading' ? (
          <p role="status" className="mt-6 rounded-xl bg-slate-900/80 p-4 text-sm text-white/70">{state === 'loading' ? 'Checking your player profile…' : 'Checking your wallet connection…'}</p>
        ) : null}

        {state === 'connect' ? (
          <div className="mt-6 rounded-2xl border border-sky-300/20 bg-slate-950/70 p-5">
            <h2 className="text-xl font-bold text-sky-200">Connect your wallet to get started</h2>
            <p className="mt-2 text-sm text-white/65">Connecting verifies that the profile belongs to you. Creating the game name itself does not send a blockchain transaction.</p>
            <Link href="/app?returnTo=%2Fforest-adventure" className="mt-4 inline-flex rounded-xl bg-orange-500 px-5 py-3 font-black text-white hover:bg-orange-400">Connect wallet ↗</Link>
          </div>
        ) : null}

        {state === 'reconnect' ? (
          <div className="mt-6 rounded-xl border border-amber-300/20 bg-amber-950/40 p-4">
            <p className="text-sm text-amber-100">Reconnect your wallet to verify ownership before creating a profile.</p>
            <Link href="/app?returnTo=%2Fforest-adventure" className="mt-3 inline-flex rounded-lg bg-orange-500 px-4 py-2 font-bold text-white">Reconnect wallet ↗</Link>
          </div>
        ) : null}

        {state === 'create' && session ? (
          <ForestProfileRegistration wallet={session.address} authToken={session.authToken} onProfileCreated={(nextProfile) => {
            setProfile(nextProfile);
            setState('registered');
          }} />
        ) : null}

        {state === 'registered' && profile ? (
          <div className="mt-6 rounded-2xl border border-emerald-300/30 bg-emerald-950/50 p-5">
            <p className="text-sm text-emerald-100/70">PLAYER PROFILE READY</p>
            <p className="mt-1 text-2xl font-black text-emerald-200">{profile.username}</p>
            <button type="button" onClick={enterForest} className="mt-4 rounded-xl bg-emerald-400 px-6 py-3 font-black text-slate-950 hover:bg-emerald-300">Enter the forest →</button>
          </div>
        ) : null}

        {state === 'unavailable' ? (
          <div role="alert" className="mt-6 rounded-xl border border-amber-300/20 bg-amber-950/40 p-4 text-sm text-amber-100">Player profiles are temporarily unavailable. Please refresh and try again shortly.</div>
        ) : null}
      </section>
    </main>
  );
}

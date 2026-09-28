'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
const XPORTAL_APP_LINK = 'https://xportal.app.link/x';

function isMobileDevice() {
  return typeof navigator !== 'undefined' && (
    navigator.userAgentData?.mobile || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  );
}

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'profile_service_unavailable');
  return body;
}

function errorText(code) {
  if (code === 'username_taken') return 'That game name is already taken. Try another one.';
  if (code === 'profile_already_exists') return 'This wallet already has a game profile.';
  if (code === 'invalid_wallet_signature') return 'The wallet signature could not be verified. Please try again.';
  if (code === 'challenge_expired_or_used') return 'The sign request expired. Please submit again.';
  return 'Player profiles are not available right now. Please try again later.';
}

export default function ForestProfileRegistration({ wallet, providerRef, providerType }) {
  const [username, setUsername] = useState('');
  const [profile, setProfile] = useState(null);
  const [serviceState, setServiceState] = useState('loading');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setServiceState('loading');
    setProfile(null);
    setError('');
    fetch(`/api/forest/profile?wallet=${encodeURIComponent(wallet)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 404) return { profile: null };
        return readJson(response);
      })
      .then((result) => {
        setProfile(result.profile);
        setServiceState(result.profile ? 'registered' : 'ready');
      })
      .catch((cause) => {
        if (cause.name !== 'AbortError') setServiceState('unavailable');
      });
    return () => controller.abort();
  }, [wallet]);

  const register = async (event) => {
    event.preventDefault();
    const cleanName = username.trim();
    if (!NAME_PATTERN.test(cleanName)) {
      setError('Choose a game name with 3–20 letters, numbers or underscores.');
      return;
    }
    const provider = providerRef.current;
    if (!provider?.signMessage) {
      setError('This wallet connection cannot sign a login message. Reconnect with xPortal or another supported MultiversX wallet.');
      return;
    }

    // Open xPortal directly from the trusted tap. Navigating an about:blank
    // tab after awaiting the challenge loses Android's app-link handoff and
    // shows the xPortal landing page before the app opens.
    const shouldOpenXPortal = isMobileDevice() && /xportal/i.test(providerType || '');
    if (shouldOpenXPortal) window.open(XPORTAL_APP_LINK, '_blank');

    setIsSaving(true);
    setError('');
    try {
      const challengeResult = await readJson(await fetch('/api/forest/profile/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, username: cleanName }),
      }));
      const { Message } = await import('@multiversx/sdk-core/out/core/message');
      const message = new Message({ data: new TextEncoder().encode(challengeResult.challenge) });
      const signedMessage = await provider.signMessage(message);
      if (!signedMessage?.signature) throw new Error('invalid_wallet_signature');
      const signature = Array.from(signedMessage.signature, (byte) => byte.toString(16).padStart(2, '0')).join('');
      const result = await readJson(await fetch('/api/forest/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet, username: cleanName, challengeId: challengeResult.challengeId, signature }),
      }));
      setProfile(result.profile);
      setServiceState('registered');
    } catch (cause) {
      setError(errorText(cause.message));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section id="player-profile" className="relative z-10 mt-5 rounded-2xl border border-emerald-400/30 bg-slate-950/70 p-5 text-white">
      <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">Forest Adventure · Player profile</p>
      <h3 className="mt-2 text-xl font-black">Choose your game name</h3>
      <p className="mt-1 text-sm text-white/65">Your name will appear on the leaderboard and be linked to this wallet. You will approve a message signature; no transaction is sent.</p>

      {serviceState === 'loading' && <p className="mt-4 text-sm text-white/60">Checking your player profile…</p>}
      {serviceState === 'unavailable' && <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-950/40 p-3 text-sm text-amber-100">The profile database is not available yet. Game names can be registered after the competition database is configured.</p>}
      {serviceState === 'registered' && profile && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-emerald-950/60 p-4">
          <p><span className="block text-xs text-white/55">Your game name</span><strong className="text-lg text-emerald-200">{profile.username}</strong></p>
          <Link href="/forest-adventure#leaderboard" className="rounded-lg bg-emerald-400 px-4 py-2 font-bold text-slate-950">View leaderboard ↗</Link>
        </div>
      )}
      {serviceState === 'ready' && (
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={register}>
          <label className="flex-1">
            <span className="sr-only">Game name</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              minLength={3}
              maxLength={20}
              autoComplete="nickname"
              pattern="[A-Za-z0-9_]{3,20}"
              placeholder="YourGameName"
              className="w-full rounded-lg border border-white/15 bg-slate-900 px-4 py-3 text-white placeholder:text-white/35 focus:border-emerald-300 focus:outline-none"
              aria-describedby="forest-name-help"
              required
            />
            <span id="forest-name-help" className="mt-1 block text-xs text-white/50">3–20 characters · letters, numbers and underscore · unique across players</span>
          </label>
          <button type="submit" disabled={isSaving} className="rounded-lg bg-emerald-400 px-5 py-3 font-bold text-slate-950 disabled:cursor-wait disabled:opacity-60">
            {isSaving ? (isMobileDevice() && /xportal/i.test(providerType || '') ? 'Opening xPortal…' : 'Approve in wallet…') : 'Create player profile'}
          </button>
        </form>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-orange-200">{error}</p>}
      {isSaving && isMobileDevice() && /xportal/i.test(providerType || '') && (
        <p className="mt-3 text-xs text-white/60">
          If xPortal did not open, <a className="underline text-emerald-200" href={XPORTAL_APP_LINK} target="_blank" rel="noreferrer">open xPortal</a> and approve the profile message. This is not a blockchain transaction and costs no network fee.
        </p>
      )}
    </section>
  );
}

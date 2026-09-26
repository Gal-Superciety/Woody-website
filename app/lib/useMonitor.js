'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isFresh } from './monitor';

export function useMonitor() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [refreshing, setRefreshing] = useState(false);
  const mounted = useRef(false);
  const active = useRef(null);
  const load = useCallback(async () => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setRefreshing(true);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch('/api/woody-status', { cache: 'no-store', signal: controller.signal });
      const next = await response.json();
      if (!response.ok || !isFresh(next)) throw new Error(next.reason || 'unavailable');
      if (mounted.current && active.current === controller) { setData(next); setStatus('live'); }
    } catch {
      if (mounted.current && active.current === controller) { setData(null); setStatus('unavailable'); }
    } finally {
      clearTimeout(timeout);
      if (active.current === controller) {
        active.current = null;
        if (mounted.current) setRefreshing(false);
      }
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    load();
    const resume = () => { if (document.visibilityState === 'visible') load(); };
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    document.addEventListener('visibilitychange', resume);
    return () => { mounted.current = false; clearInterval(timer); document.removeEventListener('visibilitychange', resume); active.current?.abort(); active.current = null; };
  }, [load]);
  const fresh = data && isFresh(data);
  const visibleStatus = status === 'live' && !fresh ? 'unavailable' : status;
  return { data: fresh ? data : null, status: visibleStatus, live: visibleStatus === 'live', refreshing, refresh: load };
}

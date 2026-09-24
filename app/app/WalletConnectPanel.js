'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'woody:multiversx-wallet-session';
const WEB_WALLET_URL = 'https://wallet.multiversx.com';
const WALLETCONNECT_RELAY_URL = 'wss://relay.walletconnect.com';
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const CHAIN_ID = process.env.NEXT_PUBLIC_MULTIVERSX_CHAIN_ID || '1';
const API_URL = process.env.NEXT_PUBLIC_MULTIVERSX_API_URL || 'https://api.multiversx.com';
const WOODY_TOKEN_ID = 'WOODY-5f9d9c';
const EXPLORER_URL = process.env.NEXT_PUBLIC_MULTIVERSX_EXPLORER_URL || 'https://explorer.multiversx.com';
const FRIENDLY_FAILURE = 'Wallet connection failed or cancelled. Please try again.';
const isBrowser = () => typeof window !== 'undefined';
const runtimeImport = (specifier) => new Function('specifier', 'return import(specifier)')(specifier);

function shortenAddress(address) {
  if (!address) return 'Not connected';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function isValidAddress(address) {
  return typeof address === 'string' && /^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/i.test(address);
}

function safeSessionStorage() {
  if (!isBrowser()) return null;
  try {
    const storage = window.sessionStorage;
    const testKey = 'woody:storage-test';
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

function getProviderAddress(provider, loginAddress) {
  return loginAddress || provider?.account?.address || provider?.address || '';
}

function formatEgld(raw) {
  const value = Number(raw || 0) / 1e18;
  return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function formatToken(raw, decimals = 18) {
  const value = Number(raw || 0) / 10 ** Number(decimals || 18);
  return value.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

async function readWalletData(address) {
  const [balanceResponse, tokenResponse] = await Promise.all([
    fetch(`${API_URL}/address/${address}/balance`, { cache: 'no-store' }),
    fetch(`${API_URL}/accounts/${address}/tokens?identifier=${encodeURIComponent(WOODY_TOKEN_ID)}`, { cache: 'no-store' }),
  ]);

  if (!balanceResponse.ok) throw new Error('Could not read EGLD balance.');
  if (!tokenResponse.ok) throw new Error('Could not read WOODY balance.');

  const egldRaw = await balanceResponse.json();
  const tokens = await tokenResponse.json();
  const woody = Array.isArray(tokens) ? tokens.find((item) => item.identifier === WOODY_TOKEN_ID) || tokens[0] : null;

  return {
    egld: formatEgld(egldRaw),
    woody: woody ? formatToken(woody.balance, woody.numDecimals ?? woody.decimals ?? 18) : '0',
    woodyRaw: woody?.balance || '0',
    woodyDecimals: woody?.numDecimals ?? woody?.decimals ?? 18,
  };
}

export default function WalletConnectPanel() {
  const router = useRouter();
  const providerRef = useRef(null);
  const balanceRequestRef = useRef(0);
  const [address, setAddress] = useState('');
  const [providerType, setProviderType] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeProvider, setActiveProvider] = useState('');
  const [error, setError] = useState('');
  const [xPortalUri, setXPortalUri] = useState('');
  const [walletData, setWalletData] = useState({ egld: '—', woody: '—', woodyRaw: '0', woodyDecimals: 18 });
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [copied, setCopied] = useState(false);

  const refreshBalances = useCallback(async (walletAddress) => {
    if (!isValidAddress(walletAddress)) return;
    const requestId = ++balanceRequestRef.current;
    setIsLoadingBalances(true);
    try {
      const data = await readWalletData(walletAddress);
      if (requestId !== balanceRequestRef.current) return;
      setWalletData(data);
      setError('');
    } catch (balanceError) {
      console.error('WOODY wallet data read failed', balanceError);
      if (requestId === balanceRequestRef.current) setError('Connected, but live balances could not be loaded. Try Refresh.');
    } finally {
      if (requestId === balanceRequestRef.current) setIsLoadingBalances(false);
    }
  }, []);

  const walletStatusItems = useMemo(() => [
    { label: 'Wallet', value: address ? 'Connected' : 'Not connected', detail: address ? shortenAddress(address) : '', tone: address ? 'success' : 'default' },
    { label: 'EGLD Balance', value: address ? walletData.egld : '—' },
    { label: 'WOODY Balance', value: address ? walletData.woody : '—' },
    { label: 'Network', value: CHAIN_ID === '1' ? 'Mainnet' : CHAIN_ID },
  ], [address, walletData.egld, walletData.woody]);

  useEffect(() => {
    const storage = safeSessionStorage();
    if (!storage) return;
    try {
      const storedSession = storage.getItem(STORAGE_KEY);
      if (!storedSession) return;
      const parsedSession = JSON.parse(storedSession);
      if (!isValidAddress(parsedSession?.address)) {
        storage.removeItem(STORAGE_KEY);
        return;
      }
      setAddress(parsedSession.address);
      setProviderType(parsedSession.providerType || 'Saved session');
      refreshBalances(parsedSession.address);
    } catch {
      storage.removeItem(STORAGE_KEY);
    }
  }, [refreshBalances]);

  const clearSession = () => {
    balanceRequestRef.current += 1;
    safeSessionStorage()?.removeItem(STORAGE_KEY);
  };

  const failConnection = (message = FRIENDLY_FAILURE) => {
    providerRef.current = null;
    setAddress('');
    setProviderType('');
    setXPortalUri('');
    setWalletData({ egld: '—', woody: '—', woodyRaw: '0', woodyDecimals: 18 });
    setError(message);
    clearSession();
    router.replace('/app');
  };

  const saveSession = (nextAddress, nextProviderType, nextProvider) => {
    if (!isValidAddress(nextAddress)) {
      failConnection(FRIENDLY_FAILURE);
      return;
    }
    providerRef.current = nextProvider || null;
    setAddress(nextAddress);
    setProviderType(nextProviderType);
    setError('');
    setXPortalUri('');
    safeSessionStorage()?.setItem(STORAGE_KEY, JSON.stringify({ address: nextAddress, providerType: nextProviderType }));
    refreshBalances(nextAddress);
    router.replace('/app');
  };

  const startConnection = (label) => {
    setIsConnecting(true);
    setActiveProvider(label);
    setError('');
    setXPortalUri('');
    clearSession();
  };

  const finishConnection = () => {
    setIsConnecting(false);
    setActiveProvider('');
  };

  const connectExtension = async () => {
    startConnection('extension');
    try {
      const { ExtensionProvider } = await runtimeImport('@multiversx/sdk-extension-provider');
      const extensionProvider = ExtensionProvider?.getInstance?.();
      if (!extensionProvider?.init || !extensionProvider?.login) throw new Error('MultiversX DeFi Wallet provider is unavailable.');
      const initialized = await extensionProvider.init();
      if (!initialized) throw new Error('MultiversX DeFi Wallet browser extension was not detected.');
      const loginAddress = await extensionProvider.login();
      saveSession(getProviderAddress(extensionProvider, loginAddress), 'MultiversX DeFi Wallet / Browser Extension', extensionProvider);
    } catch (connectionError) {
      console.error('WOODY extension wallet connection failed', connectionError);
      failConnection(FRIENDLY_FAILURE);
    } finally {
      finishConnection();
    }
  };

  const connectWebWallet = async () => {
    startConnection('web');
    try {
      const { CrossWindowProvider } = await runtimeImport('@multiversx/sdk-web-wallet-cross-window-provider');
      const webWalletProvider = CrossWindowProvider?.getInstance?.();
      if (!webWalletProvider?.init || !webWalletProvider?.login) throw new Error('MultiversX Web Wallet provider is unavailable.');
      await webWalletProvider.init();
      webWalletProvider.setWalletUrl?.(WEB_WALLET_URL);
      const loginAddress = await webWalletProvider.login();
      saveSession(getProviderAddress(webWalletProvider, loginAddress), 'MultiversX Web Wallet', webWalletProvider);
    } catch (connectionError) {
      console.error('WOODY web wallet connection failed', connectionError);
      failConnection(FRIENDLY_FAILURE);
    } finally {
      finishConnection();
    }
  };

  const connectXPortal = async () => {
    startConnection('xportal');
    try {
      if (!WALLETCONNECT_PROJECT_ID) throw new Error('WalletConnect Project ID is not configured.');
      const walletConnectModule = await runtimeImport('@multiversx/sdk-wallet-connect-provider');
      const WalletConnectProvider = walletConnectModule.WalletConnectV2Provider || walletConnectModule.WalletConnectProvider;
      if (!WalletConnectProvider) throw new Error('xPortal WalletConnect provider is unavailable.');

      let walletConnectProvider;
      const callbacks = {
        onClientLogin: async () => {
          const connectedAddress = await walletConnectProvider?.getAddress?.();
          if (isValidAddress(connectedAddress)) saveSession(connectedAddress, 'xPortal', walletConnectProvider);
        },
        onClientLogout: () => clearSession(),
        onClientEvent: () => {},
      };

      walletConnectProvider = new WalletConnectProvider(callbacks, CHAIN_ID, WALLETCONNECT_RELAY_URL, WALLETCONNECT_PROJECT_ID);
      await walletConnectProvider.init?.();
      const { uri, approval } = await walletConnectProvider.connect();
      if (uri) setXPortalUri(uri);
      await walletConnectProvider.login({ approval });
      saveSession(await walletConnectProvider.getAddress?.(), 'xPortal', walletConnectProvider);
    } catch (connectionError) {
      console.error('WOODY xPortal wallet connection failed', connectionError);
      failConnection(FRIENDLY_FAILURE);
    } finally {
      finishConnection();
    }
  };

  const handleDisconnect = async () => {
    setError('');
    try {
      if (providerRef.current?.logout) await providerRef.current.logout();
    } catch (disconnectError) {
      console.error('WOODY wallet disconnect failed', disconnectError);
    } finally {
      providerRef.current = null;
      setAddress('');
      setProviderType('');
      setWalletData({ egld: '—', woody: '—', woodyRaw: '0', woodyDecimals: 18 });
      clearSession();
      router.replace('/app');
    }
  };

  const copyAddress = async () => {
    if (!address || !navigator?.clipboard) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const disabled = isConnecting || Boolean(address);

  return (
    <>
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="badge mb-4">MultiversX Wallet</p>
          <h1 className="text-3xl font-black leading-tight text-white md:text-5xl">Your WOODY Wallet</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-lg">Connect securely to view your EGLD and WOODY balances. Your wallet keeps control of every signature.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          {address ? (
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button type="button" onClick={() => refreshBalances(address)} className="cta cta-blue">{isLoadingBalances ? 'Refreshing...' : 'Refresh Balances'}</button>
              <button type="button" onClick={handleDisconnect} className="cta cta-blue">Disconnect</button>
            </div>
          ) : (
            <div className="grid w-full gap-2 sm:w-80">
              <button type="button" onClick={connectXPortal} disabled={disabled} className="cta cta-orange w-full disabled:cursor-not-allowed disabled:opacity-70">{isConnecting && activeProvider === 'xportal' ? 'Connecting xPortal...' : 'Connect xPortal'}</button>
              <button type="button" onClick={connectExtension} disabled={disabled} className="cta cta-blue w-full disabled:cursor-not-allowed disabled:opacity-70">{isConnecting && activeProvider === 'extension' ? 'Connecting Extension...' : 'Connect MultiversX DeFi Wallet'}</button>
              <button type="button" onClick={connectWebWallet} disabled={disabled} className="cta cta-orange w-full disabled:cursor-not-allowed disabled:opacity-70">{isConnecting && activeProvider === 'web' ? 'Connecting Web Wallet...' : 'Connect Web Wallet'}</button>
            </div>
          )}
          <p className={address ? 'text-xs text-emerald-200' : 'text-xs text-white/50'}>{address ? `Connected via ${providerType || 'wallet'}` : 'Wallet: Not connected'}</p>
          {address ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/70">
              <span>{shortenAddress(address)}</span>
              <button type="button" onClick={copyAddress} className="underline decoration-white/30 underline-offset-2 hover:text-white">{copied ? 'Copied' : 'Copy address'}</button>
              <a href={`${EXPLORER_URL}/accounts/${address}`} target="_blank" rel="noopener noreferrer" className="underline decoration-white/30 underline-offset-2 hover:text-white">Explorer</a>
            </div>
          ) : null}
          {xPortalUri ? <a className="max-w-xs break-words text-xs text-sky-200 underline" href={xPortalUri}>Open xPortal on this device</a> : null}
          {error ? <p className="max-w-xs text-xs leading-relaxed text-orange-200">{error}</p> : null}
        </div>
      </div>

      <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {walletStatusItems.map((item) => (
          <article key={item.label} className="wallet-status-card">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{item.label}</p>
            <p className={item.tone === 'success' ? 'mt-2 text-lg font-black text-emerald-200' : 'mt-2 text-lg font-black text-white'}>{item.value}</p>
            {item.detail ? <p className="mt-1 text-xs text-white/60">{item.detail}</p> : null}
          </article>
        ))}
      </div>

      {address ? (
        <div className="relative z-10 mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-xs leading-relaxed text-white/65">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p><span className="font-semibold text-emerald-200">On-chain wallet connected.</span> Balances are read directly from the MultiversX API. WOODY never asks for your seed phrase or private key.</p><Link href="/buy" className="cta cta-orange shrink-0 text-center">Buy WOODY</Link></div>
        </div>
      ) : null}
    </>
  );
}

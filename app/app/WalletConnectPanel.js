'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const STORAGE_KEY = 'woody:multiversx-wallet-session';
const WEB_WALLET_URL = 'https://wallet.multiversx.com';
const WALLETCONNECT_RELAY_URL = 'wss://relay.walletconnect.com';
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';
const CHAIN_ID = process.env.NEXT_PUBLIC_MULTIVERSX_CHAIN_ID || '1';
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

export default function WalletConnectPanel() {
  const router = useRouter();
  const providerRef = useRef(null);
  const [address, setAddress] = useState('');
  const [providerType, setProviderType] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeProvider, setActiveProvider] = useState('');
  const [error, setError] = useState('');
  const [xPortalUri, setXPortalUri] = useState('');

  const walletStatusItems = useMemo(() => [
    { label: 'Wallet', value: address ? 'Connected' : 'Not connected', detail: address ? shortenAddress(address) : '', tone: address ? 'success' : 'default' },
    { label: 'WOODY Balance', value: '—' },
    { label: 'Holder Tier', value: '—' },
    { label: 'Premium Access', value: 'Locked', tone: 'locked' },
  ], [address]);

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
    } catch {
      storage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearSession = () => {
    safeSessionStorage()?.removeItem(STORAGE_KEY);
  };

  const failConnection = (message = FRIENDLY_FAILURE) => {
    providerRef.current = null;
    setAddress('');
    setProviderType('');
    setXPortalUri('');
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
      const resolvedAddress = getProviderAddress(extensionProvider, loginAddress);
      saveSession(resolvedAddress, 'MultiversX DeFi Wallet / Browser Extension', extensionProvider);
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
      const resolvedAddress = getProviderAddress(webWalletProvider, loginAddress);
      saveSession(resolvedAddress, 'MultiversX Web Wallet', webWalletProvider);
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
      if (!WALLETCONNECT_PROJECT_ID) {
        throw new Error('WalletConnect Project ID is not configured.');
      }

      const walletConnectModule = await runtimeImport('@multiversx/sdk-wallet-connect-provider');
      const WalletConnectProvider = walletConnectModule.WalletConnectV2Provider || walletConnectModule.WalletConnectProvider;
      if (!WalletConnectProvider) throw new Error('xPortal WalletConnect provider is unavailable.');

      let walletConnectProvider;
      const callbacks = {
        onClientLogin: async () => {
          const connectedAddress = await walletConnectProvider?.getAddress?.();
          if (isValidAddress(connectedAddress)) {
            saveSession(connectedAddress, 'xPortal', walletConnectProvider);
          }
        },
        onClientLogout: () => clearSession(),
        onClientEvent: () => {},
      };

      walletConnectProvider = new WalletConnectProvider(callbacks, CHAIN_ID, WALLETCONNECT_RELAY_URL, WALLETCONNECT_PROJECT_ID);

      await walletConnectProvider.init?.();
      const { uri, approval } = await walletConnectProvider.connect();
      if (uri) setXPortalUri(uri);
      await walletConnectProvider.login({ approval });
      const resolvedAddress = await walletConnectProvider.getAddress?.();
      saveSession(resolvedAddress, 'xPortal', walletConnectProvider);
    } catch (connectionError) {
      console.error('WOODY xPortal wallet connection failed', connectionError);
      const missingPackage = String(connectionError?.message || '').includes('sdk-wallet-connect-provider');
      failConnection(missingPackage ? 'xPortal connection is not available in this build. Please try the browser extension or Web Wallet.' : FRIENDLY_FAILURE);
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
      clearSession();
      router.replace('/app');
    }
  };

  const disabled = isConnecting || Boolean(address);

  return (
    <>
      <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="badge mb-4">Dashboard Foundation</p>
          <h1 className="text-3xl font-black leading-tight text-white md:text-5xl">WOODY App</h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-lg">The utility hub for the WOODY ecosystem — a clean foundation for wallet status, premium access, and future holder tools.</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
          {address ? (
            <button type="button" onClick={handleDisconnect} className="cta cta-blue w-full sm:w-fit">Disconnect</button>
          ) : (
            <div className="grid w-full gap-2 sm:w-80">
              <button type="button" onClick={connectXPortal} disabled={disabled} className="cta cta-orange w-full disabled:cursor-not-allowed disabled:opacity-70">{isConnecting && activeProvider === 'xportal' ? 'Connecting xPortal...' : 'Connect xPortal'}</button>
              <button type="button" onClick={connectExtension} disabled={disabled} className="cta cta-blue w-full disabled:cursor-not-allowed disabled:opacity-70">{isConnecting && activeProvider === 'extension' ? 'Connecting Extension...' : 'Connect MultiversX DeFi Wallet / Browser Extension'}</button>
              <button type="button" onClick={connectWebWallet} disabled={disabled} className="cta cta-orange w-full disabled:cursor-not-allowed disabled:opacity-70">{isConnecting && activeProvider === 'web' ? 'Connecting Web Wallet...' : 'Connect Web Wallet'}</button>
            </div>
          )}
          <p className={address ? 'text-xs text-emerald-200' : 'text-xs text-white/50'}>
            {address ? `Wallet: Connected${providerType ? ` via ${providerType}` : ''}` : 'Wallet: Not connected'}
          </p>
          {address ? <p className="text-xs text-white/70">{shortenAddress(address)}</p> : null}
          {xPortalUri ? <a className="max-w-xs break-words text-xs text-sky-200 underline" href={xPortalUri}>Open xPortal on this device</a> : null}
          {error ? <p className="max-w-xs text-xs leading-relaxed text-orange-200">{error}</p> : null}
        </div>
      </div>
      <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {walletStatusItems.map((item) => (
          <article key={item.label} className="wallet-status-card">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{item.label}</p>
            <p className={item.tone === 'locked' ? 'mt-2 text-lg font-black text-orange-200' : item.tone === 'success' ? 'mt-2 text-lg font-black text-emerald-200' : 'mt-2 text-lg font-black text-white'}>{item.value}</p>
            {item.detail ? <p className="mt-1 text-xs text-white/60">{item.detail}</p> : null}
          </article>
        ))}
      </div>
    </>
  );
}

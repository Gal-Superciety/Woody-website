'use client';

import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'woody:multiversx-wallet-session';
const WEB_WALLET_URL = 'https://wallet.multiversx.com';

function shortenAddress(address) {
  if (!address) return 'Not connected';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function getFriendlyError(error) {
  if (error?.message?.toLowerCase().includes('cancel')) {
    return 'Wallet connection was cancelled. Please try again when you are ready.';
  }

  return 'Could not connect your wallet. Please make sure your wallet is unlocked and try again.';
}

export default function WalletConnectPanel() {
  const [address, setAddress] = useState('');
  const [providerType, setProviderType] = useState('');
  const [provider, setProvider] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const walletStatusItems = useMemo(() => [
    { label: 'Wallet', value: address ? shortenAddress(address) : 'Not connected', tone: address ? 'success' : 'default' },
    { label: 'WOODY Balance', value: '—' },
    { label: 'Holder Tier', value: '—' },
    { label: 'Premium Access', value: 'Locked', tone: 'locked' },
  ], [address]);

  useEffect(() => {
    try {
      const storedSession = window.sessionStorage.getItem(STORAGE_KEY);
      if (!storedSession) return;

      const parsedSession = JSON.parse(storedSession);
      if (parsedSession?.address) {
        setAddress(parsedSession.address);
        setProviderType(parsedSession.providerType || 'Saved session');
      }
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const saveSession = (nextAddress, nextProviderType) => {
    setAddress(nextAddress);
    setProviderType(nextProviderType);
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ address: nextAddress, providerType: nextProviderType }));
  };

  const connectExtension = async () => {
    const { ExtensionProvider } = await import('@multiversx/sdk-extension-provider');
    const extensionProvider = ExtensionProvider.getInstance();
    const initialized = await extensionProvider.init();

    if (!initialized) {
      throw new Error('MultiversX DeFi Wallet extension is not available.');
    }

    const nextAddress = await extensionProvider.login();
    const resolvedAddress = nextAddress || extensionProvider.account?.address;

    if (!resolvedAddress) {
      throw new Error('Wallet did not return an address.');
    }

    setProvider(extensionProvider);
    saveSession(resolvedAddress, 'MultiversX DeFi Wallet');
  };

  const connectWebWallet = async () => {
    const { CrossWindowProvider } = await import('@multiversx/sdk-web-wallet-cross-window-provider');
    const webWalletProvider = CrossWindowProvider.getInstance();
    await webWalletProvider.init();
    webWalletProvider.setWalletUrl(WEB_WALLET_URL);

    const nextAddress = await webWalletProvider.login();
    const resolvedAddress = nextAddress || webWalletProvider.account?.address;

    if (!resolvedAddress) {
      throw new Error('Web Wallet did not return an address.');
    }

    setProvider(webWalletProvider);
    saveSession(resolvedAddress, 'MultiversX Web Wallet');
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');

    try {
      await connectExtension();
    } catch (extensionError) {
      try {
        await connectWebWallet();
      } catch (webWalletError) {
        console.error('WOODY wallet connection failed', { extensionError, webWalletError });
        setError(getFriendlyError(webWalletError));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setError('');

    try {
      if (provider?.logout) {
        await provider.logout();
      }
    } catch (disconnectError) {
      console.error('WOODY wallet disconnect failed', disconnectError);
    } finally {
      setProvider(null);
      setAddress('');
      setProviderType('');
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  };

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
            <button type="button" onClick={handleConnect} disabled={isConnecting} className="cta cta-orange w-full disabled:cursor-not-allowed disabled:opacity-70 sm:w-fit">
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
          <p className={address ? 'text-xs text-emerald-200' : 'text-xs text-white/50'}>
            {address ? `Status: Connected${providerType ? ` via ${providerType}` : ''}` : 'Wallet: Not connected'}
          </p>
          {error ? <p className="max-w-xs text-xs leading-relaxed text-orange-200">{error}</p> : null}
        </div>
      </div>
      <div className="relative z-10 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {walletStatusItems.map((item) => (
          <article key={item.label} className="wallet-status-card">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">{item.label}</p>
            <p className={item.tone === 'locked' ? 'mt-2 text-lg font-black text-orange-200' : item.tone === 'success' ? 'mt-2 text-lg font-black text-emerald-200' : 'mt-2 text-lg font-black text-white'}>{item.value}</p>
          </article>
        ))}
      </div>
    </>
  );
}

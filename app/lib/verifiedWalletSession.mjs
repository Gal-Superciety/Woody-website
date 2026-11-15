const SESSION_KEY = 'woody:multiversx-wallet-session';
const ADDRESS = /^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/i;
const RELAY_URL = 'wss://relay.walletconnect.com';

/**
 * Re-check the actual wallet provider session. A browser-stored address alone
 * must NEVER unlock a wallet profile or become reward eligibility evidence.
 * This is read-only and does not request a signature or transaction.
 */
export async function restoreVerifiedWalletSession() {
  if (typeof window === 'undefined') return null;
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const chainId = process.env.NEXT_PUBLIC_MULTIVERSX_CHAIN_ID || '1';

  let saved = null;
  try { saved = JSON.parse(window.sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch { /* Damaged session hints are untrusted. */ }

  // xPortal restores its own persisted pairing (including after mobile app switch).
  if (projectId) {
    try {
      const module = await import('@multiversx/sdk-wallet-connect-provider');
      const Provider = module.WalletConnectV2Provider || module.WalletConnectProvider;
      if (Provider) {
        const provider = new Provider({
          onClientLogin: () => {},
          onClientLogout: () => {},
          onClientEvent: () => {},
        }, chainId, RELAY_URL, projectId);
        await provider.init();
        if (provider.isConnected?.()) {
          const address = String(await provider.getAddress()).toLowerCase();
          if (ADDRESS.test(address)) {
            const session = { address, providerType: 'xPortal' };
            window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
            return session;
          }
        }
      }
    } catch { /* Expired pairings must not be trusted. */ }
  }

  // Browser extension connections can be restored only if the extension itself
  // attests it is currently connected, not by accepting a saved address.
  if (saved?.providerType === 'MultiversX DeFi Wallet / Browser Extension') {
    try {
      const { ExtensionProvider } = await import('@multiversx/sdk-extension-provider');
      const provider = ExtensionProvider?.getInstance?.();
      const initialized = await provider?.init?.();
      if (initialized && provider.isConnected?.()) {
        const address = String(await provider.getAddress()).toLowerCase();
        if (ADDRESS.test(address)) {
          const session = { address, providerType: saved.providerType };
          window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
          return session;
        }
      }
    } catch { /* Reconnect manually when the extension is unavailable. */ }
  }

  window.sessionStorage.removeItem(SESSION_KEY);
  return null;
}

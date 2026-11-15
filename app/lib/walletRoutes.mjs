export const WALLET_RETURN_KEY = 'woody:wallet-return-to';

const ALLOWED_ROUTES = new Set([
  '/', '/app', '/profile', '/arcade', '/forest-adventure', '/woody-casino', '/buy',
]);

/** Allow only known local routes, never redirect to a wallet-provided URL. */
export function safeWalletReturnPath(value) {
  return typeof value === 'string' && ALLOWED_ROUTES.has(value) ? value : '';
}

export function resolveWalletReturnPath({ requested, pending, current } = {}) {
  return safeWalletReturnPath(requested)
    || safeWalletReturnPath(pending)
    || safeWalletReturnPath(current)
    || '/app';
}

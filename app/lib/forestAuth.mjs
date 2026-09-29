import { Address } from '@multiversx/sdk-core';

export const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,20}$/;
export const WALLET_PATTERN = /^erd1[023456789acdefghjklmnpqrstuvwxyz]{58}$/;

export function normalizeWallet(value) {
  if (typeof value !== 'string') return '';
  const wallet = value.trim().toLowerCase();
  if (!WALLET_PATTERN.test(wallet)) return '';
  try {
    return Address.newFromBech32(wallet).toBech32() === wallet ? wallet : '';
  } catch {
    return '';
  }
}

import { Address, Message, MessageComputer, UserVerifier } from '@multiversx/sdk-core';

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

export async function verifyForestWalletSignature(wallet, challenge, signatureHex) {
  const normalizedWallet = normalizeWallet(wallet);
  if (!normalizedWallet || typeof challenge !== 'string' || !/^[0-9a-f]{128}$/i.test(signatureHex || '')) return false;

  try {
    const address = Address.newFromBech32(normalizedWallet);
    const message = new Message({
      address,
      data: Buffer.from(challenge, 'utf8'),
      signature: Buffer.from(signatureHex, 'hex'),
    });
    const serialized = new MessageComputer().computeBytesForVerifying(message);
    return await UserVerifier.fromAddress(address).verify(serialized, message.signature);
  } catch {
    return false;
  }
}

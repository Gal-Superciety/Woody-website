import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Message, MessageComputer, UserSecretKey } from '@multiversx/sdk-core';
import { normalizeWallet, USERNAME_PATTERN, verifyForestWalletSignature } from '../app/lib/forestAuth.mjs';

test('wallet challenge signature is accepted only for the signing wallet and exact message', async () => {
  const secretKey = UserSecretKey.generate();
  const address = secretKey.generatePublicKey().toAddress('erd');
  const challenge = 'WOODY Forest Adventure\nNonce: single-use-value';
  const message = new Message({ address, data: Buffer.from(challenge, 'utf8') });
  const signature = Buffer.from(secretKey.sign(new MessageComputer().computeBytesForSigning(message))).toString('hex');

  assert.equal(await verifyForestWalletSignature(address.toBech32(), challenge, signature), true);
  assert.equal(await verifyForestWalletSignature(address.toBech32(), `${challenge}\nchanged`, signature), false);
  const otherWallet = UserSecretKey.generate().generatePublicKey().toAddress('erd').toBech32();
  assert.equal(await verifyForestWalletSignature(otherWallet, challenge, signature), false);
});

test('player names and wallet addresses are validated before profile operations', () => {
  const address = UserSecretKey.generate().generatePublicKey().toAddress('erd').toBech32();
  assert.equal(normalizeWallet(address), address);
  assert.equal(normalizeWallet('not-a-wallet'), '');
  assert.equal(USERNAME_PATTERN.test('Forest_Runner7'), true);
  assert.equal(USERNAME_PATTERN.test('ab'), false);
  assert.equal(USERNAME_PATTERN.test('bad name'), false);
});

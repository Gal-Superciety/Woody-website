import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { Message, MessageComputer, UserSecretKey } from '@multiversx/sdk-core';
import { NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { normalizeWallet, USERNAME_PATTERN } from '../app/lib/forestAuth.mjs';
import { verifyForestNativeAuth } from '../app/lib/forestNativeAuth.mjs';

const require = createRequire(import.meta.url);
const { NativeAuthClient } = require('@multiversx/sdk-native-auth-client');
const axios = require('axios');

test('native-auth login token verifies the wallet that signed the login', async () => {
  const secretKey = UserSecretKey.generate();
  const address = secretKey.generatePublicKey().toAddress('erd').toBech32();
  const origin = 'https://www.woodymvx.com';
  const apiUrl = 'https://native-auth-test.invalid';
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const blockHash = 'forest-test-block-hash';
  const client = new NativeAuthClient({ origin, apiUrl, expirySeconds: 3600 });
  const initialPart = `${client.encodeValue(origin)}.${blockHash}.3600.${client.encodeValue('{}')}`;
  const message = new Message({ address, data: Buffer.from(`${address}${initialPart}`, 'utf8') });
  const signature = Buffer.from(secretKey.sign(new MessageComputer().computeBytesForSigning(message))).toString('hex');
  const token = client.getToken(address, initialPart, signature);
  const originalGet = axios.get;
  axios.get = async (url) => {
    if (url.endsWith(`/blocks/${blockHash}?extract=timestamp`)) return { data: currentTimestamp };
    if (url.endsWith('/blocks?size=1&fields=timestamp')) return { data: [{ timestamp: currentTimestamp }] };
    throw new Error(`Unexpected NativeAuth test request: ${url}`);
  };
  const server = new NativeAuthServer({ apiUrl, acceptedOrigins: [origin], maxExpirySeconds: 86400 });

  try {
    assert.equal(await verifyForestNativeAuth(token, server), address);
    assert.equal(await verifyForestNativeAuth(`${token.slice(0, -2)}00`, server), null);
  } finally {
    axios.get = originalGet;
  }
});

test('player names and wallet addresses are validated before profile operations', () => {
  const address = UserSecretKey.generate().generatePublicKey().toAddress('erd').toBech32();
  assert.equal(normalizeWallet(address), address);
  assert.equal(normalizeWallet('not-a-wallet'), '');
  assert.equal(USERNAME_PATTERN.test('Forest_Runner7'), true);
  assert.equal(USERNAME_PATTERN.test('ab'), false);
  assert.equal(USERNAME_PATTERN.test('bad name'), false);
});

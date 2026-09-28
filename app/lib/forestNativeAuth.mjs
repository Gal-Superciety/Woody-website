import { NativeAuthServer } from '@multiversx/sdk-native-auth-server';
import { normalizeWallet } from './forestAuth.mjs';

const API_URL = process.env.NEXT_PUBLIC_MULTIVERSX_API_URL || 'https://api.multiversx.com';
const MAX_TOKEN_TTL_SECONDS = 24 * 60 * 60;
const ACCEPTED_ORIGINS = [
  'https://www.woodymvx.com',
  'https://woodymvx.com',
  'http://localhost:3000',
];

let authServer;

function getAuthServer() {
  if (!authServer) {
    authServer = new NativeAuthServer({
      apiUrl: API_URL,
      acceptedOrigins: ACCEPTED_ORIGINS,
      maxExpirySeconds: MAX_TOKEN_TTL_SECONDS,
    });
  }
  return authServer;
}

export async function verifyForestNativeAuth(token, server = getAuthServer()) {
  if (typeof token !== 'string' || token.length > 4096 || token.split('.').length !== 3) return null;
  try {
    const result = await getAuthServer().validate(token);
    return normalizeWallet(result.address) || null;
  } catch (error) {
    if (String(error?.constructor?.name || '').startsWith('NativeAuth')) return null;
    throw error;
  }
}

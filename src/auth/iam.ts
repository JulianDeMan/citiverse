// src/auth/iam.ts
import { randomString, sha256 } from './pkce';

const DOMAIN = import.meta.env.VITE_IAM_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI;
const LOGOUT_REDIRECT = import.meta.env.VITE_LOGOUT_REDIRECT;

const AUTHORIZE = `https://${DOMAIN}/oauth2/authorize`;
const TOKEN     = `https://${DOMAIN}/oauth2/token`;
const LOGOUT    = `https://${DOMAIN}/logout`;

const SCOPES = ['openid', 'profile', 'email'];

const K_VERIFIER = 'iam_pkce_verifier';
const K_STATE    = 'iam_state';
const K_TOKENS   = 'iam_tokens';

export type Tokens = {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  received_at?: number;
  expires_at?: number;
};

export function getTokens(): Tokens | null {
  const raw = sessionStorage.getItem(K_TOKENS);
  return raw ? (JSON.parse(raw) as Tokens) : null;
}

export function getAccessToken(): string | null {
  return getTokens()?.access_token ?? null;
}

export async function startLogin() {
  const state = randomString(32);
  const verifier = randomString(64);
  const challenge = await sha256(verifier);

  sessionStorage.setItem(K_VERIFIER, verifier);
  sessionStorage.setItem(K_STATE, state);

  const url = new URL(AUTHORIZE);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('scope', SCOPES.join(' '));
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');

  window.location.assign(url.toString());
}

export async function handleCallback(setStatus?: (s: string) => void): Promise<boolean> {
  const p = new URLSearchParams(window.location.search);
  const code = p.get('code');
  const state = p.get('state');
  const saved = sessionStorage.getItem(K_STATE);
  const verifier = sessionStorage.getItem(K_VERIFIER);

  if (!code) { setStatus?.('Geen code in callback.'); return false; }
  if (!state || state !== saved) { setStatus?.('State mismatch.'); return false; }
  if (!verifier) { setStatus?.('PKCE verifier ontbreekt.'); return false; }

  try {
    setStatus?.('Tokens ophalen…');
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('client_id', CLIENT_ID);
    body.set('code', code);
    body.set('redirect_uri', REDIRECT_URI);
    body.set('code_verifier', verifier);

    const res = await fetch(TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!res.ok) {
      setStatus?.(`Token exchange failed (${res.status})`);
      return false;
    }

    const t = (await res.json()) as Tokens;
    const now = Math.floor(Date.now() / 1000);
    t.received_at = now;
    t.expires_at = t.expires_in ? now + t.expires_in : undefined;

    sessionStorage.removeItem(K_VERIFIER);
    sessionStorage.removeItem(K_STATE);
    sessionStorage.setItem(K_TOKENS, JSON.stringify(t));
    return true;
  } catch (e: any) {
    setStatus?.(`Token exchange error: ${e?.message || String(e)}`);
    return false;
  }
}

export function logout() {
  sessionStorage.removeItem(K_TOKENS);
  const u = new URL(LOGOUT);
  u.searchParams.set('client_id', CLIENT_ID);
  // sommige providers gebruiken net andere naam; zet beide mee
  u.searchParams.set('logout_uri', LOGOUT_REDIRECT);
  u.searchParams.set('post_logout_redirect_uri', LOGOUT_REDIRECT);
  window.location.assign(u.toString());
}

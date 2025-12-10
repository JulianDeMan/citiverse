// src/auth/oidc.ts
import { UserManager, WebStorageStateStore, Log, User } from 'oidc-client-ts';

const issuer = import.meta.env.VITE_OUP_ISSUER_BASE; // bv. https://hub.clearly.app/oauth (voorbeeld)
const client_id = import.meta.env.VITE_OUP_CLIENT_ID;
const redirect_uri = import.meta.env.VITE_OUP_REDIRECT_URI;
const post_logout_redirect_uri = import.meta.env.VITE_OUP_LOGOUT_REDIRECT;

Log.setLogger(console);
Log.setLevel(Log.INFO);

export const userManager = new UserManager({
  authority: issuer,
  client_id,
  redirect_uri,
  post_logout_redirect_uri,
  response_type: 'code',
  scope: 'openid profile offline_access', // voeg scopes toe die OUP vereist
  loadUserInfo: true,
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
});

export async function signinRedirect() {
  await userManager.signinRedirect();
}

export async function handleSigninCallback(): Promise<User | null> {
  try {
    const user = await userManager.signinRedirectCallback();
    return user;
  } catch (e) {
    console.error('Signin callback failed', e);
    return null;
  }
}

export async function signoutRedirect() {
  await userManager.signoutRedirect();
}

export async function getAccessToken(): Promise<string | null> {
  const user = await userManager.getUser();
  return user?.access_token || null;
}

export async function getUser(): Promise<User | null> {
  return userManager.getUser();
}

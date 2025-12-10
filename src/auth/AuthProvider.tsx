// src/auth/AuthProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUser, getAccessToken, handleSigninCallback, signinRedirect, signoutRedirect } from './oidc';

type AuthCtx = {
  token: string | null;
  user: any | null;
  login: () => void;
  logout: () => void;
};
const Ctx = createContext<AuthCtx>({ token: null, user: null, login: () => {}, logout: () => {} });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getUser();
      setUser(u);
      setToken(await getAccessToken());
    })();
  }, []);

  const value: AuthCtx = {
    token,
    user,
    login: () => signinRedirect(),
    logout: () => signoutRedirect(),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Routes */
export function AuthCallback() {
  useEffect(() => {
    (async () => {
      await handleSigninCallback();
      window.location.replace('/'); // terug naar home
    })();
  }, []);
  return <div style={{ padding: 20 }}>Inloggen geslaagd…</div>;
}

export function SignedOut() {
  return <div style={{ padding: 20 }}>Je bent uitgelogd.</div>;
}

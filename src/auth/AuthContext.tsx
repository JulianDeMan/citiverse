import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAccessToken, startLogin, logout } from './iam';


type AuthCtx = { token: string | null; isAuthed: boolean; login: () => void; logout: () => void; };
const Ctx = createContext<AuthCtx>({ token: null, isAuthed: false, login: () => {}, logout: () => {} });
export const useAuth = () => useContext(Ctx);


export function AuthProvider({ children }: { children: React.ReactNode }) {
const [token, setToken] = useState<string | null>(getAccessToken());
useEffect(() => { const i = setInterval(() => setToken(getAccessToken()), 2000); return () => clearInterval(i); }, []);
return <Ctx.Provider value={{ token, isAuthed: !!token, login: startLogin, logout }}>{children}</Ctx.Provider>;
}
import React, { useEffect, useState } from 'react';
import { handleCallback } from './iam';


export function AuthCallback() {
const [msg, setMsg] = useState('Inloggen…');
useEffect(() => { (async () => { const ok = await handleCallback(setMsg); window.location.replace(ok ? '/' : '/auth/signed-out'); })(); }, []);
return <div style={{ padding: 20 }}>{msg}</div>;
}


export function SignedOut() { return <div style={{ padding: 20 }}>Je bent uitgelogd.</div>; }
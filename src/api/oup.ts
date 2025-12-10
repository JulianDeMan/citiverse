// src/api/oup.ts
import { useAuth } from '../auth/AuthProvider';

export function useOUP() {
  const { token } = useAuth();

  async function get<T = unknown>(url: string): Promise<T> {
    if (!token) throw new Error('Geen toegangstoken. Log in.');
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Ophalen mislukt: ${res.status}`);
    return res.json() as Promise<T>;
  }

  return { get };
}

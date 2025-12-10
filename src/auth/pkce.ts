function base64UrlEncode(bytes: ArrayBuffer) {
return btoa(String.fromCharCode(...new Uint8Array(bytes)))
.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function randomString(len = 64) {
const arr = new Uint8Array(len);
crypto.getRandomValues(arr);
return base64UrlEncode(arr);
}
export async function sha256(input: string) {
const enc = new TextEncoder();
const data = enc.encode(input);
const hash = await crypto.subtle.digest('SHA-256', data);
return base64UrlEncode(hash);
}
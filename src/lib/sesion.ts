/**
 * Token de sesión HMAC-SHA256 con WebCrypto.
 * Sin dependencias de node:crypto -> funciona en middleware (edge), route handlers y scripts.
 */

export interface Sesion {
  id: number;
  nombre: string;
  rol: "admin" | "vendedor" | "taller";
}

const COOKIE = "ts_session";
const SECRET = process.env.SESSION_SECRET || "ts-demo-secret-2026-turbosteven-audio";
export const MAX_AGE_SEG = 60 * 60 * 24 * 7; // 7 días

const b64url = {
  encode: (s: string) => btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""),
  decode: (s: string) => atob(s.replace(/-/g, "+").replace(/_/g, "/")),
};

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function crearToken(sesion: Sesion): Promise<string> {
  const payload = { ...sesion, exp: Date.now() + MAX_AGE_SEG * 1000 };
  const cuerpo = b64url.encode(JSON.stringify(payload));
  return `${cuerpo}.${await hmac(cuerpo)}`;
}

export async function verificarToken(token: string | undefined): Promise<Sesion | null> {
  if (!token || !token.includes(".")) return null;
  const [cuerpo, sig] = token.split(".");
  try {
    if (sig !== (await hmac(cuerpo))) return null;
    const payload = JSON.parse(b64url.decode(cuerpo));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return { id: payload.id, nombre: payload.nombre, rol: payload.rol };
  } catch {
    return null;
  }
}

export const NOMBRE_COOKIE = COOKIE;

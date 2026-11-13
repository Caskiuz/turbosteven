import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { crearToken, verificarToken, NOMBRE_COOKIE, MAX_AGE_SEG, type Sesion } from "./sesion";

export { crearToken, verificarToken, NOMBRE_COOKIE };
export type { Sesion };

/** Lee y valida la sesión desde las cookies (route handlers / server components). */
export async function sesionActual(): Promise<Sesion | null> {
  const store = await cookies();
  return verificarToken(store.get(NOMBRE_COOKIE)?.value);
}

export async function fijarCookieSesion(res: NextResponse, sesion: Sesion) {
  res.cookies.set(NOMBRE_COOKIE, await crearToken(sesion), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEG,
  });
}

export function borrarCookieSesion(res: NextResponse) {
  res.cookies.set(NOMBRE_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/* ---------- contraseñas (scrypt) ---------- */

export function hashPassword(pw: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(pw, salt, 32).toString("hex");
  return `${salt}:${hash}`;
}

export function verificarPassword(pw: string, almacenado: string): boolean {
  const [salt, hash] = almacenado.split(":");
  if (!salt || !hash) return false;
  const calc = scryptSync(pw, salt, 32);
  const orig = Buffer.from(hash, "hex");
  return calc.length === orig.length && timingSafeEqual(calc, orig);
}

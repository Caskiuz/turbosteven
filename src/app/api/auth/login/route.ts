import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sesionActual, verificarPassword, fijarCookieSesion, borrarCookieSesion } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) {
    return NextResponse.json({ error: "Email y contraseña requeridos" }, { status: 400 });
  }
  const s = await sql();
  const rows = (await s`
    SELECT id, nombre, email, rol, password_hash, activo FROM usuarios WHERE email = ${String(email).toLowerCase().trim()}`) as {
    id: number; nombre: string; email: string; rol: "admin" | "vendedor" | "taller";
    password_hash: string; activo: boolean;
  }[];

  const u = rows[0];
  if (!u || !u.activo || !verificarPassword(String(password), u.password_hash)) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const res = NextResponse.json({ usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
  await fijarCookieSesion(res, { id: u.id, nombre: u.nombre, rol: u.rol });
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  borrarCookieSesion(res);
  return res;
}

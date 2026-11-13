import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sesionActual, hashPassword } from "@/lib/auth";
import { puede } from "@/lib/permisos";

export const runtime = "nodejs";

export async function GET() {
  const sesion = await sesionActual();
  if (!sesion || !puede(sesion.rol, "ver_usuarios")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const s = await sql();
  const res = (await s`
    SELECT u.id, u.nombre, u.email, u.rol, u.activo, u.creado,
           (SELECT count(*)::int FROM pedidos p WHERE p.responsable_id = u.id AND p.estado IN ('pendiente','en_fabricacion','control_calidad')) AS asignados
    FROM usuarios u ORDER BY u.id ASC`) as {
    id: number; nombre: string; email: string; rol: "admin" | "vendedor" | "taller";
    activo: boolean; creado: string; asignados: number;
  }[];
  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const sesion = await sesionActual();
  if (!sesion || !puede(sesion.rol, "gestionar_usuarios")) {
    return NextResponse.json({ error: "Solo el administrador puede crear usuarios" }, { status: 403 });
  }
  const b = (await req.json().catch(() => null)) as null | {
    nombre: string; email: string; rol: "admin" | "vendedor" | "taller"; password: string;
  };
  if (!b?.nombre?.trim() || !b?.email?.trim() || !b?.password || !["admin", "vendedor", "taller"].includes(b.rol)) {
    return NextResponse.json({ error: "Datos incompletos o rol inválido" }, { status: 400 });
  }
  if (b.password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 });
  }
  const s = await sql();
  try {
    const res = (await s`
      INSERT INTO usuarios (nombre, email, password_hash, rol)
      VALUES (${b.nombre.trim()}, ${b.email.toLowerCase().trim()}, ${hashPassword(b.password)}, ${b.rol})
      RETURNING id`) as { id: number }[];
    return NextResponse.json({ id: res[0].id }, { status: 201 });
  } catch (e: unknown) {
    if (String(e).includes("unique")) {
      return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 409 });
    }
    throw e;
  }
}

export async function PATCH(req: NextRequest) {
  const sesion = await sesionActual();
  if (!sesion || !puede(sesion.rol, "gestionar_usuarios")) {
    return NextResponse.json({ error: "Solo el administrador puede modificar usuarios" }, { status: 403 });
  }
  const b = (await req.json().catch(() => null)) as null | { id: number; activo: boolean };
  if (!b?.id || typeof b.activo !== "boolean") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  if (b.id === sesion.id) {
    return NextResponse.json({ error: "No puedes desactivar tu propia cuenta" }, { status: 400 });
  }
  const s = await sql();
  await s`UPDATE usuarios SET activo = ${b.activo} WHERE id = ${b.id}`;
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from "next/server";
import { sql, filas } from "@/lib/db";
import { sesionActual } from "@/lib/auth";

export const runtime = "nodejs";

/** Notificaciones del usuario actual + conteo de no leídas. */
export async function GET() {
  const sesion = await sesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const s = await sql();
  const lista = await filas<{
    id: number; titulo: string; mensaje: string | null; tipo: string;
    enlace: string | null; leida: boolean; creado: string;
  }>(s, `
    SELECT id, titulo, mensaje, tipo, enlace, leida, creado
    FROM notificaciones WHERE usuario_id = $1
    ORDER BY creado DESC LIMIT 30`, [sesion.id]);

  const conteo = await filas<{ n: number }>(
    s,
    "SELECT count(*)::int AS n FROM notificaciones WHERE usuario_id = $1 AND leida = false",
    [sesion.id]
  );

  return NextResponse.json({ no_leidas: conteo[0]?.n ?? 0, lista });
}

/** Marca una notificación o todas como leídas. */
export async function PATCH(req: NextRequest) {
  const sesion = await sesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as null | { id?: number; todas?: boolean };
  const s = await sql();
  if (body?.todas) {
    await s`UPDATE notificaciones SET leida = true WHERE usuario_id = ${sesion.id}`;
    return NextResponse.json({ ok: true });
  }
  if (body?.id) {
    await s`UPDATE notificaciones SET leida = true WHERE id = ${body.id} AND usuario_id = ${sesion.id}`;
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
}

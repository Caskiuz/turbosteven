import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sesionActual } from "@/lib/auth";

export const runtime = "nodejs";

/** Lista de operarios del taller — accesible a todos los roles autenticados. */
export async function GET() {
  const sesion = await sesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  const s = await sql();
  const res = (await s`
    SELECT id, nombre FROM usuarios WHERE rol = 'taller' AND activo = true ORDER BY nombre ASC`) as { id: number; nombre: string }[];
  return NextResponse.json(res);
}

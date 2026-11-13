import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sesionActual } from "@/lib/auth";
import { puede } from "@/lib/permisos";

export const runtime = "nodejs";

export async function GET() {
  const sesion = await sesionActual();
  if (!sesion || !puede(sesion.rol, "ver_clientes")) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  const s = await sql();
  const res = (await s`
    SELECT c.id, c.nombre, c.telefono, c.direccion, c.notas, c.creado,
           (SELECT count(*)::int FROM pedidos p WHERE p.cliente_id = c.id) AS pedidos
    FROM clientes c ORDER BY c.nombre ASC`) as {
    id: number; nombre: string; telefono: string; direccion: string | null;
    notas: string | null; creado: string; pedidos: number;
  }[];
  return NextResponse.json(res);
}

export async function POST(req: NextRequest) {
  const sesion = await sesionActual();
  if (!sesion || !puede(sesion.rol, "gestionar_clientes")) {
    return NextResponse.json({ error: "Sin permiso para crear clientes" }, { status: 403 });
  }
  const b = (await req.json().catch(() => null)) as null | {
    nombre: string; telefono: string; direccion?: string; notas?: string;
  };
  if (!b?.nombre?.trim() || !b?.telefono?.trim()) {
    return NextResponse.json({ error: "Nombre y teléfono son obligatorios" }, { status: 400 });
  }
  const s = await sql();
  const res = (await s`
    INSERT INTO clientes (nombre, telefono, direccion, notas)
    VALUES (${b.nombre.trim()}, ${b.telefono.trim()}, ${b.direccion?.trim() ?? null}, ${b.notas?.trim() ?? null})
    RETURNING id`) as { id: number }[];
  return NextResponse.json({ id: res[0].id }, { status: 201 });
}

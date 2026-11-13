import { NextRequest, NextResponse } from "next/server";
import { sql, filas } from "@/lib/db";
import { sesionActual } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { BASE_SELECT, serializar, type FilaPedido } from "@/lib/pedidos-query";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const sesion = await sesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const s = await sql();
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado");
  const q = (searchParams.get("q") ?? "").trim();

  const conds: string[] = [];
  const vals: unknown[] = [];
  // el taller solo ve sus asignaciones
  if (sesion.rol === "taller") {
    vals.push(sesion.id);
    conds.push(`p.responsable_id = $${vals.length}`);
  }
  if (estado) {
    vals.push(estado);
    conds.push(`p.estado = $${vals.length}`);
  }
  if (q) {
    vals.push(`%${q}%`);
    const i = vals.length;
    conds.push(`(p.codigo ILIKE $${i} OR c.nombre ILIKE $${i} OR p.producto ILIKE $${i})`);
  }
  const where = conds.length ? "WHERE " + conds.join(" AND ") : "WHERE true";

  const filasPedido = await filas<FilaPedido>(
    s,
    `${BASE_SELECT} ${where} ORDER BY p.id DESC`,
    vals
  );
  return NextResponse.json(filasPedido.map(serializar));
}

export async function POST(req: NextRequest) {
  const sesion = await sesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!puede(sesion.rol, "crear_pedido")) {
    return NextResponse.json({ error: "Sin permiso para crear pedidos" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as null | {
    cliente_id: number; producto: string; tipo?: string; cantidad?: number;
    medidas?: string; color_principal?: string; color_secundario?: string;
    especificaciones?: string; precio?: number; abono?: number;
    fecha_inicio?: string; fecha_entrega?: string; responsable_id?: number | null;
    fotos?: string[];
  };
  if (!body?.cliente_id || !body.producto?.trim()) {
    return NextResponse.json({ error: "Cliente y producto son obligatorios" }, { status: 400 });
  }

  const s = await sql();
  // numeración consecutiva automática (secuencia server-side)
  const numRes = await filas<{ n: number }>(s, "SELECT nextval('pedido_numero_seq')::int AS n");
  const numero = numRes[0].n;
  const codigo = `TSA-${String(numero).padStart(4, "0")}`;

  const ins = (await s`
    INSERT INTO pedidos (numero, codigo, cliente_id, vendedor_id, responsable_id, producto, tipo,
      cantidad, medidas, color_principal, color_secundario, especificaciones, precio, abono,
      fecha_inicio, fecha_entrega, estado)
    VALUES (${numero}, ${codigo}, ${body.cliente_id}, ${sesion.id},
      ${body.responsable_id ?? null}, ${body.producto.trim()},
      ${body.tipo && ["parlante", "mini_turbo", "otro"].includes(body.tipo) ? body.tipo : "parlante"},
      ${Math.max(1, body.cantidad ?? 1)}, ${body.medidas?.trim() ?? null},
      ${body.color_principal?.trim() ?? null}, ${body.color_secundario?.trim() ?? null},
      ${body.especificaciones?.trim() ?? null}, ${body.precio ?? null}, ${body.abono ?? 0},
      ${body.fecha_inicio?.trim() || null}, ${body.fecha_entrega?.trim() || null}, ${"pendiente"})
    RETURNING id`) as { id: number }[];

  const pid = ins[0].id;
  let orden = 0;
  for (const src of (body.fotos ?? []).slice(0, 8)) {
    if (typeof src === "string" && src.length > 20) {
      await s`INSERT INTO pedido_fotos (pedido_id, src, orden) VALUES (${pid}, ${src}, ${orden++})`;
    }
  }
  await s`
    INSERT INTO pedido_historial (pedido_id, usuario_id, accion, detalle)
    VALUES (${pid}, ${sesion.id}, ${"Pedido creado"}, ${`Comanda ${codigo} registrada por ${sesion.nombre}`})`;

  return NextResponse.json({ id: pid, codigo }, { status: 201 });
}

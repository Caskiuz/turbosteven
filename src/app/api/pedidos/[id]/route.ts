import { NextRequest, NextResponse } from "next/server";
import { sql, filas } from "@/lib/db";
import { sesionActual } from "@/lib/auth";
import { puede } from "@/lib/permisos";
import { notificar, idsAdministradores } from "@/lib/notificar";
import { BASE_SELECT, serializar, type FilaPedido } from "@/lib/pedidos-query";
import { nombreEstado, type Estado } from "@/lib/tipos";

export const runtime = "nodejs";

const ESTADOS_VALIDOS = ["pendiente", "en_fabricacion", "control_calidad", "listo", "entregado", "cancelado"];

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await sesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const s = await sql();
  const res = await filas<FilaPedido>(s, `${BASE_SELECT} WHERE p.id = $1`, [Number(id)]);
  const pedido = res[0];
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  // el taller solo puede abrir sus propias asignaciones
  if (sesion.rol === "taller" && pedido.responsable_id !== sesion.id) {
    return NextResponse.json({ error: "Sin acceso a este pedido" }, { status: 403 });
  }

  const historial = (await s`
    SELECT h.id, u.nombre AS usuario_nombre, h.accion, h.detalle, h.creado
    FROM pedido_historial h LEFT JOIN usuarios u ON u.id = h.usuario_id
    WHERE h.pedido_id = ${pedido.id} ORDER BY h.creado ASC`) as {
    id: number; usuario_nombre: string | null; accion: string; detalle: string | null; creado: string;
  }[];

  return NextResponse.json({ ...serializar(pedido), historial });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const sesion = await sesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await ctx.params;
  const pid = Number(id);
  const body = (await req.json().catch(() => null)) as null | {
    estado?: Estado;
    producto?: string; medidas?: string; color_principal?: string; color_secundario?: string;
    especificaciones?: string; precio?: number; abono?: number;
    fecha_entrega?: string; responsable_id?: number | null;
    fotosAdicionales?: string[];
    registrar_pago?: number;
  };
  if (!body) return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });

  const s = await sql();
  const res = await filas<FilaPedido>(s, `${BASE_SELECT} WHERE p.id = $1`, [pid]);
  const pedido = res[0];
  if (!pedido) return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });

  const esTallerConEstePedido = sesion.rol === "taller" && pedido.responsable_id === sesion.id;
  const puedeEditar = puede(sesion.rol, "editar_pedido");
  const puedeCambiar = puede(sesion.rol, "cambiar_estado");

  /* --- cambio de estado (admin, vendedor, taller asignado) --- */
  if (body.estado) {
    if (!puedeCambiar && !esTallerConEstePedido) {
      return NextResponse.json({ error: "Sin permiso para cambiar estados" }, { status: 403 });
    }
    if (!ESTADOS_VALIDOS.includes(body.estado)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }
    await s`
      UPDATE pedidos SET estado = ${body.estado}, actualizado = now() WHERE id = ${pid}`;
    await s`
      INSERT INTO pedido_historial (pedido_id, usuario_id, accion, detalle)
      VALUES (${pid}, ${sesion.id}, ${"Estado: " + body.estado},
        ${`${sesion.nombre} cambió el estado de "${pedido.estado.replace("_", " ")}" a "${body.estado.replace("_", " ")}"`})`;

    // notificaciones del cambio de estado: responsable, vendedor y administradores
    const adminsEstado = await idsAdministradores(s);
    await notificar(
      s,
      [pedido.responsable_id, pedido.vendedor_id, ...adminsEstado],
      {
        titulo: `${pedido.codigo} - ${nombreEstado(body.estado)}`,
        mensaje: `${sesion.nombre} movió "${pedido.producto}" de ${pedido.estado.replace("_", " ")} a ${body.estado.replace("_", " ")}`,
        tipo: body.estado === "listo" || body.estado === "entregado" ? "exito" : "alerta",
        enlace: `/pedidos/${pid}`,
      },
      sesion.id
    );

    if (!body.producto && !body.medidas && !(body.fotosAdicionales?.length)) {
      return NextResponse.json({ ok: true, estado: body.estado });
    }
  }

  /* --- registrar abono / pago (admin, vendedor; también taller sobre su pedido) --- */
  if (body.registrar_pago !== undefined) {
    const monto = Math.round(Number(body.registrar_pago));
    if (!monto || monto <= 0) {
      return NextResponse.json({ error: "El monto del abono debe ser mayor a cero" }, { status: 400 });
    }
    if (!puedeCambiar && !esTallerConEstePedido) {
      return NextResponse.json({ error: "Sin permiso para registrar abonos" }, { status: 403 });
    }
    await s`
      INSERT INTO pagos (pedido_id, monto, nota, usuario_id)
      VALUES (${pid}, ${monto}, ${`Abono registrado por ${sesion.nombre}`}, ${sesion.id})`;
    await s`
      UPDATE pedidos SET abono = COALESCE(abono, 0) + ${monto}, actualizado = now() WHERE id = ${pid}`;
    await s`
      INSERT INTO pedido_historial (pedido_id, usuario_id, accion, detalle)
      VALUES (${pid}, ${sesion.id}, ${"Abono registrado"},
        ${`${sesion.nombre} registró un abono de $${monto.toLocaleString("es-CO")}`})`;

    // notificación del abono: vendedor y administradores
    const adminsAbono = await idsAdministradores(s);
    await notificar(
      s,
      [pedido.vendedor_id, ...adminsAbono],
      {
        titulo: `${pedido.codigo} - Abono de $${monto.toLocaleString("es-CO")}`,
        mensaje: `${sesion.nombre} registró un abono para "${pedido.producto}"`,
        tipo: "exito",
        enlace: `/pedidos/${pid}`,
      },
      sesion.id
    );
    return NextResponse.json({ ok: true, abono: Number(pedido.abono ?? 0) + monto });
  }

  /* --- edición completa (admin, vendedor) --- */
  if (body.producto !== undefined || body.medidas !== undefined || body.responsable_id !== undefined ||
      body.fecha_entrega !== undefined || body.precio !== undefined || body.especificaciones !== undefined) {
    if (!puedeEditar) {
      return NextResponse.json({ error: "Sin permiso para editar pedidos" }, { status: 403 });
    }
    await s`
      UPDATE pedidos SET
        producto = COALESCE(${body.producto ?? null}, producto),
        medidas = COALESCE(${body.medidas ?? null}, medidas),
        color_principal = COALESCE(${body.color_principal ?? null}, color_principal),
        color_secundario = COALESCE(${body.color_secundario ?? null}, color_secundario),
        especificaciones = COALESCE(${body.especificaciones ?? null}, especificaciones),
        precio = COALESCE(${body.precio ?? null}, precio),
        abono = COALESCE(${body.abono ?? null}, abono),
        fecha_entrega = COALESCE(${body.fecha_entrega ?? null}, fecha_entrega),
        responsable_id = ${body.responsable_id !== undefined ? body.responsable_id : pedido.responsable_id},
        actualizado = now()
      WHERE id = ${pid}`;
    await s`
      INSERT INTO pedido_historial (pedido_id, usuario_id, accion, detalle)
      VALUES (${pid}, ${sesion.id}, ${"Pedido actualizado"}, ${`${sesion.nombre} actualizó los datos de la comanda`})`;
  }

  /* --- fotos adicionales --- */
  if (body.fotosAdicionales?.length) {
    if (!puedeEditar) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
    const actual = await filas<{ n: number }>(s, "SELECT count(*)::int AS n FROM pedido_fotos WHERE pedido_id = $1", [pid]);
    let orden = actual[0].n;
    for (const src of body.fotosAdicionales.slice(0, 4)) {
      if (typeof src === "string" && src.length > 20) {
        await s`INSERT INTO pedido_fotos (pedido_id, src, orden) VALUES (${pid}, ${src}, ${orden++})`;
      }
    }
    await s`
      INSERT INTO pedido_historial (pedido_id, usuario_id, accion, detalle)
      VALUES (${pid}, ${sesion.id}, ${"Fotos agregadas"}, ${`${sesion.nombre} adjuntó ${body.fotosAdicionales.length} foto(s) de referencia`})`;
  }

  return NextResponse.json({ ok: true });
}

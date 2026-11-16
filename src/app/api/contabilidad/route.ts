import { NextResponse } from "next/server";
import { sql, filas } from "@/lib/db";
import { sesionActual } from "@/lib/auth";
import { puede } from "@/lib/permisos";

export const runtime = "nodejs";

interface Movimiento {
  fecha: string;
  tipo: "Venta" | "Abono";
  codigo: string;
  pedido_id: number;
  cliente: string;
  detalle: string;
  monto: number;
}

/** Libro contable del negocio: resumen, libro diario y mayor por cliente. Solo administrador. */
export async function GET() {
  const sesion = await sesionActual();
  if (!sesion) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!puede(sesion.rol, "ver_usuarios")) {
    // la contabilidad es del administrador (el vendedor ve saldos en el dashboard)
    return NextResponse.json({ error: "Solo el administrador accede a la contabilidad" }, { status: 403 });
  }

  const s = await sql();

  // ── resumen general ──
  const resumen = await filas<{ facturado: string; cobrado: string; pedidos: number; cancelados: string; cancelado_monto: string }>(s, `
    SELECT COALESCE(SUM(precio), 0)::text AS facturado,
           COALESCE(SUM(abono), 0)::text AS cobrado,
           COUNT(*)::int AS pedidos,
           COUNT(*) FILTER (WHERE estado = 'cancelado')::text AS cancelados,
           COALESCE(SUM(precio) FILTER (WHERE estado = 'cancelado'), 0)::text AS cancelado_monto
    FROM pedidos`);

  const facturado = Number(resumen[0]?.facturado ?? 0);
  const cobrado = Number(resumen[0]?.cobrado ?? 0);
  const canceladoMonto = Number(resumen[0]?.cancelado_monto ?? 0);

  // ── libro diario: ventas (pedidos) + abonos (pagos) ──
  const ventas = await filas<{
    fecha: string; codigo: string; pedido_id: number; cliente: string;
    producto: string; monto: string;
  }>(s, `
    SELECT p.creado AS fecha, p.codigo, p.id AS pedido_id, c.nombre AS cliente,
           p.producto, COALESCE(p.precio, 0)::text AS monto
    FROM pedidos p JOIN clientes c ON c.id = p.cliente_id
    ORDER BY p.creado DESC`);

  const abonos = await filas<{
    fecha: string; codigo: string; pedido_id: number; cliente: string;
    producto: string; monto: string; nota: string | null;
  }>(s, `
    SELECT g.creado AS fecha, p.codigo, p.id AS pedido_id, c.nombre AS cliente,
           p.producto, g.monto::text AS monto, g.nota
    FROM pagos g
    JOIN pedidos p ON p.id = g.pedido_id
    JOIN clientes c ON c.id = p.cliente_id
    ORDER BY g.creado DESC`);

  const diario: Movimiento[] = [
    ...ventas.map((v) => ({
      fecha: v.fecha, tipo: "Venta" as const, codigo: v.codigo, pedido_id: v.pedido_id,
      cliente: v.cliente, detalle: v.producto, monto: Number(v.monto),
    })),
    ...abonos.map((a) => ({
      fecha: a.fecha, tipo: "Abono" as const, codigo: a.codigo, pedido_id: a.pedido_id,
      cliente: a.cliente, detalle: a.nota ?? `Abono pedido ${a.codigo}`, monto: Number(a.monto),
    })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : -1));

  // ── mayor por cliente ──
  const mayor = await filas<{
    cliente: string; telefono: string; pedidos: number; facturado: string;
    cobrado: string; saldo: string; activos: number;
  }>(s, `
    SELECT c.nombre AS cliente, c.telefono,
           COUNT(p.id)::int AS pedidos,
           COALESCE(SUM(p.precio), 0)::text AS facturado,
           COALESCE(SUM(p.abono), 0)::text AS cobrado,
           (COALESCE(SUM(p.precio), 0) - COALESCE(SUM(p.abono), 0))::text AS saldo,
           COUNT(p.id) FILTER (WHERE p.estado IN ('pendiente','en_fabricacion','control_calidad','listo'))::int AS activos
    FROM clientes c
    LEFT JOIN pedidos p ON p.cliente_id = c.id AND p.estado <> 'cancelado'
    GROUP BY c.id, c.nombre, c.telefono
    HAVING COUNT(p.id) > 0
    ORDER BY 5 DESC`);

  return NextResponse.json({
    resumen: {
      facturado,
      cobrado,
      porCobrar: facturado - cobrado,
      pedidos: resumen[0]?.pedidos ?? 0,
      cancelados: Number(resumen[0]?.cancelados ?? 0),
      canceladoMonto,
    },
    diario,
    mayor: mayor.map((m) => ({
      cliente: m.cliente,
      telefono: m.telefono,
      pedidos: m.pedidos,
      activos: m.activos,
      facturado: Number(m.facturado),
      cobrado: Number(m.cobrado),
      saldo: Number(m.saldo),
    })),
  });
}

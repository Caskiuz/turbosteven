/**
 * Consulta de estado de pedido usada por el function calling de Steven IA.
 * Solo expone datos no sensibles: código, producto, estado, responsable y fechas.
 */
import { sql } from "@/lib/db";
import { nombreEstado } from "@/lib/tipos";
import { fechaCorta } from "@/lib/fechas";

export interface InfoPedido {
  codigo: string;
  producto: string;
  cantidad: number;
  estado: string;
  estado_nombre: string;
  responsable: string | null;
  fecha_inicio: string;
  fecha_entrega: string;
  medida: string | null;
  color_principal: string | null;
  especificaciones: string | null;
}

export async function consultarPedido(codigoRaw: string): Promise<InfoPedido | null> {
  const s = await sql();
  let codigo = codigoRaw.trim().toUpperCase();
  if (!codigo.startsWith("TSA-")) {
    const n = codigo.replace(/[^0-9]/g, "");
    if (!n) return null;
    codigo = `TSA-${n.padStart(4, "0")}`;
  }
  const res = (await s`
    SELECT p.codigo, p.producto, p.cantidad, p.estado, r.nombre AS responsable_nombre,
           p.fecha_inicio, p.fecha_entrega, p.medidas, p.color_principal, p.especificaciones
    FROM pedidos p LEFT JOIN usuarios r ON r.id = p.responsable_id
    WHERE p.codigo = ${codigo} LIMIT 1`) as {
    codigo: string; producto: string; cantidad: number; estado: string;
    responsable_nombre: string | null; fecha_inicio: string | null; fecha_entrega: string | null;
    medidas: string | null; color_principal: string | null; especificaciones: string | null;
  }[];

  const p = res[0];
  if (!p) return null;
  return {
    codigo: p.codigo,
    producto: p.producto,
    cantidad: p.cantidad,
    estado: p.estado,
    estado_nombre: nombreEstado(p.estado as Parameters<typeof nombreEstado>[0]),
    responsable: p.responsable_nombre,
    fecha_inicio: fechaCorta(p.fecha_inicio),
    fecha_entrega: fechaCorta(p.fecha_entrega),
    medida: p.medidas,
    color_principal: p.color_principal,
    especificaciones: p.especificaciones,
  };
}

import type { Estado } from "@/lib/tipos";

/** SELECT base compartido por las rutas de pedidos y comanda. */
export interface FilaPedido {
  id: number; numero: number; codigo: string;
  cliente_id: number; cliente_nombre: string; cliente_telefono: string;
  vendedor_id: number | null; vendedor_nombre: string | null;
  responsable_id: number | null; responsable_nombre: string | null;
  producto: string; tipo: string; cantidad: number;
  medidas: string | null; color_principal: string | null; color_secundario: string | null;
  especificaciones: string | null; precio: string | null; abono: string | null;
  fecha_inicio: string | null; fecha_entrega: string | null;
  estado: Estado; creado: string; actualizado: string;
  fotos: string[] | null;
}

export const BASE_SELECT = `
  SELECT p.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
         v.nombre AS vendedor_nombre, r.nombre AS responsable_nombre,
         COALESCE((SELECT json_agg(f.src ORDER BY f.orden) FROM pedido_fotos f WHERE f.pedido_id = p.id), '[]'::json) AS fotos
  FROM pedidos p
  JOIN clientes c ON c.id = p.cliente_id
  LEFT JOIN usuarios v ON v.id = p.vendedor_id
  LEFT JOIN usuarios r ON r.id = p.responsable_id`;

/** Normaliza campos numéricos de una fila de pedido. */
export function serializar(f: FilaPedido) {
  return {
    ...f,
    precio: f.precio ? Number(f.precio) : null,
    abono: f.abono ? Number(f.abono) : null,
    fotos: (f.fotos as unknown as string[]) ?? [],
  };
}

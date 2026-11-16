import type { NeonQueryFunction } from "@neondatabase/serverless";

type Sql = NeonQueryFunction<false, false>;

/**
 * Crea notificaciones para un grupo de usuarios (sin duplicados ni al propio autor).
 * Se llama en cada evento importante: pedido creado, cambio de estado, abono.
 */
export async function notificar(
  s: Sql,
  destinatarios: (number | null | undefined)[],
  datos: { titulo: string; mensaje: string; tipo?: "info" | "alerta" | "exito"; enlace?: string },
  excluirId?: number
) {
  const ids = [...new Set(destinatarios.filter((id): id is number => !!id && id !== excluirId))];
  for (const id of ids) {
    await s`
      INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, enlace)
      VALUES (${id}, ${datos.titulo}, ${datos.mensaje}, ${datos.tipo ?? "info"}, ${datos.enlace ?? null})`;
  }
}

/** IDs de todos los administradores activos. */
export async function idsAdministradores(s: Sql): Promise<number[]> {
  const filasAdmin = (await s`SELECT id FROM usuarios WHERE rol = 'admin' AND activo = true`) as { id: number }[];
  return filasAdmin.map((f) => f.id);
}
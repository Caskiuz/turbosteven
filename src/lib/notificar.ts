import type { NeonQueryFunction } from "@neondatabase/serverless";
import { enviarCorreo } from "./correo";

type Sql = NeonQueryFunction<false, false>;

/**
 * Crea notificaciones internas (campana) para un grupo de usuarios — sin duplicados
 * ni al propio autor — y envía el aviso por correo a cada destinatario si el SMTP
 * está configurado. El correo nunca rompe el flujo principal.
 */
export async function notificar(
  s: Sql,
  destinatarios: (number | null | undefined)[],
  datos: { titulo: string; mensaje: string; tipo?: "info" | "alerta" | "exito"; enlace?: string },
  excluirId?: number
) {
  const ids = [...new Set(destinatarios.filter((id): id is number => !!id && id !== excluirId))];
  if (!ids.length) return;

  const correos = (await s`
    SELECT email FROM usuarios WHERE id = ANY(${ids}) AND activo = true`) as { email: string }[];

  for (const id of ids) {
    await s`
      INSERT INTO notificaciones (usuario_id, titulo, mensaje, tipo, enlace)
      VALUES (${id}, ${datos.titulo}, ${datos.mensaje}, ${datos.tipo ?? "info"}, ${datos.enlace ?? null})`;
  }

  // correos en paralelo, sin bloquear ni romper el flujo si el SMTP falla
  await Promise.allSettled(
    correos.map((c) => enviarCorreo(c.email, datos.titulo, datos.mensaje, datos.enlace))
  );
}

/** IDs de todos los administradores activos. */
export async function idsAdministradores(s: Sql): Promise<number[]> {
  const filasAdmin = (await s`SELECT id FROM usuarios WHERE rol = 'admin' AND activo = true`) as { id: number }[];
  return filasAdmin.map((f) => f.id);
}

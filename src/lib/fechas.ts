export const dia = (d: Date) => d.toISOString().slice(0, 10);

/** Normaliza un valor de fecha que puede llegar como Date (driver Postgres) o string ISO. */
function aISO(v: string | Date | null | undefined): string | null {
  if (!v) return null;
  return v instanceof Date ? v.toISOString() : String(v);
}

export function hace(nDias: number): string {
  return dia(new Date(Date.now() - nDias * 86400000));
}
export function en(nDias: number): string {
  return dia(new Date(Date.now() + nDias * 86400000));
}

export function fechaCorta(iso: string | Date | null | undefined): string {
  const v = aISO(iso);
  if (!v) return "—";
  const [y, m, d] = v.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function diasRestantes(iso: string | Date | null | undefined): number | null {
  const v = aISO(iso);
  if (!v) return null;
  const fecha = new Date(v.slice(0, 10) + "T23:59:59");
  return Math.ceil((fecha.getTime() - Date.now()) / 86400000);
}

export function etiquetaEntrega(
  iso: string | Date | null | undefined
): { texto: string; tono: "ok" | "warn" | "danger" | "muted" } {
  const dias = diasRestantes(iso);
  if (dias === null) return { texto: "Sin fecha", tono: "muted" };
  if (dias < 0) return { texto: `${Math.abs(dias)} día${Math.abs(dias) !== 1 ? "s" : ""} vencido`, tono: "danger" };
  if (dias === 0) return { texto: "Entrega hoy", tono: "warn" };
  if (dias <= 3) return { texto: `Entrega en ${dias} día${dias !== 1 ? "s" : ""}`, tono: "warn" };
  return { texto: `Entrega en ${dias} días`, tono: "ok" };
}

export function formatoCOP(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return "$" + new Intl.NumberFormat("es-CO").format(v);
}

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { sembrarDemo } from "./seed";

type Sql = NeonQueryFunction<false, false>;

let _sql: Sql | null = null;
let _init: Promise<Sql> | null = null;

/** Devuelve el cliente Neon (HTTP) y garantiza esquema + seed en el primer uso. */
export async function sql(): Promise<Sql> {
  if (!_sql) {
    const url = process.env.DATABASE_URL?.replace(/^"(.*)"$/, "$1");
    if (!url) {
      throw new Error(
        "Falta DATABASE_URL: crea un proyecto gratis en https://neon.tech y agrega la cadena de conexión en .env.local (local) y en las variables de entorno de Vercel."
      );
    }
    _sql = neon(url) as Sql;
  }
  if (!_init) {
    _init = inicializar().catch((e) => {
      _init = null;
      throw e;
    });
  }
  return _init;
}

async function inicializar(): Promise<Sql> {
  const s = _sql!;
  await s.query(`CREATE TABLE IF NOT EXISTS usuarios (
    id serial PRIMARY KEY,
    nombre text NOT NULL,
    email text UNIQUE NOT NULL,
    password_hash text NOT NULL,
    rol text NOT NULL CHECK (rol IN ('admin','vendedor','taller')),
    activo boolean NOT NULL DEFAULT true,
    creado timestamptz NOT NULL DEFAULT now()
  )`);
  await s.query(`CREATE TABLE IF NOT EXISTS clientes (
    id serial PRIMARY KEY,
    nombre text NOT NULL,
    telefono text NOT NULL,
    direccion text,
    notas text,
    creado timestamptz NOT NULL DEFAULT now()
  )`);
  await s.query(`CREATE TABLE IF NOT EXISTS pedidos (
    id serial PRIMARY KEY,
    numero integer NOT NULL,
    codigo text UNIQUE NOT NULL,
    cliente_id integer NOT NULL REFERENCES clientes(id),
    vendedor_id integer REFERENCES usuarios(id),
    responsable_id integer REFERENCES usuarios(id),
    producto text NOT NULL,
    tipo text NOT NULL DEFAULT 'parlante' CHECK (tipo IN ('parlante','mini_turbo','otro')),
    cantidad integer NOT NULL DEFAULT 1,
    medidas text,
    color_principal text,
    color_secundario text,
    especificaciones text,
    precio numeric(12,0),
    abono numeric(12,0) DEFAULT 0,
    fecha_inicio date,
    fecha_entrega date,
    estado text NOT NULL DEFAULT 'pendiente' CHECK (estado IN
      ('pendiente','en_fabricacion','control_calidad','listo','entregado','cancelado')),
    creado timestamptz NOT NULL DEFAULT now(),
    actualizado timestamptz NOT NULL DEFAULT now()
  )`);
  await s.query(`CREATE TABLE IF NOT EXISTS pedido_fotos (
    id serial PRIMARY KEY,
    pedido_id integer NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    src text NOT NULL,
    orden integer NOT NULL DEFAULT 0
  )`);
  await s.query(`CREATE TABLE IF NOT EXISTS pedido_historial (
    id serial PRIMARY KEY,
    pedido_id integer NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    usuario_id integer REFERENCES usuarios(id),
    accion text NOT NULL,
    detalle text,
    creado timestamptz NOT NULL DEFAULT now()
  )`);
  await s.query(`CREATE TABLE IF NOT EXISTS pagos (
    id serial PRIMARY KEY,
    pedido_id integer NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    monto numeric(12,0) NOT NULL,
    nota text,
    usuario_id integer REFERENCES usuarios(id),
    creado timestamptz NOT NULL DEFAULT now()
  )`);
  await s.query(`CREATE TABLE IF NOT EXISTS notificaciones (
    id serial PRIMARY KEY,
    usuario_id integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo text NOT NULL,
    mensaje text,
    tipo text NOT NULL DEFAULT 'info',
    enlace text,
    leida boolean NOT NULL DEFAULT false,
    creado timestamptz NOT NULL DEFAULT now()
  )`);
  await s.query(
    `CREATE SEQUENCE IF NOT EXISTS pedido_numero_seq AS integer START 1`
  );
  // relleno idempotente: los abonos ya existentes entran al libro contable una sola vez
  await s.query(`
    INSERT INTO pagos (pedido_id, monto, nota, usuario_id, creado)
    SELECT p.id, p.abono, 'Abono registrado', p.vendedor_id, p.creado
    FROM pedidos p
    WHERE p.abono > 0 AND NOT EXISTS (SELECT 1 FROM pagos g WHERE g.pedido_id = p.id)`);
  await sembrarDemo(s);
  return s;
}

/**
 * Ejecuta una consulta parametrizada y devuelve SIEMPRE un array de filas.
 * (El driver neon() devuelve array directo; este helper lo tipa, tolera
 * drivers que devuelvan { rows } y corta a los 20 s para no colgar nunca.)
 */
export async function filas<T = Record<string, unknown>>(
  s: Sql,
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const conTimeout = (p: Promise<unknown>) =>
    Promise.race([
      p,
      new Promise((_, rechazar) =>
        setTimeout(() => rechazar(new Error("La consulta tardó demasiado (timeout 20s)")), 20000)
      ),
    ]);
  const res: unknown = await conTimeout(
    (
      s as unknown as { query: (t: string, p?: unknown[]) => Promise<unknown> }
    ).query(text, params)
  );
  return (Array.isArray(res) ? res : (res as { rows: T[] }).rows) as T[];
}

export const dia = (d: Date) => d.toISOString().slice(0, 10);
export function hace(nDias: number): string {
  return dia(new Date(Date.now() - nDias * 86400000));
}
export function en(nDias: number): string {
  return dia(new Date(Date.now() + nDias * 86400000));
}

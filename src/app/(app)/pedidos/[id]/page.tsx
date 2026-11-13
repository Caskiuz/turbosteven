"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ESTADOS, nombreEstado, type Estado } from "@/lib/tipos";
import { fechaCorta, formatoCOP } from "@/lib/fechas";
import { EstadoBadge, EntregaBadge, Cargando } from "@/components/ui";

interface Movimiento { id: number; usuario_nombre: string | null; accion: string; detalle: string | null; creado: string }
interface PedidoDetalle {
  id: number; codigo: string; producto: string; tipo: string; cantidad: number;
  cliente_id: number; cliente_nombre: string; cliente_telefono: string | null;
  vendedor_nombre: string | null; responsable_id: number | null; responsable_nombre: string | null;
  medidas: string | null; color_principal: string | null; color_secundario: string | null;
  especificaciones: string | null; precio: number | null; abono: number | null;
  fecha_inicio: string | null; fecha_entrega: string | null; estado: Estado;
  fotos: string[]; historial: Movimiento[];
}

export default function DetallePedidoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [p, setP] = useState<PedidoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState(false);
  const [fotoActiva, setFotoActiva] = useState(0);

  const cargar = useCallback(async () => {
    const res = await fetch(`/api/pedidos/${id}`);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "No se pudo cargar el pedido");
      return;
    }
    setP(await res.json());
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  async function cambiarEstado(estado: Estado) {
    if (!p || p.estado === estado) return;
    setCambiando(true);
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${p.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "No se pudo cambiar el estado");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCambiando(false);
    }
  }

  if (error && !p) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>
        <Link href="/pedidos" className="mt-4 inline-block text-sm text-[#35d6ff]">← Volver a pedidos</Link>
      </div>
    );
  }
  if (!p) return <Cargando />;

  const indiceEstado = ESTADOS.findIndex((e) => e.id === p.estado);
  const saldo = (p.precio ?? 0) - (p.abono ?? 0);
  const puedeEditarEstado = p.estado !== "entregado" && p.estado !== "cancelado";

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button onClick={() => router.back()} className="mb-2 text-xs text-[#9d97b8] hover:text-white">← Volver</button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-black text-[#35d6ff]">{p.codigo}</h1>
            <EstadoBadge estado={p.estado} />
            <EntregaBadge fecha={p.fecha_entrega} />
          </div>
          <p className="mt-2 text-lg font-semibold text-white">{p.producto} <span className="text-sm font-normal text-[#9d97b8]">× {p.cantidad}</span></p>
        </div>
        <div className="flex gap-2">
          <Link href={`/comanda/${p.id}`} className="btn-marca rounded-xl px-5 py-2.5 text-sm font-bold text-white">
            🖨️ Comanda PDF
          </Link>
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>}

      {/* avanzar estado */}
      {puedeEditarEstado && (
        <div className="tarjeta-brillo rounded-2xl p-5">
          <h2 className="font-display text-sm font-bold tracking-wide text-[#ffd400]">⚡ AVANZAR PRODUCCIÓN</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {ESTADOS.filter((e) => e.id !== "cancelado").map((e) => (
              <button key={e.id} onClick={() => cambiarEstado(e.id)} disabled={cambiando || e.id === p.estado}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:cursor-default ${
                  e.id === p.estado ? "border-transparent opacity-90" : "opacity-60 hover:opacity-100"}`}
                style={e.id === p.estado ? { borderColor: e.color, background: e.color + "22", color: e.color } : { borderColor: "rgba(154,79,255,0.35)", color: "#cfc9e8" }}>
                {e.emoji} {e.nombre}
              </button>
            ))}
            <button onClick={() => cambiarEstado("cancelado")} disabled={cambiando}
              className="rounded-xl border border-[rgba(255,92,122,0.4)] px-4 py-2 text-sm font-semibold text-[#ff5c7a] opacity-70 transition hover:opacity-100">
              ✖️ Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ficha técnica */}
        <div className="space-y-6 lg:col-span-3">
          <div className="tarjeta-brillo rounded-2xl p-6">
            <h2 className="font-display text-sm font-bold tracking-wide text-[#35d6ff]">📋 FICHA TÉCNICA</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-[#8b85a3]">Cliente</dt><dd className="font-medium text-white">{p.cliente_nombre} {p.cliente_telefono && <a href={`https://wa.me/57${p.cliente_telefono.replace(/\s/g, "")}`} target="_blank" rel="noreferrer" className="text-[#22dd88]">📱 {p.cliente_telefono}</a>}</dd></div>
              <div><dt className="text-xs text-[#8b85a3]">Vendedor</dt><dd className="text-[#cfc9e8]">{p.vendedor_nombre ?? "—"}</dd></div>
              <div><dt className="text-xs text-[#8b85a3]">Responsable taller</dt><dd className="text-[#cfc9e8]">{p.responsable_nombre ?? "—"}</dd></div>
              <div><dt className="text-xs text-[#8b85a3]">Tipo</dt><dd className="text-[#cfc9e8]">{p.tipo === "parlante" ? "🔊 Parlante personalizado" : p.tipo === "mini_turbo" ? "⚡ Mini Turbo" : "🔧 Otro"}</dd></div>
              <div><dt className="text-xs text-[#8b85a3]">Medidas</dt><dd className="text-[#cfc9e8]">{p.medidas ?? "—"}</dd></div>
              <div><dt className="text-xs text-[#8b85a3]">Colores</dt><dd className="text-[#cfc9e8]">{[p.color_principal, p.color_secundario].filter(Boolean).join(" + ") || "—"}</dd></div>
              <div><dt className="text-xs text-[#8b85a3]">Inicio</dt><dd className="text-[#cfc9e8]">{fechaCorta(p.fecha_inicio)}</dd></div>
              <div><dt className="text-xs text-[#8b85a3]">Entrega</dt><dd className="text-[#cfc9e8]">{fechaCorta(p.fecha_entrega)}</dd></div>
            </dl>
            {p.especificaciones && (
              <div className="mt-4 rounded-xl border border-[rgba(53,214,255,0.3)] bg-[rgba(53,214,255,0.06)] p-4">
                <p className="text-xs font-bold tracking-wide text-[#35d6ff]">ESPECIFICACIONES ESPECIALES</p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm text-[#e6e3f2]">{p.especificaciones}</p>
              </div>
            )}
          </div>

          {/* fotos */}
          <div className="tarjeta-brillo rounded-2xl p-6">
            <h2 className="font-display text-sm font-bold tracking-wide text-[#35d6ff]">📷 FOTOS DE REFERENCIA <span className="text-[#9d97b8]">({p.fotos.length})</span></h2>
            {p.fotos.length === 0 ? (
              <p className="mt-3 text-sm text-[#9d97b8]">Sin fotos adjuntas.</p>
            ) : (
              <>
                <motion.div layoutId="foto" className="mt-4 overflow-hidden rounded-2xl border border-[rgba(154,79,255,0.35)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.fotos[fotoActiva]} alt={`Referencia ${fotoActiva + 1}`} className="max-h-[380px] w-full cursor-pointer object-contain bg-[#0a0614]" />
                </motion.div>
                {p.fotos.length > 1 && (
                  <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
                    {p.fotos.map((f, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={f} alt="" onClick={() => setFotoActiva(i)}
                        className={`h-16 w-16 shrink-0 cursor-pointer rounded-xl object-cover transition ${i === fotoActiva ? "ring-2 ring-[#b04fff]" : "opacity-60 hover:opacity-100"}`} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* valores + timeline */}
        <div className="space-y-6 lg:col-span-2">
          <div className="tarjeta-brillo rounded-2xl p-6">
            <h2 className="font-display text-sm font-bold tracking-wide text-[#ffd400]">💵 VALORES</h2>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#9d97b8]">Precio</span><span className="font-bold text-white">{formatoCOP(p.precio)}</span></div>
              <div className="flex justify-between"><span className="text-[#9d97b8]">Abono</span><span className="text-[#22dd88]">− {formatoCOP(p.abono)}</span></div>
              <div className="flex justify-between border-t border-[rgba(154,79,255,0.25)] pt-2">
                <span className="text-[#9d97b8]">Saldo</span>
                <span className="font-display font-black text-[#ffd400]">{formatoCOP(saldo)}</span>
              </div>
            </div>
          </div>

          <div className="tarjeta-brillo rounded-2xl p-6">
            <h2 className="font-display text-sm font-bold tracking-wide text-[#9a4fff]">🕓 HISTORIAL DEL PEDIDO</h2>
            <div className="mt-4 space-y-0">
              {p.historial.map((m, i) => (
                <div key={m.id} className="relative pb-5 pl-6 last:pb-0">
                  {i < p.historial.length - 1 && <span className="absolute left-[7px] top-5 h-full w-0.5 bg-[rgba(154,79,255,0.3)]" />}
                  <span className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 ${i === p.historial.length - 1 ? "border-[#b04fff] bg-[#b04fff]" : "border-[rgba(154,79,255,0.5)] bg-[#130a26]"}`} />
                  <p className="text-sm font-semibold text-white">{m.accion}</p>
                  {m.detalle && <p className="mt-0.5 text-xs leading-relaxed text-[#9d97b8]">{m.detalle}</p>}
                  <p className="mt-1 text-[11px] text-[#6f6a86]">
                    {new Date(m.creado).toLocaleString("es-CO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

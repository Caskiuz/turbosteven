"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ESTADOS, type Estado } from "@/lib/tipos";
import { EntregaBadge, EstadoBadge, Cargando, Vacio } from "@/components/ui";
import { formatoCOP } from "@/lib/fechas";

interface Pedido {
  id: number; codigo: string; producto: string; cliente_nombre: string;
  estado: Estado; fecha_entrega: string | null; fotos: string[]; precio: number | null;
  especificaciones: string | null; medidas: string | null;
  color_principal: string | null; color_secundario: string | null;
}

/** Vista del taller: sus asignaciones con avance de estado a un clic. */
export default function TallerPage() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cambiando, setCambiando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch("/api/pedidos");
    if (res.ok) setPedidos(await res.json());
    else setError("No se pudieron cargar las asignaciones");
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function avanzar(p: Pedido, estado: Estado) {
    setCambiando(p.id);
    setError(null);
    try {
      const res = await fetch(`/api/pedidos/${p.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Error");
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCambiando(null);
    }
  }

  const siguienteEstado = (estado: Estado): Estado | null => {
    const flujo: Estado[] = ["pendiente", "en_fabricacion", "control_calidad", "listo"];
    const i = flujo.indexOf(estado);
    return i >= 0 && i < flujo.length - 1 ? flujo[i + 1] : null;
  };

  if (error && !pedidos) return <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>;
  if (!pedidos) return <Cargando />;

  const activos = pedidos.filter((p) => ["pendiente", "en_fabricacion", "control_calidad"].includes(p.estado));
  const porHacer = activos.sort((a, b) => (a.fecha_entrega ?? "9999").localeCompare(b.fecha_entrega ?? "9999"));
  const listos = pedidos.filter((p) => p.estado === "listo");

  return (
    <div className="mx-auto max-w-6xl space-y-7 pb-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Mis asignaciones 🛠️</h1>
        <p className="mt-1 text-sm text-[#9d97b8]">Comandas del taller ordenadas por fecha de entrega — avanza el estado con un clic.</p>
      </div>

      {error && <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="tarjeta-brillo rounded-2xl p-5 text-center">
          <p className="font-display text-4xl font-black text-[#35d6ff]">{activos.filter((p) => p.estado === "pendiente").length}</p>
          <p className="mt-1 text-xs text-[#9d97b8]">por iniciar</p>
        </div>
        <div className="tarjeta-brillo rounded-2xl p-5 text-center">
          <p className="font-display text-4xl font-black text-[#9a4fff]">{activos.filter((p) => p.estado === "en_fabricacion").length}</p>
          <p className="mt-1 text-xs text-[#9d97b8]">en fabricación</p>
        </div>
        <div className="tarjeta-brillo rounded-2xl p-5 text-center">
          <p className="font-display text-4xl font-black text-[#22dd88]">{listos.length}</p>
          <p className="mt-1 text-xs text-[#9d97b8]">listos para entrega</p>
        </div>
      </div>

      {porHacer.length === 0 && listos.length === 0 ? <Vacio texto="No tienes comandas asignadas por ahora. ¡Buen trabajo!" /> : (
        <div className="space-y-4">
          {porHacer.map((p) => {
            const sig = siguienteEstado(p.estado);
            return (
              <div key={p.id} className="tarjeta-brillo rounded-2xl p-5">
                <div className="flex flex-wrap items-start gap-4">
                  {p.fotos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.fotos[0]} alt="" className="h-20 w-20 rounded-xl object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/pedidos/${p.id}`} className="font-display font-bold text-[#35d6ff] hover:underline">{p.codigo}</Link>
                      <EstadoBadge estado={p.estado} tam="sm" />
                      <EntregaBadge fecha={p.fecha_entrega} />
                    </div>
                    <p className="mt-1.5 font-semibold text-white">{p.producto}</p>
                    <p className="text-xs text-[#9d97b8]">👤 {p.cliente_nombre} · 💵 {formatoCOP(p.precio)}</p>
                    {(p.medidas || p.color_principal) && (
                      <p className="mt-1 text-xs text-[#cfc9e8]">📐 {p.medidas ?? "—"} · 🎨 {[p.color_principal, p.color_secundario].filter(Boolean).join(" + ")}</p>
                    )}
                    {p.especificaciones && <p className="mt-1.5 line-clamp-2 text-xs text-[#b8b3cf]">📝 {p.especificaciones}</p>}
                  </div>
                  <div className="flex flex-col items-stretch gap-2 sm:min-w-[170px]">
                    {sig && (
                      <button onClick={() => avanzar(p, sig)} disabled={cambiando === p.id}
                        className="btn-marca rounded-xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">
                        {cambiando === p.id ? "…" : `→ Avanzar a ${sig.replace(/_/g, " ")}`}
                      </button>
                    )}
                    <div className="flex gap-2">
                      {sig && (
                        <button onClick={() => avanzar(p, "cancelado")} disabled={cambiando === p.id}
                          className="flex-1 rounded-lg border border-[rgba(255,92,122,0.35)] py-1.5 text-[11px] text-[#ff5c7a] transition hover:bg-[rgba(255,92,122,0.1)]">
                          Cancelar
                        </button>
                      )}
                      <Link href={`/comanda/${p.id}`} className="flex-1 rounded-lg border border-[rgba(154,79,255,0.35)] py-1.5 text-center text-[11px] text-[#cfc9e8] transition hover:bg-[rgba(154,79,255,0.1)]">
                        Ver comanda
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {listos.length > 0 && (
            <>
              <h2 className="font-display pt-4 text-lg font-bold text-[#22dd88]">✅ Listos para entregar</h2>
              {listos.map((p) => (
                <div key={p.id} className="tarjeta-brillo flex flex-wrap items-center gap-4 rounded-2xl p-5">
                  {p.fotos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.fotos[0]} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/pedidos/${p.id}`} className="font-display font-bold text-[#35d6ff] hover:underline">{p.codigo}</Link>
                    <p className="truncate text-sm text-white">{p.producto} · 👤 {p.cliente_nombre}</p>
                  </div>
                  <EstadoBadge estado="listo" tam="sm" />
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

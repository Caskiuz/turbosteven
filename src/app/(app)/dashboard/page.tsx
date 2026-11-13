"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ESTADOS, type Estado } from "@/lib/tipos";
import { formatoCOP, fechaCorta } from "@/lib/fechas";
import { TarjetaMetrica, TarjetaPedido, EstadoBadge, Cargando, Vacio, type PedidoCard } from "@/components/ui";

interface Pedido extends PedidoCard {
  vendedor_nombre: string | null;
  responsable_nombre: string | null;
  fecha_inicio: string | null;
  abono: number | null;
}

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/pedidos").then(async (r) => {
      if (!r.ok) throw new Error((await r.json()).error ?? "Error cargando pedidos");
      return r.json();
    }).then(setPedidos).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>;
  if (!pedidos) return <Cargando />;

  const activos = pedidos.filter((p) => ["pendiente", "en_fabricacion", "control_calidad"].includes(p.estado));
  const enFabricacion = pedidos.filter((p) => p.estado === "en_fabricacion");
  const listos = pedidos.filter((p) => p.estado === "listo");
  const vencidos = activos.filter((p) => p.fecha_entrega && new Date(p.fecha_entrega + "T23:59:59") < new Date());
  const valorTaller = activos.reduce((a, p) => a + (p.precio ?? 0) - (p.abono ?? 0), 0);

  const proximas = [...activos]
    .filter((p) => p.fecha_entrega)
    .sort((a, b) => (a.fecha_entrega ?? "").localeCompare(b.fecha_entrega ?? ""))
    .slice(0, 5);

  const ultimos = pedidos.slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Panel de producción</h1>
        <p className="mt-1 text-sm text-[#9d97b8]">Resumen del taller en tiempo real · {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaMetrica titulo="Pedidos activos" valor={activos.length} color="#35d6ff" icono="🔥" nota="pendientes + fabricación + calidad" />
        <TarjetaMetrica titulo="En fabricación" valor={enFabricacion.length} color="#9a4fff" icono="🛠️" />
        <TarjetaMetrica titulo="Listos para entrega" valor={listos.length} color="#22dd88" icono="✅" />
        <TarjetaMetrica titulo="Entregas vencidas" valor={vencidos.length} color="#ff5c7a" icono="⚠️" nota={vencidos.length ? "¡Revisar con el taller!" : "Todo a tiempo"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* producción por estado */}
        <div className="tarjeta-brillo rounded-2xl p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold text-white">Producción por estado</h2>
          <div className="mt-5 space-y-4">
            {ESTADOS.filter((e) => e.id !== "cancelado").map((e) => {
              const n = pedidos.filter((p) => p.estado === e.id).length;
              const pct = pedidos.length ? Math.round((n / pedidos.length) * 100) : 0;
              return (
                <div key={e.id}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#cfc9e8]">{e.emoji} {e.nombre}</span>
                    <span className="font-bold" style={{ color: e.color }}>{n} · {pct}%</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#1c1138]">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${e.color}88, ${e.color})` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 rounded-xl border border-[rgba(255,212,0,0.3)] bg-[rgba(255,212,0,0.06)] p-3">
            <p className="text-xs text-[#9d97b8]">Saldo por cobrar en pedidos activos</p>
            <p className="font-display mt-1 text-2xl font-black text-[#ffd400]">{formatoCOP(valorTaller)}</p>
          </div>
        </div>

        {/* próximas entregas */}
        <div className="tarjeta-brillo rounded-2xl p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-white">Próximas entregas</h2>
            <Link href="/pedidos" className="text-xs text-[#35d6ff] hover:underline">Ver todos →</Link>
          </div>
          {proximas.length === 0 ? (
            <p className="mt-6 text-sm text-[#9d97b8]">No hay entregas programadas.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {proximas.map((p) => (
                <Link key={p.id} href={`/pedidos/${p.id}`}
                  className="flex items-center gap-3 rounded-xl border border-[rgba(154,79,255,0.25)] bg-[rgba(28,17,56,0.5)] p-3 transition hover:border-[rgba(176,79,255,0.6)]">
                  {p.fotos?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.fotos[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs text-[#35d6ff]">{p.codigo} · {fechaCorta(p.fecha_entrega)}</p>
                    <p className="truncate text-sm font-medium text-white">{p.producto}</p>
                    <p className="truncate text-xs text-[#9d97b8]">{p.cliente_nombre} · {p.responsable_nombre ?? "sin asignar"}</p>
                  </div>
                  <EstadoBadge estado={p.estado} tam="sm" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* últimos pedidos */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">Últimas comandas</h2>
          <Link href="/pedidos" className="text-xs text-[#35d6ff] hover:underline">Ver todas →</Link>
        </div>
        {ultimos.length === 0 ? <Vacio texto="Aún no hay pedidos. Crea la primera comanda." /> : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {ultimos.map((p) => <TarjetaPedido key={p.id} p={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

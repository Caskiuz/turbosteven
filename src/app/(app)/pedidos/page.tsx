"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ESTADOS, type Estado } from "@/lib/tipos";
import { TarjetaPedido, Cargando, Vacio, EstadoBadge, EntregaBadge } from "@/components/ui";
import { formatoCOP } from "@/lib/fechas";

interface Pedido {
  id: number; codigo: string; producto: string; cliente_nombre: string;
  estado: Estado; fecha_entrega: string | null; fotos: string[];
  precio: number | null; abono: number | null; cantidad: number;
  responsable_nombre: string | null; vendedor_nombre: string | null;
}

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<Estado | "todos">("todos");
  const [vista, setVista] = useState<"kanban" | "lista">("kanban");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cargar = useCallback(async (busqueda: string, est: Estado | "todos") => {
    const p = new URLSearchParams();
    if (busqueda) p.set("q", busqueda);
    if (est !== "todos") p.set("estado", est);
    const res = await fetch("/api/pedidos?" + p.toString());
    if (res.ok) setPedidos(await res.json());
  }, []);

  useEffect(() => { cargar(q, estado); }, [q, estado, cargar]);

  // debounce para la búsqueda
  const [busquedaViva, setBusquedaViva] = useState("");
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setBusquedaViva(q), 350);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [q]);
  useEffect(() => { setEstado(estado); }, [estado]);

  if (pedidos === null) return <Cargando />;

  const filtrados = pedidos.filter((p) => {
    const okQ = !busquedaViva ||
      p.codigo.toLowerCase().includes(busquedaViva.toLowerCase()) ||
      p.cliente_nombre.toLowerCase().includes(busquedaViva.toLowerCase()) ||
      p.producto.toLowerCase().includes(busquedaViva.toLowerCase());
    return okQ;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Pedidos</h1>
          <p className="mt-1 text-sm text-[#9d97b8]">{filtrados.length} comanda{filtrados.length !== 1 ? "s" : ""} · arranca la producción con un clic</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-[rgba(154,79,255,0.35)] p-0.5">
            {(["kanban", "lista"] as const).map((v) => (
              <button key={v} onClick={() => setVista(v)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold capitalize transition ${vista === v ? "bg-[rgba(91,43,224,0.5)] text-white" : "text-[#b8b3cf]"}`}>
                {v === "kanban" ? "🗂️ Tablero" : "📃 Lista"}
              </button>
            ))}
          </div>
          <Link href="/pedidos/nuevo" className="btn-marca rounded-xl px-4 py-2.5 text-sm font-bold text-white">+ Nueva</Link>
        </div>
      </div>

      {/* buscador + filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por código, cliente o producto…"
          className="campo max-w-sm flex-1" />
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setEstado("todos")}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${estado === "todos" ? "border-[#b04fff] bg-[rgba(176,79,255,0.2)] text-white" : "border-[rgba(154,79,255,0.3)] text-[#b8b3cf] hover:text-white"}`}>
            Todos
          </button>
          {ESTADOS.map((e) => (
            <button key={e.id} onClick={() => setEstado(e.id)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${estado === e.id ? "text-white" : "text-[#b8b3cf] hover:text-white"}`}
              style={estado === e.id ? { borderColor: e.color, background: e.color + "26" } : { borderColor: "rgba(154,79,255,0.3)" }}>
              {e.emoji} {e.nombre}
            </button>
          ))}
        </div>
      </div>

      {filtrados.length === 0 ? <Vacio texto="No se encontraron pedidos con esos filtros." /> :
        vista === "kanban" ? (
          <div className="grid gap-4 overflow-x-auto pb-4 md:grid-cols-3 xl:grid-cols-5">
            {ESTADOS.filter((e) => e.id !== "cancelado").map((e) => {
              const deEstado = filtrados.filter((p) => p.estado === e.id);
              return (
                <div key={e.id} className="min-w-[230px]">
                  <div className="mb-3 flex items-center justify-between rounded-xl border px-3.5 py-2.5"
                    style={{ borderColor: e.color + "55", background: e.color + "12" }}>
                    <span className="text-sm font-bold" style={{ color: e.color }}>{e.emoji} {e.nombre}</span>
                    <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: e.color + "25", color: e.color }}>{deEstado.length}</span>
                  </div>
                  <div className="space-y-3">
                    {deEstado.map((p) => <TarjetaPedido key={p.id} p={p} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="tarjeta-brillo overflow-hidden rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(154,79,255,0.25)] text-xs uppercase tracking-wide text-[#8b85a3]">
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3">Entrega</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr key={p.id} className="border-b border-[rgba(154,79,255,0.12)] transition hover:bg-[rgba(154,79,255,0.08)]">
                      <td className="px-4 py-3">
                        <Link href={`/pedidos/${p.id}`} className="font-display font-bold text-[#35d6ff] hover:underline">{p.codigo}</Link>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-white">{p.producto}</td>
                      <td className="px-4 py-3 text-[#cfc9e8]">{p.cliente_nombre}</td>
                      <td className="px-4 py-3 text-[#cfc9e8]">{p.responsable_nombre ?? "—"}</td>
                      <td className="px-4 py-3"><EntregaBadge fecha={p.fecha_entrega} /></td>
                      <td className="px-4 py-3 font-bold text-[#ffd400]">{formatoCOP(p.precio)}</td>
                      <td className="px-4 py-3"><EstadoBadge estado={p.estado} tam="sm" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
    </div>
  );
}

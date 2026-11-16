"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ESTADOS, type Estado } from "@/lib/tipos";
import { Cargando, Vacio, EstadoBadge } from "@/components/ui";
import { fechaCorta, formatoCOP } from "@/lib/fechas";

interface Pedido {
  id: number; codigo: string; producto: string; cliente_nombre: string;
  estado: Estado; fecha_entrega: string | null; precio: number | null;
  vendedor_nombre: string | null; creado: string;
}

/** Historial completo de pedidos con filtros — auditoría de producción. */
export default function HistorialPage() {
  const [todos, setTodos] = useState<Pedido[] | null>(null);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState<Estado | "todos">("todos");

  const cargar = useCallback(async () => {
    const res = await fetch("/api/pedidos");
    if (res.ok) setTodos(await res.json());
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (todos === null) return <Cargando />;

  const filtrados = todos.filter((p) => {
    const okQ = !q ||
      p.codigo.toLowerCase().includes(q.toLowerCase()) ||
      p.cliente_nombre.toLowerCase().includes(q.toLowerCase()) ||
      p.producto.toLowerCase().includes(q.toLowerCase());
    const okE = estado === "todos" || p.estado === estado;
    return okQ && okE;
  });

  const entregados = todos.filter((p) => p.estado === "entregado");
  const totalVendido = entregados.reduce((a, p) => a + (p.precio ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Historial de pedidos 🕓</h1>
        <p className="mt-1 text-sm text-[#9d97b8]">
          {todos.length} comandas totales · {entregados.length} entregadas · {formatoCOP(totalVendido)} facturados
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input className="campo max-w-sm flex-1" placeholder="Buscar código, cliente o producto…" value={q} onChange={(e) => setQ(e.target.value)} />
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

      {filtrados.length === 0 ? <Vacio texto="No hay pedidos en el historial con esos filtros." /> : (
        <>
        {/* móvil: tarjetas */}
        <div className="space-y-2.5 lg:hidden">
          {filtrados.map((p) => (
            <div key={p.id} className="tarjeta-brillo rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <Link href={`/pedidos/${p.id}`} className="font-display text-sm font-bold text-[#35d6ff]">{p.codigo}</Link>
                <EstadoBadge estado={p.estado} tam="sm" />
              </div>
              <p className="mt-1 truncate text-sm font-semibold text-white">{p.producto}</p>
              <p className="text-xs text-[#9d97b8]">👤 {p.cliente_nombre} · {p.vendedor_nombre ?? "—"}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[#8b85a3]">📅 {fechaCorta(p.fecha_entrega ?? p.creado)}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#ffd400]">{formatoCOP(p.precio)}</span>
                  <Link href={`/comanda/${p.id}`} className="rounded-lg border border-[rgba(154,79,255,0.4)] px-2.5 py-1 text-[11px] text-[#cfc9e8]">🧾 PDF</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* escritorio: tabla */}
        <div className="tarjeta-brillo hidden overflow-hidden rounded-2xl lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(154,79,255,0.25)] text-xs uppercase tracking-wide text-[#8b85a3]">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Vendedor</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Comanda</th>
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
                    <td className="px-4 py-3 text-[#9d97b8]">{p.vendedor_nombre ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-[#8b85a3]">{fechaCorta(p.fecha_entrega ?? p.creado)}</td>
                    <td className="px-4 py-3 font-bold text-[#ffd400]">{formatoCOP(p.precio)}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={p.estado} tam="sm" /></td>
                    <td className="px-4 py-3">
                      <Link href={`/comanda/${p.id}`} className="rounded-lg border border-[rgba(154,79,255,0.4)] px-3 py-1.5 text-xs text-[#cfc9e8] transition hover:bg-[rgba(154,79,255,0.12)]">
                        🧾 PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}
    </div>
  );
}

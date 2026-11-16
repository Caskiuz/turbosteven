"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cargando, Vacio } from "@/components/ui";
import { fechaCorta } from "@/lib/fechas";

interface Cliente {
  id: number; nombre: string; telefono: string; direccion: string | null;
  notas: string | null; creado: string; pedidos: number;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[] | null>(null);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: "", telefono: "", direccion: "", notas: "" });

  const cargar = useCallback(async () => {
    const res = await fetch("/api/clientes");
    if (res.ok) setClientes(await res.json());
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function crear() {
    setError(null);
    const res = await fetch("/api/clientes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setModal(false);
      setForm({ nombre: "", telefono: "", direccion: "", notas: "" });
      await cargar();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "No se pudo crear el cliente");
    }
  }

  const filtrados = (clientes ?? []).filter((c) =>
    !q || c.nombre.toLowerCase().includes(q.toLowerCase()) || c.telefono.includes(q)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Clientes</h1>
          <p className="mt-1 text-sm text-[#9d97b8]">{clientes?.length ?? "…"} registrados · historial de compras a un clic</p>
        </div>
        <div className="flex gap-2">
          <input className="campo max-w-xs flex-1" placeholder="Buscar nombre o teléfono…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button onClick={() => setModal(true)} className="btn-marca shrink-0 rounded-xl px-5 py-2.5 text-sm font-bold text-white">+ Nuevo</button>
        </div>
      </div>

      {clientes === null ? <Cargando /> : filtrados.length === 0 ? <Vacio texto="No hay clientes que coincidan." /> : (
        <>
        {/* móvil: tarjetas */}
        <div className="space-y-2.5 lg:hidden">
          {filtrados.map((c) => (
            <div key={c.id} className="tarjeta-brillo rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold text-white">{c.nombre}</p>
                <span className="shrink-0 rounded-full bg-[rgba(53,214,255,0.15)] px-2.5 py-0.5 text-xs font-bold text-[#35d6ff]">{c.pedidos} pedido(s)</span>
              </div>
              <a href={`https://wa.me/57${c.telefono.replace(/\s/g, "")}`} target="_blank" rel="noreferrer" className="mt-1.5 inline-block text-sm text-[#22dd88]">📱 {c.telefono}</a>
              {c.direccion && <p className="mt-1 text-xs text-[#9d97b8]">📍 {c.direccion}</p>}
              {c.notas && <p className="mt-1 text-xs text-[#8b85a3]">📝 {c.notas}</p>}
            </div>
          ))}
        </div>
        {/* escritorio: tabla */}
        <div className="tarjeta-brillo hidden overflow-hidden rounded-2xl lg:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(154,79,255,0.25)] text-xs uppercase tracking-wide text-[#8b85a3]">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Dirección</th>
                  <th className="px-4 py-3">Notas</th>
                  <th className="px-4 py-3 text-center">Pedidos</th>
                  <th className="px-4 py-3">Desde</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c) => (
                  <tr key={c.id} className="border-b border-[rgba(154,79,255,0.12)] transition hover:bg-[rgba(154,79,255,0.08)]">
                    <td className="px-4 py-3 font-semibold text-white">{c.nombre}</td>
                    <td className="px-4 py-3">
                      <a href={`https://wa.me/57${c.telefono.replace(/\s/g, "")}`} target="_blank" rel="noreferrer" className="text-[#22dd88] hover:underline">
                        📱 {c.telefono}
                      </a>
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-[#cfc9e8]">{c.direccion ?? "—"}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-[#9d97b8]">{c.notas ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-[rgba(53,214,255,0.15)] px-2.5 py-0.5 text-xs font-bold text-[#35d6ff]">{c.pedidos}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8b85a3]">{fechaCorta(c.creado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* modal crear cliente */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal(false)}>
          <div className="tarjeta-brillo w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-white">Nuevo cliente</h2>
            <div className="mt-4 space-y-3">
              <input className="campo" placeholder="Nombre completo *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <input className="campo" placeholder="Teléfono / WhatsApp *" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              <input className="campo" placeholder="Dirección" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
              <textarea className="campo" rows={2} placeholder="Notas (preferencias, historial…)" value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} />
              {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300">{error}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={crear} className="btn-marca flex-1 rounded-xl py-2.5 font-bold text-white">Guardar cliente</button>
              <button onClick={() => setModal(false)} className="rounded-xl border border-[rgba(154,79,255,0.4)] px-5 text-sm text-[#b8b3cf]">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Cargando } from "@/components/ui";
import { formatoCOP } from "@/lib/fechas";

interface Movimiento {
  fecha: string; tipo: "Venta" | "Abono"; codigo: string; pedido_id: number;
  cliente: string; detalle: string; monto: number;
}
interface FilaMayor {
  cliente: string; telefono: string; pedidos: number; activos: number;
  facturado: number; cobrado: number; saldo: number;
}
interface Contabilidad {
  resumen: { facturado: number; cobrado: number; porCobrar: number; pedidos: number; cancelados: number; canceladoMonto: number };
  diario: Movimiento[];
  mayor: FilaMayor[];
}

const fechaCorta = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ContabilidadPage() {
  const [datos, setDatos] = useState<Contabilidad | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"resumen" | "diario" | "mayor">("resumen");

  const cargar = useCallback(async () => {
    const res = await fetch("/api/contabilidad");
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "No se pudo cargar la contabilidad");
      return;
    }
    setDatos(await res.json());
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  if (error) return <p className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>;
  if (!datos) return <Cargando />;

  const r = datos.resumen;

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Libro contable 📒</h1>
        <p className="mt-1 text-sm text-[#9d97b8]">Toda la contabilidad del negocio: ventas, abonos y saldos por cliente, actualizados al instante.</p>
      </div>

      {/* pestañas */}
      <div className="flex overflow-x-auto rounded-xl border border-[rgba(154,79,255,0.35)] p-0.5">
        {([
          ["resumen", "📊 Resumen"],
          ["diario", "📜 Libro diario"],
          ["mayor", "👤 Mayor por cliente"],
        ] as const).map(([id, texto]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition ${tab === id ? "bg-[rgba(91,43,224,0.5)] text-white" : "text-[#b8b3cf]"}`}>
            {texto}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {tab === "resumen" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { t: "Total facturado", v: r.facturado, c: "#35d6ff", i: "🧾", n: `${r.pedidos} comandas` },
              { t: "Cobrado", v: r.cobrado, c: "#22dd88", i: "💵", n: "abonos recibidos" },
              { t: "Por cobrar", v: r.porCobrar, c: "#ffd400", i: "⏳", n: "saldo pendiente" },
              { t: "Cancelados", v: r.canceladoMonto, c: "#ff5c7a", i: "✖️", n: `${r.cancelados} pedidos anulados` },
            ].map((m) => (
              <div key={m.t} className="tarjeta-brillo rounded-2xl p-4 md:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-[#9d97b8] md:text-xs">{m.t}</span>
                  <span>{m.i}</span>
                </div>
                <p className="font-display mt-1.5 text-xl font-black md:text-3xl" style={{ color: m.c }}>{formatoCOP(m.v)}</p>
                <p className="mt-0.5 text-[10px] text-[#8b93a5] md:text-xs">{m.n}</p>
              </div>
            ))}
          </div>
          <div className="tarjeta-brillo rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold text-white">Cómo leer tu libro contable</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#b8b3cf]">
              <li>🧾 <b className="text-white">Libro diario:</b> cada comanda registrada es una venta; cada abono es un ingreso. Van en orden cronológico.</li>
              <li>👤 <b className="text-white">Mayor por cliente:</b> cuánto ha comprado, cuánto ha pagado y cuánto debe cada cliente.</li>
              <li>✖️ Los pedidos cancelados no afectan los saldos por cobrar, pero quedan visibles para la auditoría.</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── LIBRO DIARIO ── */}
      {tab === "diario" && (
        <div className="space-y-4">
          {/* móvil: tarjetas */}
          <div className="space-y-2.5 lg:hidden">
            {datos.diario.map((m, i) => (
              <Link key={i} href={`/pedidos/${m.pedido_id}`}
                className="tarjeta-brillo flex items-center gap-3 rounded-2xl p-3.5">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${
                  m.tipo === "Venta" ? "bg-[rgba(53,214,255,0.15)]" : "bg-[rgba(34,221,136,0.15)]"}`}>
                  {m.tipo === "Venta" ? "🧾" : "💵"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-xs text-[#35d6ff]">{m.codigo} · {fechaCorta(m.fecha)}</p>
                  <p className="truncate text-sm font-medium text-white">{m.cliente}</p>
                  <p className="truncate text-xs text-[#9d97b8]">{m.tipo}: {m.detalle}</p>
                </div>
                <span className={`shrink-0 text-sm font-bold ${m.tipo === "Venta" ? "text-[#35d6ff]" : "text-[#22dd88]"}`}>
                  {m.tipo === "Venta" ? "+" : "− "}{formatoCOP(m.monto)}
                </span>
              </Link>
            ))}
          </div>
          {/* escritorio: tabla */}
          <div className="tarjeta-brillo hidden overflow-hidden rounded-2xl lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(154,79,255,0.25)] text-xs uppercase tracking-wide text-[#8b85a3]">
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Comanda</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Detalle</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {datos.diario.map((m, i) => (
                  <tr key={i} className="border-b border-[rgba(154,79,255,0.12)] transition hover:bg-[rgba(154,79,255,0.08)]">
                    <td className="px-4 py-3 text-xs text-[#8b85a3]">{fechaCorta(m.fecha)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        m.tipo === "Venta" ? "bg-[rgba(53,214,255,0.15)] text-[#35d6ff]" : "bg-[rgba(34,221,136,0.15)] text-[#22dd88]"}`}>
                        {m.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/pedidos/${m.pedido_id}`} className="font-display font-bold text-[#35d6ff] hover:underline">{m.codigo}</Link>
                    </td>
                    <td className="px-4 py-3 text-[#cfc9e8]">{m.cliente}</td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-[#9d97b8]">{m.detalle}</td>
                    <td className={`px-4 py-3 text-right font-bold ${m.tipo === "Venta" ? "text-[#35d6ff]" : "text-[#22dd88]"}`}>
                      {m.tipo === "Venta" ? "+" : "− "}{formatoCOP(m.monto)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MAYOR POR CLIENTE ── */}
      {tab === "mayor" && (
        <div className="space-y-4">
          {/* móvil: tarjetas */}
          <div className="space-y-2.5 lg:hidden">
            {datos.mayor.map((m) => (
              <div key={m.cliente} className="tarjeta-brillo rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-semibold text-white">👤 {m.cliente}</p>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    m.saldo > 0 ? "bg-[rgba(255,212,0,0.12)] text-[#ffd400]" : "bg-[rgba(34,221,136,0.12)] text-[#22dd88]"}`}>
                    {m.saldo > 0 ? "saldo pendiente" : "al día"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[rgba(28,17,56,0.6)] p-2">
                    <p className="text-[10px] text-[#8b85a3]">Facturado</p>
                    <p className="text-xs font-bold text-[#35d6ff]">{formatoCOP(m.facturado)}</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(28,17,56,0.6)] p-2">
                    <p className="text-[10px] text-[#8b85a3]">Cobrado</p>
                    <p className="text-xs font-bold text-[#22dd88]">{formatoCOP(m.cobrado)}</p>
                  </div>
                  <div className="rounded-xl bg-[rgba(28,17,56,0.6)] p-2">
                    <p className="text-[10px] text-[#8b85a3]">Saldo</p>
                    <p className="text-xs font-bold text-[#ffd400]">{formatoCOP(m.saldo)}</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-[#9d97b8]">{m.pedidos} pedido(s) · {m.activos} activo(s) · 📱 {m.telefono}</p>
              </div>
            ))}
          </div>
          {/* escritorio: tabla */}
          <div className="tarjeta-brillo hidden overflow-hidden rounded-2xl lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(154,79,255,0.25)] text-xs uppercase tracking-wide text-[#8b85a3]">
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3 text-center">Pedidos</th>
                  <th className="px-4 py-3 text-center">Activos</th>
                  <th className="px-4 py-3 text-right">Facturado</th>
                  <th className="px-4 py-3 text-right">Cobrado</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {datos.mayor.map((m) => (
                  <tr key={m.cliente} className="border-b border-[rgba(154,79,255,0.12)] transition hover:bg-[rgba(154,79,255,0.08)]">
                    <td className="px-4 py-3 font-semibold text-white">{m.cliente}</td>
                    <td className="px-4 py-3">
                      <a href={`https://wa.me/57${m.telefono.replace(/\s/g, "")}`} target="_blank" rel="noreferrer" className="text-[#22dd88]">📱 {m.telefono}</a>
                    </td>
                    <td className="px-4 py-3 text-center text-[#cfc9e8]">{m.pedidos}</td>
                    <td className="px-4 py-3 text-center text-[#cfc9e8]">{m.activos}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#35d6ff]">{formatoCOP(m.facturado)}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#22dd88]">{formatoCOP(m.cobrado)}</td>
                    <td className={`px-4 py-3 text-right font-bold ${m.saldo > 0 ? "text-[#ffd400]" : "text-[#22dd88]"}`}>{formatoCOP(m.saldo)}</td>
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

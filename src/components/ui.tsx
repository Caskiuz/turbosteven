"use client";

import Link from "next/link";
import { ESTADOS, nombreEstado, colorEstado, type Estado } from "@/lib/tipos";
import { fechaCorta, etiquetaEntrega, formatoCOP } from "@/lib/fechas";

export function EstadoBadge({ estado, tam = "md" }: { estado: Estado; tam?: "sm" | "md" }) {
  const c = colorEstado(estado);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${tam === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"}`}
      style={{ borderColor: c + "66", background: c + "1a", color: c }}>
      <i className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
      {nombreEstado(estado)}
    </span>
  );
}

export function EntregaBadge({ fecha }: { fecha: string | null }) {
  const { texto, tono } = etiquetaEntrega(fecha);
  const tonos: Record<string, string> = {
    ok: "border-[rgba(74,222,128,0.5)] bg-[rgba(74,222,128,0.1)] text-green-300",
    warn: "border-[rgba(255,212,0,0.5)] bg-[rgba(255,212,0,0.1)] text-[#ffd400]",
    danger: "border-[rgba(255,92,122,0.5)] bg-[rgba(255,92,122,0.12)] text-[#ff5c7a]",
    muted: "border-[rgba(139,147,165,0.4)] bg-transparent text-[#8b93a5]",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${tonos[tono]}`}>
      📅 {texto}{fecha ? ` · ${fechaCorta(fecha)}` : ""}
    </span>
  );
}

export interface PedidoCard {
  id: number; codigo: string; producto: string; cliente_nombre: string;
  estado: Estado; fecha_entrega: string | null; fotos: string[]; precio: number | null; cantidad: number;
}

export function TarjetaPedido({ p }: { p: PedidoCard }) {
  const foto = p.fotos?.[0];
  return (
    <Link href={`/pedidos/${p.id}`}
      className="tarjeta-brillo efecto-hover-tarjeta block overflow-hidden rounded-2xl">
      {foto && (
        <div className="relative h-24 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={foto} alt="" className="h-full w-full object-cover" />
          <span className="font-display absolute left-2 top-2 rounded-lg bg-[#0a0614]/85 px-2 py-1 text-[11px] font-bold text-[#35d6ff]">
            {p.codigo}
          </span>
          {p.fotos.length > 1 && (
            <span className="absolute bottom-2 right-2 rounded-md bg-[#0a0614]/85 px-2 py-0.5 text-[10px] text-[#b8b3cf]">
              📷 {p.fotos.length}
            </span>
          )}
        </div>
      )}
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{p.producto}</p>
            <p className="mt-0.5 truncate text-xs text-[#9d97b8]">👤 {p.cliente_nombre}</p>
          </div>
          <EstadoBadge estado={p.estado} tam="sm" />
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <EntregaBadge fecha={p.fecha_entrega} />
          <span className="text-xs font-bold text-[#ffd400]">{formatoCOP(p.precio)}</span>
        </div>
      </div>
    </Link>
  );
}

export function TarjetaMetrica({ titulo, valor, color, icono, nota }: { titulo: string; valor: string | number; color: string; icono: string; nota?: string }) {
  return (
    <div className="tarjeta-brillo efecto-hover-tarjeta rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-[#9d97b8]">{titulo}</span>
        <span className="text-xl">{icono}</span>
      </div>
      <p className="font-display mt-2 text-3xl font-black" style={{ color }}>{valor}</p>
      {nota && <p className="mt-1 text-xs text-[#8b93a5]">{nota}</p>}
    </div>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <div className="tarjeta-brillo rounded-2xl py-14 text-center">
      <p className="text-3xl">📭</p>
      <p className="mt-3 text-sm text-[#9d97b8]">{texto}</p>
    </div>
  );
}

export function Cargando() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[rgba(154,79,255,0.2)] border-t-[#b04fff]" />
    </div>
  );
}

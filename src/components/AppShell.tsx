"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export interface SesionUI { id: number; nombre: string; rol: "admin" | "vendedor" | "taller" }

const ETIQUETA_ROL: Record<string, { nombre: string; color: string }> = {
  admin: { nombre: "Administrador", color: "#FFD400" },
  vendedor: { nombre: "Vendedor", color: "#35D6FF" },
  taller: { nombre: "Taller", color: "#9A4FFF" },
};

export default function AppShell({ sesion, children }: { sesion: SesionUI; children: React.ReactNode }) {
  const ruta = usePathname();
  const router = useRouter();
  const [saliendo, setSaliendo] = useState(false);

  const esTaller = sesion.rol === "taller";
  const esAdmin = sesion.rol === "admin";

  const items = esTaller
    ? [
        { href: "/taller", icono: "🛠️", texto: "Mis asignaciones" },
        { href: "/pedidos", icono: "📋", texto: "Pedidos" },
      ]
    : [
        { href: "/dashboard", icono: "📊", texto: "Dashboard" },
        { href: "/pedidos", icono: "📋", texto: "Pedidos" },
        { href: "/clientes", icono: "👥", texto: "Clientes" },
        { href: "/historial", icono: "🕓", texto: "Historial" },
        ...(esAdmin ? [{ href: "/usuarios", icono: "🔐", texto: "Usuarios" }] : []),
      ];

  const activo = (href: string) => ruta === href || ruta.startsWith(href + "/") || (href === "/pedidos" && ruta.startsWith("/comanda"));

  async function salir() {
    setSaliendo(true);
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  }

  const rol = ETIQUETA_ROL[sesion.rol];

  return (
    <div className="min-h-[100svh] bg-[#0a0614]">
      {/* ===== sidebar escritorio ===== */}
      <aside className="no-imprimir fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[rgba(154,79,255,0.25)] bg-[#130a26] lg:flex">
        <Link href="/" className="flex items-center gap-2.5 border-b border-[rgba(154,79,255,0.2)] px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ts-icon-white.png" alt="" className="h-8 w-auto" />
          <div>
            <p className="font-display text-xs font-extrabold tracking-[0.15em] text-white">TURBO STEVEN</p>
            <p className="text-[10px] tracking-[0.3em] text-[#9a4fff]">AUDIO · COMANDAS</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((it) => (
            <Link key={it.href} href={it.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition ${
                activo(it.href)
                  ? "border border-[rgba(176,79,255,0.5)] bg-[rgba(91,43,224,0.35)] font-semibold text-white"
                  : "text-[#b8b3cf] hover:bg-[rgba(154,79,255,0.12)] hover:text-white"
              }`}>
              <span>{it.icono}</span> {it.texto}
            </Link>
          ))}
          {!esTaller && (
            <Link href="/pedidos/nuevo"
              className="btn-marca mt-4 block rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white">
              + Nueva comanda
            </Link>
          )}
        </nav>

        <div className="border-t border-[rgba(154,79,255,0.2)] p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-[#130a26]"
              style={{ background: `linear-gradient(135deg, ${rol.color}, #b04fff)` }}>
              {sesion.nombre.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{sesion.nombre}</p>
              <p className="text-[11px]" style={{ color: rol.color }}>{rol.nombre}</p>
            </div>
          </div>
          <button onClick={salir} disabled={saliendo}
            className="mt-3 w-full rounded-lg border border-[rgba(255,92,122,0.4)] py-2 text-xs text-[#ff5c7a] transition hover:bg-[rgba(255,92,122,0.12)] disabled:opacity-50">
            {saliendo ? "Saliendo…" : "Cerrar sesión"}
          </button>
        </div>
      </aside>

      {/* ===== header móvil ===== */}
      <header className="no-imprimir fixed inset-x-0 top-0 z-40 flex items-center justify-between border-b border-[rgba(154,79,255,0.25)] bg-[#130a26]/95 px-4 py-2.5 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ts-icon-white.png" alt="" className="h-7 w-auto" />
          <span className="font-display text-xs font-extrabold tracking-[0.15em] text-white">TURBO STEVEN AUDIO</span>
        </Link>
        <button onClick={salir} disabled={saliendo} className="rounded-lg border border-[rgba(255,92,122,0.4)] px-3 py-1.5 text-xs text-[#ff5c7a]" aria-label="Cerrar sesión">
          Salir
        </button>
      </header>

      {/* ===== tab bar móvil ===== */}
      <nav className="no-imprimir fixed inset-x-0 bottom-0 z-40 flex border-t border-[rgba(154,79,255,0.25)] bg-[#130a26]/95 backdrop-blur lg:hidden">
        {items.map((it) => (
          <Link key={it.href} href={it.href}
            className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${activo(it.href) ? "text-white" : "text-[#8b85a3]"}`}>
            <span className="text-lg">{it.icono}</span>
            {it.texto}
          </Link>
        ))}
        {!esTaller && (
          <Link href="/pedidos/nuevo" className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] ${ruta === "/pedidos/nuevo" ? "text-white" : "text-[#8b85a3]"}`}>
            <span className="text-lg">➕</span> Nuevo
          </Link>
        )}
      </nav>

      {/* ===== contenido ===== */}
      <div className="lg:pl-60">
        <main className="px-4 pb-24 pt-16 md:px-8 lg:pb-10 lg:pt-8">{children}</main>
      </div>
    </div>
  );
}

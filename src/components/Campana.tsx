"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Notificacion {
  id: number; titulo: string; mensaje: string | null; tipo: string;
  enlace: string | null; leida: boolean; creado: string;
}

const ICONO_TIPO: Record<string, string> = { info: "🔔", alerta: "⚡", exito: "✅" };

const haceCuanto = (iso: string) => {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const horas = Math.floor(mins / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return `hace ${dias} día${dias !== 1 ? "s" : ""}`;
};

/** Campana de notificaciones con insignia de no leídas y panel desplegable.
 *  Sondea cada 30 segundos para que cada rol vea los cambios al instante. */
export default function Campana() {
  const [lista, setLista] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/notificaciones");
      if (!res.ok) return;
      const d = await res.json();
      setLista(d.lista ?? []);
      setNoLeidas(d.no_leidas ?? 0);
    } catch { /* silencioso */ }
  }, []);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 30000);
    return () => clearInterval(t);
  }, [cargar]);

  useEffect(() => {
    const fuera = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener("mousedown", fuera);
    return () => document.removeEventListener("mousedown", fuera);
  }, []);

  async function marcarTodas() {
    await fetch("/api/notificaciones", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ todas: true }),
    });
    cargar();
  }

  async function abrir(n: Notificacion) {
    if (!n.leida) {
      await fetch("/api/notificaciones", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      });
      setNoLeidas((c) => Math.max(0, c - 1));
      setLista((ls) => ls.map((x) => (x.id === n.id ? { ...x, leida: true } : x)));
    }
    setAbierto(false);
    if (n.enlace) router.push(n.enlace);
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setAbierto((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-[rgba(154,79,255,0.35)] text-lg transition hover:border-[#b04fff]"
        aria-label="Notificaciones">
        🔔
        {noLeidas > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff5c7a] px-1 text-[10px] font-bold text-white shadow-lg">
            {noLeidas > 9 ? "9+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-x-3 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-[rgba(154,79,255,0.4)] bg-[#130a26]/97 shadow-2xl backdrop-blur-xl md:absolute md:inset-x-auto md:left-0 md:top-12 md:w-[360px]">
          <div className="sticky top-0 flex items-center justify-between border-b border-[rgba(154,79,255,0.25)] bg-[#130a26] px-4 py-3">
            <p className="font-display text-sm font-bold text-white">Notificaciones</p>
            {noLeidas > 0 && (
              <button onClick={marcarTodas} className="text-xs text-[#35d6ff] hover:underline">
                Marcar todas leídas
              </button>
            )}
          </div>
          {lista.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-[#8b85a3]">🔕 Sin notificaciones por ahora.<br />Los cambios de producción aparecerán aquí.</p>
          ) : (
            <div className="divide-y divide-[rgba(154,79,255,0.15)]">
              {lista.map((n) => (
                <button key={n.id} onClick={() => abrir(n)}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition hover:bg-[rgba(154,79,255,0.12)] ${n.leida ? "opacity-60" : ""}`}>
                  <span className="text-lg">{ICONO_TIPO[n.tipo] ?? "🔔"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className={`truncate text-sm ${n.leida ? "text-[#b8b3cf]" : "font-semibold text-white"}`}>{n.titulo}</span>
                      {!n.leida && <i className="h-2 w-2 shrink-0 rounded-full bg-[#b04fff]" />}
                    </span>
                    {n.mensaje && <span className="mt-0.5 block text-xs leading-relaxed text-[#9d97b8]">{n.mensaje}</span>}
                    <span className="mt-1 block text-[10px] text-[#6f6a86]">{haceCuanto(n.creado)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

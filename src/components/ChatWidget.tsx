"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Steven IA — widget flotante de chat con streaming SSE desde /api/chat.
 * Disponible en toda la web: landing y sistema.
 */

interface Mensaje { rol: "user" | "model"; texto: string }

const SUGERENCIAS = [
  "¿Cuánto cuesta un parlante personalizado?",
  "¿Cómo aparto un pedido?",
  "¿En qué va el pedido TSA-0004?",
  "¿Qué incluye el Mini Turbo?",
];

export default function ChatWidget() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [parcial, setParcial] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, parcial, escribiendo, abierto]);

  async function enviar(msg: string) {
    const limpio = msg.trim();
    if (!limpio || escribiendo) return;
    setError(null);
    setTexto("");
    const historial = mensajes.slice(-10).map((m) => ({
      role: m.rol,
      parts: [{ text: m.texto }],
    }));
    setMensajes((ms) => [...ms, { rol: "user", texto: limpio }]);
    setEscribiendo(true);
    setParcial(null);
    let acumulado = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: limpio, historial }),
      });
      if (!res.body) throw new Error("sin respuesta");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const bloques = buffer.split(/\r?\n\r?\n/);
        buffer = bloques.pop() ?? "";
        for (const b of bloques) {
          const linea = b.split(/\r?\n/).find((l) => l.startsWith("data:"));
          if (!linea) continue;
          const ev = JSON.parse(linea.slice(5));
          if (ev.t === "d") {
            acumulado += ev.v;
            setParcial(acumulado);
          } else if (ev.t === "tool") {
            setMensajes((ms) => [...ms, { rol: "model", texto: "⚙️ " + ev.v }]);
          } else if (ev.t === "err") {
            setError(ev.v);
          }
        }
      }
      if (acumulado) setMensajes((ms) => [...ms, { rol: "model", texto: acumulado }]);
      setParcial(null);
    } catch {
      setError("No pude conectar con Steven IA en este momento.");
    } finally {
      setEscribiendo(false);
    }
  }

  return (
    <>
      {/* botón flotante */}
      <motion.button
        initial={{ scale: 0, rotate: -30 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
        onClick={() => setAbierto((v) => !v)}
        className="no-imprimir fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl md:h-16 md:w-16"
        style={{ background: "linear-gradient(135deg,#5b2be0,#b04fff)" }}
        aria-label="Abrir chat con Steven IA"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/ts-icon-white.png" alt="" className="h-7 w-auto md:h-8" />
        <span className="absolute -right-1 -top-1 flex h-6 items-center rounded-full px-2 text-[10px] font-bold text-white"
          style={{ background: "linear-gradient(90deg,#35d6ff,#2b3fff)" }}>
          IA
        </span>
      </motion.button>

      <AnimatePresence>
        {abierto && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            className="no-imprimir fixed bottom-24 right-4 z-50 flex h-[540px] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-[rgba(154,79,255,0.4)] bg-[#130a26]/95 shadow-2xl backdrop-blur-xl md:bottom-28 md:right-6"
          >
            {/* encabezado */}
            <div className="flex items-center gap-3 border-b border-[rgba(154,79,255,0.25)] p-3.5"
              style={{ background: "linear-gradient(120deg, rgba(91,43,224,0.5), rgba(176,79,255,0.25))" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/ts-icon-white.png" alt="" className="h-8 w-auto" />
              <div className="flex-1">
                <p className="font-display text-sm font-bold tracking-wide text-white">STEVEN IA</p>
                <p className="text-[11px] text-[#b8b3cf]">Asistente de TURBO STEVEN AUDIO</p>
              </div>
              <span className="h-2.5 w-2.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]" />
              <button onClick={() => setAbierto(false)} className="text-[#b8b3cf] hover:text-white" aria-label="Cerrar chat">✕</button>
            </div>

            {/* mensajes */}
            <div className="flex-1 space-y-3 overflow-y-auto p-3.5">
              {mensajes.length === 0 && (
                <div className="mt-4 text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/ts-icon-gradient.png" alt="" className="mx-auto h-16 w-auto opacity-90 animate-[flotar_4s_ease-in-out_infinite]" />
                  <p className="font-display mt-3 text-lg font-bold texto-marca">¡Hola! Soy Steven IA 🔊</p>
                  <p className="mx-auto mt-2 max-w-[260px] text-xs leading-relaxed text-[#b8b3cf]">
                    Pregúntame por precios, personalización, apartados, entregas… o el estado exacto de cualquier comanda.
                  </p>
                </div>
              )}
              {mensajes.map((m, i) => (
                <div key={i} className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    m.rol === "user"
                      ? "rounded-br-md bg-[#5b2be0] text-white"
                      : "rounded-bl-md border border-[rgba(154,79,255,0.3)] bg-[#1c1138] text-[#ece9f5]"
                  }`}>
                    {m.texto}
                  </div>
                </div>
              ))}
              {parcial !== null && (
                <div className="flex justify-start">
                  <div className="max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-[rgba(154,79,255,0.3)] bg-[#1c1138] px-3.5 py-2.5 text-[13px] leading-relaxed text-[#ece9f5]">
                    {parcial}
                  </div>
                </div>
              )}
              {escribiendo && parcial === null && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md border border-[rgba(154,79,255,0.3)] bg-[#1c1138] px-4 py-3">
                    <span className="flex gap-1.5">
                      <i className="h-2 w-2 animate-bounce rounded-full bg-[#9a4fff]" style={{ animationDelay: "0ms" }} />
                      <i className="h-2 w-2 animate-bounce rounded-full bg-[#b04fff]" style={{ animationDelay: "150ms" }} />
                      <i className="h-2 w-2 animate-bounce rounded-full bg-[#35d6ff]" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}
              {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300">{error}</p>}
              <div ref={finRef} />
            </div>

            {/* sugerencias */}
            {mensajes.length === 0 && (
              <div className="flex flex-wrap gap-2 px-3.5 pb-2">
                {SUGERENCIAS.map((s) => (
                  <button key={s} onClick={() => enviar(s)}
                    className="rounded-full border border-[rgba(154,79,255,0.4)] px-3 py-1.5 text-[11px] text-[#cfc9e8] transition hover:border-[#b04fff] hover:text-white">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* entrada */}
            <div className="flex gap-2 border-t border-[rgba(154,79,255,0.25)] p-3">
              <input
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviar(texto)}
                placeholder="Escribe tu pregunta…"
                className="campo flex-1 !py-2.5 text-[13px]"
              />
              <button onClick={() => enviar(texto)} disabled={escribiendo || !texto.trim()}
                className="btn-marca rounded-xl px-4 text-white disabled:opacity-40" aria-label="Enviar">
                ➤
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import WaveCanvas from "@/components/WaveCanvas";

const DEMO = {
  admin: { email: "admin@turbosteven.co", label: "Administrador", icono: "👑", desc: "Métricas, usuarios y control total" },
  vendedor: { email: "vendedor@turbosteven.co", label: "Vendedor", icono: "💼", desc: "Crear pedidos, clientes y fotos" },
  taller: { email: "taller@turbosteven.co", label: "Taller", icono: "🛠️", desc: "Asignaciones y estados de fabricación" },
};
const PASSWORD = "steven2026";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const rolInicial = params.get("rol") as "admin" | "vendedor" | "taller" | null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function autenticar(em: string, pw: string, destino?: "admin" | "vendedor" | "taller") {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, password: pw }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo iniciar sesión");
      const rol = destino ?? data.usuario.rol;
      router.push(rol === "taller" ? "/taller" : "/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
      setCargando(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="tarjeta-brillo rounded-3xl p-8"
      >
        <h1 className="font-display text-2xl font-extrabold text-white">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-[#9d97b8]">Ingresa al sistema de comandas de TURBO STEVEN AUDIO</p>

        <form className="mt-7 space-y-4" onSubmit={(e) => { e.preventDefault(); autenticar(email, password); }}>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-[#b8b3cf]">CORREO</label>
            <input className="campo" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tucorreo@turbosteven.co" required />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold tracking-wide text-[#b8b3cf]">CONTRASEÑA</label>
            <input className="campo" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" required />
          </div>
          {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={cargando} className="btn-marca w-full rounded-xl py-3 font-bold text-white disabled:opacity-50">
            {cargando ? "Ingresando…" : "Ingresar →"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-[#6f6a86]">
          <span className="h-px flex-1 bg-[rgba(154,79,255,0.3)]" />
          ACCESO RÁPIDO DEMO
          <span className="h-px flex-1 bg-[rgba(154,79,255,0.3)]" />
        </div>

        <div className="space-y-2.5">
          {(Object.keys(DEMO) as Array<keyof typeof DEMO>).map((k) => (
            <button key={k} disabled={cargando} onClick={() => autenticar(DEMO[k].email, PASSWORD, k)}
              className="flex w-full items-center gap-3 rounded-xl border border-[rgba(154,79,255,0.35)] bg-[rgba(28,17,56,0.6)] px-4 py-3 text-left transition hover:border-[#b04fff] hover:bg-[rgba(91,43,224,0.2)] disabled:opacity-50">
              <span className="text-xl">{DEMO[k].icono}</span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-white">Entrar como {DEMO[k].label}</span>
                <span className="block text-xs text-[#9d97b8]">{DEMO[k].desc}</span>
              </span>
              <span className="text-[#9a4fff]">→</span>
            </button>
          ))}
        </div>

        <p className="mt-6 rounded-lg border border-[rgba(255,212,0,0.35)] bg-[rgba(255,212,0,0.06)] px-3 py-2.5 text-center text-xs text-[#ffd400]">
          Cuentas demo · contraseña: <strong>steven2026</strong>
        </p>
      </motion.div>

      {rolInicial && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => autenticar(DEMO[rolInicial].email, PASSWORD, rolInicial)}
          disabled={cargando}
          className="btn-marca mt-4 w-full rounded-xl py-3.5 text-sm font-bold text-white"
        >
          ⚡ Acceso directo como {DEMO[rolInicial].label}
        </motion.button>
      )}

      <a href="/" className="mt-6 block text-center text-sm text-[#9d97b8] transition hover:text-white">← Volver al inicio</a>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[#0a0614] px-4 py-12">
      <div className="absolute inset-0 opacity-40"><WaveCanvas className="h-full w-full" intensidad={0.7} /></div>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 25%, #0a0614 80%)" }} />
      <div className="relative z-10 flex flex-col items-center">
        <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}
          className="mb-8 flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/ts-icon-white.png" alt="TURBO STEVEN AUDIO" className="h-16 w-auto drop-shadow-[0_0_30px_rgba(154,79,255,0.7)]" />
          <p className="font-display text-lg font-extrabold tracking-[0.2em] text-white">
            TURBO STEVEN <span className="texto-marca">AUDIO</span>
          </p>
        </motion.div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

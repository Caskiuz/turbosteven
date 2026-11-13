"use client";

import { useCallback, useEffect, useState } from "react";
import { Cargando } from "@/components/ui";
import { fechaCorta } from "@/lib/fechas";

interface Usuario {
  id: number; nombre: string; email: string;
  rol: "admin" | "vendedor" | "taller"; activo: boolean; creado: string; asignados: number;
}

const ROL_ESTILO: Record<string, { nombre: string; color: string; icono: string }> = {
  admin: { nombre: "Administrador", color: "#FFD400", icono: "👑" },
  vendedor: { nombre: "Vendedor", color: "#35D6FF", icono: "💼" },
  taller: { nombre: "Taller", color: "#9A4FFF", icono: "🛠️" },
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ nombre: "", email: "", rol: "vendedor", password: "" });

  const cargar = useCallback(async () => {
    const res = await fetch("/api/usuarios");
    if (res.ok) setUsuarios(await res.json());
    else setError((await res.json()).error ?? "Error cargando usuarios");
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function crear() {
    setError(null);
    const res = await fetch("/api/usuarios", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setModal(false);
      setForm({ nombre: "", email: "", rol: "vendedor", password: "" });
      await cargar();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "No se pudo crear el usuario");
    }
  }

  async function alternar(u: Usuario) {
    setError(null);
    const res = await fetch("/api/usuarios", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, activo: !u.activo }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "No se pudo actualizar");
    } else await cargar();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Usuarios y permisos 🔐</h1>
          <p className="mt-1 text-sm text-[#9d97b8]">Control de acceso por rol: administrador, vendedores y taller.</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-marca rounded-xl px-5 py-2.5 text-sm font-bold text-white">+ Nuevo usuario</button>
      </div>

      {error && <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>}

      {usuarios === null ? <Cargando /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {usuarios.map((u) => {
            const r = ROL_ESTILO[u.rol];
            return (
              <div key={u.id} className={`tarjeta-brillo rounded-2xl p-5 transition ${!u.activo ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full text-lg"
                      style={{ background: `linear-gradient(135deg, ${r.color}, #b04fff)` }}>{r.icono}</span>
                    <div>
                      <p className="font-semibold text-white">{u.nombre}</p>
                      <p className="text-xs text-[#9d97b8]">{u.email}</p>
                    </div>
                  </div>
                  <span className="rounded-full px-3 py-1 text-[11px] font-bold"
                    style={{ background: r.color + "1f", color: r.color }}>{r.nombre}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[#8b85a3]">
                  <span>📅 Desde {fechaCorta(u.creado)}{u.rol === "taller" && ` · ${u.asignados} en taller`}</span>
                  <button onClick={() => alternar(u)}
                    className={`rounded-lg border px-3 py-1.5 font-semibold transition ${
                      u.activo
                        ? "border-[rgba(255,92,122,0.4)] text-[#ff5c7a] hover:bg-[rgba(255,92,122,0.1)]"
                        : "border-[rgba(74,222,128,0.4)] text-[#22dd88] hover:bg-[rgba(74,222,128,0.1)]"
                    }`}>
                    {u.activo ? "Desactivar" : "Reactivar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* modal crear usuario */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal(false)}>
          <div className="tarjeta-brillo w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg font-bold text-white">Nuevo usuario</h2>
            <div className="mt-4 space-y-3">
              <input className="campo" placeholder="Nombre completo *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <input className="campo" type="email" placeholder="Correo *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <select className="campo" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>
                <option value="admin">👑 Administrador</option>
                <option value="vendedor">💼 Vendedor</option>
                <option value="taller">🛠️ Taller</option>
              </select>
              <input className="campo" type="password" placeholder="Contraseña (mínimo 6 caracteres) *" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-300">{error}</p>}
            </div>
            <div className="mt-5 flex gap-3">
              <button onClick={crear} className="btn-marca flex-1 rounded-xl py-2.5 font-bold text-white">Crear usuario</button>
              <button onClick={() => setModal(false)} className="rounded-xl border border-[rgba(154,79,255,0.4)] px-5 text-sm text-[#b8b3cf]">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

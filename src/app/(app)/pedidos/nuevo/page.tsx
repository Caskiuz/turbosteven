"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ESTADOS } from "@/lib/tipos";

interface ClienteOpt { id: number; nombre: string; telefono: string }
interface UsuarioOpt { id: number; nombre: string; rol: string }

/** Comprime la imagen en el navegador (canvas -> JPEG ~1000px) para guardarla como data URL ligera. */
async function comprimir(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.75);
}

export default function NuevoPedidoPage() {
  const router = useRouter();
  const [clientes, setClientes] = useState<ClienteOpt[]>([]);
  const [talleristas, setTalleristas] = useState<UsuarioOpt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    cliente_id: "", producto: "", tipo: "parlante", cantidad: 1,
    medidas: "", color_principal: "", color_secundario: "", especificaciones: "",
    precio: "", abono: "", fecha_inicio: new Date().toISOString().slice(0, 10),
    fecha_entrega: "", responsable_id: "",
  });
  const [fotos, setFotos] = useState<{ src: string; nombre: string }[]>([]);

  useEffect(() => {
    fetch("/api/clientes").then(async (r) => r.ok ? r.json() : []).then(setClientes).catch(() => {});
    fetch("/api/talleristas").then(async (r) => r.ok ? r.json() : []).then(setTalleristas).catch(() => {});
  }, []);

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function alElegirFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 8 - fotos.length);
    for (const f of files) {
      try {
        const src = await comprimir(f);
        setFotos((fs) => [...fs, { src, nombre: f.name }]);
      } catch {
        setError(`No se pudo procesar la imagen ${f.name}`);
      }
    }
    e.target.value = "";
  }

  async function crearClienteRapido() {
    const nombre = prompt("Nombre del nuevo cliente:");
    if (!nombre?.trim()) return;
    const telefono = prompt("Teléfono de contacto:") ?? "";
    if (!telefono.trim()) { setError("El teléfono es obligatorio para el cliente."); return; }
    const res = await fetch("/api/clientes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, telefono }),
    });
    if (res.ok) {
      const c = await res.json();
      setClientes((cs) => [...cs, { id: c.id, nombre, telefono }]);
      setForm((f) => ({ ...f, cliente_id: String(c.id) }));
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "No se pudo crear el cliente");
    }
  }

  async function guardar() {
    setError(null);
    if (!form.cliente_id) { setError("Selecciona un cliente."); return; }
    if (!form.producto.trim()) { setError("Escribe el producto a fabricar."); return; }
    setGuardando(true);
    try {
      const res = await fetch("/api/pedidos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cliente_id: Number(form.cliente_id),
          producto: form.producto, tipo: form.tipo, cantidad: Number(form.cantidad) || 1,
          medidas: form.medidas, color_principal: form.color_principal,
          color_secundario: form.color_secundario, especificaciones: form.especificaciones,
          precio: form.precio ? Number(form.precio) : undefined,
          abono: form.abono ? Number(form.abono) : 0,
          fecha_inicio: form.fecha_inicio || undefined,
          fecha_entrega: form.fecha_entrega || undefined,
          responsable_id: form.responsable_id ? Number(form.responsable_id) : null,
          fotos: fotos.map((f) => f.src),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "No se pudo guardar el pedido");
      router.push(`/pedidos/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado");
      setGuardando(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-10">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-white md:text-3xl">Nueva comanda</h1>
        <p className="mt-1 text-sm text-[#9d97b8]">El código consecutivo (TSA-XXXX) se asigna automáticamente al guardar.</p>
      </div>

      <div className="tarjeta-brillo space-y-6 rounded-2xl p-6">
        {/* cliente */}
        <section>
          <h2 className="font-display text-sm font-bold tracking-wide text-[#35d6ff]">👤 CLIENTE</h2>
          <div className="mt-3 flex gap-2">
            <select className="campo flex-1" value={form.cliente_id} onChange={(e) => set("cliente_id", e.target.value)}>
              <option value="">Selecciona un cliente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre} · {c.telefono}</option>)}
            </select>
            <button onClick={crearClienteRapido} type="button"
              className="shrink-0 rounded-xl border border-[rgba(53,214,255,0.5)] px-4 text-sm font-semibold text-[#35d6ff] transition hover:bg-[rgba(53,214,255,0.12)]">
              + Nuevo
            </button>
          </div>
        </section>

        {/* producto */}
        <section>
          <h2 className="font-display text-sm font-bold tracking-wide text-[#35d6ff]">📦 PRODUCTO</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <input className="campo" placeholder="Ej: Parlante Picó Personalizado «El Sonoro»" value={form.producto} onChange={(e) => set("producto", e.target.value)} />
            </div>
            <select className="campo" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
              <option value="parlante">🔊 Parlante personalizado</option>
              <option value="mini_turbo">⚡ Mini Turbo</option>
              <option value="otro">🔧 Otro</option>
            </select>
            <input className="campo" type="number" min={1} placeholder="Cantidad" value={form.cantidad} onChange={(e) => set("cantidad", e.target.value)} />
          </div>
        </section>

        {/* especificaciones */}
        <section>
          <h2 className="font-display text-sm font-bold tracking-wide text-[#35d6ff]">📐 MEDIDAS, COLORES Y ESPECIFICACIONES</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <input className="campo" placeholder="Medidas (ej: 120cm alto × 50cm ancho)" value={form.medidas} onChange={(e) => set("medidas", e.target.value)} />
            <input className="campo" placeholder="Color principal" value={form.color_principal} onChange={(e) => set("color_principal", e.target.value)} />
            <input className="campo" placeholder="Color secundario / acabado" value={form.color_secundario} onChange={(e) => set("color_secundario", e.target.value)} />
            <textarea className="campo md:col-span-3" rows={3} placeholder="Especificaciones especiales: texto de la marquesina LED, arte solicitado, potencia, accesorios…" value={form.especificaciones} onChange={(e) => set("especificaciones", e.target.value)} />
          </div>
        </section>

        {/* fotos */}
        <section>
          <h2 className="font-display text-sm font-bold tracking-wide text-[#35d6ff]">📷 FOTOS DE REFERENCIA <span className="text-[#9d97b8]">({fotos.length}/8)</span></h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            {fotos.map((f, i) => (
              <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-[rgba(154,79,255,0.4)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.src} alt={f.nombre} className="h-full w-full object-cover" />
                <button type="button" onClick={() => setFotos((fs) => fs.filter((_, j) => j !== i))}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white" aria-label="Quitar foto">✕</button>
              </div>
            ))}
            {fotos.length < 8 && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(154,79,255,0.45)] text-center text-[10px] text-[#b8b3cf] transition hover:border-[#b04fff] hover:text-white">
                <span className="text-xl">＋</span>
                cámara / galería
                <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={alElegirFotos} />
              </label>
            )}
          </div>
        </section>

        {/* fabricación */}
        <section>
          <h2 className="font-display text-sm font-bold tracking-wide text-[#35d6ff]">🛠️ FABRICACIÓN Y FECHAS</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <select className="campo" value={form.responsable_id} onChange={(e) => set("responsable_id", e.target.value)}>
              <option value="">Responsable de fabricación (opcional)</option>
              {talleristas.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <label className="relative">
              <span className="absolute -top-2 left-3 z-10 rounded bg-[#2a1856] px-1 text-[10px] text-[#b8b3cf]">Fecha de inicio</span>
              <input className="campo" type="date" value={form.fecha_inicio} onChange={(e) => set("fecha_inicio", e.target.value)} />
            </label>
            <label className="relative">
              <span className="absolute -top-2 left-3 z-10 rounded bg-[#2a1856] px-1 text-[10px] text-[#b8b3cf]">Fecha de entrega</span>
              <input className="campo" type="date" value={form.fecha_entrega} onChange={(e) => set("fecha_entrega", e.target.value)} />
            </label>
          </div>
          {form.fecha_entrega && (
            <p className="mt-2 text-xs text-[#ffd400]">
              💡 Sugerencia de la marca: los pedidos personalizados se entregan en 1 semana.
            </p>
          )}
        </section>

        {/* valores */}
        <section>
          <h2 className="font-display text-sm font-bold tracking-wide text-[#35d6ff]">💵 VALORES</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input className="campo" type="number" placeholder="Precio total (COP)" value={form.precio} onChange={(e) => set("precio", e.target.value)} />
            <input className="campo" type="number" placeholder="Abono / apartado (COP)" value={form.abono} onChange={(e) => set("abono", e.target.value)} />
          </div>
        </section>

        {error && <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-300">{error}</p>}

        <div className="flex flex-wrap gap-3">
          <button onClick={guardar} disabled={guardando}
            className="btn-marca rounded-xl px-8 py-3 font-bold text-white disabled:opacity-50">
            {guardando ? "Guardando…" : "✓ Crear comanda"}
          </button>
          <button type="button" onClick={() => router.back()}
            className="rounded-xl border border-[rgba(154,79,255,0.4)] px-6 py-3 text-sm text-[#b8b3cf] transition hover:text-white">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

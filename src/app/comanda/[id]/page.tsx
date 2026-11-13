import { redirect, notFound } from "next/navigation";
import { sql, filas } from "@/lib/db";
import { sesionActual } from "@/lib/auth";
import { nombreEstado, type Estado } from "@/lib/tipos";
import { fechaCorta, formatoCOP, etiquetaEntrega } from "@/lib/fechas";
import BotonImprimir from "./BotonImprimir";

interface FilaPedido {
  id: number; numero: number; codigo: string; producto: string; tipo: string; cantidad: number;
  cliente_id: number; responsable_id: number | null;
  cliente_nombre: string; cliente_telefono: string;
  vendedor_nombre: string | null; responsable_nombre: string | null;
  medidas: string | null; color_principal: string | null; color_secundario: string | null;
  especificaciones: string | null; precio: string | null; abono: string | null;
  fecha_inicio: string | null; fecha_entrega: string | null; estado: Estado;
}

export default async function ComandaPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await sesionActual();
  if (!sesion) redirect("/login");

  const { id } = await params;
  const s = await sql();
  const res = await filas<FilaPedido>(s, `
    SELECT p.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
           v.nombre AS vendedor_nombre, r.nombre AS responsable_nombre
    FROM pedidos p
    JOIN clientes c ON c.id = p.cliente_id
    LEFT JOIN usuarios v ON v.id = p.vendedor_id
    LEFT JOIN usuarios r ON r.id = p.responsable_id
    WHERE p.id = $1`, [Number(id)]);
  const p = res[0];
  if (!p) notFound();
  if (sesion.rol === "taller" && p.responsable_id !== sesion.id) redirect("/taller");

  const fotos = await filas<{ src: string }>(s, "SELECT src FROM pedido_fotos WHERE pedido_id = $1 ORDER BY orden", [p.id]);
  const saldo = (p.precio ? Number(p.precio) : 0) - (p.abono ? Number(p.abono) : 0);
  const entrega = etiquetaEntrega(p.fecha_entrega);

  const fila = (et: string, v: string) => (
    <div className="flex gap-2 py-1.5 border-b border-dashed border-gray-200 last:border-0">
      <span className="w-40 shrink-0 text-[11px] font-bold uppercase tracking-wide text-gray-400">{et}</span>
      <span className="text-sm text-gray-900">{v || "—"}</span>
    </div>
  );

  return (
    <main className="min-h-[100svh] bg-[#0a0614] px-4 py-8 print:bg-white print:p-0">
      <div className="no-imprimir mx-auto mb-6 flex max-w-[820px] items-center justify-between">
        <a href={`/pedidos/${p.id}`} className="text-sm text-[#9d97b8] hover:text-white">← Volver al pedido</a>
        <BotonImprimir />
      </div>

      {/* hoja */}
      <div className="comanda-hoja mx-auto max-w-[820px] rounded-2xl bg-white p-8 text-gray-900 shadow-2xl md:p-10">
        {/* encabezado */}
        <div className="flex items-center justify-between border-b-4 border-[#5b2be0] pb-5">
          <div className="flex items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ts-icon-black.png" alt="TURBO STEVEN AUDIO" className="h-16 w-auto" />
            <div>
              <p className="text-2xl font-black italic tracking-tight">TURBO STEVEN AUDIO</p>
              <p className="text-xs tracking-[0.3em] text-gray-500">COMANDA DE FABRICACIÓN</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black text-[#5b2be0]">{p.codigo}</p>
            <p className="text-xs text-gray-500">Comanda #{p.numero} · {new Date().toLocaleDateString("es-CO")}</p>
            <p className="mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: "#5b2be014", color: "#5b2be0" }}>{nombreEstado(p.estado)}</p>
          </div>
        </div>

        {/* datos */}
        <div className="mt-6 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-[#5b2be0]">Cliente</h2>
            {fila("Nombre", p.cliente_nombre)}
            {fila("WhatsApp", p.cliente_telefono)}
            {fila("Vendedor", p.vendedor_nombre ?? "")}
            {fila("Estado de entrega", entrega.texto)}
          </div>
          <div>
            <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-[#5b2be0]">Fabricación</h2>
            {fila("Responsable", p.responsable_nombre ?? "Por asignar")}
            {fila("Fecha inicio", fechaCorta(p.fecha_inicio))}
            {fila("Fecha entrega", fechaCorta(p.fecha_entrega))}
            {fila("Cantidad", String(p.cantidad))}
          </div>
        </div>

        <div className="mt-5">
          <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-[#5b2be0]">Producto</h2>
          <p className="py-2 text-lg font-bold">{p.producto}</p>
          {fila("Medidas", p.medidas ?? "")}
          {fila("Colores", [p.color_principal, p.color_secundario].filter(Boolean).join(" + "))}
        </div>

        {p.especificaciones && (
          <div className="mt-5 rounded-xl border-2 border-dashed border-[#5b2be0]/40 p-4">
            <h2 className="mb-1 text-sm font-black uppercase tracking-widest text-[#5b2be0]">Especificaciones especiales</h2>
            <p className="whitespace-pre-wrap text-sm">{p.especificaciones}</p>
          </div>
        )}

        {/* fotos */}
        {fotos.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-black uppercase tracking-widest text-[#5b2be0]">Fotos de referencia</h2>
            <div className="flex flex-wrap gap-3">
              {fotos.map((f, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={f.src} alt={`Referencia ${i + 1}`} className="h-36 w-36 rounded-xl border border-gray-200 object-cover" />
              ))}
            </div>
          </div>
        )}

        {/* valores */}
        <div className="mt-6 ml-auto w-full max-w-xs rounded-xl bg-gray-50 p-4 text-sm md:w-72">
          <div className="flex justify-between py-1"><span className="text-gray-500">Precio</span><span className="font-bold">{formatoCOP(p.precio ? Number(p.precio) : null)}</span></div>
          <div className="flex justify-between py-1"><span className="text-gray-500">Abono</span><span className="text-green-600">− {formatoCOP(p.abono ? Number(p.abono) : 0)}</span></div>
          <div className="mt-2 flex justify-between border-t-2 border-gray-200 pt-2">
            <span className="font-bold">SALDO</span>
            <span className="text-lg font-black text-[#5b2be0]">{formatoCOP(saldo)}</span>
          </div>
        </div>

        {/* firmas */}
        <div className="mt-10 grid grid-cols-2 gap-10">
          <div className="border-t border-gray-400 pt-2 text-center text-xs text-gray-500">
            Firma del cliente
            <p className="mt-0.5">{p.cliente_nombre}</p>
          </div>
          <div className="border-t border-gray-400 pt-2 text-center text-xs text-gray-500">
            Firma del taller
            <p className="mt-0.5">{p.responsable_nombre ?? "TURBO STEVEN AUDIO"}</p>
          </div>
        </div>

        <p className="mt-6 border-t border-gray-200 pt-3 text-center text-[11px] text-gray-400">
          TURBO STEVEN AUDIO · Pedidos WhatsApp 310 7129559 · @turbosstevenaudio · Bancolombia / Nequi / Addi · Generado por el sistema de comandas en la nube
        </p>
      </div>
    </main>
  );
}

"use client";

export default function BotonImprimir() {
  return (
    <button onClick={() => window.print()}
      className="btn-marca rounded-xl px-6 py-2.5 text-sm font-bold text-white">
      🖨️ Imprimir / Guardar PDF
    </button>
  );
}

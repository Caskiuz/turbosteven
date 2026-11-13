"use client";

import { useEffect, useRef } from "react";

/**
 * Canvas inmersivo de marca: ondas de audio superpuestas + barras ecualizador.
 * Ligero (Canvas 2D), respeta prefers-reduced-motion y se detiene fuera de vista.
 */
export default function WaveCanvas({ className = "", intensidad = 1 }: { className?: string; intensidad?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0, t = 0;
    let visible = true;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const colores = ["rgba(154,79,255,", "rgba(53,214,255,", "rgba(43,63,255,"];

    const ondas = (base: number, amp: number, vel: number, alpha: number, color: string, fase: number) => {
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = base
          + Math.sin(x * 0.012 + t * vel + fase) * amp
          + Math.sin(x * 0.004 - t * vel * 0.6 + fase * 2) * amp * 0.6;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = color + alpha + ")";
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    const barras = () => {
      const n = Math.floor(w / 26);
      for (let i = 0; i < n; i++) {
        const x = i * 26 + 8;
        const altura = (Math.sin(t * 1.4 + i * 0.55) * 0.5 + 0.5) * (h * 0.16) + 8;
        const c = colores[i % 3];
        ctx.fillStyle = c + "0.35)";
        ctx.fillRect(x, h - altura, 10, altura);
        ctx.fillStyle = c + "0.15)";
        ctx.fillRect(x, h - altura * 2.1, 10, altura * 1.4);
      }
    };

    const frame = () => {
      ctx.clearRect(0, 0, w, h);
      if (!reduce) t += 0.016 * intensidad;
      ondas(h * 0.42, h * 0.09 * intensidad, 1.1, 0.5, colores[0], 0);
      ondas(h * 0.5, h * 0.12 * intensidad, 0.9, 0.42, colores[1], 1.8);
      ondas(h * 0.58, h * 0.07 * intensidad, 1.35, 0.3, colores[2], 3.4);
      barras();
      raf = requestAnimationFrame(frame);
    };

    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    io.observe(canvas);
    frame();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      io.disconnect();
    };
  }, [intensidad]);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}

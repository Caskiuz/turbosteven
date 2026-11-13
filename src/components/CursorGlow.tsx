"use client";

import { useEffect, useRef } from "react";

/** Halo violeta que sigue el cursor (solo escritorio, con puntero fino). */
export default function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const el = ref.current;
    if (!el) return;

    let x = -300, y = -300, cx = -300, cy = -300, raf = 0;
    const move = (e: MouseEvent) => { x = e.clientX; y = e.clientY; };
    const frame = () => {
      cx += (x - cx) * 0.12;
      cy += (y - cy) * 0.12;
      el.style.transform = `translate(${cx - 190}px, ${cy - 190}px)`;
      raf = requestAnimationFrame(frame);
    };
    window.addEventListener("mousemove", move);
    raf = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener("mousemove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-0 h-[380px] w-[380px] rounded-full opacity-40 blur-[90px]"
      style={{ background: "radial-gradient(circle, rgba(122,60,255,0.5), rgba(53,214,255,0.12) 55%, transparent 70%)" }}
    />
  );
}

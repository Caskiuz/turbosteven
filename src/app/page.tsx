"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import WaveCanvas from "@/components/WaveCanvas";
import CursorGlow from "@/components/CursorGlow";

const PALABRAS = ["PARLANTES PERSONALIZADOS", "PICÓS CON LED", "MINI TURBO RECARGABLE", "TU NOMBRE EN LUCES", "SONIDO QUE SE VE", "FABRICACIÓN EN LA NUBE"];

const FEATURES = [
  { icono: "🔢", titulo: "Numeración automática", desc: "Cada comanda recibe su código consecutivo (TSA-0001, TSA-0002…) sin errores ni duplicados." },
  { icono: "📷", titulo: "Fotos de referencia", desc: "Adjunta fotos desde la cámara del celular o la galería, con vista previa instantánea." },
  { icono: "📐", titulo: "Medidas y colores", desc: "Fichas técnicas completas: medidas exactas, colores y especificaciones especiales." },
  { icono: "🛠️", titulo: "Responsables y fechas", desc: "Asigna al taller de fabricación y define fecha de inicio y de entrega." },
  { icono: "📊", titulo: "Estados en tiempo real", desc: "Pendiente → En Fabricación → Control de Calidad → Listo → Entregado. Todo visible al instante." },
  { icono: "🧾", titulo: "Comanda en PDF", desc: "Imprime o descarga cada comanda con el sello de la marca, lista para el taller." },
];

const ROLES = [
  { rol: "Administrador", email: "admin@turbosteven.co", icono: "👑", desc: "Control total: usuarios, métricas, historial y configuración.", color: "#FFD400" },
  { rol: "Vendedor", email: "vendedor@turbosteven.co", icono: "💼", desc: "Crea pedidos, carga clientes, fotos y especificaciones.", color: "#35D6FF" },
  { rol: "Taller", email: "taller@turbosteven.co", icono: "🛠️", desc: "Ve sus asignaciones y actualiza el estado de fabricación.", color: "#9A4FFF" },
];

export default function Landing() {
  const refScroll = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: refScroll, offset: ["start start", "end start"] });
  const yEmblema = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const opacidadHero = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const refPaso = useRef<HTMLDivElement>(null);
  const { scrollYProgress: progresoPaso } = useScroll({ target: refPaso, offset: ["start end", "end start"] });

  return (
    <main ref={refScroll} className="relative overflow-hidden bg-[#0a0614]">
      <CursorGlow />

      {/* ============ NAV ============ */}
      <nav className="no-imprimir fixed inset-x-0 top-0 z-40 border-b border-[rgba(154,79,255,0.2)] bg-[#0a0614]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <a href="#" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ts-icon-white.png" alt="TURBO STEVEN AUDIO" className="h-9 w-auto md:h-10" />
            <span className="font-display text-sm font-extrabold tracking-[0.18em] text-white md:text-base">
              TURBO <span className="texto-marca">STEVEN</span> AUDIO
            </span>
          </a>
          <div className="hidden items-center gap-7 text-sm text-[#b8b3cf] md:flex">
            <a href="#sistema" className="transition hover:text-white">El Sistema</a>
            <a href="#producto" className="transition hover:text-white">Productos</a>
            <a href="#roles" className="transition hover:text-white">Roles</a>
            <a href="#ia" className="transition hover:text-white">Steven IA</a>
          </div>
          <Link href="/login" className="btn-marca rounded-xl px-4 py-2 text-sm font-semibold text-white md:px-5">
            Entrar al demo
          </Link>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pt-20 md:pt-16">
        <div className="absolute inset-0 opacity-70">
          <WaveCanvas className="h-full w-full" />
        </div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, #0a0614 82%)" }} />

        <motion.div style={{ y: yEmblema, opacity: opacidadHero }} className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <motion.img
            initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
            src="/brand/ts-icon-white.png"
            alt="Emblema TURBO STEVEN AUDIO"
            className="mx-auto h-28 w-auto drop-shadow-[0_0_45px_rgba(154,79,255,0.65)] md:h-36"
          />
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.9 }}
            className="font-display mt-6 text-4xl font-black leading-[1.05] tracking-wide text-white md:text-6xl lg:text-7xl"
          >
            TURBO STEVEN <span className="texto-marca">AUDIO</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.9 }}
            className="mt-5 text-lg font-medium text-[#cfc9e8] md:text-2xl"
          >
            Comandas de fabricación <span className="text-white">en la nube</span> para tus picós
            personalizados y mini turbos 📢⚡
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.9 }}
            className="mx-auto mt-4 max-w-xl text-sm text-[#9d97b8] md:text-base"
          >
            Desde cualquier computador o celular: pedidos con numeración automática, fotos de referencia,
            responsables, estados en tiempo real, PDF y asistente de IA.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85, duration: 0.8 }}
            className="mt-9 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/login" className="btn-marca rounded-2xl px-7 py-3.5 text-base font-bold text-white">
              🚀 Probar el sistema ahora
            </Link>
            <a href="#producto" className="rounded-2xl border border-[rgba(154,79,255,0.5)] px-7 py-3.5 text-base font-semibold text-[#cfc9e8] transition hover:border-[#b04fff] hover:text-white">
              Ver productos
            </a>
          </motion.div>
        </motion.div>

        <motion.div style={{ opacity: opacidadHero }} className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[#9d97b8]">
          <div className="animate-bounce text-2xl">⌄</div>
        </motion.div>
      </section>

      {/* ============ MARQUESINA ============ */}
      <div className="no-imprimir overflow-hidden border-y border-[rgba(154,79,255,0.25)] bg-[#130a26] py-3.5">
        <div className="flex w-max animate-[marquesina_30s_linear_infinite] gap-10 whitespace-nowrap">
          {[...PALABRAS, ...PALABRAS].map((p, i) => (
            <span key={i} className="font-display flex items-center gap-10 text-sm font-bold tracking-[0.22em] text-[#9a4fff]">
              {p} <span className="text-[#35d6ff]">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* ============ SCROLLYTELLING: DEL PAPEL A LA NUBE ============ */}
      <section ref={refPaso} className="relative mx-auto max-w-6xl px-6 py-24 md:py-36">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-center text-3xl font-extrabold text-white md:text-5xl"
        >
          Del papel <span className="texto-marca">a la nube</span>
        </motion.h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[#9d97b8]">
          Lo que antes se perdía entre cuadernos y chats de WhatsApp, hoy vive en un solo lugar — con historia,
          estados y responsable claro para cada comanda.
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { n: "01", t: "La comanda en papel", d: "Cuadernos, fotos sueltas, llamadas para preguntar \"¿cómo va mi parlante?\".", color: "#FF5C7A" },
            { n: "02", t: "El pedido digital", d: "Cliente, fotos, medidas, colores y responsable: todo en una comanda con código único.", color: "#35D6FF" },
            { n: "03", t: "Fabricación en vivo", d: "El taller avanza estados, el vendedor ve todo, el cliente recibe su pedido a tiempo.", color: "#9A4FFF" },
          ].map((paso, i) => {
            const progreso = progresoPaso;
            return (
              <motion.div
                key={paso.n}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.12, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
                className="tarjeta-brillo efecto-hover-tarjeta rounded-3xl p-7"
              >
                <span className="font-display text-5xl font-black" style={{ color: paso.color }}>{paso.n}</span>
                <h3 className="font-display mt-4 text-xl font-bold text-white">{paso.t}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#b8b3cf]">{paso.d}</p>
                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#2a1856]">
                  <motion.div
                    initial={{ width: "0%" }}
                    whileInView={{ width: ["0%", "100%", "0%"][i === 2 ? 1 : 1] }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.15, duration: 1.4 }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${paso.color}, #b04fff)` }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section id="sistema" className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-[720px] -translate-x-1/2 rounded-full opacity-25 blur-[120px]"
          style={{ background: "linear-gradient(90deg,#5b2be0,#35d6ff)" }} />
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-center text-3xl font-extrabold text-white md:text-5xl"
        >
          Todo lo que tu taller necesita, <span className="texto-marca">en un solo sistema</span>
        </motion.h2>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.titulo}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: (i % 3) * 0.1, duration: 0.7 }}
              className="tarjeta-brillo efecto-hover-tarjeta rounded-2xl p-6"
            >
              <span className="text-3xl">{f.icono}</span>
              <h3 className="font-display mt-4 text-lg font-bold text-white">{f.titulo}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#b8b3cf]">{f.desc}</p>
            </motion.div>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-8 text-center text-sm text-[#9d97b8]"
        >
          + Historial completo de pedidos, roles con permisos y acceso desde cualquier dispositivo.
        </motion.p>
      </section>

      {/* ============ PRODUCTOS ============ */}
      <section id="producto" className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-center text-3xl font-extrabold text-white md:text-5xl"
        >
          Se fabrican <span className="texto-marca">con tu nombre</span>
        </motion.h2>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-3xl border border-[rgba(154,79,255,0.35)] shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/parlante-sonoro.jpg" alt="Parlante picó personalizado con marquesina LED" className="w-full object-cover transition duration-700 hover:scale-105" />
            </div>
            <div className="absolute -bottom-5 -right-4 rounded-2xl border border-[rgba(255,212,0,0.5)] bg-[#130a26]/95 px-5 py-3 text-sm font-bold text-[#ffd400] shadow-xl backdrop-blur md:-right-6">
              Tu nombre en luces LED ✨
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, delay: 0.1 }}
          >
            <h3 className="font-display text-2xl font-bold text-white md:text-3xl">MINI TURBO <span className="texto-marca">RECARGABLE</span></h3>
            <p className="mt-3 text-[#b8b3cf]">2 salidas de succión/soplo · ~2 horas de duración · medida 34cm × 30cm</p>
            <p className="font-display mt-5 text-4xl font-black text-white md:text-5xl">$410.000</p>
            <ul className="mt-6 space-y-2.5 text-sm text-[#cfc9e8]">
              {["Parlante de 6.5 pulgadas", "Micrófono y Bluetooth", "Memoria, USB y emisora", "Luces LED y control remoto", "Cinturón para colgar"].map((x) => (
                <li key={x} className="flex items-center gap-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[rgba(154,79,255,0.25)] text-[11px] text-[#b04fff]">✓</span>
                  {x}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <span className="rounded-full border border-[rgba(255,212,0,0.5)] bg-[rgba(255,212,0,0.08)] px-4 py-1.5 text-xs font-semibold text-[#ffd400]">Apartado con $50.000</span>
              <span className="rounded-full border border-[rgba(53,214,255,0.5)] bg-[rgba(53,214,255,0.08)] px-4 py-1.5 text-xs font-semibold text-[#35d6ff]">Entrega en 1 semana</span>
              <span className="rounded-full border border-[rgba(176,79,255,0.5)] bg-[rgba(176,79,255,0.08)] px-4 py-1.5 text-xs font-semibold text-[#b04fff]">100% personalizado</span>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-[rgba(154,79,255,0.35)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/flyer-mini-turbo.jpg" alt="Flyer oficial MINI TURBO RECARGABLE" className="max-h-[280px] w-full object-cover object-top" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ ROLES ============ */}
      <section id="roles" className="relative mx-auto max-w-7xl px-6 py-24 md:py-32">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="font-display text-center text-3xl font-extrabold text-white md:text-5xl"
        >
          Cada rol, <span className="texto-marca">su control</span>
        </motion.h2>
        <p className="mx-auto mt-4 max-w-2xl text-center text-[#9d97b8]">
          La demo se abre con credenciales de ejemplo para que pruebes cada experiencia completa.
        </p>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.rol}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.12, duration: 0.8 }}
              className="tarjeta-brillo efecto-hover-tarjeta rounded-3xl p-7"
            >
              <div className="flex items-center justify-between">
                <span className="text-3xl">{r.icono}</span>
                <span className="rounded-full px-3 py-1 text-[11px] font-bold" style={{ background: `${r.color}1f`, color: r.color }}>
                  {r.rol}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#b8b3cf]">{r.desc}</p>
              <p className="font-display mt-4 break-all text-xs text-[#35d6ff]">{r.email}</p>
              <Link href={`/login?rol=${r.rol === "Administrador" ? "admin" : r.rol === "Vendedor" ? "vendedor" : "taller"}`}
                className="btn-marca mt-6 block rounded-xl py-2.5 text-center text-sm font-bold text-white">
                Entrar como {r.rol}
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ STEVEN IA ============ */}
      <section id="ia" className="relative mx-auto max-w-6xl px-6 py-24 md:py-32">
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-[640px] -translate-x-1/2 rounded-full opacity-20 blur-[110px]"
          style={{ background: "linear-gradient(90deg,#b04fff,#2b3fff)" }} />
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
          >
            <span className="rounded-full border border-[rgba(53,214,255,0.5)] px-4 py-1.5 text-xs font-bold text-[#35d6ff]">INTELIGENCIA ARTIFICIAL</span>
            <h2 className="font-display mt-5 text-3xl font-extrabold text-white md:text-5xl">
              Conoce a <span className="texto-marca">Steven IA</span>
            </h2>
            <p className="mt-5 leading-relaxed text-[#b8b3cf]">
              El asistente virtual de la marca, entrenado con todo su negocio: catálogo, precios, apartados,
              medios de pago y tiempos de entrega. Y lo mejor: <strong className="text-white">consulta el estado real de
              cualquier comanda</strong> conectándose a la base de datos en vivo.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-[#cfc9e8]">
              <li>🔊 Responde sobre productos y precios al instante</li>
              <li>📦 \"¿En qué va mi pedido TSA-0004?\" → estado real de la base de datos</li>
              <li>💬 Disponible en toda la web, 24/7, desde celular o computador</li>
            </ul>
            <p className="mt-7 text-sm text-[#9d97b8]">Pruébalo ahora → toca el botón <span className="font-bold text-white">IA</span> abajo a la derecha.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8 }}
            className="tarjeta-brillo rounded-3xl p-6"
          >
            <div className="flex items-center gap-3 border-b border-[rgba(154,79,255,0.25)] pb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/ts-icon-gradient.png" alt="" className="h-9 w-auto" />
              <div>
                <p className="font-display text-sm font-bold text-white">STEVEN IA</p>
                <p className="text-[11px] text-green-400">● en línea</p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#5b2be0] px-4 py-2.5 text-white">¿En qué va el pedido TSA-0004?</div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-[rgba(154,79,255,0.3)] bg-[#1c1138] px-4 py-2.5 text-[#ece9f5]">
                ⚙️ Consultando comanda… <br /><br />
                El pedido <strong>TSA-0004</strong> — Picó \"La Tronada\" Doble Marquesina — está <strong className="text-[#35d6ff]">En Fabricación</strong> 🔧
                con Jhon Martínez. Entrega estimada: <strong>viernes</strong>. ¡Va muy bien!
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="relative overflow-hidden px-6 py-24 text-center md:py-32">
        <div className="absolute inset-0 opacity-50"><WaveCanvas className="h-full w-full" intensidad={0.6} /></div>
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 20%, #0a0614 78%)" }} />
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          className="relative z-10"
        >
          <h2 className="font-display text-3xl font-extrabold text-white md:text-5xl">
            Tu taller, <span className="texto-marca">más ordenado que nunca</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#b8b3cf]">
            Explora la demo completa: crea un pedido, sube fotos, avanza estados y descarga la comanda en PDF.
          </p>
          <Link href="/login" className="btn-marca mt-9 inline-block rounded-2xl px-10 py-4 text-lg font-bold text-white">
            🚀 Entrar al sistema
          </Link>
        </motion.div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-[rgba(154,79,255,0.25)] bg-[#130a26] px-6 py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 md:flex-row">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/ts-icon-white.png" alt="" className="h-10 w-auto" />
            <div>
              <p className="font-display text-sm font-bold tracking-widest text-white">TURBO STEVEN AUDIO</p>
              <p className="text-xs text-[#9d97b8]">Sonido que se ve · fabricación en la nube</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-[#b8b3cf]">
            <a href="https://wa.me/573107129559" target="_blank" rel="noreferrer" className="transition hover:text-white">📱 WhatsApp 310 7129559</a>
            <a href="https://instagram.com/turbosstevenaudio" target="_blank" rel="noreferrer" className="transition hover:text-white">📷 @turbosstevenaudio</a>
            <span>💵 Bancolombia · Nequi · Addi</span>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-[#6f6a86]">
          © {new Date().getFullYear()} TURBO STEVEN AUDIO — Demo del sistema de comandas · desarrollado con Next.js + IA
        </p>
      </footer>
    </main>
  );
}

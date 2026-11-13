import type { NeonQueryFunction } from "@neondatabase/serverless";
import { hace, en } from "./fechas";
import { hashPassword } from "./auth";

/**
 * Datos demo: 5 usuarios (3 accesibles en el login demo), 10 clientes y
 * 14 pedidos repartidos en todos los estados, con fotos de referencia de
 * public/brand/seed/ (pre-generadas con IA / fichas de marca).
 * Solo siembra si la tabla usuarios está vacía (idempotente).
 */

const DEMO_PASSWORD = "steven2026";

const USUARIOS = [
  { nombre: "Andrea Rodríguez", email: "admin@turbosteven.co", rol: "admin" },
  { nombre: "Carlos Mendoza", email: "vendedor@turbosteven.co", rol: "vendedor" },
  { nombre: "Jhon Martínez", email: "taller@turbosteven.co", rol: "taller" },
  { nombre: "Pedro Sánchez", email: "pedro.taller@turbosteven.co", rol: "taller" },
  { nombre: "Diana Pérez", email: "diana.ventas@turbosteven.co", rol: "vendedor" },
];

const CLIENTES = [
  { nombre: "Ricardo Gómez",     telefono: "310 452 7781", direccion: "Cra 45 #12-30, Barrio Triana", notas: "Cliente frecuente, paga de contado" },
  { nombre: "María Fernanda Ruiz", telefono: "311 789 2244", direccion: "Cll 8 #23-15, Centro", notas: "Apartó con $50.000" },
  { nombre: "Jorge Iván Patiño",  telefono: "315 220 9013", direccion: "Av. Simón Bolívar #45-90", notas: "" },
  { nombre: "Luz Adriana Cárdenas", telefono: "312 645 8890", direccion: "Cra 70 #33-21, La Castellana", notas: "Regalo para su esposo" },
  { nombre: "Andrés Felipe Muñoz", telefono: "318 902 5567", direccion: "Cll 45 #20-18, Zacapristán", notas: "" },
  { nombre: "Paola Andrea León",   telefono: "317 558 4412", direccion: "Cra 15 #78-40, Norte", notas: "Sensible al presupuesto, ofrecer Addi" },
  { nombre: "Diego Alejandro Torres", telefono: "320 771 3398", direccion: "Cll 30 #9-55, Las Ferias", notas: "" },
  { nombre: "Sandra Milena Ortiz", telefono: "313 884 6725", direccion: "Cra 80 #14-09, Kennedy", notas: "Recomendada por Ricardo G." },
  { nombre: "Óscar Julián Ramírez", telefono: "316 339 2287", direccion: "Cll 100 #15-60", notas: "" },
  { nombre: "Yuliana Restrepo",    telefono: "319 445 1176", direccion: "Cra 43D #29-77", notas: "Diseño tropical solicitado" },
];

type PSeed = {
  cliente: number; // índice en CLIENTES
  vendedor: number; // índice en USUARIOS
  responsable: number | null;
  producto: string;
  tipo: "parlante" | "mini_turbo" | "otro";
  cantidad: number;
  medidas: string;
  color_principal: string;
  color_secundario: string;
  especificaciones: string;
  precio: number;
  abono: number;
  inicio: number; // días hacia atrás del inicio
  entrega: number; // días hacia adelante (negativo = vencido) de la entrega
  estado: "pendiente" | "en_fabricacion" | "control_calidad" | "listo" | "entregado" | "cancelado";
  fotos: string[];
};

const S = "pico-sonoro-rojo", T = "pico-tronada-verde", L = "pico-lobo-azul", P = "pico-platino",
      TT = "pico-tropical", NM = "pico-neon-morado", RL = "pico-rey-leon", MT = "mini-turbo-negro",
      SP = "detalle-parlante-65", LM = "detalle-led-marquee", CT = "detalle-control",
      BM = "boceto-medidas", BC = "boceto-colores", BN = "boceto-nombre-led", BT = "boceto-tropical-art",
      RA = "referencia-azul", RT = "referencia-taller", RF = "referencia-fiesta";

const PEDIDOS: PSeed[] = [
  { cliente: 1, vendedor: 1, responsable: 2, producto: "Parlante Picó Personalizado \"El Sonoro\"", tipo: "parlante", cantidad: 1, medidas: "120cm alto × 50cm ancho × 40cm profundo", color_principal: "Rojo", color_secundario: "Negro", especificaciones: "Marquesina LED con nombre \"EL SONORO\", panel frontal con león, parlante 6.5\", micrófono, Bluetooth y luces LED", precio: 1850000, abono: 500000, inicio: 6, entrega: -2, estado: "pendiente", fotos: [S, BM, SP] },
  { cliente: 5, vendedor: 4, responsable: null, producto: "Mini Turbo Recargable", tipo: "mini_turbo", cantidad: 2, medidas: "34cm alto × 30cm ancho", color_principal: "Negro", color_secundario: "Gris", especificaciones: "2 salidas de succión/soplo, 2 horas de duración aprox, incluye luces LED y control", precio: 820000, abono: 100000, inicio: 2, entrega: 7, estado: "pendiente", fotos: [MT, CT] },
  { cliente: 8, vendedor: 1, responsable: null, producto: "Parlante Personalizado Tropical", tipo: "parlante", cantidad: 1, medidas: "80cm alto × 35cm ancho", color_principal: "Amarillo", color_secundario: "Verde", especificaciones: "Arte tropical con palmeras, nombre \"RITMO TROPICAL\" en marquesina LED, USB y emisora", precio: 990000, abono: 0, inicio: 1, entrega: 10, estado: "pendiente", fotos: [TT, BT, BC] },
  { cliente: 0, vendedor: 1, responsable: 2, producto: "Picó \"La Tronada\" Doble Marquesina", tipo: "parlante", cantidad: 1, medidas: "150cm alto × 60cm ancho × 45cm profundo", color_principal: "Verde", color_secundario: "Cromado", especificaciones: "Doble marquesina LED, cromo, parlante 6.5\" de alta potencia, cinturón para colgar", precio: 2400000, abono: 1200000, inicio: 4, entrega: 3, estado: "en_fabricacion", fotos: [T, LM, RT] },
  { cliente: 3, vendedor: 4, responsable: 3, producto: "Parlante con Panel Lobo Azul", tipo: "parlante", cantidad: 1, medidas: "90cm alto × 40cm ancho", color_principal: "Azul", color_secundario: "Negro", especificaciones: "Panel LED lenticular con lobo, Bluetooth, memoria, control remoto", precio: 1350000, abono: 50000, inicio: 3, entrega: 5, estado: "en_fabricacion", fotos: [L, BN] },
  { cliente: 6, vendedor: 1, responsable: 2, producto: "Mini Turbo Recargable + Parlante 6.5\"", tipo: "mini_turbo", cantidad: 1, medidas: "34cm alto × 30cm ancho", color_principal: "Negro", color_secundario: "Rojo", especificaciones: "Incluye parlante 6.5\", micrófono, emisora, luces LED y cinturón", precio: 410000, abono: 410000, inicio: 2, entrega: 4, estado: "en_fabricacion", fotos: [MT, SP] },
  { cliente: 9, vendedor: 1, responsable: 3, producto: "Picó \"El Rey\" con Arte León", tipo: "parlante", cantidad: 1, medidas: "110cm alto × 45cm ancho", color_principal: "Azul", color_secundario: "Plateado", especificaciones: "Arte de león con retroiluminación azul, marquesina blanca \"EL REY\", cromo perimetral", precio: 1650000, abono: 800000, inicio: 7, entrega: 1, estado: "control_calidad", fotos: [RL, LM] },
  { cliente: 4, vendedor: 4, responsable: 2, producto: "Parlante Cromado \"El Gran Lujo\"", tipo: "parlante", cantidad: 1, medidas: "100cm alto × 42cm ancho", color_principal: "Plateado", color_secundario: "Negro", especificaciones: "Acabado cromado, marquesina arcoíris \"EL GRAN LUJO\", micrófono y cables incluidos", precio: 2100000, abono: 2100000, inicio: 9, entrega: 2, estado: "control_calidad", fotos: [P, CT] },
  { cliente: 7, vendedor: 1, responsable: 3, producto: "Parlante Personalizado Neón", tipo: "parlante", cantidad: 1, medidas: "85cm alto × 38cm ancho", color_principal: "Morado", color_secundario: "Fucsia", especificaciones: "Marquesina LED \"STEVEN AUDIO\", panel Bluetooth, luces neón, control remoto", precio: 1150000, abono: 1150000, inicio: 12, entrega: -1, estado: "listo", fotos: [NM, RA] },
  { cliente: 2, vendedor: 4, responsable: 2, producto: "Mini Turbo + Accesorios Completos", tipo: "mini_turbo", cantidad: 1, medidas: "34cm alto × 30cm ancho", color_principal: "Negro", color_secundario: "Azul", especificaciones: "Paquete completo: escobillas, filtros, control remoto y luz LED de punta", precio: 410000, abono: 50000, inicio: 10, entrega: 0, estado: "listo", fotos: [MT, CT, BM] },
  { cliente: 0, vendedor: 1, responsable: 2, producto: "Picó Familiar \"Los Gómez\"", tipo: "parlante", cantidad: 1, medidas: "130cm alto × 55cm ancho", color_principal: "Rojo", color_secundario: "Negro", especificaciones: "Nombre de la familia en marquesina, doble parlante, emisora FM, USB", precio: 2250000, abono: 2250000, inicio: 20, entrega: -8, estado: "entregado", fotos: [S, RF] },
  { cliente: 5, vendedor: 4, responsable: 3, producto: "Parlante Personalizado Regalo", tipo: "parlante", cantidad: 1, medidas: "70cm alto × 32cm ancho", color_principal: "Fucsia", color_secundario: "Blanco", especificaciones: "Dedicatoria grabada, marquesina LED, Bluetooth y luces", precio: 890000, abono: 890000, inicio: 18, entrega: -6, estado: "entregado", fotos: [BC, RA] },
  { cliente: 8, vendedor: 1, responsable: 2, producto: "Mini Turbo Recargable (Entrega Express)", tipo: "mini_turbo", cantidad: 1, medidas: "34cm alto × 30cm ancho", color_principal: "Negro", color_secundario: "Cromado", especificaciones: "Entrega express en 3 días, incluye control y luces LED", precio: 410000, abono: 410000, inicio: 15, entrega: -4, estado: "entregado", fotos: [MT] },
  { cliente: 3, vendedor: 4, responsable: null, producto: "Parlante 6.5\" con Arte Personalizado", tipo: "parlante", cantidad: 1, medidas: "75cm alto × 30cm ancho", color_principal: "Azul", color_secundario: "Amarillo", especificaciones: "Cliente canceló: presupuesto cambió por viaje", precio: 950000, abono: 0, inicio: 14, entrega: -3, estado: "cancelado", fotos: [BN, BC] },
];

export async function sembrarDemo(s: NeonQueryFunction<false, false>) {
  const rows = (await s`SELECT count(*)::int AS n FROM usuarios`) as { n: number }[];
  if (rows[0]?.n > 0) return; // ya hay datos: no tocar

  const hash = hashPassword(DEMO_PASSWORD);
  const idsU: number[] = [];
  for (const u of USUARIOS) {
    const r = (await s`
      INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (${u.nombre}, ${u.email}, ${hash}, ${u.rol}) RETURNING id`) as { id: number }[];
    idsU.push(r[0].id);
  }
  const idsC: number[] = [];
  for (const c of CLIENTES) {
    const r = (await s`
      INSERT INTO clientes (nombre, telefono, direccion, notas) VALUES (${c.nombre}, ${c.telefono}, ${c.direccion}, ${c.notas}) RETURNING id`) as { id: number }[];
    idsC.push(r[0].id);
  }

  let numero = 1;
  for (const p of PEDIDOS) {
    const codigo = `TSA-${String(numero).padStart(4, "0")}`;
    const r = (await s`
      INSERT INTO pedidos (numero, codigo, cliente_id, vendedor_id, responsable_id, producto, tipo,
        cantidad, medidas, color_principal, color_secundario, especificaciones, precio, abono,
        fecha_inicio, fecha_entrega, estado, creado, actualizado)
      VALUES (${numero}, ${codigo}, ${idsC[p.cliente]}, ${idsU[p.vendedor]},
        ${p.responsable === null ? null : idsU[p.responsable]}, ${p.producto}, ${p.tipo}, ${p.cantidad},
        ${p.medidas}, ${p.color_principal}, ${p.color_secundario}, ${p.especificaciones}, ${p.precio}, ${p.abono},
        ${hace(p.inicio)}, ${en(p.entrega)}, ${p.estado}, ${hace(p.inicio)}, now())
      RETURNING id`) as { id: number }[];
    const pid = r[0].id;
    let orden = 0;
    for (const f of p.fotos) {
      await s`INSERT INTO pedido_fotos (pedido_id, src, orden) VALUES (${pid}, ${"/brand/seed/" + f + ".jpg"}, ${orden++})`;
    }
    await s`
      INSERT INTO pedido_historial (pedido_id, usuario_id, accion, detalle, creado)
      VALUES (${pid}, ${idsU[p.vendedor]}, ${"Pedido creado"}, ${`Comanda ${codigo} registrada por ${USUARIOS[p.vendedor].nombre}`}, ${hace(p.inicio)})`;
    if (p.estado !== "pendiente") {
      await s`
        INSERT INTO pedido_historial (pedido_id, usuario_id, accion, detalle, creado)
        VALUES (${pid}, NULL, ${"Estado: " + p.estado}, ${"Estado del pedido actualizado a " + p.estado.replace(/_/g, " ")}, ${hace(Math.max(0, p.inicio - 2))})`;
    }
    numero++;
  }

  // la secuencia continua desde el último número usado
  await s`SELECT setval('pedido_numero_seq', ${numero - 1}, true)`;
  console.log("[seed] Demo sembrado: 5 usuarios, 10 clientes, 14 pedidos");
}

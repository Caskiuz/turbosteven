# TURBO STEVEN AUDIO — Sistema de Comandas de Fabricación

Plataforma web en la nube para gestionar las comandas de fabricación de parlantes picó personalizados y MINI TURBO recargables de **TURBO STEVEN AUDIO**. Funciona desde cualquier computador o celular, con información guardada en una base de datos Postgres en la nube.

## ✨ Funcionalidades

1. **Numeración consecutiva automática** — cada comanda recibe su código `TSA-0001, TSA-0002…` sin duplicados (secuencia Postgres server-side).
2. **Registro de clientes** — nombre, teléfono/WhatsApp, dirección y notas.
3. **Fotos de referencia** — subida desde la cámara del celular o galería, con compresión automática en el navegador.
4. **Medidas, colores y especificaciones** — ficha técnica estructurada por producto.
5. **Responsables de fabricación** — asignación directa a operarios del taller.
6. **Fechas de inicio y entrega** — con alertas visuales de vencimiento.
7. **Estados en tiempo real** — Pendiente → En Fabricación → Control de Calidad → Listo → Entregado (vista kanban + lista).
8. **Roles con permisos (RBAC)** — Administrador / Vendedor / Taller, verificados en middleware y en cada endpoint.
9. **Historial completo** — auditoría por pedido y listado histórico con filtros.
10. **Comanda en PDF** — vista imprimible con marca, lista para imprimir o guardar como PDF.

**Extra con IA:** asistente virtual **Steven IA** (Gemini) entrenado con el catálogo, precios y políticas de la marca — y conectado a la base de datos para responder el estado real de cualquier comanda (function calling). Las imágenes de referencia del demo se pre-generaron con IA.

## 🔐 Cuentas de la demo

| Rol | Correo | Contraseña |
|---|---|---|
| 👑 Administrador | `admin@turbosteven.co` | `steven2026` |
| 💼 Vendedor | `vendedor@turbosteven.co` | `steven2026` |
| 🛠️ Taller | `taller@turbosteven.co` | `steven2026` |

## 🛠 Stack

- **Next.js 15** (App Router, TypeScript) + **Tailwind CSS 4** + **Framer Motion**
- **Neon Postgres** (driver serverless `@neondatabase/serverless`, esquema y datos demo auto-inicializados en el primer arranque)
- **Google Gemini API** (`gemini-2.5-flash`) para el asistente — streaming SSE + function calling, clave solo del lado del servidor
- Sesiones con cookie httpOnly firmada (HMAC-SHA256, WebCrypto) y contraseñas scrypt
- Canvas 2D para las ondas/ecualizador inmersivo de la marca

## 🚀 Puesta en marcha local

```bash
npm install
cp .env.example .env.local   # completar DATABASE_URL y GEMINI_API_KEY
npm run dev                  # http://localhost:3000
```

La base de datos (tablas + datos demo) se crea sola con el primer tráfico: no hay migraciones que correr.

## 📦 Despliegue en Vercel

1. Importa el repo en Vercel (o `vercel --prod`).
2. Variables de entorno: `DATABASE_URL` (Neon, pooled) y `GEMINI_API_KEY`.
3. Listo — cada push a `main` publica automáticamente.

## Scripts auxiliares

```bash
npm run seed:images                      # genera imágenes de referencia con IA (Gemini → Pollinations)
python -I scripts/placeholder-imagenes.py # fichas de marca locales para las faltantes
python -I scripts/extraer-logo.py        # re-extrae el emblema TS desde brandingyproductos/
```

---

Demo del proyecto propuesto a TURBO STEVEN AUDIO — desarrollado con Next.js, Neon y Gemini.

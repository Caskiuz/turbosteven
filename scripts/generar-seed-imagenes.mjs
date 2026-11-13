/**
 * Generador de imágenes de referencia para poblar el demo (SEED).
 *
 * Cadena por imagen (nunca rompe):
 *   1. Gemini image generation (modelos de imagen, capa gratuita — cuando haya cuota)
 *   2. Pollinations.ai (GET público, sin API key)
 *   3. Se deja "pendiente" -> scripts/placeholder-imagenes.py genera ficha de marca local
 *
 * Las imágenes quedan en public/brand/seed/ y se COMMITEAN al repo:
 * el seed de la BD solo referencia archivos locales (cero red en runtime).
 * Re-ejecutable: las ya generadas se saltan (útil cuando Gemini renueva cuota).
 *
 * Uso: npm run seed:images
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, "public", "brand", "seed");
const BRAND = path.join(ROOT, "public", "brand");
fs.mkdirSync(OUT, { recursive: true });

let GEMINI_KEY = "";
try {
  const env = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
  GEMINI_KEY = env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1]?.trim() ?? "";
} catch {}
const MODELOS_GEMINI = ["gemini-2.5-flash-image", "gemini-3.1-flash-image", "gemini-3-pro-image"];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const IMAGES = [
  { name: "pico-sonoro-rojo",  prompt: "Professional product photo of a tall Colombian picó sound system speaker, three stacked tiers with chrome trim, top LED marquee panel displaying glowing red text 'EL SONORO', black glossy cabinet, tropical artwork front panel with a lion, studio lighting, white background" },
  { name: "pico-tronada-verde", prompt: "Professional product photo of a custom Colombian picó party speaker with green glowing LED marquee text 'LA TRONADA', chrome corners, black wooden cabinet, rasta color stripes, studio product shot, light gray background" },
  { name: "pico-lobo-azul",     prompt: "Professional product photo of a portable party speaker with a glowing blue LED lenticular panel showing a fierce wolf artwork, rainbow LED marquee on top, chrome frame edges, shoulder strap, studio shot, soft white background" },
  { name: "pico-platino",       prompt: "Professional product photo of a luxury chrome-finished Colombian picó speaker with rainbow gradient LED marquee text 'EL GRAN LUJU', stacked curved tiers, microphone and cables beside it, studio lighting, white background" },
  { name: "pico-tropical",      prompt: "Professional product photo of a colorful tropical-themed custom speaker with palm trees and sunset artwork on the front LED panel, yellow LED marquee text 'RITMO TROPICAL', chrome trim, studio product shot" },
  { name: "pico-neon-morado",   prompt: "Professional product photo of a modern party speaker glowing with purple neon LED marquee text 'STEVEN AUDIO', dark cabinet with magenta accents, bluetooth panel, studio shot on dark gradient background" },
  { name: "pico-rey-leon",      prompt: "Professional product photo of a custom picó speaker with a majestic lion artwork on the front panel, blue LED backlight, silver chrome edges, top marquee with white LED text 'EL REY', studio product photography" },
  { name: "mini-turbo-negro",   prompt: "Professional product photo of a compact black portable party speaker box with exposed amplifier control panel, red LED lights, carrying belt, rechargeable battery box design, studio shot, white background" },
  { name: "detalle-parlante-65",prompt: "Close-up macro photo of a 6.5 inch professional audio woofer speaker driver with black cone and chrome basket, dramatic studio lighting, shallow depth of field" },
  { name: "detalle-led-marquee",prompt: "Close-up macro photo of a colorful rainbow LED dot-matrix marquee display on a speaker showing glowing gradient pixel text, chrome frame, dark background, neon glow" },
  { name: "detalle-control",    prompt: "Product photo of a wireless microphone and a small black remote control with cables laid out neatly on a dark surface, studio lighting, top-down view" },
  { name: "boceto-medidas",     prompt: "Hand-drawn pencil sketch on white paper of a tall two-tier speaker cabinet design with dimension arrows and measurements written like 34cm alto 30cm ancho, client design draft, slightly angled photo of the paper" },
  { name: "boceto-colores",     prompt: "Hand-drawn design sketch on notebook paper of a custom party speaker with colored pencil swatches in purple blue and yellow, handwritten notes about colors and name placement, client reference drawing" },
  { name: "boceto-nombre-led",  prompt: "Hand-drawn sketch on paper of a speaker front panel showing big block letters 'MI SONIDO' with notes about LED colors, arrows pointing to the marquee, client customization draft, photo of the drawing" },
  { name: "boceto-tropical-art",prompt: "Hand-drawn colorful sketch of tropical artwork with a palm tree, sun and waves for a speaker front panel, colored pencils on sketch paper, client art proposal photo" },
  { name: "referencia-azul",    prompt: "Simple product reference photo of a blue and black portable bluetooth speaker on a wooden workbench in a workshop, warm light, slightly casual phone-photo look" },
  { name: "referencia-taller",  prompt: "Photo of a workshop workbench with speaker building tools: wood cabinet parts, chrome corner protectors, screws, wires and a soldering iron, warm workshop lighting" },
  { name: "referencia-fiesta",  prompt: "Night scene photo of a street party in Colombia with a big custom picó speaker glowing with colorful LED lights, people silhouettes dancing, vibrant atmosphere, cinematic" },
];

function log(...m) { console.log(new Date().toISOString().slice(11, 19), ...m); }
const extDe = (mime) => (mime.includes("jpeg") || mime.includes("jpg") ? "jpg" : "png");
const buscar = (name) => fs.readdirSync(OUT).find((f) => f.startsWith(name + "."));

async function geminiImage(prompt) {
  if (!GEMINI_KEY) throw new Error("sin GEMINI_API_KEY");
  for (const modelo of MODELOS_GEMINI) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI_KEY },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "1:1" } },
          }),
          signal: AbortSignal.timeout(120000),
        }
      );
      if (!res.ok) throw new Error(`${modelo} ${res.status}`);
      const data = await res.json();
      const img = (data?.candidates?.[0]?.content?.parts ?? []).find((p) => p.inlineData?.data);
      if (!img) throw new Error(`${modelo} sin imagen`);
      return { buf: Buffer.from(img.inlineData.data, "base64"), mime: img.inlineData.mimeType || "image/png", modelo };
    } catch (e) {
      log("  fallo", String(e.message).slice(0, 70));
    }
  }
  throw new Error("sin cuota en ningún modelo de imagen");
}

async function pollinationsImage(prompt, seed) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`pollinations ${res.status}`);
  const mime = res.headers.get("content-type") || "image/jpeg";
  if (!mime.startsWith("image/")) throw new Error("pollinations sin imagen");
  return { buf: Buffer.from(await res.arrayBuffer()), mime };
}

async function generar() {
  const estado = {};
  const pendientesRonda1 = [];

  for (const { name, prompt } of IMAGES) {
    const ya = buscar(name);
    if (ya) { estado[name] = "previa"; log("SKIP", ya); continue; }
    let guardada = false;
    try {
      const { buf, mime, modelo } = await geminiImage(prompt);
      fs.writeFileSync(path.join(OUT, `${name}.${extDe(mime)}`), buf);
      log("GEMINI OK", name, `(${modelo})`);
      guardada = true;
    } catch (e) { log("GEMINI", name, "-", String(e.message).slice(0, 70)); }
    if (!guardada) pendientesRonda1.push({ name, prompt });
    estado[name] = guardada ? "gemini" : "pendiente";
    await delay(3000);
  }

  // ronda 2: Pollinations con pausas largas (límite anónimo)
  log(`--- Pollinations para ${pendientesRonda1.length} pendientes ---`);
  for (const { name, prompt } of pendientesRonda1) {
    if (estado[name] === "gemini") continue;
    try {
      const { buf, mime } = await pollinationsImage(prompt, 7);
      fs.writeFileSync(path.join(OUT, `${name}.${extDe(mime)}`), buf);
      log("POLLINATIONS OK", name);
      estado[name] = "pollinations";
    } catch (e) {
      log("POLLINATIONS fallo", name, "-", String(e.message).slice(0, 70));
    }
    await delay(18000);
  }

  // ronda 3: segundo intento Pollinations para lo que quedó
  for (const { name, prompt } of pendientesRonda1) {
    if (estado[name] !== "pendiente") continue;
    try {
      const { buf, mime } = await pollinationsImage(prompt, 42);
      fs.writeFileSync(path.join(OUT, `${name}.${extDe(mime)}`), buf);
      log("POLLINATIONS OK (r3)", name);
      estado[name] = "pollinations";
    } catch (e) { log("r3 fallo", name, "-", String(e.message).slice(0, 70)); }
    await delay(25000);
  }

  fs.writeFileSync(
    path.join(OUT, "manifest.json"),
    JSON.stringify({ generado: new Date().toISOString(), imagenes: estado }, null, 2)
  );
  const faltan = IMAGES.filter(({ name }) => estado[name] === "pendiente").map(({ name }) => name);
  if (faltan.length) log("PENDIENTES (placeholder local):", faltan.join(", "));
  else log("Todas generadas.");
  log("Listo:", OUT);
}

generar().catch((e) => { console.error(e); process.exit(1); });

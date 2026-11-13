/**
 * Steven IA — proxy server-side al chatbot Gemini.
 * La clave nunca sale del servidor. Streaming SSE de eventos:
 *   {t:'d', v:texto}  delta de texto
 *   {t:'tool', v:desc} ejecución de herramienta (function calling)
 *   {t:'err', v:mensaje}
 *   {t:'done'}
 */
import { NextRequest } from "next/server";
import { instruccionesSistema } from "@/lib/chat/conocimiento";
import { consultarPedido, type InfoPedido } from "@/lib/chat/consultar-pedido";

export const runtime = "nodejs";
// el streaming + function calling puede tardar; Hobby permite hasta 60 s
export const maxDuration = 60;

const MODELOS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-2.5-flash-lite"];
const API = "https://generativelanguage.googleapis.com/v1beta/models";
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DECLARACIONES = [
  {
    name: "consultar_pedido",
    description:
      "Consulta el estado actual de una comanda de fabricación por su código (ej. TSA-0007 o solo el número 7). Devuelve producto, estado, responsable y fechas.",
    parameters: {
      type: "object",
      properties: {
        codigo: { type: "string", description: "Código de la comanda, ej. TSA-0003 o 3" },
      },
      required: ["codigo"],
    },
  },
];

/* límite simple en memoria: 8 req/min por IP (protege la cuota gratuita) */
const VENTANA = 60_000;
const llamadas = new Map<string, number[]>();
function excedeLimite(ip: string): boolean {
  const ahora = Date.now();
  const prev = (llamadas.get(ip) ?? []).filter((t) => ahora - t < VENTANA);
  if (prev.length >= 8) return true;
  prev.push(ahora);
  llamadas.set(ip, prev);
  return false;
}

interface ParteGemini { text?: string; functionCall?: { name: string; args?: Record<string, string> } }
interface Contenido { role: "user" | "model"; parts: ParteGemini[] }

async function* streamGemini(modelo: string, key: string, body: object): AsyncGenerator<ParteGemini> {
  const res = await fetch(`${API}/${modelo}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok || !res.body) {
    throw Object.assign(new Error(`gemini ${res.status}: ${(await res.text()).slice(0, 200)}`), { status: res.status });
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    // Gemini usa separadores CRLF: /r/n/r/n
    const bloques = buffer.split(/\r?\n\r?\n/);
    buffer = bloques.pop() ?? "";
    for (const bloque of bloques) {
      const linea = bloque.split(/\r?\n/).find((l) => l.startsWith("data:"));
      if (!linea) continue;
      try {
        const json = JSON.parse(linea.slice(5).trim());
        const partes: ParteGemini[] = json?.candidates?.[0]?.content?.parts ?? [];
        for (const p of partes) yield p;
      } catch { /* bloque incompleto */ }
    }
  }
}

function sse(evento: object): string {
  return `data: ${JSON.stringify(evento)}\n\n`;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (excedeLimite(ip)) {
    return new Response(sse({ t: "err", v: "Demasiadas preguntas seguidas — espera un momento ⏳" }) + sse({ t: "done" }), {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const body = (await req.json().catch(() => null)) as null | {
    mensaje?: string;
    historial?: Contenido[];
  };
  const mensaje = body?.mensaje?.trim();
  if (!mensaje) {
    return new Response(sse({ t: "err", v: "Mensaje vacío" }) + sse({ t: "done" }), {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return new Response(sse({ t: "err", v: "Steven IA no está configurado (falta GEMINI_API_KEY)" }) + sse({ t: "done" }), {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const historial: Contenido[] = (body?.historial ?? [])
    .slice(-10)
    .filter((h) => h.role === "user" || h.role === "model")
    .map((h) => ({ role: h.role, parts: h.parts.filter((p) => p.text) }));

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const emit = (o: object) => controller.enqueue(enc.encode(sse(o)));

      try {
        const contenidos: Contenido[] = [...historial, { role: "user", parts: [{ text: mensaje }] }];
        let resultado = "";
        let ultimaInfoPedido: InfoPedido | null = null;
        let consultaSinResultado = false;

        // pre-consulta determinista: si el usuario mencionó un código TSA-XXXX,
        // se obtiene el estado YA (independiente de que el modelo esté saturado)
        const coincidenciaCodigo = mensaje.match(/TSA[-\s]?(\d{1,5})/i);
        if (coincidenciaCodigo) {
          try {
            const info = await consultarPedido(`TSA-${coincidenciaCodigo[1].padStart(4, "0")}`);
            ultimaInfoPedido = info;
            consultaSinResultado = !info;
          } catch { /* BD caída: seguimos, Gemini puede responder de forma general */ }
        }

        for (let iter = 0; iter < 3; iter++) {
          const payload = {
            contents: contenidos,
            systemInstruction: { parts: [{ text: instruccionesSistema() }] },
            tools: [{ functionDeclarations: DECLARACIONES }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } },
          };

          let partes: ParteGemini[] = [];
          let errorUltimo: Error | null = null;
          for (let intento = 0; intento < 2; intento++) {
            for (const modelo of MODELOS) {
              try {
                const chunks: ParteGemini[] = [];
                for await (const parte of streamGemini(modelo, key, payload)) {
                  if (parte.text) {
                    emit({ t: "d", v: parte.text });
                    resultado += parte.text;
                  }
                  chunks.push(parte);
                }
                partes = chunks;
                // el modelo a veces responde 200 sin contenido (quirk thinking 0 + tools): reintentar
                errorUltimo = partes.length === 0 ? new Error("respuesta vacía del modelo") : null;
                if (!errorUltimo) break;
              } catch (e) {
                errorUltimo = e as Error;
                // sobrecarga o límite de cuota: breve espera y sigue con el siguiente modelo
                if (/\b(429|503)\b/.test(errorUltimo.message)) await delay(1200);
              }
            }
            if (!errorUltimo) break;
            if (intento === 0) await delay(2000); // segunda ronda completa ante sobrecarga
          }

          const calls = partes.filter((p) => p.functionCall).map((p) => p.functionCall!);

          if (errorUltimo) {
            // degradación elegante: si ya consultamos la BD, respondemos con formato local
            if (ultimaInfoPedido || consultaSinResultado) {
              const texto = ultimaInfoPedido
                ? `📦 El pedido **${ultimaInfoPedido.codigo}** — ${ultimaInfoPedido.producto} — está en estado **${ultimaInfoPedido.estado_nombre}** ${ultimaInfoPedido.estado === "en_fabricacion" ? "🛠️" : "✨"} con ${ultimaInfoPedido.responsable ?? "el taller"}. Entrega prevista: ${ultimaInfoPedido.fecha_entrega}. ¡Va muy bien! 🎵`
                : "🔍 No encontré ninguna comanda con ese código. Revisa el formato (ej. TSA-0004) o consulta con tu vendedor.";
              emit({ t: "d", v: texto });
              resultado += texto;
              break;
            }
            throw errorUltimo;
          }

          if (!calls.length) break; // respuesta completa

          contenidos.push({ role: "model", parts: partes });
          for (const call of calls) {
            if (call.name === "consultar_pedido") {
              emit({ t: "tool", v: "Consultando comanda…" });
              let respuesta: object;
              try {
                const info = await consultarPedido(String(call.args?.codigo ?? ""));
                ultimaInfoPedido = info;
                consultaSinResultado = !info;
                respuesta = { encontrado: !!info, pedido: info ?? null };
              } catch {
                consultaSinResultado = true;
                respuesta = { encontrado: false, error: "La base de datos no está disponible en este momento" };
              }
              contenidos.push({
                role: "user",
                parts: [{ functionResponse: { name: "consultar_pedido", response: respuesta } }],
              } as unknown as Contenido);
            } else {
              contenidos.push({
                role: "user",
                parts: [{ functionResponse: { name: call.name, response: { ok: false, error: "Herramienta desconocida" } } }],
              } as unknown as Contenido);
            }
          }
        }

        emit({ t: "done", v: resultado });
      } catch (e) {
        emit({ t: "err", v: "Steven IA está saturado ahora mismo — intenta de nuevo en unos segundos." });
        emit({ t: "done" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
  });
}

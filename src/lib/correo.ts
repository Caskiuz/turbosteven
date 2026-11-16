/**
 * Envío de correos por SMTP estándar (Brevo u otro proveedor).
 * Se activa solo si existen las variables SMTP_HOST / SMTP_USER / SMTP_PASS:
 * si faltan, el sistema sigue funcionando con las notificaciones internas de la campana.
 */
import nodemailer from "nodemailer";

const URL_SISTEMA = process.env.URL_SISTEMA || "https://turbosteven.vercel.app";

let transporteur: nodemailer.Transporter | null = null;

function transportador(): nodemailer.Transporter | null {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CORREO_REMITENTE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !CORREO_REMITENTE) return null;
  if (!transporteur) {
    transporteur = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT || 587),
      secure: Number(SMTP_PORT || 587) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
  }
  return transporteur;
}

export async function enviarCorreo(
  para: string,
  titulo: string,
  mensaje: string | null,
  enlace?: string | null
): Promise<void> {
  const t = transportador();
  if (!t) return; // sin credenciales SMTP: se omite el correo sin fallar

  const boton = enlace
    ? `<a href="${URL_SISTEMA}${enlace}" style="display:inline-block;background:linear-gradient(100deg,#5b2be0,#b04fff);color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 28px;border-radius:12px;margin-top:18px">Ver en el sistema</a>`
    : "";

  await t.sendMail({
    from: `"TURBO STEVEN AUDIO" <${process.env.CORREO_REMITENTE}>`,
    to: para,
    subject: `TURBO STEVEN AUDIO - ${titulo}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;background:#f4f3f8;padding:28px">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border-top:6px solid #5b2be0">
          <div style="padding:22px 26px 0">
            <p style="margin:0;font-size:13px;letter-spacing:3px;color:#5b2be0;font-weight:bold">TURBO STEVEN AUDIO</p>
            <h1 style="margin:10px 0 6px;font-size:20px;color:#232527">${titulo}</h1>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#4a4a55">${mensaje ?? ""}</p>
            ${boton}
            <p style="margin:26px 0 0;font-size:11px;color:#9a9aa5">Notificación automática del sistema de comandas de fabricación.</p>
          </div>
          <div style="height:8px;background:linear-gradient(90deg,#5b2be0,#b04fff,#35d6ff);margin-top:22px"></div>
        </div>
      </div>`,
  });
}

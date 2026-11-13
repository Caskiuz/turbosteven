# -*- coding: utf-8 -*-
"""Genera la portada de la guia y la fusiona con el cuerpo -> PDF final."""
import os
import sys

PDF_SKILL_DIR = r"C:\Users\rijar\.zcode\cli\plugins\cache\zcode-plugins-official\pdf\0.2.3\skills\pdf"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(PDF_SKILL_DIR, "scripts"))

from cover_render import detect_fonts, render_cover  # noqa: E402
from pypdf import PdfReader, PdfWriter, Transformation  # noqa: E402

A4_W, A4_H = 595.28, 841.89
COVER = os.path.join(ROOT, "docs", "guia-portada.pdf")
BODY = os.path.join(ROOT, "docs", "guia-cuerpo.pdf")
FINAL = os.path.join(ROOT, "docs", "Guia-Sistema-Comandas-TURBO-STEVEN-AUDIO.pdf")

contenido = {
    "kicker": "GUÍA DE USO Y VERIFICACIÓN DE LA PROPUESTA",
    "hero": "TURBO STEVEN AUDIO",
    "summary": (
        "Manual práctico para probar el Sistema Web de Gestión de Comandas de Fabricación: "
        "acceso por roles, guía paso a paso de cada módulo, asistente virtual con IA y "
        "verificación de los 10 requerimientos de la propuesta técnica y comercial."
    ),
    "meta": "Documento de entrega para el cliente · Noviembre de 2026",
    "footer": "SISTEMA WEB DE COMANDAS DE FABRICACIÓN",
    "year": "2026",
    "word": "GUÍA",
}
paleta = {"primary": "#502dbc", "text": "#232527", "muted": "#798085", "bg": "#ffffff"}
fuentes = detect_fonts()
render_cover("05", contenido, COVER, palette=paleta, fonts=fuentes)
print("Portada:", COVER)

def normalizar_a4(page):
    box = page.mediabox
    w, h = float(box.width), float(box.height)
    if abs(w - A4_W) > 2 or abs(h - A4_H) > 2:
        page.add_transformation(Transformation().scale(sx=A4_W / w, sy=A4_H / h))
        page.mediabox.lower_left = (0, 0)
        page.mediabox.upper_right = (A4_W, A4_H)
    return page

writer = PdfWriter()
writer.add_page(normalizar_a4(PdfReader(COVER).pages[0]))
for page in PdfReader(BODY).pages:
    writer.add_page(normalizar_a4(page))
writer.add_metadata({
    "/Title": "Guia del Sistema de Comandas - TURBO STEVEN AUDIO",
    "/Author": "Z.ai",
    "/Creator": "Z.ai",
    "/Subject": "Manual de uso y verificacion de la propuesta tecnica y comercial",
})
with open(FINAL, "wb") as f:
    writer.write(f)
print("PDF final:", FINAL, "-", len(writer.pages), "paginas")

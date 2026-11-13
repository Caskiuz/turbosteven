"""
Genera fichas de producto de marca para las imágenes seed que la IA no pudo
crear (sin cuota Gemini / sin acceso a Pollinations). Diseño coherente con la
marca: fondo degradado oscuro violeta->magenta, emblema TS como marca de agua,
nombre del producto y etiqueta "FOTO DE REFERENCIA".

Uso: python -I scripts/placeholder-imagenes.py
Escanea public/brand/seed/ y completa las que falten según la lista de abajo.
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(ROOT, "public", "brand", "seed")
os.makedirs(SEED, exist_ok=True)

VIOLET = (91, 43, 224)     # #5B2BE0
MAGENTA = (176, 79, 255)   # #B04FFF
FONDO1 = (16, 8, 34)       # #100822
FONDO2 = (43, 27, 77)      # #2B1B4D
CYAN = (53, 214, 255)
AMARILLO = (255, 212, 0)

# nombre de archivo -> texto a mostrar y subtítulo
FICHAS = {
    "pico-sonoro-rojo":      ("EL SONORO", "Parlante picó personalizado · 3 niveles"),
    "pico-tronada-verde":    ("LA TRONADA", "Parlante picó personalizado · LED verde"),
    "pico-lobo-azul":        ("LOBO AZUL", "Parlante personalizado · panel LED"),
    "pico-platino":          ("EL GRAN LUJO", "Parlante picó · acabado cromado"),
    "pico-tropical":         ("RITMO TROPICAL", "Parlante personalizado · arte tropical"),
    "pico-neon-morado":      ("STEVEN AUDIO", "Parlante personalizado · neón"),
    "pico-rey-leon":         ("EL REY", "Parlante picó personalizado · arte león"),
    "mini-turbo-negro":      ("MINI TURBO", "Recargable · 2 salidas de succión/soplo"),
    "detalle-parlante-65":   ("PARLANTE 6.5\"", "Componente · detalle técnico"),
    "detalle-led-marquee":   ("MARQUESINA LED", "Detalle · texto en movimiento"),
    "detalle-control":       ("CONTROL + MICRÓFONO", "Incluido con el pedido"),
    "boceto-medidas":        ("BOCETO · MEDIDAS", "Referencia del cliente"),
    "boceto-colores":        ("BOCETO · COLORES", "Referencia del cliente"),
    "boceto-nombre-led":     ("BOCETO · NOMBRE LED", "Referencia del cliente"),
    "boceto-tropical-art":   ("BOCETO · ARTE TROPICAL", "Referencia del cliente"),
    "referencia-azul":       ("REFERENCIA", "Producto similar del catálogo"),
    "referencia-taller":     ("TALLER", "Proceso de fabricación"),
    "referencia-fiesta":     ("EN LA FIESTA", "Experiencia de cliente"),
}

SIZE = 1024

def gradient(c1, c2, size):
    xs = np.linspace(0, 1, size[0], dtype=np.float32)
    ys = np.linspace(0, 1, size[1], dtype=np.float32)
    t = (xs[None, :] + ys[:, None]) / 2
    arr = np.stack([
        c1[0] + (c2[0] - c1[0]) * t,
        c1[1] + (c2[1] - c1[1]) * t,
        c1[2] + (c2[2] - c1[2]) * t,
        np.full_like(t, 255.0),
    ], axis=-1).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")

def fuente(tam, bold=True):
    from PIL import ImageFont
    candidatos = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\impact.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for c in candidatos:
        if os.path.exists(c):
            try:
                return ImageFont.truetype(c, tam)
            except Exception:
                pass
    return ImageFont.load_default()

def centrado(d, texto, y, f, fill, esp=0):
    bb = d.textbbox((0, 0), texto, font=f)
    d.text(((SIZE - (bb[2] - bb[0])) / 2 - bb[0], y), texto, font=f, fill=fill)

def ficha(nombre, titulo, subtitulo):
    im = gradient(FONDO1, FONDO2, (SIZE, SIZE)).convert("RGBA")
    d = ImageDraw.Draw(im)

    # textura de rayos diagonales sutiles
    rayos = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    dr = ImageDraw.Draw(rayos)
    for i in range(-SIZE, SIZE * 2, 90):
        dr.line([(i, 0), (i + SIZE, SIZE)], fill=(255, 255, 255, 10), width=26)
    im.alpha_composite(rayos)

    # emblema TS grande como marca de agua
    ic = Image.open(os.path.join(ROOT, "public", "brand", "ts-icon-white.png")).convert("RGBA")
    aw, ah = ic.size
    es = int(SIZE * 0.52)
    ic = ic.resize((es, int(es * ah / aw)), Image.LANCZOS)
    ic.putalpha(ic.split()[3].point(lambda a: int(a * 0.08)))
    im.alpha_composite(ic, ((SIZE - ic.size[0]) // 2, (SIZE - ic.size[1]) // 2 - int(SIZE * 0.06)))

    # marco tipo comanda
    d.rounded_rectangle([64, 64, SIZE - 65, SIZE - 65], radius=42, outline=(*MAGENTA, 130), width=3)

    # emblema pequeño arriba
    ic2 = ic.copy()
    es2 = 92
    ic2 = Image.open(os.path.join(ROOT, "public", "brand", "ts-icon-white.png")).convert("RGBA")
    ic2 = ic2.resize((int(es2 * ic2.size[0] / ic2.size[1]), es2), Image.LANCZOS)
    im.alpha_composite(ic2, ((SIZE - ic2.size[0]) // 2, 132))

    centrado(d, "TURBO STEVEN AUDIO", 248, fuente(30), (*CYAN, 230))
    # título en dos líneas si es largo
    f_tit = fuente(88 if len(titulo) <= 16 else 64)
    centrado(d, titulo, 430, f_tit, (255, 255, 255, 255))
    centrado(d, subtitulo, 560, fuente(34), (*MAGENTA, 255))

    # etiqueta inferior
    d.rounded_rectangle([SIZE // 2 - 240, SIZE - 176, SIZE // 2 + 240, SIZE - 104],
                        radius=36, outline=(*AMARILLO, 200), width=3)
    centrado(d, "FOTO DE REFERENCIA", SIZE - 164, fuente(30), (*AMARILLO, 235))

    ext = "jpg"
    im.convert("RGB").save(os.path.join(SEED, f"{nombre}.{ext}"), quality=90)
    print("OK  ", f"{nombre}.{ext}")

generados = 0
for nombre, (t, s) in FICHAS.items():
    if any(f.startswith(nombre + ".") for f in os.listdir(SEED)):
        continue
    ficha(nombre, t, s)
    generados += 1
print(f"Placeholders creados: {generados}")

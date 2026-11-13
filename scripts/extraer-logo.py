"""
Extrae el emblema TS (escudo con alas) y el lockup completo del logo
desde brandingyproductos/banner.jpeg y genera las variantes de marca.

La punta del ala derecha se solapa horizontalmente con la "T" del wordmark,
por eso la separacion se hace por COMPONENTES CONEXOS (scipy.ndimage.label):
cada pieza (alas, escudo, letras) es un blob; el emblema son los blobs cuya
caja termina antes de x=WING_LIMIT y el wordmark los demas.

Salidas en public/brand/ y src/app/:
  ts-icon-black.png / ts-icon-white.png / ts-icon-gradient.png   (emblema)
  ts-logo-black.png / ts-logo-white.png                          (lockup completo)
  icon-192.png, src/app/icon.png (512), src/app/apple-icon.png (180)
"""
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
from scipy import ndimage
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "brandingyproductos", "banner.jpeg")
OUT = os.path.join(ROOT, "public", "brand")
APP = os.path.join(ROOT, "src", "app")

VIOLET = (106, 44, 255)    # #6A2CFF
MAGENTA = (176, 79, 255)   # #B04FFF

os.makedirs(OUT, exist_ok=True)
os.makedirs(APP, exist_ok=True)

img = Image.open(SRC).convert("L")
img = img.filter(ImageFilter.MedianFilter(3))
w, h = img.size

# --- alpha = oscuridad, con contraste reforzado (bordes suaves, ruido limpio) ---
# ojo: aritmetica en int32; en int16 (HI-0)*255 desborda y anula los negros
LO, HI = 150, 230  # gray <= LO -> opaco; gray >= HI -> transparente
alpha_np = np.clip((HI - np.asarray(img, dtype=np.int32)) * 255 // (HI - LO), 0, 255).astype(np.uint8)
alpha_full = Image.fromarray(alpha_np, "L")

# --- componentes conexos de la tinta real (gray < 128) ---
ink = np.asarray(img) < 128
labels, n = ndimage.label(ink, structure=np.ones((3, 3)))
print(f"componentes: {n}")
objs = ndimage.find_objects(labels)
emblem_mask = np.zeros_like(ink)
logo_mask = np.zeros_like(ink)
WING_LIMIT = int(w * 0.41)  # ~656px: todo blob que termine antes es del emblema
sizes = ndimage.sum(ink, labels, range(1, n + 1))
for i, sl in enumerate(objs):
    if sl is None or sizes[i] < 30:  # migajas JPEG
        continue
    x1 = sl[1].stop
    blob = labels[sl] == (i + 1)
    if x1 <= WING_LIMIT:
        emblem_mask[sl] |= blob
    if x1 <= WING_LIMIT or sizes[i] >= 300:  # emblema + letras grandes (no ruido)
        logo_mask[sl] |= blob

print(f"emblema: x=[0, {np.max(np.nonzero(emblem_mask.any(axis=0))[0])}]  "
      f"blobs emblema={int(emblem_mask.any())}, px={int(emblem_mask.sum())}")

DIL = ndimage.binary_dilation(emblem_mask, iterations=5)
DIL_LOGO = ndimage.binary_dilation(logo_mask, iterations=5)

def alpha_from(mask_dilated):
    a = alpha_np.copy()
    a[~mask_dilated] = 0
    im = Image.fromarray(a, "L")
    bbox = im.getbbox()
    return im.crop(bbox) if bbox else im

alpha_emblem = alpha_from(DIL)
alpha_logo = alpha_from(DIL_LOGO)
print("emblema:", alpha_emblem.size, " lockup:", alpha_logo.size)

def colored(alpha, rgb):
    out = Image.new("RGBA", alpha.size, rgb + (0,))
    out.putalpha(alpha)
    return out

def gradient_rgba(size, c1, c2):
    wd, ht = size
    xs = np.linspace(0, 1, wd)
    ys = np.linspace(0, 1, ht)
    t = (xs[None, :] + ys[:, None]) / 2
    r = c1[0] + (c2[0] - c1[0]) * t
    g = c1[1] + (c2[1] - c1[1]) * t
    b = c1[2] + (c2[2] - c1[2]) * t
    alpha255 = np.full_like(t, 255.0)
    arr = np.stack([r, g, b, alpha255], axis=-1).astype(np.uint8)
    return Image.fromarray(arr, "RGBA")

def with_gradient(alpha, c1, c2):
    g = gradient_rgba(alpha.size, c1, c2)
    g.putalpha(alpha)
    return g

def save(im, name, out_dir=OUT):
    p = os.path.join(out_dir, name)
    im.save(p)
    print(f"OK  {p}  {im.size[0]}x{im.size[1]}")

save(colored(alpha_emblem, (0, 0, 0)), "ts-icon-black.png")
save(colored(alpha_emblem, (255, 255, 255)), "ts-icon-white.png")
save(with_gradient(alpha_emblem, VIOLET, MAGENTA), "ts-icon-gradient.png")
save(colored(alpha_logo, (0, 0, 0)), "ts-logo-black.png")
save(colored(alpha_logo, (255, 255, 255)), "ts-logo-white.png")

# --- icono de app: cuadrado redondeado degradado + emblema blanco centrado ---
def app_icon(size, out_path, bg1=VIOLET, bg2=MAGENTA):
    base = gradient_rgba((size, size), bg1, bg2)
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 0.22), fill=255)
    transparent = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    transparent.paste(base, (0, 0), mask)
    aw, ah = alpha_emblem.size
    es = int(size * 0.62)
    if aw >= ah:
        ew, eh = es, max(1, int(es * ah / aw))
    else:
        ew, eh = max(1, int(es * aw / ah)), es
    emb = colored(alpha_emblem, (255, 255, 255)).resize((ew, eh), Image.LANCZOS)
    transparent.alpha_composite(emb, ((size - ew) // 2, (size - eh) // 2 - int(size * 0.02)))
    transparent.save(out_path)
    print(f"OK  {out_path}  {size}x{size}")

app_icon(512, os.path.join(APP, "icon.png"))
app_icon(180, os.path.join(APP, "apple-icon.png"))
app_icon(192, os.path.join(OUT, "icon-192.png"))
print("Listo.")

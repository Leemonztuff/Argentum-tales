#!/usr/bin/env python3
"""Normaliza sprites Body/Head (Jobs) a baseline de pies comun y centro estable.

Contrato del renderer (src/engine/Game3DRenderer.ts):
  - hojas 4x4, fondo magenta (chroma-key, JPEG sin alpha) o PNG con alpha
  - pies anclados abajo, contenido recentrado por frame (getNonEmptyBounds)
  - canvas final 256x256, pies en y=242

Lo que hace:
  audit (por defecto): reporta por hoja varianza de baseline (pies) y de
    centro-X por frame. Eso es lo que en movil se ve como "saltos"/"flote".
  --fix: reescribe cada celda con el contenido centrado en X y los pies
    alineados a la baseline comun de la hoja. Guarda copias en
    public/players/.normalized/ (NUNCA sobrescribe originales).

Uso:
  python3 normalize_sprites.py            # solo auditoria
  python3 normalize_sprites.py --fix      # auditoria + copias normalizadas
"""
import glob
import json
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.abspath(__file__))
BODY_GLOB = "public/players/Jobs/Nueva coleccion/Body/**/*.png"
HEAD_FILES = sorted(glob.glob(os.path.join(ROOT, "public/players/Jobs/*head_spritesheet.png")))
OUT_ROOT = os.path.join(ROOT, "public/players/.normalized")

MAG_TOL = 60


def is_magenta(r, g, b):
    return r > 200 and g < 80 and b > 200 and abs(r - b) < MAG_TOL


def content_bbox(img, x0, y0, w, h):
    """Bbox del contenido dentro de una celda (excluye magenta / transparente)."""
    crop = img.crop((x0, y0, x0 + w, y0 + h)).convert("RGBA")
    px = crop.load()
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a <= 10 or is_magenta(r, g, b):
                continue
            if x < minx:
                minx = x
            if x > maxx:
                maxx = x
            if y < miny:
                miny = y
            if y > maxy:
                maxy = y
    if maxx < minx:
        return None
    return (minx, miny, maxx, maxy)


def audit_sheet(path, cols=4, rows=4):
    im = Image.open(path)
    W, H = im.size
    fw, fh = W // cols, H // rows
    frames = []
    for row in range(rows):
        for col in range(cols):
            bb = content_bbox(im, col * fw, row * fh, fw, fh)
            if bb is None:
                frames.append(None)
                continue
            minx, miny, maxx, maxy = bb
            frames.append(
                {
                    "col": col,
                    "row": row,
                    "w": maxx - minx + 1,
                    "h": maxy - miny + 1,
                    # pies: borde inferior del contenido, relativo a la celda
                    "feet": maxy,
                    # centro-X del contenido vs centro de celda (px, + = a la derecha)
                    "cx_off": (minx + maxx + 1) / 2 - fw / 2,
                }
            )
    valid = [f for f in frames if f]
    rep = {
        "file": os.path.relpath(path, ROOT),
        "size": [W, H],
        "mode": im.mode,
        "frame": [fw, fh],
        "empty_frames": sum(1 for f in frames if f is None),
    }
    if valid:
        feet = [f["feet"] for f in valid]
        cx = [f["cx_off"] for f in valid]
        rep.update(
            {
                "feet_min": min(feet),
                "feet_max": max(feet),
                "feet_spread": max(feet) - min(feet),
                "cx_spread": round(max(cx) - min(cx), 1),
                "frames": frames,
            }
        )
    return rep


def normalize_sheet(path, cols=4, rows=4):
    """Reubica el contenido de cada celda: centro-X + pies a baseline comun."""
    im = Image.open(path).convert("RGB")
    W, H = im.size
    fw, fh = W // cols, H // rows
    px_src = im.load()
    # fondo = magenta puro (mismo key que el renderer)
    out = Image.new("RGB", (W, H), (255, 0, 255))
    px_dst = out.load()
    boxes = []
    for row in range(rows):
        for col in range(cols):
            bb = content_bbox(im, col * fw, row * fh, fw, fh)
            boxes.append(bb)
    valid = [b for b in boxes if b]
    if not valid:
        return None
    baseline = max(b[3] for b in valid)  # pies mas bajo = baseline comun
    for i, bb in enumerate(boxes):
        if bb is None:
            continue
        row, col = divmod(i, cols)
        minx, miny, maxx, maxy = bb
        cw, ch = maxx - minx + 1, maxy - miny + 1
        dx = col * fw + (fw - cw) // 2
        # queremos que el borde inferior quede en row*fh + baseline
        dy = row * fh + baseline - ch + 1
        for y in range(miny, maxy + 1):
            for x in range(minx, maxx + 1):
                r, g, b = px_src[col * fw + x, row * fh + y]
                if is_magenta(r, g, b):
                    continue
                tx, ty = dx + (x - minx), dy + (y - miny)
                if 0 <= tx < W and 0 <= ty < H:
                    px_dst[tx, ty] = (r, g, b)
    return out


def main():
    do_fix = "--fix" in sys.argv
    body = sorted(glob.glob(os.path.join(ROOT, BODY_GLOB), recursive=True))
    print(f"== BODY: {len(body)} hojas ==")
    worst = []
    for f in body:
        rep = audit_sheet(f)
        tag = f"{rep['size'][0]}x{rep['size'][1]} {rep['mode']} frame={rep['frame'][0]}x{rep['frame'][1]}"
        if "feet_spread" in rep:
            print(
                f"  pies±{rep['feet_spread']}px cx±{rep['cx_spread']}px vacias={rep['empty_frames']} | {tag} | {rep['file']}"
            )
            worst.append((rep["feet_spread"], rep["file"]))
        else:
            print(f"  SIN CONTENIDO | {tag} | {rep['file']}")
        if do_fix:
            norm = normalize_sheet(f)
            if norm is None:
                print("    -> sin contenido, omitida")
                continue
            rel = os.path.relpath(f, os.path.join(ROOT, "public"))
            dst = os.path.join(OUT_ROOT, rel)
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            # PNG para no degradar mas con JPEG; el renderer acepta PNG con magenta
            dst = os.path.splitext(dst)[0] + ".normalized.png"
            norm.save(dst)
            print(f"    -> {os.path.relpath(dst, ROOT)}")
    worst.sort(reverse=True)
    if worst:
        print("\n== Top varianza de pies (candidatas a normalizar primero) ==")
        for spread, f in worst[:5]:
            print(f"  {spread}px  {f}")
    print(f"\n== HEAD: {len(HEAD_FILES)} hojas (RGBA, grilla variable, solo auditoria) ==")
    for f in HEAD_FILES:
        im = Image.open(f)
        print(f"  {im.size[0]}x{im.size[1]} {im.mode} | {os.path.relpath(f, ROOT)}")
    if do_fix:
        print(f"\nCopias normalizadas en: {os.path.relpath(OUT_ROOT, ROOT)}/ (originales intactos)")


if __name__ == "__main__":
    main()

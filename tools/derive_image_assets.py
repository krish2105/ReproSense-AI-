#!/usr/bin/env python3
"""Derive individual icons and full-bleed brand icons from the supplied Mauve Pro images.

Source images in apps/web/public/images/ are never modified. Outputs:
  apps/web/public/images/icons/logged-data/{flow,pain,symptoms,sleep,energy,mood}.png   (240x240, cut from E9, no resampling)
  apps/web/public/images/icons/moods/{calm,tired,in-pain,low,energetic}.png             (256x256, cut from E10, no resampling)
  apps/web/public/images/icons/sprites.json                                             (source regions, for sprite use)
  apps/web/public/images/brand/derived/*.png                                            (square icons from A2 on plum)

Cut boundaries come from the transparent gaps between icons (measured 5 Nov 2026, alpha >= 24).
Run: python3 tools/derive_image_assets.py   (needs Pillow)
"""
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IMG = ROOT / "apps" / "web" / "public" / "images"
PLUM = (75, 54, 83, 255)  # #4B3653

STRIPS = {
    # name: (source, tile size, [(slug, x0, x1)] icon extents in source pixels)
    "logged-data": ("icons/logged-data.png", 240, [
        ("flow", 49, 206), ("pain", 302, 464), ("symptoms", 547, 735),
        ("sleep", 801, 990), ("energy", 1060, 1242), ("mood", 1311, 1503)]),
    "moods": ("icons/moods.png", 256, [
        ("calm", 44, 264), ("tired", 351, 570), ("in-pain", 657, 879),
        ("low", 966, 1183), ("energetic", 1271, 1493)]),
}


def cut_strips() -> dict:
    regions: dict = {}
    for name, (src, tile, icons) in STRIPS.items():
        im = Image.open(IMG / src).convert("RGBA")
        w, h = im.size
        out_dir = IMG / "icons" / name
        out_dir.mkdir(parents=True, exist_ok=True)
        regions[name] = {"source": f"/images/{src}", "source_size": [w, h], "tile": tile, "icons": {}}
        for i, (slug, x0, x1) in enumerate(icons):
            # clip to the midpoint between neighbours so no neighbour glow leaks in
            left_lim = 0 if i == 0 else (icons[i - 1][2] + x0) // 2
            right_lim = w if i == len(icons) - 1 else (x1 + icons[i + 1][1]) // 2
            cx, cy = (x0 + x1) // 2, h // 2
            box = (cx - tile // 2, cy - tile // 2, cx + tile // 2, cy + tile // 2)
            assert box[0] >= left_lim and box[2] <= right_lim and box[0] >= 0 and box[2] <= w, (name, slug, box)
            im.crop(box).save(out_dir / f"{slug}.png", optimize=True)
            regions[name]["icons"][slug] = {"x": box[0], "y": box[1], "w": tile, "h": tile}
    (IMG / "icons" / "sprites.json").write_text(json.dumps(regions, indent=2) + "\n")
    return regions


def mark_on(canvas: int, mark_frac_of_diag: float, bg) -> Image.Image:
    """Logo mark (A2) centred on a square canvas; the mark's bounding-box diagonal = frac x canvas."""
    mark = Image.open(IMG / "brand" / "logo-mark.png").convert("RGBA")
    mark = mark.crop(mark.getchannel("A").point(lambda a: 255 if a >= 8 else 0).getbbox())
    diag = (mark.width ** 2 + mark.height ** 2) ** 0.5
    s = canvas * mark_frac_of_diag / diag
    mark = mark.resize((round(mark.width * s), round(mark.height * s)), Image.LANCZOS)
    base = Image.new("RGBA", (canvas, canvas), bg)
    base.alpha_composite(mark, ((canvas - mark.width) // 2, (canvas - mark.height) // 2))
    return base


def brand_icons() -> list[str]:
    out = IMG / "brand" / "derived"
    out.mkdir(parents=True, exist_ok=True)
    made = []
    specs = [
        # file, size, mark diagonal as share of canvas, background, keep alpha?
        ("icon-square-1024.png", 1024, 0.92, PLUM, False),            # full-bleed square, no transparency (iOS-style master)
        ("adaptive-foreground-1024.png", 1024, 0.62, (0, 0, 0, 0), True),  # Android adaptive: mark inside the 66% safe circle
        ("adaptive-background-1024.png", 1024, 0.0, PLUM, False),
        ("apple-touch-icon.png", 180, 0.92, PLUM, False),
        ("icon-192.png", 192, 0.92, PLUM, False),
        ("icon-512.png", 512, 0.92, PLUM, False),
        ("icon-maskable-512.png", 512, 0.76, PLUM, False),               # PWA maskable: inside the 80% safe circle
        ("favicon-32.png", 32, 1.0, PLUM, False),
    ]
    for name, size, frac, bg, keep_alpha in specs:
        im = mark_on(size, frac, bg) if frac else Image.new("RGBA", (size, size), bg)
        (im if keep_alpha else im.convert("RGB")).save(out / name, optimize=True)
        made.append(name)
    return made


if __name__ == "__main__":
    r = cut_strips()
    b = brand_icons()
    print("icons:", {k: list(v["icons"]) for k, v in r.items()})
    print("brand:", b)

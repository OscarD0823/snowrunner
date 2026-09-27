from pathlib import Path
from math import cos, pi, sin

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "src" / "images"
SIZE = 1024


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((20, 20, size - 20, size - 20), radius=radius, fill=255)
    return mask


def cubic(p0, p1, p2, p3, steps=80):
    points = []
    for index in range(steps + 1):
        t = index / steps
        u = 1 - t
        points.append((
            u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0],
            u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1],
        ))
    return points


canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
mask = rounded_mask(SIZE, 220)
gradient = Image.new("RGBA", (SIZE, SIZE))
pixels = gradient.load()
for y in range(SIZE):
    t = y / (SIZE - 1)
    for x in range(SIZE):
        side = x / (SIZE - 1)
        pixels[x, y] = (
            int(22 - 12 * t),
            int(38 - 20 * t + 5 * side),
            int(80 - 44 * t),
            255,
        )
canvas.paste(gradient, (0, 0), mask)
draw = ImageDraw.Draw(canvas)
draw.rounded_rectangle((28, 28, 996, 996), radius=210, outline="#f97316", width=34)

# Neumático exterior con tacos grandes, legible incluso en 32 px.
center = 512
for index in range(28):
    start = index * (360 / 28) + 1.5
    end = start + 7.5
    draw.arc((170, 170, 854, 854), start=start, end=end, fill="#f97316", width=58)
draw.ellipse((222, 222, 802, 802), fill="#0f172a", outline="#fdba74", width=7)

# Montañas y nieve.
draw.polygon([(270, 576), (424, 330), (512, 448), (610, 300), (806, 576)], fill="#dbeafe")
draw.polygon(
    [(366, 420), (424, 330), (512, 448), (610, 300), (686, 414),
     (620, 376), (515, 496), (428, 414), (378, 462), (320, 470)],
    fill="#ffffff",
)

# Camino sinuoso central.
road = cubic((462, 842), (438, 704), (620, 650), (528, 532), 55)
road += cubic((528, 532), (468, 456), (458, 418), (570, 368), 35)[1:]
road = [(round(x), round(y)) for x, y in road]
draw.line(road, fill="#07101d", width=82, joint="curve")
draw.line(road, fill="#fb923c", width=42, joint="curve")
for index in range(8, len(road) - 8, 13):
    x, y = road[index]
    draw.ellipse((x - 6, y - 6, x + 6, y + 6), fill="#ffffff")

png_path = IMAGES / "app-icon.png"
ico_path = IMAGES / "favicon.ico"
canvas.resize((512, 512), Image.Resampling.LANCZOS).save(png_path, optimize=True)
canvas.save(ico_path, sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

print(png_path)
print(ico_path)

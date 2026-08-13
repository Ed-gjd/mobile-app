"""生成 PWA 图标：暗色圆角底 + 白色工具箱图形（坐标全用 int，规避 PIL 浮点边界 bug）"""
from PIL import Image, ImageDraw

def P(d, v):
    return int(round(v / 100.0 * d))

def rrect(draw, box, radius, fill):
    draw.rounded_rectangle(box, radius=radius, fill=fill)

def make_icon(size, path):
    S = size
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    bg = (64, 78, 143, 255)
    white = (255, 255, 255, 255)
    rrect(d, (0, 0, S - 1, S - 1), P(S, 22), bg)

    # 顶部把手
    handle_h = P(S, 7)
    rrect(d, (P(S, 32), P(S, 26), P(S, 68), P(S, 26) + handle_h), max(1, handle_h // 2), white)
    w = P(S, 4.5)
    rrect(d, (P(S, 30), P(S, 28), P(S, 30) + w, P(S, 26) + handle_h + P(S, 4)), max(1, w // 2), white)
    rrect(d, (P(S, 70) - w, P(S, 28), P(S, 70), P(S, 26) + handle_h + P(S, 4)), max(1, w // 2), white)

    # 箱体
    rrect(d, (P(S, 16), P(S, 38), P(S, 84), P(S, 82)), P(S, 5), white)

    # 中部锁扣：两条竖线 + 横杠
    bar_w = max(1, P(S, 3))
    bar_x = P(S, 50) - bar_w // 2
    rrect(d, (bar_x, P(S, 38), bar_x + bar_w, P(S, 82)), max(1, bar_w // 2), bg)
    gap_y = P(S, 50)
    rrect(d, (P(S, 30), gap_y, P(S, 70), gap_y + P(S, 3.5)), max(1, P(S, 1.7)), bg)

    img.save(path, "PNG")
    print("生成", path, img.size)

make_icon(512, "icons/icon-512.png")
make_icon(192, "icons/icon-192.png")

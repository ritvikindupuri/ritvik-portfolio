#!/usr/bin/env python3
"""Render the portfolio system architecture diagram (SVG + PNG)."""

from __future__ import annotations

import base64
import math
from pathlib import Path

import cairosvg
from PIL import ImageFont

ROOT = Path(__file__).resolve().parent
ICON_DIR = ROOT / "icons"
FONT_PATH = "/usr/share/fonts/truetype/sand-box/google/Inter/Inter-VariableFont_opsz,wght.ttf"

W, H = 1680, 1080
INK = "#0F172A"
MUTED = "#475569"
GRAY = "#64748B"
LINE = "#94A3B8"
BAND = "#F1F5F9"
BAND_STROKE = "#E2E8F0"
CARD = "#FFFFFF"
CARD_STROKE = "#CBD5E1"
ACCENT = "#334155"

CARD_W, CARD_H = 200, 146
ICON = 58


def font(size: int, weight: int = 400) -> ImageFont.FreeTypeFont:
    f = ImageFont.truetype(FONT_PATH, size=size)
    try:
        f.set_variation_by_axes({"wght": weight, "opsz": min(max(size, 14), 144)})
    except Exception:
        try:
            f.set_variation_by_name("Regular" if weight < 600 else "Bold")
        except Exception:
            pass
    return f


def text_w(s: str, size: int, weight: int = 400) -> float:
    return float(font(size, weight).getlength(s))


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def svg_uri(path: Path) -> str:
    raw = path.read_bytes()
    png = cairosvg.svg2png(bytestring=raw, output_width=128, output_height=128)
    return "data:image/png;base64," + base64.b64encode(png).decode()


def generic_uri(svg: str) -> str:
    png = cairosvg.svg2png(bytestring=svg.encode(), output_width=128, output_height=128)
    return "data:image/png;base64," + base64.b64encode(png).decode()


VISITOR_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="20" r="11" fill="none" stroke="#334155" stroke-width="3.2"/>
  <path d="M14 52c0-10.5 8-16 18-16s18 5.5 18 16" fill="none" stroke="#334155" stroke-width="3.2" stroke-linecap="round"/>
</svg>'''

BOLT_SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="6" y="6" width="52" height="52" rx="12" fill="none" stroke="#334155" stroke-width="3"/>
  <path d="M36 12L22 34h12l-6 18 18-24H34l2-16z" fill="#334155"/>
</svg>'''


def defs() -> str:
    colors = {
        "gray": LINE,
        "ink": "#64748B",
        "slate": "#475569",
    }
    parts = [
        '<defs>',
        '<filter id="shadow" x="-12%" y="-12%" width="124%" height="136%">'
        '<feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F172A" flood-opacity="0.10"/>'
        "</filter>",
    ]
    for name, color in colors.items():
        parts.append(
            f'<marker id="arr-{name}" viewBox="0 0 10 10" refX="9" refY="5" '
            f'marker-width="7.5" marker-height="7.5" orient="auto">'
            f'<path d="M0 0L10 5L0 10z" fill="{color}"/></marker>'
        )
    parts.append("</defs>")
    return "".join(parts)


def band(x, y, w, h, title) -> str:
    return (
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="20" fill="{BAND}" '
        f'stroke="{BAND_STROKE}" stroke-width="1.5"/>'
        f'<text x="{x + w / 2}" y="{y + 38}" text-anchor="middle" font-family="Inter" '
        f'font-size="15" font-weight="700" letter-spacing="2.2" fill="{MUTED}">{esc(title)}</text>'
    )


def card(cx, cy, icon_href, title, sub) -> str:
    x, y = cx - CARD_W / 2, cy - CARD_H / 2
    return (
        f'<rect x="{x}" y="{y}" width="{CARD_W}" height="{CARD_H}" rx="14" fill="{CARD}" '
        f'stroke="{CARD_STROKE}" stroke-width="2" filter="url(#shadow)"/>'
        f'<image x="{cx - ICON / 2}" y="{y + 16}" width="{ICON}" height="{ICON}" href="{icon_href}"/>'
        f'<text x="{cx}" y="{y + 98}" text-anchor="middle" font-family="Inter" font-size="17" '
        f'font-weight="700" fill="{INK}">{esc(title)}</text>'
        f'<text x="{cx}" y="{y + 122}" text-anchor="middle" font-family="Inter" font-size="13" '
        f'fill="{GRAY}">{esc(sub)}</text>'
    )


def path_d(pts, r=14) -> str:
    d = f"M{pts[0][0]:.1f} {pts[0][1]:.1f}"
    for i in range(1, len(pts) - 1):
        (x0, y0), (x1, y1), (x2, y2) = pts[i - 1], pts[i], pts[i + 1]

        def toward(ax, ay, bx, by, dist):
            L = math.hypot(bx - ax, by - ay)
            k = min(dist, L / 2) / L if L else 0
            return ax + (bx - ax) * k, ay + (by - ay) * k

        ax, ay = toward(x1, y1, x0, y0, r)
        bx, by = toward(x1, y1, x2, y2, r)
        d += f" L{ax:.1f} {ay:.1f} Q{x1:.1f} {y1:.1f} {bx:.1f} {by:.1f}"
    d += f" L{pts[-1][0]:.1f} {pts[-1][1]:.1f}"
    return d


def arrow(pts, color=LINE, marker="gray", width=2.2) -> str:
    return (
        f'<path d="{path_d(pts)}" fill="none" stroke="{color}" stroke-width="{width}" '
        f'stroke-linecap="butt" stroke-linejoin="round" marker-end="url(#arr-{marker})"/>'
    )


def pill(x, y, label, color="#475569") -> str:
    tw = text_w(label, 11, 600)
    pw, ph = tw + 18, 22
    return (
        f'<rect x="{x - pw / 2}" y="{y - ph / 2}" width="{pw}" height="{ph}" rx="{ph / 2}" '
        f'fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>'
        f'<text x="{x}" y="{y + 4}" text-anchor="middle" font-family="Inter" font-size="11" '
        f'font-weight="600" fill="{color}">{esc(label)}</text>'
    )


def build() -> str:
    icons = {
        "cloudflarepages": svg_uri(ICON_DIR / "cloudflarepages.svg"),
        "supabase": svg_uri(ICON_DIR / "supabase.svg"),
        "github": svg_uri(ICON_DIR / "github.svg"),
        "openai": svg_uri(ICON_DIR / "openai.svg"),
        "gemini": svg_uri(ICON_DIR / "googlegemini.svg"),
        "resend": svg_uri(ICON_DIR / "resend.svg"),
        "visitor": generic_uri(VISITOR_SVG),
        "bolt": generic_uri(BOLT_SVG),
    }

    # Bands
    by, bh = 112, 890
    gap = 28
    mx = 36
    inner = W - 2 * mx
    w1, w2, w3, w4 = 250, 330, 440, 504
    assert abs((w1 + w2 + w3 + w4 + 3 * gap) - inner) < 1, (w1 + w2 + w3 + w4 + 3 * gap, inner)
    x1 = mx
    x2 = x1 + w1 + gap
    x3 = x2 + w2 + gap
    x4 = x3 + w3 + gap

    # Four evenly spaced service cards, vertically centered in the band
    spacing = CARD_H + 36  # 182
    stack_h = CARD_H * 4 + 36 * 3
    stack_top = by + 64 + (bh - 64 - stack_h) / 2
    ys = [stack_top + CARD_H / 2 + i * spacing for i in range(4)]
    gh = (x4 + w4 / 2, ys[0])
    oai = (x4 + w4 / 2, ys[1])
    gem = (x4 + w4 / 2, ys[2])
    res = (x4 + w4 / 2, ys[3])

    db = (x3 + w3 / 2, gh[1])
    # Edge Functions centered on the OpenAI-Gemini-Resend group
    edge = (x3 + w3 / 2, (oai[1] + res[1]) / 2)
    mid = (db[1] + edge[1]) / 2
    vis = (x1 + w1 / 2, mid)
    pages = (x2 + w2 / 2, mid)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>',
        defs(),
        f'<text x="{W/2}" y="52" text-anchor="middle" font-family="Inter" font-size="26" '
        f'font-weight="700" fill="{INK}">Figure 1. Portfolio system architecture</text>',
        band(x1, by, w1, bh, "VISITOR"),
        band(x2, by, w2, bh, "HOSTING"),
        band(x3, by, w3, bh, "BACKEND"),
        band(x4, by, w4, bh, "SERVICES"),
    ]

    # Geometry helpers
    def right(c):
        return (c[0] + CARD_W / 2, c[1])

    def left(c):
        return (c[0] - CARD_W / 2, c[1])

    def top(c):
        return (c[0], c[1] - CARD_H / 2)

    def bottom(c):
        return (c[0], c[1] + CARD_H / 2)

    gap23 = (x2 + w2 + x3) / 2
    gap34 = (x3 + w3 + x4) / 2

    # Visitor -> Pages
    parts.append(arrow([right(vis), left(pages)]))
    parts.append(pill((right(vis)[0] + left(pages)[0]) / 2, vis[1] - 18, "open site"))

    # Pages -> Database (up-right) and Pages -> Edge Functions (down-right)
    mid_x = gap23
    p_out_top = (right(pages)[0], pages[1] - 26)
    p_out_bot = (right(pages)[0], pages[1] + 26)
    db_in = left(db)
    edge_in = left(edge)
    parts.append(arrow([p_out_top, (mid_x, p_out_top[1]), (mid_x, db_in[1]), db_in]))
    parts.append(pill(mid_x, (p_out_top[1] + db_in[1]) / 2, "load content"))
    parts.append(arrow([p_out_bot, (mid_x, p_out_bot[1]), (mid_x, edge_in[1]), edge_in]))
    parts.append(pill(mid_x, (p_out_bot[1] + edge_in[1]) / 2, "chat and contact"))

    # Edge Functions -> Database (retrieve)
    parts.append(arrow([top(edge), bottom(db)]))
    parts.append(pill(edge[0] + 56, (bottom(db)[1] + top(edge)[1]) / 2, "retrieve"))

    # GitHub -> Database (README text is indexed into the database)
    parts.append(arrow([left(gh), right(db)]))
    parts.append(pill((right(db)[0] + left(gh)[0]) / 2, db[1] - 18, "index READMEs"))

    # Shared spine from Edge Functions into the services column, then branch
    # to OpenAI, Gemini, and Resend without overlapping shafts.
    spine_x = gap34
    e_out = right(edge)
    parts.append(arrow([e_out, (spine_x, e_out[1]), (spine_x, oai[1]), left(oai)]))
    parts.append(arrow([(spine_x, e_out[1]), (spine_x, gem[1]), left(gem)]))
    parts.append(arrow([(spine_x, e_out[1]), (spine_x, res[1]), left(res)]))
    # Pills sit on unique segments, clear of the junction
    parts.append(pill(spine_x, (e_out[1] + oai[1]) / 2, "embed"))
    parts.append(pill((spine_x + left(gem)[0]) / 2, gem[1] - 18, "answer"))
    parts.append(pill(spine_x, (e_out[1] + res[1]) / 2, "send email"))

    # Cards on top of arrows? No - arrows should be under cards, so cards come after arrows.
    # I already inserted arrows first after bands. Now cards.
    parts.extend(
        [
            card(*vis, icons["visitor"], "Visitor", "web browser"),
            card(*pages, icons["cloudflarepages"], "Cloudflare Pages", "site and docs"),
            card(*db, icons["supabase"], "Database", "content and files"),
            card(*edge, icons["bolt"], "Edge Functions", "chat and contact"),
            card(*gh, icons["github"], "GitHub", "project repos"),
            card(*oai, icons["openai"], "OpenAI", "embeddings"),
            card(*gem, icons["gemini"], "Gemini", "answers"),
            card(*res, icons["resend"], "Resend", "email"),
        ]
    )

    # Footer attribution, centered
    foot = "Icons: Cloudflare Pages, Supabase, GitHub, OpenAI, Gemini, and Resend from Simple Icons (CC0)."
    parts.append(
        f'<text x="{W/2}" y="{H - 28}" text-anchor="middle" font-family="Inter" font-size="12" '
        f'fill="#94A3B8">{esc(foot)}</text>'
    )
    parts.append("</svg>")
    return "\n".join(parts)


def main() -> None:
    svg = build()
    svg_path = ROOT / "architecture.svg"
    png_path = ROOT / "architecture.png"
    svg_path.write_text(svg)
    cairosvg.svg2png(bytestring=svg.encode(), write_to=str(png_path), output_width=W * 2, output_height=H * 2)
    print("wrote", svg_path, png_path, "png", png_path.stat().st_size)


if __name__ == "__main__":
    main()

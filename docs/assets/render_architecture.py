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

W, H = 2280, 1180
INK = "#0F172A"
MUTED = "#475569"
GRAY = "#64748B"
LINE = "#94A3B8"
BAND = "#F1F5F9"
BAND_STROKE = "#E2E8F0"
CARD = "#FFFFFF"
CARD_STROKE = "#CBD5E1"

CARD_W, CARD_H = 260, 174
ICON = 58
PILL_SIZE = 12


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


def wrap_text(s: str, size: int, weight: int, max_w: float) -> list[str]:
    if "\n" in s:
        lines: list[str] = []
        for part in s.split("\n"):
            part = part.strip()
            lines.extend(wrap_text(part, size, weight, max_w) if part else [""])
        return lines
    words = s.split()
    lines: list[str] = []
    cur = ""
    for word in words:
        trial = (cur + " " + word).strip()
        if text_w(trial, size, weight) <= max_w or not cur:
            cur = trial
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines or [s]


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
        "<defs>",
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
    lines = wrap_text(sub, 13, 400, CARD_W - 28)
    out = [
        f'<rect x="{x}" y="{y}" width="{CARD_W}" height="{CARD_H}" rx="14" fill="{CARD}" '
        f'stroke="{CARD_STROKE}" stroke-width="2" filter="url(#shadow)"/>',
        f'<image x="{cx - ICON / 2}" y="{y + 16}" width="{ICON}" height="{ICON}" href="{icon_href}"/>',
        f'<text x="{cx}" y="{y + 98}" text-anchor="middle" font-family="Inter" font-size="17" '
        f'font-weight="700" fill="{INK}">{esc(title)}</text>',
    ]
    if len(lines) == 1:
        sub_ys = [y + 126]
    else:
        sub_ys = [y + 118 + i * 18 for i in range(len(lines))]
    for line, sy in zip(lines, sub_ys):
        out.append(
            f'<text x="{cx}" y="{sy}" text-anchor="middle" font-family="Inter" font-size="13" '
            f'fill="{GRAY}">{esc(line)}</text>'
        )
    return "".join(out)


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


def pill(x, y, label, max_w: float = 240, color="#475569") -> str:
    lines = wrap_text(label, PILL_SIZE, 600, max_w)
    widths = [text_w(line, PILL_SIZE, 600) for line in lines]
    pw = max(widths) + 20
    line_h = 15
    ph = 12 + line_h * len(lines)
    top = y - ph / 2
    out = [
        f'<rect x="{x - pw / 2}" y="{top}" width="{pw}" height="{ph}" rx="{min(ph / 2, 13)}" '
        f'fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1.2"/>'
    ]
    start = top + 6 + 11
    for i, line in enumerate(lines):
        out.append(
            f'<text x="{x}" y="{start + i * line_h}" text-anchor="middle" font-family="Inter" '
            f'font-size="{PILL_SIZE}" font-weight="600" fill="{color}">{esc(line)}</text>'
        )
    return "".join(out)


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

    by, bh = 118, 980
    mx = 48
    inner = W - 2 * mx
    g12, g23, g34 = 124, 96, 96
    w1, w2, w3, w4 = 340, 410, 560, 558
    assert abs((w1 + w2 + w3 + w4 + g12 + g23 + g34) - inner) < 1, (
        w1 + w2 + w3 + w4 + g12 + g23 + g34, inner
    )
    x1 = mx
    x2 = x1 + w1 + g12
    x3 = x2 + w2 + g23
    x4 = x3 + w3 + g34

    spacing = CARD_H + 44
    stack_h = CARD_H * 4 + 44 * 3
    stack_top = by + 64 + (bh - 64 - stack_h) / 2
    ys = [stack_top + CARD_H / 2 + i * spacing for i in range(4)]
    gh = (x4 + w4 / 2, ys[0])
    oai = (x4 + w4 / 2, ys[1])
    gem = (x4 + w4 / 2, ys[2])
    res = (x4 + w4 / 2, ys[3])

    db = (x3 + w3 / 2, gh[1])
    edge = (x3 + w3 / 2, (oai[1] + res[1]) / 2)
    mid = (db[1] + edge[1]) / 2
    vis = (x1 + w1 / 2, mid)
    pages = (x2 + w2 / 2, mid)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
        f'<rect width="{W}" height="{H}" fill="#FFFFFF"/>',
        defs(),
        f'<text x="{W/2}" y="56" text-anchor="middle" font-family="Inter" font-size="26" '
        f'font-weight="700" fill="{INK}">Figure 1. Portfolio system architecture</text>',
        band(x1, by, w1, bh, "VISITOR"),
        band(x2, by, w2, bh, "HOSTING"),
        band(x3, by, w3, bh, "BACKEND"),
        band(x4, by, w4, bh, "SERVICES"),
    ]

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
    parts.append(pill((right(vis)[0] + left(pages)[0]) / 2, vis[1] - 22, "opens the live portfolio", max_w=220))

    # Pages -> Database and Pages -> Edge Functions
    mid_x = gap23
    p_out_top = (right(pages)[0], pages[1] - 28)
    p_out_bot = (right(pages)[0], pages[1] + 28)
    db_in = left(db)
    edge_in = left(edge)
    parts.append(arrow([p_out_top, (mid_x, p_out_top[1]), (mid_x, db_in[1]), db_in]))
    parts.append(pill(mid_x, (p_out_top[1] + db_in[1]) / 2, "loads projects,\nexperience, and docs", max_w=200))
    parts.append(arrow([p_out_bot, (mid_x, p_out_bot[1]), (mid_x, edge_in[1]), edge_in]))
    parts.append(pill(mid_x, (p_out_bot[1] + edge_in[1]) / 2, "sends chat and\ncontact requests", max_w=200))

    # Edge Functions -> Database
    parts.append(arrow([top(edge), bottom(db)]))
    parts.append(pill(edge[0] + 78, (bottom(db)[1] + top(edge)[1]) / 2, "semantic search over\nportfolio content", max_w=200))

    # GitHub -> Database
    parts.append(arrow([left(gh), right(db)]))
    parts.append(pill((right(db)[0] + left(gh)[0]) / 2, db[1] - 22, "indexes project README files", max_w=240))

    # Spine from Edge Functions to OpenAI, Gemini, and Resend
    spine_x = gap34
    e_out = right(edge)
    parts.append(arrow([e_out, (spine_x, e_out[1]), (spine_x, oai[1]), left(oai)]))
    parts.append(arrow([(spine_x, e_out[1]), (spine_x, gem[1]), left(gem)]))
    parts.append(arrow([(spine_x, e_out[1]), (spine_x, res[1]), left(res)]))
    parts.append(pill(spine_x, (e_out[1] + oai[1]) / 2, "embeds the chat question", max_w=180))
    parts.append(pill((spine_x + left(gem)[0]) / 2, gem[1] - 22, "drafts the chatbot reply", max_w=200))
    parts.append(pill(spine_x, (e_out[1] + res[1]) / 2, "delivers the contact message", max_w=180))

    parts.extend(
        [
            card(*vis, icons["visitor"], "Visitor", "views the public site"),
            card(*pages, icons["cloudflarepages"], "Cloudflare Pages", "serves the site\nand PDF docs"),
            card(*db, icons["supabase"], "Database", "projects, experience,\ndocs, and resumes"),
            card(*edge, icons["bolt"], "Edge Functions", "chatbot and contact form"),
            card(*gh, icons["github"], "GitHub", "project repos and\nREADME files"),
            card(*oai, icons["openai"], "OpenAI", "embeds chat questions"),
            card(*gem, icons["gemini"], "Gemini", "writes chatbot replies"),
            card(*res, icons["resend"], "Resend", "delivers contact messages"),
        ]
    )

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

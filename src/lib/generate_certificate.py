"""
TypeBlaze Certificate Generator
Generates beautiful achievement certificates as PDF files.
Usage: python generate_certificate.py
"""

import os
import math
from datetime import datetime
from reportlab.lib.pagesizes import landscape, A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import (
    HexColor, white, black
)
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER

# ── Brand Colors ──────────────────────────────────────────────────────────────
BG_DARK       = HexColor("#080810")
BG_CARD       = HexColor("#0D0D1C")
ACCENT        = HexColor("#FF6B1A")
ACCENT_LIGHT  = HexColor("#FF8A00")
SPARK         = HexColor("#10D9A0")
GOLD          = HexColor("#FBBF24")
PURPLE        = HexColor("#818CF8")
TEXT_PRIMARY  = HexColor("#F0F0FA")
TEXT_SUB      = HexColor("#9999BB")
TEXT_MUTED    = HexColor("#525270")
BORDER        = HexColor("#1E1E38")
ERROR         = HexColor("#F43F5E")

PAGE_W, PAGE_H = landscape(A4)   # 841.89 x 595.28 pt

CERT_LEVELS = {
    (0,  20):  ("Newcomer",   HexColor("#B4B2A9")),
    (20, 40):  ("Beginner",   HexColor("#5DCAA5")),
    (40, 60):  ("Intermediate", HexColor("#60A5FA")),
    (60, 80):  ("Advanced",   PURPLE),
    (80, 100): ("Expert",     ACCENT),
    (100, 999):("Master",     GOLD),
}

def get_level(wpm: int):
    for (lo, hi), (label, color) in CERT_LEVELS.items():
        if lo <= wpm < hi:
            return label, color
    return "Master", GOLD


def draw_background(c, w, h):
    """Full dark background with subtle grid."""
    c.setFillColor(BG_DARK)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    # subtle dot grid
    c.setFillColor(HexColor("#FFFFFF"))
    c.setFillAlpha(0.025)
    step = 28
    for x in range(0, int(w) + step, step):
        for y in range(0, int(h) + step, step):
            c.circle(x, y, 0.8, fill=1, stroke=0)
    c.setFillAlpha(1)


def draw_border_frame(c, w, h):
    """Decorative double-border frame."""
    pad_outer = 18
    pad_inner = 26

    # outer glow border
    c.setStrokeColor(ACCENT)
    c.setLineWidth(1.2)
    c.setStrokeAlpha(0.35)
    c.roundRect(pad_outer, pad_outer,
                w - 2*pad_outer, h - 2*pad_outer,
                radius=14, fill=0, stroke=1)

    # inner border
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.5)
    c.setStrokeAlpha(0.18)
    c.roundRect(pad_inner, pad_inner,
                w - 2*pad_inner, h - 2*pad_inner,
                radius=10, fill=0, stroke=1)

    c.setStrokeAlpha(1)


def draw_corner_ornaments(c, w, h):
    """Flame-inspired corner ornaments."""
    corners = [(38, 38), (w-38, 38), (38, h-38), (w-38, h-38)]
    size = 18
    for cx, cy in corners:
        c.setStrokeColor(ACCENT)
        c.setLineWidth(1)
        c.setStrokeAlpha(0.5)
        c.line(cx - size, cy, cx + size, cy)
        c.line(cx, cy - size, cx, cy + size)
        c.setFillColor(ACCENT)
        c.setFillAlpha(0.3)
        c.circle(cx, cy, 3, fill=1, stroke=0)
        c.setFillAlpha(1)
    c.setStrokeAlpha(1)


def draw_flame_icon(c, cx, cy, size=32):
    """Draw a stylised flame shape using bezier curves."""
    s = size / 32.0
    c.saveState()
    c.translate(cx - 16*s, cy - 16*s)
    c.scale(s, s)

    # rounded square background
    c.setFillColor(ACCENT)
    c.roundRect(0, 0, 32, 32, radius=8, fill=1, stroke=0)

    # flame body (white)
    c.setFillColor(white)
    p = c.beginPath()
    p.moveTo(16, 4)
    p.curveTo(16, 4, 22, 9, 22, 15)
    p.curveTo(22, 18, 20, 20, 20, 20)
    p.curveTo(20, 20, 21, 18, 19, 16)
    p.curveTo(19, 16, 20, 21, 16, 24)
    p.curveTo(16, 24, 17, 21, 15, 19)
    p.curveTo(15, 19, 16, 23, 13, 25)
    p.curveTo(13, 25, 10, 22, 10, 17)
    p.curveTo(10, 14, 12, 12, 12, 12)
    p.curveTo(12, 12, 11.5, 15, 14, 16)
    p.curveTo(14, 16, 11, 12, 16, 4)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

    c.restoreState()


def draw_badge(c, cx, cy, wpm, level_label, level_color):
    """Circular WPM badge."""
    radius = 52

    # outer ring
    c.setStrokeColor(level_color)
    c.setLineWidth(2)
    c.setStrokeAlpha(0.6)
    c.circle(cx, cy, radius + 4, fill=0, stroke=1)

    # inner fill
    c.setFillColor(BG_CARD)
    c.setStrokeColor(level_color)
    c.setLineWidth(1)
    c.setStrokeAlpha(0.3)
    c.circle(cx, cy, radius, fill=1, stroke=1)

    c.setStrokeAlpha(1)
    c.setFillAlpha(1)

    # WPM number
    c.setFont("Helvetica-Bold", 32)
    c.setFillColor(level_color)
    wpm_str = str(wpm)
    tw = c.stringWidth(wpm_str, "Helvetica-Bold", 32)
    c.drawString(cx - tw/2, cy + 8, wpm_str)

    # WPM label
    c.setFont("Helvetica", 10)
    c.setFillColor(TEXT_MUTED)
    lbl = "WPM"
    lw = c.stringWidth(lbl, "Helvetica", 10)
    c.drawString(cx - lw/2, cy - 6, lbl)

    # level label below
    c.setFont("Helvetica-Bold", 9)
    c.setFillColor(level_color)
    ll = level_label.upper()
    lw2 = c.stringWidth(ll, "Helvetica-Bold", 9)
    c.drawString(cx - lw2/2, cy - 20, ll)


def draw_divider(c, x, y, width, color=None):
    if color is None:
        color = ACCENT
    c.setStrokeColor(color)
    c.setLineWidth(0.6)
    c.setStrokeAlpha(0.4)
    c.line(x, y, x + width, y)
    # centre diamond
    mid = x + width / 2
    c.setFillColor(color)
    c.setFillAlpha(0.6)
    c.saveState()
    c.translate(mid, y)
    c.rotate(45)
    c.rect(-3, -3, 6, 6, fill=1, stroke=0)
    c.restoreState()
    c.setFillAlpha(1)
    c.setStrokeAlpha(1)


def generate_certificate(
    recipient_name: str,
    wpm: int,
    accuracy: float,
    test_mode: str = "Words",
    duration: int = 60,
    cert_id: str = None,
    output_path: str = None
) -> str:

    level_label, level_color = get_level(wpm)
    issue_date = datetime.now().strftime("%B %d, %Y")

    if cert_id is None:
        import uuid
        cert_id = "TB-" + str(uuid.uuid4()).upper()[:8]

    if output_path is None:
        safe_name = recipient_name.replace(" ", "_").replace("/", "_")
        output_path = f"/mnt/user-data/outputs/typeblaze_certificate_{safe_name}_{wpm}wpm.pdf"

    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    c = canvas.Canvas(output_path, pagesize=landscape(A4))
    c.setTitle(f"TypeBlaze Certificate — {recipient_name}")
    c.setAuthor("TypeBlaze")
    c.setSubject(f"{level_label} Typist Certificate — {wpm} WPM")

    w, h = PAGE_W, PAGE_H

    # ── Background & frame ────────────────────────────────────────────────────
    draw_background(c, w, h)
    draw_border_frame(c, w, h)
    draw_corner_ornaments(c, w, h)

    # ── Radial glow (top-left) ────────────────────────────────────────────────
    c.saveState()
    c.setFillColor(ACCENT)
    for alpha, r in [(0.018, 280), (0.03, 180), (0.04, 100)]:
        c.setFillAlpha(alpha)
        c.circle(0, h, r, fill=1, stroke=0)
    c.setFillAlpha(1)
    c.restoreState()

    # ── LEFT COLUMN ───────────────────────────────────────────────────────────
    left_cx = 148

    # Flame logo
    draw_flame_icon(c, left_cx, h - 68, size=34)

    # TypeBlaze wordmark
    c.setFont("Helvetica-Bold", 18)
    c.setFillColor(TEXT_PRIMARY)
    brand = "Type"
    bw = c.stringWidth(brand, "Helvetica-Bold", 18)
    c.drawString(left_cx - bw - 2, h - 110, brand)
    c.setFillColor(ACCENT)
    c.drawString(left_cx + 2, h - 110, "Blaze")

    # thin rule
    draw_divider(c, 56, h - 125, 184, TEXT_MUTED)

    # "CERTIFICATE OF ACHIEVEMENT" label
    c.setFont("Helvetica", 7.5)
    c.setFillColor(ACCENT)
    label = "CERTIFICATE  OF  ACHIEVEMENT"
    lw = c.stringWidth(label, "Helvetica", 7.5)
    c.drawString(left_cx - lw/2, h - 142, label)

    # WPM Badge
    draw_badge(c, left_cx, h/2 - 10, wpm, level_label, level_color)

    # Stats block under badge
    stats_y = h/2 - 80
    stats = [
        ("Accuracy", f"{accuracy:.1f}%"),
        ("Mode",     test_mode),
        ("Duration", f"{duration}s"),
    ]
    for i, (k, v) in enumerate(stats):
        row_y = stats_y - i * 22
        c.setFont("Helvetica", 8)
        c.setFillColor(TEXT_MUTED)
        c.drawString(56, row_y, k.upper())
        c.setFont("Helvetica-Bold", 9)
        c.setFillColor(TEXT_PRIMARY)
        vw = c.stringWidth(v, "Helvetica-Bold", 9)
        c.drawString(240 - vw, row_y, v)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.4)
        c.line(56, row_y - 6, 240, row_y - 6)

    # Cert ID + date at bottom-left
    c.setFont("Helvetica", 7)
    c.setFillColor(TEXT_MUTED)
    c.drawString(56, 48, f"ID: {cert_id}")
    c.drawString(56, 38, f"Issued: {issue_date}")

    # ── VERTICAL DIVIDER ──────────────────────────────────────────────────────
    c.setStrokeColor(ACCENT)
    c.setLineWidth(0.5)
    c.setStrokeAlpha(0.15)
    c.line(268, 42, 268, h - 42)
    c.setStrokeAlpha(1)

    # ── RIGHT COLUMN ──────────────────────────────────────────────────────────
    rx = 296   # right-side left margin
    rw = w - rx - 48   # available width
    rcx = rx + rw / 2  # center x of right column

    # "This is to certify that"
    c.setFont("Helvetica", 9)
    c.setFillColor(TEXT_MUTED)
    intro = "This is to certify that"
    iw = c.stringWidth(intro, "Helvetica", 9)
    c.drawString(rcx - iw/2, h - 90, intro)

    # Recipient name
    name_size = max(22, min(40, int(560 / max(len(recipient_name), 1))))
    c.setFont("Helvetica-Bold", name_size)
    c.setFillColor(TEXT_PRIMARY)
    nw = c.stringWidth(recipient_name, "Helvetica-Bold", name_size)
    while nw > rw - 20 and name_size > 16:
        name_size -= 1
        nw = c.stringWidth(recipient_name, "Helvetica-Bold", name_size)
    c.drawString(rcx - nw/2, h - 90 - name_size - 8, recipient_name)

    # decorative underline for name
    c.setStrokeColor(level_color)
    c.setLineWidth(1.5)
    c.setStrokeAlpha(0.7)
    c.line(rcx - nw/2, h - 90 - name_size - 12,
           rcx + nw/2, h - 90 - name_size - 12)
    c.setStrokeAlpha(1)

    # body text
    body_y = h - 90 - name_size - 38
    c.setFont("Helvetica", 10)
    c.setFillColor(TEXT_SUB)
    line1 = f"has demonstrated exceptional typing proficiency, achieving"
    l1w = c.stringWidth(line1, "Helvetica", 10)
    c.drawString(rcx - l1w/2, body_y, line1)

    body_y -= 20
    c.setFont("Helvetica-Bold", 13)
    c.setFillColor(level_color)
    achievement = f"{wpm} Words Per Minute  ·  {accuracy:.1f}% Accuracy"
    aw = c.stringWidth(achievement, "Helvetica-Bold", 13)
    c.drawString(rcx - aw/2, body_y, achievement)

    body_y -= 20
    c.setFont("Helvetica", 10)
    c.setFillColor(TEXT_SUB)
    line3 = f"in the {test_mode} mode ({duration}-second test) on {issue_date}."
    l3w = c.stringWidth(line3, "Helvetica", 10)
    c.drawString(rcx - l3w/2, body_y, line3)

    # level badge pill
    pill_y  = body_y - 30
    pill_h  = 22
    level_text = f"✦  {level_label.upper()} TYPIST  ✦"
    c.setFont("Helvetica-Bold", 9)
    pill_w = c.stringWidth(level_text, "Helvetica-Bold", 9) + 28
    px = rcx - pill_w / 2
    c.setFillColor(level_color)
    c.setFillAlpha(0.12)
    c.roundRect(px, pill_y, pill_w, pill_h, radius=11, fill=1, stroke=0)
    c.setStrokeColor(level_color)
    c.setLineWidth(0.8)
    c.setStrokeAlpha(0.4)
    c.roundRect(px, pill_y, pill_w, pill_h, radius=11, fill=0, stroke=1)
    c.setFillColor(level_color)
    c.setFillAlpha(1)
    c.setStrokeAlpha(1)
    tw2 = c.stringWidth(level_text, "Helvetica-Bold", 9)
    c.drawString(rcx - tw2/2, pill_y + 7, level_text)

    # main divider
    draw_divider(c, rx, pill_y - 24, rw)

    # signature block
    sig_y = pill_y - 58
    # TypeBlaze "signature"
    c.setFont("Helvetica-BoldOblique", 14)
    c.setFillColor(ACCENT)
    sig = "TypeBlaze"
    sw = c.stringWidth(sig, "Helvetica-BoldOblique", 14)
    sig_cx = rcx - rw/4
    c.drawString(sig_cx - sw/2, sig_y, sig)
    c.setStrokeColor(TEXT_MUTED)
    c.setLineWidth(0.4)
    c.line(sig_cx - 50, sig_y - 4, sig_cx + 50, sig_y - 4)
    c.setFont("Helvetica", 7.5)
    c.setFillColor(TEXT_MUTED)
    t1 = "TypeBlaze Platform"
    t1w = c.stringWidth(t1, "Helvetica", 7.5)
    c.drawString(sig_cx - t1w/2, sig_y - 14, t1)

    # verifiable seal placeholder
    seal_cx = rcx + rw/4
    c.setFillColor(SPARK)
    c.setFillAlpha(0.1)
    c.circle(seal_cx, sig_y - 6, 30, fill=1, stroke=0)
    c.setStrokeColor(SPARK)
    c.setLineWidth(1)
    c.setStrokeAlpha(0.4)
    c.circle(seal_cx, sig_y - 6, 30, fill=0, stroke=1)
    c.circle(seal_cx, sig_y - 6, 25, fill=0, stroke=1)
    c.setFillColor(SPARK)
    c.setFillAlpha(1)
    c.setStrokeAlpha(1)
    c.setFont("Helvetica-Bold", 7)
    vt = "VERIFIED"
    vtw = c.stringWidth(vt, "Helvetica-Bold", 7)
    c.drawString(seal_cx - vtw/2, sig_y - 4, vt)
    c.setFont("Helvetica", 6)
    st = "typeblaze.com"
    stw = c.stringWidth(st, "Helvetica", 6)
    c.drawString(seal_cx - stw/2, sig_y - 14, st)

    # bottom tagline
    c.setFont("Helvetica", 7.5)
    c.setFillColor(TEXT_MUTED)
    tagline = "Verify this certificate at typeblaze.com/verify  ·  Certificate ID: " + cert_id
    tw3 = c.stringWidth(tagline, "Helvetica", 7.5)
    c.drawString(rcx - tw3/2, 38, tagline)

    c.save()
    return output_path


# ── Generate sample certificates ──────────────────────────────────────────────
if __name__ == "__main__":
    samples = [
        ("Sarah Johnson",  112, 99.1, "Words",   60,  "TB-A1B2C3D4"),
        ("Alex Martinez",   78, 96.5, "Quotes",  60,  "TB-E5F6G7H8"),
        ("Priya Rajan",     45, 91.2, "Numbers", 30,  "TB-I9J0K1L2"),
        ("TypeBlaze User",  25, 87.0, "Words",   15,  "TB-M3N4O5P6"),
    ]

    paths = []
    for name, wpm, acc, mode, dur, cid in samples:
        path = generate_certificate(
            recipient_name=name,
            wpm=wpm,
            accuracy=acc,
            test_mode=mode,
            duration=dur,
            cert_id=cid,
            output_path=f"/mnt/user-data/outputs/cert_{name.split()[0].lower()}_{wpm}wpm.pdf"
        )
        paths.append(path)
        level, _ = get_level(wpm)
        print(f"Generated: {path}  [{level}]")

    print(f"\nAll {len(paths)} certificates saved to /mnt/user-data/outputs/")

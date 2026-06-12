#!/usr/bin/env python3
"""Gera imagem institucional do workflow operacional MedicFlow-AI (alta resolução)."""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "help"
OUT_PNG = OUT_DIR / "workflow-operacional-executivo.png"

W, H = 2560, 1440
BG = (248, 250, 252)
NAVY = (30, 58, 95)
BLUE = (3, 105, 161)
TEAL = (13, 148, 136)
GREEN = (5, 150, 105)
AMBER = (217, 119, 6)
VIOLET = (124, 58, 237)
WHITE = (255, 255, 255)
GRAY = (100, 116, 139)
LIGHT_BLUE = (224, 242, 254)
LIGHT_TEAL = (204, 251, 241)
LIGHT_GREEN = (209, 250, 229)
LIGHT_AMBER = (254, 243, 199)
LIGHT_VIOLET = (237, 233, 254)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def rounded_rect(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int, int, int],
    fill: tuple[int, int, int],
    outline: tuple[int, int, int],
    radius: int = 16,
    width: int = 2,
) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def draw_box(
    draw: ImageDraw.ImageDraw,
    x: int,
    y: int,
    w: int,
    h: int,
    title: str,
    lines: list[str],
    fill: tuple[int, int, int],
    outline: tuple[int, int, int],
    title_color: tuple[int, int, int] = NAVY,
) -> None:
    rounded_rect(draw, (x, y, x + w, y + h), fill, outline)
    draw.text((x + 20, y + 16), title, fill=title_color, font=font(22, True))
    ty = y + 52
    for line in lines:
        draw.text((x + 20, ty), line, fill=GRAY, font=font(17))
        ty += 26


def arrow_h(draw: ImageDraw.ImageDraw, x1: int, y: int, x2: int, color: tuple[int, int, int]) -> None:
    draw.line((x1, y, x2 - 12, y), fill=color, width=3)
    draw.polygon([(x2 - 12, y - 8), (x2, y), (x2 - 12, y + 8)], fill=color)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    draw.text((80, 48), "MedicFlow-AI", fill=BLUE, font=font(42, True))
    draw.text((80, 100), "Workflow Operacional da Plataforma", fill=NAVY, font=font(30, True))
    draw.text(
        (80, 148),
        "Da captação de plantões ao fechamento financeiro e indicadores executivos",
        fill=GRAY,
        font=font(22),
    )

    # Row 1 — Captação de Plantões (10 etapas resumidas)
    draw.text((80, 210), "Captação de Plantões", fill=TEAL, font=font(24, True))
    cap_y = 250
    cap_steps = [
        ("① Cadastro", "/escalas"),
        ("② Publicação", "Calendário 14d"),
        ("③ Notificação", "/central RT"),
        ("④ Interesse", "/plantões"),
        ("⑤ Seleção", "Escalista"),
        ("⑥ Confirmação", "1 confirmed"),
        ("⑦ Execução", "Plantão"),
        ("⑧ Validação", "Produção"),
        ("⑨ Fechamento", "Competência"),
        ("⑩ Pagamento", "Repasses"),
    ]
    box_w, box_h, gap = 220, 88, 16
    start_x = 80
    for i, (title, sub) in enumerate(cap_steps):
        x = start_x + i * (box_w + gap)
        rounded_rect(draw, (x, cap_y, x + box_w, cap_y + box_h), LIGHT_TEAL, TEAL, radius=12)
        draw.text((x + 14, cap_y + 14), title, fill=NAVY, font=font(18, True))
        draw.text((x + 14, cap_y + 44), sub, fill=GRAY, font=font(15))
        if i < len(cap_steps) - 1:
            arrow_h(draw, x + box_w + 4, cap_y + box_h // 2, x + box_w + gap - 4, BLUE)

    # Row 2 — Hub Administrativo + Módulos
    draw.text((80, 390), "Hub Administrativo Médico · Módulos da Plataforma", fill=AMBER, font=font(24, True))
    modules = [
        ("Instituição", ["/instituicao", "Branding · Parametrização"], LIGHT_AMBER, AMBER),
        ("Operação", ["/escalas · /plantões", "/central RT"], LIGHT_TEAL, TEAL),
        ("Financeiro", ["/financeiro", "Fechamento auditável"], LIGHT_BLUE, BLUE),
        ("TISS", ["/tiss", "Faturamento · Repasses"], LIGHT_BLUE, BLUE),
        ("Executivo", ["/executivo", "KPIs · Narrativa"], LIGHT_GREEN, GREEN),
        ("IA Operacional", ["Copilot · Agentes", "Alertas · Forecast"], LIGHT_VIOLET, VIOLET),
    ]
    mod_y = 430
    mod_w, mod_h = 380, 120
    for i, (title, lines, fill, outline) in enumerate(modules):
        col, row = i % 3, i // 3
        x = 80 + col * (mod_w + 24)
        y = mod_y + row * (mod_h + 20)
        draw_box(draw, x, y, mod_w, mod_h, title, lines, fill, outline)

    # Row 3 — Fluxo de valor
    draw.text((80, 720), "Fluxo Operacional Completo · Valor Gerado", fill=GREEN, font=font(24, True))
    flow_y = 760
    flow = [
        ("Hospital / Cooperativa", "Demanda de cobertura"),
        ("MedicFlow-AI", "Operação unificada multi-tenant"),
        ("Escalista + Médico", "Escala · Confirmação · Swaps"),
        ("Financeiro", "TISS · Fechamento · Repasses"),
        ("Diretoria", "KPIs · IA · Narrativa executiva"),
    ]
    fw, fh = 440, 100
    for i, (title, sub) in enumerate(flow):
        x = 80 + i * (fw + 20)
        rounded_rect(draw, (x, flow_y, x + fw, flow_y + fh), WHITE, GREEN, radius=14)
        draw.text((x + 20, flow_y + 20), title, fill=NAVY, font=font(20, True))
        draw.text((x + 20, flow_y + 54), sub, fill=GRAY, font=font(17))
        if i < len(flow) - 1:
            arrow_h(draw, x + fw + 4, flow_y + fh // 2, x + fw + 20 - 4, GREEN)

    # Footer strip
    rounded_rect(draw, (80, 920, W - 80, 1040), LIGHT_BLUE, BLUE, radius=16)
    draw.text(
        (110, 948),
        "Stack: React 19 · TanStack · Supabase · Cloudflare  |  20 rotas · ~173 APIs · RBAC 5 papéis · IA operacional opcional",
        fill=NAVY,
        font=font(20, True),
    )
    draw.text(
        (110, 988),
        "Posicionamento V1: plataforma operacional hospitalar — escalas, plantões, TISS, fechamento e inteligência executiva",
        fill=GRAY,
        font=font(18),
    )

    img.save(OUT_PNG, "PNG", optimize=True)
    print(f"Generated {OUT_PNG} ({OUT_PNG.stat().st_size} bytes)")


if __name__ == "__main__":
    main()

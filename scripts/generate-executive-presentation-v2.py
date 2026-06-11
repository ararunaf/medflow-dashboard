#!/usr/bin/env python3
"""Gera apresentação executiva / investor MedicFlow-AI V2 (PPTX + PDF)."""

from __future__ import annotations

import importlib.util
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
OUTPUT_PPTX = DOCS / "MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.pptx"
OUTPUT_PDF = DOCS / "MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.pdf"

# Reutiliza helpers e slides da apresentação corporativa
_spec = importlib.util.spec_from_file_location(
    "corp_presentation",
    ROOT / "scripts" / "generate-corporate-presentation.py",
)
corp = importlib.util.module_from_spec(_spec)
sys.modules["corp_presentation"] = corp
_spec.loader.exec_module(corp)

Inches = corp.Inches
PP_ALIGN = corp.PP_ALIGN
BLUE_DARK = corp.BLUE_DARK
BLUE_MID = corp.BLUE_MID
GREEN = corp.GREEN
GREEN_LIGHT = corp.GREEN_LIGHT
WHITE = corp.WHITE
GRAY = corp.GRAY
GRAY_DARK = corp.GRAY_DARK
GRAY_LIGHT = corp.GRAY_LIGHT
SLIDE_W = corp.SLIDE_W
LOGO_PATH = corp.LOGO_PATH

blank_slide = corp.blank_slide
add_rect = corp.add_rect
add_textbox = corp.add_textbox
add_bullets = corp.add_bullets
add_header_bar = corp.add_header_bar
add_footer = corp.add_footer
add_screenshot = corp.add_screenshot
add_metric_cards = corp.add_metric_cards
extract_logo = corp.extract_logo
new_prs = corp.new_prs
export_pdf = corp.export_pdf


def slide_capa_executiva(prs):
    slide = blank_slide(prs)
    add_rect(slide, Inches(0), Inches(0), Inches(5.2), corp.SLIDE_H, BLUE_DARK)
    add_rect(slide, Inches(5.2), Inches(0), Inches(8.13), corp.SLIDE_H, WHITE)
    for i in range(8):
        g = int(0x1E + i * 4)
        add_rect(
            slide,
            Inches(0),
            Inches(5.5 + i * 0.25),
            Inches(5.2),
            Inches(0.25),
            corp.RGBColor(0x0D, g, 0x88 - i * 2),
        )

    if LOGO_PATH.exists():
        slide.shapes.add_picture(str(LOGO_PATH), Inches(7.0), Inches(1.0), width=Inches(3.8))

    add_textbox(
        slide,
        Inches(0.55),
        Inches(0.5),
        Inches(4.5),
        Inches(0.4),
        "MedicFlow-AI · Plataforma Operacional",
        size=12,
        color=GREEN_LIGHT,
    )
    add_textbox(
        slide,
        Inches(0.55),
        Inches(2.0),
        Inches(4.5),
        Inches(1.8),
        "Inteligência que conecta.\nOperação que transforma.",
        size=26,
        bold=True,
        color=WHITE,
    )
    add_textbox(
        slide,
        Inches(0.55),
        Inches(4.2),
        Inches(4.5),
        Inches(1.0),
        "Escalas, plantões, faturamento TISS e indicadores em tempo real — em um único fluxo.",
        size=13,
        color=WHITE,
    )

    add_textbox(
        slide,
        Inches(6.2),
        Inches(4.2),
        Inches(6.8),
        Inches(0.9),
        "Apresentação Executiva",
        size=34,
        bold=True,
        color=BLUE_DARK,
        align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide,
        Inches(6.2),
        Inches(5.05),
        Inches(6.8),
        Inches(0.45),
        "Investor / Executive Edition",
        size=16,
        bold=True,
        color=GREEN,
        align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide,
        Inches(6.2),
        Inches(5.55),
        Inches(6.8),
        Inches(0.5),
        "Diretores, investidores e tomadores de decisão",
        size=14,
        color=GRAY,
        align=PP_ALIGN.CENTER,
    )
    add_textbox(
        slide,
        Inches(6.2),
        Inches(6.2),
        Inches(6.8),
        Inches(0.4),
        "Junho 2026 · Base: auditoria funcional do produto",
        size=11,
        color=GRAY,
        align=PP_ALIGN.CENTER,
    )


def slide_oportunidade_mercado(prs):
    slide = blank_slide(prs)
    add_header_bar(slide, "Oportunidade de Mercado", "Saúde suplementar e gestão operacional digital no Brasil")
    add_metric_cards(
        slide,
        [
            ("50M+", "Beneficiários"),
            ("6.500+", "Hospitais privados"),
            ("R$ 300B+", "Mercado saúde sup."),
            ("TISS", "Padrão ANS"),
        ],
        Inches(0.7),
        Inches(1.55),
    )

    segments = [
        (
            "Hospitais e redes",
            "Gestão de plantões 24h, cobertura crítica e fechamento financeiro mensal — ainda fragmentada em planilhas e sistemas isolados.",
        ),
        (
            "Cooperativas médicas",
            "Redes de profissionais com escalas multi-unidade, repasses complexos e faturamento TISS descentralizado.",
        ),
        (
            "Clínicas e day hospitals",
            "Faturamento TISS, produção médica e conciliação sem visão executiva consolidada.",
        ),
        (
            "Posicionamento MedicFlow",
            "Plataforma operacional + faturamento TISS MVP — não prontuário nem ERP completo. Nicho claro, implantação rápida.",
        ),
    ]
    y = Inches(3.15)
    for title, desc in segments:
        add_rect(slide, Inches(0.7), y, Inches(0.1), Inches(0.75), GREEN)
        add_textbox(slide, Inches(0.95), y, Inches(11.5), Inches(0.32), title, size=14, bold=True, color=BLUE_DARK)
        add_textbox(slide, Inches(0.95), y + Inches(0.35), Inches(11.5), Inches(0.4), desc, size=12, color=GRAY_DARK)
        y += Inches(0.95)

    add_textbox(
        slide,
        Inches(0.7),
        Inches(6.55),
        Inches(11.8),
        Inches(0.35),
        "TAM endereçável: instituições médio porte com 50+ plantonistas e ciclo TISS ativo.",
        size=11,
        color=GRAY,
    )
    add_footer(slide, "MedicFlow-AI · Investor / Executive · 08/06/2026")


def slide_caso_hospital(prs):
    slide = blank_slide(prs)
    add_header_bar(slide, "Caso de Uso — Hospital", "Plantões 24h com visibilidade operacional em tempo real")
    add_textbox(
        slide,
        Inches(0.7),
        Inches(1.55),
        Inches(5.5),
        Inches(0.45),
        "Cenário: hospital privado com 150+ plantonistas, escalas em Excel e confirmações por WhatsApp.",
        size=13,
        bold=True,
        color=BLUE_DARK,
    )

    flow = [
        ("1. Publicação", "Coordenador cria turnos em Escalas (14 dias) com filtros de conflito"),
        ("2. Confirmação", "Profissionais aceitam/recusam em Plantões — swaps em fluxo integrado"),
        ("3. Monitoramento", "Central Operacional exibe KPIs, alertas e ações contextuais ao vivo"),
        ("4. Fechamento", "Competência financeira com snapshot, trava e dashboard executivo"),
    ]
    y = Inches(2.15)
    for step, desc in flow:
        add_rect(slide, Inches(0.7), y, Inches(1.3), Inches(0.5), GREEN)
        add_textbox(
            slide,
            Inches(0.75),
            y + Inches(0.1),
            Inches(1.2),
            Inches(0.35),
            step,
            size=11,
            bold=True,
            color=WHITE,
            align=PP_ALIGN.CENTER,
        )
        add_textbox(slide, Inches(2.2), y + Inches(0.08), Inches(4.0), Inches(0.4), desc, size=12, color=GRAY_DARK)
        y += Inches(0.62)

    outcomes = [
        "Cobertura 24h visível sem planilhas paralelas",
        "Swaps e conflitos resolvidos em minutos, não horas",
        "Implantação assistida: piloto + go-live em ~5 dias úteis",
    ]
    add_bullets(slide, Inches(0.7), Inches(4.75), Inches(5.5), Inches(1.8), outcomes, size=13)

    add_metric_cards(
        slide,
        [("150+", "Plantonistas"), ("24h", "Cobertura"), ("~5d", "Go-live"), ("Real-time", "Central")],
        Inches(0.7),
        Inches(5.85),
    )
    add_screenshot(slide, "04-plantoes.png", Inches(6.5), Inches(1.55), Inches(6.0), Inches(5.0))
    add_footer(slide, "MedicFlow-AI · Investor / Executive · 08/06/2026")


def slide_caso_cooperativa(prs):
    slide = blank_slide(prs)
    add_header_bar(slide, "Caso de Uso — Cooperativa", "Multi-tenant para redes de profissionais e múltiplas unidades")
    add_textbox(
        slide,
        Inches(0.7),
        Inches(1.55),
        Inches(5.5),
        Inches(0.45),
        "Cenário: cooperativa com 200+ cooperados em 8 unidades, repasses manuais e TISS descentralizado.",
        size=13,
        bold=True,
        color=BLUE_DARK,
    )

    pillars = [
        ("Multi-tenant nativo", "Uma cooperativa, múltiplas unidades — RLS Postgres e branding por instituição"),
        ("Escalas centralizadas", "Coordenação de plantões entre unidades com RBAC granular (5 perfis)"),
        ("Repasse integrado", "Produção TISS vinculada a repasses médicos por cooperado e competência"),
        ("Visão financeira", "Dashboard executivo com KPIs reais — fechamento com snapshot auditável"),
        ("Implantação escalável", "Nova unidade com white-label em dias, sem rebuild da plataforma"),
    ]
    y = Inches(2.15)
    for title, desc in pillars:
        add_rect(slide, Inches(0.7), y, Inches(0.08), Inches(0.65), GREEN)
        add_textbox(slide, Inches(0.95), y, Inches(5.3), Inches(0.28), title, size=13, bold=True, color=BLUE_DARK)
        add_textbox(slide, Inches(0.95), y + Inches(0.3), Inches(5.3), Inches(0.35), desc, size=11, color=GRAY)
        y += Inches(0.82)

    add_metric_cards(
        slide,
        [("200+", "Cooperados"), ("8", "Unidades"), ("5", "Perfis RBAC"), ("1", "Plataforma")],
        Inches(0.7),
        Inches(5.85),
    )
    add_screenshot(slide, "06-relatorios-dashboard-executivo.png", Inches(6.5), Inches(1.55), Inches(6.0), Inches(5.0))
    add_footer(slide, "MedicFlow-AI · Investor / Executive · 08/06/2026")


def slide_roi_operacional(prs):
    slide = blank_slide(prs)
    add_header_bar(slide, "ROI Operacional", "Retorno mensurável em eficiência e cobertura")
    metrics = [
        ("-40%", "Tempo em escalas"),
        ("-25%", "Glosas TISS"),
        ("2 dias", "Fechamento mensal"),
        ("6–12m", "Payback est."),
    ]
    add_metric_cards(slide, metrics, Inches(0.7), Inches(1.55))

    drivers = [
        (
            "Gestão de escalas",
            "Elimina planilhas e confirmações por WhatsApp — central única com Realtime e alertas proativos.",
            "-40% horas/semana da equipe de coordenação",
        ),
        (
            "Cobertura de plantões",
            "Central Operacional reduz turnos descobertos com swaps integrados e visibilidade 24h.",
            "Menos horas extras e penalidades contratuais",
        ),
        (
            "Ciclo TISS rastreável",
            "Guias → lotes → glosas no mesmo tenant — menos perdas por falta de rastreio.",
            "-25% glosas recuperáveis por documentação",
        ),
        (
            "Fechamento acelerado",
            "Snapshot + trava de competência substitui consolidação manual em múltiplas ferramentas.",
            "De ~5 dias para ~2 dias no fechamento",
        ),
    ]
    y = Inches(3.15)
    for title, desc, impact in drivers:
        add_rect(slide, Inches(0.7), y, Inches(2.6), Inches(0.55), GREEN)
        add_textbox(
            slide,
            Inches(0.8),
            y + Inches(0.1),
            Inches(2.4),
            Inches(0.35),
            title,
            size=12,
            bold=True,
            color=WHITE,
            align=PP_ALIGN.CENTER,
        )
        add_textbox(slide, Inches(3.5), y + Inches(0.02), Inches(5.5), Inches(0.35), desc, size=12, color=GRAY_DARK)
        add_textbox(slide, Inches(9.2), y + Inches(0.08), Inches(3.5), Inches(0.4), impact, size=11, bold=True, color=BLUE_MID)
        y += Inches(0.72)

    add_textbox(
        slide,
        Inches(0.7),
        Inches(6.1),
        Inches(11.8),
        Inches(0.7),
        "Estimativas para instituição médio porte (80+ plantonistas). Payback considera redução de ferramentas paralelas e horas administrativas.",
        size=10,
        color=GRAY,
    )
    add_footer(slide, "MedicFlow-AI · Investor / Executive · 08/06/2026")


def slide_beneficios_financeiros(prs):
    slide = blank_slide(prs)
    add_header_bar(slide, "Benefícios Financeiros", "Impacto direto em custos, receita e governança")
    benefits = [
        (
            "Redução de custos operacionais",
            "Substitui planilhas, ferramentas paralelas e processos manuais por plataforma única multi-tenant.",
        ),
        (
            "Otimização de receita TISS",
            "Ciclo guias → lotes → glosas rastreável reduz perdas por glosa e acelera recursos.",
        ),
        (
            "Governança financeira",
            "Fechamento com snapshot auditável, trava de competência e dashboard executivo com KPIs reais.",
        ),
        (
            "Escala comercial SaaS",
            "White-label por tenant — nova unidade em dias, custo marginal baixo por implantação.",
        ),
        (
            "Conciliação operacional",
            "Importação CSV e repasses médicos vinculados à produção — menos retrabalho no fechamento.",
        ),
    ]
    y = Inches(1.6)
    for title, desc in benefits:
        add_rect(slide, Inches(0.7), y, Inches(0.1), Inches(0.7), GREEN)
        add_textbox(slide, Inches(0.95), y, Inches(4.8), Inches(0.3), title, size=13, bold=True, color=BLUE_DARK)
        add_textbox(slide, Inches(0.95), y + Inches(0.32), Inches(4.8), Inches(0.38), desc, size=11, color=GRAY)
        y += Inches(0.88)

    add_rect(slide, Inches(6.2), Inches(1.6), Inches(6.3), Inches(4.8), GRAY_LIGHT)
    add_textbox(
        slide,
        Inches(6.4),
        Inches(1.75),
        Inches(5.9),
        Inches(0.35),
        "Modelo de valor para decisores",
        size=14,
        bold=True,
        color=BLUE_DARK,
    )
    value_items = [
        "Custo total de propriedade (TCO) menor que stack fragmentado",
        "Receita protegida por rastreabilidade TISS e menos glosas",
        "Visibilidade executiva para decisões de alocação e investimento",
        "Implantação assistida reduz risco e tempo até valor (TTV)",
        "Arquitetura multi-tenant pronta para crescimento de carteira",
    ]
    add_bullets(slide, Inches(6.4), Inches(2.2), Inches(5.8), Inches(3.5), value_items, size=12)

    add_metric_cards(
        slide,
        [("↓ TCO", "vs. stack fragmentado"), ("↑ Receita", "menos glosas"), ("↓ Risco", "implantação guiada"), ("↑ Escala", "multi-tenant")],
        Inches(0.7),
        Inches(5.85),
    )
    add_footer(slide, "MedicFlow-AI · Investor / Executive · 08/06/2026")


def build_executive_presentation():
    print("Extraindo logo...")
    extract_logo()

    print("Construindo slides executivos (20 + 5)...")
    prs = new_prs()

    # 20 slides originais (capa adaptada para investor/executive)
    slide_capa_executiva(prs)
    corp.slide_quem_somos(prs)
    corp.slide_problema(prs)
    corp.slide_solucao(prs)
    corp.slide_publico(prs)
    corp.slide_arquitetura(prs)

    corp.slide_feature(
        prs,
        "Dashboard",
        "Visão operacional do dia com KPIs e escala em tempo real",
        [
            "Saudação personalizada e contadores de plantões abertos",
            "Confirmações pendentes e swaps em destaque",
            "Escala do dia com turnos programados",
            "Links rápidos para Central, Escalas e Plantões",
            "Atualização via Supabase Realtime",
        ],
        "02-dashboard.png",
    )
    corp.slide_feature(
        prs,
        "Gestão de Escalas",
        "Calendário 14 dias com timeline de turnos",
        [
            "Barra horizontal dos próximos 14 dias",
            "Filtros: conflitos, abertos, sem confirmação",
            "Criação e edição de escalas (coordenador)",
            "Timeline detalhada por turno e profissional",
            "Integração com alertas da Central Operacional",
        ],
        "03-agenda-escalas.png",
    )
    corp.slide_feature(
        prs,
        "Gestão de Plantões",
        "Aceitar, recusar e trocar turnos",
        [
            "Plantões abertos para aceite/recusa",
            "Meus plantões com histórico e status",
            "Swaps: solicitar, aprovar e negar trocas",
            "Fluxo integrado com escalas e central",
            "Notificações operacionais em tempo real",
        ],
        "04-plantoes.png",
    )
    corp.slide_feature(
        prs,
        "Central Operacional",
        "Command center com alertas e ações contextuais",
        [
            "KPIs e alertas em tempo real",
            "Ações direcionadas por tipo de alerta",
            "Copilot GPT (opcional, requer API key)",
            "Agentes e orquestração supervisionada",
            "Subscriptions Realtime para cobertura ao vivo",
        ],
        "11-central-operacional.png",
    )
    corp.slide_feature(
        prs,
        "Perfil Profissional",
        "Disponibilidade e configuração do profissional",
        [
            "Dados do profissional: nome, e-mail, papel, instituição",
            "Switch de disponibilidade para plantões",
            "Janelas padrão seg–sex 07:00–19:00",
            "Integração com riscos de cobertura na central",
            "Encerramento seguro de sessão",
        ],
        "10-perfil.png",
    )
    corp.slide_feature(
        prs,
        "Financeiro",
        "Hub financeiro e fechamento operacional",
        [
            "Hub financeiro com links para sub-módulos",
            "Fechamento de competência com snapshot e trava",
            "Conciliação operacional com importação CSV",
            "Reabertura de competência (admin)",
            "Repasses médicos vinculados à produção TISS",
        ],
        "05-financeiro.png",
    )
    corp.slide_feature(
        prs,
        "Dashboard Executivo",
        "KPIs financeiros e operacionais reais",
        [
            "Indicadores consolidados por competência",
            "Visão para diretoria e equipe financeira",
            "Dados reais (não ilustrativos)",
            "Acesso via perfil financial_closing:read",
            "Integrado ao fluxo de fechamento mensal",
        ],
        "06-relatorios-dashboard-executivo.png",
    )
    corp.slide_feature(
        prs,
        "TISS / Faturamento",
        "Ciclo completo MVP — convênios a repasses",
        [
            "Convênios, contratos e catálogo TUSS",
            "Guias TISS e lotes com export XML (MVP)",
            "Glosas e recursos (entrada manual)",
            "Produção médica e repasses integrados",
            "Sem envio automático a operadoras (V1)",
        ],
        "09-tiss.png",
    )

    corp.slide_seguranca(prs)
    corp.slide_implantacao(prs)
    corp.slide_diferenciais(prs)

    # 5 slides novos — business case para investidores e diretores
    slide_oportunidade_mercado(prs)
    slide_caso_hospital(prs)
    slide_caso_cooperativa(prs)
    slide_roi_operacional(prs)
    slide_beneficios_financeiros(prs)

    corp.slide_roadmap(prs)
    corp.slide_resultados(prs)
    corp.slide_encerramento(prs)

    return prs


def main():
    os.chdir(ROOT)
    prs = build_executive_presentation()
    prs.save(str(OUTPUT_PPTX))
    slide_count = len(prs.slides)
    print(f"PPTX salvo: {OUTPUT_PPTX} ({slide_count} slides)")

    pdf_ok = export_pdf(OUTPUT_PPTX, OUTPUT_PDF)
    if not pdf_ok:
        soffice = shutil.which("soffice") or shutil.which("libreoffice")
        if soffice:
            import subprocess

            subprocess.run(
                [soffice, "--headless", "--convert-to", "pdf", "--outdir", str(DOCS), str(OUTPUT_PPTX)],
                check=False,
            )
            print("Tentativa via LibreOffice concluída")

    print("\n=== ENTREGA V2 EXECUTIVA ===")
    print(f"Slides: {slide_count}")
    for path in (OUTPUT_PPTX, OUTPUT_PDF):
        if path.exists():
            size = path.stat().st_size
            label = f"{size / (1024 * 1024):.2f} MB" if size >= 1024 * 1024 else f"{size / 1024:.1f} KB"
            print(f"{path.name}: {label}")
        else:
            print(f"{path.name}: NÃO GERADO")


if __name__ == "__main__":
    main()

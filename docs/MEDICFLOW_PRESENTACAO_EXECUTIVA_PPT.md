# MedicFlow-AI — Apresentação Executiva PowerPoint

**Documento:** blueprint slide a slide para conversão direta em PPTX  
**Edição:** Investor / Commercial Edition — Final  
**Data:** 11/06/2026  
**Versão:** V2 Executiva → PPT  
**Público:** hospitais · cooperativas · investidores · grupos de plantonistas  
**Ambiente demo:** `https://staging.medicflow.app.br`  
**Base:** [MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.md](./MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.md) · [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) · [MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md](./MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md)

---

## Sumário

1. [Como usar este documento](#1-como-usar-este-documento)
2. [Identidade visual MedicFlow-AI](#2-identidade-visual-medicflow-ai)
3. [Sistema de grid e posicionamento](#3-sistema-de-grid-e-posicionamento)
4. [Master slides (layouts base)](#4-master-slides-layouts-base)
5. [Inventário de assets](#5-inventário-de-assets)
6. [Deck principal — 15 slides](#6-deck-principal--15-slides)
7. [Apêndices opcionais](#7-apêndices-opcionais)
8. [Conversão direta para PPTX](#8-conversão-direta-para-pptx)
9. [Checklist pré-apresentação](#9-checklist-pré-apresentação)

---

## 1. Como usar este documento

Este arquivo é o **roteiro de produção** do deck executivo final. Cada slide contém:

| Campo | Função |
|-------|--------|
| **Layout** | Tipo de master slide a aplicar |
| **Zonas** | Distribuição visual em regiões nomeadas (A–F) |
| **Posicionamento** | Coordenadas em % do slide 16:9 (referência 1920×1080 px) |
| **Tipografia** | Tamanhos e pesos para título, subtítulo, corpo |
| **Diagrama** | Asset Mermaid a exportar + referência no doc de diagramas |
| **Screenshot** | Arquivo em `docs/screenshots/` + tratamento visual |
| **Speaker Notes** | Texto para notas do apresentador no PPT |

### Posicionamento obrigatório (todas as apresentações)

> MedicFlow-AI **não é prontuário eletrônico**. É a camada operacional e financeira que conecta escalas, plantões, TISS e fechamento — entre planilhas e ERPs.

Inserir este callout no **rodapé fixo** dos slides 2–14 (layout `FOOTER-CALLOUT`).

### Parâmetros globais

| Parâmetro | Valor |
|-----------|-------|
| Formato | 16:9 · 1920×1080 px (export) · 33,87 × 19,05 cm (PowerPoint) |
| Margem segura | 80 px (4,2%) em todos os lados |
| Área útil | 1760×920 px (central) |
| Tempo total | 30–40 min + Q&A |
| Slides principais | 15 |
| Slides apêndice | 4 (opcionais) |

---

## 2. Identidade visual MedicFlow-AI

### 2.1 Paleta corporativa

| Token | Hex | RGB | Uso no PPT |
|-------|-----|-----|------------|
| **Primary** | `#0369A1` | 3, 105, 161 | Títulos, barras laterais, links, setas |
| **Primary Light** | `#E0F2FE` | 224, 242, 254 | Fundo de módulos operacionais |
| **Teal** | `#0D9488` | 13, 148, 136 | Fluxos de plantão, ícones saúde |
| **Teal Light** | `#CCFBF1` | 204, 251, 241 | Etapas de captação |
| **Navy** | `#1E3A5F` | 30, 58, 95 | Texto executivo, corpo |
| **Success** | `#059669` | 5, 150, 105 | Resultados, go-live, KPIs positivos |
| **Success Light** | `#D1FAE5` | 209, 250, 229 | Fechamento, coluna "Depois" |
| **Danger** | `#DC2626` | 220, 38, 38 | Problemas, coluna "Antes" |
| **Danger Light** | `#FEE2E2` | 254, 226, 226 | Fundo de dor/risco |
| **Accent** | `#D97706` | 217, 119, 6 | Implantação, alertas |
| **Accent Light** | `#FEF3C7` | 254, 243, 199 | Instituição, branding |
| **IA** | `#7C3AED` | 124, 58, 237 | Copilot, agentes |
| **IA Light** | `#EDE9FE` | 237, 233, 254 | IA operacional |
| **Audit** | `#DB2777` | 219, 39, 119 | Auditoria, compliance |
| **Background** | `#F8FAFC` | 248, 250, 252 | Fundo padrão dos slides |
| **Surface** | `#FFFFFF` | 255, 255, 255 | Cards, screenshots, diagramas |
| **Muted** | `#64748B` | 100, 116, 139 | Metadados, rodapé |

### 2.2 Tipografia

| Elemento | Fonte | Tamanho (pt) | Peso | Cor |
|----------|-------|--------------|------|-----|
| Título slide (H1) | Segoe UI / Arial | 32–36 | Bold | `#0369A1` ou `#FFFFFF` (capa) |
| Subtítulo / mensagem | Segoe UI / Arial | 20–24 | Semibold | `#1E3A5F` |
| Corpo / bullets | Segoe UI / Arial | 16–18 | Regular | `#1E3A5F` |
| Callout destaque | Segoe UI / Arial | 18–20 | Semibold | `#0369A1` |
| Metadados / rodapé | Segoe UI / Arial | 11–12 | Regular | `#64748B` |
| Números KPI | Segoe UI / Arial | 28–40 | Bold | `#059669` ou `#0369A1` |
| Tagline itálico | Segoe UI / Arial | 16 | Italic | `#64748B` |

### 2.3 Elementos gráficos recorrentes

| Elemento | Especificação |
|----------|---------------|
| **Barra lateral esquerda** | 12 px largura · `#0369A1` · slides de conteúdo |
| **Card / container** | Fundo `#FFFFFF` · borda 1 px `#E2E8F0` · radius 8 px · sombra `0 2px 8px rgba(30,58,95,0.08)` |
| **Screenshot frame** | Borda 2 px `#0369A1` · radius 6 px · sombra leve · opcional: mockup laptop (capa, slide 4) |
| **Badge status** | ✅ `#059669` · ⚠️ `#D97706` · ❌ `#DC2626` · pill 24 px altura |
| **Seta transformação** | `#0369A1` · 3 px · entre colunas Antes/Depois |
| **Logo** | Canto superior esquerdo em slides internos · centralizado na capa |
| **Número do slide** | Canto inferior direito · 11 pt · `#64748B` |
| **QR code staging** | 120×120 px · slides 1 e 15 · link `https://staging.medicflow.app.br` |

### 2.4 Ícones sugeridos (sem dependência de pacote)

Usar ícones flat monocromáticos `#0369A1` ou emojis documentados nos diagramas:

| Conceito | Ícone |
|----------|-------|
| Planilha / fragmentação | 📊 |
| WhatsApp / informal | 💬 |
| Cobertura / alerta | 🔔 |
| TISS / hospital | 🏥 |
| Fechamento / auditoria | 🔒 |
| Escala / calendário | 📅 |
| Cooperativa / pool | 👥 |
| Mobile / PWA | 📱 |

---

## 3. Sistema de grid e posicionamento

### 3.1 Grid 12 colunas (referência 1920×1080)

```
┌──80px──┬─col1─┬─col2─┬─col3─┬─col4─┬─col5─┬─col6─┬─col7─┬─col8─┬─col9─┬─col10┬─col11┬─col12─┬──80px──┐
│ margin │  1   │  2   │  3   │  4   │  5   │  6   │  7   │  8   │  9   │  10  │  11  │  12   │ margin │
│        │←────────────── 50% texto (6 cols) ──────────────→│←──────── 50% visual (6 cols) ────────→│        │
└────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┴───────┴────────┘
         ↑ y = 120 px (abaixo do header)                                    ↑ y = 880 px (acima do footer)
```

| Zona | Colunas | Largura % | Uso típico |
|------|---------|-----------|------------|
| **A — Header** | 1–12 | 100% | Título + subtítulo |
| **B — Texto** | 1–6 | 50% | Bullets, tabelas, mensagem |
| **C — Visual** | 7–12 | 50% | Diagrama ou screenshot |
| **D — Full visual** | 1–12 | 100% | Diagrama hero (60% altura) |
| **E — Footer** | 1–12 | 100% | Callout posicionamento + URL |
| **F — Split 3** | 4 cols cada | 33% × 3 | Composição de 3 screenshots |

### 3.2 Coordenadas padrão (% do slide)

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Logo (interno) | 4% | 3% | 12% | auto |
| Título H1 | 4% | 10% | 92% | 8% |
| Subtítulo | 4% | 18% | 55% | 6% |
| Zona texto (B) | 4% | 26% | 46% | 58% |
| Zona visual (C) | 52% | 26% | 44% | 58% |
| Zona visual hero (D) | 4% | 26% | 92% | 55% |
| Callout rodapé (E) | 4% | 88% | 92% | 6% |
| Screenshot único | 52% | 28% | 44% | 54% |
| Screenshot triplo (F) | 4%/36%/68% | 30% | 28% | 50% |
| Diagrama full-width | 4% | 28% | 92% | 52% |

### 3.3 Regras de distribuição visual

| Tipo de slide | Proporção texto : visual | Prioridade visual |
|---------------|--------------------------|-------------------|
| Capa | 40 : 60 | Screenshot hero |
| Problema / custo | 45 : 55 | Diagrama Antes×Depois |
| Solução / workflow | 35 : 65 | Diagrama + screenshot |
| Caso de uso | 50 : 50 | Screenshot + fluxo To-Be |
| Financeiro / dashboard | 40 : 60 | Screenshot produto |
| CTA final | 35 : 65 | QR + piloto screenshot |

**Regra de ouro:** máximo **5–7 bullets** por slide. Se exceder, mover detalhes para Speaker Notes ou apêndice.

---

## 4. Master slides (layouts base)

Criar estes **6 layouts** no PowerPoint antes de montar o deck:

### Layout 1 — `COVER-HERO`

- Fundo: gradiente `#0369A1` → `#0D9488` (diagonal 135°)
- Logo centralizado ou canto superior
- Título branco 36 pt
- Área hero 60% direita para screenshot em mockup
- QR code canto inferior direito

### Layout 2 — `SPLIT-50-50`

- Fundo `#F8FAFC`
- Barra lateral 12 px `#0369A1`
- Zona B (texto) + Zona C (visual)
- Rodapé callout posicionamento

### Layout 3 — `VISUAL-HERO`

- Título + subtítulo compactos (18% altura)
- Zona D diagrama/screenshot full-width (55%)
- Bullets resumidos abaixo (20%)

### Layout 4 — `TRIPLE-SCREENSHOT`

- Título + fluxo linear no topo
- Zona F: 3 screenshots lado a lado com setas entre eles
- Legenda numerada abaixo de cada imagem

### Layout 5 — `TABLE-FOCUS`

- Título + tabela centralizada (70% largura)
- Visual complementar lateral opcional (25%)
- Ideal para diferenciais, pacotes, roadmap

### Layout 6 — `CTA-CLOSE`

- Fundo `#0369A1` suave (`#E0F2FE` com barra primária)
- CTA central grande
- QR code + URL staging + screenshot piloto

---

## 5. Inventário de assets

### 5.1 Screenshots staging (`docs/screenshots/`)

Exportar em **1920×1080** ou recortar para **16:9** sem distorção. Aplicar frame padrão (§2.3).

| # | Arquivo | Rota staging | Slides |
|---|---------|--------------|--------|
| 01 | `01-login.png` | `/login` | 1 (alt), 9, 15 |
| 02 | `02-dashboard.png` | `/` | 1, 4, 15 |
| 03 | `03-agenda-escalas.png` | `/escalas` | 5, 7 |
| 04 | `04-plantoes.png` | `/plantoes` | 5, 8, 9 |
| 05 | `05-financeiro.png` | `/financeiro` | 6, 10 |
| 06 | `06-relatorios-dashboard-executivo.png` | `/dashboard-executivo` | 7, 11 |
| 07 | `07-configuracoes-instituicao.png` | `/instituicao` | 4, 6, 8, 12 |
| 08 | `08-administracao-piloto.png` | `/piloto` | 6, 13, 14, 15 |
| 09 | `09-tiss.png` | `/tiss` | 7, 8, 10 |
| 10 | `10-perfil.png` | `/perfil` | 9 |
| 11 | `11-central-operacional.png` | `/central` | 3, 5, 7, 11, 12 |
| 12 | `12-operacao-auditoria.png` | `/operacao` | Apêndice técnico |

> Se o arquivo 12 não existir, capturar `/operacao` em staging antes da apresentação.

### 5.2 Diagramas Mermaid ([MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md))

| Exportar como | Seção doc | Slides |
|---------------|-----------|--------|
| `diag-01-plataforma.png` | §1 Visão da Plataforma | 1, 4 |
| `diag-02-captacao-10etapas.png` | §2 Fluxo 10 etapas (horizontal) | 5 |
| `diag-02-captacao-swimlane.png` | §2 Swimlane atores | 5 (alt) |
| `diag-03-hub-admin.png` | §3 Hub 10 módulos | 6 |
| `diag-03-implantacao-gantt.png` | §3 Implantação go-live | 6, 14 |
| `diag-05-hospital-jornada.png` | §5 Fluxo institucional hospital | 7 |
| `diag-06-cooperativa-pool.png` | §6 Fluxo cooperativa pool | 8 |
| `diag-04-medico-jornada.png` | §4 Fluxo linear médico | 9 |
| `diag-07-modulos-relacao.png` | §7 Relacionamento módulos | 10 |
| `diag-07-arquitetura.png` | §7 Arquitetura plataforma | Apêndice técnico |
| `diag-antes-depois.png` | [MEDICFLOW_CASOS_DE_USO §6.2](./MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md) ou [SLIDES §1](./MEDICFLOW_SLIDES_COMERCIAIS.md) | 2 |
| `diag-roi-4dimensoes.png` | [MEDICFLOW_SLIDES §2](./MEDICFLOW_SLIDES_COMERCIAIS.md) | 3 |
| `diag-quadrante-competitivo.png` | [MEDICFLOW_SLIDES §3](./MEDICFLOW_SLIDES_COMERCIAIS.md) | 12 |
| `diag-timeline-roadmap.png` | Criar no PPT (3 colunas) | 13 |
| `diag-funil-comercial.png` | Criar no PPT (5 etapas) | 14 |

**Exportação Mermaid:**
1. Copiar bloco → [mermaid.live](https://mermaid.live)
2. Export PNG **1920×1080** · fundo transparente
3. Ou CLI: `npx @mermaid-js/mermaid-cli -i diag.mmd -o diag.png -b transparent -w 1920 -H 1080`

---

## 6. Deck principal — 15 slides

---

### SLIDE 1 — Capa

| Campo | Especificação |
|-------|---------------|
| **Layout** | `COVER-HERO` |
| **Tempo** | 1–2 min |
| **Título** | MedicFlow-AI — A plataforma operacional que conecta plantões, TISS e fechamento financeiro |
| **Subtítulo** | Digitalizar plantões hospitalares e integrar TISS em plataforma multi-tenant white-label |

#### Distribuição visual

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Logo]                                              [QR staging 120×120]  │
│                                                                            │
│  TÍTULO (branco, 36pt, 55% largura esquerda)                               │
│  Subtítulo (branco 80%, 22pt)                                              │
│                                                                            │
│  ┌─ metadados ─────────────┐    ┌─ MOCKUP LAPTOP ─────────────────────┐   │
│  │ V1 Operacional          │    │                                     │   │
│  │ staging.medicflow.app.br│    │   [02-dashboard.png]                │   │
│  │ Hospitais·Coops·Invest. │    │   frame + sombra                    │   │
│  └─────────────────────────┘    └─────────────────────────────────────┘   │
│                                                                            │
│  Tagline itálico: "Não é prontuário. É a camada operacional e financeira."│
└────────────────────────────────────────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Logo | 8% | 6% | 18% | auto |
| QR code | 86% | 6% | 6% | auto |
| Título | 8% | 22% | 48% | — |
| Subtítulo | 8% | 38% | 44% | — |
| Card metadados | 8% | 52% | 40% | 22% |
| Mockup laptop | 54% | 20% | 40% | 62% |
| Tagline | 8% | 88% | 70% | — |

#### Assets

| Tipo | Asset | Tratamento |
|------|-------|------------|
| **Screenshot** | `02-dashboard.png` | Dentro de mockup laptop · leve perspectiva · drop shadow |
| **Diagrama (alt)** | `diag-01-plataforma.png` | Substituir mockup se sem screenshot |
| **Extra** | QR → `staging.medicflow.app.br` | Canto superior direito |

#### Speaker Notes

> *"Bom dia / boa tarde. Antes de começar: quantas planilhas diferentes sua instituição usa hoje para escala, confirmação e faturamento?"*
>
> *"O MedicFlow-AI nasceu para resolver isso. Somos plataforma operacional — não prontuário — que digitaliza plantões, integra TISS e entrega fechamento auditável. Staging live com demo guiada de 7 passos."*
>
> *"Nos próximos 30 minutos: problema, solução, workflows, casos de uso e modelo comercial. Podem interromper a qualquer momento."*

---

### SLIDE 2 — Problema do mercado

| Campo | Especificação |
|-------|---------------|
| **Layout** | `VISUAL-HERO` |
| **Tempo** | 2–3 min |
| **Título** | O mercado opera plantões no escuro — e paga caro por isso |
| **Mensagem** | Processos manuais e fragmentados — sem integração, sem auditoria, sem tempo real |

#### Distribuição visual

```
┌─ HEADER ───────────────────────────────────────────────────────────────────┐
│ Título + mensagem principal (callout #FEE2E2)                              │
├─ ZONA D (58% altura) ──────────────────────────────────────────────────────┤
│  ┌─ ANTES (#FEE2E2) ──────────┐  →  ┌─ DEPOIS (#D1FAE5) ─────────────┐  │
│  │ diag-antes-depois.png       │  →  │ (lado direito do diagrama)      │  │
│  │ Planilha→WhatsApp→TISS...   │  →  │ /escalas→/plantoes→/tiss...     │  │
│  └─────────────────────────────┘  →  └─────────────────────────────────┘  │
├─ ZONA B resumida (2 colunas de bullets) ───────────────────────────────────┤
│  Operação (4 dores)          │  Financeiro (4 dores)                        │
├─ FOOTER CALLOUT ───────────────────────────────────────────────────────────┤
│ "Não é prontuário..."                                                      │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Callout mensagem | 4% | 18% | 92% | 6% |
| Diagrama Antes×Depois | 4% | 28% | 92% | 48% |
| Coluna Operação | 4% | 78% | 44% | 14% |
| Coluna Financeiro | 52% | 78% | 44% | 14% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | `diag-antes-depois.png` — §6.2 CASOS_DE_USO ou SLIDES §1 |
| **Screenshot** | Nenhum (slide conceitual) |

#### Bullets (máx. 6 visíveis)

**Operação:** Excel sem histórico · WhatsApp sem rastreio · cobertura invisível · trocas informais  
**Financeiro:** TISS isolado · fechamento sem snapshot · repasses desconectados · glosas perdidas

#### Speaker Notes

> *"Isso não é falha das equipes — é falta de plataforma integrada."*
> *"Se houver diretor financeiro: TISS desconectado e fechamento sem auditoria geram retrabalho e receita perdida."*

---

### SLIDE 3 — O custo da operação atual

| Campo | Especificação |
|-------|---------------|
| **Layout** | `SPLIT-50-50` |
| **Tempo** | 2–3 min |
| **Título** | O custo invisível: retrabalho, risco e receita perdida |
| **Mensagem** | Quatro dimensões de custo oculto: tempo · risco · receita · governança |

#### Distribuição visual

```
┌─ B (texto 50%) ────────────────┬─ C (visual 50%) ────────────────────────┐
│ Título                          │                                          │
│                                 │  ┌────────────────────────────────────┐  │
│ ┌─ 4 cards empilhados ────────┐ │  │ diag-roi-4dimensoes.png            │  │
│ │ ⏱ Tempo operacional        │ │  │ OU funil 4 colunas                 │  │
│ │ ⚠️ Risco de cobertura       │ │  │                                    │  │
│ │ 💰 Receita financeira       │ │  │ Iceberg (opcional)                 │  │
│ │ ⚖️ Governança               │ │  └────────────────────────────────────┘  │
│ └─────────────────────────────┘ │                                          │
│ Cadeia As-Is (monoespaçado)     │  [alt] 11-central-operacional.png       │
│ "Planilha→WhatsApp→..."         │  legenda: "sem central = detecção tardia"│
└─────────────────────────────────┴──────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Card Tempo | 4% | 28% | 44% | 10% |
| Card Risco | 4% | 40% | 44% | 10% |
| Card Receita | 4% | 52% | 44% | 10% |
| Card Governança | 4% | 64% | 44% | 10% |
| Cadeia As-Is | 4% | 76% | 44% | 8% |
| Diagrama ROI | 52% | 28% | 44% | 50% |
| Screenshot alt | 52% | 62% | 44% | 22% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | `diag-roi-4dimensoes.png` — SLIDES §2 |
| **Screenshot (alt)** | `11-central-operacional.png` — contraste "detecção tardia vs proativa" |

#### Speaker Notes

> *"Vamos falar de dinheiro e risco — não de tecnologia."*
> *"Para investidores: operação de plantões ainda roda em planilha — esse gap é nossa oportunidade."*
> *"Proponho medir o custo real em piloto de 30 dias com KPIs baseline."*

---

### SLIDE 4 — Como o MedicFlow-AI resolve

| Campo | Especificação |
|-------|---------------|
| **Layout** | `SPLIT-50-50` (visual prioridade — inverter: visual 55% esquerda) |
| **Tempo** | 3 min |
| **Título** | Uma plataforma. Operação, TISS e fechamento no mesmo tenant. |
| **Mensagem** | Multi-tenant white-label unifica operação, TISS MVP e fechamento auditável |

#### Distribuição visual

```
┌─ C (visual 55%) ─────────────────────┬─ B (texto 45%) ────────────────────┐
│                                       │                                     │
│  diag-01-plataforma.png (topo 45%)    │  3 pilares em cards:                │
│                                       │  OPERAÇÃO · FINANCEIRO · IMPLANTAÇÃO│
│  ┌─ composição 3 screenshots ──────┐ │                                     │
│  │ [02-dash] [09-tiss] [06-exec]    │ │  Tabela capacidades (6 linhas)      │
│  │ miniaturas com labels            │ │  Badge ✅ Implementado              │
│  └──────────────────────────────────┘ │  Box "Não é: EHR · ERP · envio auto"│
└───────────────────────────────────────┴─────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Diagrama plataforma | 4% | 26% | 50% | 38% |
| Screenshot 02 | 4% | 66% | 15% | 18% |
| Screenshot 09 | 22% | 66% | 15% | 18% |
| Screenshot 06 | 40% | 66% | 15% | 18% |
| Bullets + tabela | 58% | 26% | 38% | 62% |
| Box "Não é" | 58% | 82% | 38% | 8% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | `diag-01-plataforma.png` |
| **Screenshots** | `02-dashboard.png` + `09-tiss.png` + `06-relatorios-dashboard-executivo.png` |

#### Speaker Notes

> *"E se tudo isso vivesse em um único lugar, com auditoria e tempo real?"*
> *"V1: 20 rotas, ~173 server functions, ~63 tabelas Postgres com RLS, demo 7 passos, staging live."*
> *"Transparência: não somos prontuário, não enviamos TISS automaticamente na V1."*

---

### SLIDE 5 — Workflow Captação de Plantões

| Campo | Especificação |
|-------|---------------|
| **Layout** | `TRIPLE-SCREENSHOT` |
| **Tempo** | 3 min |
| **Título** | Do plantão aberto ao repasse: 10 etapas rastreáveis |
| **Mensagem** | Hospital → escalista → médico → financeiro com anti double-booking |

#### Distribuição visual

```
┌─ HEADER + diagrama linear 10 etapas (faixa 15% altura) ────────────────────┐
│ DEMANDA → PUBLICAÇÃO → ... → CONFIRMAÇÃO → EXECUÇÃO → FECHAMENTO → PAGAMENTO│
├─ diag-02-captacao-10etapas.png (faixa 22% altura, full width) ─────────────┤
├─ ZONA F — 3 screenshots com setas ───────────────────────────────────────────┤
│  [03-agenda-escalas]  →  [04-plantoes]  →  [11-central-operacional]        │
│  ① Publicação            ④ Captação          ⑦ Monitoramento RT            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Fluxo linear texto | 4% | 18% | 92% | 8% |
| Diagrama 10 etapas | 4% | 28% | 92% | 20% |
| Screenshot 03 | 4% | 52% | 28% | 38% |
| Screenshot 04 | 36% | 52% | 28% | 38% |
| Screenshot 11 | 68% | 52% | 28% | 38% |
| Setas entre SS | entre colunas | 58% | 2% | — |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | `diag-02-captacao-10etapas.png` + opcional swimlane em apêndice |
| **Screenshots** | `03-agenda-escalas.png` → `04-plantoes.png` → `11-central-operacional.png` |

#### Speaker Notes

> *"Sexta 18h — UTI sem confirmação. Central alertou às 14h. Médico aceitou em 2 minutos."*
> *"Regra: 1 confirmado por turno. Swaps formalizados."*
> *"Gap: push/e-mail não na V1 — in-app + Realtime."*

---

### SLIDE 6 — Workflow Administrativo

| Campo | Especificação |
|-------|---------------|
| **Layout** | `SPLIT-50-50` |
| **Tempo** | 2–3 min |
| **Título** | Hub Administrativo Médico: gestão institucional em 10 módulos |
| **Mensagem** | Go-live em ~3 dias — não projeto ERP de 6 meses |

#### Distribuição visual

```
┌─ B (texto) ────────────────────────┬─ C (visual) ─────────────────────────┐
│ Tabela 10 módulos (compacta)       │  diag-03-hub-admin.png (topo 55%)    │
│ ① Instituição … ⑩ Auditoria        │                                       │
│                                    │  diag-03-implantacao-gantt.png (base) │
│ Badge: "Go-live ~3 dias"           │  [07-configuracoes-instituicao.png]   │
│                                    │  canto inferior direito (preview)     │
└────────────────────────────────────┴───────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Tabela módulos | 4% | 28% | 46% | 55% |
| Diagrama hub | 52% | 26% | 44% | 40% |
| Gantt implantação | 52% | 68% | 44% | 14% |
| Screenshot 07 | 72% | 68% | 22% | 14% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagramas** | `diag-03-hub-admin.png` + `diag-03-implantacao-gantt.png` |
| **Screenshot** | `07-configuracoes-instituicao.png` |

---

### SLIDE 7 — Caso de Uso: Hospital

| Campo | Especificação |
|-------|---------------|
| **Layout** | `SPLIT-50-50` |
| **Tempo** | 2–3 min |
| **Título** | Hospital de médio porte — da escala fragmentada ao fechamento auditável |
| **Mensagem** | 150–350 leitos · cobertura proativa · TISS no mesmo tenant |
| **Persona** | Mariana, escalista — UTI sexta 18h |

#### Distribuição visual

```
┌─ B ────────────────────────────────┬─ C ────────────────────────────────────┐
│ Perfil (1 linha)                   │  diag-05-hospital-jornada.png          │
│                                    │                                         │
│ ┌─ ANTES ─────┐  ┌─ DEPOIS ──────┐ │  [06-relatorios-dashboard-executivo]   │
│ │ 3 bullets   │  │ tabela 5 benef│ │  hero screenshot (60% zona C)          │
│ │ vermelho    │  │ verde         │ │                                         │
│ └─────────────┘  └───────────────┘ │  [11-central-operacional] thumbnail    │
│ Storytelling Mariana (callout)     │  canto inferior                          │
└────────────────────────────────────┴─────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Antes (card) | 4% | 32% | 22% | 28% |
| Depois (card) | 28% | 32% | 22% | 28% |
| Storytelling | 4% | 64% | 46% | 16% |
| Diagrama jornada | 52% | 26% | 44% | 30% |
| Screenshot 06 | 52% | 58% | 44% | 32% |
| Thumbnail 11 | 78% | 82% | 18% | 12% |

#### Assets

| Tipo | Asset | Fonte conteúdo |
|------|-------|----------------|
| **Diagrama** | `diag-05-hospital-jornada.png` | DIAGRAMAS §5 |
| **Screenshots** | `06-relatorios-dashboard-executivo.png` + `11-central-operacional.png` | CASOS §2 |
| **Texto As-Is/To-Be** | CASOS §2.3–2.5 | |

#### Speaker Notes

> *"Quantas planilhas consultaram até achar a versão certa?"*
> *"Pacote: Operacional + TISS + Fechamento. Piloto 30 dias."*

---

### SLIDE 8 — Caso de Uso: Cooperativa

| Campo | Especificação |
|-------|---------------|
| **Layout** | `SPLIT-50-50` |
| **Tempo** | 2–3 min |
| **Título** | Cooperativa médica — pool centralizado, repasses transparentes |
| **Mensagem** | Tenant dedicado · branding próprio · assembleias com auditoria |
| **Persona** | Dr. Ricardo — "Quanto vou receber?" |

#### Distribuição visual

```
┌─ C (visual 55%) ─────────────────────┬─ B (texto 45%) ────────────────────┐
│                                       │                                     │
│  diag-06-cooperativa-pool.png         │  Perfil: 80–400 médicos             │
│  (diagrama central, 50% zona)         │                                     │
│                                       │  Antes (3 bullets) / Depois (5)     │
│  [04-plantoes]      [09-tiss]         │                                     │
│  captação pool      repasses          │  Storytelling Dr. Ricardo           │
│                                       │  Pacote: Enterprise                 │
│  [07-configuracoes] branding          │                                     │
└───────────────────────────────────────┴─────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Diagrama pool | 4% | 28% | 50% | 42% |
| Screenshot 04 | 4% | 72% | 15% | 18% |
| Screenshot 09 | 22% | 72% | 15% | 18% |
| Screenshot 07 | 40% | 72% | 12% | 18% |
| Texto + storytelling | 58% | 26% | 38% | 65% |

#### Assets

| Tipo | Asset | Fonte |
|------|-------|-------|
| **Diagrama** | `diag-06-cooperativa-pool.png` | DIAGRAMAS §6 |
| **Screenshots** | `04-plantoes.png` · `09-tiss.png` · `07-configuracoes-instituicao.png` | CASOS §3 |

---

### SLIDE 9 — Caso de Uso: Grupo de Plantonistas

| Campo | Especificação |
|-------|---------------|
| **Layout** | `SPLIT-50-50` |
| **Tempo** | 2 min |
| **Título** | Grupo de plantonistas — profissionalizar sem burocratizar |
| **Mensagem** | 15–80 médicos · confirmação 1 clique · PWA · credibilidade com hospitais |
| **Persona** | Dr. Felipe — 40 → 65 plantonistas sem secretária |

#### Distribuição visual

```
┌─ B ────────────────────────────────┬─ C ────────────────────────────────────┐
│ Antes / Depois (tabela 6 linhas)   │  diag-04-medico-jornada.png            │
│                                    │                                         │
│ Benefícios em ícones (grid 2×3)    │  [10-perfil.png] — mobile hero         │
│ 📱 PWA · ✅ 1 clique · 👥 escala   │  [04-plantoes.png] — confirmação       │
│                                    │  [01-login.png] — branding grupo       │
└────────────────────────────────────┴─────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Tabela benefícios | 4% | 28% | 46% | 40% |
| Grid ícones | 4% | 70% | 46% | 16% |
| Diagrama médico | 52% | 26% | 44% | 28% |
| Screenshot 10 (hero) | 60% | 56% | 28% | 38% |
| Screenshot 04 | 52% | 56% | 8% | 14% |
| Screenshot 01 | 84% | 56% | 10% | 14% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | `diag-04-medico-jornada.png` |
| **Screenshots** | `10-perfil.png` (hero) · `04-plantoes.png` · `01-login.png` |

---

### SLIDE 10 — Financeiro + TISS

| Campo | Especificação |
|-------|---------------|
| **Layout** | `VISUAL-HERO` |
| **Tempo** | 3 min |
| **Título** | Operação alimenta faturamento: TISS e fechamento no mesmo tenant |
| **Mensagem** | Produção → TISS → repasses → fechamento → dashboard — zero retrabalho |

#### Distribuição visual

```
┌─ HEADER ───────────────────────────────────────────────────────────────────┐
│ Título + pipeline horizontal (5 etapas com setas)                          │
├─ ZONA D ───────────────────────────────────────────────────────────────────┤
│  diag-07-modulos-relacao.png (40% altura)                                   │
│  ┌─ [09-tiss.png] 60% ─────────────┐  ┌─ [05-financeiro.png] 35% ────────┐ │
│  │ Produção + Repasses              │  │ Hub financeiro                    │ │
│  └──────────────────────────────────┘  └───────────────────────────────────┘ │
├─ Tabela abas TISS (compacta, 6 linhas com badges) ─────────────────────────┤
└─ FOOTER: "V1: export XML + manual — envio automático no roadmap" ───────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Pipeline 5 etapas | 4% | 18% | 92% | 8% |
| Diagrama módulos | 4% | 28% | 92% | 22% |
| Screenshot 09 | 4% | 52% | 55% | 36% |
| Screenshot 05 | 62% | 52% | 34% | 36% |
| Tabela TISS | 4% | 90% | 92% | — (mover para slide se crowded) |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | `diag-07-modulos-relacao.png` |
| **Screenshots** | `09-tiss.png` + `05-financeiro.png` |

---

### SLIDE 11 — Dashboard Executivo

| Campo | Especificação |
|-------|---------------|
| **Layout** | `SPLIT-50-50` |
| **Tempo** | 2 min |
| **Título** | Dashboard Executivo: KPIs reais para decisão, não planilhas |
| **Mensagem** | Snapshots travados — confiáveis para board e investidores |

#### Distribuição visual

```
┌─ C (visual 60%) ─────────────────────┬─ B (texto 40%) ────────────────────┐
│                                       │                                     │
│  [06-relatorios-dashboard-executivo]  │  Tabela 5 indicadores               │
│  screenshot hero (full zona)          │  Fonte · Onde                       │
│                                       │                                     │
│  overlay: [11-central-operacional]    │  2 camadas:                         │
│  thumbnail 25% canto inferior         │  /executivo · /dashboard-executivo  │
│                                       │  Funil: dados→snapshot→KPI→decisão  │
└───────────────────────────────────────┴─────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Screenshot 06 | 4% | 26% | 54% | 58% |
| Thumbnail 11 | 8% | 72% | 20% | 14% |
| Tabela KPIs | 62% | 28% | 34% | 45% |
| Funil decisão | 62% | 76% | 34% | 12% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Screenshot** | `06-relatorios-dashboard-executivo.png` + `11-central-operacional.png` |
| **Diagrama (alt)** | KPI consolidado — criar 4 cards no PPT |

---

### SLIDE 12 — Diferenciais Competitivos

| Campo | Especificação |
|-------|---------------|
| **Layout** | `TABLE-FOCUS` |
| **Tempo** | 2–3 min |
| **Título** | 10 diferenciais com evidência — por que MedicFlow-AI |
| **Mensagem** | Quadrante operacional + financeiro — planilhas não escalam, ERPs não operam RT |

#### Distribuição visual

```
┌─ HEADER ───────────────────────────────────────────────────────────────────┐
│ Título + posicionamento "É / Não é" (box central)                           │
├─ diag-quadrante-competitivo.png (35% altura esquerda) ─────────────────────┤
├─ Tabela 10 diferenciais (2 colunas: # + evidência) ─────────────────────────┤
│  Screenshots evidência em strip inferior:                                   │
│  [07 white-label] [11 central RT] [08 piloto] [09 TISS integrado]         │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Box "É / Não é" | 4% | 18% | 92% | 8% |
| Quadrante | 4% | 28% | 40% | 32% |
| Tabela 10 itens | 48% | 28% | 48% | 45% |
| Strip 4 screenshots | 4% | 76% | 92% | 16% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | `diag-quadrante-competitivo.png` — SLIDES §3 |
| **Screenshots** | `07` · `11` · `08` · `09` (miniaturas com label #8, #3, #5, #2) |

---

### SLIDE 13 — Roadmap

| Campo | Especificação |
|-------|---------------|
| **Layout** | `TABLE-FOCUS` |
| **Tempo** | 2 min |
| **Título** | Roadmap transparente: o que está pronto, o que vem a seguir |
| **Mensagem** | V1 entrega valor imediato — roadmap médio/longo prazo sem data fixa |

#### Distribuição visual

```
┌─ 3 colunas timeline (criar no PPT, não Mermaid) ───────────────────────────┐
│  ✅ V1 IMPLEMENTADO     │  ⚠️ V1 PARCIAL          │  🔮 ROADMAP            │
│  (verde #D1FAE5)        │  (amarelo #FEF3C7)      │  (cinza #F1F5F9)       │
│  Escalas·Plantões·     │  Hub financeiro KPIs    │  Curto: XML ANS         │
│  Central·Fechamento·   │  XML MVP·Glosas·        │  Médio: push·webhooks   │
│  TISS·White-label      │  Conciliação CSV        │  Longo: ERP·pacientes   │
├─ métricas produto (badge strip) ────────────────────────────────────────────┤
│  20 rotas · 173 functions · 63 tabelas · staging live                     │
│  [08-administracao-piloto.png] canto direito                               │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Coluna Implementado | 4% | 28% | 28% | 48% |
| Coluna Parcial | 36% | 28% | 28% | 48% |
| Coluna Roadmap | 68% | 28% | 28% | 48% |
| Strip métricas | 4% | 78% | 60% | 10% |
| Screenshot 08 | 72% | 76% | 22% | 14% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | Timeline 3 colunas — **nativo PPT** (retângulos + ícones) |
| **Screenshot** | `08-administracao-piloto.png` |

---

### SLIDE 14 — Modelo Comercial

| Campo | Especificação |
|-------|---------------|
| **Layout** | `TABLE-FOCUS` |
| **Tempo** | 2 min |
| **Título** | Modelo comercial flexível — SaaS multi-tenant com implantação assistida |
| **Mensagem** | Piloto 30 dias com KPIs baseline — melhor closer |

#### Distribuição visual

```
┌─ Funil comercial (topo 20%) ────────────────────────────────────────────────┐
│ Discovery → Demo → Piloto → Proposta → Go-live → Customer success           │
├─ 3 pacotes (colunas iguais) ────────────────────────────────────────────────┤
│  OPERACIONAL          │  OPERACIONAL+TISS     │  ENTERPRISE                 │
│  UPA·clínica·grupo    │  Hospital 24h         │  Cooperativa·multi-unidade  │
│  Escalas·Plantões·RT  │  +TISS·Repasses·      │  Completo·Dashboard·IA      │
│  Piloto 3 dias        │  Fechamento·5 dias    │  Go-live dedicado           │
├─ Componentes precificação (linha única) + screenshot piloto ────────────────┤
│  [08-administracao-piloto.png] 40% direita                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| Funil 6 etapas | 4% | 20% | 92% | 12% |
| Pacote 1 | 4% | 36% | 28% | 38% |
| Pacote 2 | 36% | 36% | 28% | 38% |
| Pacote 3 | 68% | 36% | 28% | 38% |
| Screenshot 08 | 58% | 76% | 38% | 18% |
| Nota "valores na proposta" | 4% | 88% | 50% | — |

#### Assets

| Tipo | Asset |
|------|-------|
| **Diagrama** | Funil comercial — nativo PPT |
| **Screenshot** | `08-administracao-piloto.png` |

---

### SLIDE 15 — Chamada para Piloto (CTA)

| Campo | Especificação |
|-------|---------------|
| **Layout** | `CTA-CLOSE` |
| **Tempo** | 1–2 min |
| **Título** | Próximo passo: piloto institucional de 30 dias ou demo executiva ao vivo |
| **Mensagem** | Staging live · demo 7 passos · KPIs baseline |

#### Distribuição visual

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                                    │
│                                                                            │
│  TÍTULO CTA (32pt, #0369A1)                                                │
│                                                                            │
│  ┌─ 3 opções CTA (cards) ──────────────────────────────────────────────┐  │
│  │ 🏥 Piloto 30 dias  │  🎯 Demo 45 min  │  🔧 Workshop técnico 2h    │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Demo 7 passos (numerado compacto)     │  [08-piloto.png] + [02-dash]     │
│                                        │  QR staging grande               │
│  Elevator pitch (callout)              │  Contato: [email/calendly]       │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Posicionamento

| Elemento | X | Y | W | H |
|----------|---|---|---|---|
| 3 cards CTA | 4% | 32% | 92% | 18% |
| Lista 7 passos | 4% | 54% | 48% | 28% |
| Elevator pitch | 4% | 84% | 48% | 10% |
| Screenshots | 56% | 52% | 38% | 30% |
| QR code | 78% | 52% | 14% | auto |
| Contato | 56% | 86% | 38% | 8% |

#### Assets

| Tipo | Asset |
|------|-------|
| **Screenshots** | `08-administracao-piloto.png` + `02-dashboard.png` |
| **QR** | `https://staging.medicflow.app.br` — mínimo 150×150 px |

#### Speaker Notes

> *"Podemos iniciar piloto de 30 dias ou demo executiva de 45 minutos. Qual faz mais sentido?"*
> *"Sempre fechamos com data: [dia] às [hora]?"*
> *"Follow-up em 24h. Obrigado."*

---

## 7. Apêndices opcionais

Incluir após slide 15 conforme audiência. Não apresentar no pitch de 30 min padrão.

| Slide | Título | Layout | Conteúdo |
|-------|--------|--------|----------|
| A1 | Roteiros demo 10/20/40 min | `TABLE-FOCUS` | Apêndice A da V2 |
| A2 | FAQ rápido | `TABLE-FOCUS` | Apêndice C da V2 + CASOS §8–9 |
| A3 | Arquitetura técnica | `VISUAL-HERO` | `diag-07-arquitetura.png` + métricas |
| A4 | Empresa de gestão de escalas | `SPLIT-50-50` | CASOS §5 — multi-tenant B2B |

---

## 8. Conversão direta para PPTX

### 8.1 Método recomendado — PowerPoint manual (máximo controle)

**Tempo estimado:** 4–6 horas para deck completo

| Passo | Ação |
|-------|------|
| 1 | Criar apresentação em branco · Design → Tamanho do slide → **Largo (16:9)** |
| 2 | Exibir → Guias · ativar grade e guias (alinhar ao grid §3) |
| 3 | Criar **6 layouts** conforme §4 (Exibir → Slide Mestre) |
| 4 | Definir **cores do tema** com paleta §2.1 (Design → Cores → Personalizar) |
| 5 | Exportar todos os diagramas Mermaid (§5.2) para pasta `docs/exports/ppt/` |
| 6 | Validar screenshots em `docs/screenshots/` — 1920×1080, frame §2.3 |
| 7 | Montar slides 1–15 seguindo §6 — copiar títulos e bullets deste doc |
| 8 | Colar **Speaker Notes** de cada slide (Exibir → Notas) |
| 9 | Inserir rodapé fixo slides 2–14: callout posicionamento §1 |
| 10 | Revisar alinhamento · transições sutis (Morph nos screenshots opcional) |
| 11 | Exportar PDF backup + PPTX final |

### 8.2 Método semi-automático — Marp / Pandoc

**Pré-requisito:** Node.js + `@marp-team/marp-cli`

```bash
# Instalar Marp CLI
npm install -g @marp-team/marp-cli

# Criar MEDICFLOW_PRESENTACAO_EXECUTIVA_MARP.md a partir deste blueprint
# (slides em Markdown com front-matter Marp)

marp MEDICFLOW_PRESENTACAO_EXECUTIVA_MARP.md --pptx -o MEDICFLOW_EXECUTIVO.pptx
```

**Limitação:** posicionamento pixel-perfect de screenshots exige ajuste manual pós-export.

**Tema Marp sugerido:**

```yaml
---
marp: true
theme: default
size: 16:9
style: |
  section { background: #F8FAFC; font-family: 'Segoe UI', Arial, sans-serif; }
  h1 { color: #0369A1; }
  strong { color: #1E3A5F; }
  footer { color: #64748B; font-size: 12px; }
---
```

### 8.3 Método Python — python-pptx (batch)

Para equipe técnica que quer automatizar inserção de imagens:

```bash
pip install python-pptx Pillow
```

```python
# scripts/build_executive_ppt.py (esqueleto)
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RgbColor

PRIMARY = RgbColor(0x03, 0x69, 0xA1)
NAVY = RgbColor(0x1E, 0x3A, 0x5F)
BG = RgbColor(0xF8, 0xFA, 0xFC)

SLIDES = [
    {"title": "MedicFlow-AI — A plataforma operacional...", "layout": "cover",
     "images": [("docs/screenshots/02-dashboard.png", 6.5, 1.5, 5.5, 4.0)]},
    # ... mapear slides 2-15 conforme §6
]

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

for spec in SLIDES:
    slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
    # adicionar título, shapes, imagens conforme coordenadas §6
    pass

prs.save("docs/MEDICFLOW_EXECUTIVO.pptx")
```

Coordenadas Inches: `x_in = (x_pct / 100) * 13.333` · `y_in = (y_pct / 100) * 7.5`

### 8.4 Método Google Slides

| Passo | Ação |
|-------|------|
| 1 | Arquivo → Importar slides → upload PPTX gerado no §8.1 |
| 2 | Ou: tema personalizado com cores §2.1 |
| 3 | Inserir → Imagem → upload diagramas e screenshots |
| 4 | Compartilhar link somente leitura para investidores |

### 8.5 Ordem de produção recomendada

```
Paleta + masters → Diagramas Mermaid → Screenshots → Slides 1-4 (narrativa)
→ Slides 5-6 (workflows) → Slides 7-9 (casos de uso) → Slides 10-11 (financeiro)
→ Slides 12-13 (diferenciais + roadmap) → Slides 14-15 (comercial + CTA)
→ Speaker Notes → Revisão final
```

### 8.6 Nomenclatura de arquivos finais

| Arquivo | Uso |
|---------|-----|
| `MEDICFLOW_EXECUTIVO_v2.pptx` | Deck principal 15 slides |
| `MEDICFLOW_EXECUTIVO_v2.pdf` | Envio por e-mail |
| `MEDICFLOW_EXECUTIVO_v2_NOTES.pdf` | Versão com notas (exportar do PPT) |
| `docs/exports/ppt/*.png` | Diagramas exportados |
| `docs/screenshots/*.png` | Screenshots staging |

---

## 9. Checklist pré-apresentação

| Item | Slides | ☐ |
|------|--------|:-:|
| Staging acessível (`staging.medicflow.app.br`) | 1, 15 | ☐ |
| 12 screenshots exportados 1920×1080 | Todos | ☐ |
| Diagramas Mermaid exportados PNG transparente | 2–13 | ☐ |
| QR code staging testado no celular | 1, 15 | ☐ |
| Credenciais demo (admin, escalista, médico) | Demo ao vivo | ☐ |
| Roteiro `/piloto` 7 passos testado | 15 | ☐ |
| Callout "não é prontuário" em slides 2–14 | 2–14 | ☐ |
| Segmento adaptado (hospital / cooperativa / investidor) | 7–9, 14 | ☐ |
| Contato comercial + calendly inserido | 15 | ☐ |
| Gap sheet / FAQ (apêndice A2) preparado | Q&A | ☐ |
| PDF backup gerado | Entrega | ☐ |
| Transições e animações revisadas (sem excesso) | Todos | ☐ |

### Adaptação por audiência

| Audiência | Ênfase | Slides extras | Demo foco |
|-----------|--------|---------------|-----------|
| **Hospital** | Slides 7, 10, 11 | Caso hospital | `/escalas` → `/central` → `/tiss` → fechamento |
| **Cooperativa** | Slides 8, 10 | Caso cooperativa | `/plantoes` → `/tiss` repasses → branding |
| **Investidores** | Slides 3, 12, 13, 14 | Apêndice A3 arquitetura | Métricas produto + roadmap transparente |
| **Grupo plantonistas** | Slide 9 | Caso grupo | `/plantoes` → `/perfil` mobile |
| **Pitch 15 min** | Slides 1–4 + 15 | — | `/` + `/central` + `/executivo` |

---

## Referências cruzadas

| Documento | Uso neste PPT |
|-----------|---------------|
| [MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.md](./MEDICFLOW_PRESENTACAO_EXECUTIVA_V2.md) | Conteúdo e Speaker Notes originais |
| [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | Exportação de diagramas |
| [MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md](./MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md) | Casos de uso slides 7–9 |
| [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | Antes×Depois, ROI, quadrante |
| [MEDICFLOW_DEMO_COMERCIAL.md](./MEDICFLOW_DEMO_COMERCIAL.md) | Roteiros demo ao vivo |
| [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md) | Argumentação slide 14 |

---

*Blueprint gerado para conversão direta em PowerPoint. Sem alterações de código, banco ou staging. Atualizar screenshots e QR antes de cada apresentação executiva.*

# MedicFlow-AI — Infográfico Executivo

**Documento:** infográfico consolidado para apresentações comerciais  
**Data:** 11/06/2026  
**Formato:** Mermaid (exportável para PNG/SVG/PowerPoint)  
**Base:** documentação operacional V1

---

## Guia de uso

Este documento consolida a narrativa visual do MedicFlow-AI em diagramas de alto impacto para:

- **Capa de apresentação** — infográfico principal (§1)
- **One-pager comercial** — ecossistema + números (§2–3)
- **Poster executivo** — pilares + jornadas (§4–5)

**Exportação:** [mermaid.live](https://mermaid.live) → PNG 1920×1080 ou SVG vetorial.

### Paleta corporativa

| Cor | Hex | Uso |
|-----|-----|-----|
| Primary | `#0369A1` | Títulos, bordas |
| Teal | `#0D9488` | Operação, saúde |
| Success | `#059669` | Resultados, ROI |
| Accent | `#D97706` | Implantação |
| Navy | `#1E3A5F` | Texto executivo |

---

## 1. Infográfico Principal — Ecossistema MedicFlow-AI

**Uso:** slide de abertura ou poster A4/A3

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1', 'fontSize': '12px'}}}%%
flowchart TB
    TITLE["MedicFlow-AI V1<br/>Plataforma Operacional Hospitalar Multi-tenant"]

    subgraph PROBLEMA["O PROBLEMA"]
        PR1["📊 Planilhas"]
        PR2["💬 WhatsApp"]
        PR3["📁 Sistemas<br/>fragmentados"]
    end

    subgraph SOLUCAO["A SOLUÇÃO — 3 PILARES"]
        direction LR
        PIL1["OPERAÇÃO<br/>Escalas · Plantões<br/>Central RT"]
        PIL2["FINANCEIRO<br/>TISS · Fechamento<br/>Repasses"]
        PIL3["EXECUTIVO<br/>KPIs · Auditoria<br/>Dashboard"]
    end

    subgraph ATOR["QUEM USA"]
        direction LR
        A1["🏥 Hospital"]
        A2["🤝 Cooperativa"]
        A3["👨‍⚕️ Médico"]
        A4["📊 Diretoria"]
    end

    subgraph NUM["NÚMEROS V1"]
        direction LR
        N1["20 rotas"]
        N2["~173 APIs"]
        N3["~63 tabelas"]
        N4["5 papéis RBAC"]
    end

    TITLE --> PROBLEMA
    PROBLEMA -->|Digitaliza| SOLUCAO
    SOLUCAO --> ATOR
    SOLUCAO --> NUM

    classDef title fill:#0369A1,color:#FFFFFF,stroke:#1E3A5F
    classDef prob fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
    classDef sol fill:#D1FAE5,stroke:#059669,color:#064E3B
    classDef actor fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef num fill:#FEF3C7,stroke:#D97706,color:#78350F

    class TITLE title
    class PR1,PR2,PR3 prob
    class PIL1,PIL2,PIL3 sol
    class A1,A2,A3,A4 actor
    class N1,N2,N3,N4 num
```

---

## 2. Ciclo de Valor — Da Demanda ao Pagamento

**Uso:** slide central da narrativa comercial

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#0369A1'}}}%%
flowchart LR
    D["DEMANDA<br/>Cobertura<br/>necessária"] --> P["PUBLICAÇÃO<br/>/escalas<br/>14 dias"]
    P --> N["NOTIFICAÇÃO<br/>/central<br/>Realtime"]
    N --> I["INTERESSE<br/>/plantoes<br/>Abertos"]
    I --> S["SELEÇÃO<br/>Escalista ou<br/>self-service"]
    S --> C["CONFIRMAÇÃO<br/>1 confirmed<br/>por shift"]
    C --> E["EXECUÇÃO<br/>Plantão<br/>realizado"]
    E --> V["VALIDAÇÃO<br/>Produção<br/>médica"]
    V --> F["FECHAMENTO<br/>Snapshot<br/>+ trava"]
    F --> PG["PAGAMENTO<br/>Repasses<br/>/tiss"]

    classDef step fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef fin fill:#D1FAE5,stroke:#059669,color:#064E3B

    class D,P,N,I,S,C,E,V step
    class F,PG fin
```

---

## 3. Hub Administrativo — 10 Módulos em Um Olhar

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#FEF3C7', 'lineColor': '#0369A1'}}}%%
flowchart TB
    HUB["HUB ADMINISTRATIVO MÉDICO"]

    HUB --> M1["① Instituição"]
    HUB --> M2["② Profissionais"]
    HUB --> M3["③ Escalas"]
    HUB --> M4["④ Financeiro"]
    HUB --> M5["⑤ TISS"]
    HUB --> M6["⑥ Conciliação"]
    HUB --> M7["⑦ Fechamento"]
    HUB --> M8["⑧ Dashboard"]
    HUB --> M9["⑨ Indicadores"]
    HUB --> M10["⑩ Auditoria"]

    M1 --- M2 --- M3 --- M4 --- M5
    M5 --- M6 --- M7 --- M8 --- M9 --- M10

    classDef hub fill:#0369A1,color:#FFFFFF,stroke:#1E3A5F
    classDef mod fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef modEnd fill:#FCE7F3,stroke:#DB2777,color:#1E3A5F

    class HUB hub
    class M1,M2,M3,M4,M5,M6,M7,M8,M9 mod
    class M10 modEnd
```

---

## 4. Jornadas — 3 Personas em Paralelo

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#0369A1'}}}%%
flowchart TB
    subgraph MEDICO["👨‍⚕️ MÉDICO"]
        direction LR
        JM1[Entrada] --> JM2[Captação] --> JM3[Escala] --> JM4[Plantão] --> JM5[Pagamento]
    end

    subgraph HOSPITAL["🏥 HOSPITAL"]
        direction LR
        JH1[Implantação] --> JH2[Instituição] --> JH3[Equipe] --> JH4[Operação] --> JH5[Indicadores]
    end

    subgraph COOP["🤝 COOPERATIVA"]
        direction LR
        JC1[Onboarding] --> JC2[Pool] --> JC3[Escalas] --> JC4[Repasses] --> JC5[Transparência]
    end

    JM4 -.->|assignments| JH4
    JH2 -.->|tenant| JC1
    JC3 -.->|turnos| JM2

    classDef med fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef hosp fill:#FEF3C7,stroke:#D97706,color:#78350F
    classDef coop fill:#CCFBF1,stroke:#0D9488,color:#064E3B

    class JM1,JM2,JM3,JM4,JM5 med
    class JH1,JH2,JH3,JH4,JH5 hosp
    class JC1,JC2,JC3,JC4,JC5 coop
```

---

## 5. Arquitetura — Stack em Camadas

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#0369A1'}}}%%
flowchart TB
    subgraph L1["ACESSO"]
        L1A["PWA · React 19 · RBAC"]
    end

    subgraph L2["APLICAÇÃO — 20 ROTAS"]
        L2A["Captação · Operação · TISS · Financeiro · Executivo · Implantação"]
    end

    subgraph L3["SERVIÇOS"]
        L3A["~173 Server Functions · ~100 Serviços · 28 Hooks"]
    end

    subgraph L4["DADOS + INFRA"]
        L4A["Supabase Postgres + Auth + Realtime"]
        L4B["Cloudflare Workers"]
    end

    L1 --> L2 --> L3 --> L4

    classDef l1 fill:#1E3A5F,color:#FFFFFF,stroke:#0369A1
    classDef l2 fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef l3 fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef l4 fill:#D1FAE5,stroke:#059669,color:#064E3B

    class L1A l1
    class L2A l2
    class L3A l3
    class L4A,L4B l4
```

---

## 6. Antes x Depois — Resumo Visual

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#64748B'}}}%%
flowchart LR
    subgraph ANTES["❌ ANTES"]
        direction TB
        A1["Planilhas"]
        A2["WhatsApp"]
        A3["TISS separado"]
        A4["Sem auditoria"]
    end

    subgraph DEPOIS["✅ MEDICFLOW-AI"]
        direction TB
        D1["/escalas unificado"]
        D2["/plantoes auditável"]
        D3["/tiss integrado"]
        D4["Snapshot + trava"]
    end

    ANTES ==>|Transformação| DEPOIS

    classDef antes fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
    classDef depois fill:#D1FAE5,stroke:#059669,color:#064E3B

    class A1,A2,A3,A4 antes
    class D1,D2,D3,D4 depois
```

---

## 7. Diferenciais — Top 5 em Destaque

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1'}}}%%
mindmap
  root((MedicFlow-AI<br/>Top 5))
    Multi-tenant nativo
      RLS Postgres
      Branding /instituicao
    Operação + TISS
      Mesmo tenant
      Mesma auditoria
    Central RT
      Alertas live
      Supabase Realtime
    Implantação assistida
      Demo 7 passos
      Go-live 3 dias
    Fechamento auditável
      Snapshot
      Trava competência
```

---

## 8. Roadmap Visual — Maturidade V1

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#0369A1'}}}%%
timeline
    title Roadmap MedicFlow-AI
    section V1 Implementado
        Escalas e Plantões : Pronto
        Central RT : Pronto
        TISS MVP : Pronto
        Fechamento : Pronto
        Piloto Go-live : Pronto
    section Completar V1
        XML ANS : Parcial
        UI Profissionais : Gap
        Hub Financeiro KPIs : Parcial
    section Médio Prazo
        Envio Operadoras : Planejado
        Conciliação Bancária : Planejado
    section Longo Prazo
        EHR Pacientes : Não escopo V1
```

---

## 9. CTA Comercial — Call to Action

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0369A1', 'primaryTextColor': '#FFFFFF'}}}%%
flowchart LR
    DEMO["🎯 Demo Guiada<br/>7 passos"]
    STG["🌐 Staging Live<br/>staging.medicflow.app.br"]
    PIL["🚀 Piloto Assistido<br/>Go-live ~3 dias"]
    ROI["📈 ROI Operacional<br/>+ Financeiro"]

    DEMO --> STG --> PIL --> ROI

    classDef cta fill:#0369A1,color:#FFFFFF,stroke:#1E3A5F
    classDef step fill:#D1FAE5,stroke:#059669,color:#064E3B

    class DEMO cta
    class STG,PIL,ROI step
```

---

## Índice de infográficos

| # | Infográfico | Melhor uso |
|---|-------------|------------|
| 1 | Ecossistema principal | Capa / abertura |
| 2 | Ciclo de valor 10 etapas | Slide operacional |
| 3 | Hub 10 módulos | Slide gestão |
| 4 | 3 jornadas paralelas | Slide personas |
| 5 | Stack em camadas | Slide técnico |
| 6 | Antes x Depois resumo | Slide transformação |
| 7 | Top 5 diferenciais | Slide competitivo |
| 8 | Roadmap maturidade | Slide transparência |
| 9 | CTA comercial | Slide fechamento |

---

## Referências cruzadas

| Documento | Conteúdo |
|-----------|----------|
| [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | Diagramas detalhados (10 itens) |
| [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | Slides Antes/Depois, ROI, Diferenciais |
| [MEDICFLOW_APRESENTACAO_EXECUTIVA.md](./MEDICFLOW_APRESENTACAO_EXECUTIVA.md) | Material executivo consolidado |
| [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md) | Proposta de valor completa |

---

*Infográficos em Mermaid 10+ — testar em [mermaid.live](https://mermaid.live) antes de exportar para PowerPoint.*

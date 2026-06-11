# MedicFlow-AI — Slides Comerciais

**Documento:** slides visuais para apresentações comerciais (formato Mermaid)  
**Data:** 11/06/2026  
**Público:** diretoria, investidores, hospitais, cooperativas  
**Base:** [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md)

---

## Guia de apresentação

### Estrutura sugerida (deck comercial)

| Ordem | Slide | Arquivo de origem |
|-------|-------|-------------------|
| 1 | Abertura — Visão da Plataforma | [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) §1 |
| 2 | Problema — Antes x Depois | Este documento §1 |
| 3 | Solução — Fluxo de Captação | [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) §2 |
| 4 | ROI e Ganhos Operacionais | Este documento §2 |
| 5 | Diferenciais Competitivos | Este documento §3 |
| 6 | Jornadas por Persona | [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) §4–6 |
| 7 | Arquitetura e Prova Técnica | [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) §7 |
| 8 | Infográfico Resumo | [MEDICFLOW_INFOGRAFICO.md](./MEDICFLOW_INFOGRAFICO.md) |
| 9 | Roadmap e Transparência | [MEDICFLOW_APRESENTACAO_EXECUTIVA.md](./MEDICFLOW_APRESENTACAO_EXECUTIVA.md) §8 |
| 10 | CTA — Demo e Staging | `staging.medicflow.app.br` |

### Paleta para slides comerciais

| Elemento | Cor | Hex |
|----------|-----|-----|
| Antes (problema) | Vermelho suave | `#FEE2E2` / borda `#DC2626` |
| Depois (solução) | Verde suave | `#D1FAE5` / borda `#059669` |
| Destaque MedicFlow | Azul primário | `#0369A1` |
| Fundo neutro | Cinza claro | `#F8FAFC` |

---

## Slide 1 — Antes x Depois do MedicFlow

**Título sugerido:** *De planilhas fragmentadas a operação integrada*  
**Notas do apresentador:** Enfatizar dor real do mercado (WhatsApp, planilhas) vs. evidência no produto (rotas implementadas, staging live).

### Comparativo visual — fluxo lado a lado

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#FEE2E2', 'lineColor': '#64748B'}}}%%
flowchart LR
    subgraph ANTES["❌ ANTES — Mercado atual"]
        direction TB
        A1["📊 Planilha Excel<br/>versões conflitantes"]
        A2["💬 WhatsApp<br/>confirmações perdidas"]
        A3["📞 Ligações reativas<br/>cobertura descoberta"]
        A4["🤝 Trocas informais<br/>double-booking"]
        A5["📁 TISS em sistema<br/>separado da operação"]
        A6["📧 Fechamento por<br/>e-mail sem auditoria"]
        A1 --> A2 --> A3 --> A4 --> A5 --> A6
    end

    subgraph DEPOIS["✅ DEPOIS — MedicFlow-AI"]
        direction TB
        D1["📅 /escalas<br/>Calendário 14 dias"]
        D2["✅ /plantoes<br/>Assignment auditável"]
        D3["🔔 /central<br/>Alertas em tempo real"]
        D4["🔄 Swaps<br/>Aprovação formalizada"]
        D5["🏥 /tiss<br/>Ciclo integrado"]
        D6["🔒 Fechamento<br/>Snapshot + trava"]
        D1 --> D2 --> D3 --> D4 --> D5 --> D6
    end

    ANTES -.->|Transformação| DEPOIS

    classDef antes fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
    classDef depois fill:#D1FAE5,stroke:#059669,color:#064E3B

    class A1,A2,A3,A4,A5,A6 antes
    class D1,D2,D3,D4,D5,D6 depois
```

### Matriz comparativa — processos

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#0369A1'}}}%%
flowchart TB
    subgraph MATRIZ["Comparativo por processo"]
        direction LR

        subgraph P1["Publicar escala"]
            P1A["Antes: Planilha compartilhada"]
            P1D["Depois: /escalas calendário 14d"]
        end

        subgraph P2["Confirmar plantão"]
            P2A["Antes: WhatsApp / ligação"]
            P2D["Depois: /plantoes auditável"]
        end

        subgraph P3["Monitorar cobertura"]
            P3A["Antes: Reativo por telefone"]
            P3D["Depois: /central alertas RT"]
        end

        subgraph P4["Faturar TISS"]
            P4A["Antes: Sistema separado"]
            P4D["Depois: /tiss ciclo integrado"]
        end

        subgraph P5["Fechar mês"]
            P5A["Antes: Planilha + e-mail"]
            P5D["Depois: Snapshot + trava"]
        end

        subgraph P6["Implantar"]
            P6A["Antes: Demo ad hoc"]
            P6D["Depois: Demo guiada 7 passos"]
        end
    end

    classDef antes fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
    classDef depois fill:#D1FAE5,stroke:#059669,color:#064E3B

    class P1A,P2A,P3A,P4A,P5A,P6A antes
    class P1D,P2D,P3D,P4D,P5D,P6D depois
```

### Impacto qualitativo — mindmap

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1'}}}%%
mindmap
  root((MedicFlow-AI<br/>Transformação))
    Operação
      Zero planilhas paralelas
      100% confirmações rastreadas
      Cobertura proativa
      Swaps formalizados
    Financeiro
      TISS no mesmo tenant
      Fechamento auditável
      Repasses vinculados à produção
      Conciliação estruturada
    Institucional
      White-label em dias
      Multi-tenant seguro
      Go-live controlado
      Demo comercial pronta
```

### Bullets para o slide (texto complementar)

| Dimensão | Antes | Depois com MedicFlow-AI |
|----------|-------|-------------------------|
| **Escala** | Planilha com versões conflitantes | Calendário 14 dias unificado |
| **Confirmação** | WhatsApp sem rastreio | Assignment com status auditável |
| **Cobertura** | Descoberta em cima da hora | Alertas proativos em tempo real |
| **TISS** | Sistema desconectado | Ciclo integrado no mesmo tenant |
| **Fechamento** | Retroativo sem controle | Snapshot + trava + reabertura controlada |
| **Implantação** | Demo improvisada | Piloto + 7 passos + smoke tests |

---

## Slide 2 — ROI e Ganhos Operacionais

**Título sugerido:** *Retorno operacional e financeiro mensurável*  
**Notas do apresentador:** Métricas baseadas em capacidades implementadas — não prometer números não auditados. Usar "eliminação de" e "redução de" com base em evidências do produto.

### Mapa de valor — quadrante por segmento

```mermaid
%%{init: {'theme': 'base'}}%%
quadrantChart
    title Valor MedicFlow-AI por Segmento
    x-axis Baixa complexidade --> Alta complexidade
    y-axis Baixo impacto --> Alto impacto
    quadrant-1 Expansão
    quadrant-2 Prioridade comercial
    quadrant-3 Entrada rápida
    quadrant-4 Nicho especializado
    Hospital 24h: [0.78, 0.88]
    Cooperativa médica: [0.68, 0.82]
    Clínica com TISS: [0.55, 0.72]
    UPA: [0.62, 0.76]
    Diretoria financeira: [0.42, 0.92]
```

### Ganhos operacionais — diagrama de impacto

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#D1FAE5', 'lineColor': '#059669'}}}%%
flowchart TB
    subgraph ROI_OP["GANHOS OPERACIONAIS"]
        O1["Centralização de escalas<br/>Elimina planilhas paralelas"]
        O2["Confirmação rastreável<br/>100% assignments registrados"]
        O3["Visibilidade RT<br/>Detecção proativa de gaps"]
        O4["Swaps formalizados<br/>Redução de conflitos"]
        O5["Auditoria completa<br/>operational_events"]
    end

    subgraph ROI_FIN["GANHOS FINANCEIROS"]
        F1["Ciclo TISS documentado<br/>14 tabelas no tenant"]
        F2["Fechamento com snapshot<br/>Zero alteração retroativa"]
        F3["Repasses vinculados<br/>produção → payout"]
        F4["Dashboard KPIs reais<br/>por competência"]
        F5["Glosas rastreadas<br/>recuperação de receita"]
    end

    subgraph ROI_IMP["GANHOS DE IMPLANTAÇÃO"]
        I1["Time-to-value<br/>Go-live em ~3 dias"]
        I2["Demo 7 passos<br/>Roteiro comercial pronto"]
        I3["White-label<br/>Sem rebuild"]
        I4["Smoke tests<br/>Validação técnica"]
    end

    ROI_OP --> VALOR["ROI INSTITUCIONAL<br/>Menos retrabalho · Mais controle · Mais receita recuperável"]
    ROI_FIN --> VALOR
    ROI_IMP --> VALOR

    classDef oper fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef fin fill:#D1FAE5,stroke:#059669,color:#1E3A5F
    classDef imp fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef valor fill:#0369A1,color:#FFFFFF,stroke:#1E3A5F

    class O1,O2,O3,O4,O5 oper
    class F1,F2,F3,F4,F5 fin
    class I1,I2,I3,I4 imp
    class VALOR valor
```

### ROI por persona — tabela visual

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#0369A1'}}}%%
flowchart LR
    subgraph HOSP["🏥 Hospital"]
        H1["-70% tempo em<br/>gestão de escala*"]
        H2["Cobertura visível<br/>24/7"]
        H3["Fechamento<br/>auditável"]
    end

    subgraph COOP["🤝 Cooperativa"]
        C1["Pool centralizado<br/>multi-unidade"]
        C2["Repasses<br/>transparentes"]
        C3["Branding<br/>próprio"]
    end

    subgraph MED["👨‍⚕️ Médico"]
        M1["Confirmação<br/>em 1 clique"]
        M2["Produção<br/>visível"]
        M3["Swaps<br/>formalizados"]
    end

    subgraph DIR["📊 Diretoria"]
        D1["KPIs reais<br/>dashboard"]
        D2["Auditoria<br/>completa"]
        D3["Go-live<br/>previsível"]
    end

    classDef persona fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F

    class H1,H2,H3,C1,C2,C3,M1,M2,M3,D1,D2,D3 persona
```

> \*Estimativa qualitativa baseada na eliminação de planilhas e confirmações manuais — validar com piloto institucional.

### Prova técnica — números do produto

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1'}}}%%
flowchart TB
    subgraph METRICAS["Evidências implementadas — V1"]
        M1["20 rotas<br/>operacionais"]
        M2["~173 server<br/>functions"]
        M3["~63 tabelas<br/>Postgres + RLS"]
        M4["5 papéis RBAC<br/>30+ capabilities"]
        M5["12 screenshots<br/>staging validado"]
        M6["Demo guiada<br/>7 passos"]
    end

    METRICAS --> PROVA["Prova social técnica<br/>staging.medicflow.app.br"]

    classDef metric fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef prova fill:#0369A1,color:#FFFFFF,stroke:#1E3A5F

    class M1,M2,M3,M4,M5,M6 metric
    class PROVA prova
```

### Bullets para o slide (texto complementar)

| Categoria | Ganho | Evidência no produto |
|-----------|-------|---------------------|
| **Operação** | Eliminação de planilhas paralelas | `/escalas` calendário 14 dias |
| **Operação** | 100% confirmações registradas | `shift_assignments` auditável |
| **Operação** | Detecção proativa de gaps | `/central` + Supabase Realtime |
| **Financeiro** | Fechamento sem alteração retroativa | Snapshot + trava de competência |
| **Financeiro** | Repasses vinculados à produção | `medical_production` → `medical_payouts` |
| **Financeiro** | KPIs consolidados para diretoria | `/dashboard-executivo` |
| **Implantação** | Go-live em ~3 dias | Piloto + smoke tests documentados |
| **Comercial** | Demo pronta para investidores | 7 passos + 12 screenshots |

---

## Slide 3 — Diferenciais Competitivos

**Título sugerido:** *Por que MedicFlow-AI — 10 diferenciais com evidência*  
**Notas do apresentador:** Posicionar como plataforma OPERACIONAL + TISS MVP — não competir com EHR/ERP.

### Mapa de posicionamento competitivo

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#64748B'}}}%%
quadrantChart
    title Posicionamento Competitivo
    x-axis Pouco integrado --> Totalmente integrado
    y-axis Foco clínico/EHR --> Foco operacional
    quadrant-1 Líder operacional
    quadrant-2 Operação pura
    quadrant-3 Ferramentas básicas
    quadrant-4 ERPs genéricos
    MedicFlow-AI: [0.85, 0.82]
    Planilhas + WhatsApp: [0.15, 0.45]
    ERP hospitalar: [0.55, 0.35]
    EHR/Prontuário: [0.40, 0.15]
    Sistema TISS isolado: [0.30, 0.60]
```

### 10 diferenciais — diagrama radial

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1'}}}%%
flowchart TB
    MF["MedicFlow-AI<br/>Diferenciais V1"]

    MF --> D1["① Multi-tenant nativo<br/>RLS + branding"]
    MF --> D2["② Operação + TISS<br/>mesmo tenant"]
    MF --> D3["③ Central RT<br/>alertas live"]
    MF --> D4["④ RBAC granular<br/>30+ capabilities"]
    MF --> D5["⑤ Implantação assistida<br/>demo 7 passos"]
    MF --> D6["⑥ IA operacional<br/>Copilot + agentes"]
    MF --> D7["⑦ Fechamento auditável<br/>snapshot + trava"]
    MF --> D8["⑧ White-label rápido<br/>sem rebuild"]
    MF --> D9["⑨ Deploy flexível<br/>CF Workers / Vercel"]
    MF --> D10["⑩ Transparência<br/>gaps documentados"]

    classDef core fill:#0369A1,color:#FFFFFF,stroke:#1E3A5F
    classDef diff fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef diff2 fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef diff3 fill:#EDE9FE,stroke:#7C3AED,color:#1E3A5F

    class MF core
    class D1,D2,D4,D7,D8 diff
    class D3,D5,D9,D10 diff2
    class D6 diff3
```

### Comparativo competitivo — tabela visual

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#0369A1'}}}%%
flowchart LR
    subgraph COMP["MedicFlow-AI vs Alternativas"]
        direction TB

        subgraph ROW1["Integração Operação + TISS"]
            R1A["Planilhas: ❌"]
            R1B["TISS isolado: ❌"]
            R1C["MedicFlow: ✅"]
        end

        subgraph ROW2["Tempo real"]
            R2A["Planilhas: ❌"]
            R2B["ERP genérico: ⚠️"]
            R2C["MedicFlow: ✅ RT"]
        end

        subgraph ROW3["Multi-tenant + White-label"]
            R3A["Sistemas legados: ❌"]
            R3B["MedicFlow: ✅"]
        end

        subgraph ROW4["Implantação assistida"]
            R4A["Concorrentes: ⚠️"]
            R4B["MedicFlow: ✅ 7 passos"]
        end

        subgraph ROW5["Transparência de maturidade"]
            R5A["Concorrentes: ❌"]
            R5B["MedicFlow: ✅ docs honestos"]
        end
    end

    classDef win fill:#D1FAE5,stroke:#059669,color:#064E3B
    classDef lose fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
    classDef partial fill:#FEF3C7,stroke:#D97706,color:#78350F

    class R1C,R2C,R3B,R4B,R5B win
    class R1A,R1B,R2A,R3A,R5A lose
    class R2B,R4A partial
```

### Posicionamento — o que somos e o que não somos

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#D1FAE5', 'lineColor': '#059669'}}}%%
flowchart TB
    subgraph SIM["✅ MedicFlow-AI É"]
        S1["Plataforma operacional<br/>de plantões"]
        S2["Faturamento TISS MVP<br/>integrado"]
        S3["Fechamento financeiro<br/>auditável"]
        S4["Central em tempo real<br/>+ IA opcional"]
        S5["Multi-tenant<br/>white-label"]
    end

    subgraph NAO["❌ MedicFlow-AI NÃO É"]
        N1["Prontuário eletrônico"]
        N2["Gestão de pacientes"]
        N3["ERP hospitalar completo"]
        N4["Envio automático<br/>a operadoras V1"]
    end

    SIM --> POS["Posicionamento:<br/>Camada operacional e financeira<br/>entre planilhas e ERPs"]
    NAO --> POS

    classDef sim fill:#D1FAE5,stroke:#059669,color:#064E3B
    classDef nao fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
    classDef pos fill:#0369A1,color:#FFFFFF,stroke:#1E3A5F

    class S1,S2,S3,S4,S5 sim
    class N1,N2,N3,N4 nao
    class POS pos
```

### Bullets para o slide (texto complementar)

| # | Diferencial | Evidência | Por que importa |
|---|-------------|-----------|-----------------|
| 1 | Multi-tenant nativo | RLS Postgres + `/instituicao` | Hospitais e cooperativas isolados |
| 2 | Operação + TISS integrados | Mesmo tenant, mesma auditoria | Operação alimenta faturamento |
| 3 | Central em tempo real | Supabase Realtime | Não é dashboard estático |
| 4 | RBAC granular | 5 papéis, 30+ capabilities | Segurança em rota, serviço e banco |
| 5 | Implantação assistida | Demo 7 passos + piloto | Reduz time-to-value |
| 6 | IA operacional | Copilot + agentes (opcional) | Diferencial de inovação |
| 7 | Fechamento auditável | Snapshot + trava | Compliance financeiro |
| 8 | White-label rápido | Logo, cores sem rebuild | Adesão dos usuários |
| 9 | Deploy flexível | Cloudflare Workers / Vercel | Escalabilidade cloud-native |
| 10 | Transparência | Gaps documentados | Confiança comercial |

---

## Slide bônus — Elevator Pitch Visual

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#0369A1', 'primaryTextColor': '#FFFFFF', 'lineColor': '#0D9488'}}}%%
flowchart LR
    PROB["Problema<br/>Planilhas + WhatsApp<br/>+ sistemas fragmentados"]
    SOL["Solução<br/>MedicFlow-AI<br/>Plataforma única"]
    BEN["Benefício<br/>Operação + TISS<br/>+ fechamento auditável"]
    DIF["Diferencial<br/>Multi-tenant RT<br/>+ implantação assistida"]
    CTA["Ação<br/>staging.medicflow.app.br<br/>Demo 7 passos"]

    PROB --> SOL --> BEN --> DIF --> CTA

    classDef prob fill:#FEE2E2,stroke:#DC2626,color:#7F1D1D
    classDef sol fill:#0369A1,color:#FFFFFF,stroke:#1E3A5F
    classDef ben fill:#D1FAE5,stroke:#059669,color:#064E3B
    classDef dif fill:#EDE9FE,stroke:#7C3AED,color:#1E3A5F
    classDef cta fill:#FEF3C7,stroke:#D97706,color:#78350F

    class PROB prob
    class SOL sol
    class BEN ben
    class DIF dif
    class CTA cta
```

**Elevator pitch (30 segundos):**

> MedicFlow-AI substitui planilhas e WhatsApp na gestão de plantões hospitalares, integrando operação, TISS e fechamento financeiro em uma plataforma segura, white-label e pronta para demo comercial. Não é prontuário eletrônico — é a camada operacional e financeira que faltava entre planilhas e ERPs.

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | Diagramas operacionais e jornadas |
| [MEDICFLOW_INFOGRAFICO.md](./MEDICFLOW_INFOGRAFICO.md) | Infográfico consolidado |
| [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md) | Proposta de valor detalhada |
| [MEDICFLOW_APRESENTACAO_EXECUTIVA.md](./MEDICFLOW_APRESENTACAO_EXECUTIVA.md) | Apresentação executiva completa |

---

*Slides em formato Mermaid — exportar via [mermaid.live](https://mermaid.live) ou CLI para inserção em PowerPoint/Google Slides.*

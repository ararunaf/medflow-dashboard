# MedicFlow-AI — Diagramas Executivos

**Documento:** material visual para apresentações comerciais e conversão em PowerPoint  
**Data:** 11/06/2026  
**Ambiente:** `https://staging.medicflow.app.br`  
**Base:** documentação operacional V1 ([MEDICFLOW_APRESENTACAO_EXECUTIVA.md](./MEDICFLOW_APRESENTACAO_EXECUTIVA.md))

---

## Guia de uso

### Conversão para PowerPoint

| Método | Passo |
|--------|-------|
| **Mermaid Live** | Copiar bloco → [mermaid.live](https://mermaid.live) → Export PNG/SVG |
| **CLI** | `npx @mermaid-js/mermaid-cli -i diagrama.mmd -o slide.png -b transparent` |
| **Plugin PPT** | Mermaid Chart, Think-Cell ou add-ins compatíveis com SVG |

### Recomendações para slides

- Exportar em **1920×1080** ou **1280×720** (16:9)
- Fundo transparente para sobreposição em template corporativo
- Um diagrama por slide — evitar overcrowding
- Manter legenda de cores abaixo do diagrama (paleta deste documento)

### Paleta corporativa MedicFlow-AI

| Token | Hex | Uso |
|-------|-----|-----|
| **Primary** | `#0369A1` | Bordas, setas, títulos |
| **Primary Light** | `#E0F2FE` | Módulos operacionais |
| **Teal** | `#0D9488` | Saúde, fluxos de plantão |
| **Teal Light** | `#CCFBF1` | Etapas de captação |
| **Navy** | `#1E3A5F` | Texto executivo, atores |
| **Success** | `#059669` | Resultados, pagamento, go-live |
| **Success Light** | `#D1FAE5` | Fechamento, KPIs positivos |
| **Accent** | `#D97706` | Alertas, implantação |
| **Accent Light** | `#FEF3C7` | Instituição, branding |
| **IA** | `#7C3AED` | Copilot, agentes |
| **IA Light** | `#EDE9FE` | IA operacional |
| **Audit** | `#DB2777` | Auditoria, compliance |

### Init padrão (copiar no topo de cada diagrama)

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'fontFamily': 'Segoe UI, Arial, sans-serif',
    'fontSize': '14px',
    'primaryColor': '#E0F2FE',
    'primaryTextColor': '#1E3A5F',
    'primaryBorderColor': '#0369A1',
    'secondaryColor': '#CCFBF1',
    'secondaryTextColor': '#1E3A5F',
    'secondaryBorderColor': '#0D9488',
    'tertiaryColor': '#FEF3C7',
    'tertiaryTextColor': '#1E3A5F',
    'tertiaryBorderColor': '#D97706',
    'lineColor': '#0369A1',
    'textColor': '#1E3A5F',
    'mainBkg': '#FFFFFF',
    'nodeBorder': '#0369A1',
    'clusterBkg': '#F8FAFC',
    'clusterBorder': '#0369A1',
    'titleColor': '#0369A1'
  }
}}%%
```

---

## 1. Diagrama Executivo — Visão da Plataforma

**Slide sugerido:** abertura / visão geral do produto  
**Público:** diretoria, investidores, sponsors de implantação

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'primaryTextColor': '#1E3A5F', 'primaryBorderColor': '#0369A1', 'lineColor': '#0369A1', 'secondaryColor': '#CCFBF1', 'tertiaryColor': '#FEF3C7', 'fontSize': '13px'}}}%%
flowchart TB
    subgraph ATOR["🏥 ATOR DE NEGÓCIO"]
        HOS["Hospital / Clínica / UPA"]
        COOP["Cooperativa Médica"]
    end

    subgraph MF["MedicFlow-AI V1 — Plataforma Operacional Multi-tenant"]
        direction TB

        subgraph PILAR1["OPERAÇÃO"]
            P1["Escalas 14d<br/>/escalas"]
            P2["Plantões + Swaps<br/>/plantoes"]
            P3["Central RT<br/>/central"]
        end

        subgraph PILAR2["FINANCEIRO + TISS"]
            P4["Faturamento TISS<br/>/tiss"]
            P5["Fechamento Auditável<br/>/fechamento-operacional"]
            P6["Repasses Médicos<br/>medical_payouts"]
        end

        subgraph PILAR3["EXECUTIVO"]
            P7["Dashboard KPIs<br/>/dashboard-executivo"]
            P8["Narrativa<br/>/executivo"]
        end

        subgraph PILAR4["IMPLANTAÇÃO"]
            P9["White-label<br/>/instituicao"]
            P10["Piloto + Go-live<br/>/piloto · /lancamento"]
        end

        subgraph PILAR5["IA OPCIONAL"]
            P11["Copilot · Agentes<br/>Orquestração"]
        end
    end

    subgraph INFRA["INFRAESTRUTURA"]
        SB[("Supabase<br/>Postgres + Auth + RT")]
        CF["Cloudflare Workers"]
    end

    HOS --> MF
    COOP --> MF
    PILAR1 --> PILAR2
    PILAR2 --> PILAR3
    PILAR1 --> PILAR5
    PILAR5 --> PILAR1
    MF --> SB
    MF --> CF

    classDef actor fill:#1E3A5F,color:#FFFFFF,stroke:#0369A1
    classDef oper fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef fin fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef exec fill:#D1FAE5,stroke:#059669,color:#1E3A5F
    classDef impl fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef ia fill:#EDE9FE,stroke:#7C3AED,color:#1E3A5F
    classDef infra fill:#F1F5F9,stroke:#64748B,color:#1E3A5F

    class HOS,COOP actor
    class P1,P2,P3 oper
    class P4,P5,P6 fin
    class P7,P8 exec
    class P9,P10 impl
    class P11 ia
    class SB,CF infra
```

**Mensagem executiva:** MedicFlow-AI unifica operação de plantões, TISS e fechamento financeiro em plataforma white-label — com central em tempo real e implantação assistida.

---

## 2. Fluxograma — Captação de Plantões

**Slide sugerido:** processo operacional core (10 etapas)  
**Documento base:** [MEDICFLOW_WORKFLOW_CAPTACAO_PLANTOES.md](./MEDICFLOW_WORKFLOW_CAPTACAO_PLANTOES.md)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#CCFBF1', 'primaryBorderColor': '#0D9488', 'lineColor': '#0369A1', 'fontSize': '12px'}}}%%
flowchart LR
    subgraph DEMANDA["①② DEMANDA E PUBLICAÇÃO"]
        A1["① Cadastro<br/>/escalas<br/>shifts: open"]
        A2["② Publicação<br/>Calendário 14d"]
        A1 --> A2
    end

    subgraph ENGAJ["③④ ENGAJAMENTO"]
        B1["③ Notificação<br/>/ + /central RT"]
        B2["④ Interesse<br/>/plantoes Abertos"]
        B1 --> B2
    end

    subgraph ALOC["⑤⑥ ALOCAÇÃO"]
        C1["⑤ Seleção<br/>Escalista ou self-service"]
        C2["⑥ Confirmação<br/>1 confirmed/shift"]
        C1 --> C2
    end

    subgraph EXEC["⑦⑧ EXECUÇÃO"]
        D1["⑦ Execução<br/>Plantão realizado"]
        D2["⑧ Validação<br/>medical_production"]
        D1 --> D2
    end

    subgraph FIN["⑨⑩ FINANCEIRO"]
        E1["⑨ Fechamento<br/>Snapshot + trava"]
        E2["⑩ Pagamento<br/>Repasses /tiss"]
        E1 --> E2
    end

    A2 --> B1
    B2 --> C1
    C2 --> D1
    D2 --> E1

    classDef etapa1 fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef etapa2 fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef etapa3 fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef etapa4 fill:#EDE9FE,stroke:#7C3AED,color:#1E3A5F
    classDef etapa5 fill:#D1FAE5,stroke:#059669,color:#1E3A5F

    class A1,A2 etapa1
    class B1,B2 etapa2
    class C1,C2 etapa3
    class D1,D2 etapa4
    class E1,E2 etapa5
```

### Fluxograma detalhado — decisões e exceções

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#CCFBF1', 'primaryBorderColor': '#0D9488', 'lineColor': '#0369A1'}}}%%
flowchart TD
    START(["Demanda de cobertura<br/>Hospital / Cooperativa"]) --> A

    subgraph E1["① Cadastro"]
        A["Admin: /instituicao"] --> B["Escalista: /escalas"]
        B --> C[("shifts open")]
    end

    C --> D["② Publicação<br/>Calendário 14d"]
    D --> E["③ Notificação RT<br/>/central"]
    E --> F{Disponível?}
    F -->|Não| G["/perfil indisponível"]
    F -->|Sim| H["④ /plantoes Abertos"]
    G --> E

    H --> I{Modo alocação}
    I -->|Self-service| J["Aceitar vaga"]
    I -->|Escalista| K["Atribuir coordinator"]
    I -->|Swap| L["shift_swap_requests"]
    L --> M{Aprovado?}
    M -->|Não| C
    M -->|Sim| N["⑥ Confirmed"]
    J --> N
    K --> N

    N --> O["⑦ Execução plantão"]
    O --> P["⑧ medical_production"]
    P --> Q["⑨ Fechamento competência"]
    Q --> R["⑩ Repasses médicos"]
    R --> END(["Ciclo completo"])

    classDef start fill:#1E3A5F,color:#FFF,stroke:#0369A1
    classDef process fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef decision fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef end fill:#D1FAE5,stroke:#059669,color:#1E3A5F

    class START,END start
    class A,B,C,D,E,G,H,J,K,L,N,O,P,Q,R process
    class F,I,M decision
```

### Swimlane — atores do fluxo

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1'}}}%%
flowchart TB
    subgraph HOSP["🏥 Hospital / Cooperativa"]
        H1["Define demanda de cobertura"]
        H2["Aprova fechamento competência"]
        H3["Processa pagamento"]
    end

    subgraph ESC["📋 Escalista"]
        E1["Cria escala e turnos"]
        E2["Monitora cobertura"]
        E3["Aprova swaps"]
    end

    subgraph MED["👨‍⚕️ Médico"]
        M1["Manifesta interesse"]
        M2["Confirma plantão"]
        M3["Executa turno"]
    end

    subgraph SYS["⚙️ MedicFlow-AI"]
        S1["/escalas · Realtime"]
        S2["/plantoes · assignments"]
        S3["/tiss · repasses"]
    end

    H1 --> E1 --> S1 --> M1 --> S2 --> M2 --> M3
    M3 --> S3 --> H2 --> H3
    E2 -.-> S1
    E3 -.-> S2

    classDef hosp fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef esc fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef med fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef sys fill:#EDE9FE,stroke:#7C3AED,color:#1E3A5F

    class H1,H2,H3 hosp
    class E1,E2,E3 esc
    class M1,M2,M3 med
    class S1,S2,S3 sys
```

---

## 3. Fluxograma — Hub Administrativo Médico

**Slide sugerido:** gestão institucional (10 módulos)  
**Documento base:** [MEDICFLOW_WORKFLOW_HUB_ADMINISTRATIVO.md](./MEDICFLOW_WORKFLOW_HUB_ADMINISTRATIVO.md)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#FEF3C7', 'primaryBorderColor': '#D97706', 'lineColor': '#0369A1', 'fontSize': '12px'}}}%%
flowchart TD
    START(["Nova instituição<br/>Hospital / Cooperativa"]) --> M1

    subgraph MOD1["① Instituição"]
        M1["/instituicao<br/>Branding + Parametrização"]
    end

    subgraph MOD2["② Profissionais"]
        M2["Auth + RBAC<br/>5 papéis · 30+ capabilities"]
    end

    subgraph MOD3["③ Escalas"]
        M3["/escalas · /plantoes<br/>/central"]
    end

    subgraph MOD4["④ Financeiro"]
        M4["/financeiro<br/>Hub navegação"]
    end

    subgraph MOD5["⑤ TISS"]
        M5["/tiss<br/>Convênios · Guias · Lotes"]
    end

    subgraph MOD6["⑥ Conciliação"]
        M6["/conciliacao-operacional<br/>Import CSV"]
    end

    subgraph MOD7["⑦ Fechamento"]
        M7["Competência<br/>Snapshot + Trava"]
    end

    subgraph MOD8["⑧ Dashboard"]
        M8["/dashboard-executivo<br/>/executivo"]
    end

    subgraph MOD9["⑨ Indicadores"]
        M9["KPIs Operacionais<br/>TISS · Financeiro"]
    end

    subgraph MOD10["⑩ Auditoria"]
        M10["/operacao<br/>Events + Logs"]
    end

    M1 --> M2 --> M3 --> M4
    M4 --> M5 --> M6 --> M7
    M7 --> M8 --> M9 --> M10
    M10 --> END(["Hub operacional"])

    classDef inst fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef prof fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef esc fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef fin fill:#D1FAE5,stroke:#059669,color:#1E3A5F
    classDef tiss fill:#EDE9FE,stroke:#7C3AED,color:#1E3A5F
    classDef audit fill:#FCE7F3,stroke:#DB2777,color:#1E3A5F

    class M1 inst
    class M2 prof
    class M3 esc
    class M4,M6,M7 fin
    class M5 tiss
    class M8,M9 fin
    class M10 audit
    class START,END inst
```

### Implantação do Hub — sequência comercial

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#FEF3C7', 'lineColor': '#0369A1'}}}%%
flowchart LR
    D0["Dia 0<br/>Branding<br/>/instituicao"] --> D1["Dia 1-2<br/>Convênios TISS<br/>Usuários RBAC"]
    D1 --> D2["Dia 3<br/>Competência<br/>Smoke tests"]
    D2 --> GL["Go-live<br/>/lancamento<br/>/operacao"]

    classDef d0 fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef d1 fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef d2 fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef gl fill:#D1FAE5,stroke:#059669,color:#1E3A5F

    class D0 d0
    class D1 d1
    class D2 d2
    class GL gl
```

---

## 4. Jornada do Médico

**Slide sugerido:** experiência do profissional de plantão  
**Papel técnico:** `professional`

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1'}}}%%
journey
    title Jornada do Médico — MedicFlow-AI
    section Entrada
      Receber credenciais do admin: 3: Médico
      Login multi-tenant /login: 5: Médico
      Dashboard do dia /: 4: Médico
    section Captação
      Ver plantões abertos /plantoes: 5: Médico
      Ativar disponibilidade /perfil: 4: Médico
      Receber alertas /central: 4: Médico
    section Escala
      Calendário 14 dias /escalas: 5: Médico
      Timeline de turnos atribuídos: 4: Médico
    section Plantão
      Aceitar plantão aberto: 5: Médico
      Confirmar assignment: 5: Médico
      Solicitar ou aprovar swap: 3: Médico
      Executar turno: 5: Médico
    section Pagamento
      Consultar produção /tiss: 4: Médico
      Ver repasses calculados: 4: Médico
```

### Fluxo linear com rotas

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1'}}}%%
flowchart LR
    J1["ENTRADA<br/>/login"] --> J2["CAPTAÇÃO<br/>/ + /central"]
    J2 --> J3["ESCALA<br/>/escalas"]
    J3 --> J4["PLANTÃO<br/>/plantoes"]
    J4 --> J5["PAGAMENTO<br/>/tiss leitura"]

    J1 -.->|credenciais| ADM["Administrador"]
    J4 -.->|swaps| ESC["Escalista"]

    classDef med fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F,font-weight:bold
    classDef ext fill:#F1F5F9,stroke:#64748B,color:#1E3A5F

    class J1,J2,J3,J4,J5 med
    class ADM,ESC ext
```

---

## 5. Jornada do Hospital

**Slide sugerido:** valor para instituição hospitalar (tenant)  
**Entidade:** hospital, clínica ou UPA como tenant multi-tenant

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#FEF3C7', 'lineColor': '#0369A1'}}}%%
journey
    title Jornada do Hospital — MedicFlow-AI
    section Implantação
      Piloto assistido /piloto: 5: Admin
      Demo guiada 7 passos: 5: Admin
      Go-live /lancamento: 4: Admin
    section Configuração
      Branding white-label /instituicao: 5: Admin
      Unidades e departamentos: 4: Admin
      Provisionar equipe RBAC: 3: Admin
    section Operação
      Publicar escalas /escalas: 5: Escalista
      Monitorar cobertura /central: 5: Escalista
      Resolver conflitos e swaps: 4: Escalista
    section Financeiro
      Cadastrar convênios TISS: 4: Financeiro
      Fechar competência mensal: 5: Financeiro
      Conciliação CSV: 3: Financeiro
    section Governança
      Dashboard executivo KPIs: 5: Diretoria
      Auditoria /operacao: 4: Admin
      Health checks e diagnóstico: 4: Admin
```

### Fluxo institucional do hospital

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#FEF3C7', 'lineColor': '#0369A1'}}}%%
flowchart TD
    H1["ENTRADA<br/>Contratação + Piloto"] --> H2["INSTITUIÇÃO<br/>Tenant + Branding"]
    H2 --> H3["EQUIPE<br/>Escalistas · Financeiro · Médicos"]
    H3 --> H4["OPERAÇÃO<br/>Escalas · Central RT"]
    H4 --> H5["FINANCEIRO<br/>TISS · Fechamento"]
    H5 --> H6["INDICADORES<br/>Dashboard Executivo"]

    H4 --> COB["Cobertura 24h<br/>visível em tempo real"]
    H5 --> AUD["Fechamento auditável<br/>snapshot + trava"]
    H6 --> ROI["KPIs reais<br/>por competência"]

    classDef hosp fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef result fill:#D1FAE5,stroke:#059669,color:#1E3A5F

    class H1,H2,H3,H4,H5,H6 hosp
    class COB,AUD,ROI result
```

---

## 6. Jornada da Cooperativa

**Slide sugerido:** valor para cooperativa médica (tenant dedicado)  
**Nota:** cooperativa opera como tenant — não é papel RBAC separado

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#CCFBF1', 'lineColor': '#0D9488'}}}%%
journey
    title Jornada da Cooperativa — MedicFlow-AI
    section Onboarding
      Tenant dedicado cooperativa-med: 5: Admin Cooperativa
      Branding próprio /instituicao: 5: Admin Cooperativa
      Pool de profissionais: 4: Admin Cooperativa
    section Gestão de Pool
      Escalas multi-unidade /escalas: 5: Escalista
      Publicar turnos para hospitais: 5: Escalista
      Central monitora todo o pool: 5: Escalista
    section Captação
      Médicos aceitam plantões /plantoes: 5: Médico
      Swaps formalizados: 4: Escalista
      Disponibilidade visível /perfil: 4: Médico
    section Financeiro
      Produção por competência: 5: Financeiro
      Repasses transparentes /tiss: 5: Financeiro
      Fechamento auditável: 4: Financeiro
    section Transparência
      Médico consulta repasses: 4: Médico
      Diretoria vê KPIs consolidados: 5: Diretoria
```

### Fluxo cooperativa — pool centralizado

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#CCFBF1', 'lineColor': '#0D9488'}}}%%
flowchart TB
    COOP["Cooperativa<br/>Tenant dedicado"] --> POOL["Pool de Profissionais<br/>múltiplos professionals"]

    POOL --> ESC["Escalista publica<br/>turnos multi-unidade"]
    ESC --> UNI["Unidades A · B · C<br/>departments + units"]

    UNI --> CAP["Captação<br/>/plantoes"]
    CAP --> MED["Médicos do pool<br/>confirmam plantões"]

    MED --> PROD["Produção<br/>medical_production"]
    PROD --> REP["Repasses<br/>medical_payouts"]
    REP --> TRANS["Transparência<br/>médico + diretoria"]

    COOP --> BRAND["Branding próprio<br/>/instituicao"]
    ESC --> CENT["Central RT<br/>cobertura do pool inteiro"]

    classDef coop fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef flow fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef outcome fill:#D1FAE5,stroke:#059669,color:#1E3A5F

    class COOP,POOL,BRAND coop
    class ESC,UNI,CAP,MED,CENT flow
    class PROD,REP,TRANS outcome
```

---

## 7. Arquitetura da Plataforma

**Slide sugerido:** arquitetura técnica e módulos  
**Documento base:** [MEDICFLOW_WORKFLOW_OPERACIONAL.md](./MEDICFLOW_WORKFLOW_OPERACIONAL.md)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1', 'fontSize': '11px'}}}%%
flowchart TB
    subgraph CLIENT["CAMADA DE ACESSO"]
        WEB["PWA Responsivo<br/>React 19 + TanStack Start"]
        ROLES["RBAC 5 papéis<br/>30+ capabilities"]
    end

    subgraph APP["MedicFlow-AI — 20 ROTAS"]
        direction TB

        subgraph MOD_CAP["Captação"]
            R1["/escalas"]
            R2["/plantoes"]
            R3["/perfil"]
        end

        subgraph MOD_OPS["Operação"]
            R4["/"]
            R5["/central"]
            R6["/operacao"]
        end

        subgraph MOD_FIN["Financeiro"]
            R7["/financeiro"]
            R8["/fechamento-operacional"]
            R9["/conciliacao-operacional"]
        end

        subgraph MOD_TISS["TISS"]
            R10["/tiss<br/>14 tabelas"]
        end

        subgraph MOD_EXEC["Executivo"]
            R11["/executivo"]
            R12["/dashboard-executivo"]
        end

        subgraph MOD_IMP["Implantação"]
            R13["/instituicao"]
            R14["/piloto"]
            R15["/lancamento"]
        end

        subgraph MOD_IA["IA Opcional"]
            R16["Copilot · Agentes<br/>Orquestração"]
        end
    end

    subgraph API["CAMADA DE SERVIÇOS"]
        SF["~173 Server Functions"]
        HOOKS["28 Hooks de negócio"]
        SVC["~100 Serviços"]
    end

    subgraph DATA["INFRAESTRUTURA"]
        PG[("Postgres ~63 tabelas<br/>RLS multi-tenant")]
        AUTH["Supabase Auth"]
        RT["Supabase Realtime"]
        CF["Cloudflare Workers"]
    end

    CLIENT --> APP
    APP --> API
    API --> DATA

    MOD_CAP --> MOD_OPS
    MOD_OPS --> MOD_EXEC
    MOD_TISS --> MOD_FIN
    MOD_FIN --> MOD_EXEC
    MOD_OPS --> MOD_IA

    classDef client fill:#1E3A5F,color:#FFF,stroke:#0369A1
    classDef cap fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef ops fill:#E0F2FE,stroke:#0369A1,color:#1E3A5F
    classDef fin fill:#D1FAE5,stroke:#059669,color:#1E3A5F
    classDef tiss fill:#EDE9FE,stroke:#7C3AED,color:#1E3A5F
    classDef api fill:#FEF3C7,stroke:#D97706,color:#1E3A5F
    classDef data fill:#F1F5F9,stroke:#64748B,color:#1E3A5F

    class WEB,ROLES client
    class R1,R2,R3 cap
    class R4,R5,R6 ops
    class R7,R8,R9 fin
    class R10 tiss
    class R11,R12 fin
    class R13,R14,R15 api
    class R16 tiss
    class SF,HOOKS,SVC api
    class PG,AUTH,RT,CF data
```

### Relacionamento entre módulos

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'lineColor': '#0369A1'}}}%%
flowchart LR
    ESC["Escalas<br/>/escalas"] -->|publica turnos| PLT["Plantões<br/>/plantoes"]
    PLT -->|confirmações| CTR["Central RT<br/>/central"]
    CTR -->|alertas| ESC
    CTR -->|alertas| PLT
    PLT -->|produção| PROD["Produção TISS"]
    PROD --> REP["Repasses"]
    TISS["Guias/Lotes<br/>/tiss"] --> GLO["Glosas"]
    FEC["Fechamento"] --> DEX["Dashboard<br/>KPIs"]
    CON["Conciliação"] --> FEC
    GLO --> DEX
    CTR --> IA["IA Operacional"]
    IA --> CTR

    classDef oper fill:#CCFBF1,stroke:#0D9488,color:#1E3A5F
    classDef fin fill:#D1FAE5,stroke:#059669,color:#1E3A5F
    classDef ia fill:#EDE9FE,stroke:#7C3AED,color:#1E3A5F

    class ESC,PLT,CTR oper
    class PROD,REP,TISS,GLO,FEC,CON,DEX fin
    class IA ia
```

### Stack tecnológica — camadas

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#E0F2FE', 'lineColor': '#0369A1'}}}%%
block-beta
    columns 1
    block:UI["FRONTEND"]:1
        UI1["React 19"]
        UI2["TanStack Start / Router / Query"]
    end
    block:BE["BACKEND"]:1
        BE1["TanStack Server Functions (~173)"]
        BE2["Serviços de domínio (~100)"]
    end
    block:DB["DADOS"]:1
        DB1["Supabase Postgres + RLS"]
        DB2["Auth · Realtime · Storage"]
    end
    block:DEPLOY["DEPLOY"]:1
        D1["Cloudflare Workers (primário)"]
        D2["Vercel (alternativo)"]
    end

    style UI fill:#E0F2FE,stroke:#0369A1
    style BE fill:#CCFBF1,stroke:#0D9488
    style DB fill:#D1FAE5,stroke:#059669
    style DEPLOY fill:#FEF3C7,stroke:#D97706
```

---

## Índice de diagramas

| # | Diagrama | Tipo Mermaid | Slide sugerido |
|---|----------|--------------|----------------|
| 1 | Visão da Plataforma | flowchart | Abertura |
| 2 | Captação de Plantões (3 variações) | flowchart | Operação |
| 3 | Hub Administrativo (2 variações) | flowchart | Gestão |
| 4 | Jornada do Médico (2 variações) | journey + flowchart | Persona médico |
| 5 | Jornada do Hospital (2 variações) | journey + flowchart | Persona hospital |
| 6 | Jornada da Cooperativa (2 variações) | journey + flowchart | Persona cooperativa |
| 7 | Arquitetura (3 variações) | flowchart + block-beta | Técnico / CTO |

---

## Referências

| Documento | Conteúdo |
|-----------|----------|
| [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | Slides Antes/Depois, ROI, Diferenciais |
| [MEDICFLOW_INFOGRAFICO.md](./MEDICFLOW_INFOGRAFICO.md) | Infográfico consolidado |
| [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md) | Proposta comercial completa |

---

*Diagramas compatíveis com Mermaid 10+. Testar renderização em [mermaid.live](https://mermaid.live) antes da exportação para PowerPoint.*

# MedicFlow-AI — Apresentação Executiva V2

**Edição:** Investor / Commercial Edition  
**Documento:** deck executivo para diretoria, investidores, hospitais, cooperativas e grupos de plantonistas  
**Data:** 11/06/2026  
**Versão:** V2 Executiva  
**Ambiente demo:** `https://staging.medicflow.app.br`  
**Base:** MEDICFLOW_PRESENTACAO_COMERCIAL_V1 · MEDICFLOW_CASOS_DE_USO_EXECUTIVOS · MEDICFLOW_DEMO_COMERCIAL · MEDICFLOW_PROPOSTA_DE_VALOR

---

## Guia de conversão para PowerPoint

| Campo do slide | Onde colocar no PPT |
|----------------|---------------------|
| **Título** | Slide title (H1) |
| **Mensagem principal** | Subtítulo ou callout central |
| **Texto executivo / bullets** | Corpo do slide (máx. 5–7 bullets) |
| **Gráfico recomendado** | Área visual principal (50–60% do slide) |
| **Screenshot recomendado** | Imagem lateral ou full-bleed |
| **Fala do apresentador** | Notas do apresentador (Speaker Notes) |
| **Tempo sugerido** | Notas do apresentador |

| Item | Recomendação |
|------|--------------|
| **Formato** | 16:9 · 1920×1080 |
| **Tempo total** | 30–40 min + Q&A |
| **Screenshots** | `docs/screenshots/` (16 telas validadas em staging — inclui 4 da Sprint IA-Visível) |

### Sprint IA-Visível — mapeamento de screenshots (11/06/2026)

| Arquivo | Slide(s) | Uso obrigatório |
|---------|----------|-----------------|
| `screenshots/12-menu-central-ia.png` | **Slide 12** (1ª opção lateral) · **Slide 4** (callout discoverability) | Menu lateral com item **Central de IA** — evidência de IA visível para managers |
| `screenshots/13-dashboard-ia-card.png` | **Slide 1** (hero alternativo) · **Slide 4** (1ª opção) | Card **IA Operacional** na Home — primeira impressão em demo |
| `screenshots/14-central-ia-operacional.png` | **Slide 12** (2ª opção) · **Slide 7** (substitui `11-central-operacional.png`) | Central de IA Operacional — painéis principais e branding |
| `screenshots/15-copilot-topo.png` | **Slide 12** (3ª opção) · **Slide 11** (callout IA) | Copiloto operacional (IA) no topo — wow factor em reunião |
| **Diagramas** | Exportar Mermaid via [mermaid.live](https://mermaid.live) ou [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) |
| **Paleta** | Azul `#0369A1` · Verde `#059669` · Vermelho `#DC2626` · Fundo `#F8FAFC` |

### Posicionamento obrigatório (todas as apresentações)

> MedicFlow-AI **não é prontuário eletrônico**. É a camada operacional e financeira que conecta escalas, plantões, TISS e fechamento — entre planilhas e ERPs.

---

## Slide 1 — Capa

### Título do slide
**MedicFlow-AI — A plataforma operacional que conecta plantões, TISS e fechamento financeiro**

### Objetivo
Estabelecer credibilidade imediata, posicionar o produto para audiência investor/commercial e definir o tom da conversa.

### Mensagem principal
**Digitalizar plantões hospitalares e integrar TISS em uma plataforma multi-tenant white-label — com central em tempo real, fechamento auditável e implantação assistida.**

### Texto executivo (corpo do slide)

| Elemento | Conteúdo |
|----------|----------|
| **Produto** | Plataforma operacional hospitalar multi-tenant white-label |
| **Versão** | V1 Operacional — staging live |
| **Público** | Hospitais 24h · UPAs · Clínicas TISS · Cooperativas · Grupos de plantonistas |
| **Demo** | `staging.medicflow.app.br` |
| **Tagline** | *Não é prontuário. É a camada operacional e financeira que faltava.* |

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Composição hero | Logo MedicFlow-AI centralizado + mockup laptop com dashboard |
| **2ª opção** | Diagrama §1 de [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | Visão da plataforma com 3 pilares: Operação · Financeiro · Implantação |
| **3ª opção** | Fundo institucional | Azul `#0369A1` + tagline + URL staging + QR code |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/13-dashboard-ia-card.png` | Hero com card **IA Operacional** visível (Sprint IA-Visível) |
| **2ª opção** | `screenshots/02-dashboard.png` | Dashboard operacional clássico |
| **3ª opção** | `screenshots/01-login.png` | White-label no login (multi-tenant) |

### Fala do apresentador

> *"Bom dia / boa tarde. Antes de começar, uma pergunta rápida: quantas planilhas diferentes sua instituição usa hoje para escala, confirmação e faturamento?"*
>
> *"O MedicFlow-AI nasceu para resolver exatamente isso. Somos uma plataforma operacional — não prontuário eletrônico — que digitaliza plantões, integra TISS e entrega fechamento financeiro auditável. Estamos em staging com demo guiada de 7 passos pronta para execução ao vivo."*
>
> *"Nos próximos 30 minutos vou mostrar o problema do mercado, como resolvemos, workflows reais, casos de uso por segmento e o modelo comercial. Podem interromper a qualquer momento."*

**Tempo sugerido:** 1–2 minutos

---

## Slide 2 — Problema do mercado

### Título do slide
**O mercado opera plantões no escuro — e paga caro por isso**

### Objetivo
Validar a dor do cliente e criar identificação emocional com o cenário atual antes de apresentar a solução.

### Mensagem principal
**Hospitais, UPAs e cooperativas ainda dependem de processos manuais e fragmentados para garantir cobertura 24/7 com faturamento correto — sem integração, sem auditoria, sem tempo real.**

### Texto executivo (corpo do slide)

**Operação de plantões**

| Dor | Impacto |
|-----|---------|
| Escalas em Excel/Google Sheets | Erros de versão, sem histórico auditável |
| Confirmações via WhatsApp e ligações | Perda de confirmações, sem rastreio |
| Falta de visibilidade de cobertura | Plantões descobertos em cima da hora |
| Trocas informais entre médicos | Double-booking, conflitos de horário |

**Faturamento e financeiro**

| Dor | Impacto |
|-----|---------|
| Guias TISS em sistemas distintos | Retrabalho, perda de receita |
| Fechamento mensal sem snapshot | Alterações retroativas sem auditoria |
| Repasses desconectados da produção | Disputas, falta de transparência |
| Glosas sem rastreio estruturado | Receita recuperável perdida |

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Antes x Depois §1 de [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | Fluxo lado a lado: planilhas/WhatsApp vs. MedicFlow |
| **2ª opção** | Mindmap de transformação | §1 MEDICFLOW_SLIDES_COMERCIAIS — impacto operacional/financeiro |
| **3ª opção** | Ícones visuais | Planilha + WhatsApp + telefone + pasta TISS (vermelho `#FEE2E2`) |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | Nenhum (slide conceitual) | Foco em diagrama Antes x Depois |
| **2ª opção** | Composição ilustrativa | Ícones de ferramentas fragmentadas (sem screenshot do produto) |
| **3ª opção** | Contraste pós-slide 4 | Reservar screenshots para slide de solução |

### Fala do apresentador

> *"Isso não é falha das equipes — é falta de plataforma integrada. Quantas vezes o plantão do fim de semana foi confirmado no WhatsApp e ninguém registrou?"*
>
> *"Se houver diretor financeiro na sala: TISS desconectado da operação e fechamento sem auditoria são as duas dores que mais geram retrabalho e receita perdida."*
>
> *"Cooperativas e grupos de plantonistas vivem a mesma fragmentação — só que multiplicada por instituição."*

**Tempo sugerido:** 2–3 minutos

---

## Slide 3 — O custo da operação atual

### Título do slide
**O custo invisível: retrabalho, risco e receita perdida**

### Objetivo
Quantificar qualitativamente o impacto financeiro e operacional do status quo — preparar o terreno para ROI e proposta de valor.

### Mensagem principal
**Operar plantões com planilhas e WhatsApp gera custos ocultos em quatro dimensões: tempo humano, risco de cobertura, receita não faturada e governança frágil.**

### Texto executivo (corpo do slide)

| Dimensão | Custo oculto | Manifestação típica |
|----------|--------------|---------------------|
| **Tempo operacional** | Horas do escalista em ligações e consolidação | 15–30 min/plantão em confirmação manual |
| **Risco de cobertura** | Plantão descoberto, incidente, SLA | Gap detectado horas antes ou no turno |
| **Receita financeira** | Glosas não contestadas, TISS inconsistente | Retrabalho + receita recuperável perdida |
| **Governança** | Disputas de repasse, fechamento retroativo | Assembleias, auditorias, conflitos internos |
| **Implantação** | Demos ad hoc, go-live sem validação | Perda de oportunidade comercial, churn |

**Cadeia de custo (As-Is):**

```
Planilha → WhatsApp → Ligação reativa → TISS separado → Fechamento manual → Disputa
     └── Retrabalho em cada elo ──┘
```

> Estimativas qualitativas — validar com KPIs baseline em piloto de 30 dias. Não prometer percentuais não auditados.

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama ROI §2 de [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | 4 dimensões: Operacional · Financeiro · Risco · Implantação |
| **2ª opção** | Funil de custo oculto | 4 colunas empilhadas: Tempo → Risco → Receita → Governança |
| **3ª opção** | Iceberg diagram | Visível: planilha/WhatsApp · Invisível: glosas, gaps, disputas, auditoria |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | Nenhum (slide analítico) | Gráfico de custo oculto como elemento central |
| **2ª opção** | `screenshots/11-central-operacional.png` | Contraste: "sem central = detecção tardia" (inserir como "depois") |
| **3ª opção** | Matriz comparativa | Tabela Antes/Depois de [MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md](./MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md) §6.1 |

### Fala do apresentador

> *"Vamos falar de dinheiro e risco — não de tecnologia. Cada plantão confirmado por WhatsApp custa tempo do escalista e não deixa trilha. Cada gap de cobertura descoberto tarde custa incidente operacional. Cada glosa não rastreada custa receita."*
>
> *"Para investidores: o mercado brasileiro de saúde suplementar movimenta bilhões em TISS — mas a operação de plantões que gera essa produção ainda roda em planilha. Esse gap é nossa oportunidade."*
>
> *"Não vou inventar percentuais aqui. Proponho medir o custo real de vocês em um piloto de 30 dias com KPIs baseline."*

**Tempo sugerido:** 2–3 minutos

---

## Slide 4 — Como o MedicFlow-AI resolve

### Título do slide
**Uma plataforma. Operação, TISS e fechamento no mesmo tenant.**

### Objetivo
Apresentar a solução com clareza, evidências do produto implementado e posicionamento honesto.

### Mensagem principal
**MedicFlow-AI V1 substitui planilhas, WhatsApp e sistemas fragmentados por plataforma multi-tenant white-label que unifica operação, faturamento TISS e fechamento auditável.**

### Texto executivo (corpo do slide)

```
┌─────────────────────────────────────────────────────────────────┐
│                     MedicFlow-AI V1                              │
│   OPERAÇÃO          FINANCEIRO         IMPLANTAÇÃO               │
│   Escalas 14d       TISS MVP           Piloto assistido          │
│   Plantões          Fechamento         Demo 7 passos             │
│   Central RT        Conciliação        Go-live ~3 dias            │
│   Swaps             Repasses           White-label               │
│   IA operacional    Dashboard exec.    Smoke tests               │
└─────────────────────────────────────────────────────────────────┘
```

| Capacidade | Rota | Status |
|------------|------|--------|
| Escalas e plantões | `/escalas`, `/plantoes` | ✅ Implementado |
| Central operacional RT | `/central` | ✅ Implementado |
| Ciclo TISS integrado | `/tiss` | ✅ MVP |
| Fechamento auditável | `/financeiro/fechamento-operacional` | ✅ Implementado |
| Multi-tenant + branding | `/instituicao` | ✅ Implementado |
| RBAC granular (5 papéis) | 30+ capabilities, RLS | ✅ Implementado |

**Não é:** EHR · ERP completo · Envio automático TISS a operadoras (V1)

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama §1 [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | 3 pilares conectados |
| **2ª opção** | Arquitetura de módulos | Operação → TISS → Fechamento → Dashboard |
| **3ª opção** | Quadrante posicionamento §3 [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | MedicFlow vs. planilhas vs. ERP vs. EHR |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/13-dashboard-ia-card.png` | Home com card **IA Operacional** + CTA **Abrir Central de IA** |
| **2ª opção** | `screenshots/12-menu-central-ia.png` | Menu lateral — item **Central de IA** para managers |
| **3ª opção** | Composição 3 telas | `13-dashboard-ia-card.png` + `14-central-ia-operacional.png` + `09-tiss.png` |

### Fala do apresentador

> *"E se tudo isso vivesse em um único lugar, com auditoria e tempo real?"*
>
> *"O MedicFlow-AI V1 já entrega: 20 rotas operacionais, ~173 server functions, ~63 tabelas Postgres com RLS, demo guiada de 7 passos e staging live. Posso mostrar ao vivo agora — começando pelo dashboard."*
>
> *"Transparência: não somos prontuário, não enviamos TISS automaticamente para operadoras na V1. Somos a camada operacional e financeira — e isso já gera valor imediato."*

**Tempo sugerido:** 3 minutos

---

## Slide 5 — Workflow Captação de Plantões

### Título do slide
**Do plantão aberto ao repasse: 10 etapas rastreáveis**

### Objetivo
Demonstrar o fluxo operacional completo de captação — da demanda hospitalar ao pagamento do médico.

### Mensagem principal
**10 etapas integradas conectam hospital, escalista, médico e financeiro — com regra anti double-booking, swaps formalizados e auditoria completa.**

### Texto executivo (corpo do slide)

```
 DEMANDA ──► PUBLICAÇÃO ──► NOTIFICAÇÃO ──► INTERESSE ──► SELEÇÃO
                                                              │
 PAGAMENTO ◄── FECHAMENTO ◄── VALIDAÇÃO ◄── EXECUÇÃO ◄── CONFIRMAÇÃO
```

| # | Etapa | Ator | Rota |
|---|-------|------|------|
| ① | Cadastro oportunidade | Escalista | `/escalas` — shifts `open` |
| ② | Publicação escala | Escalista | Calendário 14 dias |
| ③ | Notificação | Sistema | `/`, `/central` — alertas RT |
| ④ | Manifestação interesse | Médico | `/plantoes` → Abertos |
| ⑤ | Seleção | Escalista / self-service | assignments |
| ⑥ | Confirmação | Médico | status `confirmed` |
| ⑦ | Execução | Médico | `/central` monitora |
| ⑧ | Validação | Sistema | `medical_production` |
| ⑨ | Fechamento | Administrador | snapshot + trava |
| ⑩ | Pagamento | Financeiro | `/tiss` → Repasses |

**Regras críticas:** 1 confirmado por turno · swaps com aprovação · isolamento multi-tenant RLS

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama §2 [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | Fluxo 10 etapas com atores |
| **2ª opção** | Sequência Hospital → Escalista → Médico → Sistema | §4 [MEDICFLOW_WORKFLOW_CAPTACAO_PLANTOES.md](./MEDICFLOW_WORKFLOW_CAPTACAO_PLANTOES.md) |
| **3ª opção** | Mermaid captação | §3 MEDICFLOW_WORKFLOW_CAPTACAO_PLANTOES |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | Composição sequencial | `03-agenda-escalas.png` → `04-plantoes.png` → `11-central-operacional.png` |
| **2ª opção** | `screenshots/04-plantoes.png` | Captação — aba Abertos + confirmação |
| **3ª opção** | `screenshots/03-agenda-escalas.png` | Calendário 14 dias |

### Fala do apresentador

> *"Conto uma história: sexta, 18h — plantão de UTI sem confirmação. No MedicFlow, a central alertou às 14h. Médico disponível aceitou em dois minutos pelo celular."*
>
> *"A regra de um confirmado por turno elimina o double-booking que planilhas permitem. Swaps são formalizados — acabou o 'ele disse no WhatsApp'."*
>
> *"Gap honesto: push e e-mail não estão na V1 — notificação in-app + Realtime. Demo sugerida: `/escalas` → `/plantoes` → `/central`."*

**Tempo sugerido:** 3 minutos

---

## Slide 6 — Workflow Administrativo

### Título do slide
**Hub Administrativo Médico: gestão institucional em 10 módulos**

### Objetivo
Mostrar como administradores e equipe financeira configuram, operam e auditam a instituição na plataforma.

### Mensagem principal
**Hub administrativo concentra instituição, profissionais, escalas, financeiro, TISS, conciliação, fechamento, dashboard, indicadores e auditoria — com go-live em ~3 dias.**

### Texto executivo (corpo do slide)

```
 INSTITUIÇÃO ──► PROFISSIONAIS ──► ESCALAS ──► FINANCEIRO ──► TISS
                                                                  │
 AUDITORIA ◄── INDICADORES ◄── DASHBOARD ◄── FECHAMENTO ◄── CONCILIAÇÃO
```

| # | Módulo | Rota | Responsável |
|---|--------|------|-------------|
| ① | Instituição | `/instituicao` | tenant_admin |
| ② | Profissionais | Auth + RBAC | tenant_admin |
| ③ | Escalas | `/escalas`, `/plantoes` | coordinator |
| ④ | Financeiro | `/financeiro` | financial |
| ⑤ | TISS | `/tiss` | financial / coordinator |
| ⑥ | Conciliação | `/conciliacao-operacional` | financial |
| ⑦ | Fechamento | `/fechamento-operacional` | financial |
| ⑧ | Dashboard Executivo | `/executivo`, `/dashboard-executivo` | diretoria |
| ⑨ | Indicadores | `/central`, `/tiss` | filtrado por papel |
| ⑩ | Auditoria | `/operacao` | tenant_admin |

**Implantação:** `/piloto` (demo 7 passos) → `/lancamento` (smoke tests) → go-live **~3 dias**

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama §3 [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | Hub 10 módulos conectados |
| **2ª opção** | Gantt implantação | §6 [MEDICFLOW_WORKFLOW_HUB_ADMINISTRATIVO.md](./MEDICFLOW_WORKFLOW_HUB_ADMINISTRATIVO.md) |
| **3ª opção** | Matriz RBAC | Permissões por papel (tenant_admin, coordinator, financial, professional) |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/07-configuracoes-instituicao.png` | Branding e parametrização |
| **2ª opção** | `screenshots/08-administracao-piloto.png` | Piloto e demo guiada |
| **3ª opção** | `screenshots/05-financeiro.png` | Hub financeiro |

### Fala do apresentador

> *"Para o administrador: em um dia vocês configuram branding; em três, go-live com smoke tests. Não é projeto ERP de seis meses."*
>
> *"Gap transparente: UI de cadastro de profissionais não implementada — provisionamento via Auth. Matriz de permissões garante que cada papel vê só o necessário."*
>
> *"Demo sugerida: `/instituicao` → `/piloto` → `/financeiro/fechamento-operacional`."*

**Tempo sugerido:** 2–3 minutos

---

## Slide 7 — Caso de Uso: Hospital

### Título do slide
**Hospital de médio porte — da escala fragmentada ao fechamento auditável**

### Objetivo
Humanizar a proposta com persona concreta e mostrar transformação As-Is → To-Be para diretoria hospitalar.

### Mensagem principal
**Hospital 150–350 leitos elimina planilhas paralelas, detecta gaps proativamente e fecha competência com snapshot auditável — operação alimenta TISS no mesmo tenant.**

### Texto executivo (corpo do slide)

**Perfil:** 150–350 leitos · 3–6 unidades com plantão · escalista dedicado · TISS ativo · diretoria cobra KPIs mensais

**Antes (As-Is):**
- Planilha Excel + WhatsApp + TISS separado + fechamento por e-mail
- Gap de cobertura descoberto tarde · glosas sem rastreio · KPIs com defasagem

**Depois (To-Be):**

| Benefício | Entrega MedicFlow-AI |
|-----------|---------------------|
| Escala unificada | Calendário 14 dias — zero planilhas paralelas |
| Cobertura proativa | Central RT — alertas antes do turno |
| TISS integrado | Mesmo tenant, mesma competência |
| Fechamento confiável | Snapshot + trava + reabertura controlada |
| Visão executiva | Dashboard KPIs reais por competência |

**Storytelling:** *"Mariana, escalista — sexta 18h, UTI sem confirmação. Com MedicFlow, central alertou às 14h. Plantão coberto em 2 minutos."*

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Fluxo As-Is vs. To-Be | §2.3 e §2.4 [MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md](./MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md) |
| **2ª opção** | Journey map hospital | Entrada → Instituição → Financeiro → Indicadores |
| **3ª opção** | Indicadores impactados | Tabela §2.7 MEDICFLOW_CASOS_DE_USO_EXECUTIVOS |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/06-relatorios-dashboard-executivo.png` | KPIs para diretoria |
| **2ª opção** | `screenshots/14-central-ia-operacional.png` | Central de IA Operacional — cobertura proativa |
| **3ª opção** | Composição | `03-agenda-escalas.png` + `09-tiss.png` |

### Fala do apresentador

> *"Quantas vezes vocês descobriram plantão descoberto na véspera — e quantas planilhas consultaram até achar a versão certa?"*
>
> *"Para hospital de médio porte, recomendamos pacote Operacional + TISS + Fechamento. Go-live em ~3 dias. Piloto de 30 dias com KPIs baseline para medir ROI real."*
>
> *"Não é sobre tecnologia — é sobre dormir tranquilo sabendo que a cobertura está garantida e que há registro se algo der errado."*

**Tempo sugerido:** 2–3 minutos

---

## Slide 8 — Caso de Uso: Cooperativa

### Título do slide
**Cooperativa médica — pool centralizado, repasses transparentes**

### Objetivo
Demonstrar valor para cooperativas com tenant dedicado, pool de associados e prestação de contas auditável.

### Mensagem principal
**Cooperativa opera como tenant dedicado com branding próprio — pool de profissionais, captação digital e repasses vinculados à produção por competência.**

### Texto executivo (corpo do slide)

**Perfil:** 80–400 médicos associados · 5–15 instituições contratadas · repasses mensais · assembleias com prestação de contas

**Antes (As-Is):**
- Planilha por instituição · alocação por telefone/WhatsApp · repasse em Excel · glosas dispersas

**Depois (To-Be):**

```
        COOPERATIVA (tenant dedicado)
    /escalas    /central    /tiss
         └──────────┴──────────┘
              ASSOCIADOS
         /plantoes · /perfil · TISS leitura
```

| Benefício | Entrega |
|-----------|---------|
| Tenant dedicado + branding | Identidade da cooperativa, dados isolados RLS |
| Pool centralizado | Múltiplos professionals no mesmo tenant |
| Captação digital | Aba Abertos — oportunidades visíveis a todos |
| Repasses transparentes | `medical_production` → `medical_payouts` |
| Prestação de contas | Auditoria completa para assembleias |

**Storytelling:** *"Dr. Ricardo liga dia 10: 'Quanto vou receber?' Com MedicFlow, consulta `/tiss` no celular — produção e repasse em tempo real."*

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Fluxo cooperativa To-Be | §3.4 MEDICFLOW_CASOS_DE_USO_EXECUTIVOS |
| **2ª opção** | Diagrama multi-unidade | Pool + central + repasses |
| **3ª opção** | ROI cooperativa | §3.6 MEDICFLOW_CASOS_DE_USO_EXECUTIVOS |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/04-plantoes.png` | Captação — pool de associados |
| **2ª opção** | `screenshots/09-tiss.png` | Produção e Repasses |
| **3ª opção** | `screenshots/07-configuracoes-instituicao.png` | Branding da cooperativa |

### Fala do apresentador

> *"Quantas ligações de associados perguntando 'quanto vou receber' vocês atendem por mês?"*
>
> *"Cooperativa não é papel RBAC — é tenant dedicado. Um escalista gerencia mais unidades com central unificada. Transparência retém associados e fortalece a cooperativa em assembleias."*
>
> *"Pacote recomendado: Enterprise — operacional completo + dashboard executivo + repasses."*

**Tempo sugerido:** 2–3 minutos

---

## Slide 9 — Caso de Uso: Grupo de Plantonistas

### Título do slide
**Grupo de plantonistas — profissionalizar sem burocratizar**

### Objetivo
Mostrar valor para grupos informais/formais que precisam escalar além do WhatsApp e fechar contratos com hospitais.

### Mensagem principal
**Grupo de 15–80 plantonistas profissionaliza operação com confirmação em 1 clique, captação democratizada e imagem credível para novos contratos — sem secretária extra.**

### Texto executivo (corpo do slide)

**Perfil:** 15–80 médicos · 2–5 instituições · coordenação por médico-líder · WhatsApp + planilha Google Sheets

**Antes (As-Is):**
- Dependência do líder · confirmação informal · double-booking entre instituições · pagamento verbal

**Depois (To-Be):**

| Benefício | Entrega |
|-----------|---------|
| Captação democratizada | Todos veem oportunidades em `/plantoes` |
| Confirmação em 1 clique | Assignment auditável — fim do "ele disse que ia" |
| Acesso mobile | PWA responsivo — sem app store |
| Escalabilidade | Grupo cresce sem depender só do WhatsApp |
| Imagem profissional | Branding do grupo — credibilidade com hospitais |
| Transparência financeira | Consulta produção e repasses (leitura) |

**Storytelling:** *"Dr. Felipe, 40 plantonistas, maratona de WhatsApp. Com MedicFlow, grupo cresceu para 65 — sem secretária. Fechou contrato com hospital novo."*

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Fluxo grupo To-Be | §4.4 MEDICFLOW_CASOS_DE_USO_EXECUTIVOS |
| **2ª opção** | Before/After WhatsApp vs. PWA | Comparação visual de confirmação |
| **3ª opção** | Indicadores impactados | §4.7 MEDICFLOW_CASOS_DE_USO_EXECUTIVOS |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/10-perfil.png` | Disponibilidade e perfil mobile |
| **2ª opção** | `screenshots/04-plantoes.png` | Confirmação em 1 clique |
| **3ª opção** | `screenshots/01-login.png` | Branding do grupo no login |

### Fala do apresentador

> *"O que impede o grupo de crescer hoje — falta de médicos ou falta de processo?"*
>
> *"Profissionalizar não é burocratizar. É escalar sem perder agilidade. PWA no celular, confirmação mais rápida que 15 mensagens no grupo."*
>
> *"Pacote recomendado: Operacional — escalas, plantões, central. TISS como add-on quando formalizarem faturamento."*

**Tempo sugerido:** 2 minutos

---

## Slide 10 — Financeiro + TISS

### Título do slide
**Operação alimenta faturamento: TISS e fechamento no mesmo tenant**

### Objetivo
Demonstrar integração operação-financeiro — diferencial central vs. planilhas e sistemas TISS isolados. Convencer diretor financeiro e investidores.

### Mensagem principal
**Produção operacional alimenta ciclo TISS, repasses e fechamento com snapshot — mesma auditoria, mesma competência, zero retrabalho entre sistemas.**

### Texto executivo (corpo do slide)

```
Plantão executado → medical_production → Guias TISS → Lotes → Export XML
                              ↓
                    Repasses (medical_payouts)
                              ↓
                    Fechamento (snapshot + trava)
                              ↓
                    Dashboard Executivo (KPIs reais)
```

| Aba TISS | Status |
|----------|--------|
| Convênios e contratos | ✅ |
| Catálogo TUSS | ✅ |
| Guias e itens | ✅ |
| Lotes e export XML | ⚠️ MVP |
| Glosas e recursos | ⚠️ Parcial |
| Produção e repasses | ✅ |

**Fechamento:** competência mensal · snapshot · trava · reabertura restrita · auditoria `financial_closing_audit`

**V1:** export XML + registro manual — envio automático a operadoras no roadmap médio prazo

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Pipeline operação → TISS → fechamento | Fluxo horizontal 5 etapas |
| **2ª opção** | §3.3 [MEDICFLOW_WORKFLOW_OPERACIONAL.md](./MEDICFLOW_WORKFLOW_OPERACIONAL.md) | Relacionamento módulos |
| **3ª opção** | Ciclo TISS Mermaid | Convênios → Guias → Lotes → Glosas → Repasses |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/09-tiss.png` | Módulo TISS completo |
| **2ª opção** | `screenshots/05-financeiro.png` | Hub financeiro |
| **3ª opção** | Composição | `09-tiss.png` (Produção/Repasses) + fechamento |

### Fala do apresentador

> *"A produção do plantão vira guia TISS no mesmo sistema — diretor financeiro, isso elimina o retrabalho entre operação e faturamento."*
>
> *"Fechamento com snapshot é argumento de compliance: nada muda retroativamente sem auditoria e permissão de admin."*
>
> *"Gap honesto: XML TISS é MVP, não conforme ANS completo — roadmap curto prazo. Demo: `/tiss` → Repasses → `/financeiro/fechamento-operacional`."*

**Tempo sugerido:** 3 minutos

---

## Slide 11 — Dashboard Executivo

### Título do slide
**Dashboard Executivo: KPIs reais para decisão, não planilhas**

### Objetivo
Apresentar visão consolidada para diretoria e investidores — argumento de valor estratégico e governança.

### Mensagem principal
**KPIs operacionais e financeiros reais por competência — baseados em snapshots travados, não estimativas de planilha.**

### Texto executivo (corpo do slide)

| Indicador | Fonte | Onde |
|-----------|-------|------|
| KPIs de fechamento | `financial_closings` | `/dashboard-executivo` |
| Alertas financeiros | executive-dashboard | `/dashboard-executivo` |
| KPIs TISS | rollups TISS | `/tiss` → Resumo |
| Cobertura operacional | Central RT | `/central` |
| Plantões abertos/pendentes | Operação | `/`, `/central` |

**Duas camadas executivas:**
1. `/executivo` — narrativa comercial para sponsors
2. `/financeiro/dashboard-executivo` — KPIs numéricos reais

**Valor diretoria:** visão consolidada · decisão auditável · alertas proativos · export diagnóstico

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama §6 [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | KPIs consolidados |
| **2ª opção** | Dashboard mockup | Cards KPI operacional + financeiro |
| **3ª opção** | Funil decisão | Dados operação → snapshot → KPI → decisão board |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/06-relatorios-dashboard-executivo.png` | Dashboard executivo |
| **2ª opção** | `screenshots/15-copilot-topo.png` | Copiloto IA — narrativa executiva para diretoria |
| **3ª opção** | Composição side-by-side | `06-relatorios-dashboard-executivo.png` + `14-central-ia-operacional.png` |

### Fala do apresentador

> *"Hoje, quanto tempo leva para saber se o mês fechou no azul?"*
>
> *"KPIs vêm de snapshots travados — confiáveis para board, auditoria externa e investidores. Diferencial vs. BI genérico: dados nascem da operação, não de import manual."*
>
> *"Demo: `/executivo` → `/dashboard-executivo`."*

**Tempo sugerido:** 2 minutos

---

## Slide 12 — Diferenciais Competitivos

### Título do slide
**10 diferenciais com evidência — por que MedicFlow-AI**

### Objetivo
Posicionar o produto vs. alternativas (planilhas, TISS isolado, ERP genérico) com argumentos verificáveis para investidores e compradores.

### Mensagem principal
**MedicFlow-AI ocupa o quadrante operacional + financeiro integrado — onde planilhas não escalam e ERPs/EHRs não operam plantões em tempo real.**

### Texto executivo (corpo do slide)

| # | Diferencial | Evidência |
|---|-------------|-----------|
| 1 | Multi-tenant nativo | RLS Postgres + `/instituicao` |
| 2 | Operação + TISS integrados | Mesmo tenant, mesma auditoria |
| 3 | Central em tempo real | Supabase Realtime |
| 4 | RBAC granular | 5 papéis, 30+ capabilities |
| 5 | Implantação assistida | Demo 7 passos + piloto |
| 6 | IA operacional (opcional) | Copilot + agentes supervisionados |
| 7 | Fechamento auditável | Snapshot + trava |
| 8 | White-label rápido | Logo, cores sem rebuild |
| 9 | Deploy flexível | Cloudflare Workers / Vercel |
| 10 | Transparência de maturidade | Gaps documentados |

```
MedicFlow-AI = OPERAÇÃO + TISS MVP + FECHAMENTO
             ≠ Prontuário  ≠ ERP completo  ≠ Envio automático operadoras (V1)
```

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Quadrante §3 [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | Posicionamento competitivo |
| **2ª opção** | Diagrama radial 10 diferenciais | §3 MEDICFLOW_SLIDES_COMERCIAIS |
| **3ª opção** | Tabela "É / Não é" | Posicionamento claro |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/12-menu-central-ia.png` | Discoverability — **Central de IA** no menu (#6) |
| **2ª opção** | `screenshots/14-central-ia-operacional.png` | Central de IA Operacional + tempo real (#3, #6) |
| **3ª opção** | `screenshots/15-copilot-topo.png` | Copiloto GPT no topo — diferencial competitivo (#6) |

### Fala do apresentador

> *"Não atacamos concorrentes nominalmente — comparamos categorias. Planilhas não integram TISS. TISS isolado não opera plantões. ERP genérico não é tempo real para escala."*
>
> *"Diferencial #10 — transparência — é venda consultiva. Mostramos gaps documentados porque clientes enterprise e investidores valorizam honestidade."*
>
> *"IA operacional agora é visível desde o primeiro login: menu **Central de IA**, card na Home e Copiloto no topo da central. É add-on de valor — mas já aparece nos primeiros 3 minutos da demo."*

**Tempo sugerido:** 2–3 minutos

---

## Slide 13 — Roadmap

### Título do slide
**Roadmap transparente: o que está pronto, o que vem a seguir**

### Objetivo
Demonstrar maturidade do produto e visão de evolução — com honestidade sobre gaps. Relevante para investidores e procurement.

### Mensagem principal
**V1 já entrega valor imediato para operação de plantões + TISS MVP. Roadmap médio/longo prazo é visão — não compromisso com data fixa.**

### Texto executivo (corpo do slide)

**V1 — Implementado ✅**
Escalas · Plantões · Central RT · Dashboard executivo · Fechamento · TISS · Repasses · White-label · Piloto · RBAC · IA operacional

**V1 — Parcial ⚠️**
Hub financeiro (KPIs ilustrativos) · Export XML TISS (MVP) · Glosas (manual) · Conciliação (CSV) · Cadastro UI profissionais

| Horizonte | Itens |
|-----------|-------|
| **Curto prazo** | XML TISS conforme ANS · cadastro UI profissionais · hub financeiro KPIs reais |
| **Médio prazo** | Envio TISS operadoras · conciliação bancária · push/e-mail · webhooks |
| **Longo prazo** | Pacientes · prontuário · agenda ambulatorial · integração ERP/DRE |

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Timeline 3 colunas | Implementado (verde) · Parcial (amarelo) · Futuro (cinza) |
| **2ª opção** | §8 [MEDICFLOW_APRESENTACAO_EXECUTIVA.md](./MEDICFLOW_APRESENTACAO_EXECUTIVA.md) | Roadmap visual Mermaid |
| **3ª opção** | §8 [MEDICFLOW_INFOGRAFICO.md](./MEDICFLOW_INFOGRAFICO.md) | Infográfico roadmap |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | Nenhum (slide roadmap) | Timeline visual como elemento principal |
| **2ª opção** | `screenshots/08-administracao-piloto.png` | Implantação assistida (já pronto) |
| **3ª opção** | Métricas produto | 20 rotas · 173 functions · 63 tabelas |

### Fala do apresentador

> *"Transparência vende. V1 já resolve operação de plantões e TISS MVP — não precisam esperar roadmap para gerar valor."*
>
> *"Para investidores: produto implementado com staging live, não slide de visão. Roadmap reflete gaps da auditoria — ajustamos conforme feedback de pilotos."*
>
> *"Não prometemos datas fixas no médio/longo prazo."*

**Tempo sugerido:** 2 minutos

---

## Slide 14 — Modelo Comercial

### Título do slide
**Modelo comercial flexível — SaaS multi-tenant com implantação assistida**

### Objetivo
Apresentar estrutura de contratação, pacotes e jornada comercial para hospitais, cooperativas, investidores e parceiros.

### Mensagem principal
**SaaS B2B healthcare com piloto de 30 dias e KPIs baseline — reduz risco percebido e acelera decisão de compra.**

### Texto executivo (corpo do slide)

**Pacotes sugeridos**

| Pacote | Público | Módulos | Implantação |
|--------|---------|---------|-------------|
| **Operacional** | UPA, clínica, grupo plantonistas | Escalas, Plantões, Central RT | Piloto 3 dias |
| **Operacional + TISS** | Hospital 24h, clínica TISS | + TISS + Repasses + Fechamento | Piloto 5 dias |
| **Enterprise** | Hospital grande, cooperativa | Completo + Dashboard + IA | Go-live dedicado |

**Componentes de precificação**
Setup/implantação · Licença mensal SaaS (por tenant/unidades/profissionais) · Add-on TISS · Add-on IA · Suporte (SLA standard/premium)

**Jornada comercial**
```
Discovery (30 min) → Demo staging (45 min) → Piloto (30 dias) → Proposta → Go-live → Customer success
```

> Valores específicos na proposta comercial pós-discovery — este slide apresenta estrutura, não tabela de preços.

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Funil comercial | Discovery → Demo → Piloto → Contrato → Go-live |
| **2ª opção** | Tabela 3 pacotes (3 colunas) | Operacional / +TISS / Enterprise |
| **3ª opção** | Quadrante valor §11 [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md) | Segmentos prioritários |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/08-administracao-piloto.png` | Implantação assistida |
| **2ª opção** | Nenhum | Foco em tabela de pacotes |
| **3ª opção** | QR code staging | Demo ao vivo como prova de maturidade |

### Fala do apresentador

> *"Não apresentamos preço no primeiro encontro — focamos valor e piloto. Piloto de 30 dias com KPIs baseline é o melhor closer."*
>
> *"Cooperativas: tenant dedicado + pool + repasses. Grupos de plantonistas: pacote Operacional acessível. Enterprise: IA e suporte premium como upsell."*
>
> *"White-label incluso — sem custo adicional de customização visual."*

**Tempo sugerido:** 2 minutos

---

## Slide 15 — Chamada para Piloto

### Título do slide
**Próximo passo: piloto institucional de 30 dias ou demo executiva ao vivo**

### Objetivo
Fechar com call-to-action tangível — agendar piloto, demo ou workshop técnico.

### Mensagem principal
**MedicFlow-AI está pronto para piloto com KPIs baseline — da operação ao fechamento financeiro, com demo guiada de 7 passos em staging live.**

### Texto executivo (corpo do slide)

| Recurso | Acesso |
|---------|--------|
| **Staging live** | `https://staging.medicflow.app.br` |
| **Demo guiada** | 7 passos em `/piloto` |
| **Screenshots** | 12 telas em `docs/screenshots/` |
| **Documentação** | Pacote executivo completo em `docs/` |

**Demo guiada — 7 passos**
1. `/piloto` — Abertura executiva
2. `/` — Operação do dia
3. `/central` — Central operacional
4. `/executivo` — Walkthrough executivo
5. `/tiss` — TISS e faturamento
6. `/instituicao` — Multi-tenant e branding
7. `/operacao` — Confiança operacional

**Call to action**

| Ação | Público | Próximo passo |
|------|---------|---------------|
| **Piloto institucional (30 dias)** | Operação + financeiro | KPIs baseline + go-live assistido |
| **Demo executiva (45 min)** | Diretoria, sponsors, investidores | Roteiro 7 passos em staging |
| **Workshop técnico (2h)** | TI, compliance, DPO | Arquitetura, RLS, RBAC, auditoria |

**Elevator pitch final**

> MedicFlow-AI substitui planilhas e WhatsApp na gestão de plantões hospitalares, integrando operação, TISS e fechamento financeiro em plataforma segura, white-label e pronta para demo comercial.

**Contato comercial:** [inserir e-mail / telefone / calendly]

### Gráfico recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Elevator pitch visual | Problema → Solução → CTA (funil) |
| **2ª opção** | QR code staging | Link direto para demo |
| **3ª opção** | Composição hero | Logo + URL + "Inicie seu piloto" |

### Screenshot recomendado

| Prioridade | Arquivo | Uso |
|------------|---------|-----|
| **1ª opção** | `screenshots/08-administracao-piloto.png` | Entrada do piloto guiado |
| **2ª opção** | `screenshots/02-dashboard.png` | Hero de fechamento |
| **3ª opção** | QR code + `01-login.png` | Acesso imediato staging |

### Fala do apresentador

> *"Podemos iniciar um piloto institucional de 30 dias com KPIs baseline — operação, cobertura, fechamento — ou agendar demo executiva de 45 minutos com roteiro completo. Qual faz mais sentido para vocês?"*
>
> *"Sempre fechamos com data: podemos agendar para [dia] às [hora]?"*
>
> *"Deixo material: link staging, este deck, proposta de valor. Follow-up em 24h. Obrigado."*

**Tempo sugerido:** 1–2 minutos

---

## Apêndice A — Roteiros de demo por tempo

| Duração | Slides + telas | Público |
|---------|----------------|---------|
| **10 min** | Slides 1–4 + `/` + `/plantoes` + `/central` + `/executivo` | Primeiro contato, investidor com agenda apertada |
| **20 min** | Slides 1–6 + demo operação → TISS → executivo | Comitê operacional + financeiro |
| **40 min** | Deck completo + demo ciclo fechado + IA | Decisores completos, pré-piloto |

Ver roteiros detalhados em [MEDICFLOW_DEMO_COMERCIAL.md](./MEDICFLOW_DEMO_COMERCIAL.md).

---

## Apêndice B — Checklist pré-apresentação

| Item | Verificado |
|------|:----------:|
| Staging acessível | ☐ |
| Credenciais demo (admin, escalista, médico) | ☐ |
| Roteiro `/piloto` testado (7 passos) | ☐ |
| Screenshots exportados 1920×1080 | ☐ |
| Diagramas Mermaid exportados | ☐ |
| Gap sheet / FAQ preparado | ☐ |
| Link calendly / contato comercial | ☐ |
| Segmento adaptado (hospital / cooperativa / grupo) | ☐ |

---

## Apêndice C — FAQ rápido (Speaker Notes)

| Pergunta | Resposta |
|----------|----------|
| É prontuário eletrônico? | Não. Plataforma operacional + TISS MVP. |
| Envia TISS para operadoras? | V1: export XML + manual. Automático no roadmap médio prazo. |
| Quanto tempo para go-live? | ~3 dias com piloto assistido. |
| Funciona no celular? | Sim — PWA responsivo. |
| Quanto custa? | Proposta após discovery — pacotes Operacional / +TISS / Enterprise. |
| E a LGPD? | RLS Postgres, RBAC, audit logs, isolamento por tenant. |

---

## Apêndice D — Referências cruzadas

| Documento | Uso |
|-----------|-----|
| [MEDICFLOW_PRESENTACAO_COMERCIAL_V1.md](./MEDICFLOW_PRESENTACAO_COMERCIAL_V1.md) | Deck comercial V1 (base estrutural) |
| [MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md](./MEDICFLOW_CASOS_DE_USO_EXECUTIVOS.md) | Casos de uso slides 7–9 |
| [MEDICFLOW_DEMO_COMERCIAL.md](./MEDICFLOW_DEMO_COMERCIAL.md) | Roteiros demo 10/20/40 min |
| [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md) | Argumentação comercial |
| [MEDICFLOW_WORKFLOW_CAPTACAO_PLANTOES.md](./MEDICFLOW_WORKFLOW_CAPTACAO_PLANTOES.md) | Slide 5 |
| [MEDICFLOW_WORKFLOW_HUB_ADMINISTRATIVO.md](./MEDICFLOW_WORKFLOW_HUB_ADMINISTRATIVO.md) | Slide 6 |
| [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | Diagramas Antes/Depois, ROI, diferenciais |
| [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | Exportação visual Mermaid |

---

*Documento gerado com base na documentação executiva MedicFlow-AI V1. Sem alterações de código, banco ou staging.*

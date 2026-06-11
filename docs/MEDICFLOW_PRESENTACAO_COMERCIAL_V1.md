# MedicFlow-AI — Apresentação Comercial V1

**Documento:** deck comercial profissional para diretoria, hospitais, cooperativas e investidores  
**Data:** 11/06/2026  
**Versão:** V1 Comercial  
**Ambiente demo:** `https://staging.medicflow.app.br`  
**Base:** documentação executiva auditada do produto V1

---

## Guia de uso

| Item | Recomendação |
|------|--------------|
| **Formato de exportação** | PowerPoint / Google Slides / PDF |
| **Tempo total sugerido** | 25–35 minutos (com Q&A) |
| **Resolução de imagens** | 1920×1080 (16:9) |
| **Screenshots** | `docs/screenshots/` (12 telas validadas em staging) |
| **Diagramas** | Exportar Mermaid via [mermaid.live](https://mermaid.live) ou ver [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) |

### Referências cruzadas

| Documento | Uso |
|-----------|-----|
| [MEDICFLOW_PROPOSTA_DE_VALOR.md](./MEDICFLOW_PROPOSTA_DE_VALOR.md) | Argumentação comercial detalhada |
| [MEDICFLOW_APRESENTACAO_EXECUTIVA.md](./MEDICFLOW_APRESENTACAO_EXECUTIVA.md) | Material executivo consolidado |
| [MEDICFLOW_PITCH_5_MINUTOS.md](./MEDICFLOW_PITCH_5_MINUTOS.md) | Roteiro curto |
| [MEDICFLOW_PITCH_15_MINUTOS.md](./MEDICFLOW_PITCH_15_MINUTOS.md) | Roteiro médio |

---

## Slide 1 — Capa

### Título
**MedicFlow-AI — A plataforma operacional que conecta plantões, TISS e fechamento financeiro**

### Objetivo
Estabelecer credibilidade imediata, posicionar o produto e definir o tom da conversa comercial.

### Texto executivo

O **MedicFlow-AI** é uma plataforma operacional hospitalar **multi-tenant white-label** que digitaliza a gestão de plantões, centraliza o faturamento TISS e entrega fechamento financeiro auditável — com implantação assistida e central operacional em tempo real.

**Versão:** V1 Operacional  
**Demo live:** staging.medicflow.app.br  
**Público-alvo:** hospitais 24h, UPAs, clínicas com TISS, cooperativas médicas e diretoria financeira

> *Não é prontuário eletrônico. É a camada operacional e financeira que faltava entre planilhas e ERPs.*

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Logo MedicFlow-AI + screenshot hero | Composição: logo centralizado + `screenshots/02-dashboard.png` em mockup de laptop |
| **2ª opção** | Diagrama §1 de [MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md](./MEDICFLOW_DIAGRAMAS_EXECUTIVOS.md) | Visão da plataforma com 5 pilares |
| **3ª opção** | Fundo institucional | Azul `#0369A1` com tagline e URL de staging |

### Notas do apresentador

- Abrir com pergunta de engajamento: *"Quantas planilhas diferentes sua instituição usa hoje para escala, confirmação e faturamento?"*
- Não prometer EHR, ERP completo ou envio automático a operadoras — posicionamento honesto gera confiança.
- Mencionar que o produto está em staging com demo guiada de 7 passos pronta para execução ao vivo.
- Tempo sugerido: **1–2 minutos**.

---

## Slide 2 — Problema do mercado

### Título
**O mercado opera plantões no escuro — e paga caro por isso**

### Objetivo
Validar a dor do cliente e criar identificação emocional com o cenário atual antes de apresentar a solução.

### Texto executivo

Hospitais, UPAs e cooperativas médicas ainda dependem de **processos manuais e fragmentados** para uma operação crítica: garantir cobertura médica 24/7 com faturamento correto.

**Operação de plantões**

| Dor | Impacto no negócio |
|-----|-------------------|
| Escalas em planilhas Excel/Google Sheets | Erros de versão, sem histórico auditável |
| Confirmações via WhatsApp e ligações | Perda de confirmações, sem rastreio |
| Falta de visibilidade de cobertura | Plantões descobertos em cima da hora |
| Trocas informais entre médicos | Conflitos de horário, double-booking |

**Faturamento e financeiro**

| Dor | Impacto no negócio |
|-----|-------------------|
| Guias TISS em sistemas distintos da operação | Retrabalho, perda de receita |
| Fechamento mensal sem snapshot | Alterações retroativas sem auditoria |
| Repasses médicos desconectados da produção | Disputas, falta de transparência |
| Glosas sem rastreio estruturado | Receita recuperável perdida |

**Implantação de software**

Demos desorganizadas, go-live sem validação técnica e branding genérico reduzem adesão e aumentam risco pós-implantação.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Slide "Antes x Depois" §1 de [MEDICFLOW_SLIDES_COMERCIAIS.md](./MEDICFLOW_SLIDES_COMERCIAIS.md) | Fluxo lado a lado: planilhas/WhatsApp vs. MedicFlow |
| **2ª opção** | Mindmap de transformação | §1 de MEDICFLOW_SLIDES_COMERCIAIS — impacto operacional/financeiro |
| **3ª opção** | Ícones visuais | Planilha + WhatsApp + telefone + pasta TISS separada (vermelho `#FEE2E2`) |

### Notas do apresentador

- Use exemplos concretos: *"Quantas vezes o plantão do fim de semana foi confirmado no WhatsApp e ninguém registrou?"*
- Não culpe o cliente — posicione como problema estrutural do mercado brasileiro de saúde.
- Se houver diretor financeiro na sala, enfatize TISS desconectado e fechamento sem auditoria.
- Tempo sugerido: **2–3 minutos**.

---

## Slide 3 — Como hospitais operam hoje

### Título
**A operação fragmentada: muitas ferramentas, zero visibilidade integrada**

### Objetivo
Mostrar o cenário operacional típico (As-Is) e preparar o contraste com a solução MedicFlow-AI.

### Texto executivo

A operação hospitalar de plantões hoje envolve **múltiplos atores, múltiplas ferramentas e zero integração** entre operação e financeiro.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  ESCALISTA  │    │   MÉDICO    │    │ FINANCEIRO  │    │  DIRETORIA  │
│  Planilha   │    │  WhatsApp   │    │  TISS       │    │  Relatório  │
│  Excel      │    │  Ligações   │    │  separado   │    │  manual     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       └──────────────────┴──────────────────┴──────────────────┘
                              SEM INTEGRAÇÃO
                         Sem auditoria · Sem tempo real
```

**Processos típicos hoje**

| Processo | Ferramenta atual | Consequência |
|----------|------------------|--------------|
| Publicar escala | Planilha compartilhada | Versões conflitantes |
| Confirmar plantão | WhatsApp / ligação | Sem registro auditável |
| Monitorar cobertura | Ligações reativas | Descoberta tardia de gaps |
| Trocar turno | Acordo informal | Double-booking |
| Faturar TISS | Sistema separado | Retrabalho e inconsistência |
| Fechar mês | Planilha + e-mail | Alterações retroativas |
| Repassar médicos | Planilha paralela | Disputas e opacidade |
| Implantar software | Demo ad hoc | Perda de oportunidade comercial |

**Resultado:** retrabalho operacional, risco de cobertura, receita não faturada ou glosada sem rastreio, e diretoria sem KPIs confiáveis.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama ASCII acima em slide visual | 4 silos desconectados com ícones |
| **2ª opção** | Matriz comparativa §1 de MEDICFLOW_SLIDES_COMERCIAIS | 6 processos Antes vs. Depois |
| **3ª opção** | Foto ilustrativa | Equipe hospitalar com múltiplos dispositivos/canais (uso genérico) |

### Notas do apresentador

- Peça confirmação: *"Isso reflete a realidade de vocês?"* — silencie e espere resposta.
- Destaque que o problema não é falta de esforço das equipes, e sim falta de plataforma integrada.
- Conecte com custo oculto: horas do escalista, plantões descobertos, glosas não contestadas.
- Tempo sugerido: **2 minutos**.

---

## Slide 4 — Como o MedicFlow-AI resolve

### Título
**Uma plataforma. Operação, TISS e fechamento no mesmo tenant.**

### Objetivo
Apresentar a solução de forma clara, com os três pilares de valor e evidências do produto implementado.

### Texto executivo

O **MedicFlow-AI V1** substitui planilhas, WhatsApp e sistemas fragmentados por uma plataforma **multi-tenant white-label** que unifica:

```
┌─────────────────────────────────────────────────────────────────┐
│                     MedicFlow-AI V1                              │
│                                                                  │
│   OPERAÇÃO          FINANCEIRO         IMPLANTAÇÃO               │
│   ────────          ──────────         ───────────               │
│   Escalas 14d       TISS MVP           Piloto assistido          │
│   Plantões          Fechamento         Demo 7 passos             │
│   Central RT        Conciliação        Go-live controlado        │
│   Swaps             Repasses           White-label               │
│   IA operacional    Dashboard exec.    Smoke tests               │
└─────────────────────────────────────────────────────────────────┘
```

**O que entrega hoje (evidência auditada)**

| Capacidade | Rota | Status |
|------------|------|--------|
| Gestão de escalas e plantões | `/escalas`, `/plantoes` | ✅ Implementado |
| Central operacional em tempo real | `/central` + Supabase Realtime | ✅ Implementado |
| Ciclo TISS integrado | `/tiss` — convênios, guias, lotes, glosas | ✅ MVP |
| Fechamento financeiro auditável | `/financeiro/fechamento-operacional` | ✅ Implementado |
| Multi-tenant com branding | `/instituicao` | ✅ Implementado |
| RBAC granular (5 papéis) | 30+ capabilities, RLS Postgres | ✅ Implementado |
| Implantação assistida | `/piloto`, `/lancamento` | ✅ Implementado |

**Elevator pitch:**

> MedicFlow-AI digitaliza a operação de plantões hospitalares e integra faturamento TISS em plataforma multi-tenant white-label — com central operacional em tempo real, fechamento financeiro auditável e implantação assistida.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | `screenshots/02-dashboard.png` | Dashboard operacional do dia |
| **2ª opção** | Diagrama §1 MEDICFLOW_DIAGRAMAS_EXECUTIVOS | Visão da plataforma com pilares |
| **3ª opção** | Arquitetura §5 de MEDICFLOW_APRESENTACAO_EXECUTIVA | Módulos conectados |

### Notas do apresentador

- Transição: *"E se tudo isso vivesse em um único lugar, com auditoria e tempo real?"*
- Mostre staging ao vivo se possível — `/` dashboard é impactante.
- Reforce transparência: V1 não é EHR, não envia TISS automaticamente a operadoras.
- Números de prova: 20 rotas, ~173 server functions, ~63 tabelas, 12 screenshots validados.
- Tempo sugerido: **3 minutos**.

---

## Slide 5 — Workflow Captação de Plantões

### Título
**Do plantão aberto ao repasse: 10 etapas rastreáveis**

### Objetivo
Demonstrar o fluxo operacional completo de captação, da demanda hospitalar ao pagamento do médico.

### Texto executivo

O workflow de captação de plantões cobre **10 etapas integradas**, conectando hospital, escalista, médico e financeiro:

```
 DEMANDA ──► PUBLICAÇÃO ──► NOTIFICAÇÃO ──► INTERESSE ──► SELEÇÃO
                                                              │
 PAGAMENTO ◄── FECHAMENTO ◄── VALIDAÇÃO ◄── EXECUÇÃO ◄── CONFIRMAÇÃO
```

| # | Etapa | Ator principal | Rota / artefato |
|---|-------|----------------|-----------------|
| ① | Cadastro da oportunidade | Escalista | `/escalas` — shifts `open` |
| ② | Publicação da escala | Escalista | Calendário 14 dias |
| ③ | Notificação | Sistema | `/`, `/central` — alertas RT |
| ④ | Manifestação de interesse | Médico | `/plantoes` → aba Abertos |
| ⑤ | Seleção | Escalista / self-service | assignments |
| ⑥ | Confirmação | Médico | status `confirmed` |
| ⑦ | Execução | Médico | `/central` monitora |
| ⑧ | Validação | Sistema | `medical_production` |
| ⑨ | Fechamento | Administrador | snapshot + trava |
| ⑩ | Pagamento | Financeiro | `/tiss` → Repasses |

**Regras de negócio críticas:** 1 confirmado por turno (anti double-booking), swaps com aprovação formalizada, disponibilidade visível no perfil, isolamento multi-tenant por RLS.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama §2 MEDICFLOW_DIAGRAMAS_EXECUTIVOS | Fluxo 10 etapas com atores |
| **2ª opção** | Sequência Hospital → Escalista → Médico → Sistema | §4 de MEDICFLOW_WORKFLOW_CAPTACAO_PLANTOES |
| **3ª opção** | Screenshots combinados | `03-agenda-escalas.png` + `04-plantoes.png` + `11-central-operacional.png` |

### Notas do apresentador

- Conte história: *"Sexta, 18h — plantão de UTI sem confirmação. No MedicFlow, a central alerta às 14h."*
- Destaque regra de 1 confirmed/shift — elimina double-booking que planilhas permitem.
- Mencione gap honesto: push/e-mail não implementados — notificação in-app + Realtime.
- Demo sugerida: `/escalas` → `/plantoes` → `/central`.
- Tempo sugerido: **3 minutos**.

---

## Slide 6 — Workflow Administrativo

### Título
**Hub Administrativo Médico: gestão institucional em 10 módulos**

### Objetivo
Mostrar como administradores e equipe financeira configuram, operam e auditam a instituição na plataforma.

### Texto executivo

O **Hub Administrativo Médico** concentra gestão institucional, financeira e operacional em ambiente multi-tenant com RBAC granular:

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
| ⑨ | Indicadores | `/central`, `/tiss` | todos (filtrado) |
| ⑩ | Auditoria | `/operacao` | tenant_admin |

**Implantação assistida:** `/piloto` (demo 7 passos) → `/lancamento` (smoke tests + go-live) — go-live estimado em **~3 dias**.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama §3 MEDICFLOW_DIAGRAMAS_EXECUTIVOS | Hub 10 módulos conectados |
| **2ª opção** | `screenshots/07-configuracoes-instituicao.png` | Branding e parametrização |
| **3ª opção** | `screenshots/08-administracao-piloto.png` | Piloto e demo guiada |

### Notas do apresentador

- Foque no administrador: *"Em um dia vocês configuram branding; em três, go-live com smoke tests."*
- Gap transparente: UI de cadastro de profissionais não implementada — provisionamento via Auth.
- Matriz de permissões: tenant_admin, coordinator, financial, professional — cada um vê só o que precisa.
- Demo sugerida: `/instituicao` → `/piloto` → `/financeiro/fechamento-operacional`.
- Tempo sugerido: **2–3 minutos**.

---

## Slide 7 — Jornada do Médico

### Título
**Jornada do Médico: do login ao repasse em 5 passos**

### Objetivo
Humanizar a proposta mostrando a experiência do profissional de plantão — principal usuário operacional.

### Texto executivo

A jornada do médico foi desenhada para ser **simples, mobile-friendly e transparente**:

```
ENTRADA ──► CAPTAÇÃO ──► ESCALA ──► PLANTÃO ──► PAGAMENTO
 /login      / + /central  /escalas   /plantoes   /tiss
```

| Fase | O que o médico faz | Benefício |
|------|-------------------|-----------|
| **Entrada** | Login multi-tenant → dashboard do dia | Visão imediata de pendências |
| **Captação** | Vê plantões abertos, ativa disponibilidade | Oportunidades visíveis sem WhatsApp |
| **Escala** | Calendário 14 dias, timeline por unidade | Planejamento pessoal claro |
| **Plantão** | Aceita em 1 clique, solicita swap formalizado | Confirmação auditável |
| **Pagamento** | Consulta produção e repasses em `/tiss` | Transparência financeira |

**Casos de uso**

- Confirmar plantão do fim de semana: `Login → Plantões → Meus plantões → Aceitar`
- Buscar plantão extra: `Login → Plantões → Abertos → Aceitar`
- Consultar repasse: `TISS → Produção → Repasses`

**Experiência mobile:** PWA responsivo — acessível no celular sem app store.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Journey map §2 MEDICFLOW_DIAGRAMAS_EXECUTIVOS | 5 fases com satisfação |
| **2ª opção** | Screenshots sequenciais | `01-login.png` → `04-plantoes.png` → `09-tiss.png` |
| **3ª opção** | `screenshots/10-perfil.png` | Disponibilidade e perfil |

### Notas do apresentador

- Médicos são gatekeepers de adoção — se for fácil para eles, o hospital adota.
- Enfatize: confirmação em 1 clique vs. 15 mensagens no WhatsApp.
- Produção e repasses visíveis reduzem disputas com financeiro.
- Se houver médico/coordenador na sala, peça validação da jornada.
- Tempo sugerido: **2 minutos**.

---

## Slide 8 — Jornada do Hospital

### Título
**Jornada do Hospital: da implantação aos indicadores executivos**

### Objetivo
Mostrar o caminho do administrador institucional — desde branding até KPIs para diretoria.

### Texto executivo

A jornada do hospital/administrador cobre **configuração, operação e governança**:

```
ENTRADA ──► INSTITUIÇÃO ──► PROFISSIONAIS ──► FINANCEIRO ──► INDICADORES
 /login      /instituicao     Auth externo      /financeiro    /executivo
 /piloto                                          /tiss
```

| Fase | Ações-chave | Resultado |
|------|-------------|-----------|
| **Entrada** | Piloto assistido, demo 7 passos, smoke tests | Go-live validado |
| **Instituição** | Branding (logo, cores, banner), parametrização | Identidade white-label |
| **Profissionais** | Provisionamento Auth + RBAC (5 papéis) | Equipe operacional pronta |
| **Financeiro** | Convênios TISS, fechamento, conciliação, repasses | Ciclo financeiro fechado |
| **Indicadores** | Dashboard executivo, KPIs por competência | Decisão baseada em dados |

**Benefícios institucionais**

- White-label em dias, sem rebuild
- Multi-unidade (units + departments por tenant)
- Segurança multi-tenant com RLS Postgres
- Observabilidade: health checks, export diagnóstico, timeline
- RBAC por função — admin, escalista, financeiro, médico

**Segmentos atendidos:** hospitais 24h, UPAs, clínicas com TISS, cooperativas médicas.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama §5 MEDICFLOW_DIAGRAMAS_EXECUTIVOS | Jornada administrador 5 fases |
| **2ª opção** | `screenshots/06-relatorios-dashboard-executivo.png` | Dashboard executivo |
| **3ª opção** | Gantt de implantação §6 MEDICFLOW_WORKFLOW_HUB_ADMINISTRATIVO | Timeline ~3 dias |

### Notas do apresentador

- Diretoria quer saber: *"Quanto tempo até operar?"* — resposta: ~3 dias com piloto assistido.
- White-label aumenta adesão — médicos veem logo do hospital, não software genérico.
- Conecte jornada hospital → jornada médico: admin configura, médico opera, financeiro fecha.
- Demo sugerida: `/piloto` → `/instituicao` → `/executivo`.
- Tempo sugerido: **2–3 minutos**.

---

## Slide 9 — Financeiro + TISS

### Título
**Operação alimenta faturamento: TISS e fechamento no mesmo tenant**

### Objetivo
Demonstrar integração operação-financeiro — diferencial central vs. planilhas e sistemas TISS isolados.

### Texto executivo

O MedicFlow-AI conecta **produção operacional** ao **ciclo TISS** e **fechamento financeiro auditável**:

```
Plantão executado → medical_production → Guias TISS → Lotes → Export XML
                              ↓
                    Repasses (medical_payouts)
                              ↓
                    Fechamento (snapshot + trava)
                              ↓
                    Dashboard Executivo (KPIs reais)
```

**Ciclo TISS (MVP implementado)**

| Aba | Funcionalidade | Status |
|-----|----------------|--------|
| Convênios e contratos | Cadastro de operadoras | ✅ |
| Catálogo TUSS | Procedimentos | ✅ |
| Guias e itens | Emissão e gestão | ✅ |
| Lotes e export XML | Agrupamento e export | ⚠️ MVP |
| Glosas e recursos | Registro manual | ⚠️ Parcial |
| Produção e repasses | Cálculo vinculado | ✅ |

**Fechamento financeiro**

- Competência mensal com **snapshot** e **trava** — impede alterações retroativas
- Reabertura restrita a tenant_admin/super_admin
- Auditoria: `financial_closing_audit`
- Conciliação operacional via import CSV

**Transparência V1:** envio automático a operadoras não implementado — export XML + registro manual de retorno.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | `screenshots/09-tiss.png` | Módulo TISS completo |
| **2ª opção** | `screenshots/05-financeiro.png` | Hub financeiro |
| **3ª opção** | Diagrama relacionamento módulos §3.3 MEDICFLOW_WORKFLOW_OPERACIONAL | Operação → TISS → Fechamento |

### Notas do apresentador

- Este slide convence diretor financeiro: *"A produção do plantão vira guia TISS no mesmo sistema."*
- Fechamento com snapshot é argumento de compliance — nada muda retroativamente sem auditoria.
- Gap honesto: XML TISS MVP, não conforme ANS completo — roadmap curto prazo.
- Demo sugerida: `/tiss` → Produção → Repasses → `/financeiro/fechamento-operacional`.
- Tempo sugerido: **3 minutos**.

---

## Slide 10 — Dashboard Executivo

### Título
**Dashboard Executivo: KPIs reais para decisão, não planilhas**

### Objetivo
Apresentar a visão consolidada para diretoria — argumento de valor estratégico e governança.

### Texto executivo

O Dashboard Executivo consolida **indicadores operacionais e financeiros reais** por competência:

| Indicador | Fonte | Onde visualizar |
|-----------|-------|-----------------|
| KPIs de fechamento | `financial_closings` | `/dashboard-executivo` |
| Alertas financeiros | executive-dashboard | `/dashboard-executivo` |
| KPIs TISS | rollups TISS | `/tiss` → Resumo |
| Cobertura operacional | Central RT | `/central` |
| Readiness institucional | tenant settings | `/instituicao` |
| Plantões abertos / pendentes | Operação | `/`, `/central` |

**Duas camadas executivas**

1. **`/executivo`** — narrativa comercial e walkthrough para sponsors
2. **`/financeiro/dashboard-executivo`** — KPIs numéricos reais por competência

**Valor para diretoria**

- Visão consolidada operação + financeiro
- Decisão baseada em dados auditáveis, não estimativas
- Alertas proativos de cobertura e financeiro
- Export diagnóstico para auditoria externa

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | `screenshots/06-relatorios-dashboard-executivo.png` | Dashboard executivo |
| **2ª opção** | Diagrama §6 MEDICFLOW_DIAGRAMAS_EXECUTIVOS | KPIs consolidados |
| **3ª opção** | Composição | Dashboard + Central side-by-side |

### Notas do apresentador

- Pergunta para diretoria: *"Hoje, quanto tempo leva para saber se o mês fechou no azul?"*
- KPIs vêm de snapshots travados — confiáveis para board e auditoria.
- Diferencial vs. BI genérico: dados nascem da operação, não de import manual.
- Demo sugerida: `/executivo` → `/dashboard-executivo`.
- Tempo sugerido: **2 minutos**.

---

## Slide 11 — Diferenciais Competitivos

### Título
**10 diferenciais com evidência — por que MedicFlow-AI**

### Objetivo
Posicionar o produto vs. alternativas (planilhas, TISS isolado, ERP genérico) com argumentos verificáveis.

### Texto executivo

| # | Diferencial | Evidência | Por que importa |
|---|-------------|-----------|-----------------|
| 1 | **Multi-tenant nativo** | RLS Postgres + `/instituicao` | Hospitais isolados com branding |
| 2 | **Operação + TISS integrados** | Mesmo tenant, mesma auditoria | Operação alimenta faturamento |
| 3 | **Central em tempo real** | Supabase Realtime | Não é dashboard estático |
| 4 | **RBAC granular** | 5 papéis, 30+ capabilities | Segurança em rota, serviço e banco |
| 5 | **Implantação assistida** | Demo 7 passos + piloto | Reduz time-to-value |
| 6 | **IA operacional** | Copilot + agentes (opcional) | Inovação supervisionada |
| 7 | **Fechamento auditável** | Snapshot + trava | Compliance financeiro |
| 8 | **White-label rápido** | Logo, cores sem rebuild | Adesão dos usuários |
| 9 | **Deploy flexível** | Cloudflare Workers / Vercel | Cloud-native, escalável |
| 10 | **Transparência de maturidade** | Gaps documentados | Confiança comercial |

**Posicionamento**

```
MedicFlow-AI = Plataforma OPERACIONAL + FATURAMENTO TISS MVP
             ≠ Prontuário eletrônico
             ≠ ERP hospitalar completo
             ≠ Envio automático a operadoras (V1)
```

**Vs. alternativas:** planilhas não integram TISS; TISS isolado não opera plantões; ERP genérico não é tempo real para escala.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Quadrante §3 MEDICFLOW_SLIDES_COMERCIAIS | Posicionamento competitivo |
| **2ª opção** | Diagrama radial 10 diferenciais §3 MEDICFLOW_SLIDES_COMERCIAIS | Diferenciais visuais |
| **3ª opção** | Tabela "É / Não é" §3 MEDICFLOW_SLIDES_COMERCIAIS | Posicionamento claro |

### Notas do apresentador

- Não ataque concorrentes nominalmente — compare categorias (planilhas, ERP, EHR).
- Diferencial #10 (transparência) é venda consultiva — mostra maturidade e reduz risco percebido.
- IA operacional é opcional — não force como requisito; use como upside.
- Tempo sugerido: **2–3 minutos**.

---

## Slide 12 — ROI

### Título
**Retorno operacional e financeiro mensurável**

### Objetivo
Quantificar (qualitativamente) o retorno esperado com base em capacidades implementadas — sem prometer números não auditados.

### Texto executivo

**Ganhos operacionais**

| Ganho | Como entrega | Métrica esperada |
|-------|--------------|------------------|
| Centralização de escalas | Calendário 14 dias unificado | Eliminação de planilhas paralelas |
| Confirmação rastreável | `shift_assignments` auditável | 100% confirmações registradas |
| Visibilidade de cobertura | `/central` + Realtime | Detecção proativa de gaps |
| Swaps formalizados | Aprovação com trilha | Redução de conflitos de horário |
| Auditoria operacional | `operational_events` | Rastreabilidade completa |

**Ganhos financeiros**

| Ganho | Como entrega | Evidência |
|-------|--------------|-----------|
| Ciclo TISS documentado | Guias → Lotes → Glosas no tenant | 14 tabelas TISS |
| Fechamento com snapshot | Competência travada | Zero alteração retroativa |
| Repasses vinculados | produção → payout | Aba Repasses |
| Glosas rastreadas | Registro e recurso | Recuperação de receita |
| KPIs consolidados | Dashboard executivo | Decisão por competência |

**Ganhos de implantação**

| Ganho | Evidência |
|-------|-----------|
| Go-live em ~3 dias | Piloto + smoke tests documentados |
| Demo comercial pronta | 7 passos + 12 screenshots |
| White-label sem rebuild | Branding em `/instituicao` |

**ROI por persona (estimativas qualitativas — validar em piloto)**

| Persona | Retorno principal |
|---------|-------------------|
| Hospital | Menos tempo em gestão de escala*, cobertura visível 24/7 |
| Cooperativa | Pool centralizado, repasses transparentes |
| Médico | Confirmação em 1 clique, produção visível |
| Diretoria | KPIs reais, auditoria completa, go-live previsível |

> *Estimativa baseada na eliminação de planilhas e confirmações manuais — validar com piloto institucional.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Diagrama ROI §2 MEDICFLOW_SLIDES_COMERCIAIS | Operacional + Financeiro + Implantação |
| **2ª opção** | Quadrante valor por segmento §2 MEDICFLOW_SLIDES_COMERCIAIS | Priorização comercial |
| **3ª opção** | Métricas do produto §2 MEDICFLOW_SLIDES_COMERCIAIS | 20 rotas, 173 functions, 63 tabelas |

### Notas do apresentador

- **Não invente percentuais** não auditados — use "eliminação de", "redução de", "100% registrado".
- Proponha piloto de 30 dias para medir ROI real com KPIs baseline.
- Conecte ROI financeiro a glosas rastreadas — receita recuperável.
- Tempo sugerido: **2–3 minutos**.

---

## Slide 13 — Roadmap

### Título
**Roadmap transparente: o que está pronto, o que vem a seguir**

### Objetivo
Demonstrar maturidade do produto e visão de evolução — com honestidade sobre gaps.

### Texto executivo

**V1 — Implementado (disponível hoje)**

| Módulo | Status |
|--------|--------|
| Escalas e plantões (14 dias) | ✅ |
| Swaps e disponibilidade | ✅ |
| Central operacional + Realtime | ✅ |
| Dashboard executivo (KPIs reais) | ✅ |
| Fechamento de competência | ✅ |
| TISS — convênios, guias, lotes | ✅ |
| Repasses médicos | ✅ |
| Branding white-label | ✅ |
| Piloto + demo guiada + go-live | ✅ |
| IA operacional (opcional) | ✅ |
| RBAC + RLS multi-tenant | ✅ |

**V1 — Parcial (funciona com limitações)**

| Item | Gap |
|------|-----|
| Hub financeiro | KPIs ilustrativos na landing |
| Export XML TISS | MVP, não conforme ANS completo |
| Glosas e recursos | Registro manual, sem operadora |
| Conciliação | CSV only, sem OFX/CNAB |
| Cadastro UI profissionais | Provisionamento manual |

**Curto prazo:** XML TISS conforme ANS, cadastro UI profissionais, hub financeiro KPIs reais.

**Médio prazo:** envio TISS operadoras, conciliação bancária, webhooks, notificações push/e-mail.

**Longo prazo:** módulo pacientes, prontuário, agenda ambulatorial, integração ERP/DRE.

> Roadmap reflete GAPs da auditoria — **não são promessas de entrega com data fixa**.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Timeline §8 MEDICFLOW_APRESENTACAO_EXECUTIVA | Roadmap visual Mermaid |
| **2ª opção** | Três colunas: Implementado / Parcial / Futuro | Semáforo verde/amarelo/cinza |
| **3ª opção** | §8 MEDICFLOW_INFOGRAFICO | Infográfico roadmap |

### Notas do apresentador

- Transparência vende — clientes enterprise valorizam honestidade sobre gaps.
- V1 já entrega valor imediato para operação de plantões + TISS MVP.
- Roadmap médio/longo prazo é visão, não compromisso — ajustar conforme feedback de pilotos.
- Tempo sugerido: **2 minutos**.

---

## Slide 14 — Modelo Comercial

### Título
**Modelo comercial flexível para hospitais e cooperativas**

### Objetivo
Apresentar estrutura de contratação, pacotes e jornada comercial — alinhada ao posicionamento SaaS B2B healthcare.

### Texto executivo

**Proposta de valor comercial**

MedicFlow-AI é comercializado como **plataforma SaaS multi-tenant** com implantação assistida — não como projeto customizado de ERP.

**Pacotes sugeridos**

| Pacote | Público | Módulos incluídos | Implantação |
|--------|---------|-------------------|-------------|
| **Operacional** | UPA, clínica | Escalas, Plantões, Central RT | Piloto 3 dias |
| **Operacional + TISS** | Hospital 24h, clínica TISS | Operacional + TISS + Repasses | Piloto 5 dias |
| **Enterprise** | Hospital grande, cooperativa | Completo + Dashboard Executivo + IA | Piloto + go-live dedicado |

**Componentes de precificação (estrutura sugerida)**

| Componente | Descrição |
|------------|-----------|
| **Setup / implantação** | Piloto assistido, branding, provisionamento, smoke tests |
| **Licença mensal (SaaS)** | Por tenant, escalonável por unidades ou profissionais ativos |
| **Módulo TISS** | Add-on para ciclo faturamento + fechamento |
| **IA operacional** | Add-on opcional (Copilot, agentes) |
| **Suporte** | SLA por tier (standard / premium) |

**Jornada comercial**

```
1. Discovery (30 min) → 2. Demo guiada staging (45 min) → 3. Piloto (30 dias)
       → 4. Proposta comercial → 5. Go-live → 6. Customer success
```

**Diferenciais comerciais**

- Demo ao vivo em staging — 7 passos, 12 screenshots validados
- Piloto com KPIs baseline para medir ROI real
- White-label incluído — sem custo adicional de customização visual
- Transparência de escopo — documentação de gaps evita surpresas pós-contrato

> Valores específicos definidos na proposta comercial após discovery — este slide apresenta estrutura, não tabela de preços fechada.

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Funil comercial visual | Discovery → Demo → Piloto → Contrato → Go-live |
| **2ª opção** | Tabela de pacotes (3 colunas) | Operacional / +TISS / Enterprise |
| **3ª opção** | Quadrante valor §11 MEDICFLOW_PROPOSTA_DE_VALOR | Segmentos prioritários |

### Notas do apresentador

- Não apresente preço no primeiro encontro — foque valor e piloto.
- Piloto de 30 dias com KPIs baseline é o melhor closer — reduz risco percebido.
- Cooperativas: enfatize tenant dedicado + pool de profissionais + repasses.
- Enterprise: IA operacional e suporte premium como upsell.
- Tempo sugerido: **2 minutos**.

---

## Slide 15 — Chamada para demonstração

### Título
**Próximo passo: veja o MedicFlow-AI operando ao vivo**

### Objetivo
Fechar com call-to-action claro e tangível — agendar demo ou iniciar piloto.

### Texto executivo

**O MedicFlow-AI está pronto para demonstração comercial.**

| Recurso | Acesso |
|---------|--------|
| **Staging live** | `https://staging.medicflow.app.br` |
| **Demo guiada** | 7 passos em `/piloto` |
| **Screenshots** | 12 telas validadas em `docs/screenshots/` |
| **Documentação** | Pacote executivo completo em `docs/` |

**Demo guiada — roteiro de 7 passos**

1. `/piloto` — Abertura executiva
2. `/` — Operação do dia
3. `/central` — Central operacional
4. `/executivo` — Walkthrough executivo
5. `/tiss` — TISS e faturamento
6. `/instituicao` — Multi-tenant e branding
7. `/operacao` — Confiança operacional

**Elevator pitch final**

> MedicFlow-AI substitui planilhas e WhatsApp na gestão de plantões hospitalares, integrando operação, TISS e fechamento financeiro em plataforma segura, white-label e pronta para demo comercial.

**Call to action**

| Ação | Para quem | Próximo passo |
|------|-----------|---------------|
| **Demo executiva (45 min)** | Diretoria, sponsors | Agendar com roteiro 7 passos |
| **Piloto institucional (30 dias)** | Operação + financeiro | KPIs baseline + go-live |
| **Workshop técnico** | TI, compliance | Arquitetura, RLS, RBAC, auditoria |

**Contato comercial:** [inserir e-mail / telefone / calendly]

### Imagem / diagrama recomendado

| Prioridade | Asset | Descrição |
|------------|-------|-----------|
| **1ª opção** | Elevator pitch visual §bonus MEDICFLOW_SLIDES_COMERCIAIS | Problema → Solução → CTA |
| **2ª opção** | QR code para staging | Link direto para demo |
| **3ª opção** | Composição hero | Logo + URL staging + "Agende sua demo" |

### Notas do apresentador

- **Sempre fechar com data:** *"Podemos agendar a demo guiada para [dia] às [hora]?"*
- Ofereça escolha: demo executiva (45 min) ou piloto (30 dias) — ambos são CTAs válidos.
- Deixe material: link staging, este deck, proposta de valor.
- Agradecer e confirmar follow-up em 24h.
- Tempo sugerido: **1–2 minutos**.

---

## Apêndice — Checklist pré-apresentação

| Item | Verificado |
|------|:----------:|
| Staging acessível (`staging.medicflow.app.br`) | ☐ |
| Credenciais demo preparadas | ☐ |
| Roteiro `/piloto` testado (7 passos) | ☐ |
| Screenshots exportados em 1920×1080 | ☐ |
| Diagramas Mermaid exportados | ☐ |
| Gap sheet preparado (perguntas difíceis) | ☐ |
| Proposta comercial / calendly link | ☐ |

## Apêndice — Perguntas frequentes (FAQ comercial)

| Pergunta | Resposta sugerida |
|----------|-------------------|
| É prontuário eletrônico? | Não. É plataforma operacional + TISS MVP. Complementa EHR, não substitui. |
| Envia TISS para operadoras? | V1: export XML + registro manual. Envio automático no roadmap médio prazo. |
| Quanto tempo para go-live? | ~3 dias com piloto assistido e smoke tests. |
| Funciona no celular? | Sim — PWA responsivo, sem app store. |
| Quantos hospitais na mesma instância? | Multi-tenant com RLS — cada instituição isolada. |
| E a LGPD? | RLS Postgres, RBAC granular, audit logs, isolamento por tenant. |
| Tem notificação push/e-mail? | V1: in-app + Realtime. Push/e-mail no roadmap médio prazo. |

---

*Documento gerado com base na documentação executiva MedicFlow-AI V1. Sem alterações de código, banco ou staging.*

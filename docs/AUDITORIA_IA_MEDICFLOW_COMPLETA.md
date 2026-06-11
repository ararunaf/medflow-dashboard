# Auditoria Executiva Completa — Camada de IA MedicFlow-AI

**Data:** 11 de junho de 2026  
**Escopo:** Código-fonte em `MedFlow-IA/src/` (Vite + TanStack Start + Supabase)  
**Método:** Evidência exclusivamente no código — rotas, hooks, serviços, componentes, APIs e fluxos de navegação. Nenhuma funcionalidade inferida por nomenclatura isolada.

---

## Resumo da arquitetura

A camada de “IA” do MedicFlow-AI é composta por:

1. **Uma integração LLM real** — OpenAI Chat Completions via `fetch` server-side (`operational-gpt-openai.ts`).
2. **Uma plataforma de inteligência operacional heurística** — scoring, recomendações, agentes, orquestração, memória, policy intelligence e planejamento estratégico — **sem modelos de ML externos**.
3. **Supervisão humana obrigatória** — propostas, sandbox, execução e rollback exigem aprovação explícita; políticas explícitas de `no_autonomous_execution` nos agentes.

**Superfície única de UX de IA:** rota `/central` → `CommandCenterView`.

**Descoberta crítica de navegação:** `/central` **não aparece** no menu lateral (`navForRole` em `app-shell.tsx`). Acesso via links em `/`, `/executivo` e URL direta.

---

## Fase 1 — Inventário técnico completo

### 1.1 Hooks relacionados à IA / inteligência operacional

| Hook | Arquivo | Função comprovada | Consumidor(es) |
|------|---------|-------------------|----------------|
| `useOperationalCopilotDerived` | `src/hooks/use-operational-copilot-derived.ts` | Monta bundle semântico determinístico para Copilot (sem LLM) | `operational-copilot-gpt-panel.tsx`, `operational-copilot-context-panel.tsx` |
| `useOperationalAgentsBundleQuery` / `useOperationalAgentMutations` | `src/hooks/use-operational-agents.ts` | Ciclos de raciocínio e governança de agentes | `operational-active-agents-panel.tsx` |
| `useOperationalAgentCoordinationBundleQuery` / `Mutations` | `src/hooks/use-operational-agent-coordination.ts` | Coordenação multi-agente | `operational-agent-coordination-panel.tsx` |
| `useOperationalOrchestrationsQuery` / `Detail` / `Mutations` | `src/hooks/use-operational-orchestration.ts` | Orquestrações supervisionadas | `operational-orchestration-panel.tsx` |
| `useOperationalAnalyticsQuery` | `src/hooks/use-operational-analytics.ts` | KPIs históricos e tendências | `operational-analytics-panel.tsx`, copilot-derived |
| `useOperationalActionProposalsQuery` / `Mutations` | `src/hooks/use-operational-action-proposals.ts` | Fila de propostas de ação | `operational-action-proposals-panel.tsx`, orquestração |
| `useOperationalSandboxMutation` | `src/hooks/use-operational-execution-sandbox.ts` | Simulação dry-run | `operational-action-proposals-panel.tsx` |
| `useOperationalMutationExecutionsQuery` / `Mutations` | `src/hooks/use-operational-mutation-execution.ts` | Execução supervisionada pós-sandbox | `operational-supervised-execution-panel.tsx` (embutido em propostas) |
| `useOperationalCommandCenterQuery` | `src/hooks/use-operational-metrics.ts` | Snapshot agregado da central | `src/routes/central.tsx` |
| `useOperationalAlerts` | `src/hooks/use-operational-alerts.ts` | Feed de alertas rule-based | `command-center-view.tsx` |
| `useOperationalCriticalAlertsAudit` | `src/hooks/use-operational-timeline-signals.ts` | Sinais de auditoria | `command-center-view.tsx` |
| `useOperationalRealtime` | `src/hooks/use-operational-realtime.ts` | Invalidação Realtime Supabase | Suporte à `/central` |
| `useOperationalMonitoringQuery` | `src/hooks/use-operational-monitoring.ts` | Health check da plataforma | `/operacao` (não é painel de IA) |
| `useOperationalTimeline` | `src/hooks/use-operational-timeline.ts` | Timeline operacional | `operational-timeline-feed.tsx` |

**Hooks operacionais sem IA:** `use-operational-mutations.ts` (aceitar/recusar plantões), `use-operational-reconciliation.ts` (matching financeiro por regras SQL — **não é LLM/ML**).

**Não encontrados:** `use-ai-*`, `use-gpt-*`, `use-copilot-*` (exceto derived), `use-prediction-*`, `use-insight-*`.

---

### 1.2 Serviços e módulos de backend

#### Integração LLM (única)

| Artefato | Evidência |
|----------|-----------|
| `src/lib/server/operational-gpt-openai.ts` | `fetch("https://api.openai.com/v1/chat/completions")`; exige `MEDFLOW_OPENAI_API_KEY` ou `OPENAI_API_KEY` |
| `src/lib/operations/api/operational-copilot-gpt.ts` | Server function POST; RBAC `isOperationalManager`; modos `chat` (tools) e `executive_narrative` |
| `src/lib/operations/copilot-gpt/*` | Prompts, validador, context builder, 9 tools (8 read-only + 1 proposta supervisionada) |

#### Serviços de inteligência operacional (heurísticos)

| Serviço / módulo | Arquivo principal | Tipo |
|------------------|-------------------|------|
| Scoring | `src/lib/operations/scoring/operational-scoring-service.ts` | Regras numéricas sobre janela viva |
| Recomendações | `src/lib/operations/recommendations/operational-recommendation-service.ts` | Rule engine + registry de triggers |
| Forecast baseline | `src/lib/operations/recommendations/forecast-baseline.ts` | Heurística explícita: *“não é modelo de ML”* |
| Alertas | `src/lib/operations/alerts/engine` | Regras determinísticas |
| Analytics | `src/lib/operations/analytics/operational-analytics-service.ts` | Agregação SQL/KPIs |
| Agentes (4 tipos) | `src/lib/operations/agents/` + `operational-agent-service.ts` | Raciocínio scoped, sem LLM |
| Coordenação | `operational-agent-coordination-service.ts` | Ciclos multi-agente |
| Orquestração | `operational-orchestration-service.ts` | Workflows supervisionados |
| Propostas | `operational-action-proposal-service.ts` | CRUD + bridge GPT (`submitOperationalActionProposalFromGpt`) |
| Sandbox | `operational-execution-sandbox-service.ts` + `dry-run-simulators.ts` | Simulação pura, sem DB write |
| Execução | `operational-mutation-execution-service.ts` | Mutações reais pós-aprovação + rollback |
| Memória | `operational-memory-service.ts` | Effectiveness tracking (sem RL) |
| Priorização adaptativa | `operational-adaptive-prioritization-service.ts` | Reordenação por sinais históricos |
| Policy intelligence | `operational-policy-intelligence-service.ts` + `policy-insight-engine.ts` | Análise heurística de governança |
| Planejamento estratégico | `strategic-operational-planning-engine.ts` | Ciclos explicáveis, sem execução auto |
| Feedback | `operational-feedback-service.ts` | Overlay de efetividade de recomendações |
| Contexto Copilot | `copilot-context/operational-copilot-context-service.ts` | Assembly determinístico |

#### Variáveis de ambiente (IA)

| Variável | Uso |
|----------|-----|
| `MEDFLOW_OPENAI_API_KEY` | Chave primária server-side |
| `OPENAI_API_KEY` | Fallback |
| `MEDFLOW_OPENAI_MODEL` | Default `gpt-4o-mini` |

**Ausente no `package.json`:** SDK OpenAI, Anthropic, LangChain, embeddings, Whisper.

---

### 1.3 Componentes de UI (IA)

Todos montados em `src/components/operational/command-center-view.tsx` na rota `/central`:

| Componente | LLM? | RBAC UI |
|------------|------|---------|
| `operational-scoring-panel.tsx` | Não | Todos na central |
| `operational-recommendations-panel.tsx` | Não | Todos; feedback só `isOperationalManager` |
| `operational-adaptive-prioritization-panel.tsx` | Não | Governança: managers |
| `operational-memory-panel.tsx` | Não | Governança: managers |
| `operational-policy-intelligence-panel.tsx` | Não | Governança: managers |
| `operational-strategic-planning-panel.tsx` | Não | Dados só para managers (loader) |
| `operational-copilot-context-panel.tsx` | Não | `canSee` → managers |
| `operational-copilot-gpt-panel.tsx` | **Sim** | `canSee` → managers |
| `operational-action-proposals-panel.tsx` | Não | `enabled={canAudit}` |
| `operational-orchestration-panel.tsx` | Não | `enabled={canAudit}` |
| `operational-active-agents-panel.tsx` | Não | `enabled={canAudit}` |
| `operational-agent-coordination-panel.tsx` | Não | `enabled={canAudit}` |
| `operational-analytics-panel.tsx` | Não | `isOperationalManager` |
| `operational-alert-feed.tsx` | Não | Todos |
| `operational-timeline-feed.tsx` | Não | Todos |
| `operational-sandbox-preview.tsx` | Não | Embutido em propostas |
| `operational-supervised-execution-panel.tsx` | Não | Embutido em propostas aprovadas |

---

### 1.4 Rotas

| Rota | IA dedicada? | Evidência |
|------|--------------|-----------|
| `/central` | **Sim — única superfície completa** | `src/routes/central.tsx` → `CommandCenterView` |
| `/` | Link para central | `index.tsx` L135–138 |
| `/executivo` | Link quick action | `executivo.tsx` L155–166 |
| `/operacao` | Não (health/logs) | Sem painéis Copilot/agentes |
| `/piloto` | Não (onboarding/demo) | Demo guiada não inclui etapa IA explícita |
| `/escalas`, `/plantoes` | Não | CRUD e mutações humanas |
| `/financeiro/*`, `/tiss` | Não | KPIs e conciliação rule-based |
| `/ai`, `/copilot`, `/agent`, `/insight` | **Não existem** | — |

**RBAC de rota `/central`:** sem `beforeLoad` restritivo — qualquer usuário autenticado pode abrir a URL; painéis internos filtram por `isOperationalManager` (`super_admin`, `tenant_admin`, `coordinator`).

---

## Fase 2 — Classificação funcional

### Legenda

- **A** — Produção/staging funcional (tela + fluxo + ação + resultado)
- **B** — Implementado mas não exposto (código pronto, acesso difícil ou ausente na navegação)
- **C** — Parcialmente implementado
- **D** — Roadmap / placeholder / ausente

---

### Matriz por recurso

| Recurso | Categoria | Justificativa (evidência) |
|---------|-----------|---------------------------|
| Copilot GPT (chat + narrativa) | **A** / **C*** | UI + API completos; *falha sem `MEDFLOW_OPENAI_API_KEY`* |
| Copilot Context (sem LLM) | **A** | Painel renderiza bundle semântico; hook + service |
| Scoring operacional | **A** | Painel + cálculo live no command center |
| Recomendações + forecast | **A** | Painel + feedback mutation; forecast heurístico |
| Alertas operacionais | **A** | Feed com regras explícitas; Realtime |
| Analytics operacional | **A** | Painel KPIs/tendências para managers |
| Priorização adaptativa | **A** | Painel + `recordAdaptivePriorityTransitionFn` |
| Memória operacional | **A** | Painel + `patchOperationalMemoryStateFn` |
| Policy intelligence | **A** | Painel + `runOperationalPolicyIntelligenceAnalysisFn` |
| Planejamento estratégico | **A** | Painel + ciclos; desabilitado server-side para não-managers |
| Agentes operacionais (4) | **A** | Painel + `runOperationalAgentReasoningCyclesFn` |
| Coordenação multi-agente | **A** | Painel + API de ciclos |
| Orquestração supervisionada | **A** | Painel + 9 server functions |
| Propostas de ação | **A** | Painel + sandbox + aprovação humana |
| Execução supervisionada | **A** | Service completo com rollback; UI em propostas |
| Tools GPT (9 functions) | **A** | Registry + executor com queries Supabase |
| Rota `/central` no menu | **B** | Rota existe; **ausente** em `navForRole()` |
| Matching médico ↔ turno (captação) | **D** | Nenhum serviço/hook/componente encontrado |
| Convocação automática por IA | **D** | Fluxo manual + Realtime apenas |
| IA clínica (prontuário, anamnese) | **D** | Ausente |
| Embeddings / busca semântica | **D** | Ausente |
| Matching financeiro conciliação | **A**† | Funcional em `/financeiro/conciliacao-operacional`; **† rule-based, não LLM** |

---

## Fase 3 — Matriz executiva

| Recurso IA | Tela | Arquivo principal | Status | Usuário final utiliza? | Categoria |
|------------|------|-------------------|--------|------------------------|-----------|
| Copilot GPT | `/central` | `operational-copilot-gpt-panel.tsx` | Requer chave OpenAI | Sim — coordinator/admin com chave | A/C |
| Copilot Context | `/central` | `operational-copilot-context-panel.tsx` | Funcional | Sim — coordinator/admin | A |
| Scoring | `/central` | `operational-scoring-panel.tsx` | Funcional | Sim — todos autenticados | A |
| Recomendações | `/central` | `operational-recommendations-panel.tsx` | Funcional | Sim — feedback só managers | A |
| Forecast baseline | `/central` (em recomendações) | `forecast-baseline.ts` | Heurístico | Sim — indireto | A |
| Alertas | `/central` | `operational-alert-feed.tsx` | Funcional | Sim — todos | A |
| Analytics | `/central` | `operational-analytics-panel.tsx` | Funcional | Sim — managers | A |
| Priorização adaptativa | `/central` | `operational-adaptive-prioritization-panel.tsx` | Funcional | Sim — managers governam | A |
| Memória operacional | `/central` | `operational-memory-panel.tsx` | Funcional | Sim — managers | A |
| Policy intelligence | `/central` | `operational-policy-intelligence-panel.tsx` | Funcional | Sim — managers | A |
| Planejamento estratégico | `/central` | `operational-strategic-planning-panel.tsx` | Funcional | Sim — managers | A |
| Agentes (4 tipos) | `/central` | `operational-active-agents-panel.tsx` | Funcional | Sim — managers | A |
| Coordenação agentes | `/central` | `operational-agent-coordination-panel.tsx` | Funcional | Sim — managers | A |
| Orquestração | `/central` | `operational-orchestration-panel.tsx` | Funcional | Sim — managers | A |
| Propostas de ação | `/central` | `operational-action-proposals-panel.tsx` | Funcional | Sim — managers | A |
| Sandbox + execução | `/central` (em propostas) | `operational-supervised-execution-panel.tsx` | Funcional | Sim — managers (fluxo longo) | A |
| Central no menu lateral | — | `app-shell.tsx` | **Não listada** | Parcial — URL/links | B |
| Matching plantão | — | — | **Ausente** | Não | D |
| IA financeira/TISS | `/tiss`, `/financeiro` | — | **Ausente** | Não | D |

---

## Fase 4 — IA na captação de plantões

### Perguntas respondidas

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Existe IA atuando nesses processos? | **Parcialmente.** IA/heurística atua na **interpretação** de risco de cobertura, recomendações de staffing e alertas — via `/central`. **Não** atua em CRUD de escalas, aceite de plantões, convocações ou matching automático. |
| 2 | O usuário percebe a IA? | **Managers sim** (painéis rotulados “IA”, “Copiloto”, “Agentes”). **Médicos não** — em `/plantoes` e `/escalas` não há UI de IA. |
| 3 | Benefício operacional entregue? | Antecipação de risco de cobertura, recomendações de mitigação, narrativa em linguagem natural (com GPT), propostas supervisionadas — **não** automação de convocação/atribuição. |
| 4 | Evidência no código? | `plantoes.tsx`: apenas `useAcceptAssignment`, `useRejectAssignment`, `useApproveSwap` — mutações humanas. `forecast-baseline.ts` L2–3: projeção heurística. Agente `coverage_agent` em `registry.ts`: scopes `shifts`, `staffing_window` — **readonly**. Kind `assignment_suggestion` existe em propostas mas **sem auto-assign** em plantões. |

### Tabela por processo

| Processo | Rota | IA presente? | Evidência |
|----------|------|--------------|-----------|
| Escalas | `/escalas` | Não | Hooks `use-operations` — CRUD |
| Plantões abertos | `/plantoes` | Não | Aceite/recusa manual |
| Convocações | — | Não | Realtime visibility only |
| Coberturas | `/central` | Sim (análise) | Scoring + recomendações + Copilot |
| Substituições (swaps) | `/plantoes` + `/central` | Análise only | Swaps manuais; Copilot read-only |
| Matching profissional-turno | — | **Não implementado** | Busca sem resultados |

---

## Fase 5 — IA no hub administrativo

| Módulo | Rota | IA atua? | Como / onde | Valor |
|--------|------|----------|-------------|-------|
| Central operacional | `/central` | **Sim** | 14 painéis de inteligência | Interpretação, governança, propostas |
| Dashboard executivo | `/executivo` | Não | KPIs comerciais + link para central | Narrativa comercial, não LLM |
| Dashboard financeiro | `/financeiro/dashboard-executivo` | Não | Snapshots numéricos | — |
| Financeiro / TISS | `/financeiro`, `/tiss` | Não | CRUD e rollups | — |
| Fechamento | `/financeiro/fechamento-operacional` | Não | Competência + trava | — |
| Conciliação | `/financeiro/conciliacao-operacional` | Não* | Matching SQL (`reconciliation-matching-service.ts`) | *Automático rule-based, não IA generativa |
| Indicadores | `/central`, TISS | Parcial | Cobertura/scoring na central | Operacional sim; financeiro não |
| Auditoria IA | `/operacao` | Indireto | Logs/health; sem painel de mutações IA dedicado | Suporte a incidentes |

---

## Fase 6 — Inventário comercial

Ver documento dedicado: [`MATRIZ_IA_COMERCIAL.md`](./MATRIZ_IA_COMERCIAL.md).

---

## Fase 7 — Material para vendas

Ver documento dedicado: [`MEDICFLOW_INTELIGENCIA_ARTIFICIAL_V1.md`](./MEDICFLOW_INTELIGENCIA_ARTIFICIAL_V1.md).

---

## Fase 8 — Conclusão executiva

| Métrica | Valor |
|---------|-------|
| **Recursos de IA / inteligência operacional mapeados** | **18 módulos distintos** (1 LLM + 17 heurísticos/supervisionados) |
| **Acessíveis ao usuário final (com perfil adequado)** | **17** — todos em `/central`; Copilot GPT = **16** sem chave OpenAI |
| **Ocultos / baixa discoverability** | **1** — rota `/central` fora do menu principal |
| **Incompletos ou condicionais** | **2** — Copilot GPT (depende de env); matching plantão (ausente) |
| **Comercializável como plataforma com IA?** | **Sim, com ressalvas:** posicionar como *inteligência operacional supervisionada* + *copiloto GPT opcional*; exigir configuração de chave; incluir `/central` na demo com perfil `coordinator` |
| **Maior valor percebido (hospitais/cooperativas)** | (1) Scoring + alertas + recomendações de cobertura; (2) Copilot GPT para perguntas em linguagem natural; (3) Fluxo proposta → sandbox → execução supervisionada |

---

## Anexo — Tools do Copilot GPT

| Tool | Tipo | Função |
|------|------|--------|
| `get_operational_timeline` | Read-only | Timeline tenant |
| `get_shift_details` | Read-only | Detalhe plantão |
| `get_swap_details` | Read-only | Detalhe swap |
| `get_operational_kpis` | Read-only | KPIs |
| `get_forecast_snapshot` | Read-only | Forecast heurístico |
| `get_recommendation_details` | Read-only | Recomendações |
| `get_recent_alerts` | Read-only | Alertas |
| `get_operational_events` | Read-only | Eventos auditáveis |
| `submit_operational_action_proposal` | Supervisionada | Registra proposta — **não executa** |

---

## Anexo — Agentes operacionais registrados

| Agente | Domínio | Política explícita |
|--------|---------|-------------------|
| `coverage_agent` | Cobertura e escalas | `no_autonomous_execution` |
| `coordination_agent` | Swaps e assignments | `no_autonomous_execution` |
| `risk_agent` | Risco e deterioração | `no_autonomous_execution` |
| `recommendation_agent` | Mitigação e priorização | `no_autonomous_execution` |

---

*Auditoria baseada exclusivamente no código-fonte disponível em `MedFlow-IA/src/` em 11/06/2026.*

# MedicFlow-AI — Inteligência Artificial V1

**Documento comercial-técnico**  
**Base:** Auditoria de código-fonte — junho/2026  
**Princípio:** Apenas funcionalidades com evidência comprovada no repositório.

---

## Visão em uma frase

O MedicFlow-AI entrega **inteligência operacional supervisionada** para gestão de plantões e cobertura, com um **copiloto GPT opcional** (OpenAI) que interpreta o contexto em linguagem natural — **sem execução autônoma** de plantões, trocas ou atribuições.

---

## O que já está disponível hoje

Funcionalidades com tela, fluxo, ação do usuário e resultado visível — rota **`/central` (Central operacional)**.

### Copiloto operacional (GPT)

- **O quê:** Painel de chat e botão “Narrativa executiva”.
- **Como acessar:** `/central` → seção “Copiloto operacional (IA)”.
- **Quem:** Coordinator, tenant admin, super admin.
- **Pré-requisito:** Variável `MEDFLOW_OPENAI_API_KEY` no servidor.
- **O que faz:** Responde perguntas sobre cobertura, alertas, recomendações e forecast; expande contexto via 8 tools read-only; pode registrar proposta supervisionada (sem executar).
- **O que não faz:** Não confirma plantões, não aprova swaps, não atribui médicos automaticamente.
- **Evidência:** `operational-copilot-gpt-panel.tsx`, `operational-gpt-openai.ts`.

### Contexto semântico do copiloto (sem LLM)

- Cartões auditáveis com fingerprint do snapshot operacional.
- Alimenta o GPT e funciona independentemente da chave OpenAI.
- **Evidência:** `operational-copilot-context-panel.tsx`, `use-operational-copilot-derived.ts`.

### Scoring e saúde operacional

- Scores de cobertura, coordenação, workforce e risco consolidado.
- Badge de saúde (saudável → crítico).
- **Visível para:** Todos os usuários que acessam `/central`.
- **Evidência:** `operational-scoring-panel.tsx`, `operational-scoring-service.ts`.

### Recomendações operacionais

- Sugestões categorizadas: mitigação, coordenação, staffing, escalação, monitoramento.
- Estados: sugerido → recomendado → urgente.
- Feedback humano (aceita/dispensada/executada) para managers.
- **Evidência:** `operational-recommendations-panel.tsx`, `recommendation-feedback.ts`.

### Forecast operacional (baseline heurístico)

- Projeções: estável, deterioração, projeção crítica.
- Baseado em scores, urgência e alertas — **não é machine learning**.
- **Evidência:** `forecast-baseline.ts` (comentário explícito no código).

### Alertas em tempo real

- Regras determinísticas (cobertura baixa, swaps críticos, conflitos, etc.).
- Atualização via Supabase Realtime.
- **Evidência:** `operational-alert-feed.tsx`, `alerts/engine`.

### Analytics operacional

- KPIs históricos: cobertura, latência de confirmação, swaps, disponibilidade.
- Mini tendências visuais.
- **Quem:** Managers (`isOperationalManager`).
- **Evidência:** `operational-analytics-panel.tsx`.

### Priorização adaptativa

- Reordenação de recomendações com base em sinais históricos.
- Transições supervisionadas (validar/rejeitar ajustes).
- **Evidência:** `operational-adaptive-prioritization-panel.tsx`.

### Memória operacional

- Registro de efetividade (recomendações, execuções, rollbacks, coordenação).
- Governança: validar/arquivar entradas.
- **Evidência:** `operational-memory-panel.tsx`.

### Policy intelligence

- Análise de políticas de governança com achados e recomendações explicáveis.
- Botão “Executar análise” persiste ciclo auditável.
- **Evidência:** `operational-policy-intelligence-panel.tsx`, `policy-insight-engine.ts`.

### Planejamento estratégico operacional

- Ciclos de readiness, pressões projetadas e roadmaps explicáveis.
- Sem execução automática de planos.
- **Evidência:** `operational-strategic-planning-panel.tsx`.

### Agentes operacionais (4 agentes)

| Agente | Foco |
|--------|------|
| Cobertura | Lacunas de escala, staffing |
| Coordenação | Swaps, assignments, conflitos |
| Risco | Scoring, deterioração, pressão |
| Recomendações | Priorização de mitigação |

- Ciclos de raciocínio com aprovação/bloqueio humano.
- Política universal: **sem execução autônoma**.
- **Evidência:** `operational-active-agents-panel.tsx`, `agents/registry.ts`.

### Coordenação multi-agente

- Ciclos colaborativos entre agentes com supervisão explícita.
- **Evidência:** `operational-agent-coordination-panel.tsx`.

### Orquestração supervisionada

- Workflows multi-etapa: planejamento → aprovação → simulação → execução → rollback.
- **Evidência:** `operational-orchestration-panel.tsx`, `operational-orchestration-service.ts`.

### Propostas de ação + sandbox + execução

- Fila de propostas (incl. originadas pelo GPT).
- Simulação dry-run antes de qualquer mutação real.
- Execução supervisionada com rollback manual.
- **Evidência:** `operational-action-proposals-panel.tsx`, `operational-mutation-execution-service.ts`.

---

## O que está em implantação (parcial)

| Item | Status | Gap |
|------|--------|-----|
| **Copilot GPT** | Código completo | Inoperante sem `MEDFLOW_OPENAI_API_KEY`; mensagem de erro explícita ao usuário |
| **Discoverability da Central** | Rota funcional | **Ausente no menu lateral** — depende de links em Home/Executivo ou URL direta |
| **Perfil médico** | Acesso parcial à central | Vê scoring/alertas; **não** vê Copilot, agentes, orquestração |
| **Propostas → execução real** | Pipeline completo no código | Fluxo longo (aprovação + sandbox + confirmação); adoção depende de operação |

---

## Roadmap IA

Itens **não encontrados** no código — classificados por horizonte sugerido para planejamento comercial.

### Curto prazo (0–3 meses)

- Incluir **“Central operacional”** no menu lateral (`navForRole`).
- Documentar e automatizar checklist de **`MEDFLOW_OPENAI_API_KEY`** no deploy.
- Etapa dedicada de IA no **demo guiado** (`/piloto`).

### Médio prazo (3–9 meses)

- **Matching inteligente** médico ↔ turno (convocação assistida).
- Notificações proativas (push/e-mail) baseadas em recomendações urgentes.
- Testes E2E dos fluxos Copilot + propostas.

### Longo prazo (9+ meses)

- IA clínica (prontuário, anamnese) — **ausente hoje**.
- Embeddings / busca semântica em histórico operacional.
- Modelos preditivos de demanda (ML real vs. heurística atual).

---

## Como demonstrar na V1

1. Login como **coordinator** (escalista).
2. Navegar para **`/central`** (link “Central operacional” na Home ou Executivo).
3. Mostrar **scoring + recomendações + alertas** (funcionam sem OpenAI).
4. Configurar **`MEDFLOW_OPENAI_API_KEY`** no staging.
5. No painel Copilot, pergunta sugerida: *“Quais turnos têm risco de cobertura neste fim de semana?”*
6. Mostrar **agentes** e **proposta supervisionada** (governança humana).
7. Reforçar guardrails: read-only, sem diagnóstico clínico, sem ações automáticas.

---

## Posicionamento comercial honesto

| Pode afirmar | Não pode afirmar |
|--------------|------------------|
| “Copiloto GPT operacional com guardrails” | “IA atribui plantões automaticamente” |
| “Agentes de cobertura, risco e coordenação” | “Matching inteligente de profissionais” |
| “Recomendações e scoring em tempo real” | “IA no faturamento TISS” |
| “Human-in-the-loop em todas as ações” | “Machine learning preditivo” (hoje é heurística) |
| “Forecast de deterioração operacional” | “IA clínica integrada” |

---

## Dependências técnicas

| Componente | Dependência |
|------------|-------------|
| Copilot GPT | OpenAI API + chave server-side |
| Demais módulos | Supabase + dados operacionais do tenant |
| Realtime | Supabase Realtime (shifts, assignments, swaps) |

---

*Documento V1 — gerado a partir de auditoria de código. Revisar a cada release significativa da camada operacional.*

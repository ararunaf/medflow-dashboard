# Matriz IA Comercial — MedicFlow-AI

**Uso:** Apresentações comerciais, propostas e demos executivas.  
**Critério de status:** Evidência no código-fonte (`MedFlow-IA/src/`).

---

## Legenda de status

| Status | Significado |
|--------|-------------|
| **Disponível** | Tela + fluxo + resultado — usuário utiliza hoje |
| **Condicional** | Disponível com pré-requisito (ex.: chave OpenAI) |
| **Parcial** | Implementado com gap de UX, perfil ou configuração |
| **Não disponível** | Ausente no código ou apenas documentação |

---

## Matriz principal

| Funcionalidade IA | Público | Benefício | Status |
|-------------------|---------|-----------|--------|
| Copiloto GPT (perguntas + narrativa executiva) | Escalista, Administrador | Interpreta cobertura, alertas e riscos em linguagem natural | **Condicional** — requer `MEDFLOW_OPENAI_API_KEY` |
| Contexto semântico do copiloto | Escalista, Administrador | Visão consolidada auditável do snapshot operacional | **Disponível** |
| Scoring de saúde operacional | Escalista, Administrador, Médico* | Indica saúde da operação (cobertura, coordenação, risco) | **Disponível** — *médico vê na central, sem copilot |
| Recomendações operacionais | Escalista, Administrador | Ações sugeridas: mitigação, staffing, escalação | **Disponível** |
| Feedback em recomendações | Escalista, Administrador | Loop de aprendizado operacional (efetividade) | **Disponível** |
| Forecast de deterioração | Escalista, Administrador | Antecipa piora operacional na janela | **Disponível** — heurístico, não ML |
| Alertas inteligentes (regras) | Escalista, Administrador, Médico | Sinalização proativa de riscos (cobertura, swaps, conflitos) | **Disponível** |
| Analytics operacional (KPIs + tendências) | Escalista, Administrador | Histórico de cobertura, latências, pressão | **Disponível** |
| Priorização adaptativa | Escalista, Administrador | Reordena prioridades com base em histórico | **Disponível** |
| Memória operacional | Escalista, Administrador | Rastreia efetividade de ações e recomendações | **Disponível** |
| Policy intelligence | Escalista, Administrador | Recomenda ajustes de governança e thresholds | **Disponível** |
| Planejamento estratégico operacional | Escalista, Administrador | Roadmaps e ciclos de readiness explicáveis | **Disponível** |
| Agentes de cobertura | Escalista, Administrador | Análise de lacunas de escala e staffing | **Disponível** |
| Agentes de coordenação | Escalista, Administrador | Análise de filas de swap e conflitos | **Disponível** |
| Agentes de risco | Escalista, Administrador | Consolida scoring e projeção de deterioração | **Disponível** |
| Agentes de recomendação | Escalista, Administrador | Prioriza mitigações operacionais | **Disponível** |
| Coordenação multi-agente | Escalista, Administrador | Orquestra raciocínio entre agentes com supervisão | **Disponível** |
| Orquestração supervisionada | Escalista, Administrador | Workflows multi-etapa com aprovação humana | **Disponível** |
| Propostas de ação (IA → humano) | Escalista, Administrador | Registra intenção auditável antes de qualquer execução | **Disponível** |
| Sandbox de simulação | Escalista, Administrador | Dry-run de impacto antes de mutações | **Disponível** |
| Execução supervisionada + rollback | Escalista, Administrador | Aplica mudanças aprovadas com trilha e reversão | **Disponível** |
| Central operacional no menu | Todos | Discoverability do hub de IA | **Parcial** — rota existe, menu lateral omite |
| Matching automático médico-turno | Escalista, Cooperativa | Convocação inteligente por perfil/disponibilidade | **Não disponível** |
| IA em escalas/plantões (CRUD) | Médico, Escalista | Automação de aceite, convocação, substituição | **Não disponível** |
| IA no financeiro / TISS | Administrador, Financeiro | Conciliação, glosas, fechamento assistido por LLM | **Não disponível** |
| IA clínica | Médico, Hospital | Anamnese, prontuário, transcrição | **Não disponível** |
| Conciliação — matching rule-based | Financeiro, Administrador | Cruza esperado vs. recebido por competência/lote | **Disponível** — *não é IA generativa* |

---

## Matriz por persona

### Hospital

| Funcionalidade | Status | Nota comercial |
|----------------|--------|----------------|
| Scoring + alertas de cobertura | Disponível | Reduz risco de plantão descoberto |
| Copilot GPT | Condicional | Diferencial em demo — requer chave |
| Agentes + orquestração | Disponível | Governança para operação complexa |
| IA clínica | Não disponível | Não prometer |

### Cooperativa

| Funcionalidade | Status | Nota comercial |
|----------------|--------|----------------|
| Recomendações de staffing | Disponível | Apoia gestão de pool de médicos |
| Analytics de confirmação/latência | Disponível | KPIs para SLA com hospitais |
| Matching automático | Não disponível | Gap explícito — roadmap |
| Copilot GPT | Condicional | Perguntas sobre cobertura multi-unidade (por tenant) |

### Escalista (coordinator)

| Funcionalidade | Status | Nota comercial |
|----------------|--------|----------------|
| Central operacional completa | Disponível | Persona principal da demo IA |
| Copilot + agentes + propostas | Disponível/Condicional | Perfil `isOperationalManager` |
| Plantões (/plantoes) | Disponível | Operacional manual — sem IA na tela |

### Médico (professional)

| Funcionalidade | Status | Nota comercial |
|----------------|--------|----------------|
| Alertas na central | Disponível | Se acessar `/central` |
| Copilot / agentes | Não disponível | RBAC oculta painéis |
| Aceitar/recusar plantões | Disponível | Fluxo humano em `/plantoes` |

### Administrador (tenant_admin)

| Funcionalidade | Status | Nota comercial |
|----------------|--------|----------------|
| Stack completa de IA operacional | Disponível | Mesmo acesso que coordinator |
| Policy intelligence + planejamento | Disponível | Governança institucional |
| Painel ops (/operacao) | Disponível | Health — não é UX de IA |
| Financeiro/TISS com IA | Não disponível | — |

---

## Mensagens comerciais recomendadas

### Elevator pitch (30 segundos)

> “O MedicFlow-AI coloca uma central operacional inteligente na gestão de plantões: scoring de cobertura, recomendações explicáveis, agentes supervisionados e um copiloto GPT que responde em português — sempre com humano no loop, sem automação clínica.”

### Diferencial verificável

1. **Human-in-the-loop** — políticas `no_autonomous_execution` em todos os agentes.
2. **Explicabilidade** — fingerprints, tool trace, referências a scores/recomendações.
3. **Copiloto opcional** — camada GPT sobre dados reais do tenant via tools server-side.

### Riscos comerciais (transparência)

| Risco | Mitigação na demo |
|-------|-------------------|
| Chave OpenAI ausente | Mostrar módulos heurísticos primeiro; GPT como “plus” |
| Central fora do menu | Navegar via Home → link ou URL `/central` |
| Expectativa de matching | Declarar roadmap; mostrar recomendações de staffing |

---

## Checklist demo comercial (IA)

- [ ] Ambiente com `MEDFLOW_OPENAI_API_KEY` configurada
- [ ] Login **coordinator**
- [ ] Abrir `/central`
- [ ] Mostrar scoring + recomendação urgente (se houver dados)
- [ ] Pergunta Copilot sobre cobertura do fim de semana
- [ ] Mostrar agente de cobertura + ciclo de raciocínio
- [ ] Mencionar proposta supervisionada (não executar em produção na demo)
- [ ] Reforçar: **não** confirma plantão automaticamente

---

*Matriz V1 — junho/2026. Atualizar quando `/central` entrar no menu ou matching for implementado.*

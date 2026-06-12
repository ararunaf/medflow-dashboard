# Piloto Comercial — Plano de 30 Dias

**Documento:** GTM-2 — Fase 3  
**Data:** 11/06/2026  
**Versão:** V1  
**Escopo:** Hospitais, cooperativas médicas, empresas de gestão de escalas e grupos de plantonistas  
**Ambiente de referência:** `https://staging.medicflow.app.br`

---

## Visão geral

Este plano descreve um piloto comercial de **30 dias** com implantação **assistida** (modelo atual do produto). O MedicFlow-AI **não possui onboarding self-service** — cada piloto exige provisionamento manual de tenant, usuários e dados iniciais pela equipe MedicFlow ou TI do cliente.

**Público-alvo do piloto:**

| Segmento | Foco principal | Rotas-chave |
|----------|----------------|-------------|
| Hospital / UPA | Cobertura de plantões + TISS | `/escalas`, `/central`, `/tiss` |
| Cooperativa médica | Captação + repasses | `/plantoes`, `/tiss`, `/executivo` |
| Gestão de escalas | Publicação e confirmação | `/escalas`, `/plantoes`, `/central` |
| Grupo de plantonistas | Aceite e disponibilidade | `/plantoes`, `/perfil` |

**Pré-requisitos antes do Dia 1:**

- Tenant criado (SQL / Supabase)
- Mínimo 4 usuários provisionados (admin, escalista, 2 profissionais)
- Branding básico em `/instituicao`
- 2–3 unidades/setores cadastrados
- Smoke tests passando em `/lancamento`

---

## Semana 1 — Fundação e ativação (Dias 1–7)

### Objetivos

- Validar acesso de todos os perfis
- Concluir branding e parametrização institucional
- Executar demo guiada (7 passos) com stakeholders-chave
- Publicar primeira escala com plantões abertos
- Estabelecer ritmo operacional diário

### Atividades

| Dia | Atividade | Responsável | Rota / artefato |
|-----|-----------|-------------|-----------------|
| 1 | Kick-off comercial + alinhamento de escopo | MedicFlow + sponsor cliente | Call |
| 1 | Login de todos os perfis provisionados | Admin cliente | `/login` |
| 1–2 | Branding (logo, cores, contato) | Admin | `/instituicao` |
| 2 | Demo guiada com diretoria/operação | MedicFlow | `/piloto` → 7 passos |
| 2–3 | Cadastro de convênios (reais ou seed demo) | Financeiro / admin | `/tiss` |
| 3–4 | Criação de 1ª escala + 5–10 turnos | Escalista | `/escalas` |
| 4–5 | Profissionais aceitam plantões abertos | Médicos | `/plantoes` |
| 5–7 | Ativação de disponibilidade (5+ profissionais) | Médicos | `/perfil` |
| 7 | Revisão de health operacional | MedicFlow + TI | `/operacao`, `/lancamento` |

### Métricas — Semana 1

| Métrica | Meta | Como medir |
|---------|------|------------|
| Usuários com login bem-sucedido | 100% dos provisionados | Audit log + confirmação manual |
| Branding configurado | Logo + nome + contato | Painel readiness em `/instituicao` |
| Demo guiada concluída | ≥ 1 sessão com sponsor | Flag em `/piloto` |
| Escalas publicadas | ≥ 1 | Contagem em `/escalas` |
| Plantões abertos publicados | ≥ 5 | Status `open` em shifts |
| Primeiras aceitações | ≥ 3 | `shift_assignments` confirmados |
| Smoke tests | 100% passando | `/lancamento` |

### Critério de avanço

Semana 1 concluída se: **≥ 80% dos usuários logaram**, **≥ 1 escala ativa** e **≥ 3 plantões com fluxo aceite/confirmação iniciado**.

---

## Semana 2 — Operação e IA (Dias 8–14)

### Objetivos

- Estabelecer rotina diária de escalista e médicos
- Demonstrar valor da Central de IA Operacional
- Exercitar trocas (swaps) e alertas de cobertura
- Ampliar volume operacional (2ª escala, mais turnos)

### Atividades

| Dia | Atividade | Responsável | Rota |
|-----|-----------|-------------|------|
| 8 | Treinamento escalista (30 min) | MedicFlow | `/escalas`, `/central` |
| 8–9 | Treinamento médicos (15 min cada) | Escalista + MedicFlow | `/plantoes`, `/perfil` |
| 9–10 | Publicação 2ª escala + turnos fim de semana | Escalista | `/escalas` |
| 10–12 | Uso diário da Central de IA | Escalista / admin | `/central` |
| 11–13 | Simular 1–2 trocas de plantão | Médicos | `/plantoes?tab=swaps` |
| 12–14 | Revisão de alertas (cobertura, sem confirmação) | Escalista | `/central` → ações contextuais |
| 14 | Checkpoint operacional (call 30 min) | MedicFlow + sponsor | — |

### Métricas — Semana 2

| Métrica | Meta | Como medir |
|---------|------|------------|
| DAU (usuários ativos/dia) | ≥ 50% dos provisionados | Sessões / audit |
| Plantões confirmados | ≥ 10 acumulados | Dashboard `/` |
| Taxa de confirmação | ≥ 70% dos aceitos | pending → confirmed |
| Acessos à Central de IA | ≥ 3×/semana (escalista) | Navegação + eventos piloto |
| Swaps processados | ≥ 1 | `/plantoes?tab=swaps` |
| Alertas resolvidos | ≥ 50% dos emitidos | Central operacional |
| Tempo médio aceite → confirmação | < 24h | Timestamps assignments |

### Critério de avanço

Semana 2 concluída se: **escalista usa `/escalas` ≥ 3×/semana**, **≥ 10 plantões confirmados** e **Central de IA acessada pelo menos 1× por dia útil**.

---

## Semana 3 — Financeiro e TISS (Dias 15–21)

### Objetivos

- Conectar operação executada ao ciclo financeiro
- Demonstrar fluxo TISS (convênio → guia → lote → XML)
- Abrir competência financeira e gerar snapshot
- Validar dashboard executivo com KPIs reais

### Atividades

| Dia | Atividade | Responsável | Rota |
|-----|-----------|-------------|------|
| 15 | Treinamento financeiro (45 min) | MedicFlow | `/tiss`, `/executivo` |
| 15–16 | Cadastro TUSS + guias TISS (5+) | Financeiro | `/tiss` |
| 16–17 | Vincular produção a plantões executados | Financeiro | `/tiss` → Produção |
| 17–18 | Criar lote TISS + exportar XML | Financeiro | `/tiss` → Lotes |
| 18 | Abrir competência do mês | Financeiro | `/financeiro/fechamento-operacional` |
| 19 | Gerar snapshot financeiro | Financeiro | Fechamento |
| 20 | Walkthrough executivo com diretoria | MedicFlow + CFO | `/executivo` |
| 21 | Conciliação CSV (amostra) | Financeiro | `/financeiro/conciliacao-operacional` |

### Métricas — Semana 3

| Métrica | Meta | Como medir |
|---------|------|------------|
| Convênios cadastrados | ≥ 2 | `/tiss` |
| Guias TISS criadas | ≥ 5 | Contagem guias |
| Lotes exportados (XML) | ≥ 1 | `/tiss` → Lotes |
| Competência aberta | 1 mês | Fechamento |
| Snapshot gerado | 1 | Fechamento |
| KPIs executivos consultados | ≥ 1 sessão diretoria | `/executivo` |
| Produção vinculada a plantões | ≥ 3 registros | `medical_production` |

### Critério de avanço

Semana 3 concluída se: **competência aberta**, **≥ 1 export XML TISS** e **dashboard executivo apresentado à diretoria**.

---

## Semana 4 — Consolidação e decisão (Dias 22–30)

### Objetivos

- Consolidar métricas do piloto
- Coletar feedback estruturado
- Validar go-live ou encerramento
- Definir próximo passo comercial (contrato, expansão, ajustes)

### Atividades

| Dia | Atividade | Responsável | Rota / artefato |
|-----|-----------|-------------|-----------------|
| 22–24 | Operação autônoma (MedicFlow em standby) | Cliente | Todas |
| 24 | Coleta de feedback estruturado | Todos os perfis | `/piloto` → Feedback |
| 25 | Registro de incidentes/sugestões | Admin | `/piloto` |
| 26 | Travar competência (se aplicável) | Financeiro | Fechamento |
| 27 | Smoke tests finais | TI / MedicFlow | `/lancamento` |
| 28 | Relatório de métricas do piloto | MedicFlow | Este doc + `/piloto` |
| 29 | Apresentação de resultados | MedicFlow + sponsor | Deck executivo |
| 30 | Decisão: GO / NO-GO / extensão | Sponsor + MedicFlow | Acta comercial |

### Métricas — Semana 4 (consolidado 30 dias)

| Métrica | Meta piloto | Peso |
|---------|-------------|------|
| Adoção (DAU médio) | ≥ 40% dos usuários | 20% |
| Plantões confirmados (total) | ≥ 30 | 20% |
| Taxa confirmação global | ≥ 75% | 15% |
| Uso Central de IA (escalista) | ≥ 15 sessões | 15% |
| Guias TISS + 1 XML export | Completo | 10% |
| NPS piloto (escala 0–10) | ≥ 7 | 10% |
| Incidentes críticos | 0 | 10% |

### Critério de sucesso do piloto (30 dias)

| Resultado | Condição |
|-----------|----------|
| **GO comercial** | ≥ 70% das métricas consolidadas atingidas + sponsor aprova |
| **Extensão (+30 dias)** | 50–69% das métricas + feedback positivo qualitativo |
| **NO-GO** | < 50% das métricas ou incidente crítico não resolvido |

---

## Papéis e responsabilidades

| Papel | Responsabilidade no piloto |
|-------|---------------------------|
| **Sponsor cliente** | Decisão, alocação de equipe, remoção de bloqueios internos |
| **Admin institucional** | Branding, convênios, acompanhamento readiness |
| **Escalista** | Escalas, plantões, central, swaps |
| **Profissionais** | Aceite, confirmação, disponibilidade |
| **Financeiro** | TISS, fechamento, conciliação |
| **CS MedicFlow** | Kick-off, treinamentos, checkpoints semanais |
| **TI MedicFlow** | Provisionamento, smoke tests, suporte L2 |

---

## Rituais recomendados

| Ritual | Frequência | Duração | Participantes |
|--------|------------|---------|---------------|
| Stand-up operacional | Diário (D8–24) | 10 min | Escalista + admin |
| Checkpoint MedicFlow | Semanal (D7, D14, D21, D28) | 30 min | CS + sponsor |
| Office hours | 2×/semana | 1h | TI MedicFlow |
| Demo guiada (reforço) | D2 e D15 | 20 min | Novos stakeholders |

---

## Riscos conhecidos no piloto

| Risco | Mitigação |
|-------|-----------|
| Profissionais não logam (sem push/email) | Escalista comunica via WhatsApp + link direto `/plantoes` |
| Setup manual demorado | Pré-carregar staging-like data antes do D1 |
| IA Copilot indisponível | Confirmar `MEDFLOW_OPENAI_API_KEY`; fallback para alertas sem LLM |
| Expectativa de prontuário/EHR | Alinhar escopo no kick-off — produto é operacional + TISS MVP |
| XML TISS não enviado à operadora | Documentar processo manual; demo de export apenas |

---

## Referências

- [CHECKLIST_IMPLANTACAO.md](./CHECKLIST_IMPLANTACAO.md) — passo a passo de entrada
- [GTM_PILOTO_READY.md](./GTM_PILOTO_READY.md) — parecer executivo de prontidão
- [MANUAL_INSTITUICAO_MEDICFLOW.md](./MANUAL_INSTITUICAO_MEDICFLOW.md) — manual operacional
- [MEDICFLOW_DEMO_COMERCIAL.md](./MEDICFLOW_DEMO_COMERCIAL.md) — roteiro de demo

---

*Documento gerado em 11/06/2026 — GTM-2 Fase 3. Revisar após cada piloto real.*

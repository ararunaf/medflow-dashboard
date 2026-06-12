# Kit de Kick-off — Cliente Piloto MedicFlow

**Documento:** PILOT-READY — Fase 4  
**Data:** 11/06/2026  
**Versão:** V1  
**Duração do kick-off:** 60–90 minutos  
**Participantes recomendados:** Sponsor, admin institucional, escalista, representante financeiro, CS MedicFlow

---

## Agenda sugerida (60 min)

| Min | Tópico | Responsável |
|-----|--------|-------------|
| 0–10 | Boas-vindas e objetivos do piloto | CS MedicFlow |
| 10–20 | Escopo, inclusões e exclusões (este documento) | CS MedicFlow |
| 20–30 | Demonstração rápida (demo guiada 7 passos) | CS + admin |
| 30–40 | Papéis, credenciais e primeiros passos por perfil | CS |
| 40–50 | Calendário de 30 dias e checkpoints semanais | CS + sponsor |
| 50–60 | Canal de suporte, critérios de sucesso e Q&A | CS |

---

## Escopo do piloto

### O que é o MedicFlow no piloto

Plataforma de **gestão operacional de plantões médicos** com:

- Publicação e confirmação de escalas
- Central de IA Operacional (alertas, recomendações, copilot)
- Módulo TISS MVP (convênios, guias, lotes, export XML)
- Fechamento financeiro operacional e dashboard executivo
- Hub de piloto com checklist, feedback e smoke tests

### Segmentos atendidos

| Segmento | Foco principal |
|----------|----------------|
| Hospital / UPA | Cobertura de plantões + TISS |
| Cooperativa médica | Captação + repasses |
| Gestão de escalas | Publicação e confirmação |
| Grupo de plantonistas | Aceite e disponibilidade |

### Duração

- **Setup assistido:** 1 dia útil (objetivo) a 2–3 dias (estado atual manual)
- **Piloto operacional:** 30 dias corridos
- **Decisão comercial:** Dia 30 (GO / extensão / NO-GO)

---

## O que está incluso

| Item | Detalhe |
|------|---------|
| Ambiente dedicado | Tenant isolado com RLS (staging ou produção piloto) |
| Provisionamento de usuários | Admin, escalista, médicos (8–12), financeiro |
| Branding institucional | Logo, cores, nome, contato via `/instituicao` |
| Estrutura operacional | 2+ unidades, 2+ departamentos, 1ª escala publicada |
| Dados demo operacionais | 15–20 plantões, mix de status (com seed script P0) |
| Dados demo TISS | 2 convênios + 1 contrato (ambiente demo) |
| Treinamento | Admin 30 min, escalista 30 min, médicos 15 min, financeiro 45 min |
| Demo guiada | 7 passos em `/piloto` |
| Central de IA | Alertas operacionais + copilot (requer API key OpenAI) |
| Suporte L1 | Canal definido no kick-off (< 4h úteis resposta) |
| Checkpoints semanais | 4 calls de 30 min (CS + sponsor) |
| Documentação | Manuais instituição e profissional |
| Scorecard D30 | Métricas de adoção, operação, IA e financeiro |

---

## O que NÃO está incluso

| Item | Motivo |
|------|--------|
| Prontuário eletrônico (EHR) | Módulo inexistente — fora do escopo V1 |
| Cadastro de pacientes | Módulo inexistente |
| Onboarding self-service | Modelo B2B assistido — sem signup público |
| UI de gestão de usuários | Provisionamento via TI MedicFlow |
| Notificações push/e-mail para plantões | Apenas in-app + Realtime |
| Envio automático TISS à operadora | Export XML manual |
| XML TISS 100% ANS-compliant | MVP demonstrativo — não substitui faturamento |
| Integração com sistemas legados (ERP, folha) | Roadmap pós-piloto |
| SLA de uptime contratual | Piloto sem SLA formal |
| Suporte 24/7 | Horário comercial L1 |
| Customização de regras de negócio | Escopo fixo do produto V1 |
| Treinamento presencial em larga escala | Remoto/async para médicos |

---

## Limitações conhecidas

### Operacionais

- **Sem notificações externas:** escalista deve comunicar médicos via WhatsApp ou canal acordado
- **Units/departments sem UI dedicada:** estrutura criada por TI (SQL ou seed script)
- **Dashboard vazio no Dia 1** se não houver turnos pré-carregados
- **Demo guiada em sessionStorage:** reinicia se nova sessão/navegador

### Técnicas

- **Credenciais bootstrap** em migration — devem ser rotacionadas antes do piloto real
- **`payout_rules` sem UI** — regras de repasse inseridas via SQL pela TI
- **Hub `/financeiro`** pode exibir KPIs ilustrativos — usar `/executivo` para dados reais
- **Copilot IA** depende de `MEDFLOW_OPENAI_API_KEY` no servidor

### Comerciais

- Piloto não gera obrigação de contratação
- Dados do piloto podem residir em ambiente compartilhado (tenant isolado por RLS)
- Extensão de +30 dias possível se scorecard 50–69%

---

## Papéis e responsabilidades

| Papel | Quem | Responsabilidade no piloto |
|-------|------|---------------------------|
| Sponsor | Cliente (diretoria/gestão) | Decisão D30, remover bloqueios internos |
| Admin institucional | Cliente (`tenant_admin`) | Branding, piloto, go-live, smoke tests |
| Escalista | Cliente (`coordinator`) | Escalas, plantões, central de IA |
| Médicos | Cliente (`professional`) | Aceite, confirmação, disponibilidade |
| Financeiro | Cliente (`financial`) | TISS, fechamento, dashboard executivo |
| CS MedicFlow | MedicFlow | Kick-off, treinamento, checkpoints, suporte L1 |
| TI MedicFlow | MedicFlow | Provisionamento, validação técnica, incidentes |

---

## Primeiros passos por perfil (pós kick-off)

### Admin institucional

1. `/instituicao` — finalizar branding e contato
2. `/piloto` — concluir demo guiada e checklist
3. `/lancamento` — validar smoke tests (com TI)
4. `/operacao` — revisar health

### Escalista

1. `/escalas` — criar/revisar escalas e turnos
2. `/central` — monitorar alertas diariamente
3. `/plantoes` — acompanhar confirmações pendentes

### Médicos

1. `/login` — selecionar instituição correta
2. `/perfil` — ativar disponibilidade
3. `/plantoes` — aceitar e confirmar ≥ 1 plantão na Semana 1

### Financeiro

1. `/tiss` — cadastrar convênios reais (ou usar seed demo)
2. `/financeiro/fechamento-operacional` — abrir competência
3. `/executivo` — validar KPIs reais

---

## Critérios de sucesso (D30)

### Adoção

| Métrica | Meta |
|---------|:----:|
| Taxa de login (usuários provisionados) | ≥ 90% |
| DAU médio (30 dias) | ≥ 40% |
| Profissionais com ≥ 1 aceite | ≥ 60% |
| Tempo até 1º aceite (desde go-live) | ≤ 72h |

### Operação

| Métrica | Meta |
|---------|:----:|
| Plantões publicados (30 dias) | ≥ 30 |
| Taxa de confirmação global | ≥ 75% |
| Smoke tests (início e fim) | 100% |
| Escalista acessos/semana | ≥ 3 |

### IA

| Métrica | Meta |
|---------|:----:|
| Acessos à Central de IA | ≥ 15 sessões |
| Copilot — perguntas feitas | ≥ 3 |
| Satisfação IA (feedback) | ≥ 7/10 |

### Financeiro

| Métrica | Meta |
|---------|:----:|
| Competência financeira processada | 1 ciclo |
| Export TISS XML | ≥ 1 |

### Engajamento

| Métrica | Meta |
|---------|:----:|
| NPS piloto | ≥ 7 |
| Checkpoints semanais realizados | 4/4 |
| Incidentes críticos | 0 |

### Scorecard de decisão

| Score (% métricas atingidas) | Resultado |
|:----------------------------:|-----------|
| ≥ 70% | **GO comercial** |
| 50–69% | **Extensão +30 dias** |
| < 50% | **NO-GO** ou replanejamento |

Detalhamento completo: [PILOTO_30_DIAS.md](./PILOTO_30_DIAS.md) e [GTM_PILOTO_READY.md](./GTM_PILOTO_READY.md#fase-4--critérios-de-sucesso).

---

## Calendário de checkpoints

| Semana | Foco | Checkpoint |
|:------:|------|------------|
| 1 | Fundação e ativação | 1 escala + 3 aceites + smoke OK |
| 2 | Operação e IA | 10 plantões confirmados + Central em uso |
| 3 | Financeiro e TISS | Competência aberta + 1 XML export |
| 4 | Consolidação e decisão | NPS + scorecard GO/NO-GO |

---

## Canal de suporte

Preencher no kick-off:

| Canal | Contato | Horário |
|-------|---------|---------|
| WhatsApp CS | _________________ | Comercial |
| E-mail suporte | _________________ | Comercial |
| TI incidentes | _________________ | TI MedicFlow |

**SLA piloto (L1):** resposta em até 4 horas úteis. Incidentes críticos (indisponibilidade) escalados para TI MedicFlow.

---

## Materiais entregues no kick-off

- [ ] Credenciais individuais (1:1)
- [ ] URL do ambiente: `_________________________`
- [ ] Este documento (escopo e limitações)
- [ ] [MANUAL_INSTITUICAO_MEDICFLOW.md](./MANUAL_INSTITUICAO_MEDICFLOW.md)
- [ ] [MANUAL_PROFISSIONAL_MEDICFLOW.md](./MANUAL_PROFISSIONAL_MEDICFLOW.md)
- [ ] [PILOTO_30_DIAS.md](./PILOTO_30_DIAS.md)
- [ ] [RUNBOOK_IMPLANTACAO_PILOTO.md](./RUNBOOK_IMPLANTACAO_PILOTO.md) (referência TI)

---

## Assinaturas de alinhamento

| Papel | Nome | Data | Assinatura |
|-------|------|------|------------|
| Sponsor cliente | | | |
| Admin institucional | | | |
| CS MedicFlow | | | |

---

## Histórico de versões

| Versão | Data | Alteração |
|--------|------|-----------|
| V1 | 11/06/2026 | Kit inicial de kick-off piloto |

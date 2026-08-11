# ENTERPRISE_RUNTIME_MIGRATION_PLAN

**Sprint origem:** ARC-24 — Enterprise Runtime Convergence Discovery  
**Data:** 2026-08-10  
**Princípio:** migrar pouco, provar sempre, nunca big-bang  
**Regra:** [`ENTERPRISE_RUNTIME_CONVERGENCE_RULE.md`](./ENTERPRISE_RUNTIME_CONVERGENCE_RULE.md)  
**Descoberta:** [`ARC24_ENTERPRISE_RUNTIME_CONVERGENCE_DISCOVERY.md`](./ARC24_ENTERPRISE_RUNTIME_CONVERGENCE_DISCOVERY.md)

---

## 1. Estado atual (baseline ARC-24)

| Item | Estado |
|------|--------|
| Pipeline oficial **executado** | Operacional Capture (`uploadCaptureFileFn`) |
| Pipeline canônico Enterprise | Estrutural (11 passos); não dirige negócio |
| Dual-path Capture (AER-GA03-A1) | **Aceita** — bridge intake best-effort |
| OCR dual-path | **Resolvida** (OCR-01) |
| TISS knowledge dual-path | **Resolvida** (TISS-CONV-01) |
| XML produto vs XML Enterprise | Divergente |
| Módulos Enterprise | 99 (≈51 wired) |
| Rebuild do sistema | **Não necessário / proibido** |

---

## 2. Estratégia (strangler fig)

```text
ARC-24     Descoberta + regra + plano          ← FEITO (docs only)
EPC-24A    Orquestração canônica no caminho Capture  ← FEITO (binding; sem cutover)
EPC-24B    Migrar OCR+Intake+Extraction (parse)
EPC-24C    Migrar Audit/Contract/Risk/Correction
EPC-24D    Migrar Review→TISS/XML/Bloco C
EPC-24E    Cutover único + remoções + certificação
```

Cada sprint exige: build + `tsc --noEmit` + lint + smoke = PASS, paridade funcional do estágio migrado, e atualização do AER quando fechar exceção.

---

## 3. Plano das sprints EPC-24A → EPC-24E

### EPC-24A — Canonical Orchestration Binding

**Status:** ✅ Concluída (2026-08-10) — binding arquitetural; **sem cutover**; comportamento preservado.

**Objetivo:** Fazer o Canonical Execution Orchestrator **dirigir** a sequência de estágios Capture via Ports, sem mudar comportamento observável.

| Item | Detalhe |
|------|---------|
| PRESERVAR | `getEnterpriseRuntime`, Orchestrator, Capture session/UI |
| MIGRAR | Orquestração imperativa de `uploadCaptureFileFn` → facade `runCaptureOperationalPipelineBound` (ainda executa engines legado) |
| REMOVER | Nada ainda |
| Critério | Upload gera a mesma cadeia de artefatos/status; Capture entra por `getEnterpriseRuntime()`; Orchestrator/Capture Engine probeados estruturalmente |
| Fora de escopo | Trocar engines de parser/audit; XML; filas reais; fechar AER-GA03-A1 |

**Entregáveis:** `resolve-enterprise-runtime.ts`, `capture-runtime-binding.ts`; wiring em `capture-server`; docs `EPC24A_*`; AER-GA03-A1 atualizado (eliminação iniciada).

**Confirmação dual-path:** AER-GA03-A1 **ainda existe parcialmente** (intake side-effect + pipeline legado). Eliminação **iniciada** sem regressões; cutover só em EPC-24E.

---

### EPC-24B — Intake + OCR + Extraction Convergence

**Objetivo:** Unificar intake e parse/extração sob Foundations; OCR permanece no Port (já convergido).

| Item | Detalhe |
|------|---------|
| PRESERVAR | OCR Provider/Runtime Azure; Document Intake Port; Classification |
| MIGRAR | `capture/parser` → Document Extraction Runtime (+ Classification) |
| REMOVER | Caminhos de parse que bypassam Extraction após paridade |
| Critério | Mesmos campos/guias extraídos; intake deixa de ser “só side-effect” no Happy Path UI |
| Fecha parcialmente | AER-GA03-A1 (intake) |

**Entregáveis:** Extraction Runtime ativado; bridge intake deixa de ser fire-and-forget opaco; paridade parser.

---

### EPC-24C — Decision Runtimes Convergence

**Objetivo:** Migrar auditoria preventiva, contrato, glosa e correção para Ports Enterprise.

| Item | Detalhe |
|------|---------|
| PRESERVAR | Regras de negócio atuais (comportamento) |
| MIGRAR | `capture/audit` → Audit Runtime / AI Auditor (determinístico primeiro) |
| MIGRAR | `capture/contract` → Contract + Contract Rule Binding |
| MIGRAR | `capture/risk` → TISS Rule Runtime / Quality Runtime |
| MIGRAR | `capture/correction` → Auto-Fill / Quality |
| REMOVER | Engines locais órfãs após cutover do estágio |
| Critério | Mesmos findings/scores/propostas; metadata compatível com Review UI |

**Entregáveis:** Ports wired no Runtime; adapters que reutilizam lógica atual (copy behavior); testes de paridade.

---

### EPC-24D — TISS / XML / Bloco C Handoff

**Objetivo:** Ligar Review/APPROVED ao faturamento TISS via Foundations; aposentar XML proprietário como destino.

| Item | Detalhe |
|------|---------|
| PRESERVAR | UI Review/Processing; Bloco C runtimes (ativar) |
| MIGRAR | Handoff APPROVED → Batch/Protocol/Workflow runtimes |
| MIGRAR | `xml-export-service` → XML Generation / Serializer / Validation / XML-TISS |
| REMOVER | Builder `medflowTissExport` após paridade de export |
| Critério | Lote/guia/XML gerados via Ports; sem regressão no export TISS UI |

**Entregáveis:** ponte Capture→TISS oficial; XML Enterprise no caminho; certificação C-block parcial.

---

### EPC-24E — Single Pipeline Cutover & Cleanup

**Objetivo:** Declarar o Enterprise Canonical Runtime Pipeline como **único** oficial; limpar dual-paths e mortos.

| Item | Detalhe |
|------|---------|
| PRESERVAR | Runtime root; Ports ativos; UI; RLS |
| MIGRAR | Session events críticos → PersistencePort + Execution Trace |
| REMOVER | Dual-path intake paralelo; orquestração legada; engines ilha sem plano; legado `storage` se supersedido |
| Critério | AER-GA03-A1 **Resolvida**; HTTP `/capture` alinhado ao mesmo pipeline; inventário mortos fechado |
| Certificação | ARC-24 audit trail + gate final “single pipeline” |

**Entregáveis:** AER updates; lista final PRESERVAR/MIGRAR/REMOVER executada; relatório de cutover.

---

## 4. Matriz PRESERVAR / MIGRAR / REMOVER (visão consolidada)

### PRESERVAR

- Enterprise Runtime composition root  
- Canonical Execution Orchestrator + execution model  
- OCR / Storage / AI / TISS Catalog / RulePackEngine (já reais ou oficiais)  
- DIP spine (intake, capture-engine, classification, storage-manager, search)  
- Runtimes Bloco C, F3-CAP, INF (fundações)  
- Capture UI, state machine de sessão, multi-tenant RLS  
- Padrão ECS-01  

### MIGRAR

- Orquestração `capture-server`  
- Parser / audit / contract / risk / correction  
- Handoff Review → TISS  
- XML export proprietário  
- Persistência de sessão/eventos críticos para PersistencePort  

### REMOVER (somente pós-paridade)

- Dual-path intake side-effect  
- Cadeia imperativa como fonte de verdade  
- XML builder proprietário  
- Duplicatas e módulos ilha sem consumers após inventário E  

---

## 5. Ordem de risco

1. **Baixo:** Orchestrator binding (24A), OCR já convergido  
2. **Médio:** Extraction / Audit / Contract / Risk (24B–C)  
3. **Alto:** XML + Bloco C + cutover único (24D–E)  

Nunca iniciar por Auth, RLS helpers ou reescrita de UI.

---

## 6. Receita por estágio (checklist)

Para cada estágio migrado:

1. [ ] Identificar implementação produto e Port Enterprise alvo  
2. [ ] Adapter que **copia comportamento** atual (sem “melhorias”)  
3. [ ] Wire no `getEnterpriseRuntime` se ainda não composto  
4. [ ] Feature flag ou cutover atômico do estágio  
5. [ ] Testes de paridade (mesmo input → mesmo output/artefato)  
6. [ ] Remover caminho legado **somente** daquele estágio  
7. [ ] Atualizar AER + docs enterprise + certificação da sprint  
8. [ ] build / tsc / lint / smoke PASS  

---

## 7. Critério de conclusão da trilha de convergência

A trilha ARC-24 / EPC-24* só se considera concluída quando:

- Existe **um único** pipeline documental oficial: Enterprise Canonical Runtime via `getEnterpriseRuntime()`  
- AER-GA03-A1 está **Resolvida**  
- Capture não orquestra engines locais como plano de execução  
- XML/lote TISS passam por Ports Enterprise  
- Nenhum dual-path funcional permanece sem AER  
- Gates de qualidade (build, tsc, lint, smoke, testes de paridade) PASS  

ARC-24 **não** exige esses critérios finais — apenas a descoberta, a regra e este plano.

---

## 8. Resposta final da trilha (alvo)

> Após a convergência, o único pipeline oficial do MedicFlow-AI será o **Enterprise Canonical Runtime Pipeline** (Canonical Execution Orchestrator + Ports Foundation), acessado somente por `getEnterpriseRuntime()`.

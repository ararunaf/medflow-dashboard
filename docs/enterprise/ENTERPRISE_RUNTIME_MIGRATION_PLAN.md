# ENTERPRISE_RUNTIME_MIGRATION_PLAN

**Sprint origem:** ARC-24 — Enterprise Runtime Convergence Discovery  
**Data:** 2026-08-10  
**Princípio:** migrar pouco, provar sempre, nunca big-bang  
**Regra:** [`ENTERPRISE_RUNTIME_CONVERGENCE_RULE.md`](./ENTERPRISE_RUNTIME_CONVERGENCE_RULE.md)  
**Descoberta:** [`ARC24_ENTERPRISE_RUNTIME_CONVERGENCE_DISCOVERY.md`](./ARC24_ENTERPRISE_RUNTIME_CONVERGENCE_DISCOVERY.md)

---

## 1. Estado atual (pós EPC-24E cutover)

| Item | Estado |
|------|--------|
| Pipeline oficial **executado** | Enterprise Canonical Runtime via `getEnterpriseRuntime()` |
| Pipeline canônico Enterprise | Oficial único (coordenação + gateways) |
| Dual-path Capture (AER-GA03-A1) | **Resolvida** (EPC-24E) |
| OCR dual-path | **Resolvida** (OCR-01) |
| TISS knowledge dual-path | **Resolvida** (TISS-CONV-01) |
| XML produto vs XML Enterprise | XML export via gateway Enterprise (implementação interna autorizada) |
| Módulos Enterprise | 99 (≈51 wired) |
| Rebuild do sistema | **Não necessário / proibido** |

---

## 2. Estratégia (strangler fig)

```text
ARC-24     Descoberta + regra + plano          ← FEITO (docs only)
EPC-24A    Orquestração canônica no caminho Capture  ← FEITO (binding; sem cutover)
EPC-24B    Migrar Intake+Extraction (parse)    ← FEITO (sem cutover; OCR intocado)
EPC-24C    Migrar Audit/Contract/Risk/Correction ← FEITO (sem cutover; fallback legado)
EPC-24D    Migrar Review→TISS/XML/Bloco C      ← FEITO (sem cutover; fallback legado)
EPC-24E    Cutover único + remoções + certificação ← FEITO (AER-GA03-A1 Resolvida)
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

### EPC-24B — Intake + Extraction Convergence

**Status:** ✅ Concluída (2026-08-10) — Intake awaited + Parser via Extraction Runtime; **sem cutover**; OCR/Audit/Contract/Risk/Correction/XML intocados.

**Objetivo:** Unificar intake e parse/extração sob Foundations; OCR permanece no Port (já convergido — não alterado nesta sprint).

| Item | Detalhe |
|------|---------|
| PRESERVAR | OCR Provider/Runtime Azure; Document Intake Port; Classification; Foundations 4–7 |
| MIGRAR | Intake → Runtime (awaited no bound pipeline); `capture/parser` execução → Document Extraction Runtime (+ fallback legado) |
| REMOVER | Nada ainda (legado permanece como fallback; cutover = EPC-24E) |
| Critério | Mesmos campos/guias extraídos; intake deixa de ser fire-and-forget opaco no Happy Path UI |
| Fecha parcialmente | AER-GA03-A1 (intake + parser sob Runtime; dual-path **reduzido**, não eliminado) |

**Entregáveis:** `process-parser-via-enterprise.ts`; intake awaited em binding/server; testes `epc-24b-*`; docs `EPC24B_*`.

**Confirmação dual-path:** AER-GA03-A1 **continua reduzido, porém ainda não eliminado** (fallback parser legado + demais engines operacionais).

---

### EPC-24C — Decision Runtimes Convergence

**Status:** ✅ Concluída (2026-08-10) — Audit/Contract/Risk/Correction via Runtime Ports; **sem cutover**; engines legado como fallback.

**Objetivo:** Migrar auditoria preventiva, contrato, glosa e correção para Ports Enterprise.

| Item | Detalhe |
|------|---------|
| PRESERVAR | Regras de negócio atuais (comportamento); Foundations 4–7 |
| MIGRAR | `capture/audit` → Audit Runtime (fallback legado) |
| MIGRAR | `capture/contract` → RulePackEngine (hop wired; Binding não composto) + fallback legado |
| MIGRAR | `capture/risk` → Quality Runtime + fallback legado |
| MIGRAR | `capture/correction` → Auto-Fill Runtime + fallback legado |
| REMOVER | Nada ainda (cutover = EPC-24E) |
| Critério | Mesmos findings/scores/propostas; metadata compatível com Review UI |

**Entregáveis:** gateways `process-*-via-enterprise`; binding/server atualizados; testes `epc-24c-*`; docs `EPC24C_*`.

**Confirmação dual-path:** AER-GA03-A1 **continua reduzido, porém ainda não eliminado** (fallback 100% nas 4 engines; cutover só em EPC-24E).

---

### EPC-24D — TISS / XML / Bloco C Handoff

**Status:** ✅ Concluída (2026-08-10) — Review / TISS-XML / Bloco C via Runtime Ports; **sem cutover**; fallback legado 100%.

**Objetivo:** Ligar Review/APPROVED ao faturamento TISS via Foundations; aposentar XML proprietário como destino (cutover em EPC-24E).

| Item | Detalhe |
|------|---------|
| PRESERVAR | UI Review/Processing; Bloco C runtimes (ativados estruturalmente); builder XML legado como fallback |
| MIGRAR | Handoff APPROVED → Batch/Protocol/Workflow runtimes (coordenação estrutural) |
| MIGRAR | `xml-export-service` → XML Generation / XML-TISS via gateway (fallback legado) |
| MIGRAR | Review workspace → ValidationRuntimePort via gateway (fallback legado) |
| REMOVER | Builder `medflowTissExport` — **adiado para EPC-24E** após paridade |
| Critério | Review/XML/Bloco C coordenados via Ports; sem regressão no export TISS UI |

**Entregáveis:** `process-review-via-enterprise.ts`, `process-xml-via-enterprise.ts`, `process-bloco-c-via-enterprise.ts`; wiring em `review-server` / `tiss-server`; docs `EPC24D_*`; AER-GA03-A1 atualizado (dual-path reduzido).

**Confirmação dual-path:** AER-GA03-A1 **continua existente apenas como fallback** (Review/XML/Bloco C 100% legado funcional; cutover só em EPC-24E).

---

### EPC-24E — Single Pipeline Cutover & Cleanup

**Status:** ✅ Concluída (2026-08-11) — cutover arquitetural; Dual Path AER-GA03-A1 **Resolvida**.

**Objetivo:** Declarar o Enterprise Canonical Runtime Pipeline como **único** oficial; limpar dual-paths e mortos.

| Item | Detalhe |
|------|---------|
| PRESERVAR | Runtime root; Ports ativos; UI; RLS; engines como implementação interna |
| MIGRAR | OCR Server Fn → gateway Enterprise; flags Dual Path → `singlePipeline` |
| REMOVER | Flags `*Fallback`; Dual Path AER-GA03-A1; orquestração legada como plano paralelo |
| Critério | AER-GA03-A1 **Resolvida**; Server Fns só via gateways; `getEnterpriseRuntime()` único entrypoint |
| Certificação | build / tsc / lint / smoke / enterprise suite PASS |

**Entregáveis:** gateways sem flags Dual Path; `process-ocr-via-enterprise` (sessão); binding `singlePipeline`; docs `EPC24E_*`; AER-GA03-A1 Resolvida.

**Confirmação dual-path:** AER-GA03-A1 **Resolvida**. Engines legado permanecem **somente** como implementação interna dos gateways autorizados — nunca como pipeline paralelo.

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

A trilha ARC-24 / EPC-24* **está concluída** (EPC-24E, 2026-08-11):

- Existe **um único** pipeline documental oficial: Enterprise Canonical Runtime via `getEnterpriseRuntime()`
- AER-GA03-A1 está **Resolvida**
- Capture não orquestra engines locais como plano de execução paralelo
- XML/lote TISS passam por Ports Enterprise (gateways)
- Nenhum dual-path funcional permanece sem AER
- Gates de qualidade (build, tsc, lint, smoke, testes de paridade) PASS

---

## 8. Resposta final da trilha

> O único pipeline oficial do MedicFlow-AI é o **Enterprise Canonical Runtime Pipeline** (Canonical Execution Orchestrator + Ports Foundation), acessado somente por `getEnterpriseRuntime()`.
>
> **O MedicFlow-AI possui agora um único pipeline oficial coordenado pelo Enterprise Runtime.**

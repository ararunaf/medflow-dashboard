# EPC-24D — Enterprise Runtime Review / TISS / XML Convergence

| Campo | Valor |
|-------|-------|
| Sprint | EPC-24D — Enterprise Runtime Review / TISS / XML Convergence |
| Projeto | MedicFlow-AI |
| Data | 2026-08-10 |
| Tipo | Convergência Review + TISS/XML + Bloco C (sem cutover) |
| Status | ✅ Concluída |
| Cutover | **Não executado** |
| Dual-path AER-GA03-A1 | **Parcial — reduzido; ainda não eliminado** |
| Roadmap | ARC-24 → EPC-24A → EPC-24B → EPC-24C → **EPC-24D** → EPC-24E |

---

## 1. Objetivo

Migrar **somente** Review, TISS/XML e Bloco C para o Enterprise Runtime iniciado na EPC-24A/B/C, preservando comportamento funcional e as engines legado como fallback.

## 2. O que NÃO foi feito (proibido)

- Cutover / remoção do dual-path AER-GA03-A1
- Alteração de UI, OCR, Parser, Audit, Contract, Risk, Correction
- Alteração de banco, APIs públicas, Foundations 4–7
- Novo pipeline paralelo / regras clínicas ou TISS alteradas
- Remoção do builder `medflowTissExport` (permanece fallback até EPC-24E)
- Novo Gateway fora de `getEnterpriseRuntime()`

## 3. Arquivos alterados / criados

### Criados

| Arquivo | Papel |
|---------|-------|
| `src/lib/capture/enterprise/process-review-via-enterprise.ts` | Gateway Review → `ValidationRuntimePort` + handoff Bloco C + fallback legado |
| `src/lib/capture/enterprise/process-xml-via-enterprise.ts` | Gateway TISS/XML → `XMLGenerationRuntimePort` / `XMLTISSRuntimePort` + fallback legado |
| `src/lib/capture/enterprise/process-bloco-c-via-enterprise.ts` | Gateway Bloco C → Workflow/Batch/Protocol (+ peers) + fallback services TISS |
| `scripts/enterprise/tests/epc-24d-review-tiss-xml-convergence.test.ts` | Testes novos de convergência + latência |
| `docs/enterprise/EPC24D_ENTERPRISE_RUNTIME_REVIEW_TISS_XML_CONVERGENCE.md` | Este relatório |

### Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/capture/enterprise/capture-runtime-binding.ts` | Probe cobre Validation/XML/Bloco C Ports |
| `src/lib/capture/api/review-server.ts` | Server Fns via gateways Enterprise |
| `src/lib/tiss/api/tiss-server.ts` | Export/list XML via gateway Enterprise |
| `src/lib/capture/review/review-workspace-store.ts` | Leituras Audit/Contract/Risk/Correction/Parser via gateways Enterprise |
| `docs/enterprise/ENTERPRISE_RUNTIME_MIGRATION_PLAN.md` | EPC-24D marcada concluída |
| `docs/enterprise/ARCHITECTURAL_EXCEPTION_REGISTER.md` | AER-GA03-A1: dual-path reduzido (24D) |

## 4. Justificativa arquitetural

Strangler Fig (Convergence Rule / ARC-24):

1. `getEnterpriseRuntime()` permanece o **único** composition root.
2. Review / TISS-XML / Bloco C deixam de ser importados pelos Server Fns de produto para execução — resolvidos via Ports Enterprise.
3. Engines legado permanecem **somente** como fallback funcional atrás dos gateways.
4. OCR / Parser engines / Audit / Contract / Risk / Correction / Foundations 4–7 / UI / banco / APIs intocados (somente wiring de acesso).
5. Sem cutover: AER-GA03-A1 reduzido, não fechado.
6. Review mapeia para `ValidationRuntimePort` (aprovação humana estrutural F3-CAP-08); handoff APPROVED → Bloco C (Workflow/Batch/Protocol).
7. XML mapeia para `XMLGenerationRuntimePort` + `XMLTISSRuntimePort` (TISS-05 / C-01); builder proprietário permanece fallback.

## 5. Evidência — Review passa pelo Runtime

```text
getReviewWorkspaceFn / setReviewApprovalFn
  → getReviewWorkspaceSnapshotViaEnterprise / setReviewApprovalViaEnterprise
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → getValidationRuntimePort()
          → openJob → submitRequest → closeJob
      → (se aprovada) coordinateBlocoCViaEnterprise(...)
      → setReviewApprovalDecision / getReviewWorkspaceSnapshot  // FALLBACK legado
```

## 6. Evidência — TISS/XML passa pelo Runtime

```text
exportTissBatchXmlFn / listTissBatchExportsFn
  → exportTissBatchXmlViaEnterprise / listTissBatchExportsViaEnterprise
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → getXMLGenerationRuntimePort().generate(...)
      → getXMLTISSRuntimePort().prepareXMLDocument(...)
      → exportTissBatchXml / listTissBatchExports  // FALLBACK legado
```

## 7. Evidência — Bloco C passa pelo Runtime

```text
setReviewApprovalViaEnterprise (status=aprovada) | probeCaptureBlocoCViaEnterprise
  → coordinateBlocoCViaEnterprise(...)
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → getWorkflowRuntimePort().prepareWorkflowExecution(...)
      → getBatchRuntimePort().prepareBatch(...)
      → getProtocolRuntimePort().prepareProfile(...)
      → services TISS produto permanecem FALLBACK funcional (sem cutover)
```

## 8. Evidência — engines legado apenas como fallback

| Estágio | Flag de fallback | Único consumidor de execução fora do próprio módulo |
|---------|------------------|------------------------------------------------------|
| Review | `legacy-review-workspace` | `process-review-via-enterprise.ts` |
| TISS/XML | `legacy-xml-export-service` | `process-xml-via-enterprise.ts` |
| Bloco C | `legacy-tiss-product-services` | `process-bloco-c-via-enterprise.ts` (coordenação) |

`review-server.ts` e handlers XML em `tiss-server.ts` **não** importam store/export diretamente.

## 9. Evidência — nenhuma regra de negócio mudou

- Engines `review-workspace-store` / `xml-export-service` / services TISS **não** tiveram regras clínicas/TISS alteradas
- Foundations Enterprise **não editadas**
- UI / rotas / banco / APIs públicas **não alteradas** (apenas wiring interno Server Fn → gateway)
- Testes existentes **não alterados** (apenas teste novo EPC-24D)
- Builder `medflowTissExport` preservado como fallback

## 10. Diagrama arquitetural (pós-EPC-24D)

```text
┌─────────────────────────────────────────────────────────────┐
│ Produto (UI / Server Fn)                                    │
│   uploadCaptureFileFn / review-server / tiss-server XML     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ EPC-24A/B/C/D Binding                                       │
│   resolveCaptureEnterpriseRuntime()                         │
│     ≡ getEnterpriseRuntime()   ← ÚNICO ENTRYPOINT           │
│   runCaptureOperationalPipelineBound(...)                   │
│   process-review / process-xml / process-bloco-c            │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Enterprise Runtime                                          │
│  Document Intake / Extraction     (EPC-24B)                 │
│  Audit / RulePack / Quality / AutoFill (EPC-24C)            │
│  Validation Runtime (Review)      (EPC-24D)                 │
│  XML Generation / XML-TISS        (EPC-24D)                 │
│  Workflow / Batch / Protocol      (EPC-24D · Bloco C)       │
│  OCR / Orchestrator / Capture Engine                        │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                │ estrutural                  │ fallback funcional
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│ Ports Validation/XML*/    │   │ Engines legado:                 │
│ Workflow/Batch/Protocol   │   │ review-workspace / xml-export / │
│                           │   │ services/tiss                   │
└───────────────────────────┘   └─────────────────────────────────┘
                │
                ▼
        Dual-path AER-GA03-A1 (reduzido · não eliminado)
        Cutover = EPC-24E
```

## 11. Confirmação explícita — Dual Path AER-GA03-A1

> **Atualização EPC-24E (2026-08-11):** Dual Path **eliminado**. Ver [`EPC24E_ENTERPRISE_RUNTIME_FINAL_CUTOVER.md`](./EPC24E_ENTERPRISE_RUNTIME_FINAL_CUTOVER.md). AER-GA03-A1 **Resolvida**.

Histórico EPC-24D (pré-cutover): Dual Path existia apenas como mecanismo de fallback; cutover ficou para EPC-24E.

## 12. Percentual estimado de convergência (ARC-24)

**~88%** do pipeline operacional Capture → Enterprise Canonical Runtime  
(OCR + binding 24A + Intake/Extraction 24B + Decision 24C + Review/TISS-XML/Bloco C 24D; falta cutover/remoção de fallbacks 24E).

## 13. Utilização de fallback (por etapa)

| Etapa | Fallback utilization |
|-------|----------------------|
| Review | **100%** (estrutural Port + legado obrigatório; sem cutover) |
| TISS/XML | **100%** |
| Bloco C | **100%** |

## 14. Latência média (medição estrutural — teste EPC-24D)

| Caminho | Latência média |
|---------|----------------|
| Enterprise Runtime (health Review/XML/Bloco C Ports) | **~0.073 ms** |
| Fallback legado (identidade do gateway; sem DB) | **~0.004 ms** |

Amostras: 5. Medição em-processo (Node `performance.now()`). O caminho Enterprise inclui shape-check de Ports; o legado medido é o custo do gateway identity (engines reais exigem ServiceCtx/DB e permanecem 100% como fallback funcional).

## 15. Pipeline operacional coordenado pelo Enterprise Runtime

Após EPC-24D, **todo o pipeline operacional** encontra-se coordenado pelo Enterprise Runtime:

1. Intake  
2. OCR  
3. Parser/Extraction  
4. Audit  
5. Contract  
6. Risk  
7. Correction  
8. Review  
9. TISS/XML  
10. Bloco C (handoff Workflow/Batch/Protocol)

Restando para a **EPC-24E** apenas:

- eliminação definitiva do Dual Path AER-GA03-A1;
- remoção dos fallbacks;
- limpeza arquitetural;
- certificação do pipeline único.

## 16. Gates

| Gate | Resultado |
|------|-----------|
| Build | ver execução da sprint |
| TypeScript | ver execução da sprint |
| ESLint | ver execução da sprint |
| Smoke | ver execução da sprint |
| Testes novos | EPC-24D (10/10) |
| Working Tree | limpo após commit |

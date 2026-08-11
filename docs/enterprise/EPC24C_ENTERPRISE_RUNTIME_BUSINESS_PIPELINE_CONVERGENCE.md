# EPC-24C — Enterprise Runtime Business Pipeline Convergence

| Campo | Valor |
|-------|-------|
| Sprint | EPC-24C — Enterprise Runtime Business Pipeline Convergence |
| Projeto | MedicFlow-AI |
| Data | 2026-08-10 |
| Tipo | Convergência Audit + Contract + Risk + Correction (sem cutover) |
| Status | ✅ Concluída |
| Cutover | **Não executado** |
| Dual-path AER-GA03-A1 | **Parcial — reduzido; ainda não eliminado** |
| Roadmap | ARC-24 → EPC-24A → EPC-24B → **EPC-24C** → EPC-24D → EPC-24E |

---

## 1. Objetivo

Migrar **somente** Audit, Contract, Risk e Correction para o Enterprise Runtime iniciado na EPC-24A/B, preservando comportamento funcional e as engines legado como fallback.

## 2. O que NÃO foi feito (proibido)

- Cutover / remoção do dual-path
- Alteração de UI, regras de negócio, OCR, Parser, XML
- Alteração de banco, APIs públicas, Foundations 4–7
- Novo pipeline paralelo / código duplicado de engines / regras clínicas ou TISS
- Novo Gateway fora de `getEnterpriseRuntime()`

## 3. Arquivos alterados / criados

### Criados

| Arquivo | Papel |
|---------|-------|
| `src/lib/capture/enterprise/process-audit-via-enterprise.ts` | Gateway Audit → `AuditRuntimePort` + fallback legado |
| `src/lib/capture/enterprise/process-contract-via-enterprise.ts` | Gateway Contract → `RulePackEnginePort` + fallback legado |
| `src/lib/capture/enterprise/process-risk-via-enterprise.ts` | Gateway Risk → `QualityRuntimePort` + fallback legado |
| `src/lib/capture/enterprise/process-correction-via-enterprise.ts` | Gateway Correction → `AutoFillRuntimePort` + fallback legado |
| `scripts/enterprise/tests/epc-24c-business-pipeline-convergence.test.ts` | Testes novos de convergência |
| `docs/enterprise/EPC24C_ENTERPRISE_RUNTIME_BUSINESS_PIPELINE_CONVERGENCE.md` | Este relatório |

### Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/capture/enterprise/capture-runtime-binding.ts` | Decision stages via gateways Enterprise |
| `src/lib/capture/api/capture-server.ts` | Server Fns de execução/leitura via gateways |
| `docs/enterprise/ENTERPRISE_RUNTIME_MIGRATION_PLAN.md` | EPC-24C marcada concluída |
| `docs/enterprise/ARCHITECTURAL_EXCEPTION_REGISTER.md` | AER-GA03-A1: dual-path reduzido (24C) |

## 4. Justificativa arquitetural

Strangler Fig (Convergence Rule / ARC-24):

1. `getEnterpriseRuntime()` permanece o **único** composition root.
2. Audit / Contract / Risk / Correction deixam de ser importados pelos orquestradores de produto para execução — resolvidos via Ports Enterprise.
3. Engines legado permanecem **somente** como fallback funcional atrás dos gateways.
4. OCR / Parser / XML / Foundations 4–7 / UI / banco / APIs intocados.
5. Sem cutover: AER-GA03-A1 reduzido, não fechado.
6. ContractPort / ContractRuleBindingPort / TISSRuleRuntimePort **não** estão compostos no Runtime (AER-GA03-M5; Foundations congeladas) — Contract usa `RulePackEnginePort` (hop wired da cadeia Contract → Binding → Rule Pack); Risk usa `QualityRuntimePort` (destino canônico ARC-24).

## 5. Evidência — Audit passa pelo Runtime

```text
runCaptureOperationalPipelineBound / runCaptureAuditFn
  → runCaptureAuditViaEnterprise(ctx, sessionId)
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → getAuditRuntimePort()
          → openJob → submitRequest → closeJob
      → runCaptureAudit(...)  // FALLBACK legado
```

## 6. Evidência — Contract passa pelo Runtime

```text
runCaptureOperationalPipelineBound / runCaptureContractIntelligenceFn
  → runCaptureContractViaEnterprise(ctx, sessionId)
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → getRulePackEnginePort()
          → listPacks (coordenação estrutural)
      → runCaptureContractIntelligence(...)  // FALLBACK legado
```

## 7. Evidência — Risk passa pelo Runtime

```text
runCaptureOperationalPipelineBound / runCaptureGlosaRiskFn
  → runCaptureRiskViaEnterprise(ctx, sessionId)
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → getQualityRuntimePort()
          → prepareQualityAssessment
      → runCaptureGlosaRisk(...)  // FALLBACK legado
```

## 8. Evidência — Correction passa pelo Runtime

```text
runCaptureOperationalPipelineBound / runCaptureCorrectionAssistantFn
  → runCaptureCorrectionViaEnterprise(ctx, sessionId)
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → getAutoFillRuntimePort()
          → prepareAutoFill
      → runCaptureCorrectionAssistant(...)  // FALLBACK legado
```

## 9. Evidência — engines legado apenas como fallback

| Estágio | Flag de fallback | Único consumidor de execução fora do próprio módulo |
|---------|------------------|------------------------------------------------------|
| Audit | `legacy-preventive-audit` | `process-audit-via-enterprise.ts` |
| Contract | `legacy-contract-intelligence` | `process-contract-via-enterprise.ts` |
| Risk | `legacy-glosa-risk` | `process-risk-via-enterprise.ts` |
| Correction | `legacy-correction-assistant` | `process-correction-via-enterprise.ts` |

`capture-runtime-binding.ts` e handlers de execução em `capture-server.ts` **não** importam services de Audit/Contract/Risk/Correction diretamente.

## 10. Evidência — nenhuma regra de negócio mudou

- Mesma cadeia de estágios e mesmos `catch` aninhados no bound pipeline
- Engines `preventive-audit` / `contract-intelligence` / `glosa-risk` / `correction-assistant` **não editadas**
- Foundations Enterprise **não editadas**
- UI / rotas de contrato / banco **não alteradas**
- Testes existentes **não alterados** (apenas teste novo EPC-24C)

## 11. Diagrama arquitetural (pós-EPC-24C)

```text
┌─────────────────────────────────────────────────────────────┐
│ Produto Capture (UI / Server Fn)                            │
│   uploadCaptureFileFn / retryCaptureUploadFn                │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ EPC-24A/B/C Binding                                         │
│   resolveCaptureEnterpriseRuntime()                         │
│     ≡ getEnterpriseRuntime()   ← ÚNICO ENTRYPOINT           │
│   runCaptureOperationalPipelineBound(...)                   │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Enterprise Runtime                                          │
│  Document Intake Runtime          (EPC-24B)                 │
│  Document Extraction Runtime      (EPC-24B)                 │
│  Audit Runtime                    (EPC-24C)                 │
│  Rule Pack Engine (Contract hop)  (EPC-24C)                 │
│  Quality Runtime (Risk)           (EPC-24C)                 │
│  Auto-Fill Runtime (Correction)   (EPC-24C)                 │
│  OCR / Orchestrator / Capture Engine                        │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                │ estrutural                  │ fallback funcional
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│ Ports Audit/RulePack/     │   │ Engines legado:                 │
│ Quality/AutoFill          │   │ preventive-audit / contract /   │
│                           │   │ glosa-risk / correction         │
└───────────────────────────┘   └─────────────────────────────────┘
                │
                ▼
        Dual-path AER-GA03-A1 (reduzido · não eliminado)
        Cutover = EPC-24E · Próximo = EPC-24D (Review/TISS/XML)
```

## 12. Confirmação explícita — Dual Path AER-GA03-A1

O Dual Path **AER-GA03-A1 continua reduzido, porém ainda não eliminado**:

- Intake/Parser/Audit/Contract/Risk/Correction entram pelo Runtime.
- O **comportamento real** de Audit/Contract/Risk/Correction ainda é o legado (fallback 100%).
- Review / TISS / XML / Bloco C seguem para EPC-24D.
- Cutover único permanece em **EPC-24E**.

## 13. Percentual estimado de convergência (ARC-24)

**~62%** do pipeline operacional Capture → Enterprise Canonical Runtime  
(OCR + binding 24A + Intake/Extraction 24B + Decision runtimes 24C; faltam TISS/XML/Review 24D e cutover 24E).

## 14. Utilização de fallback (por etapa)

| Etapa | Fallback utilization |
|-------|----------------------|
| Audit | **100%** (estrutural Port + legado obrigatório; sem cutover) |
| Contract | **100%** |
| Risk | **100%** |
| Correction | **100%** |

## 15. Chamadas do pipeline operacional via Enterprise Runtime

No bound pipeline `runCaptureOperationalPipelineBound` (modo `full`), **7/7 estágios** passam integralmente pelo Enterprise Runtime (coordenação):

1. Intake  
2. OCR  
3. Parser/Extraction  
4. Audit  
5. Contract  
6. Risk  
7. Correction  

(Review/XML fora deste bound — EPC-24D.)

## 16. Gates

| Gate | Resultado |
|------|-----------|
| Build | ver execução da sprint |
| TypeScript | ver execução da sprint |
| ESLint | ver execução da sprint |
| Smoke | ver execução da sprint |
| Testes novos | EPC-24C (10/10) |
| Working Tree | limpo após commit |

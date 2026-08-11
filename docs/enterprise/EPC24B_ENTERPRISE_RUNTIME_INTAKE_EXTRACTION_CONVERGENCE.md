# EPC-24B — Enterprise Runtime Intake & Extraction Convergence

| Campo | Valor |
|-------|-------|
| Sprint | EPC-24B — Enterprise Runtime Intake & Extraction Convergence |
| Projeto | MedicFlow-AI |
| Data | 2026-08-10 |
| Tipo | Convergência Intake + Parser/Extraction (sem cutover) |
| Status | ✅ Concluída |
| Cutover | **Não executado** |
| Dual-path AER-GA03-A1 | **Parcial — reduzido; ainda não eliminado** |
| Roadmap | ARC-24 → EPC-24A → **EPC-24B** → EPC-24C → EPC-24D → EPC-24E |

---

## 1. Objetivo

Migrar **somente** Intake e a camada de Extraction (Parser) para o Enterprise Runtime iniciado na EPC-24A, preservando comportamento funcional e o pipeline legado como fallback.

## 2. O que NÃO foi feito (proibido)

- Cutover / remoção do dual-path
- Alteração de UI, regras de negócio, OCR, Audit, Contract, Risk, Correction, XML
- Alteração de banco, APIs públicas, Foundations 4–7
- Novo pipeline paralelo / código duplicado de engines
- Novo Gateway fora de `getEnterpriseRuntime()`

## 3. Arquivos alterados / criados

### Criados

| Arquivo | Papel |
|---------|-------|
| `src/lib/capture/enterprise/process-parser-via-enterprise.ts` | Gateway Parser → `DocumentExtractionRuntimePort` + fallback legado |
| `scripts/enterprise/tests/epc-24b-intake-extraction-convergence.test.ts` | Testes novos de convergência |
| `docs/enterprise/EPC24B_ENTERPRISE_RUNTIME_INTAKE_EXTRACTION_CONVERGENCE.md` | Este relatório |

### Alterados

| Arquivo | Mudança |
|---------|---------|
| `src/lib/capture/enterprise/register-capture-intake.ts` | Intake awaited + probe DocumentIntakeRuntime; resultado tipado |
| `src/lib/capture/enterprise/capture-runtime-binding.ts` | Intake no bound pipeline; Parser via gateway Enterprise |
| `src/lib/capture/api/capture-server.ts` | Upload/retry passam intake no bound; `runCaptureParserFn` via Enterprise |
| `src/lib/capture/api/capture-http-router.ts` | Intake awaited (best-effort) |
| `docs/enterprise/ENTERPRISE_RUNTIME_MIGRATION_PLAN.md` | EPC-24B marcada concluída |
| `docs/enterprise/ARCHITECTURAL_EXCEPTION_REGISTER.md` | AER-GA03-A1: dual-path reduzido |

## 4. Justificativa arquitetural

Strangler Fig (Convergence Rule / ARC-24):

1. `getEnterpriseRuntime()` permanece o **único** composition root.
2. Intake deixa de ser side-effect `void` opaco — é **awaited** no bound pipeline.
3. Parser deixa de ser importado pelos orquestradores de produto — é resolvido via `DocumentExtractionRuntimePort`, com o TISS Parser legado **somente** como fallback funcional.
4. OCR / Audit / Contract / Risk / Correction / XML permanecem intocados (EPC-24C+).
5. Sem cutover: AER-GA03-A1 reduzido, não fechado.

## 5. Evidência — Intake passa pelo Enterprise Runtime

```text
uploadCaptureFileFn / retryCaptureUploadFn
  → runCaptureOperationalPipelineBound(..., { intake })
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → registerCaptureDocumentIntakeBridge(intake)
          → probeCaptureIntakeViaEnterprise()
              → getDocumentIntakeRuntimePort().health()
              → getDocumentIntakePort().health()
          → registerCaptureDocumentIntake(...)  // Capture Engine → Intake Runtime
```

## 6. Evidência — Parser passa pelo Enterprise Runtime

```text
runCaptureOperationalPipelineBound / runCaptureParserFn
  → runCaptureParserViaEnterprise(ctx, sessionId)
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → getDocumentExtractionRuntimePort()
          → openJob → registerDocument → submitRequest
      → runCaptureParser(...)  // FALLBACK legado (mesmo comportamento)
      → closeJob
```

## 7. Evidência — Parser legado permanece apenas como fallback

- Único consumidor de execução de `runCaptureParser` fora de `capture/parser/*`:
  `src/lib/capture/enterprise/process-parser-via-enterprise.ts`
- `capture-runtime-binding.ts` e `capture-server.ts` **não** importam `tiss-parser-service`
- Flag de resultado: `extractionFallback: "legacy-tiss-parser"`

## 8. Evidência — nenhuma regra de negócio mudou

- Mesma cadeia de estágios e mesmos `catch` aninhados
- Engine `tiss-parser-service` / OCR / Audit / Contract / Risk / Correction **não editadas**
- Foundations Enterprise **não editadas**
- UI / rotas de contrato / banco **não alteradas**
- Testes existentes **não alterados** (apenas teste novo EPC-24B)

## 9. Diagrama arquitetural (pós-EPC-24B)

```text
┌─────────────────────────────────────────────────────────────┐
│ Produto Capture (UI / Server Fn)                            │
│   uploadCaptureFileFn / retryCaptureUploadFn                │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ EPC-24A/B Binding                                           │
│   resolveCaptureEnterpriseRuntime()                         │
│     ≡ getEnterpriseRuntime()   ← ÚNICO ENTRYPOINT           │
│   runCaptureOperationalPipelineBound(...)                   │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Enterprise Runtime                                          │
│  Document Intake Runtime  ← Intake awaited (EPC-24B)        │
│  Document Extraction Runtime ← Parser coordenado (EPC-24B)  │
│  OCR / Orchestrator / Capture Engine                        │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                │ estrutural                  │ fallback funcional
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│ Ports Intake/Extraction   │   │ Parser legado (tiss-parser)     │
│ (F3-CAP / DIP)            │   │ + OCR/Audit/Contract/Risk/…     │
└───────────────────────────┘   └─────────────────────────────────┘
                │
                ▼
        Dual-path AER-GA03-A1 (reduzido · não eliminado)
        Cutover = EPC-24E
```

## 10. Confirmação explícita — Dual Path AER-GA03-A1

O Dual Path **AER-GA03-A1 continua reduzido, porém ainda não eliminado**:

- Intake agora é estágio awaited no bound Runtime (não mais `void` paralelo opaco).
- Parser entra pelo Extraction Runtime, mas o **comportamento real** ainda é o legado.
- OCR/Audit/Contract/Risk/Correction seguem no caminho operacional legado.
- Cutover único permanece em **EPC-24E**.

## 11. Percentual estimado de convergência (ARC-24)

**~38%** do pipeline operacional Capture → Enterprise Canonical Runtime  
(OCR convergido + binding 24A + Intake/Extraction 24B; faltam Decision runtimes 24C, TISS/XML 24D e cutover 24E).

## 12. Gates

| Gate | Resultado |
|------|-----------|
| Build | ✅ PASS (`npm run build`) |
| TypeScript | ✅ PASS (`npx tsc --noEmit`) |
| ESLint | ✅ PASS (`npm run lint` — 0 errors; warnings pré-existentes) |
| Smoke | ✅ PASS (`npm run smoke-check`) |
| Testes novos | ✅ PASS EPC-24B (5/5) + EPC-24A regressão (3/3) |
| Working Tree | ✅ limpo após commit |
| Ahead/Behind | ver seção git pós-push |

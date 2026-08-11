# EPC-24A — Enterprise Runtime Convergence Binding

| Campo | Valor |
|-------|-------|
| Sprint | EPC-24A — Enterprise Runtime Convergence Binding |
| Projeto | MedicFlow-AI |
| Data | 2026-08-10 |
| Tipo | Binding arquitetural (sem funcionalidade nova) |
| Status | ✅ Concluída |
| Cutover | **Não executado** |
| Dual-path AER-GA03-A1 | **Parcial — eliminação iniciada sem regressões** |

---

## 1. Objetivo

Iniciar a convergência definitiva entre o pipeline operacional Capture e o Enterprise Runtime **somente via binding**, sem alterar comportamento.

## 2. O que NÃO foi feito (proibido)

- Runtime / Parser / OCR / XML novos
- Alteração de regra de negócio, UI, fluxo funcional, banco, APIs
- Alteração de testes existentes
- Alteração das Foundations (Fases 4–7 / módulos Enterprise)
- Cutover / remoção do dual-path

## 3. Arquivos alterados / criados

### Criados

| Arquivo | Papel |
|---------|-------|
| `src/lib/capture/enterprise/resolve-enterprise-runtime.ts` | Composition root oficial Capture → `getEnterpriseRuntime()` |
| `src/lib/capture/enterprise/capture-runtime-binding.ts` | Facade do pipeline operacional sob o Runtime |
| `scripts/enterprise/tests/epc-24a-runtime-convergence-binding.test.ts` | Teste novo de coordenação/binding |
| `docs/enterprise/EPC24A_ENTERPRISE_RUNTIME_CONVERGENCE_BINDING.md` | Este relatório |

### Alterados (binding only)

| Arquivo | Mudança |
|---------|---------|
| `src/lib/capture/api/capture-server.ts` | Upload/retry chamam `runCaptureOperationalPipelineBound` |
| `src/lib/capture/enterprise/register-capture-intake.ts` | Entra via `resolveCaptureEnterpriseRuntime()` |
| `src/lib/capture/enterprise/tiss-knowledge-gateway.ts` | Entra via `resolveCaptureEnterpriseRuntime()` |
| `src/lib/capture/ocr/enterprise/process-ocr-via-enterprise.ts` | Entra via `resolveCaptureEnterpriseRuntime()` |
| `src/lib/capture/ocr/providers/azure-document-intelligence-provider.ts` | Health via composition root Capture |
| `src/lib/capture/infrastructure/enterprise-storage-bridge.ts` | Acknowledge do Runtime antes do bound storage |
| `docs/enterprise/ENTERPRISE_RUNTIME_MIGRATION_PLAN.md` | EPC-24A marcada concluída |
| `docs/enterprise/ARCHITECTURAL_EXCEPTION_REGISTER.md` | AER-GA03-A1: eliminação iniciada |

## 4. Justificativa arquitetural

Convergência por *strangler fig* (ARC-24 / Convergence Rule):

1. Declarar `getEnterpriseRuntime()` como **único** ponto de entrada Enterprise do Capture.
2. Extrair a orquestração imperativa para uma facade ligada ao Runtime.
3. Manter engines legado intactas (preparar substituição sem cutover).
4. Remover imports diretos de `getEnterpriseRuntime` espalhados no Capture em favor do resolver oficial.

## 5. Pontos ligados ao Enterprise Runtime

| Ponto Capture | Entrada Runtime |
|---------------|-----------------|
| Upload / retry pipeline | `resolveCaptureEnterpriseRuntime` + `runCaptureOperationalPipelineBound` |
| Document Intake bridge | `registerCaptureDocumentIntake` |
| OCR produção | `getCaptureEngineRuntimePort().processOcr` / `getOCRProviderPort` |
| TISS knowledge | `getTISSRuntimePort` (via gateway) |
| Storage bound | Acknowledge Runtime + `createBoundStorageProviderPort` (AER-GA03-A3) |
| Orchestrator probe | `getOrchestratorPort().health` + Capture Engine health |

## 6. Evidência — Capture entra pelo Runtime

```text
uploadCaptureFileFn / retryCaptureUploadFn
  → runCaptureOperationalPipelineBound(...)
      → resolveCaptureEnterpriseRuntime()  // = getEnterpriseRuntime()
      → probeCaptureEnterpriseRuntimeBinding()
          → getOrchestratorPort().health()
          → getCaptureEngineRuntimePort().health()
      → runCaptureOcr / Parser / Audit / … (legado idêntico)
```

Intake paralelo (AER-GA03-A1):

```text
registerCaptureDocumentIntakeBridge
  → resolveCaptureEnterpriseRuntime().registerCaptureDocumentIntake(...)
```

## 7. Evidência — nenhuma regra de negócio mudou

- Mesma cadeia de estágios e mesmos `catch` aninhados (comentários preservados).
- Engines (`ocr-service`, `tiss-parser-service`, audit/contract/risk/correction) **não editadas**.
- Foundations Enterprise **não editadas**.
- UI / rotas / banco / APIs HTTP de contrato **não alteradas**.
- Testes existentes **não alterados** (apenas teste novo de binding).

## 8. Diagrama arquitetural atualizado (pós-EPC-24A)

```text
┌─────────────────────────────────────────────────────────────┐
│ Produto Capture (UI / Server Fn)                            │
│   uploadCaptureFileFn / retryCaptureUploadFn                │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ EPC-24A Binding                                             │
│   resolveCaptureEnterpriseRuntime()                         │
│     ≡ getEnterpriseRuntime()   ← ÚNICO ENTRYPOINT           │
│   runCaptureOperationalPipelineBound(...)                   │
│   registerCaptureDocumentIntakeBridge(...)  (side-effect)   │
└───────────────┬─────────────────────────────┬───────────────┘
                │                             │
                │ estrutural                  │ operacional (legado)
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────┐
│ Enterprise Runtime        │   │ Pipeline operacional Capture    │
│  Orchestrator (probe)     │   │  OCR → Parser → Audit →         │
│  Capture Engine           │   │  Contract → Risk → Correction    │
│  Document Intake          │   │  (comportamento idêntico)       │
│  OCR / TISS Ports         │   └─────────────────────────────────┘
└───────────────────────────┘
                │
                ▼
        Dual-path AER-GA03-A1 (parcial)
        Eliminação iniciada · Cutover = EPC-24E
```

## 9. Confirmação explícita — Dual Path AER-GA03-A1

O Dual Path **AER-GA03-A1 ainda existe parcialmente**:

- Caminho funcional: pipeline operacional legado (agora sob facade de binding).
- Caminho estrutural: Document Intake Enterprise (side-effect best-effort).

A eliminação foi **iniciada** nesta sprint (composition root único + facade), **sem regressões** e **sem cutover**.
Fechamento completo fica para EPC-24B…EPC-24E conforme Migration Plan.

## 10. Gates

| Gate | Resultado |
|------|-----------|
| Build | ✅ PASS (`npm run build`) |
| TypeScript | ✅ PASS (`npx tsc --noEmit`) |
| ESLint | ✅ PASS (`npm run lint` — 0 errors; warnings pré-existentes) |
| Smoke | ✅ PASS (`npm run smoke-check`) |
| Testes | ✅ PASS binding novo (3/3); testes existentes **não alterados** |
| Working Tree | ✅ limpo após commit |
| Ahead/Behind | ver seção git pós-push |

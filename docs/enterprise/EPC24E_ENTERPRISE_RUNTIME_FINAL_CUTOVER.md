# EPC-24E — Enterprise Runtime Final Cutover (ARC-24)

| Campo | Valor |
|-------|-------|
| Sprint | EPC-24E — Enterprise Runtime Final Cutover |
| Projeto | MedicFlow-AI |
| Data | 2026-08-11 |
| Tipo | Cutover arquitetural (sem funcionalidades novas) |
| Status | ✅ Concluída |
| Dual-path AER-GA03-A1 | **Resolvida** |
| Roadmap | ARC-24 → EPC-24A → EPC-24B → EPC-24C → EPC-24D → **EPC-24E** |

---

## 1. Objetivo

Concluir definitivamente a convergência ARC-24: transformar o Enterprise Runtime no **único** pipeline oficial do produto e eliminar a exceção AER-GA03-A1.

## 2. O que NÃO foi feito (proibido)

- Novas funcionalidades / regras clínicas
- Alteração de engines OCR / Parser / Audit / Contract / Risk / Correction / Review / XML
- Alteração de UI / banco / APIs públicas
- Alteração de Foundations 4–7 / Blocos H/I/J

## 3. Arquivos alterados / criados

### Criados

| Arquivo | Papel |
|---------|-------|
| `src/lib/capture/enterprise/process-ocr-via-enterprise.ts` | Gateway OCR sessão → Runtime (Server Fn sem import direto) |
| `scripts/enterprise/tests/epc-24e-enterprise-runtime-final-cutover.test.ts` | Prova de pipeline único + ausência de Dual Path |
| `docs/enterprise/EPC24E_ENTERPRISE_RUNTIME_FINAL_CUTOVER.md` | Este relatório |

### Alterados

| Arquivo | Mudança |
|---------|---------|
| `process-*-via-enterprise.ts` (parser/audit/contract/risk/correction/review/xml/bloco-c) | Remoção flags `*Fallback`; engines = implementação interna |
| `capture-runtime-binding.ts` | OCR via gateway; `singlePipeline: true`; AER-GA03-A1 Resolvida |
| `register-capture-intake.ts` / `resolve-enterprise-runtime.ts` | Docs cutover |
| `capture-server.ts` | OCR/get OCR via gateway; sem import `ocr-service` |
| `epc-24b/c/d` tests | Remoção asserções Dual Path / fallback |
| `ENTERPRISE_RUNTIME_MIGRATION_PLAN.md` | EPC-24E concluída |
| `ARCHITECTURAL_EXCEPTION_REGISTER.md` | AER-GA03-A1 **Resolvida** |
| `ARC24_ENTERPRISE_RUNTIME_CONVERGENCE_DISCOVERY.md` | Conclusão pós-cutover |

## 4. Justificativa arquitetural

1. `getEnterpriseRuntime()` é o **único** composition root operacional.
2. Server Fns **não** executam engines legado diretamente.
3. Engines legado permanecem **somente** como implementação interna dos gateways.
4. Flags `*Fallback` (mecanismo Dual Path de convergência) foram removidas.
5. Intake deixa de ser descrito como side-effect paralelo Dual Path.
6. Comportamento observável preservado (sem mudança de regra).

## 5. Fallbacks arquiteturais removidos

| Fallback removido | Antes | Depois |
|-------------------|-------|--------|
| `extractionFallback` | Dual Path explícito | Implementação interna |
| `auditFallback` | Dual Path explícito | Implementação interna |
| `contractFallback` | Dual Path explícito | Implementação interna |
| `riskFallback` | Dual Path explícito | Implementação interna |
| `correctionFallback` | Dual Path explícito | Implementação interna |
| `reviewFallback` | Dual Path explícito | Implementação interna |
| `xmlFallback` | Dual Path explícito | Implementação interna |
| `blocoCFallback` | Dual Path explícito | `singlePipeline: true` |
| OCR Server Fn → `runCaptureOcr` direto | Bypass de gateway | `runCaptureOcrViaEnterprise` |
| Binding → `runCaptureOcr` direto | Bypass de gateway | `runCaptureOcrViaEnterprise` |

## 6. Diagrama final do pipeline

```text
┌─────────────────────────────────────────────────────────────┐
│ Produto (UI / Server Fn)                                    │
│   uploadCaptureFileFn / review-server / tiss-server XML     │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│ ÚNICO ENTRYPOINT                                            │
│   resolveCaptureEnterpriseRuntime()                         │
│     ≡ getEnterpriseRuntime()                                │
│   runCaptureOperationalPipelineBound / gateways ViaEnterprise│
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Enterprise Runtime (pipeline oficial único)                 │
│  Intake / OCR / Extraction / Audit / RulePack / Quality     │
│  AutoFill / Validation / XML* / Workflow / Batch / Protocol │
│  Orchestrator / Capture Engine                              │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│ Implementação interna autorizada (NÃO é Dual Path)          │
│  ocr-service / tiss-parser / preventive-audit / contract /  │
│  glosa-risk / correction / review-workspace / xml-export    │
└─────────────────────────────────────────────────────────────┘

        Dual Path AER-GA03-A1 = INEXISTENTE (Resolvida)
```

## 7. Confirmação explícita

- **Não existe Dual Path** operacional Capture ↔ Enterprise.
- **Não existe execução direta** de engines legado por Server Functions.
- **getEnterpriseRuntime()** é o único entrypoint operacional.

## 8. Conclusão

**O MedicFlow-AI possui agora um único pipeline oficial coordenado pelo Enterprise Runtime.**

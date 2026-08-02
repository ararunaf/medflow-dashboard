# DIP-01 — Document Intake Runtime Architecture

**Sprint:** DIP-01 — Document Intake Runtime  
**Data:** 02/08/2026  
**Documento pai:** [`DIP-01_DOCUMENT_INTAKE_RUNTIME.md`](./DIP-01_DOCUMENT_INTAKE_RUNTIME.md)

---

## 1. Diagrama oficial

```
┌─────────────────────────────────────────────────────────────┐
│ Produto (Captura upload)                                    │
│  uploadCaptureFileFn / HTTP POST /capture                   │
│           ↓ (side-effect best-effort)                       │
│  registerCaptureDocumentIntakeBridge                        │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Enterprise Runtime (composition root)                       │
│  getEnterpriseRuntime().registerCaptureDocumentIntake       │
│           ↓                                                 │
│  getDocumentIntakeRuntimePort().registerIntake(canonical)   │
└───────────────────────────┬─────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ DocumentIntakeRuntimePort                                   │
│  DefaultDocumentIntakeRuntimeAdapter                        │
│  InMemoryDocumentIntakeRuntimeStore (sessões)               │
└───────────────┬─────────────────────────────┬───────────────┘
                ↓                             ↓
┌───────────────────────────┐   ┌─────────────────────────────┐
│ Canonical Execution       │   │ DocumentIntakePort (EPC-12) │
│ Orchestrator Port         │   │ → Default/Mock Adapter      │
│ (coordena, não executa)   │   │ → DocumentIntakeStore       │
└───────────────────────────┘   └─────────────────────────────┘
```

---

## 2. Árvore ECS-01

```
src/lib/enterprise/document-intake-runtime/
├── index.ts
├── ports/
│   ├── document-intake-runtime-port.ts
│   ├── types.ts
│   ├── models.ts
│   ├── identity.ts
│   └── index.ts
├── adapters/
│   ├── default-document-intake-runtime-adapter.ts
│   ├── mock-document-intake-runtime-adapter.ts
│   └── index.ts
├── store/
│   ├── document-intake-runtime-store.ts
│   ├── in-memory-document-intake-runtime-store.ts
│   └── index.ts
├── factory/
│   ├── document-intake-runtime-factory.ts
│   └── index.ts
├── providers/
│   ├── create-document-intake-runtime-port.ts
│   └── index.ts
└── demo/
    ├── document-intake-runtime-health-query.ts
    └── index.ts
```

---

## 3. Decisões arquiteturais

| Decisão | Motivo |
|---------|--------|
| Sem pasta `application/` | Composition root = Enterprise Runtime (ECS-01 Application Layer Decision) |
| `enterpriseDeps` injetados | Evita ciclo Runtime ↔ Intake Runtime e proíbe implementação paralela |
| Store próprio de sessões | Rastreia ciclo DIP-01 sem duplicar `DocumentIntake` |
| Bridge Captura inalterado | Preserva UI/API/comportamento (ARCH-01) |
| Default exige Ports Enterprise | Certifica uso exclusivo de Orchestrator + DocumentIntakePort |

---

## 4. O que é proibido

- Produto importar `DefaultDocumentIntakeAdapter` / stores Enterprise diretamente
- Document Intake Runtime criar intake sem passar pelo `DocumentIntakePort`
- Document Intake Runtime pular o Canonical Execution Orchestrator
- Nova implementação de upload / OCR / parser / TISS nesta sprint

---

## 5. Relação com ARCH-01 / EPC-12 / EPC-24

| Componente | Papel em DIP-01 |
|------------|-----------------|
| ARCH-01 Enterprise Runtime | Único ponto de acesso do produto |
| DIP-01 Document Intake Runtime | Orquestra o registro funcional canônico |
| EPC-24 Canonical Orchestrator | Coordena execução estrutural |
| EPC-12 DocumentIntakePort | Persiste intake canônico (store in-process) |

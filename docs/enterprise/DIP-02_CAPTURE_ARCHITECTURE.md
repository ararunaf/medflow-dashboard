# DIP-02 — Capture Architecture

**Sprint:** DIP-02 — Capture Engine Runtime  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Cadeia obrigatória

```
Produto (Captura upload)
        ↓
getEnterpriseRuntime()
        ↓
registerCaptureDocumentIntake(...)
        ↓
CaptureEngineRuntimePort.registerCapture
        ↓
CanonicalExecutionOrchestratorPort.startExecution
        ↓
DocumentIntakeRuntimePort.registerIntake
        ↓
CanonicalExecutionOrchestratorPort.startExecution   (coordenação DIP-01)
        ↓
DocumentIntakePort.createIntake
        ↓
Adapter → Implementação existente (in-memory / registry)
```

É **proibido** acessar adapters ou stores concretos a partir do produto.

---

## 2. Estrutura do módulo

```
src/lib/enterprise/capture-engine-runtime/
├── index.ts
├── ports/
│   ├── capture-engine-runtime-port.ts
│   ├── types.ts
│   ├── models.ts
│   ├── identity.ts
│   └── index.ts
├── adapters/
│   ├── default-capture-engine-runtime-adapter.ts
│   ├── mock-capture-engine-runtime-adapter.ts
│   └── index.ts
├── store/
│   ├── capture-engine-runtime-store.ts
│   ├── in-memory-capture-engine-runtime-store.ts
│   └── index.ts
├── factory/
│   ├── capture-engine-runtime-factory.ts
│   └── index.ts
├── providers/
│   ├── create-capture-engine-runtime-port.ts
│   └── index.ts
└── demo/
    ├── capture-engine-runtime-health-query.ts
    └── index.ts
```

---

## 3. Injeção de dependências (`enterpriseDeps`)

```ts
type CaptureEngineRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  getDocumentIntakeRuntimePort(): DocumentIntakeRuntimePort;
};
```

O adapter **default** falha se `enterpriseDeps` não for fornecido — impede implementação paralela.

---

## 4. Papel de cada camada

| Camada | Responsabilidade |
|--------|------------------|
| Produto | Upload físico existente; bridge best-effort |
| Enterprise Runtime | Composition root; resolve Ports |
| CaptureEngineRuntimePort | Coordenação canônica da captura |
| Canonical Execution Orchestrator | Coordenação estrutural (sem OCR/IA) |
| DocumentIntakeRuntime | Coordenação de intake (DIP-01) |
| DocumentIntakePort | Persistência/registro canônico de intake |
| Adapter / Store | Mecanismo; sem regras clínicas |

---

## 5. Fronteiras explícitas

- Sem OCR / IA / parser / classificação / TISS
- Sem Workflow / Rule Engine novos
- Sem Storage Manager / versionamento / busca
- Sem migrations
- Sem alteração de UI ou contratos HTTP/API do produto
- Sem acesso direto a implementações concretas pelo produto

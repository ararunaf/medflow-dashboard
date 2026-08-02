# DIP-03 — OCR Runtime Architecture

**Sprint:** DIP-03 — OCR Runtime Foundation  
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
DocumentIntakePort.createIntake
        ↓
OCRRuntimePort.coordinateOcr
        ↓
CanonicalExecutionOrchestratorPort.startExecution
        ↓
OCRProviderPort.health() / capabilities()   (estrutural — EPC-15)
        ↓
Provider futuro (referência estrutural apenas)
```

É **proibido**:

- acessar adapters/stores concretos a partir do produto
- chamar `OCRProviderPort.process()` nesta sprint
- conectar Azure / Google Vision / Textract / Tesseract
- extrair texto ou interpretar documentos

---

## 2. Estrutura do módulo

```
src/lib/enterprise/ocr-runtime/
├── index.ts
├── ports/
│   ├── ocr-runtime-port.ts
│   ├── types.ts
│   ├── models.ts
│   ├── identity.ts
│   └── index.ts
├── adapters/
│   ├── default-ocr-runtime-adapter.ts
│   ├── mock-ocr-runtime-adapter.ts
│   └── index.ts
├── store/
│   ├── ocr-runtime-store.ts
│   ├── in-memory-ocr-runtime-store.ts
│   └── index.ts
├── factory/
│   ├── ocr-runtime-factory.ts
│   └── index.ts
├── providers/
│   ├── create-ocr-runtime-port.ts
│   └── index.ts
└── demo/
    ├── ocr-runtime-health-query.ts
    └── index.ts
```

---

## 3. Injeção de dependências

### OCR Runtime

```ts
type OCRRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  getOCRProviderPort(): OCRProviderPort;
};
```

### Capture Engine Runtime (atualizado)

```ts
type CaptureEngineRuntimeEnterpriseDeps = {
  getOrchestratorPort(): CanonicalExecutionOrchestratorPort;
  getDocumentIntakeRuntimePort(): DocumentIntakeRuntimePort;
  getOCRRuntimePort(): OCRRuntimePort;
};
```

O adapter **default** falha se `enterpriseDeps` não for fornecido — impede implementação paralela.

---

## 4. Ordem de composição no Enterprise Runtime

1. `DocumentIntakePort`
2. `CanonicalExecutionOrchestratorPort`
3. `DocumentIntakeRuntimePort`
4. `OCRProviderPort` (EPC-15 estrutural)
5. `OCRRuntimePort` (deps: Orchestrator + OCRProvider)
6. `CaptureEngineRuntimePort` (deps: Orchestrator + DocumentIntakeRuntime + OCRRuntime)

Sem ciclos de import: OCR Runtime não depende de Capture Engine; Capture chama OCR.

---

## 5. Papel de cada camada

| Camada | Responsabilidade |
|--------|------------------|
| Produto | Upload físico existente; bridge best-effort |
| Enterprise Runtime | Composition root; resolve Ports |
| CaptureEngineRuntimePort | Coordenação canônica da captura + chamada OCR Runtime |
| OCRRuntimePort | Coordenação estrutural OCR (sem execução) |
| Canonical Execution Orchestrator | Coordenação estrutural de execução |
| OCR Provider Adapter (EPC-15) | Health/capabilities/providerInfo apenas |
| Provider futuro | Referência estrutural (`azure`, `google-vision`, …) |

---

## 6. Fronteiras explícitas

- Sem OCR real / extração / interpretação
- Sem Azure / Google Vision / Textract / Tesseract conectados
- Sem classificação documental (DIP-04)
- Sem Workflow / Rule Engine novos
- Sem migrations
- Sem alteração de UI ou contratos HTTP/API do produto
- Capabilities tecnológicas (`supportsPdf`, `supportsImage`, …) = FALSE

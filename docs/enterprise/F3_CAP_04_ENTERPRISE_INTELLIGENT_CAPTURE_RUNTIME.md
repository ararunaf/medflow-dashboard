# F3-CAP-04 — Enterprise Intelligent Capture Integration Foundation

**Sprint:** F3-CAP-04 — Enterprise Intelligent Capture Integration Foundation  
**Roadmap:** Fase 3 — Bloco A — Captura Inteligente  
**Padrão:** ECS-01 (Port → Provider → Factory → Registry → Adapter → Store)  
**Data:** 2026-08-04

---

## Objetivo

Criar a camada oficial de integração estrutural entre:

- Scanner Runtime
- Watch Folder Runtime
- Upload Runtime

Esta camada é a porta oficial de entrada documental da plataforma.

**Ela NÃO executa captura. NÃO processa documentos. Apenas orquestra estruturalmente os três Runtimes.**

---

## Escopo entregue

| Item | Status |
|------|--------|
| `src/lib/enterprise/intelligent-capture-runtime/` | Criado |
| `IntelligentCaptureRuntimePort` | Criado |
| Provider / Factory / Registry | Criados (`mock`, `test`, `default`, `enterprise`) |
| Adapters (Default / Enterprise alias / Mock) | Criados |
| Store in-memory | Criado |
| Demo `getIntelligentCaptureRuntimeHealthSummary()` | Criado |
| Integração Enterprise Runtime (`getIntelligentCaptureRuntimePort` + `intelligentCaptureRuntimeOk`) | Criada |
| Teste `enterprise:intelligent-capture-runtime:test` | Criado |

---

## Fora de escopo (proibido nesta sprint)

- OCR / IA / Pipeline / Classificação
- Captura automática / Seleção automática
- Leitura de arquivos / Processamento documental
- Scanner real / Watch Folder real / Upload real
- Workers / Scheduler / Filas / Persistência / APIs
- Alterações em Capture existente, Centro Operacional, XML, TISS, Enterprise Foundation existente (além do wiring aditivo)

---

## Capabilities (todas `false` para implementação real)

- `scannerIntegrationImplemented`
- `watchFolderIntegrationImplemented`
- `uploadIntegrationImplemented`
- `capturePipelineImplemented`
- `documentRoutingImplemented`
- `automaticSelectionImplemented`
- `automaticCaptureImplemented`
- `ocrPipelineImplemented`
- `classificationPipelineImplemented`
- `processingPipelineImplemented`

---

## Contratos estruturais

- `CaptureSource`
- `CaptureRequest`
- `CaptureEnvelope`
- `CaptureOrigin`
- `CaptureChannel`
- `CaptureStatus`
- `CaptureHealth`
- `CaptureCapabilities`
- `CaptureRoute`
- `CaptureResult`

---

## Wiring estrutural de dependências

Preparado (sem consumo funcional):

- Scanner Runtime
- Watch Folder Runtime
- Upload Runtime
- OCR Runtime (futuro)
- Persistent Queue Runtime
- Worker Runtime
- Scheduler Runtime
- Observability Runtime

---

## Acesso oficial

```ts
const port = runtime.getIntelligentCaptureRuntimePort();
const health = await runtime.health(); // health.intelligentCaptureRuntimeOk
```

Fluxo obrigatório:

`Produto → Enterprise Runtime → IntelligentCaptureRuntimePort → Adapter → Store → CaptureResult`

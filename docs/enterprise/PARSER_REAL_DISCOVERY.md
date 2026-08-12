# Parser Real — Discovery

| Campo    | Valor                                                  |
| -------- | ------------------------------------------------------ |
| Sprint   | A2-01 — Parser Real Discovery                          |
| Projeto  | MedicFlow-AI                                           |
| Baseline | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`    |
| Status   | **MAPEADO** — nenhuma alteração arquitetural realizada |

---

## 1. Objetivo

Mapear a ativação do Parser real para documentos TISS sem alterar a arquitetura Enterprise certificada, identificando provedores, adapters, fluxo `PARSED`, dependências, secrets, pontos de mock e o caminho de cutover recomendado.

---

## 2. Arquitetura atual

### 2.1 Ponto único de entrada

- `getEnterpriseRuntime()` em `src/lib/enterprise/runtime/create-enterprise-runtime.ts` continua como único entrypoint.
- O `DefaultEnterpriseRuntime` constrói `DocumentExtractionRuntimePort` em seu composition root via `createDocumentExtractionRuntimePort({ provider: "enterprise" })`.
- Nenhum Runtime, Gateway ou Pipeline paralelo foi criado.

### 2.2 Porta oficial

- `DocumentExtractionRuntimePort` (`src/lib/enterprise/document-extraction-runtime/ports/document-extraction-runtime-port.ts`)
- Operações estruturais: `openJob`, `closeJob`, `submitRequest`, `registerDocument`, `getResult`, `stats`, `health`, `capabilities`, `providerInfo`.
- Contrato F3-CAP-07: infraestrutura canônica de orquestração de jobs/requests/documentos de extração.

### 2.3 Fluxo TISS PARSED

```text
OCR_COMPLETED (queue enterprise-tiss)
  → WorkerQueueConsumer (QueueRuntimePort)
  → processTissParserJob
  → DocumentExtractionRuntimePort.submitRequest / getResult
  → QueueRuntimePort.enqueue (PARSED)
```

- Entrypoint: `processTissOcrParsed` (`src/lib/enterprise/runtime/process-tiss-ocr-parsed.ts`).
- Handler: `processTissParserJob` (`src/lib/enterprise/queue-runtime/operational/process-tiss-parser-job.ts`).
- O `DocumentExtractionRuntimePort` é acessado exclusivamente através de `getEnterpriseRuntime().getDocumentExtractionRuntimePort()`.

### 2.4 Bridge oficial de Parser (produto legado integrado)

- `src/lib/capture/enterprise/process-parser-via-enterprise.ts`
- Coordena via `DocumentExtractionRuntimePort.openJob/registerDocument/submitRequest/closeJob`.
- Invoca `runCaptureParser` (`src/lib/capture/parser/services/tiss-parser-service.ts`) como implementação interna autorizada.
- Esse é o único caminho de execução real de Parser que hoje passa pelo `getEnterpriseRuntime()`.

---

## 3. Providers encontrados

| Provider Id  | Adapter                                   | Status | Descrição                            |
| ------------ | ----------------------------------------- | ------ | ------------------------------------ |
| `enterprise` | `DefaultDocumentExtractionRuntimeAdapter` | ready  | Oficial F3-CAP-07 — estrutural.      |
| `default`    | `DefaultDocumentExtractionRuntimeAdapter` | ready  | Alias para `enterprise`.             |
| `mock`       | `MockDocumentExtractionRuntimeAdapter`    | ready  | Determinístico in-process, sem rede. |
| `test`       | `MockDocumentExtractionRuntimeAdapter`    | ready  | Alias para `mock`.                   |

- Registry: `src/lib/enterprise/document-extraction-runtime/registry/document-extraction-runtime-registry.ts`.
- Factory: `src/lib/enterprise/document-extraction-runtime/factory/document-extraction-runtime-factory.ts`.

---

## 4. Adapters existentes

### 4.1 `DefaultDocumentExtractionRuntimeAdapter`

- Local: `src/lib/enterprise/document-extraction-runtime/adapters/default-document-extraction-runtime-adapter.ts`.
- Também exportado como `EnterpriseDocumentExtractionRuntimeAdapter`.
- Comportamento: orquestra jobs, requests e documentos em memória (`InMemoryDocumentExtractionRuntimeStore`).
- **Não executa extração real**: `fieldExtractionImplemented: false`, `structuredExtractionImplemented: false`, `medicalGuideExtractionImplemented: false`, etc.
- Defaults: `defaultTimeoutMs = 5_000`, `defaultRetryCount = 1`, `defaultRetryBackoffMs = 50`.
- Implementa `supportsTimeout`, `supportsRetry`, `supportsTelemetry`.

### 4.2 `MockDocumentExtractionRuntimeAdapter`

- Local: `src/lib/enterprise/document-extraction-runtime/adapters/mock-document-extraction-runtime-adapter.ts`.
- Delega para `DefaultDocumentExtractionRuntimeAdapter` com `simulated: true`.
- Sem extração real. Sem rede. Usado em testes e demos.

### 4.3 Parser real (fora do Port, via bridge autorizada)

- `src/lib/capture/parser/engine/tiss-parser.ts` — `TissParser.parse(ocr)` interpreta `RawOcrResult` e gera `StructuredGuide`.
- `src/lib/capture/parser/services/tiss-parser-service.ts` — `TissParserService` orquestra `CaptureSession → OCR → Parser → Persistência`.
- `src/lib/enterprise/tiss-engine/tiss-parser/tiss-parser-engine.ts` — registry/canonical de parsers TISS (knowledge + layout), ainda não conectado ao pipeline operacional.

---

## 5. Provider recomendado

### Recomendação A2-01

**Provider oficial:** `enterprise` (`DefaultDocumentExtractionRuntimeAdapter`).

**Estratégia de ativação sem alterar arquitetura:**

1. **Imediata (sem mudança em `src`):**
   - Continuar usando `runCaptureParserViaEnterprise` (`src/lib/capture/enterprise/process-parser-via-enterprise.ts`) como Parser real atrás do `DocumentExtractionRuntimePort`.
   - Essa bridge é o caminho oficial EPC-24E e já integra `TissParser` com o composition root `getEnterpriseRuntime()`.

2. **Médio prazo (ativação canônica do Port):**
   - Criar um adapter real (`RealTissDocumentExtractionRuntimeAdapter`) que implemente `DocumentExtractionRuntimePort` e chame `TissParser.parse(...)` dentro de `submitRequest`/`getResult`.
   - Registrá-lo na factory/registry como provider `enterprise` ou `tiss`.
   - Injetá-lo via `createEnterpriseRuntime({ documentExtractionRuntimePort: ... })` em testes/cutover.
   - O TISS handler `processTissParserJob` passará a consumir Parser real automaticamente, sem alterações no handler.

---

## 6. Estratégia de ativação

1. **Usar a bridge EPC-24E** para atender chamadas de produto que precisam de Parser real agora.
2. **Avaliar complexidade** do `TissParser` (campos, templates, `detectGuideType`, `extractFields`, `groupFields`) para encapsulá-lo em um `DocumentExtractionRuntimeAdapter`.
3. **Mapear dependências do Parser real**: `RawOcrResult`, templates (`src/lib/capture/parser/templates`), OCR storage, `CaptureSession`.
4. **Implementar adapter real** mantendo a mesma assinatura `DocumentExtractionRuntimePort`.
5. **Substituir adapter no composition root** via factory ou `createEnterpriseRuntime` options.
6. **Certificar** com os cenários da próxima sprint (A2-02/A2-03) antes de promover para produção.

---

## 7. Riscos

| Risco                                                                                                  | Impacto                                                                 | Mitigação                                                                      |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Parser real reside em `src/lib/capture/parser`, fora da fundação `document-extraction-runtime`.        | Duplo caminho potencial se `TissParserService` for chamado diretamente. | Usar exclusivamente `process-parser-via-enterprise.ts` ou um adapter canônico. |
| `DefaultDocumentExtractionRuntimeAdapter` é estrutural; todos os flags de extração real estão `false`. | Ativação real exige novo adapter.                                       | Implementar adapter canônico sem mudar o Port.                                 |
| `TissParser` depende de `RawOcrResult` e templates hardcoded.                                          | Portabilidade e testabilidade.                                          | Extrair dependências para `knowledgeId`/`layoutId` do `TissParserEngine`.      |
| Retry e DLQ já estão estruturais, mas o Parser real pode falhar por OCR ruim/template incompatível.    | Nack repetidos podem encher DLQ.                                        | Garantir threshold de retry e métricas de confiança no `StructuredGuide`.      |

---

## 8. Dependências externas

- **Nenhuma API externa** para o Parser atual.
- Dependências internas:
  - `RawOcrResult` (`src/lib/capture/ocr/types/raw-ocr-result.ts`)
  - `TissParser` (`src/lib/capture/parser/engine/tiss-parser.ts`)
  - Templates (`src/lib/capture/parser/templates/*`)
  - `CaptureSession` / OCR storage (`src/lib/capture/ocr/infrastructure/ocr-storage.ts`)
  - `TissKnowledgeEngine` e `TissLayoutEngine` (`src/lib/enterprise/tiss-engine/*`)

---

## 9. Secrets necessários

- **Nenhum secret específico** para o Parser em si.
- O OCR anterior exige `MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT` e `MEDFLOW_AZURE_DOCUMENT_INTELLIGENCE_KEY`.
- O Parser consome o OCR como entrada; não adiciona novos segredos.

---

## 10. Composition Root

- `getEnterpriseRuntime()` instancia `documentExtractionRuntimePort` via `createDocumentExtractionRuntimePort({ provider: "enterprise", enterpriseDeps: { ... } })`.
- `enterpriseDeps` faz shape-check de peers: `DocumentClassificationRuntimePort`, `OCRRuntimePort`, `IntelligentCaptureRuntimePort`, `Scanner`, `WatchFolder`, `Upload`, `PersistentQueue`, `Worker`, `Scheduler`, `Observability`, `Scalability`.
- Nenhum produto chama a factory diretamente; o acesso é via `runtime.getDocumentExtractionRuntimePort()`.

---

## 11. Retry

- `DefaultDocumentExtractionRuntimeAdapter` declara `supportsRetry: true`.
- Defaults: `defaultRetryCount = 1`, `defaultRetryBackoffMs = 50`.
- O adapter aplica retry interno nas operações (com timeout e backoff configuráveis).
- `processTissParserJob` traduz falhas de `submitRequest`/`getResult` em `settle: "nack"`, permitindo que o `WorkerQueueConsumer` reaplique a política de retry da fila.

---

## 12. Dead Letter

- `processTissParserJob` retorna `settle: "nack"` ou `"nack-error"` quando:
  - `DocumentExtractionRuntimePort.submitRequest` falha;
  - `DocumentExtractionRuntimePort.getResult` falha;
  - Re-enfileiramento `PARSED` falha.
- O `DefaultWorkerRuntimeAdapter` / `DefaultQueueRuntimeAdapter` consomem `nack` e direcionam para Dead Letter após esgotar tentativas.
- O `processTissOcrParsed` expõe `infrastructure.deadLetterRuntime` como `true` quando a fila suporta DLQ.

---

## 13. Observability

- `DocumentExtractionRuntimePort.health()` retorna `ok`, `provider`, `latencyMs`, `runtimeReady: true` e shape-check de todos os peers (`documentClassificationRuntimeOk`, `ocrRuntimeOk`, etc.).
- `runtime.health()` chama `documentExtractionRuntimePort.health()`.
- `DocumentExtractionRuntimeTelemetry` inclui `latencyMs`, `attempts`, `cancelled`, `operation`.
- `process-tiss-ocr-parsed.ts` faz shape-check de `documentExtractionRuntimePort`, `schedulerRuntimePort`, `observabilityRuntimePort` no `infrastructure`.

---

## 14. Pontos com implementação estrutural/mock

| Ponto                           | Estado                                                                | Arquivo                                          |
| ------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------ |
| `DocumentExtractionRuntimePort` | Estrutural — sem extração real                                        | `default-document-extraction-runtime-adapter.ts` |
| `processTissParserJob`          | Enfileira `PARSED` sem invocar `TissParser`                           | `process-tiss-parser-job.ts`                     |
| `TissParserEngine`              | Registry/canonical de parsers — não conectado operacionalmente        | `tiss-engine/tiss-parser/tiss-parser-engine.ts`  |
| `TissParser` (capture)          | **Parser real** — usado via bridge `process-parser-via-enterprise.ts` | `capture/parser/engine/tiss-parser.ts`           |

---

## 15. Preservação arquitetural

- `getEnterpriseRuntime` permanece único entrypoint (174 ocorrências em `src/`).
- Nenhum `DocumentExtractionRuntimePort` é instanciado fora do composition root.
- `process-parser-via-enterprise.ts` prova que o Parser real reutiliza o composition root sem dual path.
- Nenhum Gateway ou Pipeline novo foi identificado.

---

## 16. Critérios para ativação

- [ ] Adapter real `DocumentExtractionRuntimePort` implementado e registrado.
- [ ] `TissParser` (ou `TissParserEngine`) invocado dentro do adapter sem bypass.
- [ ] `processTissParserJob` continua usando `getDocumentExtractionRuntimePort()`.
- [ ] `runCaptureParserViaEnterprise` continua funcionando (sem regressão).
- [ ] Retry e DLQ testados com falhas de parser.
- [ ] `runtime.health()` reflete `fieldExtractionImplemented: true` após ativação.

---

## 17. Critérios para certificação

- [ ] Parser real executa em PDF 1 página, multipágina, JPEG e PNG.
- [ ] `StructuredGuide` canônico com `fields`, `procedures`, `metadata` e `confidence`.
- [ ] Timeout, retry e DLQ validados.
- [ ] Latência e throughput medidos.
- [ ] `runtime.health()` e `DocumentExtractionRuntimePort.health()` expõem Parser real.
- [ ] Build, tsc, lint, smoke e todos os testes passam.
- [ ] Sem `src` alterado fora de novos adapters/factory options.

---

## 18. Conclusão

O Parser Runtime foi completamente mapeado. Nenhuma alteração arquitetural foi realizada. O Baseline Enterprise permanece preservado.

O Parser real (`TissParser`) já existe e pode ser ativado através da bridge `process-parser-via-enterprise.ts` sem modificar a arquitetura. A ativação canônica final requer um novo `DocumentExtractionRuntimeAdapter` real por trás do provider `enterprise`, mantendo `getEnterpriseRuntime()` como único entrypoint.

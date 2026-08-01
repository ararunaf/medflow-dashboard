# EPC-15 — OCR Provider Model

**Sprint:** EPC-15 — OCR Provider Foundation  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/ocr-provider/ports/` + `descriptor/`

---

## 1. Objetivo

Definir os modelos do OCR Provider Foundation:

1. `OCRProviderPort` (contrato)
2. `OCRCapabilities` (FASE 6)
3. `ProviderDescriptor` OCR (FASE 5 → EPC-14)
4. Resultado canônico: `ProcessingOutput` + `DocumentProcessingResult` (EPC-13)

Sem qualquer implementação de OCR real.

---

## 2. OCRCapabilities (FASE 6)

Declaração estrutural — **sem lógica**.

| Campo | Tipo | Papel |
|-------|------|-------|
| `supportedFormats` | `string[]` | Formatos de entrada opacos |
| `supportedLanguages` | `string[]` | Idiomas declarados |
| `supportsMultiPage` | `boolean` | Multi-página |
| `supportsTables` | `boolean` | Tabelas |
| `supportsHandwriting` | `boolean` | Manuscrito |
| `supportsConfidence` | `boolean` | Confidence no output |
| `supportsRotation` | `boolean` | Rotação |
| `supportsBatch` | `boolean` | Lote futuro |
| `supportsAsync` | `boolean` | Assíncrono futuro |
| `maxPages` | `number` | Limite declarado |
| `maxFileSize` | `number` | Limite declarado (bytes) |

Helpers: `emptyOCRCapabilities`, `defineOCRCapabilities`.  
Default mock: `DEFAULT_MOCK_OCR_CAPABILITIES`.

---

## 3. ProviderDescriptor OCR (FASE 5)

Reutiliza o modelo canônico do EPC-14. Campos mínimos obrigatórios:

| Campo | Valor / papel |
|-------|----------------|
| `providerId` | ex.: `ocr-mock` |
| `providerName` | Nome legível |
| `providerVersion` | Versão declarada |
| `providerType` | **`OCR`** (fixo) |
| `capabilities` | `ProviderCapabilities` (projeção de `OCRCapabilities`) |
| `priority` | Prioridade estrutural |
| `enabled` | Habilitado |
| `configurationReference` | Ref opaca Configuration |
| `metadataReference` | Ref opaca Metadata |

Factory: `buildOCRProviderDescriptor` / `createDefaultMockOCRProviderDescriptor`.

Mapeamento: `mapOCRCapabilitiesToProviderCapabilities`.

---

## 4. Entrada / saída de `process()`

### OCRProcessInput

Referências opacas apenas — sem bytes, upload ou scanner:

- `requestId?`
- `contentType?`
- `language?`
- `documentIdentityReference?`
- `metadataReference?`
- `rawDataReference?`
- `attributes?`

### OCRProcessResult

| Campo | Modelo |
|-------|--------|
| `processing` | `DocumentProcessingResult` (`processorType: "OCR"`) |
| `output` | `ProcessingOutput` (canônico único) |
| `simulated` | `true` no mock |

Modelos canônicos utilizados (EPC-13):

1. `ProcessingOutput`
2. `DocumentProcessingResult`
3. `ProcessingDocumentIdentityReference` (Document Identity Reference)
4. `ProcessingMetadataReference` (Metadata Reference)

---

## 5. Invariantes

1. OCR produz **somente** `ProcessingOutput` na saída de conteúdo.
2. Nenhum campo OCR-específico na raiz do output.
3. OCR não importa Contract / Rule / Workflow / AI modules.
4. OCR não executa normalização (apenas documenta hooks — FASE 8).
5. OCR não chama HTTP e não usa IA.

---

## 6. Extensão — normalização futura (FASE 8)

Documentado em `ports/extension-points.ts`:

| ID | Ponto | Implementado |
|----|-------|--------------|
| EP-NORM-01 | Application orquestra NormalizationPort após `process()` | **Não** |
| EP-NORM-02 | Tag `awaiting-normalization` no resultado | **Não** (tag reservada) |
| EP-NORM-03 | `FutureNormalizationPort` em módulo separado | **Não** |
| EP-NORM-04 | Bridge Application → `DocumentProcessorPort.process` | **Não** |

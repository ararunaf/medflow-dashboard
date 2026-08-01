# EPC-14 — Provider Model

**Sprint:** EPC-14 — Processing Provider Framework  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/processing-provider/ports/types.ts`

---

## 1. Objetivo

Definir os modelos canônicos do Framework:

1. `ProviderDescriptor`
2. `ProviderCapabilities`
3. `ProviderType` (enumeração)

Sem qualquer lógica de processamento.

---

## 2. ProviderDescriptor (FASE 5)

Modelo canônico de registro de qualquer Processing Provider.

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `providerId` | `ProviderId` | Sim | Identificador estável |
| `providerName` | `ProviderName` | Sim | Nome legível |
| `providerVersion` | `ProviderVersion` | Sim | Versão declarada |
| `providerType` | `ProviderType` | Sim | Enum estrutural |
| `capabilities` | `ProviderCapabilities` | Sim | Capacidades declaradas |
| `priority` | `number` | Não | Prioridade estrutural |
| `enabled` | `boolean` | Não | Habilitado (default false na fundação) |
| `healthStatus` | `HealthStatus` | Não | Status declarado |
| `configurationReference` | ref opaca | Não | Link a Configuration Engine |
| `metadataReference` | ref opaca | Não | Link a Metadata Engine |
| `tags` | `ProviderTag[]` | Não | Classificação livre |
| `customAttributes` | `Record` | Não | Bag opaco |

Nenhum campo específico de OCR, PDF, XML, Barcode, QRCode, HL7, DICOM ou IA.

---

## 3. ProviderCapabilities (FASE 6)

Declaração estrutural — **sem lógica**.

| Campo | Tipo | Papel futuro |
|-------|------|--------------|
| `supportedInputs` | `string[]` | Tipos de entrada opacos |
| `supportedOutputs` | `string[]` | Tipos de saída opacos |
| `supportedLanguages` | `string[]` | Idiomas declarados |
| `supportsAsync` | `boolean` | Processamento assíncrono futuro |
| `supportsBatch` | `boolean` | Processamento em lote futuro |
| `supportsStreaming` | `boolean` | Streaming futuro |
| `supportsConfidence` | `boolean` | Confidence no output futuro |
| `supportsMetadata` | `boolean` | Metadata no output futuro |
| `supportsAttachments` | `boolean` | Anexos no output futuro |
| `maxDocumentSize` | `number` | Limite declarado (bytes) |

Helpers (`declaresAsync`, `defineProviderCapabilities`, …) são puramente estruturais.

---

## 4. ProviderType (FASE 7)

Somente enumeração — **sem implementação**.

```ts
type ProviderType =
  | "OCR"
  | "PDF"
  | "XML"
  | "JSON"
  | "BARCODE"
  | "QRCODE"
  | "HL7"
  | "DICOM"
  | "CUSTOM"
  | "UNKNOWN";
```

Constante: `PROVIDER_TYPES` (10 valores).

Helpers: `hasKnownProviderType`, `listProviderTypes`, `providerHasKnownProviderType`.

---

## 5. HealthStatus

```ts
type HealthStatus = "ready" | "stub" | "disabled" | "unhealthy" | "unknown";
```

Na fundação, registros tipicamente usam `healthStatus: "stub"` e `enabled: false`.

---

## 6. Relação com Document Processing Foundation (EPC-13)

| EPC-14 | EPC-13 | Relação |
|--------|--------|---------|
| `ProviderType` | `ProcessorType` | Conceitos alinhados; módulos **não** acoplados |
| `ProviderDescriptor` | — | Catálogo de Providers |
| — | `DocumentProcessingResult` + `ProcessingOutput` | Resultado canônico da execução futura |

Nesta sprint **não** há bind entre EPC-14 e EPC-13.

---

## 7. Regras

1. Providers nunca conhecem outros Providers.  
2. Nenhum Provider funcional existe na fundação (`BUILTIN_PROCESSING_PROVIDER_COUNT = 0`).  
3. Capabilities são declarativas — seleção futura é filtro estrutural, não execução.  
4. Extensão: novo Provider = novo descriptor (+ adapter de execução em sprint futura).  

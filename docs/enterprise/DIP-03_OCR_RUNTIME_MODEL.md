# DIP-03 — OCR Runtime Model

**Sprint:** DIP-03 — OCR Runtime Foundation  
**Camada:** Modelos canônicos estruturais (sem execução OCR)

---

## 1. Modelos canônicos

| Modelo | `kind` | Função |
|--------|--------|--------|
| `CanonicalOCRIdentity` | `canonical-ocr-identity` | Identidade opaca do documento |
| `CanonicalOCRMetadata` | `canonical-ocr-metadata` | Sessão, tenant, correlação, tags |
| `CanonicalOCRReference` | `canonical-ocr-reference` | Refs storage / intake / capture / provider |
| `CanonicalOCRCapabilities` | `canonical-ocr-capabilities` | Capabilities tecnológicas (todas FALSE) |
| `CanonicalOCRConfiguration` | `canonical-ocr-configuration` | Preferências estruturais |
| `CanonicalOCRRequest` | `canonical-ocr-request` | Pedido de coordenação |
| `CanonicalOCRSession` | `canonical-ocr-session` | Sessão persistida no Runtime |
| `CanonicalOCRResult` | `canonical-ocr-result` | Resultado da coordenação |
| `CanonicalOCRProviderReference` | `canonical-ocr-provider-reference` | Ref estrutural a vendor futuro |

---

## 2. Status da sessão

```ts
type OCRRuntimeSessionStatus =
  | "pending"
  | "coordinating"
  | "coordinated"
  | "deferred"
  | "failed";
```

Nesta sprint o caminho feliz termina em `"coordinated"` — nunca em processamento OCR real.

---

## 3. Capabilities tecnológicas (FALSE)

Registradas estruturalmente; **nenhuma é executada**:

- `supportsPdf: false`
- `supportsImage: false`
- `supportsBatch: false`
- `supportsStreaming: false`
- `supportsHandwriting: false`
- `supportsTables: false`
- `supportsForms: false`
- `supportsConfidenceScore: false`

Flags de garantia:

- `implementsRealOcr: false`
- `implementsAzure: false`
- `implementsGoogleVision: false`
- `implementsAwsTextract: false`
- `implementsTesseract: false`
- `realOcrExecuted: false`
- `realOcrAvailable: false`

---

## 4. Referências estruturais a providers

| Id | Display | Vendor | `connected` | `implementsRealOcr` |
|----|---------|--------|-------------|---------------------|
| `azure` | Azure Document Intelligence | Microsoft | false | false |
| `google-vision` | Google Cloud Vision / Document AI | Google | false | false |
| `aws-textract` | AWS Textract | Amazon | false | false |
| `tesseract` | Tesseract OCR | Open Source | false | false |
| `mock` | Mock OCR Provider (EPC-15) | MedicFlow Enterprise | false | false |

Estas entradas **não** são implementações. Não há bind, HTTP, SDK ou credenciais.

---

## 5. Identidade determinística

```ts
createOCRRuntimeSessionId() → "dip-ocr-session-N"
```

Sequência in-process, resetável em testes (`resetAllOCRRuntimeIdSequences`).

---

## 6. Ligação com Capture Engine

`CanonicalCaptureSession` / `CanonicalCaptureResult` passam a carregar opcionalmente:

- `ocrRuntimeSessionId`
- `ocrExecutionId`

Apenas rastreabilidade estrutural — sem mudança de comportamento de produto.

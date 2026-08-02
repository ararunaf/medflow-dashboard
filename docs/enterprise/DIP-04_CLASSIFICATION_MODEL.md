# DIP-04 — Classification Model

**Sprint:** DIP-04 — Document Classification Runtime  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Modelos canônicos

| Modelo | kind | Função |
|--------|------|--------|
| `CanonicalDocumentClassificationIdentity` | `canonical-document-classification-identity` | Identidade opaca do documento |
| `CanonicalDocumentClassificationMetadata` | `canonical-document-classification-metadata` | Metadados estruturais da sessão |
| `CanonicalDocumentClassificationReference` | `canonical-document-classification-reference` | Referências a storage / intake / capture / OCR |
| `CanonicalDocumentClassificationCapabilities` | `canonical-document-classification-capabilities` | Capabilities tecnológicas (todas FALSE) |
| `CanonicalDocumentClassificationConfiguration` | `canonical-document-classification-configuration` | Configuração estrutural (provider preferido) |
| `CanonicalDocumentClassificationRequest` | `canonical-document-classification-request` | Pedido de coordenação |
| `CanonicalDocumentClassificationSession` | `canonical-document-classification-session` | Sessão persistida no store |
| `CanonicalDocumentClassificationResult` | `canonical-document-classification-result` | Resultado da coordenação |
| `CanonicalDocumentClassificationProviderReference` | `canonical-document-classification-provider-reference` | Provider futuro (sem conexão) |

---

## 2. Status da sessão

```
pending → coordinating → coordinated
                      ↘ failed
                      ↘ deferred
```

`coordinated` significa coordenação estrutural concluída — **não** classificação documental real.

---

## 3. Capabilities tecnológicas (sempre FALSE)

| Capability | Valor |
|------------|-------|
| `supportsMedicalGuideClassification` | `false` |
| `supportsInvoiceClassification` | `false` |
| `supportsContractClassification` | `false` |
| `supportsBatchClassification` | `false` |
| `supportsConfidenceScore` | `false` |
| `supportsMultiLabelClassification` | `false` |
| `supportsCustomModels` | `false` |
| `supportsRuleBasedClassification` | `false` |
| `implementsRealClassification` | `false` |
| `implementsAi` | `false` |
| `implementsMachineLearning` | `false` |
| `implementsRuleEngine` | `false` |
| `implementsEmbeddings` | `false` |
| `implementsLlm` | `false` |
| `implementsOcrForClassification` | `false` |

---

## 4. Classification Provider references (estruturais)

| providerReferenceId | displayName | connected | implementsRealClassification |
|---------------------|-------------|-----------|------------------------------|
| `ai-classifier` | AI Classifier | `false` | `false` |
| `rule-based-classifier` | Rule Based Classifier | `false` | `false` |
| `ml-classifier` | ML Classifier | `false` | `false` |
| `hybrid-classifier` | Hybrid Classifier | `false` | `false` |
| `mock` | Mock Classifier | `false` | `false` |

---

## 5. Identidade determinística

```ts
createDocumentClassificationRuntimeSessionId()
// → dip-classification-session-1, dip-classification-session-2, ...
```

Reset exclusivo para testes: `resetAllDocumentClassificationRuntimeIdSequences()`.

---

## 6. Ligação com Capture Engine / OCR Runtime

Campos em `CanonicalCaptureSession` / `CanonicalCaptureResult`:

- `classificationRuntimeSessionId`
- `classificationExecutionId`

Campos em `CanonicalDocumentClassificationReference`:

- `captureRuntimeSessionId` / `captureExecutionId`
- `ocrRuntimeSessionId` / `ocrExecutionId`

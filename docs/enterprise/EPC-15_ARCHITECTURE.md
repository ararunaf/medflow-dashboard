# EPC-15 — OCR Provider Architecture

**Sprint:** EPC-15 — OCR Provider Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-15_OCR_PROVIDER_FOUNDATION.md`](./EPC-15_OCR_PROVIDER_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getOCRProviderHealthSummary)       │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ OCRProviderPort                                      │
│  process | health | capabilities | providerInfo      │
│  validateConfiguration                               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultMockOCRProvider / MockOCRProviderAdapter     │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ OCRProviderFactory  ←  OCRProviderRegistry           │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Processing Provider Framework (EPC-14)               │
│  registerOCRProviderWithProcessingFramework          │
│  ProviderDescriptor { providerType: "OCR" }          │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Document Processing Foundation (EPC-13)              │
│  ProcessingOutput + DocumentProcessingResult (tipos) │
└──────────────────────────────────────────────────────┘
```

Application e Domain dependem **somente** do Port.  
Adapters / Factory / Registry nunca vazam para Domain de produto.

---

## 2. Fronteiras

| Pode | Não pode |
|------|----------|
| Extrair (simular) conteúdo genérico | Interpretar domínio clínico / TISS |
| Produzir `ProcessingOutput` único | Validar contratos / regras |
| Declarar `OCRCapabilities` | Tomar decisões de Workflow |
| Registrar-se no EPC-14 como OCR | Chamar HTTP / SDKs de OCR |
| Referências opacas Identity/Metadata | Usar IA |
| Documentar hooks de normalização | Implementar normalização |
| Health / capabilities / validate | Alterar UI / APIs / DB |

---

## 3. Desacoplamento

```
┌────────────────────┐
│ DefaultMockOCR     │  (único adapter nesta sprint)
└─────────┬──────────┘
          │ process() → ProcessingOutput
          ↓
   OCRProviderPort
          │
          │ (Application futura)
          ├──────────→ [FUTURO] NormalizationPort   (EP-NORM-01/03)
          └──────────→ DocumentProcessorPort.process (EP-NORM-04)
                              ↓
                   DocumentProcessingResult
                   + ProcessingOutput
                              ↓
            Workflow / Rules / Contract / Intake / UI
                   (não veem tecnologia OCR)
```

### Dependências permitidas

| De | Para | Forma |
|----|------|-------|
| `ocr-provider` | `document-processor` | **tipos** canônicos apenas |
| `ocr-provider` | `processing-provider` | registry + `ProviderDescriptor` |
| Application | `ocr-provider` | Port / factory |

### Dependências proibidas

- `ocr-provider` → `contract`, `rule`, `workflow`, `ai-provider`, `rule-pack`
- `document-processor` → `ocr-provider` (EPC-13 permanece sem import de OCR)
- Qualquer import de SDK HTTP / OCR vendor

---

## 4. Pontos de extensão — normalização (FASE 8)

Nenhuma normalização é implementada. Apenas documentada:

1. **EP-NORM-01** — Application chama NormalizationPort futuro após `OCRProviderPort.process`.
2. **EP-NORM-02** — Tag estrutural `awaiting-normalization` no `DocumentProcessingResult`.
3. **EP-NORM-03** — `FutureNormalizationPort` em módulo separado (consome/produz `ProcessingOutput`).
4. **EP-NORM-04** — Application registra output OCR via `DocumentProcessorPort.process`.

Código: `src/lib/enterprise/ocr-provider/ports/extension-points.ts`.

---

## 5. Extensão — motores OCR reais (futuro)

Adapters futuros (não criados nesta sprint) implementarão o mesmo `OCRProviderPort`:

- Azure Document Intelligence
- Google Document AI
- Tesseract
- Outros

Requisitos de extensão:

1. Implementar `OCRProviderPort`
2. Registrar em `OCRProviderRegistry`
3. Atualizar / registrar `ProviderDescriptor` no EPC-14
4. Continuar emitindo **somente** `ProcessingOutput`
5. **Não** alterar Application/Domain consumers do Port

---

## 6. Capacidades do Port (adapter-level)

| Flag | Significado |
|------|-------------|
| `supportsCanonicalProcessingOutput` | Emite `ProcessingOutput` |
| `supportsDocumentProcessingResult` | Emite `DocumentProcessingResult` |
| `supportsDocumentIdentityReference` | Aceita ref opaca Identity |
| `supportsMetadataReference` | Aceita ref opaca Metadata |
| `supportsFutureNormalizationHook` | Prep FASE 8 |
| `supportsFutureRealEngines` | Prep motores reais |

---

## 7. Inventário de pastas

```
src/lib/enterprise/ocr-provider/
├── ports/          Port, types, OCRCapabilities, extension-points
├── adapters/       DefaultMockOCRProvider
├── descriptor/     ProviderDescriptor OCR (EPC-14)
├── factory/        OCRProviderFactory
├── registry/       OCRProviderRegistry + bind EPC-14
├── providers/      createOCRProviderPort
├── demo/           PoC Application
└── index.ts        Barrel
```

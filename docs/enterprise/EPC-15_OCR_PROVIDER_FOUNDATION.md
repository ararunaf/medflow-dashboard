# EPC-15 — OCR Provider Foundation

**Sprint:** EPC-15 — OCR Provider Foundation  
**Data:** 31/07/2026  
**Padrão:** ECS-01 (Ports & Adapters)  
**Implementação:** `src/lib/enterprise/ocr-provider/`

---

## 1. Objetivo

Criar a fundação do **primeiro Processing Provider** da plataforma Enterprise: um OCR Provider totalmente desacoplado do restante do produto.

O OCR:

- apenas extrai conteúdo;
- nunca interpreta;
- nunca valida;
- nunca toma decisões;
- nunca conhece cooperativas, operadoras, contratos, TISS, AI, Workflow ou Rule Engine;
- produz **exclusivamente** `ProcessingOutput` canônico (EPC-13).

---

## 2. Arquitetura obrigatória

```
Application
    ↓
OCRProviderPort
    ↓
OCRProviderAdapter (DefaultMockOCRProvider)
    ↓
OCRProviderFactory
    ↓
OCRProviderRegistry
    ↓
Processing Provider Framework (EPC-14)
    ↓
Document Processing Foundation (EPC-13)
```

---

## 3. Escopo desta sprint

| Incluído | Excluído |
|----------|----------|
| `OCRProviderPort` | OCR real |
| `DefaultMockOCRProvider` | Azure Document Intelligence |
| `OCRProviderFactory` | Google Document AI |
| `OCRProviderRegistry` | Tesseract |
| Registro no EPC-14 como `providerType: "OCR"` | OpenAI / Gemini / Claude |
| `OCRCapabilities` | HTTP / rede |
| `ProviderDescriptor` OCR | Banco / migrations |
| Pontos de extensão para normalização (docs) | UI / APIs / Upload / Scanner |
| Testes + documentação | IA / TISS / Contratos / Rules / Workflow |

---

## 4. Operações do Port

| Operação | Papel |
|----------|-------|
| `process()` | Extração simulada → `ProcessingOutput` + `DocumentProcessingResult` |
| `health()` | Prontidão local |
| `capabilities()` | Capacidades do adapter + `OCRCapabilities` |
| `providerInfo()` | Metadados + `providerType: "OCR"` |
| `validateConfiguration()` | Validação estrutural (sem rede) |

---

## 5. Providers da fundação

| ProviderId | Adapter | Estado |
|------------|---------|--------|
| `mock` | `DefaultMockOCRProvider` | Implementado (determinístico) |
| `test` | `DefaultMockOCRProvider` | Implementado (alias) |
| `default` | `DefaultMockOCRProvider` | Implementado (alias) |

`BUILTIN_OCR_PROVIDER_COUNT = 3` (todos mock — **zero OCR real**).

---

## 6. Registro no Processing Provider Framework

Helper: `registerOCRProviderWithProcessingFramework(registry)`.

- Constrói `ProviderDescriptor` com `providerType: "OCR"`.
- Registra no `ProcessingProviderRegistry` (EPC-14).
- O Framework passa a listar o provider via `listByType("OCR")`.

---

## 7. Saída canônica

Todo `process()` retorna:

1. `DocumentProcessingResult` com `processorType: "OCR"`
2. `ProcessingOutput` (modelo único EPC-13)
3. Referências opacas: `documentIdentityReference`, `metadataReference`

Nunca retorna tipos específicos de OCR na raiz (`ocrText`, `boundingBoxes`, `ocrEngine`, …).

---

## 8. Extensão futura (motores reais)

A arquitetura está preparada para adapters futuros (Azure Document Intelligence, Google Document AI, Tesseract, etc.) **sem alterar** o Port, o Registry EPC-14 nem o modelo `ProcessingOutput`.

Nenhum desses motores é integrado nesta sprint.

---

## 9. Documentos relacionados

- [`EPC-15_OCR_PROVIDER_MODEL.md`](./EPC-15_OCR_PROVIDER_MODEL.md)
- [`EPC-15_ARCHITECTURE.md`](./EPC-15_ARCHITECTURE.md)
- [`EPC-15_CERTIFICATION.md`](./EPC-15_CERTIFICATION.md)
- [`EPC-14_PROCESSING_PROVIDER_FRAMEWORK.md`](./EPC-14_PROCESSING_PROVIDER_FRAMEWORK.md)
- [`EPC-13_DOCUMENT_PROCESSING_FOUNDATION.md`](./EPC-13_DOCUMENT_PROCESSING_FOUNDATION.md)

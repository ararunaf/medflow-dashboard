# EPC-13 — Document Processing Foundation

**Sprint:** EPC-13 — Document Processing Foundation  
**Data:** 31/07/2026  
**Natureza:** Fundação arquitetural genérica — **sem alteração de comportamento do produto**  
**Padrão:** ECS-01 (Ports & Adapters)

---

## 1. Objetivo

Construir o **Enterprise Document Processing Foundation**: a infraestrutura canônica de processamento documental e a camada Ports & Adapters correspondente.

Nenhum comportamento do MedicFlow muda nesta sprint.

Esta sprint **não** implementa OCR, IA, parser XML, parser PDF, Barcode, QRCode, TISS ou Workflow.  
O objetivo é apenas a infraestrutura canônica que fará todo Processor futuro produzir o mesmo modelo de saída.

---

## 2. Princípio arquitetural (obrigatório)

```
Qualquer tecnologia de processamento
  ↓
DocumentProcessorPort.process()
  ↓
DocumentProcessingResult + ProcessingOutput (modelo único)
  ↓
Restante do Enterprise (desacoplado da tecnologia)
```

**Nunca:**

```
OCR → modelo OCR → Application
XML → modelo XML → Application
```

| O Processing Foundation NÃO | O Processing Foundation SIM |
|-----------------------------|-----------------------------|
| Implementa OCR | Expõe `process` / `getProcessing` / `listProcessings` |
| Implementa IA | Declara `ProcessorType` (enumeração) |
| Implementa parsers XML/PDF | Produz `DocumentProcessingResult` |
| Implementa Barcode/QRCode | Produz `ProcessingOutput` canônico único |
| Conhece TISS / regras clínicas | Referencia Document Identity / Metadata / Storage (opaco) |
| Acopla tecnologia ao consumidor | Expõe `health` / `capabilities` |

---

## 3. Escopo

### Inclui

- `DocumentProcessorPort` (`process`, `getProcessing`, `listProcessings`, `health`, `capabilities`)
- `DefaultDocumentProcessorAdapter` (in-memory)
- `MockDocumentProcessorAdapter` (testes / homologação / offline)
- `DocumentProcessorStore` + `DefaultDocumentProcessorStore`
- `DocumentProcessorFactory` + `createDocumentProcessorPort` (Provider)
- Modelo canônico `DocumentProcessingResult`
- Modelo canônico de saída `ProcessingOutput`
- Enum `ProcessorType` (somente enumeração)
- Documentação de integração futura
- Testes isolados (`enterprise:document-processor:test`)

### Não inclui

- OCR / IA / parsers XML / PDF / Barcode / QRCode
- Upload / Scanner / TISS / Workflow operacional
- Banco / migrations
- UI / APIs / Server Functions
- Ligação a fluxos de produto existentes
- Conhecimento clínico / operadoras / cooperativas

---

## 4. Arquitetura (ECS-01)

```
Application
    ↓
DocumentProcessorPort
    ↓
DocumentProcessorAdapter
    ↓
DocumentProcessorStore
    ↓
DocumentProcessorFactory
    ↓
DocumentProcessorProvider
```

Application e Domain dependem **somente** do Port.

---

## 5. Localização

```
src/lib/enterprise/document-processor/
  ports/
  adapters/
  store/
  factory/
  providers/
  demo/
  index.ts
```

Scripts: `scripts/enterprise/tests/document-processor-engine.test.ts`  
NPM: `npm run enterprise:document-processor:test`

---

## 6. Documentos satélite

| Documento | Função |
|-----------|--------|
| [`EPC-13_PROCESSING_MODEL.md`](./EPC-13_PROCESSING_MODEL.md) | Modelos canônicos |
| [`EPC-13_ARCHITECTURE.md`](./EPC-13_ARCHITECTURE.md) | Camadas e integração futura |
| [`EPC-13_CERTIFICATION.md`](./EPC-13_CERTIFICATION.md) | Certificação da sprint |

---

## 7. Declaração de fronteira

O Document Processing Foundation **nunca** poderá conhecer:

- TISS
- regras clínicas
- contratos específicos
- operadoras / cooperativas
- OCR específico / IA específica

Seu único objetivo é fornecer uma camada canônica de processamento documental, produzindo saída padronizada consumível pelo restante da plataforma Enterprise, independentemente da tecnologia utilizada.

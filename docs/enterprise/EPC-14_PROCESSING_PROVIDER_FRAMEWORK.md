# EPC-14 — Processing Provider Framework

**Sprint:** EPC-14 — Processing Provider Framework  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/processing-provider/`

---

## 1. Objetivo

Criar o **Framework genérico** que permitirá registrar qualquer Processador futuro — sem implementar OCR, IA, PDF, XML, Barcode, QRCode, HL7 ou DICOM.

O Framework é reutilizável por qualquer mecanismo de processamento e por qualquer produto da IAeasy.

---

## 2. Princípio arquitetural

Todo Processor será um Provider.

O Framework **nunca** conhece:

- OCR, PDF, XML, JSON, HL7, DICOM, Barcode, QRCode (como implementação)

O Framework conhece **apenas**:

| Conceito | Papel |
|----------|-------|
| Provider | Descriptor registrado (`ProviderDescriptor`) |
| Capabilities | Declaração estrutural (`ProviderCapabilities`) |
| Input / Output | Contratos opacos do Port |
| Health | Prontidão do Framework |
| Configuration | Referência opaca (`configurationReference`) |

`ProviderType` é **enumeração estrutural** (FASE 7) — sem lógica.

---

## 3. Arquitetura (ECS-01)

```
Application
    ↓
ProcessingProviderPort
    ↓
ProcessingProviderAdapter
    ↓
ProcessingProviderRegistry
    ↓
ProcessingProviderFactory
    ↓
ProcessingProviderProvider
```

| Camada | Artefato | Responsabilidade |
|--------|----------|------------------|
| Port | `ProcessingProviderPort` | Contrato estável |
| Adapter | `Default` / `Mock` | In-memory / testes |
| Registry | `ProcessingProviderRegistry` | Catálogo de descriptors |
| Factory | `ProcessingProviderFactory` | Instanciação do Port |
| Provider | `createProcessingProviderPort` | DI / inversão de dependência |

---

## 4. Superfície do Port

```ts
interface ProcessingProviderPort {
  readonly providerId: ProcessingProviderProviderId;
  health(): Promise<ProcessingProviderHealth>;
  capabilities(): ProcessingProviderCapabilities;
  registerProvider(input: RegisterProviderInput): Promise<RegisterProviderResult>;
  unregisterProvider(input: UnregisterProviderInput): Promise<UnregisterProviderResult>;
  getProvider(input: GetProviderInput): Promise<GetProviderResult>;
  listProviders(input?: ListProvidersInput): Promise<ListProvidersResult>;
}
```

Nenhuma operação executa processamento documental.

---

## 5. O que foi entregue

| Artefato | Path |
|----------|------|
| Port + tipos | `ports/` |
| Default adapter | `adapters/default-processing-provider-adapter.ts` |
| Mock adapter | `adapters/mock-processing-provider-adapter.ts` |
| Registry | `registry/processing-provider-registry.ts` |
| Factory | `factory/processing-provider-factory.ts` |
| Provider DI | `providers/create-processing-provider-port.ts` |
| Demo PoC | `demo/processing-provider-health-query.ts` |
| Testes | `scripts/enterprise/tests/processing-provider-engine.test.ts` |

---

## 6. O que o Framework jamais conhece / faz

- Implementação de OCR, IA, PDF, XML, Barcode, QRCode, HL7, DICOM
- Parsers, upload, scanner
- Processamento real de documentos
- Migrations, UI, APIs de produto
- Alteração do Document Processing Foundation (EPC-13)
- Comunicação direta entre Providers

---

## 7. Integração futura (FASE 8 — sem implementação)

O Framework permitirá conectar futuramente Providers específicos **apenas** registrando um `ProviderDescriptor` e, em sprints posteriores, um adapter de execução acoplado ao Document Processing Foundation.

| Provider futuro | Como se conecta | Nesta sprint |
|-----------------|-----------------|--------------|
| OCR Provider | `providerType: "OCR"` + capabilities + ProcessingOutput via EPC-13 | **Não implementado** |
| PDF Provider | `providerType: "PDF"` | **Não implementado** |
| XML Provider | `providerType: "XML"` | **Não implementado** |
| Barcode Provider | `providerType: "BARCODE"` | **Não implementado** |
| QRCode Provider | `providerType: "QRCODE"` | **Não implementado** |
| HL7 Provider | `providerType: "HL7"` | **Não implementado** |
| DICOM Provider | `providerType: "DICOM"` | **Não implementado** |
| AI Provider | Registro genérico + EPC-07 (IA) / EPC-13 (output) | **Não implementado** |

Fluxo futuro obrigatório:

```
Intake / Application
  → ProcessingProviderPort (descoberta / seleção por capabilities)
  → Document Processing Foundation (EPC-13)
  → ProcessingOutput canônico
```

Providers **nunca** conversam entre si. Toda comunicação ocorre através do Document Processing Foundation e do `ProcessingOutput`.

---

## 8. Preparação estrutural

| Consumidor futuro | Preparação | Bind |
|-------------------|------------|------|
| Document Processing Foundation | `supportsFutureDocumentProcessingFoundation` | Não |
| AI Providers (EPC-07) | `supportsFutureAiProviders` | Não |
| Workflow | `supportsFutureWorkflow` | Não |
| Rule Engine | `supportsFutureRuleEngine` | Não |
| Seleção por capacidades | `supportsCapabilitySelection` + filtros `requiresAsync/Batch/Streaming` | Declarativo apenas |
| Async / Batch / Streaming | campos em `ProviderCapabilities` | Declarativo apenas |

---

## 9. Testes

```bash
npm run enterprise:processing-provider:test
```

---

## 10. Fora de escopo

OCR · IA · PDF · XML · Barcode · QRCode · HL7 · DICOM · parsers · upload · scanner · migrations · UI · APIs · alteração EPC-13

---

## 11. Próximos passos

1. Sprint de OCR Provider (adapter real + bind EPC-13) — fora desta sprint  
2. Seleção automática por capabilities no Application layer  
3. Persistência do Registry (`database` provider)  
4. Health probes reais por Provider registrado  

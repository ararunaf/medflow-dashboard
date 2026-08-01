# EPC-07 — AI Provider Port Foundation

**Sprint:** EPC-07 — AI Provider Ports Foundation  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura arquitetural (Ports & Adapters) — **sem mudança de comportamento**  
**Baseline compatível:** MVP operacional + Enterprise Platform Core (EPC-01..06B)  
**Continuidade:** Espelha o padrão Enterprise (ECS-01) — camada Enterprise Intelligence (fundação)

---

## 1. Objetivo

Construir a camada de integração com provedores de IA do MedicFlow Enterprise, totalmente desacoplada:

```
Application
    ↓
AIProviderPort
    ↓
AIProviderAdapter
    ↓
ProviderFactory
    ↓
ProviderRegistry
    ↓
Health
    ↓
Capabilities
    ↓
Infrastructure
```

Toda IA deverá ser acessada **exclusivamente** através de Ports & Adapters.  
Nenhum módulo do MedicFlow poderá chamar OpenAI, Gemini, Claude, Azure OpenAI ou Ollama diretamente.

Esta sprint **não** implementa IA de produto, OCR, Auditor Inteligente, análise de guias nem contratos.

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| `AIProviderPort` | `src/lib/enterprise/ai-provider/ports/ai-provider-port.ts` |
| Tipos genéricos (`AIRequest`, `AIResponse`, …) | `src/lib/enterprise/ai-provider/ports/types.ts` |
| Catálogo de capabilities | `src/lib/enterprise/ai-provider/ports/capabilities.ts` |
| `DefaultMockAIProvider` / `MockAIProviderAdapter` | `src/lib/enterprise/ai-provider/adapters/mock-ai-provider-adapter.ts` |
| Stubs vendor (6) | `src/lib/enterprise/ai-provider/adapters/*-ai-provider-adapter.ts` |
| `AIProviderFactory` | `src/lib/enterprise/ai-provider/factory/ai-provider-factory.ts` |
| `AIProviderRegistry` | `src/lib/enterprise/ai-provider/registry/ai-provider-registry.ts` |
| Provider `createAIProviderPort` | `src/lib/enterprise/ai-provider/providers/create-ai-provider-port.ts` |
| PoC Application | `src/lib/enterprise/ai-provider/demo/ai-provider-health-query.ts` |
| Testes | `scripts/enterprise/tests/ai-provider-engine.test.ts` |
| Script npm | `npm run enterprise:ai-provider:test` |

---

## 3. O que o Engine **jamais** conhece

- TISS / operadoras / contratos / guias / pacientes / auditorias
- Prompts clínicos do MedicFlow
- OCR de produto / Document Identity / Workflow clínico / Rule Packs
- Chaves de API / SDKs de vendor / HTTP real
- UI, rotas, Server Functions, banco, migrations

Os AI Providers são **apenas adaptadores tecnológicos**.  
Toda inteligência de domínio continua coordenada pelo Enterprise Platform Core.

---

## 4. Superfície do Port

```ts
interface AIProviderPort {
  readonly providerId: AIProviderId;
  invoke(request: AIRequest): Promise<AIResponse>;
  health(): Promise<AIProviderHealth>;
  capabilities(): AIProviderCapabilities;
  providerInfo(): AIProviderInfo;
  supports(capability: AICapabilityId): boolean;
  validateConfiguration(): Promise<AIConfigurationValidation>;
}
```

### Modelo genérico Request / Response

| Tipo | Papel |
|------|-------|
| `AIRequest` | Entrada vendor-agnóstica (prompt/messages/capability/format) |
| `AIResponse` | Saída genérica (`content` / `data` / `usage` / `simulated`) |
| `AIContext` | Contexto opaco (`correlationId`, `tenantId`, `attributes`) |
| `AITokenUsage` | Contagem de tokens genérica |
| `AIProviderMetadata` | Nome / versão / vendor (sem domínio clínico) |

---

## 5. Providers suportados

| Id | Adapter | Status EPC-07 |
|----|---------|---------------|
| `mock` | `MockAIProviderAdapter` / `DefaultMockAIProvider` | **ready** (determinístico) |
| `test` | `MockAIProviderAdapter` | **ready** |
| `openai` | `OpenAIAIProviderAdapter` | **stub** (sem rede) |
| `azure-openai` | `AzureOpenAIAIProviderAdapter` | **stub** |
| `gemini` | `GeminiAIProviderAdapter` | **stub** |
| `claude` | `ClaudeAIProviderAdapter` | **stub** |
| `ollama` | `OllamaAIProviderAdapter` | **stub** |
| `lm-studio` | `LMStudioAIProviderAdapter` | **stub** |

Default da factory: **`mock`**.

---

## 6. Família de adapters

| Família | Adapters |
|---------|----------|
| Mock (in-process) | `MockAIProviderAdapter` (`DefaultMockAIProvider`) |
| Vendor stub | OpenAI, Azure OpenAI, Gemini, Claude, Ollama, LM Studio |
| Base stub | `StubAIProviderAdapter` (compartilhado; sem HTTP) |

---

## 7. Testes

| Item | Valor |
|------|-------|
| Script | `npm run enterprise:ai-provider:test` |
| Arquivo | `scripts/enterprise/tests/ai-provider-engine.test.ts` |

---

## 8. Fora de escopo

- Prompts do MedicFlow
- OCR / TISS / Contratos / Workflow clínico / Rule Packs
- Chamadas HTTP reais / chaves de API
- Alterações de UI, banco, migrations ou APIs existentes
- Bind de Rule Engine / Workflow / Document Identity a este Port (apenas preparação documental)

---

## 9. Próximos passos (não nesta sprint)

1. Adapters vendor com runtime injetável (HTTP/SDK atrás do Port).
2. Streaming real via contrato estável.
3. Consumers oficiais: Rule Engine, Workflow, Document Identity, OCR, Contract Intelligence, Auditoria IA — **coordenados pelo Core**, nunca pelo adapter.

---

## 10. Integração futura (preparação)

| Consumer futuro | Como usará o Port |
|-----------------|-------------------|
| Rule Engine | Avaliar outcomes / ações externas via `invoke` genérico — sem regras clínicas no adapter |
| Workflow | Steps de automação invocam `AIProviderPort` por DI |
| Document Identity | Classificação/extração genérica via capabilities (`document-analysis`, `vision`) |
| OCR | Orquestração de produto chama o Port; OCR não mora no adapter |
| Contract Intelligence | Análise textual genérica; contratos permanecem no Business Module |
| Auditoria IA | Revisão assistida via `structured-output` / `json-mode` |

Nenhum desses consumers é implementado na EPC-07.

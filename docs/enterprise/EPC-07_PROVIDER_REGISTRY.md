# EPC-07 — AI Provider Registry

**Sprint:** EPC-07 — AI Provider Ports Foundation  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/ai-provider/registry/ai-provider-registry.ts`

---

## 1. Objetivo

O `AIProviderRegistry` é o catálogo oficial de provedores da fundação Enterprise Intelligence.

Cada registro contém:

| Campo | Descrição |
|-------|-----------|
| `providerId` | Id estável (`mock`, `openai`, …) |
| `name` | Nome legível |
| `version` | Versão do adapter/registro |
| `capabilities` | Lista de `AICapabilityId` |
| `modalities` | `text` / `image` / `audio` / `document` / `embedding` |
| `status` | `ready` \| `stub` \| `disabled` \| `unhealthy` |
| `adapterId` | Id do adapter concreto |
| `vendor` | Identificador tecnológico (não clínico) |
| `description` | Opcional |

---

## 2. Providers registrados (fundação)

| # | providerId | name | status | adapterId |
|---|------------|------|--------|-----------|
| 1 | `mock` | Default Mock AI Provider | ready | `mock-deterministic` |
| 2 | `test` | Test AI Provider | ready | `mock-deterministic` |
| 3 | `openai` | OpenAI | stub | `openai-stub` |
| 4 | `azure-openai` | Azure OpenAI | stub | `azure-openai-stub` |
| 5 | `gemini` | Google Gemini | stub | `gemini-stub` |
| 6 | `claude` | Anthropic Claude | stub | `claude-stub` |
| 7 | `ollama` | Ollama | stub | `ollama-stub` |
| 8 | `lm-studio` | LM Studio | stub | `lm-studio-stub` |

**Total registrados na fundação: 8.**

Constante: `BUILTIN_AI_PROVIDER_COUNT = 8`.

---

## 3. API do Registry

```ts
class AIProviderRegistry {
  register(entry: AIProviderRegistration): void;
  get(providerId: AIProviderId): AIProviderRegistration | undefined;
  has(providerId: AIProviderId): boolean;
  list(): readonly AIProviderRegistration[];
  listByStatus(status: AIProviderStatus): readonly AIProviderRegistration[];
  supports(providerId: AIProviderId, capability: AICapabilityId): boolean;
  modalitiesOf(providerId: AIProviderId): readonly AIModality[];
  snapshot(): AIProviderRegistrySnapshot;
}
```

Factory default: `createDefaultAIProviderRegistry()`.

A `AIProviderFactory` consulta `has(providerId)` antes de instanciar — provider ausente → erro explícito.

---

## 4. Relação Factory ↔ Registry

```
createAIProviderPort({ provider })
    → AIProviderFactory.create()
        → registry.has(provider) ? instantiate(adapter) : throw
```

- Registry: **metadados / descoberta**
- Factory: **instanciação**
- Port: **contrato de uso**

Nenhuma dessas camadas conhece regras clínicas, Workflow ou Rule Engine.

---

## 5. Extensão futura

Para adicionar um novo provider:

1. Criar adapter em `adapters/` implementando `AIProviderPort`.
2. Registrar entrada builtin (ou `registry.register(...)` em runtime controlado).
3. Adicionar `case` na `AIProviderFactory`.
4. Cobrir com testes de contract/factory/registry.
5. **Não** introduzir conceitos de domínio de saúde no registro.

---

## 6. O que o Registry não faz

- Não valida chaves de API
- Não faz health de rede
- Não escolhe prompts
- Não orquestra OCR / auditoria / contratos
- Não persiste em banco

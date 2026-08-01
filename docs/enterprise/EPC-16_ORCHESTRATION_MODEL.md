# EPC-16 — Orchestration Model

**Sprint:** EPC-16 — AI Orchestrator Foundation  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/ai-orchestrator/ports/`

---

## 1. Objetivo

Definir os modelos canônicos do AI Orchestrator:

1. `AIOrchestrationRequest` (FASE 6)
2. `AIOrchestrationResult` (FASE 7)
3. Políticas de seleção estruturais (FASE 8)

Sem execução de IA. Sem HTTP. Sem prompts.

---

## 2. AIOrchestrationRequest (FASE 6)

| Campo | Tipo | Papel |
|-------|------|-------|
| `RequestId` / `requestId` | `string?` | Identidade da solicitação |
| `TaskType` / `taskType` | `string?` | Tipo opaco de tarefa (sem domínio clínico) |
| `Priority` / `priority` | `low \| normal \| high \| critical \| string` | Prioridade estrutural |
| `RequestedCapabilities` / `requestedCapabilities` | `AICapabilityId[]?` | Capabilities EPC-07 desejadas |
| `PreferredProviders` / `preferredProviders` | `AIProviderId[]?` | Preferência de Providers |
| `FallbackProviders` / `fallbackProviders` | `AIProviderId[]?` | Fallback ordenado |
| `ConfigurationReference` / `configurationReference` | ref opaca | Prep Configuration Engine |
| `MetadataReference` / `metadataReference` | ref opaca | Prep Metadata Engine |
| `Tags` / `tags` | `string[]?` | Classificação livre |
| `CustomAttributes` / `customAttributes` | `Record<string, unknown>?` | Bag opaco |
| `selectionPolicy` | `AISelectionPolicy?` | Política estrutural (extra) |

Nenhum campo de contrato, TISS, OCR, guia, cooperativa ou auditoria.

---

## 3. AIOrchestrationResult (FASE 7)

| Campo | Tipo | Papel |
|-------|------|-------|
| `SelectedProvider` / `selectedProvider` | `AIProviderId?` | Provider escolhido |
| `SelectionReason` / `selectionReason` | `string?` | Motivo determinístico |
| `CapabilitiesMatched` / `capabilitiesMatched` | `AICapabilityId[]?` | Capabilities casadas |
| `ExecutionPolicy` / `executionPolicy` | `AISelectionPolicy?` | Política registrada |
| `MetadataReference` / `metadataReference` | ref opaca | Eco da request |
| `ok` / `requestId` / `message` / `code` | — | Resultado operacional |

**Sem execução real.** O resultado descreve a seleção, não um completion de modelo.

---

## 4. Políticas de seleção (FASE 8) — somente estruturais

| Policy | Implementada na fundação? | Descrição |
|--------|---------------------------|-----------|
| `FIRST_AVAILABLE` | **Sim** (determinística) | preferred → fallback → ready → stub |
| `HIGHEST_PRIORITY` | Não | Estrutural — sprint futura |
| `BEST_CAPABILITIES` | Não | Estrutural — sprint futura |
| `LOWEST_COST` | Não | Estrutural — sem pricing |
| `CUSTOM` | Não | Estrutural — extensão futura |

Helpers: `AI_SELECTION_POLICIES`, `AI_SELECTION_POLICY_CATALOG`, `isKnownSelectionPolicy`, `getSelectionPolicy`, `listSelectionPolicies`.

Quando uma política não implementada é solicitada, a fundação:

1. registra `executionPolicy` com o valor pedido;
2. resolve via `FIRST_AVAILABLE`;
3. anota `foundation_resolves_as_first_available` em `selectionReason`.

---

## 5. Store

`StoredAIOrchestration = { request, result }`

Persistência in-process via `DefaultAIOrchestratorStore`.  
Sem banco. Sem migrations.

---

## 6. Relação com EPC-07

| Conceito Orchestrator | Origem EPC-07 |
|-----------------------|---------------|
| `AIProviderId` | `ai-provider/ports/types` |
| `AICapabilityId` | `ai-provider/ports/capabilities` |
| `AIProviderRegistration` | Registry |
| Capabilidades disponíveis | `AIProviderRegistry` |

O Orchestrator **reutiliza** tipos do Framework; não redefine vendors.

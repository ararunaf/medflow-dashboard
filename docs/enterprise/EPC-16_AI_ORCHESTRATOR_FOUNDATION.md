# EPC-16 — AI Orchestrator Foundation

**Sprint:** EPC-16 — AI Orchestrator Foundation  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/ai-orchestrator/`

---

## 1. Objetivo

Construir a **infraestrutura do AI Orchestrator** utilizando exclusivamente o AI Provider Framework (EPC-07).

Esta sprint **NÃO**:

- implementa IA real
- implementa AI Auditor
- realiza chamadas HTTP
- utiliza OpenAI / Gemini / Claude / Azure OpenAI / Ollama
- altera UI, APIs ou migrations
- implementa prompts, OCR, contratos ou auditoria

---

## 2. Princípio arquitetural

O AI Orchestrator **nunca** conversa diretamente com modelos.

Ele conversa **apenas** com o AI Provider Framework.

Toda seleção de Provider ocorre através do Registry da EPC-07.

O AI Orchestrator **nunca** conhece:

| Proibido | Motivo |
|----------|--------|
| Contratos | Domínio de negócio |
| TISS | Domínio clínico / convênio |
| OCR | Outro componente |
| Workflow | Outro Engine |
| Rule Engine | Outro Engine |
| Cooperativas / Operadoras | Domínio de produto |

Responsabilidade única: **selecionar e preparar** o Provider de IA mais adequado para uma solicitação.

---

## 3. Arquitetura (ECS-01)

```
Application
    ↓
AIOrchestratorPort
    ↓
AIOrchestratorAdapter
    ↓
AIOrchestratorStore
    ↓
AIOrchestratorFactory
    ↓
AIOrchestratorProvider
    ↓
AI Provider Framework (EPC-07)
```

| Camada | Artefato | Responsabilidade |
|--------|----------|------------------|
| Port | `AIOrchestratorPort` | Contrato estável |
| Adapter | `Default` / `Mock` | Seleção determinística + store |
| Store | `AIOrchestratorStore` | Persistência in-process de seleções |
| Factory | `AIOrchestratorFactory` | Instanciação do Port |
| Provider | `createAIOrchestratorPort` | DI / inversão de dependência |
| Downstream | EPC-07 Registry | Catálogo de AI Providers |

---

## 4. Superfície do Port

```ts
interface AIOrchestratorPort {
  readonly providerId: AIOrchestratorProviderId;
  selectProvider(request: AIOrchestrationRequest): Promise<AIOrchestrationResult>;
  getProvider(input: GetProviderInput): Promise<GetProviderResult>;
  listAvailableProviders(input?: ListAvailableProvidersInput): Promise<ListAvailableProvidersResult>;
  health(): Promise<AIOrchestratorHealth>;
  capabilities(): AIOrchestratorCapabilities;
}
```

Nenhuma operação executa IA (`invoke` não existe neste Port).

---

## 5. Fases entregues

| Fase | Entrega |
|------|---------|
| 1 | `AIOrchestratorPort` |
| 2 | `DefaultAIOrchestratorAdapter` (determinístico) |
| 3 | `MockAIOrchestratorAdapter` |
| 4 | `AIOrchestratorFactory` |
| 5 | `createAIOrchestratorPort` (Provider) |
| 6 | `AIOrchestrationRequest` |
| 7 | `AIOrchestrationResult` |
| 8 | Políticas estruturais (`FIRST_AVAILABLE` … `CUSTOM`) |
| 9 | Docs de integração futura |
| 10 | Documentação + certificação |

---

## 6. Seleção determinística

A fundação aplica **FIRST_AVAILABLE**:

1. `preferredProviders` (ordem declarada)
2. `fallbackProviders`
3. Providers `ready` do Registry EPC-07
4. Providers `stub` do Registry

Filtro opcional por `requestedCapabilities`.  
Políticas além de `FIRST_AVAILABLE` são **estruturais** (registradas em `executionPolicy`, resolvidas como FIRST_AVAILABLE nesta sprint).

---

## 7. Integração com EPC-07

| Operação | Uso do AI Provider Framework |
|----------|------------------------------|
| `listAvailableProviders` | `AIProviderRegistry.list()` |
| `getProvider` | `AIProviderRegistry.get()` |
| `selectProvider` | Registry + filtro de capabilities |
| `health` | Contagem do Registry |

**Nunca** chama `AIProviderPort.invoke()`.

---

## 8. Testes

```bash
npm run enterprise:ai-orchestrator:test
```

Suite: `scripts/enterprise/tests/ai-orchestrator-engine.test.ts`

---

## 9. Documentos satélite

| Documento | Função |
|-----------|--------|
| [`EPC-16_ORCHESTRATION_MODEL.md`](./EPC-16_ORCHESTRATION_MODEL.md) | Modelos canônicos + políticas |
| [`EPC-16_ARCHITECTURE.md`](./EPC-16_ARCHITECTURE.md) | Arquitetura + integração futura |
| [`EPC-16_CERTIFICATION.md`](./EPC-16_CERTIFICATION.md) | Certificação obrigatória |

# EPC-07 — AI Provider Architecture

**Sprint:** EPC-07 — AI Provider Ports Foundation  
**Data:** 31/07/2026  
**Documento irmão:** [`EPC-07_AI_PROVIDER_PORT.md`](./EPC-07_AI_PROVIDER_PORT.md) · [`EPC-07_PROVIDER_REGISTRY.md`](./EPC-07_PROVIDER_REGISTRY.md)

---

## 1. Hierarquia oficial

```
Application
    ↓
AIProviderPort          (contrato estável)
    ↓
AIProviderAdapter       (Mock | Stub vendor)
    ↓
AIProviderFactory       (instanciação por id)
    ↓
AIProviderRegistry      (catálogo: nome, versão, caps, modalidades, status)
    ↓
Health / Capabilities   (superfície operacional)
    ↓
Infrastructure          (futuro: HTTP/SDK — ausente na EPC-07)
```

Conformidade com ECS-01: Dependency Inversion, Ports & Adapters, Open/Closed, No Clinical Knowledge inside Core.

---

## 2. Decisões arquiteturais

| # | Decisão | Motivo |
|---|---------|--------|
| D1 | Port único `AIProviderPort` | Um contrato para todos os vendors |
| D2 | Default de produção da fundação = `mock` | Não há I/O real; evita uso acidental de stub |
| D3 | Vendor adapters são stubs | Sprint proíbe HTTP/SDK/chaves |
| D4 | `DefaultMockAIProvider` determinístico | Testes e certificação sem internet |
| D5 | Capabilities genéricas apenas | Sem OCR clínico, TISS, contratos no catálogo |
| D6 | Factory + Registry separados | Instanciação ≠ catálogo de metadados |
| D7 | `createAIProviderPort` em `providers/` | Entry point ECS-01 para DI |
| D8 | Request/Response sem domínio de saúde | Evolução de consumers sem poluir o Port |
| D9 | Stubs retornam `ok: false` em `invoke`/`health` | Deixa explícito que não há IA real |
| D10 | Sem store | Estado vive no registry/factory; sem persistência |

---

## 3. Regras de dependência

| Camada | Pode depender de | Não pode depender de |
|--------|------------------|----------------------|
| Application (demo) | `AIProviderPort` | Adapter concreto, SDK vendor |
| Port | Tipos próprios | Adapter, Registry, UI, clínico |
| Adapter | Port + tipos | Application, Rule Engine, Workflow, TISS |
| Factory | Adapters + Registry | UI, regras de negócio |
| Registry | Tipos + ids de adapter | HTTP, chaves, domínio clínico |
| Infrastructure (futuro) | SDKs externos | Consumers de produto |

---

## 4. Proibições absolutas

1. Chamar OpenAI / Gemini / Claude / Azure / Ollama / LM Studio fora do adapter.
2. Colocar prompts clínicos, TISS, guias, pacientes ou auditorias no adapter.
3. Ler ou embutir chaves de API nesta sprint.
4. Executar `fetch` / SDKs / sockets nos adapters EPC-07.
5. Ligar UI, rotas ou Server Functions ao Port nesta sprint.
6. Criar migrations ou alterar schema.

---

## 5. Capacidades genéricas

| Capability | Uso tecnológico |
|------------|-----------------|
| `text-generation` | Texto livre |
| `structured-output` | Payload estruturado genérico |
| `vision` | Input de imagem multimodal |
| `document-analysis` | Input documental genérico (não é OCR de produto) |
| `streaming` | Chunks parciais (declarativo nesta sprint) |
| `embeddings` | Vetores |
| `tool-calling` | Intents de tool/function |
| `json-mode` | Saída JSON-compatible |

---

## 6. Preparação para integração futura

O Enterprise Platform Core coordenará:

| Módulo | Papel futuro |
|--------|--------------|
| Rule Engine | Pedir avaliações / outcomes assistidos via Port |
| Workflow | Steps de invocação genérica |
| Document Identity | Usar modalities `document` / `image` |
| OCR | Orquestrar produto → Port (adapter permanece cego ao TISS) |
| Contract Intelligence | Análise textual genérica |
| Auditoria IA | `structured-output` / `json-mode` |

Adapters **nunca** importarão esses módulos.

---

## 7. Árvore de código

```
src/lib/enterprise/ai-provider/
├── index.ts
├── ports/
│   ├── ai-provider-port.ts
│   ├── types.ts
│   ├── capabilities.ts
│   └── index.ts
├── adapters/
│   ├── mock-ai-provider-adapter.ts
│   ├── stub-ai-provider-adapter.ts
│   ├── openai-ai-provider-adapter.ts
│   ├── azure-openai-ai-provider-adapter.ts
│   ├── gemini-ai-provider-adapter.ts
│   ├── claude-ai-provider-adapter.ts
│   ├── ollama-ai-provider-adapter.ts
│   ├── lm-studio-ai-provider-adapter.ts
│   └── index.ts
├── factory/
│   ├── ai-provider-factory.ts
│   └── index.ts
├── registry/
│   ├── ai-provider-registry.ts
│   └── index.ts
├── providers/
│   ├── create-ai-provider-port.ts
│   └── index.ts
└── demo/
    ├── ai-provider-health-query.ts
    └── index.ts
```

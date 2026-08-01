# EPC-16 — AI Orchestrator Architecture

**Sprint:** EPC-16 — AI Orchestrator Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-16_AI_ORCHESTRATOR_FOUNDATION.md`](./EPC-16_AI_ORCHESTRATOR_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getAIOrchestratorHealthSummary)    │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AIOrchestratorPort                                   │
│  selectProvider | getProvider | listAvailableProviders│
│  health | capabilities                               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultAIOrchestratorAdapter                        │
│  MockAIOrchestratorAdapter / DefaultMockAIOrchestrator│
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AIOrchestratorStore (in-process)                     │
│  + runtime selectProviderDeterministic               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AIOrchestratorFactory → createAIOrchestratorPort     │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AI Provider Framework (EPC-07)                       │
│  AIProviderRegistry | AIProviderFactory | AIProviderPort│
│  (somente consulta de registry — sem invoke)         │
└──────────────────────────────────────────────────────┘
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Fronteiras

| Pode | Não pode |
|------|----------|
| Consultar Registry EPC-07 | Chamar `AIProviderPort.invoke()` |
| Selecionar Provider | Executar IA / prompts |
| Declarar políticas estruturais | Implementar ranking de custo/ML |
| Persistir seleção no store | Criar banco / migrations |
| Health / capabilities | Alterar UI / APIs |
| Preparar hooks futuros | Conhecer TISS / contratos / OCR |
| Documentar integração | Implementar AI Auditor |

---

## 3. Desacoplamento

```
┌────────────────────────┐
│ AI Orchestrator        │  (somente seleção)
└───────────┬────────────┘
            │ Registry lookup
            ↓
   AI Provider Framework (EPC-07)
            │
            │ (futuro — fora desta sprint)
            ├──────────→ AI Auditor Foundation
            ├──────────→ OCR Provider
            ├──────────→ Rule Engine (consulta de provider)
            ├──────────→ Workflow (step de IA)
            ├──────────→ Contract Foundation
            └──────────→ Document Processing
```

### Dependências permitidas

| De | Para | Forma |
|----|------|-------|
| `ai-orchestrator` | `ai-provider` | Registry + tipos (`AIProviderId`, capabilities) |
| Application | `ai-orchestrator` | Port / factory |

### Dependências proibidas

- `ai-orchestrator` → `contract`, `rule`, `workflow`, `ocr-provider`, `document-processor`, `rule-pack`, `tenant`
- Qualquer import de SDK HTTP / vendor de IA
- Qualquer acoplamento a UI / Server Functions / rotas

---

## 4. Integração futura (FASE 9) — sem implementação

### 4.1 AI Auditor

O AI Auditor solicitará um `AIOrchestrationRequest` com capabilities genéricas
(ex.: `structured-output`, `json-mode`) e receberá `AIOrchestrationResult.selectedProvider`.
A execução da auditoria permanece no componente Auditor — **nunca** no Orchestrator.

### 4.2 OCR

OCR Providers (EPC-15) são distintos. Se OCR futuro precisar de IA multimodal,
passará pelo Orchestrator apenas para obter o Provider (ex.: vision), sem misturar
OCR Provider Framework com lógica clínica.

### 4.3 Rule Engine

Rule Engine poderá pedir um Provider para avaliação assistida futura.
O Orchestrator retorna apenas a seleção; regras clínicas ficam no Rule Engine.

### 4.4 Workflow

Um step de Workflow poderá chamar `selectProvider` antes de um worker de IA.
O Orchestrator não conhece definições de Workflow.

### 4.5 Contract Foundation

Contratos nunca entram no Orchestrator. Se uma etapa futura usar IA sobre texto
de contrato, o Contract Foundation monta a request genérica e o Orchestrator
apenas escolhe o Provider.

### 4.6 Document Processing

Document Processing (EPC-13) permanece independente. Integração futura:
Processing → (opcional) Orchestrator.selectProvider → AI Provider — sem bind nesta sprint.

---

## 5. Adapters

| Adapter | `providerId` | Uso |
|---------|--------------|-----|
| `DefaultAIOrchestratorAdapter` | `default` | Produção / in-process |
| `MockAIOrchestratorAdapter` | `mock` / `test` | Testes / homologação / offline |

Ambos são 100% determinísticos e sem rede.

---

## 6. Garantias de isolamento

1. Nenhum símbolo de auditoria clínica no Port.
2. Nenhum campo TISS / contrato / cooperativa.
3. Nenhum `fetch` / SDK / HTTP nos adapters.
4. Nenhum `invoke` de AI Provider nesta sprint.
5. Nenhuma alteração em UI, APIs, migrations ou Engines existentes.

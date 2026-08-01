# EPC-18 — AI Auditor Foundation

**Sprint:** EPC-18 — AI Auditor Foundation  
**Data:** 31/07/2026  
**Implementação:** `src/lib/enterprise/ai-auditor/`

---

## 1. Objetivo

Construir a **fundação arquitetural da AI Auditora Enterprise**.

Esta sprint **NÃO**:

- implementa IA real
- realiza chamadas HTTP
- utiliza OpenAI / Gemini / Claude / Azure OpenAI / Ollama / LM Studio
- cria prompts
- interpreta TISS ou contratos
- executa regras
- altera Rule Engine / Workflow
- altera UI, APIs ou migrations

---

## 2. Princípio arquitetural

A AI Auditora **NÃO** toma decisões.  
A AI Auditora **NÃO** aprova.  
A AI Auditora **NÃO** reprova.  
A AI Auditora **NÃO** executa regras.  
A AI Auditora **NÃO** interpreta contratos.

Quem decide continua sendo:

```
Contract
  ↓
Rule Pack
  ↓
Rule Engine
  ↓
Expression Engine
  ↓
Resultado Determinístico
  ↓
AI Auditor
  ↓
AuditExplanation
```

O restante do MedicFlow **nunca** consome respostas brutas de LLM.  
Consome exclusivamente **`AuditExplanation`**.

---

## 3. Arquitetura (ECS-01)

```
Application
    ↓
AIAuditorPort
    ↓
AIAuditorAdapter
    ↓
AIAuditorStore
    ↓
AIAuditorFactory
    ↓
AIAuditorProvider
    ↓
AI Orchestrator (EPC-16)
    ↓
AI Provider Framework (EPC-07)
```

| Camada | Artefato | Responsabilidade |
|--------|----------|------------------|
| Port | `AIAuditorPort` | Contrato estável |
| Adapter | `DefaultMock` / `Mock` | Explicação determinística + store |
| Store | `AIAuditorStore` | Persistência in-process de explicações |
| Factory | `AIAuditorFactory` | Instanciação do Port |
| Provider | `createAIAuditorPort` | DI / inversão de dependência |
| Downstream | EPC-16 → EPC-07 | Seleção de Provider (sem invoke) |

---

## 4. Superfície do Port

```ts
interface AIAuditorPort {
  readonly providerId: AIAuditorProviderId;
  audit(request: AuditRequest): Promise<AuditResult>;
  health(): Promise<AIAuditorHealth>;
  capabilities(): AIAuditorCapabilities;
  providerInfo(): AIAuditorProviderInfo;
  validateConfiguration(): Promise<AIAuditorConfigurationValidation>;
}
```

`audit()` produz `AuditExplanation`. Não existe `invoke` neste Port.

---

## 5. Fases entregues

| Fase | Entrega |
|------|---------|
| 1 | `AIAuditorPort` |
| 2 | `DefaultMockAIAuditorAdapter` (determinístico) |
| 3 | `MockAIAuditorAdapter` |
| 4 | `AIAuditorFactory` |
| 5 | `createAIAuditorPort` (Provider) |
| 6 | `AuditExplanation` |
| 7 | `AuditFinding` |
| 8 | `ConfidenceLevel` (estrutural) |
| 9 | Docs de integração futura |
| 10 | Documentação + certificação |

---

## 6. Dependências permitidas

| De | Para | Forma |
|----|------|-------|
| `ai-auditor` | `ai-orchestrator` | Port (`selectProvider`, `health`) |
| `ai-auditor` | `ai-provider` | Tipos (`AIProviderId`) via Orchestrator |
| Application | `ai-auditor` | Port / factory |

### Dependências proibidas

- `ai-auditor` → Rule Engine, Contract, OCR, Workflow, TISS, Document Processor (bind operacional)
- Qualquer import de SDK HTTP / vendor de IA
- Qualquer acoplamento a UI / Server Functions / rotas
- `AIProviderPort.invoke()` nesta fundação

---

## 7. Integração futura (FASE 9) — sem implementação

Documentado em [`EPC-18_ARCHITECTURE.md`](./EPC-18_ARCHITECTURE.md):

- Rule Engine (consumo do resultado determinístico)
- OCR
- Document Processing
- Workflow
- TISS Intelligence
- Contract Foundation

Nenhuma destas integrações é implementada nesta sprint.

---

## 8. Modelo canônico

Ver [`EPC-18_AUDIT_EXPLANATION_MODEL.md`](./EPC-18_AUDIT_EXPLANATION_MODEL.md).

No futuro, qualquer modelo (OpenAI, Azure OpenAI, Gemini, Claude, Ollama ou outro) poderá ser utilizado **sem alterar** a estrutura do MedicFlow Enterprise — desde que continue produzindo `AuditExplanation` via Orchestrator.

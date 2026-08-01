# EPC-18 — AI Auditor Architecture

**Sprint:** EPC-18 — AI Auditor Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-18_AI_AUDITOR_FOUNDATION.md`](./EPC-18_AI_AUDITOR_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────────┐
│ Application (PoC: getAIAuditorHealthSummary)         │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AIAuditorPort                                        │
│  audit | health | capabilities                       │
│  providerInfo | validateConfiguration                │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ Adapters                                             │
│  DefaultMockAIAuditorAdapter                         │
│  MockAIAuditorAdapter                                │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AIAuditorStore (in-process)                          │
│  + runtime buildDeterministicAuditExplanation        │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AIAuditorFactory → createAIAuditorPort               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AI Orchestrator (EPC-16)                             │
│  selectProvider | health  (sem invoke)               │
└──────────────────────────┬───────────────────────────┘
                           ↓
┌──────────────────────────────────────────────────────┐
│ AI Provider Framework (EPC-07)                       │
│  Registry / Factory / Port (somente via Orchestrator)│
└──────────────────────────────────────────────────────┘
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Fronteiras

| Pode | Não pode |
|------|----------|
| Produzir `AuditExplanation` | Tomar decisão / aprovar / reprovar |
| Usar AI Orchestrator (`selectProvider`) | Chamar `AIProviderPort.invoke()` |
| Persistir explicação no store | Criar banco / migrations |
| Health / capabilities / providerInfo | Alterar UI / APIs |
| Validar configuração estrutural | Criar prompts / HTTP |
| Preparar hooks futuros | Interpretar TISS / contratos |
| Documentar integração | Executar regras / Rule Engine |

---

## 3. Desacoplamento

```
┌────────────────────────┐
│ Rule Engine            │  → Resultado Determinístico
└───────────┬────────────┘
            │ (futuro — eco opaco)
            ↓
┌────────────────────────┐
│ AI Auditor             │  → AuditExplanation
└───────────┬────────────┘
            │ selectProvider (apenas)
            ↓
   AI Orchestrator (EPC-16)
            │
            ↓
   AI Provider Framework (EPC-07)
```

### Dependências permitidas

| De | Para | Forma |
|----|------|-------|
| `ai-auditor` | `ai-orchestrator` | Port |
| `ai-auditor` | `ai-provider` | Tipos (`AIProviderId`) |
| Application | `ai-auditor` | Port / factory |

### Dependências proibidas

- `ai-auditor` → `rule`, `contract`, `ocr-provider`, `workflow`, `document-processor`, `rule-pack`, `tiss` (bind operacional)
- Qualquer import de SDK HTTP / vendor de IA
- Qualquer acoplamento a UI / Server Functions / rotas

---

## 4. Integração futura (FASE 9) — sem implementação

### 4.1 Rule Engine

| Aspecto | Preparação |
|---------|------------|
| Papel futuro | Fornecer `DeterministicAuditOutcome` ao `audit()` |
| Nesta sprint | Campo opaco; sem bind; sem execução |
| Flag | `supportsFutureRuleEngine` |

### 4.2 OCR

| Aspecto | Preparação |
|---------|------------|
| Papel futuro | Evidências de OCR referenciadas em `evidenceList` |
| Nesta sprint | Sem bind OCR |
| Flag | `supportsFutureOcr` |

### 4.3 Document Processing

| Aspecto | Preparação |
|---------|------------|
| Papel futuro | `processingReference` ligando pipeline de processamento |
| Nesta sprint | Ref opaca apenas |
| Flag | `supportsFutureDocumentProcessing` |

### 4.4 Workflow

| Aspecto | Preparação |
|---------|------------|
| Papel futuro | Step de explicação pós-resultado determinístico |
| Nesta sprint | `workflowReference` opaca |
| Flag | `supportsFutureWorkflow` |

### 4.5 TISS Intelligence

| Aspecto | Preparação |
|---------|------------|
| Papel futuro | Findings/evidências TISS como payload opaco |
| Nesta sprint | Sem conhecimento TISS |
| Flag | `supportsFutureTissIntelligence` |

### 4.6 Contract Foundation

| Aspecto | Preparação |
|---------|------------|
| Papel futuro | `referencedContracts` opacos |
| Nesta sprint | Sem interpretação contratual |
| Flag | `supportsFutureContractFoundation` |

---

## 5. Fluxo de decisão (inalterado)

```
Contract → Rule Pack → Rule Engine → Expression Engine
  → Resultado Determinístico → AI Auditor → AuditExplanation
```

A AI Auditora explica. Quem decide permanece no eixo determinístico.

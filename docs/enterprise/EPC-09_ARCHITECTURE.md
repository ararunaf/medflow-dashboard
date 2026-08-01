# EPC-09 — Rule Pack Architecture

**Sprint:** EPC-09 — Rule Pack Management Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-09_RULE_PACK_MANAGEMENT.md`](./EPC-09_RULE_PACK_MANAGEMENT.md)

---

## 1. Camadas (ECS-01)

```
┌─────────────────────────────────────────────┐
│ Application (PoC: getRulePackHealthSummary) │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│ RulePackPort                                │
│  createPack | getPack | listPacks           │
│  enablePack | disablePack | health | caps   │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│ Adapters                                    │
│  DefaultRulePackAdapter                     │
│  MockRulePackAdapter                        │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│ RulePackStore (DefaultRulePackStore)        │
│  in-process Map — sem banco                 │
└─────────────────────────────────────────────┘

Factory (RulePackFactory) ← Provider (createRulePackPort)
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Providers

| ProviderId | Adapter | Estado |
|------------|---------|--------|
| `default` | `DefaultRulePackAdapter` | Implementado |
| `mock` | `MockRulePackAdapter` | Implementado |
| `test` | `MockRulePackAdapter` | Implementado |
| `database` | — | Reservado (erro explícito) |
| `remote` | — | Reservado (erro explícito) |
| `registry` | — | Reservado (erro explícito) |

---

## 3. Fronteiras

| Pode | Não pode |
|------|----------|
| Agrupar refs de regras | Avaliar regras |
| Versionar packs | Criar Rule Engine novo |
| Declarar dependências | Resolver dependências |
| Enable / disable pack | Conhecer TISS / contratos |
| Health / capabilities | Tocar UI / APIs / DB |

---

## 4. Integração futura (FASE 9) — apenas documentação

Nenhum dos componentes abaixo é implementado ou acoplado nesta sprint.

### 4.1 Workflow

- Workflow poderá referenciar um `packId` como payload / variável opaca.
- Ativação de packs em etapas fica na Application / Workflow Engine.
- Rule Pack **não** conhece estados de workflow clínico.

### 4.2 Rule Engine

- Pack armazena `ruleReferences` (ids/namespaces opacos).
- Application resolve refs via `RulePort.getRule` / `listRules` em sprint futura.
- Rule Pack **não** chama `RulePort` nesta fundação.

### 4.3 Configuration

- Feature flags / hierarquia podem apontar para `packId` habilitado por ambiente.
- Configuration Engine permanece independente; bind é externo.

### 4.4 Metadata

- `metadataReference` aponta opcionalmente a schema / namespace do Metadata Engine.
- Sem validação cruzada nesta sprint.

### 4.5 Tenant Foundation

- Multi-tenant futuro: binding `tenantId → packId[]` fora do Rule Pack Core.
- O modelo **não** embute `tenantId` — permanece genérico e reutilizável.

### 4.6 Contract Intelligence

- Contratos futuros referenciam packs por id externo.
- Rule Pack **nunca** armazena cláusulas, operadoras ou cooperativas.

### 4.7 AI Auditor

- Auditor recebe `packId` + `ruleReferences` como contexto opaco.
- Nenhuma chamada a AI Provider nesta sprint.

```
                    ┌──────────────┐
                    │  Application │
                    └──────┬───────┘
           ┌───────────────┼───────────────┐
           ↓               ↓               ↓
     WorkflowPort    RulePackPort      RulePort
           │               │               │
           │         packId + refs         │
           └───────────────┴───────────────┘
                    (orquestração futura)
```

---

## 5. Relação com EPC anteriores

| EPC | Relação |
|-----|---------|
| EPC-06A Rule Engine | Pack referencia Rules; não substitui o engine |
| EPC-06B Expression | Sem acoplamento |
| EPC-03 Configuration | Bind futuro externo |
| EPC-04 Metadata | `metadataReference` opaca |
| EPC-05 Workflow | Payload futuro com `packId` |
| EPC-07 AI Provider | Consumo futuro via Application |
| EPC-08 Document Identity | Independente |

---

## 6. Reutilização IAeasy

O componente é vendor-agnóstico e sem domínio de saúde.  
Qualquer plataforma IAeasy pode reutilizar `RulePackPort` para organizar packs de regras genéricas.

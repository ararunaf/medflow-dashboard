# EPC-17 — Contract Rule Binding Architecture

**Sprint:** EPC-17 — Contract Rule Binding Foundation  
**Data:** 31/07/2026  
**Natureza:** Arquitetura de Binding — **sem** execução de regras  
**Documento pai:** [`EPC-17_CONTRACT_RULE_BINDING.md`](./EPC-17_CONTRACT_RULE_BINDING.md)  
**Padrão:** ECS-01

---

## 1. Fluxo oficial (ECS-01)

```
Application
    ↓
ContractRuleBindingPort
    ↓
ContractRuleBindingAdapter   (Default | Mock | futuros)
    ↓
ContractRuleBindingStore     (in-process nesta sprint)
    ↓
ContractRuleBindingFactory
    ↓
ContractRuleBindingProvider  (createContractRuleBindingPort)
```

### Cadeia de domínio (desacoplada)

```
Contract (EPC-11)
    ↓  (somente referência opaca)
Contract Rule Binding (EPC-17)
    ↓  (somente referência opaca)
Rule Pack (EPC-09)
    ↓  (futuro — fora desta sprint)
Rule Engine (EPC-06A)
    ↓  (futuro — fora desta sprint)
Expression Engine (EPC-06B)
```

### Árvore do componente

```
src/lib/enterprise/contract-rule-binding/
├── index.ts
├── ports/
│   ├── contract-rule-binding-port.ts
│   ├── types.ts
│   ├── identity.ts
│   ├── references.ts
│   └── index.ts
├── adapters/
│   ├── default-contract-rule-binding-adapter.ts
│   ├── mock-contract-rule-binding-adapter.ts
│   └── index.ts
├── store/
│   ├── contract-rule-binding-store.ts
│   ├── default-contract-rule-binding-store.ts
│   └── index.ts
├── factory/
│   ├── contract-rule-binding-factory.ts
│   └── index.ts
├── providers/
│   ├── create-contract-rule-binding-port.ts
│   └── index.ts
└── demo/
    ├── contract-rule-binding-health-query.ts
    └── index.ts
```

---

## 2. Decisões arquiteturais

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| Família de adapter | Default + Store + Mock | Estado in-process; sem vendor |
| Persistência | Memória de processo | Sem banco / migrations |
| Referências | Opacas (`ContractReference`, `RulePackReference`) | Contrato e Rule Pack não se importam |
| BindingPolicy | Enumeração pura | Sem lógica de seleção |
| Factory + Provider | Ambos | Factory instancia; Provider é API Application |
| Providers futuros | Erro explícito | Sem fallback silencioso (ECS-01) |
| Execução de regras | Não implementada | Rule Engine permanece único executor |
| Isolamento de módulos | Sem import de `contract` / `rule-pack` / `rule` | Desacoplamento total |

---

## 3. Fronteiras

### Pode

- Representar Binding canônico Contrato ↔ Rule Pack
- Persistir Bindings in-process (Default / Mock)
- Filtrar por contractId / packId / status / tag / policy
- Declarar capacidades futuras (prep flags)
- Materializar adapters via Factory / Provider

### Não pode

- Executar regras
- Avaliar `BindingPolicy`
- Importar Rule Engine / Expression Engine
- Carregar conteúdo de Rule Pack
- Interpretar cláusulas do contrato
- Conhecer TISS / OCR / AI Auditor / Workflow operacional
- Criar banco, migrations, UI ou APIs
- Alterar Document Processing

---

## 4. Integração futura (FASE 8) — somente documentação

Nenhum dos módulos abaixo foi acoplado ou carregado nesta sprint.  
O Binding apenas **representa** associações futuras via referências opacas e flags de capacidade.

### 4.1 Rule Engine (EPC-06A)

- Futuro: consumidor lê Bindings e resolve quais Rule Packs aplicar.
- Binding **nunca** chama o Rule Engine.
- Capacidade: `supportsFutureRuleEngine: true` (prep).

### 4.2 Expression Engine (EPC-06B)

- Futuro: Rule Engine usa Expression Engine após resolução de packs.
- Binding **nunca** avalia expressões.
- Capacidade: `supportsFutureExpressionEngine: true` (prep).

### 4.3 Workflow

- Futuro: Workflow pode consultar Bindings ativos por contrato.
- Binding **nunca** inicia workflow.
- Capacidade: `supportsFutureWorkflow: true` (prep).

### 4.4 AI Auditor

- Futuro: AI Auditor pode usar Bindings como contexto estrutural.
- Binding **nunca** invoca IA.
- Capacidade: `supportsFutureAiAuditor: true` (prep).

### 4.5 TISS Intelligence

- Futuro: inteligência TISS pode consumir packs vinculados via Binding.
- Binding **nunca** contém conhecimento TISS.
- Capacidade: `supportsFutureTissIntelligence: true` (prep).

---

## 5. Providers

| ProviderId | Adapter | Status |
|------------|---------|--------|
| `default` | `DefaultContractRuleBindingAdapter` | Implementado (in-process) |
| `mock` | `MockContractRuleBindingAdapter` | Implementado |
| `test` | `MockContractRuleBindingAdapter` | Implementado |
| `database` | — | Erro explícito |
| `remote` | — | Erro explícito |
| `registry` | — | Erro explícito |

---

## 6. Relação com EPC-11 e EPC-09

| Módulo | Conhecimento cruzado nesta sprint |
|--------|-----------------------------------|
| Contract (EPC-11) | Continua **sem** conhecer Rule Engine; pode listar refs de pack, mas execução passa pelo Binding |
| Rule Pack (EPC-09) | Continua **sem** conhecer contratos |
| Binding (EPC-17) | Única camada de associação canônica entre ambos |

Isolamento de código: `contract-rule-binding` **não importa** `contract` nem `rule-pack`.

# EPC-17 — Binding Model

**Sprint:** EPC-17 — Contract Rule Binding Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-17_CONTRACT_RULE_BINDING.md`](./EPC-17_CONTRACT_RULE_BINDING.md)

---

## 1. Modelo canônico — `ContractRuleBinding`

Associação estrutural entre um Contrato e um Rule Pack.

| Campo (canônico) | Tipo | Obrigatório | Notas |
|------------------|------|-------------|-------|
| `BindingId` (`bindingId`) | `string` | Sim | Identidade estável |
| `ContractReference` (`contractReference`) | opaca | Sim | Sem carregar EPC-11 |
| `RulePackReference` (`rulePackReference`) | opaca | Sim | Sem carregar EPC-09 |
| `Priority` (`priority`) | `number` | Não | Estrutural — sem regra de seleção |
| `ExecutionOrder` (`executionOrder`) | `number` | Não | Estrutural — sem execução |
| `Status` (`status`) | enum estrutural | Sim | ACTIVE / INACTIVE / DRAFT / DEPRECATED / ARCHIVED |
| `EffectiveDate` (`effectiveDate`) | ISO string | Não | Vigência estrutural |
| `ExpirationDate` (`expirationDate`) | ISO string | Não | Vigência estrutural |
| `MetadataReference` (`metadataReference`) | opaca | Não | Prep Metadata Engine |
| `ConfigurationReference` (`configurationReference`) | opaca | Não | Prep Configuration Engine |
| `Tags` (`tags`) | `string[]` | Não | Classificação livre |
| `CustomAttributes` (`customAttributes`) | `Record` | Não | Opacos — sem schema clínico |

### Extensões estruturais (sem lógica)

| Campo | Motivo |
|-------|--------|
| `version` | Versionamento estrutural do Binding |
| `bindingPolicy` | Enumeração `BindingPolicy` (sem avaliação) |
| `createdAt` / `updatedAt` | Timestamps de store in-process |

---

## 2. Referências opacas

### `ContractReference`

```ts
{
  contractId?: string;
  id?: string;
  name?: string;
  version?: string;
  kind?: string;
  uri?: string;
}
```

Não importa o módulo `contract`. Não valida existência. Não interpreta cláusulas.

### `RulePackReference`

```ts
{
  packId?: string;
  id?: string;
  name?: string;
  version?: string;
  kind?: string;
  uri?: string;
}
```

Não importa o módulo `rule-pack`. Não carrega regras. Não avalia expressões.

---

## 3. `BindingPolicy` (FASE 7)

Enumeração pura — **sem lógica** nesta sprint.

| Valor | Significado estrutural (futuro) |
|-------|----------------------------------|
| `FIRST_MATCH` | Primeiro binding elegível |
| `ALL_MATCH` | Todos os bindings elegíveis |
| `HIGHEST_PRIORITY` | Maior prioridade |
| `CUSTOM` | Política customizada futura |

Nenhuma função avalia `BindingPolicy` nesta fundação.

---

## 4. Status estruturais

| Status | Uso |
|--------|-----|
| `ACTIVE` | Binding ativo (estrutural) |
| `INACTIVE` | Binding inativo |
| `DRAFT` | Default na criação |
| `DEPRECATED` | Marcado como legado |
| `ARCHIVED` | Arquivado |

Sem semântica operacional, TISS ou workflow.

---

## 5. Capacidades de modelo

- **Múltiplos Rule Packs por contrato:** vários Bindings com o mesmo `contractId`.
- **Versionamento:** campo `version` + `RulePackReference.version` / `ContractReference.version`.
- **Prioridades:** campo `priority`.
- **Vigência:** `effectiveDate` / `expirationDate`.
- **Ordem:** `executionOrder` (estrutural).

Nenhuma dessas capacidades implica execução ou seleção automática nesta sprint.

---

## 6. O que o modelo NÃO contém

- Corpo de regra / AST / expression
- Cláusulas contratuais
- Guias TISS / códigos clínicos
- Resultado de OCR / IA
- Workflow id / estado operacional
- Métodos `evaluate` / `executeRule` / `validateContract`

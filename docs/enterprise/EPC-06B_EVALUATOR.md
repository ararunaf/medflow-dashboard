# EPC-06B — Evaluator

**Sprint:** EPC-06B — Rule Expression Engine  
**Data:** 31/07/2026  
**Escopo:** Evaluation Context · Evaluation Runtime · Rule Evaluator · Registry

---

## 1. Camadas

```
Evaluation Context   → somente dados
Expression Registry  → operadores + funções
Evaluation Runtime   → executa AST
Rule Evaluator       → Rule + Context → RuleEvaluation
```

---

## 2. Evaluation Context (FASE 3)

```ts
type EvaluationContext = {
  readonly data: Readonly<Record<string, unknown>>;
  readonly now?: Date; // opcional (today/now)
};
```

Regras:

- Recebe **somente dados**
- **Nunca** regras
- Sem semântica clínica / contratual

Helpers: `createEvaluationContext`, `resolvePath`, `pathExists`, `contextNow`.

---

## 3. Evaluation Runtime (FASE 4)

| API | Papel |
|-----|-------|
| `evaluateAst(ast, context)` | Executa AST (pode lançar) |
| `evaluateAstSafe(...)` | Normaliza `{ ok, value, truthy, error? }` |

Comportamentos:

- Short-circuit em `AND` / `OR`
- `EXISTS` usa presença de path no context
- `ISNULL` → `null` ou `undefined`
- `IN` → membership em array (ou substring se ambos string)
- `REGEX` → `RegExp` seguro (falha → `false`)
- Funções resolvidas via Registry

Sem I/O. Sem banco. Sem APIs.

---

## 4. Rule Evaluator (FASE 5)

### `evaluateExpression`

```
expression + EvaluationContext → { ok, value?, truthy?, error?, code? }
```

### `evaluateRule`

```
RuleDefinition + EvaluationContext → RuleEvaluation
```

Regras de avaliação:

| Situação | Outcome |
|----------|---------|
| `status` disabled/archived | `skipped` |
| Sem conditions | `pass` |
| Todas conditions true (AND) | `pass` |
| Primeira condition false | `fail` |
| Erro de parse/avaliação | `error` |

Conditions estruturais (EPC-06A) mapeadas:

| RuleOperatorId | Semântica |
|----------------|-----------|
| `equals` / `notEquals` | `==` / `!=` |
| `greaterThan` / `lessThan` | `>` / `<` |
| `contains` / `startsWith` / `endsWith` | string/array |
| `exists` / `notExists` | path presence |
| `regex` | REGEX |
| `expression` | parse + evaluate do `value` / `params.expression` |
| `external` | `error` (não avaliável aqui) |

Actions **não** são executadas — apenas `suggestedActions` no resultado.

---

## 5. Expression Registry (FASE 6–8)

### Operadores (13)

`==` `!=` `>` `>=` `<` `<=` `AND` `OR` `NOT` `IN` `EXISTS` `REGEX` `ISNULL`

### Funções (7)

| Função | Aridade | Retorno |
|--------|---------|---------|
| `length(x)` | 1 | number \| null |
| `contains(a,b)` | 2 | boolean |
| `startsWith(s,p)` | 2 | boolean |
| `endsWith(s,s)` | 2 | boolean |
| `matches(s,re)` | 2 | boolean |
| `today()` | 0 | `YYYY-MM-DD` (UTC) |
| `now()` | 0 | ISO timestamp |

Nenhuma função MedicFlow-específica.

---

## 6. Separação do RulePort

O `RulePort` (EPC-06A) **continua sem** `evaluate` / `parse` / `execute`.

O Expression Engine é consumido diretamente por Application / futuros adapters — sem alterar contrato do Port nem superfícies de produto.

---

## 7. Localização

| Peça | Path |
|------|------|
| Context | `expression/context/` |
| Runtime | `expression/runtime/` |
| Evaluator | `expression/evaluator/` |
| Registry | `expression/registry/` |

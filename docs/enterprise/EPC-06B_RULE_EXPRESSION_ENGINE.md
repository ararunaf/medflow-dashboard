# EPC-06B — Rule Expression Engine

**Sprint:** EPC-06B — Rule Expression Engine  
**Data:** 31/07/2026  
**Natureza:** Infraestrutura de linguagem / avaliação — **sem mudança de comportamento do produto**  
**Baseline compatível:** MVP operacional + Ports EPC-01..EPC-06A  
**Continuidade:** Extensão do Rule Engine (EPC-06A)  
**Próxima sprint:** integração opcional RulePort ↔ Evaluation / Workflow Conditions

---

## 1. Objetivo

Construir o **Rule Expression Engine**: mecanismo genérico de parsing e avaliação de expressões, reutilizável em qualquer produto da IAeasy.

```
Application
    ↓
RulePort
    ↓
Expression Engine
    ↓
Expression Parser
    ↓
AST
    ↓
Evaluation Context
    ↓
Evaluation Runtime
    ↓
Rule Adapter
```

Esta sprint **NÃO** cria regras do MedicFlow, TISS, contratos, operadoras, OCR ou IA.  
Entrega apenas a **linguagem** e o **mecanismo de avaliação**.

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| AST | `src/lib/enterprise/rule/expression/ast/` |
| Expression Parser | `src/lib/enterprise/rule/expression/parser/` |
| Evaluation Context | `src/lib/enterprise/rule/expression/context/` |
| Evaluation Runtime | `src/lib/enterprise/rule/expression/runtime/` |
| Rule Evaluator | `src/lib/enterprise/rule/expression/evaluator/` |
| Expression Registry | `src/lib/enterprise/rule/expression/registry/` |
| Barrel Expression | `src/lib/enterprise/rule/expression/index.ts` |
| Re-export público | `src/lib/enterprise/rule/index.ts` |
| Testes | `scripts/enterprise/tests/expression-engine.test.ts` |
| Script npm | `npm run enterprise:expression:test` |

---

## 3. O que NÃO foi feito

- Regras clínicas / TISS / contratos / operadoras
- OCR / IA
- Alteração de UI / APIs / banco / migrations
- Ligação a produção
- Exposição de `evaluate` / `parse` no `RulePort` (permanece contrato EPC-06A)
- Execução de Actions (apenas sugeridas no `RuleEvaluation`)

---

## 4. APIs principais

| API | Responsabilidade |
|-----|------------------|
| `parseExpression(source)` | Texto → AST |
| `createEvaluationContext(data)` | Bag de dados (nunca regras) |
| `evaluateAst(ast, context)` | Executa AST |
| `evaluateExpression({ expression, context })` | Parse + evaluate |
| `evaluateRule(rule, context)` | Rule + Context → `RuleEvaluation` |
| `createExpressionRegistry()` | Registry de operadores/funções |

---

## 5. Operadores mínimos (13)

`==` · `!=` · `>` · `>=` · `<` · `<=` · `AND` · `OR` · `NOT` · `IN` · `EXISTS` · `REGEX` · `ISNULL`

## 6. Funções nativas (7)

`length()` · `contains()` · `startsWith()` · `endsWith()` · `matches()` · `today()` · `now()`

---

## 7. Exemplos (genéricos)

```ts
import {
  createEvaluationContext,
  evaluateExpression,
  evaluateRule,
  parseExpression,
} from "@/lib/enterprise/rule";

const ctx = createEvaluationContext({ status: "active", amount: 120 });

evaluateExpression({
  expression: 'status == "active" AND amount >= 100',
  context: ctx,
});

evaluateRule(
  {
    id: "r1",
    name: "Generic",
    status: "enabled",
    conditions: [{ operator: "expression", value: "amount > 0" }],
  },
  ctx,
);
```

---

## 8. Compatibilidade

- `RulePort` **não** ganhou métodos de avaliação (EPC-06A intacto)
- `supportsEvaluation` permanece `false` no Port
- Expression Engine é módulo irmão consumível por Application / futuros adapters
- Nenhum fluxo de usuário foi redirecionado

---

## 9. Documentos relacionados

- [`EPC-06B_AST.md`](./EPC-06B_AST.md)
- [`EPC-06B_EVALUATOR.md`](./EPC-06B_EVALUATOR.md)
- [`EPC-06B_CERTIFICATION.md`](./EPC-06B_CERTIFICATION.md)
- [`EPC-06A_RULE_ENGINE.md`](./EPC-06A_RULE_ENGINE.md)

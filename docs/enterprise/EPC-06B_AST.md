# EPC-06B — Abstract Syntax Tree (AST)

**Sprint:** EPC-06B — Rule Expression Engine  
**Data:** 31/07/2026  
**Escopo:** Estrutura de nós da linguagem de expressão (sem domínio)

---

## 1. Objetivo

Definir a AST como representação intermediária **agnóstica de domínio** entre o Parser e o Evaluation Runtime.

A AST **não** conhece:

- Regras clínicas
- TISS
- Contratos / Operadoras
- OCR / IA
- Persistence / APIs / UI

---

## 2. Tipos de nó

| `kind` | Papel | Campos |
|--------|-------|--------|
| `literal` | Valor constante | `value: string \| number \| boolean \| null` |
| `path` | Caminho no Evaluation Context | `path: string[]` |
| `unary` | Operador unário | `op: NOT \| EXISTS \| ISNULL`, `argument` |
| `binary` | Operador binário | `op`, `left`, `right` |
| `call` | Função nativa | `name`, `args` |
| `array` | Coleção literal | `elements` |

---

## 3. Operadores na AST

### Binários

`==` · `!=` · `>` · `>=` · `<` · `<=` · `AND` · `OR` · `IN` · `REGEX`

### Unários

`NOT` · `EXISTS` · `ISNULL`

---

## 4. Fluxo

```
expression text
      ↓
Expression Parser
      ↓
AstNode (ParsedExpression)
      ↓
Evaluation Runtime
```

Exemplo:

```ts
parseExpression('user.age >= 18 AND EXISTS user.id')
// →
{
  kind: "binary",
  op: "AND",
  left: { kind: "binary", op: ">=", left: { kind: "path", path: ["user","age"] }, right: { kind: "literal", value: 18 } },
  right: { kind: "unary", op: "EXISTS", argument: { kind: "path", path: ["user","id"] } }
}
```

---

## 5. Localização

- Tipos: `src/lib/enterprise/rule/expression/ast/types.ts`
- Barrel: `src/lib/enterprise/rule/expression/ast/index.ts`

---

## 6. Garantias

- Estrutura apenas — sem avaliação embutida
- Sem tipagem de negócio
- Estável para qualquer produto IAeasy que consuma o Expression Engine

# Regra Permanente do BLOCO C — Operator Capability Model (RULE_07)

**Status:** Vigente a partir da Sprint C-04 (2026-08-04)  
**Escopo:** Todos os Runtimes e Adapters do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md)  
**Documento de arquitetura:** [`C04_OPERATOR_RUNTIME_ARCHITECTURE.md`](./C04_OPERATOR_RUNTIME_ARCHITECTURE.md)

---

## Regra

Nenhuma operadora poderá ser tratada por lógica condicional.

É **EXPRESSAMENTE PROIBIDO** utilizar:

- `if operadora == ...`
- `switch operadora`
- `case operadora`
- qualquer lógica baseada em nomes de operadoras

Cada operadora deverá ser representada exclusivamente por um:

**`OperatorCapabilityProfile`**

---

## Consequências

| Princípio | Aplicação |
|-----------|-----------|
| Nenhuma operadora é conhecida | Ports/Runtimes não conhecem Unimed, Hapvida, Bradesco, SulAmérica, Amil, CASSI, GEAP, IPM nem quaisquer outras |
| Nenhum tratamento especial | Não existe branch, tabela hardcoded ou constante de comportamento por nome |
| Nenhuma lógica condicional | `operatorId` / `displayName` são opacos — nunca usados para ramificar comportamento |
| Especialização futura | Exclusivamente por **Adapters** + **OperatorCapabilityProfile** |

---

## Modelo oficial

```
Operadora futura
  → OperatorCapabilityProfile (contrato canônico)
    → Adapter especializado (futuro)
      → Ports canônicos (OperatorRuntimePort + peers)
```

O restante da plataforma continua trabalhando apenas com **contratos canônicos**.

---

## Limites explícitos (C-04)

Esta regra registra **somente a arquitetura**.

Nesta Sprint e no estado atual do BLOCO C:

- **não existe** operadora implementada;
- **não existe** Adapter de operadora real;
- **não existe** autenticação / autorização funcional;
- **não existe** SOAP / XML / REST funcional;
- existe apenas a **preparação arquitetural** (contratos estruturais / Port / Adapters estruturais / Store / Capability Profile).

Esta Sprint C-04 permanece **exclusivamente estrutural**.

Implementação funcional de operadora **não** faz parte desta Sprint e **não** deve ser introduzida silenciosamente em Sprints de Foundation.

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-04A em diante) devem respeitá-la sem exceção silenciosa.

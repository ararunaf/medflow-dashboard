# C-04 — Enterprise Operator Runtime

**Sprint:** C-04 — Enterprise Operator Runtime Foundation  
**Padrão:** ECS-01  
**Status:** Foundation estrutural  
**Data:** 2026-08-04

---

## Objetivo

Criar oficialmente a Foundation **Enterprise Operator Runtime**, seguindo ECS-01, exclusivamente estrutural.

## Resultado

| Item | Status |
|------|--------|
| `src/lib/enterprise/operator-runtime/` | Criado |
| `OperatorRuntimePort` | Criado |
| Provider `createOperatorRuntimePort` / `getOperatorRuntimePort` | Criado |
| `OperatorRuntimeFactory` | Criada |
| Registry `mock` / `test` / `default` / `enterprise` | Criada |
| Adapters Default / Enterprise / Mock | Criados |
| Store in-memory | Criado |
| `operatorRuntimeOk` no Enterprise Runtime | Integrado |
| `OperatorCapabilityProfile` | Criado |
| `OperatorContext` + RULE_04 | Criado |
| Regra Permanente nº 7 | Documentada |
| Operadoras reais | **Não** |
| Lógica condicional por operadora | **Não** |
| Autenticação / SOAP / XML / REST / banco / APIs | **Não** |

## Fluxo oficial

```
Produto → Enterprise Runtime → OperatorRuntimePort
  → DefaultOperatorRuntimeAdapter / EnterpriseOperatorRuntimeAdapter / MockOperatorRuntimeAdapter
  → InMemoryOperatorRuntimeStore → OperatorCapabilityProfile
```

## Contextos canônicos

- `OperatorContext`
- `OperatorCapabilityProfile`
- `OperatorMetadata`
- `OperatorCapabilities`
- `OperatorFeatures`
- `OperatorRestrictions`
- `OperatorStatus`
- `OperatorHealth`

## Integrações estruturais (shape-check apenas)

SOAP Runtime · XML Runtime · XML Validation Runtime · Quality Runtime · Auto Fill Runtime · TISS Mapping Runtime · Validation Runtime · Audit Runtime

## Regra Permanente nº 7

Ver [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md).

## Teste

```bash
npm run enterprise:operator-runtime:test
```

## Limites

Esta Sprint **não** inicia C-04A. Nenhuma operadora, autenticação, SOAP, XML, REST, banco ou API funcional.

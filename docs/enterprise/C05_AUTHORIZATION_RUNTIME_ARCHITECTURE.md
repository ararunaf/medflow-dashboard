# C-05 — Authorization Runtime Architecture

**Sprint:** C-05 — Enterprise Authorization Runtime Foundation  
**Padrão:** ECS-01  
**Status:** Architecture estrutural  
**Data:** 2026-08-04

---

## Visão

O Enterprise Authorization Runtime é a fundação estrutural para autorização futura
por **estratégias** (AUTHORIZATION STRATEGY PATTERN — Regra Permanente nº 9) e
decisões **policy-driven** (OperatorCapabilityProfile + AuthorizationPolicy).

Não existe autorização funcional nesta Sprint.

## Camadas ECS-01

```
Application / Produto
  → Enterprise Runtime (composition root)
    → AuthorizationRuntimePort
      → Default | Enterprise | Mock AuthorizationRuntimeAdapter
        ← AuthorizationRuntimeFactory ← AuthorizationRuntimeRegistry
        → InMemoryAuthorizationRuntimeStore
          → AuthorizationStrategy / AuthorizationPolicy / AuthorizationContext
```

## AUTHORIZATION STRATEGY PATTERN (RULE_09)

Nenhuma autorização poderá ser implementada diretamente no Runtime.

Toda autorização futura deverá ocorrer por estratégias. O Runtime apenas
seleciona estratégias.

Estratégias previstas (somente contratos):

| StrategyKind | Descrição estrutural |
|--------------|----------------------|
| `synchronous` | Synchronous Authorization |
| `asynchronous` | Asynchronous Authorization |
| `batch` | Batch Authorization |
| `eligibility` | Eligibility Authorization |
| `attachment` | Attachment Authorization |
| `pre-authorization` | Pre Authorization |
| `hybrid` | Hybrid Authorization |

## POLICY-DRIVEN AUTHORIZATION

O Authorization Runtime **nunca** deverá decidir baseado em:

- `if operadora`
- `switch operadora`
- `if versão`
- `if guia`

Toda decisão futura deverá consultar:

```
OperatorCapabilityProfile + AuthorizationPolicy
```

Sem implementação nesta Sprint.

## Observabilidade (RULE_04)

`AuthorizationContext` prevê (somente contrato):

- `operationId`
- `correlationId`
- `startedAt`
- `finishedAt`
- `executionStatus`
- `executionDuration`
- `processedItems`
- `warnings`
- `errors`
- `traceMetadata`

## Capabilities (todas `false`)

- `authorizationImplemented = false`
- `eligibilityImplemented = false`
- `attachmentAuthorizationImplemented = false`
- `batchAuthorizationImplemented = false`
- `statusPollingImplemented = false`
- `preAuthorizationImplemented = false`

## Integrações estruturais

Peers injetados via `AuthorizationRuntimeEnterpriseDeps` (shape-check em `health()` apenas):

- Operator Runtime
- SOAP Runtime
- XML Runtime
- XML Validation Runtime
- Quality Runtime
- Auto Fill Runtime
- Audit Runtime
- Validation Runtime

## Limites explícitos

- **não existe** autorização funcional
- **não existe** elegibilidade
- **não existe** integração com operadoras
- **não existe** comunicação SOAP
- **não existe** XML funcional
- **não existe** autenticação / REST / HTTP / banco / APIs

Somente contratos e arquitetura.

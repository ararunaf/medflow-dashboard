# C-04 — Operator Runtime Architecture

## Visão

```
Produto
  → Enterprise Runtime
    → OperatorRuntimePort
      → DefaultOperatorRuntimeAdapter / EnterpriseOperatorRuntimeAdapter / MockOperatorRuntimeAdapter
        ← OperatorRuntimeFactory ← OperatorRuntimeRegistry
        → InMemoryOperatorRuntimeStore
          → OperatorCapabilityProfile (estrutural)
```

## ECS-01

```
src/lib/enterprise/operator-runtime/
  ports/
  providers/
  factory/
  registry/
  adapters/
  store/
  demo/
  index.ts
```

## Camadas

| Camada | Responsabilidade |
|--------|------------------|
| Port | Contrato único `OperatorRuntimePort` |
| Provider | `createOperatorRuntimePort()` / `getOperatorRuntimePort()` |
| Factory | Materializa adapters por provider id |
| Registry | Catálogo `mock` / `test` / `default` / `enterprise` |
| Adapters | Implementações estruturais do Port |
| Store | Estado in-process (sem persistência) |
| Demo | `getOperatorRuntimeHealthSummary()` |

## Contratos canônicos

`OperatorContext` · `OperatorCapabilityProfile` · `OperatorMetadata` · `OperatorCapabilities` · `OperatorFeatures` · `OperatorRestrictions` · `OperatorStatus` · `OperatorHealth`

Todos com flags `*Implemented: false` onde aplicável.

## OperatorCapabilityProfile (mínimo)

`operatorId` · `displayName` · `supportedTissVersions` · `supportedGuideTypes` · `supportsAuthorization` · `supportsCancellation` · `supportsBatch` · `supportsAttachments` · `supportsAsyncProcessing` · `supportsProtocolQuery` · `supportsEligibility` · `supportsStatusPolling` · `supportedAuthenticationMethods` · `supportedTransportProtocols` · `maxBatchSize` · `maxAttachmentSize` · `supportedFileFormats` · `supportedCharacterEncoding` · `supportedCompression` · `customCapabilities`

Sem implementação funcional. `operatorId` / `displayName` são **opacos** — nunca usados em ramificação condicional.

## Operações estruturais

- `prepareProfile` — perfil canônico estrutural; **não** resolve operadora
- `getProfile` — obtém perfil/resposta estrutural
- `listProfiles` — lista perfis in-memory
- `stats` — estatísticas in-memory
- `health` / `capabilities` / `providerInfo`

## Integração Enterprise

- `getOperatorRuntimePort()`
- `operatorRuntimeOk` em `EnterpriseRuntimeHealth`
- Peers via `enterpriseDeps` com shape-check apenas em `health()`

## Observabilidade (RULE_04)

`OperatorContext` prevê: `operationId` · `correlationId` · `startedAt` · `finishedAt` · `executionStatus` · `executionDuration` · `processedItems` · `warnings` · `errors` · `traceMetadata` — sem implementação funcional.

## Limites explícitos

- não existe operadora implementada
- não existe `if operadora == ...` / `switch operadora`
- não existe autenticação
- não existe SOAP / XML / REST funcional
- não existe HTTP / TLS / certificado
- não existe banco / APIs / filas

## Regra Permanente nº 7 — Operator Capability Model

Documento oficial:
[`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md).

- nenhuma operadora é conhecida;
- nenhuma operadora possui tratamento especial;
- nenhuma lógica condicional existe;
- toda futura especialização ocorrerá exclusivamente por **Adapters** e **Capability Profiles**.

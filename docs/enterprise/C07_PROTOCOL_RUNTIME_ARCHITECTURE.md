# C-07 — Protocol Runtime Architecture

**Sprint:** C-07 — Enterprise Protocol Runtime Foundation  
**Padrão:** ECS-01  
**Status:** Foundation estrutural  
**Data:** 2026-08-04

---

## Visão

O **Enterprise Protocol Runtime** é a fundação estrutural para **Protocol Abstraction** (RULE_12).

Nesta Sprint existem apenas contratos e wiring ECS-01. Nenhum protocolo concreto foi implementado.

## ECS-01

```
src/lib/enterprise/protocol-runtime/
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
| Port | `ProtocolRuntimePort` — contrato único |
| Provider | `createProtocolRuntimePort` / `getProtocolRuntimePort` |
| Factory | `ProtocolRuntimeFactory` |
| Registry | `mock` / `test` / `default` / `enterprise` |
| Adapters | Default / Enterprise (alias) / Mock |
| Store | `ProtocolRuntimeStore` + `InMemoryProtocolRuntimeStore` |
| Demo | Health summary application-layer |

## ProtocolProfile

Contrato canônico de perfil abstrato. Campos mínimos:

`profileId`, `profileName`, `abstractProtocolRef`, `state`, `requiredCapabilities`, `operatorCapabilityProfile`, `metadata`, `tags`, `owner`, `creationTimestamp`

Sem lógica funcional. Sem seleção de protocolo.

## ProtocolResolver

Contrato de resolução futura (PROTOCOL RESOLUTION):

- Entrada futura: `OperatorCapabilityProfile` + `ProtocolCapabilities`
- `protocolResolutionImplemented = false`
- Nenhuma seleção SOAP/REST/gRPC/mensageria

## ProtocolState

Estados canônicos apenas (RULE_11):

`DECLARED` · `PROFILED` · `CAPABLE` · `PENDING_RESOLUTION` · `RESOLVED` · `ACTIVE` · `FAILED` · `DISABLED`

Sem transições funcionais. Sem seleção de protocolo.

## Observabilidade (RULE_04)

`ProtocolContext` prevê:

`operationId`, `correlationId`, `startedAt`, `finishedAt`, `executionStatus`, `executionDuration`, `processedItems`, `warnings`, `errors`, `traceMetadata`

Sem implementação de telemetria.

## Capabilities

Flags literais `false`:

- `soapImplemented`
- `restImplemented`
- `grpcImplemented`
- `messagingImplemented`
- `protocolResolutionImplemented`

## PROTOCOL ABSTRACTION (RULE_12)

- O Runtime **nunca** conhece protocolos concretos
- Proibido `if SOAP` / `if REST` / `if gRPC` / `if RabbitMQ` / `if Kafka` / `if AMQP` / `switch protocolo`
- SOAP será apenas um Adapter
- REST será apenas um Adapter
- gRPC será apenas um Adapter
- Mensageria será apenas um Adapter
- A seleção de protocolo ocorrerá futuramente pelo `ProtocolResolver`

## Integrações estruturais

Peers via `enterpriseDeps` (shape-check em `health()` apenas):

Batch · Authorization · Operator · SOAP · XML · XML Validation

## Composition Root

```
getEnterpriseRuntime().getProtocolRuntimePort()
health.protocolRuntimeOk
```

## Não-objetivos (C-07)

SOAP · REST · gRPC · Mensageria · HTTP · TLS · Autenticação · Banco · APIs · Operadoras · Resolução funcional de protocolos

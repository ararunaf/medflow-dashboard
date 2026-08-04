# C-03 — SOAP Runtime Architecture

## Visão

```
Produto
  → Enterprise Runtime
    → SOAPRuntimePort
      → DefaultSOAPRuntimeAdapter / EnterpriseSOAPRuntimeAdapter / MockSOAPRuntimeAdapter
        ← SOAPRuntimeFactory ← SOAPRuntimeRegistry
        → InMemorySOAPRuntimeStore
          → SOAPResponse (estrutural)
```

## ECS-01

```
src/lib/enterprise/soap-runtime/
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
| Port | Contrato único `SOAPRuntimePort` |
| Provider | `createSOAPRuntimePort()` / `getSOAPRuntimePort()` |
| Factory | Materializa adapters por provider id |
| Registry | Catálogo `mock` / `test` / `default` / `enterprise` |
| Adapters | Implementações estruturais do Port |
| Store | Estado in-process (sem persistência) |
| Demo | `getSOAPRuntimeHealthSummary()` |

## Contratos canônicos

`SOAPContext` · `SOAPRequest` · `SOAPResponse` · `SOAPEnvelope` · `SOAPHeader` · `SOAPBody` · `SOAPFault` · `SOAPCapabilities` · `SOAPStatus` · `SOAPHealth`

Todos com flags `*Implemented: false` onde aplicável.

## Operações estruturais

- `prepare` — resposta canônica estrutural; **não** comunica SOAP / HTTP
- `getResponse` — obtém resposta estrutural; **não** executa comunicação
- `listResponses` — lista respostas in-memory
- `stats` — estatísticas in-memory
- `health` / `capabilities` / `providerInfo`

## Integração Enterprise

- `getSOAPRuntimePort()`
- `soapRuntimeOk` em `EnterpriseRuntimeHealth`
- Peers via `enterpriseDeps` com shape-check apenas em `health()`

## Limites explícitos

Esta arquitetura é **exclusivamente estrutural**:

- não existe comunicação SOAP
- não existe HTTP
- não existe WSDL
- não existe TLS
- não existe certificado digital
- não existe autenticação
- não existe MTOM
- não existe XML funcional
- não existe comunicação de rede
- não existe banco / APIs / filas / mensageria

---

## Regra Permanente nº 5 — Transport Agnostic

Documento oficial:
[`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md).

O SOAP Runtime é **exclusivamente** um encapsulador de transporte.
Demais Runtimes do BLOCO C **não conhecem SOAP**.
Futuros Runtimes de transporte (REST / gRPC / MQ / Event / File Exchange)
não devem alterar Runtimes existentes — especialização por Adapters.

## Regra Permanente nº 6 — Protocol Isolation

Documento oficial:
[`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md).

O SOAP Runtime permanece **genérico**:

- nenhuma operadora é conhecida (Unimed, Hapvida, Bradesco, SulAmérica, Amil, CASSI, GEAP, IPM ou quaisquer outras);
- nenhum endpoint é conhecido;
- nenhum namespace específico é conhecido;
- nenhum protocolo proprietário é conhecido;
- toda especialização ocorrerá exclusivamente por Adapters.

A plataforma continua trabalhando apenas com contratos canônicos.

## Regra Permanente nº 4 — Observability by Design

Documento oficial:
[`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md).

`SOAPContext` prevê por contrato:
`operationId` · `correlationId` · `startedAt` · `finishedAt` · `executionStatus` ·
`executionDuration` · `processedItems` · `warnings` · `errors` · `traceMetadata`.

**Limite explícito:** não existe observabilidade funcional — apenas arquitetura preparada.

## Regras permanentes irmãs

- [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)
- [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)
- [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md)
- [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md)
- [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md)

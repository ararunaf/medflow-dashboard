# Regra Permanente do BLOCO C — Protocol Abstraction (RULE_12)

**Status:** Vigente a partir da Sprint C-07 (2026-08-04)  
**Escopo:** Todos os Runtimes corporativos, Adapters, pipelines e integrações do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_04.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_05.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_06.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_07.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_08.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_08.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_09.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_09.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_10.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_10.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_13.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_13.md)  
**Documento de arquitetura:** [`C07_PROTOCOL_RUNTIME_ARCHITECTURE.md`](./C07_PROTOCOL_RUNTIME_ARCHITECTURE.md)  
**Certificação:** [`C07_PROTOCOL_RUNTIME_CERTIFICATION.md`](./C07_PROTOCOL_RUNTIME_CERTIFICATION.md)

---

## Regra

**PROTOCOL ABSTRACTION**

O **Enterprise Protocol Runtime** nunca poderá conhecer protocolos concretos.

É **expressamente proibido**:

- `if SOAP`
- `if REST`
- `if gRPC`
- `if RabbitMQ`
- `if Kafka`
- `if AMQP`
- `switch protocolo`

Toda comunicação deverá ocorrer através de **contratos canônicos**.

| Protocolo concreto | Papel oficial |
|--------------------|---------------|
| SOAP | Apenas um **Adapter** |
| REST | Apenas um **Adapter** |
| gRPC | Apenas um **Adapter** |
| Mensageria | Apenas um **Adapter** |

Nesta Sprint (C-07) **nenhum protocolo foi implementado**. Foundation estrutural — apenas contratos e wiring ECS-01.

---

## PROTOCOL RESOLUTION

O Runtime **nunca selecionará protocolos diretamente**.

Contratos oficiais (somente declaração nesta Sprint):

| Contrato | Papel |
|----------|-------|
| `ProtocolResolver` | Resolução futura — sem implementação funcional |
| `ProtocolProfile` | Perfil canônico abstrato |
| `ProtocolCapabilities` | Capacidades declaradas (`*Implemented = false`) |

A resolução futura deverá ocorrer utilizando:

```
OperatorCapabilityProfile
+
ProtocolCapabilities
```

Sem qualquer implementação funcional nesta Sprint.

---

## Aplicação ao Enterprise Protocol Runtime

| Conceito | Papel |
|----------|-------|
| Protocol Runtime | Fundação estrutural de abstração |
| `ProtocolProfile` | Contrato canônico de perfil |
| `ProtocolResolver` | Contrato de resolução futura |
| `ProtocolContext` | Envelope operacional (RULE_04) |
| SOAP / REST / gRPC / Mensageria | **Não** implementados — Adapters futuros |
| Seleção de protocolo | **Não** existe nesta Sprint |

### Capabilities explícitas (literais `false`)

```
soapImplemented = false
restImplemented = false
grpcImplemented = false
messagingImplemented = false
protocolResolutionImplemented = false
```

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Abstração antes de transporte | Runtime nunca conhece SOAP/REST/gRPC/mensageria |
| Adapters isolados | Protocolos concretos vivem apenas em Adapters futuros |
| Contratos canônicos | Comunicação via `ProtocolProfile` / `ProtocolResolver` |
| Resolução futura | `OperatorCapabilityProfile` + `ProtocolCapabilities` |
| Sem `if`/`switch` de protocolo | Proibido selecionar protocolo no Runtime |

---

## O que esta regra NÃO é

- Não autoriza implementação SOAP/REST/gRPC/mensageria nesta Sprint
- Não é um cliente HTTP/TLS
- Não é autenticação
- Não é integração com operadoras
- Não implementa resolução funcional de protocolos

---

## Relação com as demais regras

- **RULE_01** — Canonical Contracts: perfis e resolver são contratos canônicos
- **RULE_05** — Transport Agnostic: o Runtime permanece agnóstico ao transporte
- **RULE_06** — Protocol Isolation: protocolos concretos isolados em Adapters
- **RULE_07** — Operator Capability Model: resolução futura usa `OperatorCapabilityProfile`
- **RULE_08** — Capability Negotiation: `ProtocolCapabilities` declara capacidades
- **RULE_11** — State Machine First: estados canônicos de protocolo declarados antes de fluxos
- **RULE_13** — Asynchronous By Design: retornos de integração podem ser assíncronos; o núcleo não presume resposta imediata

---

## Vigência

A partir de **C-07 — Enterprise Protocol Runtime Foundation**, o Protocol Runtime e qualquer Runtime corporativo novo do BLOCO C devem permanecer **agnósticos a protocolos concretos**. A seleção de protocolo ocorrerá futuramente pelo `ProtocolResolver`, nunca por `if`/`switch` no Runtime.

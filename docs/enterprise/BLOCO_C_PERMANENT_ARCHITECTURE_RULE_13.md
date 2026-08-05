# Regra Permanente do BLOCO C — Asynchronous By Design (RULE_13)

**Status:** Vigente a partir da Sprint C-07A (2026-08-04)  
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
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_12.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_12.md)  
**Documento de arquitetura:** [`C07_PROTOCOL_RUNTIME_ARCHITECTURE.md`](./C07_PROTOCOL_RUNTIME_ARCHITECTURE.md)  
**Certificação:** [`C07_PROTOCOL_RUNTIME_FINAL_CERTIFICATION.md`](./C07_PROTOCOL_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

**ASYNCHRONOUS BY DESIGN**

Toda integração corporativa deverá assumir que respostas podem ocorrer de forma **assíncrona**.

É **expressamente proibido** presumir resposta imediata da operadora.

Toda operação futura deverá estar preparada para:

| Cenário | Expectativa oficial |
|---------|---------------------|
| ACK posterior | Confirmação de recebimento pode chegar depois |
| Processamento posterior | A operadora pode processar fora da requisição |
| Retorno posterior | O resultado pode retornar em momento distinto |
| Timeout | Ausência de resposta deve ser tratável |
| Reprocessamento | Operações devem poder ser reexecutadas com segurança |
| Retomada do fluxo | O Workflow interno deve poder continuar/retomar |

Nesta Sprint (C-07A) criar **apenas a documentação** da regra. Nenhuma implementação funcional.

---

## Aplicação ao núcleo corporativo

| Princípio | Aplicação |
|-----------|-----------|
| Núcleo sem dependência síncrona | O núcleo **nunca** dependerá de resposta imediata da operadora |
| Workflow soberano | O Workflow interno permanece soberano (RULE_10) |
| Retornos assíncronos | Retornos poderão ocorrer de forma assíncrona |
| Preparação estrutural | A arquitetura deve suportar ACK, timeout, reprocessamento e retomada |
| Sem implementação nesta Sprint | ACK / timeout / reprocessamento / retomada **não** foram implementados em C-07A |

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Assíncrono por desenho | Integrações corporativas não assumem resposta imediata |
| Núcleo desacoplado | O Runtime núcleo não bloqueia o fluxo na expectativa de retorno síncrono |
| Workflow before integration | Integrações adaptam-se ao Workflow; nunca o contrário |
| Preparação ≠ implementação | Documentar capacidade futura sem entregar ACK/timeout/retry funcional nesta Sprint |
| Idempotência futura | Reprocessamento futuro deve respeitar RULE_03 (Idempotent Runtime) |

---

## O que esta regra NÃO é

- Não implementa ACK funcional
- Não implementa timeout operacional
- Não implementa reprocessamento / retry de integração
- Não implementa retomada de fluxo
- Não autoriza SOAP / REST / gRPC / filas / mensageria nesta Sprint
- Não é comunicação com operadoras
- Não altera Runtime, Ports, Providers, Factory, Registry, Adapters, Store ou Contratos Canônicos

---

## Relação com as demais regras

- **RULE_03** — Idempotent Runtime: reprocessamento futuro exige idempotência
- **RULE_05** — Transport Agnostic: assincronia é independente do transporte
- **RULE_06** — Protocol Isolation: protocolos concretos não mudam a premissa assíncrona
- **RULE_10** — Workflow Before Integration: o Workflow continua soberano diante de retornos posteriores
- **RULE_11** — State Machine First: estados (ACKNOWLEDGED, TIMEOUT, etc.) precedem fluxos funcionais
- **RULE_12** — Protocol Abstraction: a abstração de protocolo permanece independente do timing da resposta

---

## Vigência

A partir de **C-07A — Enterprise Protocol Runtime Gate**, toda integração corporativa do BLOCO C deve ser desenhada sob a premissa **Asynchronous By Design**. Nenhuma funcionalidade de ACK, timeout, reprocessamento ou retomada foi implementada nesta Sprint — apenas a regra permanente foi registrada.

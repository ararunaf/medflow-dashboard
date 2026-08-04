# Regra Permanente do BLOCO C — State Machine First (RULE_11)

**Status:** Vigente a partir da Sprint C-06 (2026-08-04)  
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
**Documento de arquitetura:** [`C06_BATCH_RUNTIME_ARCHITECTURE.md`](./C06_BATCH_RUNTIME_ARCHITECTURE.md)  
**Certificação:** [`C06_BATCH_RUNTIME_CERTIFICATION.md`](./C06_BATCH_RUNTIME_CERTIFICATION.md)

---

## Regra

**STATE MACHINE FIRST**

Todo Runtime corporativo deverá possuir uma **máquina de estados explícita** antes de qualquer implementação funcional.

É **expressamente proibido** implementar fluxos sem estados formalmente definidos.

Nesta Sprint (C-06) criar **apenas contratos**. Foundation estrutural — nenhuma transição funcional implementada. Nenhuma implementação funcional de transições.

---

## Aplicação ao Enterprise Batch Runtime

| Conceito | Papel |
|----------|-------|
| Lote | Unidade transacional corporativa |
| `BatchManifest` | Contrato canônico do lote |
| `BatchStateMachine` | Representa **apenas** os estados canônicos |
| Transições | **Não** implementadas nesta Sprint |
| Processamento em lote | **Não** existe nesta Sprint |

### Estados canônicos (somente declaração)

```
CREATED
VALIDATED
QUEUED
READY_TO_SEND
SENT
ACKNOWLEDGED
PROCESSING
PARTIALLY_COMPLETED
COMPLETED
FAILED
TIMEOUT
CANCELLED
```

Sem implementação. Sem transições funcionais. Sem workers. Sem filas.

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Estados antes de fluxos | Contratos de estado precedem qualquer execução |
| Máquina explícita | Todo Runtime corporativo declara estados canônicos |
| Sem fluxo implícito | Proibido “processar” sem estados formalmente definidos |
| Contratos primeiro | C-06 cria apenas `BatchStateMachine` / `BatchManifest` |
| Sem transições nesta foundation | `transitionsImplemented = false` |

---

## O que esta regra NÃO é

- Não é um motor de workflow funcional
- Não é um scheduler
- Não é uma fila
- Não autoriza processamento em lote
- Não implementa envio para operadoras

---

## Relação com as demais regras

- **RULE_01** — Canonical Contracts: estados e manifesto são contratos canônicos
- **RULE_02** — Deterministic Runtime: estados explícitos evitam fluxos ambíguos
- **RULE_04** — Observability by Design: `BatchContext` prevê envelope operacional
- **RULE_10** — Workflow Before Integration: a máquina de estados reforça soberania do fluxo interno

---

## Vigência

A partir de **C-06 — Enterprise Batch Runtime Foundation**, todo Runtime corporativo novo do BLOCO C deve declarar máquina de estados explícita **antes** de qualquer Sprint funcional.

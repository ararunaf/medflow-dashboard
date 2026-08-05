# Regra Permanente do BLOCO C — Workflow Execution Is Stateless (RULE_19)

**Status:** Vigente a partir da Sprint C-10A (2026-08-05)
**Escopo:** Todos os Runtimes corporativos, Workflow Runtime, Adapters, pipelines e decisões operacionais do BLOCO C — Integração Corporativa
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md)
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_16.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_16.md)
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_17.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_17.md)
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_18.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_18.md)
**Documento de arquitetura:** [`C10_WORKFLOW_RUNTIME_ARCHITECTURE.md`](./C10_WORKFLOW_RUNTIME_ARCHITECTURE.md)
**Certificação:** [`C10_WORKFLOW_RUNTIME_FINAL_CERTIFICATION.md`](./C10_WORKFLOW_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

**WORKFLOW EXECUTION IS STATELESS**

Toda execução do Workflow deverá ser considerada **independente**.

O Workflow Runtime:

- **NÃO** poderá depender de memória interna persistente;
- deverá reconstruir seu contexto utilizando **exclusivamente**:
  - `transactionId`
  - `workflowExecutionId`
  - Canonical Contracts
  - resultados produzidos pelos demais Runtimes;
- deverá ser **reiniciável**;
- deverá permitir **replay** da execução;
- **não** poderá reutilizar estado interno entre execuções.

Nesta Sprint (C-10A) registrar **apenas a arquitetura**. Nenhuma implementação funcional.

---

## Identidades oficiais

| Identidade | Papel |
|------------|-------|
| `transactionId` | Identifica a **transação corporativa** — pode atravessar múltiplos Runtimes e múltiplas execuções de workflow |
| `workflowExecutionId` | Identifica **uma única execução** de workflow — nunca reaproveitado entre execuções, mesmo dentro da mesma `transactionId` |

Cada execução do Workflow é independente. O Runtime reconstrói o contexto a
partir dos contratos canônicos e dos fatos produzidos pelos demais Runtimes —
nunca a partir de estado interno persistente da execução anterior.

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Execução independente | Cada `workflowExecutionId` é um envelope isolado; não herda memória de outra execução |
| Contexto reconstruído | O Runtime reconstrói contexto apenas via `transactionId` + `workflowExecutionId` + Canonical Contracts + resultados dos peers |
| Sem memória interna persistente | Nenhuma dependência de estado interno que sobreviva entre reinícios do processo |
| Reiniciável | Uma execução pode ser retomada/reconstruída a partir dos identificadores e contratos |
| Replay permitido | A mesma execução pode ser reobservada/replayada a partir dos fatos canônicos, sem reutilizar estado interno mutável |
| Sem reuso de estado interno | Estado in-process (se existir em foundation) é auxiliar estrutural, nunca fonte de verdade entre execuções |

---

## Relação com RULE_18

| Regra | Foco |
|-------|------|
| RULE_18 — Workflow Is Pure Orchestration | O Workflow **apenas** coordena; nunca executa lógica especializada |
| RULE_19 — Workflow Execution Is Stateless | Cada execução é **independente**, reiniciável e reconstruída a partir de contratos |

RULE_19 complementa RULE_18: além de ser orquestração pura, a execução do
Workflow não carrega estado interno persistente entre execuções.

---

## O que esta regra NÃO é

- Não implementa Workflow funcional / BPM / decisão automática / execução de runtime
- Não implementa scheduler / workers / filas / banco / APIs
- Não autoriza persistência de estado de execução nesta Sprint
- Não altera Runtime, Ports, Providers, Factory, Registry, Adapters, Store ou Contratos Canônicos
- Não inicia a próxima fase do roadmap

---

## Vigência

A partir de **C-10A — Enterprise Corporate Workflow Runtime Gate**, toda
execução futura do Workflow Runtime no BLOCO C deve ser desenhada sob a premissa
**Workflow Execution Is Stateless**. Nenhuma implementação funcional foi
realizada nesta Sprint — apenas a regra permanente e a certificação de
encerramento do BLOCO C foram registradas.

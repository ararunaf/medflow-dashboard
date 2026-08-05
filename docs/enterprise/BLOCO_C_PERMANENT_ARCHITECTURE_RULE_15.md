# Regra Permanente do BLOCO C — Immutable Transaction History (RULE_15)

**Status:** Vigente a partir da Sprint C-08A (2026-08-04)  
**Escopo:** Todos os Runtimes corporativos, Adapters, pipelines, integrações e históricos transacionais do BLOCO C — Integração Corporativa  
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
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_13.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_13.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md)  
**Documento de arquitetura:** [`C08_RETURN_RUNTIME_ARCHITECTURE.md`](./C08_RETURN_RUNTIME_ARCHITECTURE.md)  
**Certificação:** [`C08_RETURN_RUNTIME_FINAL_CERTIFICATION.md`](./C08_RETURN_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

**IMMUTABLE TRANSACTION HISTORY**

Toda alteração futura de estado deverá ser registrada como um **NOVO EVENTO**.

É **EXPRESSAMENTE PROIBIDO**:

- sobrescrever estados anteriores;
- apagar histórico;
- alterar registros históricos;
- reutilizar eventos anteriores.

O histórico será **APPEND-ONLY**.

Toda transação deverá preservar integralmente sua linha temporal.

Nesta Sprint (C-08A) registrar **apenas a arquitetura**. Nenhuma implementação funcional.

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Append-only | O histórico da transação só cresce; nunca é reescrito |
| Imutabilidade | Nenhuma informação histórica pode ser sobrescrita |
| Novo evento por alteração | Toda mudança de estado gera um novo evento |
| Auditoria por reconstrução | A auditoria reconstrói o histórico a partir da sequência de eventos |
| Linha temporal integral | A transação preserva integralmente sua linha do tempo |
| Sem implementação nesta Sprint | Persistência append-only / event store / audit replay **não** foram implementados em C-08A |

---

## Aplicação futura (arquitetura apenas)

```
Evento N     → estado S_n registrado
Evento N+1   → estado S_{n+1} registrado (N permanece intacto)
Evento N+2   → estado S_{n+2} registrado (N e N+1 permanecem intactos)
    ↓
Auditoria    → reconstrói a linha temporal a partir dos eventos
```

| Conceito | Papel (futuro) |
|----------|----------------|
| Evento de estado | Unidade imutável de alteração |
| Histórico append-only | Sequência ordenada de eventos |
| Auditoria | Reconstrução do histórico a partir dos eventos |
| Sobrescrita / delete / mutate | **Proibidos** |

---

## O que esta regra NÃO é

- Não implementa event store
- Não implementa persistência append-only
- Não implementa replay / reconstrução funcional de auditoria
- Não implementa processamento de retorno / reconciliação / workflow
- Não autoriza atualização de banco / APIs / filas nesta Sprint
- Não altera Runtime, Ports, Providers, Factory, Registry, Adapters, Store ou Contratos Canônicos

---

## Relação com as demais regras

| Regra | Relação |
|-------|---------|
| RULE_03 Idempotent Runtime | Reprocessamento não reescreve histórico — gera novos eventos |
| RULE_04 Observability by Design | Eventos alimentam observabilidade e auditoria |
| RULE_11 State Machine First | Transições futuras materializam-se como novos eventos |
| RULE_13 Asynchronous By Design | Retornos posteriores acrescentam eventos; não sobrescrevem |
| RULE_14 Correlation Before Processing | Correlação e estados posteriores são eventos novos na linha temporal |

---

## Vigência

A partir de **C-08A — Enterprise Return Runtime Gate**, toda alteração futura de estado no BLOCO C deve ser desenhada sob a premissa **Immutable Transaction History (append-only)**. Nenhuma implementação funcional foi realizada nesta Sprint — apenas a regra permanente foi registrada.

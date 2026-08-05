# Regra Permanente do BLOCO C — Decision After Reconciliation (RULE_17)

**Status:** Vigente a partir da Sprint C-09A (2026-08-05)  
**Escopo:** Todos os Runtimes corporativos, Workflow Runtime futuro, Adapters, pipelines e decisões operacionais do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_10.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_10.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_14.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_15.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_15.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_16.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_16.md)  
**Documento de arquitetura:** [`C09_RECONCILIATION_RUNTIME_ARCHITECTURE.md`](./C09_RECONCILIATION_RUNTIME_ARCHITECTURE.md)  
**Certificação:** [`C09_RECONCILIATION_RUNTIME_FINAL_CERTIFICATION.md`](./C09_RECONCILIATION_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

**DECISION AFTER RECONCILIATION**

Toda decisão operacional deverá ocorrer **SOMENTE** após a conclusão formal da
reconciliação.

O Workflow **NÃO** poderá:

- reenviar documentos;
- encerrar processos;
- iniciar faturamento;
- gerar novas autorizações;
- atualizar estados finais;
- executar tratamentos de exceção;

sem existir um **`CanonicalReconciliationResult` válido**.

O **Reconciliation Runtime produz fatos**.

O **Workflow Runtime consome fatos**.

O **Workflow Runtime NÃO produz reconciliação**.

Nesta Sprint (C-09A) registrar **apenas a arquitetura**. Nenhuma implementação funcional.

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Decisão pós-reconciliação | Nenhuma ação operacional final antes de `CanonicalReconciliationResult` válido |
| Separação de responsabilidades | Reconciliation Runtime = produção de fatos; Workflow Runtime = consumo de fatos |
| Workflow não reconcilia | Workflow Runtime nunca produz reconciliação |
| Fato canônico obrigatório | Decisões operacionais exigem resultado canônico formal |
| Sem implementação nesta Sprint | Workflow / decisão operacional / faturamento / reenvio **não** foram implementados em C-09A |

---

## Separação oficial (arquitetura)

```
Reconciliation Runtime
  → produz CanonicalReconciliationResult (fato)
       ↓
Workflow Runtime
  → consome CanonicalReconciliationResult
  → somente então pode decidir ações operacionais
```

| Runtime | Papel |
|---------|-------|
| Reconciliation Runtime | Produz fatos de reconciliação |
| Workflow Runtime | Consome fatos e executa decisões **após** reconciliação |
| Return / Protocol / Batch / Authorization / Operator | Peers estruturais; não substituem o fato canônico |

---

## O que esta regra NÃO é

- Não implementa Workflow Runtime
- Não implementa decisões operacionais
- Não implementa faturamento / reenvio / encerramento de processos
- Não implementa geração de autorizações / tratamentos de exceção
- Não implementa reconciliação funcional / matching / resolução de conflitos
- Não autoriza atualização de banco / APIs / filas nesta Sprint
- Não altera Runtime, Ports, Providers, Factory, Registry, Adapters, Store ou Contratos Canônicos

---

## Relação com as demais regras

| Regra | Relação |
|-------|---------|
| RULE_10 Workflow Before Integration | Workflow governa a orquestração; esta regra define **quando** o Workflow pode decidir |
| RULE_11 State Machine First | Estados finais do Workflow só avançam após fato canônico de reconciliação |
| RULE_14 Correlation Before Processing | Correlação precede processamento; decisão operacional sucede reconciliação |
| RULE_15 Immutable Transaction History | Decisões posteriores são novos eventos; não reescrevem o fato de reconciliação |
| RULE_16 Reconciliation Is Deterministic | O fato consumido pelo Workflow deve ser determinístico e reproduzível |

---

## Vigência

A partir de **C-09A — Enterprise Reconciliation Runtime Gate**, toda decisão
operacional futura no BLOCO C deve ser desenhada sob a premissa
**Decision After Reconciliation**. Nenhuma implementação funcional foi
realizada nesta Sprint — apenas a regra permanente foi registrada.

# Regra Permanente do BLOCO C — Workflow Is Pure Orchestration (RULE_18)

**Status:** Vigente a partir da Sprint C-10 (2026-08-05)
**Escopo:** Todos os Runtimes corporativos, Workflow Runtime, Adapters, pipelines e decisões operacionais do BLOCO C — Integração Corporativa
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_11.md)
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_16.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_16.md)
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_17.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_17.md)
**Documento de arquitetura:** [`C10_WORKFLOW_RUNTIME_ARCHITECTURE.md`](./C10_WORKFLOW_RUNTIME_ARCHITECTURE.md)
**Certificação:** [`C10_WORKFLOW_RUNTIME_CERTIFICATION.md`](./C10_WORKFLOW_RUNTIME_CERTIFICATION.md)

---

## Regra

**WORKFLOW IS PURE ORCHESTRATION**

O **Workflow Runtime** existe exclusivamente para **coordenar** o envelope
estrutural corporativo. Ele **nunca** executa, por si mesmo, qualquer lógica
especializada pertencente a outro Runtime.

O Workflow **apenas** coordena. O Workflow **nunca** executa lógica
especializada. O Workflow **consome** os resultados produzidos pelos demais
Runtimes — nunca os produz.

`workflowExecutionId` é **independente** de `transactionId`: identifica UMA
execução específica de workflow e **nunca** é reaproveitado entre execuções,
mesmo quando múltiplas execuções pertencem à mesma transação.

Nesta Sprint (C-10) **nenhuma implementação funcional foi realizada**. Apenas
a Foundation estrutural (contratos, Port, Adapters, Factory, Registry, Store)
foi criada, seguindo ECS-01.

---

## O que o Workflow PODE fazer

| Ação | Descrição |
|------|-----------|
| Coordenar etapas | Sequenciar/agrupar etapas estruturais declaradas em `WorkflowManifest` / `WorkflowStateMachine` |
| Consumir resultados | Ler `CanonicalReconciliationResult`, `ReturnManifest`, `AuthorizationPolicy`, `OperatorCapabilityProfile`, `BatchManifest`, `ProtocolProfile`, `AuditResult` e referências estruturais de SOAP/XML/XML Validation como **fatos já produzidos** |
| Decidir o próximo Runtime | Apontar (estruturalmente, via `nextRuntimeHint`) qual Runtime deveria atuar em seguida — **sem** disparar essa execução nesta Sprint |
| Controlar o fluxo corporativo | Declarar estados (`CREATED` · `READY` · `WAITING` · `RUNNING` · `PAUSED` · `COMPLETED` · `FAILED` · `CANCELLED`) sem implementar transições |

---

## O que o Workflow NÃO PODE fazer

- **Não** valida XML — essa responsabilidade pertence ao XML Runtime / XML Validation Runtime.
- **Não** reconcilia — essa responsabilidade pertence ao Reconciliation Runtime (RULE_16).
- **Não** autoriza — essa responsabilidade pertence ao Authorization Runtime.
- **Não** gera SOAP — essa responsabilidade pertence ao SOAP Runtime.
- **Não** fala com operadoras — essa responsabilidade pertence ao Operator Runtime.
- **Não** processa lotes (batch) — essa responsabilidade pertence ao Batch Runtime.
- **Não** roda IA — essa responsabilidade pertence ao AI Provider Runtime / AI Orchestration Runtime.
- **Não** implementa regras de domínio — regras de domínio pertencem exclusivamente ao Runtime especializado correspondente.

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Orquestração pura | O Workflow Runtime nunca implementa lógica de domínio de outro Runtime |
| Consumo, não produção | O Workflow Runtime consome fatos (`CanonicalReconciliationResult` e peers); nunca os produz |
| Identidade de execução independente | `workflowExecutionId` nunca é igual/reaproveitado de `transactionId`; cada preparação gera um id novo |
| Estado declarado, sem transição funcional | `WorkflowStateMachine` declara os 8 estados canônicos; nenhuma transição é implementada nesta Sprint |
| Sem implementação nesta Sprint | Nenhum workflow funcional / BPM / decisão automática / execução de runtime foi implementado em C-10 |

---

## Separação oficial (arquitetura)

```
Reconciliation Runtime / Return Runtime / Authorization Runtime /
Operator Runtime / Protocol Runtime / Batch Runtime / SOAP Runtime /
XML Runtime / XML Validation Runtime / Audit Runtime
  → produzem fatos e resultados especializados
       ↓
Workflow Runtime
  → consome os fatos (shape-check estrutural apenas nesta Sprint)
  → coordena o envelope (WorkflowManifest / WorkflowExecution / WorkflowStateMachine)
  → nunca reimplementa a lógica especializada de origem
```

| Runtime | Papel |
|---------|-------|
| Workflow Runtime | Coordena o envelope estrutural; consome fatos; nunca produz reconciliação/autorização/SOAP/XML/lote |
| Reconciliation / Return / Authorization / Operator / Protocol / Batch / SOAP / XML / XML Validation / Audit Runtime | Peers estruturais; produtores dos fatos que o Workflow eventualmente consumirá |

---

## O que esta regra NÃO é

- Não implementa Workflow funcional / BPM / decisão automática / execução de runtime
- Não implementa validação XML, reconciliação, autorização, geração SOAP, integração com operadoras, processamento de lotes ou IA
- Não implementa regras de domínio de qualquer Runtime especializado
- Não autoriza atualização de banco / APIs / filas / workers / scheduler nesta Sprint
- Não altera Runtime, Ports, Providers, Factory, Registry, Adapters, Store ou Contratos Canônicos de outros módulos

---

## Relação com as demais regras

| Regra | Relação |
|-------|---------|
| RULE_11 State Machine First | `WorkflowStateMachine` declara estados antes de qualquer transição |
| RULE_16 Reconciliation Is Deterministic | O Workflow consome `CanonicalReconciliationResult` como fato determinístico já produzido |
| RULE_17 Decision After Reconciliation | O Workflow só pode considerar decisão operacional após `CanonicalReconciliationResult` válido; RULE_18 reforça que, mesmo assim, o Workflow nunca produz esse resultado |

---

## Vigência

A partir de **C-10 — Enterprise Corporate Workflow Runtime Foundation**, toda
orquestração corporativa futura no BLOCO C deve ser desenhada sob a premissa
**Workflow Is Pure Orchestration**. Nenhuma implementação funcional foi
realizada nesta Sprint — apenas a Foundation estrutural e a regra permanente
foram registradas.

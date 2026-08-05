# Regra Permanente do BLOCO C — Correlation Before Processing (RULE_14)

**Status:** Vigente a partir da Sprint C-08 (2026-08-04)  
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
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_13.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_13.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_15.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_15.md)  
**Documento de arquitetura:** [`C08_RETURN_RUNTIME_ARCHITECTURE.md`](./C08_RETURN_RUNTIME_ARCHITECTURE.md)  
**Certificação:** [`C08_RETURN_RUNTIME_CERTIFICATION.md`](./C08_RETURN_RUNTIME_CERTIFICATION.md)  
**Certificação final:** [`C08_RETURN_RUNTIME_FINAL_CERTIFICATION.md`](./C08_RETURN_RUNTIME_FINAL_CERTIFICATION.md)

---

## Regra

**CORRELATION BEFORE PROCESSING**

Nenhum retorno poderá ser processado antes de ser correlacionado com sua transação canônica.

Toda implementação futura deverá obedecer à sequência oficial:

```
Recebimento
    ↓
Correlação
    ↓
Validação
    ↓
Atualização de Estado
    ↓
Workflow
    ↓
Auditoria
```

Nesta Sprint (C-08) criar **apenas contratos**. Nenhuma implementação funcional.

---

## Aplicação ao Enterprise Return Runtime

| Conceito | Papel |
|----------|-------|
| Return Runtime | Fundação estrutural de retornos corporativos |
| `ReturnManifest` | Contrato canônico do retorno |
| `ReturnCorrelation` | Mecanismo de correlação (contrato apenas) |
| `ReturnStateMachine` | Estados apenas — sem transições |
| `ReturnContext` | Envelope operacional (RULE_04) |
| Processamento de retorno | **Não** — proibido antes da correlação |
| Correlação automática | **Não** nesta Sprint |
| Reconciliação | **Não** nesta Sprint |

### Capabilities explícitas (literais `false`)

```
returnProcessingImplemented = false
automaticCorrelationImplemented = false
statusUpdateImplemented = false
reconciliationImplemented = false
workflowIntegrationImplemented = false
```

---

## Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| Correlação antes do processamento | Nenhum retorno é processado sem correlação prévia |
| Transação canônica | Correlação liga o retorno à transação canônica |
| Contratos primeiro | `ReturnManifest` / `ReturnCorrelation` / `ReturnStateMachine` são contratos |
| Preparação ≠ implementação | Documentar sequência futura sem entregar lógica funcional nesta Sprint |
| State Machine First | Estados declarados (RULE_11); sem transições nesta Sprint |

---

## O que esta regra NÃO é

- Não implementa correlação automática
- Não implementa processamento de retorno
- Não implementa reconciliação
- Não autoriza parser XML / SOAP / operadoras nesta Sprint
- Não autoriza atualização de banco / status / workflow nesta Sprint
- Não altera Ports de outros Runtimes além do wiring estrutural do Return Runtime

---

## Relação com as demais regras

| Regra | Relação |
|-------|---------|
| RULE_01 Canonical Contracts | `ReturnManifest` / `ReturnCorrelation` são contratos canônicos |
| RULE_04 Observability by Design | `ReturnContext` prevê envelope estrutural |
| RULE_10 Workflow Before Integration | Workflow ocorre após correlação/validação/estado |
| RULE_11 State Machine First | `ReturnStateMachine` declara estados sem transições |
| RULE_13 Asynchronous By Design | Retornos podem chegar de forma assíncrona |
| RULE_15 Immutable Transaction History | Correlação e estados posteriores são novos eventos (append-only) |

---

## Vigência

Vigente a partir da Sprint **C-08 — Enterprise Return Runtime Foundation** (2026-08-04).  
Obriga todas as implementações futuras de retornos corporativos no BLOCO C.

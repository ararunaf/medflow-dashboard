# ARCH-E01 — Enterprise Business Engine Architecture

**Sprint de entrega:** ARCH-E01 — Enterprise Business Engine Architecture  
**Bloco:** BLOCO E — Enterprise Business Engine  
**Status:** Arquitetura homologada  
**Data:** 2026-08-06  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`  
**Próxima Sprint autorizada (não iniciada):** E-01 — Business Rule Catalog

---

## 1. Objetivos

Projetar a arquitetura oficial da **Enterprise Business Engine**, a camada de lógica de negócio declarativa e executável do sistema.

## 2. Limites

O Bloco E:

- **Faz parte do** `src/lib/enterprise/business-engine/`.
- **Consome** exclusivamente Ports do Bloco D (`XMLValidationRuntimePort`, `XMLRuntimePort`) e do Enterprise Runtime.
- **Não implementa** TISS, ANS, operadoras, contratos, tenants ou workflows específicos.
- **Não altera** o Bloco D.
- **Não é iniciado** nesta Sprint (apenas arquitetura).

## 3. Responsabilidades

| Componente                           | Responsabilidade                              |
| ------------------------------------ | --------------------------------------------- |
| `BusinessRuleCatalog` (E-01)         | Definir, validar e armazenar regras canônicas |
| `BusinessRuleExecutor` (E-02)        | Executar regras sobre fatos canônicos         |
| `BusinessTransactionEngine` (E-03)   | Modelar e executar transações idempotentes    |
| `BusinessWorkflowEngine` (E-04)      | Coordenar estados e atividades simples        |
| `BusinessProcessOrchestrator` (E-05) | Orquestrar atividades, regras e sub-processos |
| `BusinessDecisionTable` (E-06)       | Avaliar tabelas de decisão declarativas       |
| `BusinessEventLog` (E-07)            | Emitir e rotear eventos de negócio            |
| `BusinessAuditTrail` (E-08)          | Registrar trilha de auditoria                 |
| `BusinessReportEngine` (E-09)        | Consolidar relatórios                         |
| `BusinessEngine` (E-10)              | Orquestrar E-01 a E-09                        |

## 4. Capabilities

A capability `EnterpriseBusinessEngineCapabilities` é a matriz canônica de flags:

```ts
interface EnterpriseBusinessEngineCapabilities {
  businessRuleCatalogImplemented: boolean; // E-01
  businessRuleExecutionImplemented: boolean; // E-02
  businessTransactionImplemented: boolean; // E-03
  businessWorkflowImplemented: boolean; // E-04
  businessProcessOrchestrationImplemented: boolean; // E-05
  businessDecisionTableImplemented: boolean; // E-06
  businessEventLogImplemented: boolean; // E-07
  businessAuditTrailImplemented: boolean; // E-08
  businessReportImplemented: boolean; // E-09
  businessEngineImplemented: boolean; // E-10
}
```

## 5. Sequência das Sprints

| Sprint  | Capability                                | Objetivo                              |
| ------- | ----------------------------------------- | ------------------------------------- |
| E-01    | `businessRuleCatalogImplemented`          | Catálogo de regras canônicas          |
| E-02    | `businessRuleExecutionImplemented`        | Execução de regras sobre fatos        |
| E-03    | `businessTransactionImplemented`          | Transações idempotentes               |
| E-04    | `businessWorkflowImplemented`             | Workflows de estados                  |
| E-05    | `businessProcessOrchestrationImplemented` | Orquestração de processos             |
| E-06    | `businessDecisionTableImplemented`        | Tabelas de decisão                    |
| E-07    | `businessEventLogImplemented`             | Eventos de negócio                    |
| E-08    | `businessAuditTrailImplemented`           | Trilha de auditoria                   |
| E-09    | `businessReportImplemented`               | Relatórios consolidados               |
| E-10    | `businessEngineImplemented`               | Engine genérica de orquestração       |
| AUDIT-E | —                                         | Auditoria arquitetural e congelamento |

## 6. Dependências

### 6.1 Internas (Bloco D)

- `CanonicalXMLDocument` / `CanonicalXMLParsingError`
- `XMLValidationRuntimePort` (D-02 a D-11)
- `XMLRuntimePort` (D-01)

### 6.2 Externas

- `EnterpriseRuntime` (wiring e health)
- `InMemoryBusinessEngineStore` (padrão enterprise)
- `DefaultBusinessEngineAdapter` (adapter enterprise oficial)
- `MockBusinessEngineAdapter` (adapter mock/test)

## 7. Critérios de Aceite

### 7.1 Para ARCH-E01

- Documentação de arquitetura publicada.
- Roadmap completo do Bloco E aprovado.
- Regras permanentes definidas.
- Nenhuma alteração funcional.

### 7.2 Para cada E-N

- Uma única capability ativada.
- Todos os gates em PASS.
- Testes dedicados passando.
- Documentação de certificação publicada.

## 8. Regras Permanentes do Bloco E

1. **RP-24:** Sem lógica de TISS/ANS/operadoras/contratos/tenants no core.
2. **RP-25:** Consumo exclusivo via Port.
3. **RP-26:** Uma capability por Sprint.
4. **RP-27:** Sprint final (E-10) apenas orquestra, sem duplicar.
5. **RP-28:** Cada Sprint certificada (E-NR) antes de congelar.

## 9. Critérios para Início do Bloco F

- E-01 a E-10 concluídas e certificadas.
- AUDIT-E executada e aprovada.
- Baseline Oficial do Bloco E congelada.
- Arquitetura do Bloco F aprovada.

## 10. Resultado

**GO — Arquitetura do Bloco E homologada. E-01 autorizada.**

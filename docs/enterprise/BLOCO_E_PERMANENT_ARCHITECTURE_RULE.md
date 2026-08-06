# BLOCO E — Regra Permanente de Arquitetura — Enterprise Business Engine

**Bloco:** BLOCO E — Enterprise Business Engine  
**Status:** E-02 certificada e congelada  
**Próxima Sprint autorizada (não iniciada):** E-03 — Business Transaction  
**Data:** 2026-08-06  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`

---

## 1. Objetivo do Bloco E

O BLOCO E define a **Enterprise Business Engine**, responsável por orquestrar regras de negócio, transações, workflows, processos, decisões, eventos, auditoria e relatórios de forma genérica, vendor-agnostic e sem acoplamento a TISS, ANS, operadoras, contratos, tenants ou workflows específicos.

O Bloco E consome os produtos entregues pelo Bloco D (XML Validation Runtime e XML Parser) e constrói sobre eles uma camada de **lógica de negócio declarativa e executável**, aplicável a qualquer domínio canônico da aplicação.

---

## 2. Princípios Permanentes

### 2.1 Regra Permanente nº 24 — Separação Stricta de Business Logic

A Enterprise Business Engine **nunca** conterá lógica específica de TISS, ANS, operadoras, contratos, tenants ou workflows de domínio. Qualquer regra específica deve ser carregada externamente como configuração canônica.

### 2.2 Regra Permanente nº 25 — Consumo Exclusivo via Port

O Bloco E expõe suas capacidades exclusivamente por Ports. Nenhum produto externo pode importar implementações concretas (Adapters, Stores, Engines) do Bloco E. O acesso é feito somente via `EnterpriseBusinessEnginePort`.

### 2.3 Regra Permanente nº 26 — Incremental Functional Evolution

Cada Sprint do Bloco E ativa **exatamente uma** nova capability. As Sprints anteriores permanecem íntegras e homologadas. A matriz de capabilities `EnterpriseBusinessEngineCapabilities` reflete a sequência E-01 a E-10.

### 2.4 Regra Permanente nº 27 — Orquestração sem Duplicação

A Sprint final (E-10) atua apenas como orquestradora das capabilities E-01 a E-09. Não pode reimplementar lógica já entregue pelas Sprints anteriores.

### 2.5 Regra Permanente nº 28 — Release Baseline Certification

Cada Sprint E-N deve concluir com uma Sprint E-NR de certificação. A Baseline Oficial é congelada somente após todos os gates em PASS e aprovação administrativa.

---

## 3. Responsabilidades

A Enterprise Business Engine é responsável por:

1. **Catálogo de Regras (E-01):** definir, validar e armazenar regras de negócio canônicas.
2. **Execução de Regras (E-02):** executar regras sobre fatos canônicos e produzir resultados estruturais.
3. **Transações (E-03):** modelar e executar transações de negócio idempotentes e atômicas.
4. **Workflows (E-04):** definir e executar fluxos de estados simples entre atividades.
5. **Orquestração de Processos (E-05):** coordenar múltiplas atividades, regras e sub-processos.
6. **Tabelas de Decisão (E-06):** avaliar matrizes de decisão declarativas.
7. **Eventos (E-07):** emitir e consumir eventos de negócio canônicos.
8. **Auditoria (E-08):** registrar trilha de auditoria das ações da engine.
9. **Relatórios (E-09):** consolidar relatórios de execução e auditoria.
10. **Engine Genérica (E-10):** orquestrar E-01 a E-09 via `EnterpriseBusinessEnginePort`.

---

## 4. Dependências do Bloco D

| Dependência                          | Fonte   | Uso                                                    |
| ------------------------------------ | ------- | ------------------------------------------------------ |
| `XMLParser` (D-01)                   | Bloco D | Parse de dados/parâmetros em XML quando necessário     |
| `XMLValidationRuntime` (D-02 a D-11) | Bloco D | Validar payloads canônicos antes da execução de regras |
| `CanonicalXMLDocument`               | Bloco D | Modelo canônico de entrada/saída                       |
| `EnterpriseRuntime`                  | Bloco C | Wiring e health do runtime enterprise                  |

---

## 5. Roadmap

| Sprint   | Sprint de certificação | Capability                                | Nome oficial                                                | Status                    |
| -------- | ---------------------- | ----------------------------------------- | ----------------------------------------------------------- | ------------------------- |
| ARCH-E01 | ARCH-E01-A             | —                                         | Enterprise Business Engine Architecture                     | Concluída / certificada   |
| E-01     | E-01R                  | `businessRuleCatalogImplemented`          | Enterprise Business Engine — Business Rule Catalog          | Concluída / certificada   |
| E-02     | E-02R                  | `businessRuleExecutionImplemented`        | Enterprise Business Engine — Business Rule Execution        | Concluída / certificada   |
| E-03     | E-03R                  | `businessTransactionImplemented`          | Enterprise Business Engine — Business Transaction           | Autorizada (não iniciada) |
| E-04     | E-04R                  | `businessWorkflowImplemented`             | Enterprise Business Engine — Business Workflow              | Planejada                 |
| E-05     | E-05R                  | `businessProcessOrchestrationImplemented` | Enterprise Business Engine — Business Process Orchestration | Planejada                 |
| E-06     | E-06R                  | `businessDecisionTableImplemented`        | Enterprise Business Engine — Business Decision Table        | Planejada                 |
| E-07     | E-07R                  | `businessEventLogImplemented`             | Enterprise Business Engine — Business Event Log             | Planejada                 |
| E-08     | E-08R                  | `businessAuditTrailImplemented`           | Enterprise Business Engine — Business Audit Trail           | Planejada                 |
| E-09     | E-09R                  | `businessReportImplemented`               | Enterprise Business Engine — Business Report                | Planejada                 |
| E-10     | E-10R                  | `businessEngineImplemented`               | Enterprise Business Engine — Generic Business Engine        | Planejada                 |
| AUDIT-E  | AUDIT-E-R              | —                                         | Enterprise Block E Architecture Audit                       | Planejada                 |

---

## 6. Critérios de Entrada e Saída

### 6.1 Entrada de cada Sprint E-N

- Baseline da Sprint anterior homologada e congelada.
- Arquitetura do Bloco E aprovada (ARCH-E01).
- Capacidade a ser implementada é a próxima da matriz.
- Nenhuma capability futura antecipada.

### 6.2 Saída de cada Sprint E-NR

- Todos os gates em PASS.
- Working Tree limpa.
- Commit e push realizados.
- Capacidade ativada na matriz `EnterpriseBusinessEngineCapabilities`.
- Testes específicos da Sprint passando.
- Documentação de certificação publicada.

---

## 7. Regras de Evolução

- Cada Sprint implementa **uma única capability**.
- Nenhum código pode referenciar TISS, ANS, operadoras, contratos, tenants ou workflows.
- Toda regra específica é representada por configuração canônica.
- Adapters e Engines reutilizam Ports estabelecidos.
- Testes devem evidenciar a capability sem duplicar lógica de testes anteriores.

---

## 8. Critérios para Início do Bloco F

O Bloco F poderá ser autorizado apenas após:

1. Conclusão e certificação de E-01 a E-10.
2. Execução e aprovação da AUDIT-E.
3. Baseline Oficial do Bloco E congelada.
4. Definição aprovada da arquitetura do Bloco F.

---

## 9. O que esta regra NÃO é

- Não é uma especificação técnica de cada Sprint (detalhes em documentos dedicados).
- Não autoriza iniciar a próxima Sprint dentro da Sprint de arquitetura.
- Não altera código, testes, banco, infraestrutura ou comportamento.
- Não substitui as Regras Permanentes 1–23.

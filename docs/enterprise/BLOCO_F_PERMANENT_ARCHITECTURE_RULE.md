# BLOCO F — Regra Permanente de Arquitetura — Enterprise Integration Engine

**Bloco:** BLOCO F — Enterprise Integration Engine  
**Status:** Bloco F auditado, certificado e congelado; AUDIT-F concluída  
**Data:** 2026-08-06  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`

---

## 1. Objetivo do Bloco F

O BLOCO F define a **Enterprise Integration Engine**, responsável por conectar, transformar, validar, rotear e monitorar dados entre os motores Enterprise de forma genérica, vendor-agnostic e sem acoplamento a TISS, ANS, operadoras, convênios, contratos, clínicas, tenants ou workflows específicos.

O Bloco F consome os produtos entregues pelo Bloco E (Enterprise Business Engine) e pelo Bloco D (XML Validation Runtime) para criar uma camada de **integração declarativa e executável** entre as capacidades canônicas da aplicação.

---

## 2. Princípios Permanentes

### 2.1 Regra Permanente nº 29 — Genéricidade Estrita

A Enterprise Integration Engine **nunca** conterá lógica específica de domínio. Qualquer mapeamento, transformação, validação, roteamento ou monitoramento específico deve ser carregado externamente como configuração canônica.

### 2.2 Regra Permanente nº 30 — Consumo Exclusivo via Port

O Bloco F expõe suas capacidades exclusivamente por Ports. Nenhum produto externo pode importar implementações concretas (Adapters, Stores, Engines) do Bloco F. O acesso é feito somente via `EnterpriseIntegrationEnginePort`.

### 2.3 Regra Permanente nº 31 — Incremental Functional Evolution

Cada Sprint do Bloco F ativa **exatamente uma** nova capability. As Sprints anteriores permanecem íntegras e homologadas. A matriz de capabilities `EnterpriseIntegrationEngineCapabilities` reflete a sequência F-01 a F-10.

### 2.4 Regra Permanente nº 32 — Orquestração sem Duplicação

A Sprint final (F-10) atua apenas como orquestradora das capabilities F-01 a F-09. Não pode reimplementar lógica já entregue pelas Sprints anteriores.

### 2.5 Regra Permanente nº 33 — Reutilização Obrigatória

Todo engine F-N deve reutilizar os engines F-1 a F-(N-1) e, quando necessário, as capacidades canônicas do Bloco E. Nenhuma lógica de integração pode ser duplicada entre engines.

---

## 3. Responsabilidades

A Enterprise Integration Engine é responsável por:

1. **Integration Registry (F-01):** registrar e catalogar conectores, pipelines e endpoints disponíveis.
2. **Integration Connector (F-02):** abstrair a conexão com origens e destinos externos.
3. **Integration Pipeline (F-03):** modelar e executar fluxos de integração declarativos.
4. **Integration Mapping Engine (F-04):** mapear campos e estruturas entre modelos canônicos.
5. **Integration Transformation Engine (F-05):** transformar payloads canônicos entre formatos e representações.
6. **Integration Validation Engine (F-06):** validar integrações contra regras canônicas e schemas.
7. **Integration Routing Engine (F-07):** decidir o destino de uma mensagem com base em regras declarativas.
8. **Integration Monitoring Engine (F-08):** capturar e expor métricas e eventos de integração.
9. **Integration Report Engine (F-09):** consolidar relatórios de execução e monitoramento.
10. **Generic Integration Engine (F-10):** orquestrar F-01 a F-09 via `EnterpriseIntegrationEnginePort`.

---

## 4. Dependências Permitidas

| Dependência                      | Fonte   | Uso                                                   |
| -------------------------------- | ------- | ----------------------------------------------------- |
| `BusinessEnginePort` (Bloco E)   | Bloco E | Orquestrar regras, validações e relatórios de negócio |
| `XMLValidationRuntime` (Bloco D) | Bloco D | Validar payloads estruturais e XML                    |
| `EnterpriseRuntime` (Bloco C)    | Bloco C | Wiring e health do runtime enterprise                 |

O Bloco F **não** pode importar diretamente Adapters, Stores ou implementações concretas dos Blocos D ou E. O acesso deve ocorrer exclusivamente via Ports.

---

## 5. Roadmap

| Sprint   | Sprint de certificação | Capability                             | Nome oficial                                                      | Status                  |
| -------- | ---------------------- | -------------------------------------- | ----------------------------------------------------------------- | ----------------------- |
| ARCH-F01 | ARCH-F01-A             | —                                      | Enterprise Integration Engine Architecture                        | Concluída / homologada  |
| F-01     | F-01R                  | `integrationRegistryImplemented`       | Enterprise Integration Engine — Integration Registry              | Concluída / certificada |
| F-02     | F-02R                  | `integrationConnectorImplemented`      | Enterprise Integration Engine — Integration Connector             | Concluída / certificada |
| F-03     | F-03R                  | `integrationPipelineImplemented`       | Enterprise Integration Engine — Integration Pipeline              | Concluída / certificada |
| F-04     | F-04R                  | `integrationMappingImplemented`        | Enterprise Integration Engine — Integration Mapping Engine        | Concluída / certificada |
| F-05     | F-05R                  | `integrationTransformationImplemented` | Enterprise Integration Engine — Integration Transformation Engine | Concluída / certificada |
| F-06     | F-06R                  | `integrationValidationImplemented`     | Enterprise Integration Engine — Integration Validation Engine     | Concluída / certificada |
| F-07     | F-07R                  | `integrationRoutingImplemented`        | Enterprise Integration Engine — Integration Routing Engine        | Concluída / certificada |
| F-08     | F-08R                  | `integrationMonitoringImplemented`     | Enterprise Integration Engine — Integration Monitoring Engine     | Concluída / certificada |
| F-09     | F-09R                  | `integrationReportImplemented`         | Enterprise Integration Engine — Integration Report Engine         | Concluída / certificada |
| F-10     | F-10R                  | `integrationEngineImplemented`         | Enterprise Integration Engine — Generic Integration Engine        | Concluída / certificada |
| AUDIT-F  | AUDIT-F-R              | —                                      | Enterprise Integration Engine — Architecture Audit                | Concluída / certificada |

---

## 6. Interfaces Públicas

A superfície pública do Bloco F é composta por:

- `EnterpriseIntegrationEnginePort` — contrato único de integração.
- `EnterpriseIntegrationEngineCapabilities` — matriz progressiva de capabilities.
- `IntegrationEngineRegistry` — registro de providers e adapters.
- `createIntegrationEnginePort` — factory oficial.
- Modelos canônicos de `IntegrationEndpoint`, `IntegrationPipeline`, `IntegrationMapping`, `IntegrationTransformation`, `IntegrationValidation`, `IntegrationRoute`, `IntegrationMonitoring`, `IntegrationReport`.

Nenhuma implementação concreta (Adapter, Store, Engine) é pública.

---

## 7. Canonical Models

O Bloco F opera com os seguintes modelos canônicos genéricos:

- `CanonicalIntegrationEndpoint`
- `CanonicalIntegrationPipeline`
- `CanonicalIntegrationMapping`
- `CanonicalIntegrationTransformation`
- `CanonicalIntegrationValidation`
- `CanonicalIntegrationRoute`
- `CanonicalIntegrationMonitoring`
- `CanonicalIntegrationReport`

Cada modelo é estrutural e não contém regras específicas de domínio.

---

## 8. Regras de Evolução

- Cada Sprint implementa **uma única capability**.
- Nenhum código pode referenciar TISS, ANS, operadoras, convênios, contratos, clínicas, tenants ou workflows.
- Todo mapeamento, transformação, validação ou roteamento específico é representado por configuração canônica.
- Adapters e Engines reutilizam Ports estabelecidos.
- Testes devem evidenciar a capability sem duplicar lógica de testes anteriores.

---

## 9. Critérios para Início de F-01

A Sprint F-01 poderá iniciar apenas após:

1. Homologação da arquitetura ARCH-F01.
2. Aprovação desta Regra Permanente.
3. Baseline do Bloco E congelada.

---

## 10. O que esta regra NÃO é

- Não é uma especificação técnica de cada Sprint (detalhes em documentos dedicados).
- Não altera código, testes, banco, infraestrutura ou comportamento.
- Não substitui as Regras Permanentes 1–28.

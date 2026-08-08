# BLOCO H — Regra Permanente de Arquitetura — TISS Enterprise Integration

**Bloco:** BLOCO H — TISS Enterprise Integration  
**Status:** ARCH-H01 Concluída / Não iniciado  
**Data:** 2026-08-07  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`

---

## 1. Objetivo do Bloco H

O BLOCO H define a **TISS Enterprise Integration**, responsável por integrar o sistema com operadoras de saúde por meio do padrão TISS (Troca de Informações em Saúde Suplementar) de forma declarativa, versionada e desacoplada dos demais domínios.

O Bloco H consome os produtos entregues pelo Bloco G (TISS Enterprise) para obter mensagens, configurações e validações TISS canônicas, e pelo Bloco F (Enterprise Integration Engine) para transporte, transformação, roteamento e adaptação de protocolos.

---

## 2. Princípios Permanentes

### 2.1 Regra Permanente nº H01 — Integração TISS Contida no Bloco H

Toda lógica de integração TISS com operadoras (comunicação, SOAP, autenticação, envio, lote, retorno, status, retentativa e auditoria) estará exclusivamente no Bloco H. Nenhum outro bloco poderá conter lógica de integração TISS específica.

### 2.2 Regra Permanente nº H02 — Consumo Exclusivo via Port

O Bloco H expõe suas capacidades exclusivamente por Ports. Nenhum produto externo pode importar implementações concretas (Adapters, Stores, Engines) do Bloco H. O acesso é feito somente via `TISSIntegrationPort`.

### 2.3 Regra Permanente nº H03 — Incremental Functional Evolution

Cada Sprint do Bloco H ativa **exatamente uma** nova capability. As Sprints anteriores permanecem íntegras e homologadas. A matriz de capabilities `TISSIntegrationCapabilities` reflete a sequência H-01 a H-10.

### 2.4 Regra Permanente nº H04 — Orquestração sem Duplicação

A Sprint final (H-10) atua apenas como orquestradora das capabilities H-01 a H-09. Não pode reimplementar lógica já entregue pelas Sprints anteriores.

### 2.5 Regra Permanente nº H05 — Reutilização Obrigatória

Todo engine H-N deve reutilizar os engines H-1 a H-(N-1) e, quando necessário, as capacidades canônicas dos Blocos F e G. Nenhuma lógica de integração TISS pode ser duplicada entre engines.

### 2.6 Regra Permanente nº H06 — Conhecimento Canônico

Toda regra de operadora, endpoint, credencial, protocolo, formato de retorno e configuração de comunicação deve ser carregada externamente como conhecimento canônico. Nenhum dado de integração TISS pode ser hardcoded em engines, adapters ou ports.

### 2.7 Regra Permanente nº H07 — TISS Viagem pelo Bloco G

Toda mensagem TISS (envio ou retorno) deve ser processada pelo Bloco G antes de ser transmitida/recebida por qualquer conector do Bloco H. O Bloco H nunca lê, interpreta, valida ou corrige conteúdo TISS diretamente.

---

## 3. Responsabilidades

A TISS Enterprise Integration é responsável por:

1. **TISS Communication (H-01):** estabelecimento e gerenciamento de canais de comunicação com operadoras.
2. **TISS SOAP (H-02):** tratamento de envelopes e contratos SOAP TISS.
3. **TISS Authentication (H-03):** autenticação e renovação de credenciais junto às operadoras.
4. **TISS Submission (H-04):** envio unitário de mensagens TISS às operadoras.
5. **TISS Batch (H-05):** agrupamento, envio e controle de lotes TISS.
6. **TISS Return Processing (H-06):** recebimento e processamento inicial de retornos de operadoras.
7. **TISS Status Tracking (H-07):** acompanhamento de status de envios, lotes e retornos.
8. **TISS Retry (H-08):** estratégias de retentativa, backoff e resiliência.
9. **TISS Audit (H-09):** registro, rastreabilidade e auditoria de integrações.
10. **TISS Integration Engine (H-10):** orquestrar H-01 a H-09 via `TISSIntegrationPort`.

---

## 4. Dependências Permitidas

| Dependência                   | Fonte   | Uso                                           |
| ----------------------------- | ------- | --------------------------------------------- |
| `TISSEnterprisePort` (Bloco G) | Bloco G | Mensagens, configurações e validações TISS    |
| `IntegrationEnginePort` (Bloco F) | Bloco F | Transporte, transformação, roteamento, adaptação |
| `BusinessEnginePort` (Bloco E) | Bloco E | Orquestrar regras declarativas, quando necessário |
| `EnterpriseRuntime` (Bloco C) | Bloco C | Wiring e health do runtime enterprise         |

O Bloco H **não** pode importar diretamente Adapters, Stores ou implementações concretas dos Blocos C, D, E, F ou G. O acesso deve ocorrer exclusivamente via Ports.

---

## 5. Roadmap

| Sprint   | Sprint de certificação | Capability                            | Nome oficial                                    | Status               |
| -------- | ---------------------- | ------------------------------------- | ----------------------------------------------- | -------------------- |
| ARCH-H01 | ARCH-H01-A             | —                                     | TISS Integration Architecture                   | Concluída            |
| H-01     | H-01R                  | `tissCommunicationImplemented`        | TISS Enterprise — Communication Engine          | Concluída / certificada |
| H-02     | H-02R                  | `tissSoapImplemented`                 | TISS Enterprise — SOAP Engine                   | Concluída / certificada |
| H-03     | H-03R                  | `tissAuthenticationImplemented`       | TISS Enterprise — Authentication Engine         | Concluída / certificada |
| H-04     | H-04R                  | `tissSubmissionImplemented`           | TISS Enterprise — Submission Engine             | Concluída / certificada |
| H-05     | H-05R                  | `tissBatchImplemented`                | TISS Enterprise — Batch Engine                  | Concluída / certificada |
| H-06     | H-06R                  | `tissReturnProcessingImplemented`     | TISS Enterprise — Return Processing Engine      | Autorizada (não iniciada) |
| H-07     | H-07R                  | `tissStatusTrackingImplemented`       | TISS Enterprise — Status Tracking Engine        | Planejada            |
| H-08     | H-08R                  | `tissRetryImplemented`                | TISS Enterprise — Retry Engine                  | Planejada            |
| H-09     | H-09R                  | `tissAuditImplemented`                | TISS Enterprise — Audit Engine                  | Planejada            |
| H-10     | H-10R                  | `tissIntegrationEngineImplemented`    | TISS Enterprise — Generic TISS Integration Engine | Planejada            |
| AUDIT-H  | AUDIT-H-R              | —                                     | TISS Integration — Architecture Audit           | Não iniciada         |

---

## 6. Interfaces Públicas

A superfície pública do Bloco H será composta por:

- `TISSIntegrationPort` — contrato único de TISS Enterprise Integration.
- `TISSIntegrationCapabilities` — matriz progressiva de capabilities.
- `TISSIntegrationRegistry` — registro de providers e adapters.
- `createTISSIntegrationPort` — factory oficial.
- Modelos canônicos de `TISSIntegrationContext`, `TISSOperatorEndpoint`, `TISSBatch`, `TISSSubmission`, `TISSReturn`, `TISSStatus` e `TISSAuditLog`.

Nenhuma implementação concreta (Adapter, Store, Engine) será pública.

---

## 7. Canonical Models

O Bloco H operará com os seguintes modelos canônicos:

- `CanonicalTISSIntegrationContext`
- `CanonicalTISSOperatorEndpoint`
- `CanonicalTISSBatch`
- `CanonicalTISSSubmission`
- `CanonicalTISSReturn`
- `CanonicalTISSStatus`
- `CanonicalTISSRetryPolicy`
- `CanonicalTISSAuditLog`

Nenhum desses modelos será implementado nesta Sprint ARCH-H01.

---

## 8. Baseline

- **Baseline atingida:** ARCH-H01.
- **H-01 autorizada, mas não iniciada.**
- **Nenhuma capability ativada.**
- **Nenhuma implementação funcional criada.**

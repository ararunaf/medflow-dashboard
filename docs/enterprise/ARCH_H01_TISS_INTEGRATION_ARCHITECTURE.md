# ARCH-H01 — TISS Integration Architecture

**Sprint de entrega:** ARCH-H01 — TISS Integration Architecture  
**Bloco:** BLOCO H — TISS Enterprise Integration  
**Status:** Arquitetura homologada  
**Data:** 2026-08-07  
**Branch:** `feat/inf-10-enterprise-scalability-runtime`  
**Repositório:** `https://github.com/ararunaf/medflow-dashboard.git`  
**Próxima Sprint autorizada (não iniciada):** H-01 — TISS Communication Engine

---

## 1. Objetivos

Projetar a arquitetura oficial do **TISS Enterprise Integration**, a camada responsável pela integração corporativa TISS com operadoras de saúde.

O Bloco H orquestra a troca de mensagens TISS com operadoras por meio de protocolos de comunicação, autenticação, envio, lote, retorno, acompanhamento de status, retentativa e auditoria — tudo sem acoplar regras de negócio ou conhecimento específico de TISS, delegando essas responsabilidades ao Bloco G (TISS Enterprise).

## 2. Limites

O Bloco H:

- **Faz parte do** `src/lib/enterprise/tiss-integration/` (ainda não criado nesta Sprint).
- **Consome** exclusivamente Ports do Bloco G (`TISSEnterprisePort`) para obter mensagens, configurações e validações TISS canônicas.
- **Consome** exclusivamente Ports do Bloco F (`EnterpriseIntegrationEnginePort`) para transporte, transformação, roteamento e adaptação de protocolos.
- **Implementa** conectores, autenticadores e gerenciadores de ciclo de vida de integração TISS com operadoras.
- **Não altera** os Blocos D, E, F ou G.
- **Não é iniciado** nesta Sprint (apenas arquitetura).
- **Não cria** código funcional, classes, interfaces, testes ou mocks nesta Sprint.

## 3. Responsabilidades

| Componente                                  | Responsabilidade                                              |
| ------------------------------------------- | ------------------------------------------------------------- |
| `TISSCommunicationEngine` (H-01)            | Estabelecimento de canais de comunicação com operadoras       |
| `TISSSoapEngine` (H-02)                     | Tratamento de envelopes e protocolos SOAP TISS                |
| `TISSAuthenticationEngine` (H-03)           | Autenticação e gestão de credenciais junto às operadoras      |
| `TISSSubmissionEngine` (H-04)               | Envio unitário de mensagens TISS às operadoras                |
| `TISSBatchEngine` (H-05)                    | Agrupamento, envio e controle de lotes de mensagens TISS      |
| `TISSReturnProcessingEngine` (H-06)         | Recebimento e processamento de retornos de operadoras         |
| `TISSStatusTrackingEngine` (H-07)           | Acompanhamento de status de protocolos e mensagens TISS       |
| `TISSRetryEngine` (H-08)                    | Estratégias de retentativa e resiliência de integração        |
| `TISSAuditEngine` (H-09)                    | Registro e auditoria das integrações TISS realizadas          |
| `TISSIntegrationEngine` (H-10)              | Orquestração de H-01 a H-09 via port único                    |

## 4. Capabilities

A capability `TISSIntegrationCapabilities` é a matriz canônica de flags:

```ts
interface TISSIntegrationCapabilities {
  tissCommunicationImplemented: boolean; // H-01
  tissSoapImplemented: boolean; // H-02
  tissAuthenticationImplemented: boolean; // H-03
  tissSubmissionImplemented: boolean; // H-04
  tissBatchImplemented: boolean; // H-05
  tissReturnProcessingImplemented: boolean; // H-06
  tissStatusTrackingImplemented: boolean; // H-07
  tissRetryImplemented: boolean; // H-08
  tissAuditImplemented: boolean; // H-09
  tissIntegrationEngineImplemented: boolean; // H-10
}
```

Todas as capabilities encontram-se **desabilitadas** na ARCH-H01. Apenas uma será ativada por Sprint funcional.

## 5. Sequência das Sprints

| Sprint   | Capability                            | Objetivo                                            |
| -------- | ------------------------------------- | --------------------------------------------------- |
| H-01     | `tissCommunicationImplemented`        | Canais de comunicação com operadoras                |
| H-02     | `tissSoapImplemented`                 | Tratamento SOAP TISS                                |
| H-03     | `tissAuthenticationImplemented`       | Autenticação com operadoras                         |
| H-04     | `tissSubmissionImplemented`           | Envio de mensagens TISS                             |
| H-05     | `tissBatchImplemented`                | Envio de lotes TISS                                 |
| H-06     | `tissReturnProcessingImplemented`     | Processamento de retornos                           |
| H-07     | `tissStatusTrackingImplemented`       | Acompanhamento de status                            |
| H-08     | `tissRetryImplemented`                | Retentativa e resiliência                           |
| H-09     | `tissAuditImplemented`                | Auditoria de integrações                            |
| H-10     | `tissIntegrationEngineImplemented`    | Engine genérica de integração TISS                  |
| AUDIT-H  | —                                     | Auditoria arquitetural e congelamento               |

## 6. Dependências

### 6.1 Internas

- `TISSEnterprisePort` (Bloco G) — acesso a conhecimento, mensagens e validações TISS.
- `EnterpriseIntegrationEnginePort` (Bloco F) — transporte, transformação, roteamento e adaptação de protocolos.
- `EnterpriseBusinessEnginePort` (Bloco E) — orquestração declarativa de regras, quando necessário.

### 6.2 Externas

- `EnterpriseRuntime` (wiring e health)
- `DefaultTISSIntegrationAdapter` (adapter enterprise oficial, futuro)
- `MockTISSIntegrationAdapter` (adapter mock/test, futuro)
- `TISSIntegrationRegistry` (registro de providers e adapters, futuro)

## 7. Critérios de Aceite

### 7.1 Para ARCH-H01

- Documentação de arquitetura publicada.
- Roadmap completo do Bloco H aprovado.
- Regras permanentes definidas.
- Nenhuma alteração funcional.
- Nenhuma capability ativada.

### 7.2 Para cada H-N

- Uma única capability ativada.
- Todos os gates em PASS.
- Testes dedicados passando.
- Documentação de certificação publicada.

## 8. Regras Permanentes do Bloco H

1. **RP-H01:** TISS Integration somente no Bloco H — nenhum outro bloco conterá lógica de integração TISS com operadoras.
2. **RP-H02:** Consumo exclusivo via `TISSIntegrationPort`.
3. **RP-H03:** Uma capability por Sprint.
4. **RP-H04:** Sprint final (H-10) apenas orquestra, sem duplicar.
5. **RP-H05:** Cada Sprint certificada (H-NR) antes de congelar.
6. **RP-H06:** Integrações são declarativas e configuráveis, nunca hardcoded por operadora.
7. **RP-H07:** Toda mensagem TISS enviada ou recebida passa pelo Bloco G antes de ser transmitida.

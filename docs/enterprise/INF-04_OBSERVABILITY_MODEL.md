# INF-04 — Observability Model

**Sprint:** INF-04 — Observability Foundation  
**Data:** 01/08/2026  
**Baseline:** `medicflow-enterprise-foundation-v1.0.0`

---

## Modelos canônicos (8)

| Modelo | Kind | Propósito |
|--------|------|-----------|
| `CanonicalObservation` | `canonical-observation` | Aggregate raiz da Observation estrutural |
| `CanonicalObservationIdentity` | `canonical-observation-identity` | Identidade opaca (`executionObservabilityId`) |
| `CanonicalObservationMetadata` | `canonical-observation-metadata` | Metadata/status estrutural (sem telemetria) |
| `CanonicalObservationConfiguration` | `canonical-observation-configuration` | Configuração estrutural do contrato |
| `CanonicalObservationCapabilities` | `canonical-observation-capabilities` | Capacidades declaradas (com negações) |
| `CanonicalObservationStatistics` | `canonical-observation-statistics` | Contadores in-memory |
| `CanonicalObservationHealth` | `canonical-observation-health` | Saúde estrutural do store |
| `CanonicalObservationReference` | `canonical-observation-reference` | Referências opacas anexadas |

---

## Identidade canônica

- Campo anexo ao Execution Context: `executionObservabilityId`
- Prefixo de ID: `execution-observability-NNNN`
- Helper: `createExecutionObservabilityId()`

---

## Metadata estrutural

Valores possíveis:

- `structural`
- `registered-structural`
- `unregistered-structural`
- `unknown`

Flags literais de negação (sempre `false`):

- `loggingPerformed`
- `metricsCollected`
- `tracingPerformed`
- `eventsTransmitted`
- `externalIntegrationUsed`
- `processingPerformed`

---

## Integração estrutural

- Conhece exclusivamente `ExecutionSchedulerPort` (INF-03)
- Referência opaca: `executionSchedulerId`
- Sem acesso a adapters/stores concretos do Scheduler

---

## Consumidores estruturais futuros

Referências apenas (sem integração):

1. OCR Pipeline
2. IA
3. Rule Engine
4. Workflow
5. TISS
6. Importação
7. Auditoria

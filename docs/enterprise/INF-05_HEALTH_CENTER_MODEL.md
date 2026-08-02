# INF-05 — Health Center Model

**Sprint:** INF-05 — Health Center Foundation  
**Padrão:** ECS-01  
**Data:** 01/08/2026

---

## 1. Modelos canônicos (8)

| Modelo | Kind | Papel |
|--------|------|-------|
| `CanonicalHealthComponent` | `canonical-health-component` | Aggregate raiz — cadastro estrutural |
| `CanonicalHealthComponentIdentity` | `canonical-health-component-identity` | Identidade opaca |
| `CanonicalHealthComponentStatus` | `canonical-health-component-status` | Status estrutural |
| `CanonicalHealthComponentCapabilities` | `canonical-health-component-capabilities` | Capacidades / negações |
| `CanonicalHealthComponentStatistics` | `canonical-health-component-statistics` | Contagens in-memory |
| `CanonicalHealthComponentHealth` | `canonical-health-component-health` | Saúde estrutural do store |
| `CanonicalHealthComponentConfiguration` | `canonical-health-component-configuration` | Configuração opaca |
| `CanonicalHealthComponentReference` | `canonical-health-component-reference` | Referências opacas |

---

## 2. Identificadores

| ID | Formato | Uso |
|----|---------|-----|
| `executionHealthCenterId` | `execution-health-center-NNNN` | Anexado ao Execution Context |
| `healthComponentId` | `health-component-NNNN` | Identifica um componente no store |

---

## 3. Flags de negação (obrigatórias)

Todos os modelos e resultados declaram literalmente:

- `monitoringPerformed: false`
- `healthCheckPerformed: false`
- `probingPerformed: false`
- `diagnosticsExecuted: false`
- `pollingPerformed: false`
- `dashboardRendered: false`
- `externalQueryPerformed: false`
- `componentConsulted: false`
- `realHealthBackend: false`
- `enginesInvoked: false`
- `processingPerformed: false`
- `persistenceImplemented: false`
- `databaseUsed: false`

---

## 4. Catálogo estrutural

`STRUCTURAL_MONITORABLE_COMPONENT_CATALOG` — 12 entradas:

1. message-queue  
2. worker-foundation  
3. scheduler-foundation  
4. observability-foundation  
5. ocr  
6. ia  
7. rule-engine  
8. workflow  
9. tiss  
10. storage  
11. database  
12. importacao  

Nenhum item é monitorado nesta sprint.

---

## 5. Integração Observability

Campo opaco `executionObservabilityId` + contrato `observabilityPortContract: "ExecutionObservabilityPort"`.

Capability: `usesExecutionObservabilityPortOnly: true`.

Observations **nunca** são consultadas.

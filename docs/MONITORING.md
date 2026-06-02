# Monitoramento MedFlow-IA

Estrutura de observabilidade de **erros e eventos de segurança** (distinto de observabilidade operacional de produto em `lib/observability/` e `lib/operational-observability/`).

## Pilares

| Pilar | Canal | API | Persistência |
|--------|--------|-----|----------------|
| **Runtime** | `runtime` | `logRuntime` | Console `[medflow_monitor]` |
| **SSR** | `ssr` | `logSsr` / `logSsrAndAudit` | Console + `security_audit_logs` |
| **Auth** | `auth` | `logAuth` / `logAuthAndAudit` | Console + `security_audit_logs` |
| **Error tracking** | todos via `emitMonitor` | sinks | Console + vendor opcional (DSN) |

O manifesto de touchpoints está em `src/lib/monitoring/registry.ts` (`MONITORING_REGISTRY`).

## Layout

```
src/lib/monitoring/
├── index.ts              # API pública
├── types.ts              # MonitorChannel, MonitorPayload, MonitorSink
├── emit.ts               # emitMonitor, registerMonitorSink
├── normalize.ts
├── registry.ts           # touchpoints por pilar (validação CI)
├── client-bootstrap.ts   # window.error, unhandledrejection
├── server-bootstrap.ts   # sinks no worker/SSR
├── channels/
│   ├── runtime.ts
│   ├── ssr.ts
│   ├── auth.ts
│   └── client.ts
└── sinks/
    ├── index.ts          # bootstrapDefaultMonitorSinks
    ├── console.ts        # [medflow_monitor] JSON
    └── error-tracker.ts  # opcional — MEDFLOW_* / VITE_* DSN
```

## Wiring

### Runtime

- `src/lib/error-capture.ts` — listeners globais + `consumeLastCapturedError()` para SSR catastrófico
- `src/server.ts` — importa `./lib/error-capture` no topo

### SSR

- `src/start.ts` — middleware `ssr_middleware_error`
- `src/server.ts` — `ssr_catastrophic`, `ssr_worker_uncaught`

### Auth

- `src/lib/auth/get-auth-context.ts` — `get_user_failed`
- `src/server.ts` — `login_page_rate_limited`
- `src/lib/errors/create-query-client.ts` — erros classificados como auth

### Error tracking (client + sinks)

- `initClientErrorMonitoring()` em `routes/__root.tsx`
- `GlobalErrorBoundary`, route `errorComponent`, React Query `onError`
- Sinks: sempre `console`; com DSN, `error-tracker` (substituir corpo por SDK)

## Variáveis de ambiente

| Variável | Escopo | Efeito |
|----------|--------|--------|
| `VITE_MEDFLOW_DEBUG=1` | build | emite níveis debug/info |
| `VITE_MEDFLOW_ERROR_TRACKING_DSN` | client + bundle | ativa sink error-tracker |
| `MEDFLOW_ERROR_TRACKING_DSN` | server/worker | ativa sink error-tracker no SSR |

## Validação

```bash
npm run monitoring-validate
```

Checagens:

1. Estrutura de arquivos e canais
2. Wiring em `server.ts`, `start.ts`, `__root.tsx`, auth, error-capture
3. Touchpoints do `MONITORING_REGISTRY`
4. Teste comportamental de `emitMonitor` (vite-node)

Relacionados: `npm run error-handling-validate`, `npm run security-logs-validate`.

## Estender (Sentry / OpenTelemetry)

1. Implementar envio em `sinks/error-tracker.ts` (ou `sinks/sentry.ts`)
2. Registrar com `registerMonitorSink()` — nunca quebrar o app (try/catch em `emit.ts`)
3. Manter auditoria de auth/SSR em `security_audit_logs` (não misturar com incidentes operacionais)

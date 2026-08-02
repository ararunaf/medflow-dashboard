# DIP-02 — Capture Engine Runtime

**Sprint:** DIP-02 — Capture Engine Runtime  
**Data:** 02/08/2026  
**Natureza:** Segundo componente funcional da Document Intelligence Platform — **sem mudança de comportamento do produto**  
**Baseline:** ARCH-01 · DIP-01 · EPC-12 · EPC-24 · ECS-01  
**Continuidade:** Captura oficial integrada ao Enterprise Runtime via Capture Engine

---

## 1. Objetivo

Transformar o Capture Engine em componente Enterprise oficialmente integrado ao Runtime, mantendo a funcionalidade existente idêntica.

```
Produto
  ↓
Enterprise Runtime
  ↓
CaptureEngineRuntimePort
  ↓
Canonical Execution Orchestrator
  ↓
DocumentIntakeRuntime
  ↓
DocumentIntakePort
  ↓
Adapter
  ↓
Implementação existente
```

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| Módulo Capture Engine Runtime | `src/lib/enterprise/capture-engine-runtime/` |
| Port | `CaptureEngineRuntimePort` |
| Default Adapter | `DefaultCaptureEngineRuntimeAdapter` |
| Mock Adapter | `MockCaptureEngineRuntimeAdapter` |
| Store | `InMemoryCaptureEngineRuntimeStore` |
| Factory | `CaptureEngineRuntimeFactory` |
| Provider | `createCaptureEngineRuntimePort` |
| Integração Runtime | `DefaultEnterpriseRuntime.registerCaptureDocumentIntake` |
| Bridge produto (superfície inalterada) | `src/lib/capture/enterprise/register-capture-intake.ts` |
| Suite de testes | `scripts/enterprise/tests/capture-engine-runtime-engine.test.ts` |
| Script npm | `enterprise:capture-engine-runtime:test` |

---

## 3. O que NÃO foi implementado

- OCR
- IA
- Parser XML
- Classificação documental
- Rule Engine
- Workflow
- TISS
- Storage Manager
- Versionamento
- Busca
- Migrations
- Mudança de UI / APIs / comportamento de Captura

---

## 4. Superfície do Port

| Método | Função |
|--------|--------|
| `health()` | Prontidão (store + Orchestrator + DocumentIntakeRuntime) |
| `capabilities()` | Capacidades estáticas do adapter |
| `registerCapture(request)` | Registro canônico via Orchestrator + DocumentIntakeRuntime |
| `getSession(input)` | Obtém sessão de captura |
| `listSessions(input?)` | Lista sessões estruturais |

---

## 5. Providers suportados

| Provider | Adapter | Notas |
|----------|---------|-------|
| `default` | `DefaultCaptureEngineRuntimeAdapter` | Exige `enterpriseDeps` |
| `mock` | `MockCaptureEngineRuntimeAdapter` | Testes / isolamento |
| `test` | `MockCaptureEngineRuntimeAdapter` | Alias de teste |

---

## 6. Integração com o produto

Fluxo oficial de upload de Captura (superfície inalterada):

1. UI / HTTP / Server Function realiza upload (comportamento existente).
2. Após sucesso, `registerCaptureDocumentIntakeBridge` chama `getEnterpriseRuntime().registerCaptureDocumentIntake(...)`.
3. Enterprise Runtime delega a `CaptureEngineRuntimePort.registerCapture` com modelos canônicos.
4. Capture Engine Runtime coordena Orchestrator → DocumentIntakeRuntime → DocumentIntakePort.
5. Falhas são best-effort (`ok: false` / engolidas no bridge) — Captura permanece válida.

---

## 7. Critério de sucesso

O Capture Engine Runtime é o componente oficial de captura da Document Intelligence Platform, utilizando exclusivamente Enterprise Runtime + Canonical Execution Orchestrator + Document Intake Runtime + DocumentIntakePort, sem implementação paralela e sem regressão de produto.

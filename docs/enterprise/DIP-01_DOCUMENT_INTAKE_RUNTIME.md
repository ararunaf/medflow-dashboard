# DIP-01 — Document Intake Runtime

**Sprint:** DIP-01 — Document Intake Runtime  
**Data:** 02/08/2026  
**Natureza:** Primeiro componente funcional da Document Intelligence Platform — **sem mudança de comportamento do produto**  
**Baseline:** ARCH-01 (Enterprise Runtime) · EPC-12 (DocumentIntakePort) · EPC-24 (Canonical Execution Orchestrator) · ECS-01  
**Continuidade:** Ponto único de entrada documental da plataforma Enterprise

---

## 1. Objetivo

Transformar o Document Intake em componente funcional oficial da Document Intelligence Platform, integrado exclusivamente ao Enterprise Runtime.

```
Produto
  ↓
Enterprise Runtime
  ↓
DocumentIntakeRuntimePort
  ↓
Canonical Execution Orchestrator
  ↓
DocumentIntakePort
  ↓
Adapter
  ↓
Implementação
```

---

## 2. O que foi entregue

| Artefato | Caminho |
|----------|---------|
| Módulo Document Intake Runtime | `src/lib/enterprise/document-intake-runtime/` |
| Port | `DocumentIntakeRuntimePort` |
| Default Adapter | `DefaultDocumentIntakeRuntimeAdapter` |
| Mock Adapter | `MockDocumentIntakeRuntimeAdapter` |
| Store | `InMemoryDocumentIntakeRuntimeStore` |
| Factory | `DocumentIntakeRuntimeFactory` |
| Provider | `createDocumentIntakeRuntimePort` |
| Integração Runtime | `DefaultEnterpriseRuntime.registerCaptureDocumentIntake` |
| Bridge produto (inalterado) | `src/lib/capture/enterprise/register-capture-intake.ts` |
| Suite de testes | `scripts/enterprise/tests/document-intake-runtime-engine.test.ts` |
| Script npm | `enterprise:document-intake-runtime:test` |

---

## 3. O que NÃO foi implementado

- OCR
- IA
- XML / TISS
- Parser
- Classificação documental
- Workflow novo
- Rule Engine novo
- Migrations
- Mudança de UI / APIs / comportamento de Captura

---

## 4. Superfície do Port

| Método | Função |
|--------|--------|
| `health()` | Prontidão (store + Orchestrator + DocumentIntakePort) |
| `capabilities()` | Capacidades estáticas do adapter |
| `registerIntake(request)` | Registro canônico via Orchestrator + DocumentIntakePort |
| `getSession(input)` | Obtém sessão de runtime |
| `listSessions(input?)` | Lista sessões estruturais |

---

## 5. Providers suportados

| Provider | Adapter | Notas |
|----------|---------|-------|
| `default` | `DefaultDocumentIntakeRuntimeAdapter` | Exige `enterpriseDeps` |
| `mock` | `MockDocumentIntakeRuntimeAdapter` | Testes / isolamento |
| `test` | `MockDocumentIntakeRuntimeAdapter` | Alias de teste |

---

## 6. Integração com o produto

Fluxo oficial de upload de Captura (inalterado na superfície):

1. UI / HTTP / Server Function realiza upload (comportamento existente).
2. Após sucesso, `registerCaptureDocumentIntakeBridge` chama `getEnterpriseRuntime().registerCaptureDocumentIntake(...)`.
3. Enterprise Runtime delega a `DocumentIntakeRuntimePort.registerIntake` com modelos canônicos.
4. Document Intake Runtime coordena Orchestrator → DocumentIntakePort.
5. Falhas são best-effort (`ok: false` / engolidas no bridge) — Captura permanece válida.

---

## 7. Critério de sucesso

O Document Intake Runtime é o primeiro componente funcional da Document Intelligence Platform, utilizando exclusivamente Enterprise Runtime + Canonical Execution Orchestrator + DocumentIntakePort, sem implementação paralela e sem regressão de produto.

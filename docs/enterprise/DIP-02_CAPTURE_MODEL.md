# DIP-02 — Capture Model

**Sprint:** DIP-02 — Capture Engine Runtime  
**Escopo:** Modelos canônicos estruturais — sem semântica clínica/OCR/TISS

---

## 1. Modelos canônicos

| Modelo | `kind` | Função |
|--------|--------|--------|
| `CanonicalCaptureIdentity` | `canonical-capture-identity` | Identidade opaca do documento |
| `CanonicalCaptureMetadata` | `canonical-capture-metadata` | Sessão, tenant, canal, tags |
| `CanonicalCaptureReference` | `canonical-capture-reference` | Referências opacas (storage/intake/exec) |
| `CanonicalCaptureCapabilities` | `canonical-capture-capabilities` | Capacidades declaradas (domínio) |
| `CanonicalCaptureConfiguration` | `canonical-capture-configuration` | Config estrutural (source/channel) |
| `CanonicalCaptureRequest` | `canonical-capture-request` | Pedido de registro |
| `CanonicalCaptureSession` | `canonical-capture-session` | Sessão de runtime |
| `CanonicalCaptureResult` | `canonical-capture-result` | Resultado do registro |

---

## 2. Status da sessão

```
pending → coordinating → registering → registered
                                   ↘ failed
```

| Status | Significado |
|--------|-------------|
| `pending` | Sessão criada no store |
| `coordinating` | Orchestrator em andamento |
| `registering` | DocumentIntakeRuntime em andamento |
| `registered` | Intake canônico registrado |
| `failed` | Falha estrutural (sem retry de negócio) |

---

## 3. Relação com DIP-01

O Capture Engine **não** reimplementa intake. Delega a `DocumentIntakeRuntimePort.registerIntake` com `CanonicalDocumentIntakeRequest`.

Campos de ligação na sessão de captura:

- `intakeId` — id do DocumentIntakePort
- `executionId` — execução do Orchestrator (nível captura)
- `intakeRuntimeSessionId` — sessão do Document Intake Runtime
- `intakeExecutionId` — execução do Orchestrator (nível intake DIP-01)

---

## 4. Capacidades do Port (adapter)

Flags fixas `false` (garantia de não-escopo):

- `implementsOcr`
- `implementsAi`
- `implementsXml`
- `implementsTiss`
- `implementsParser`
- `implementsClassification`
- `implementsWorkflow`
- `implementsRuleEngine`
- `implementsStorageManager`
- `implementsVersioning`
- `implementsSearch`

Flags `true` no adapter default:

- `usesEnterpriseRuntimePorts`
- `usesCanonicalExecutionOrchestrator`
- `usesDocumentIntakeRuntime`
- `usesDocumentIntakePort`

# EPC-12 — Document Intake Architecture

**Sprint:** EPC-12 — Document Intake Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-12_DOCUMENT_INTAKE_FOUNDATION.md`](./EPC-12_DOCUMENT_INTAKE_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌──────────────────────────────────────────────────┐
│ Application (PoC: getDocumentIntakeHealthSummary)│
└──────────────────────┬───────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│ DocumentIntakePort                               │
│  createIntake | getIntake | listIntakes          │
│  health | capabilities                           │
└──────────────────────┬───────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│ Adapters                                         │
│  DefaultDocumentIntakeAdapter                    │
│  MockDocumentIntakeAdapter                       │
└──────────────────────┬───────────────────────────┘
                       ↓
┌──────────────────────────────────────────────────┐
│ DocumentIntakeStore (DefaultDocumentIntakeStore) │
│  in-process Map — sem banco                      │
└──────────────────────────────────────────────────┘

Factory (DocumentIntakeFactory) ← Provider (createDocumentIntakePort)
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Providers

| ProviderId | Adapter | Estado |
|------------|---------|--------|
| `default` | `DefaultDocumentIntakeAdapter` | Implementado |
| `mock` | `MockDocumentIntakeAdapter` | Implementado |
| `test` | `MockDocumentIntakeAdapter` | Implementado |
| `database` | — | Reservado (erro explícito) |
| `remote` | — | Reservado (erro explícito) |
| `registry` | — | Reservado (erro explícito) |

---

## 3. Fronteiras

| Pode | Não pode |
|------|----------|
| Criar / obter / listar intakes canônicos | Interpretar documentos |
| Declarar `SourceType` | Executar OCR / parser |
| Ciclo de vida estrutural (rótulos) | Upload / watcher / scanner / e-mail reais |
| Refs opacas a Identity / Storage / Metadata / Workflow / Config | Validar contratos / TISS |
| Health / capabilities | Conhecer domínio clínico |
| PoC Application | Tocar UI / APIs / DB |

---

## 4. Integração futura (FASE 9) — apenas documentação

Nenhum dos componentes abaixo é implementado ou acoplado nesta sprint.

### 4.1 Document Identity

- Intake declara `documentIdentityReference.documentId` (opaco).
- Application futura resolve via `DocumentIdentityPort.getDocument` / `createDocument`.
- Document Intake **não** importa Document Identity Core nesta fundação.
- Versionamento de conteúdo permanece no Identity (`version` opaco na ref).

### 4.2 Storage

- `storageReference` aponta chave / container / provider / uri opacos.
- Application futura resolve via Storage Port (EPC-02).
- Intake **não** realiza I/O de arquivos.

### 4.3 OCR Providers

- Futuro: Application orquestra Intake → Storage → OCR Provider Port.
- Intake pode carregar prep via `customAttributes` / `IntakeOpaqueReference` (`kind: "ocr-provider"`).
- Intake **nunca** chama OCR. OCR **nunca** vive dentro do Intake.

### 4.4 AI Providers

- Futuro: Application orquestra Intake → Document Identity → AI Provider Port.
- Prep via referência opaca (`kind: "ai-provider"`).
- Intake **não** conhece modelos, prompts ou providers de IA.

### 4.5 Workflow

- Intake declara `workflowReference.workflowId` (opaco).
- Orquestração de etapas fica na Application / Workflow Engine.
- Intake **não** conhece estados de workflow clínico.

### 4.6 Rule Engine

- Intake **não** referencia Rule Packs nesta fundação.
- Regras permanecem fora do Intake; Application futura pode correlacionar após Identity / Metadata.

### 4.7 Contract Foundation

- Futuro: Application pode correlacionar Intake → Document Identity → Contract (refs opacas).
- Prep via `IntakeOpaqueReference` (`kind: "contract"`) em `customAttributes`.
- Intake **não** valida contratos e **não** importa ContractPort.

### 4.8 Configuration / Metadata

- `configurationReference` / `metadataReference` apontam artefatos opacos.
- Bind e validação cruzada ficam fora desta sprint.

---

## 5. Fluxo futuro (ilustrativo — não implementado)

```
[Origem física: upload / pasta / e-mail / scanner / API]
        ↓ (futuro — fora de EPC-12)
DocumentIntakePort.createIntake({ sourceType, refs… })
        ↓
Document Identity (registrar documento canônico)
        ↓
Storage (persistir bytes)
        ↓
OCR Providers (opcional)
        ↓
AI Providers (opcional)
        ↓
Workflow / Rule Engine / Contract Foundation
```

EPC-12 cobre **somente** a caixa `DocumentIntakePort` + modelo + adapters in-memory.

---

## 6. Garantias ECS-01

- Port único (`DocumentIntakePort`)
- Adapters intercambiáveis (`default` / `mock` / `test`)
- Store interno ao adapter (não exposto ao Domain)
- Factory + Provider para inversão de dependência
- Sem banco, sem migrations, sem UI, sem APIs de produto
- Sem fallback silencioso para providers futuros

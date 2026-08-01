# EPC-11 — Contract Architecture

**Sprint:** EPC-11 — Contract Foundation  
**Data:** 31/07/2026  
**Documento pai:** [`EPC-11_CONTRACT_FOUNDATION.md`](./EPC-11_CONTRACT_FOUNDATION.md)

---

## 1. Camadas (ECS-01)

```
┌─────────────────────────────────────────────┐
│ Application (PoC: getContractHealthSummary) │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│ ContractPort                                │
│  createContract | getContract | listContracts│
│  health | capabilities                      │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│ Adapters                                    │
│  DefaultContractAdapter                     │
│  MockContractAdapter                        │
└──────────────────────┬──────────────────────┘
                       ↓
┌─────────────────────────────────────────────┐
│ ContractStore (DefaultContractStore)        │
│  in-process Map — sem banco                 │
└─────────────────────────────────────────────┘

Factory (ContractFactory) ← Provider (createContractPort)
```

Application e Domain dependem **somente** do Port.  
Adapters / Store / Factory nunca vazam para Domain de produto.

---

## 2. Providers

| ProviderId | Adapter | Estado |
|------------|---------|--------|
| `default` | `DefaultContractAdapter` | Implementado |
| `mock` | `MockContractAdapter` | Implementado |
| `test` | `MockContractAdapter` | Implementado |
| `database` | — | Reservado (erro explícito) |
| `remote` | — | Reservado (erro explícito) |
| `registry` | — | Reservado (erro explícito) |

---

## 3. Fronteiras

| Pode | Não pode |
|------|----------|
| Criar / obter / listar contratos canônicos | Validar contratos |
| Declarar refs opacas | Executar regras |
| Versionamento estrutural (rótulos) | Publicar / rollback operacional |
| Anexos como metadados | OCR / parsing |
| Health / capabilities | Conhecer TISS / operadoras |
| PoC Application | Tocar UI / APIs / DB |

---

## 4. Integração futura (FASE 9) — apenas documentação

Nenhum dos componentes abaixo é implementado ou acoplado nesta sprint.

### 4.1 Rule Packs

- Contrato declara `rulePackReferences` (`packId` opaco).
- Application futura resolve via `RulePackPort.getPack` / `listPacks`.
- Contract **não** chama `RulePackPort` nesta fundação.
- Contract **não** contém regras; packs permanecem o contêiner de regras.

### 4.2 Workflow

- Contrato declara `workflowReferences` (`workflowId` opaco).
- Orquestração de etapas fica na Application / Workflow Engine.
- Contract **não** conhece estados de workflow clínico.

### 4.3 Metadata

- `metadataReference` aponta opcionalmente a schema / namespace do Metadata Engine.
- Sem validação cruzada nesta sprint.

### 4.4 Configuration

- `configurationReference` aponta flags / hierarquia por ambiente.
- Configuration Engine permanece independente; bind é externo.

### 4.5 Document Identity

- Anexos podem carregar `documentIdentityReference.documentId` (opaco).
- Application futura resolve via `DocumentIdentityPort`.
- Contract **não** importa Document Identity Core.

### 4.6 AI Auditor

- Auditor futuro recebe `contractId` + refs opacas como contexto.
- Nenhuma chamada a AI Provider nesta sprint.
- Prep: payload estrutural apenas.

### 4.7 OCR Foundation

- OCR futuro pode produzir Document Identity / anexos referenciados pelo contrato.
- Contract **não** conhece OCR, parsers ou TISS.
- TISS permanece fora (EPC-14).

```
                    ┌──────────────┐
                    │  Application │
                    └──────┬───────┘
           ┌───────────────┼───────────────────┐
           ↓               ↓                   ↓
     ContractPort    RulePackPort         WorkflowPort
           │               │                   │
           │         refs opacas               │
           └───────────────┴───────────────────┘
                    (orquestração futura)

     MetadataPort · ConfigurationPort · DocumentIdentityPort · AI Provider
                    (bind externo futuro — não nesta sprint)
```

### 4.8 Cadeia canônica

```
Contract
  → MetadataReference
  → RulePackReferences
  → WorkflowReferences
  → ConfigurationReference
  → Resultado (futuro)
```

Nunca: Contrato → Regras → Execução.

---

## 5. Compatibilidade

- Nenhum fluxo de usuário usa `ContractPort` nesta sprint.
- Capture / OCR / TISS / Financeiro / Auth / Settings permanecem intactos.
- Nenhuma migration. Nenhum schema SQL.

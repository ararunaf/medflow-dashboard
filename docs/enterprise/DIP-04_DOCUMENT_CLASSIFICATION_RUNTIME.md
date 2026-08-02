# DIP-04 — Document Classification Runtime

**Sprint:** DIP-04 — Document Classification Runtime  
**Plataforma:** MedicFlow Enterprise — Document Intelligence Platform  
**Padrão:** ECS-01 (Port / Adapter / Store / Factory / Provider)  
**Composition root:** Enterprise Runtime (ARCH-01)

---

## 1. Objetivo

Criar a infraestrutura oficial do Document Classification Runtime da plataforma Enterprise.

Toda futura classificação documental deverá obrigatoriamente utilizar esta infraestrutura.
Nenhum Classification Provider poderá ser acessado diretamente pelo produto.

---

## 2. Escopo (estrutural apenas)

### Inclui

- Módulo `src/lib/enterprise/document-classification-runtime/`
- `DocumentClassificationRuntimePort`, adapters default/mock, store in-memory, factory, provider
- Modelos canônicos de classificação documental
- Capabilities tecnológicas registradas como FALSE / informativas
- Referências estruturais a Classification Providers futuros (AI, Rule Based, ML, Hybrid, Mock)
- Integração com Enterprise Runtime, Capture Engine Runtime, OCR Runtime e Canonical Execution Orchestrator
- Migração estrutural do fluxo oficial de captura para passar pelo Classification Runtime
- Suite `enterprise:document-classification-runtime:test`
- Documentação DIP-04

### Explicitamente fora de escopo

- Classificação documental real
- IA / LLM / embeddings / Machine Learning
- OCR para classificação
- Regras de negócio / heurísticas / identificação automática de tipos
- Conexão com Classification Providers externos
- Qualquer serviço externo / HTTP / credenciais
- Mudança de comportamento de produto, UI, API ou migrations

---

## 3. Fluxo oficial

```
Produto
  ↓
Enterprise Runtime
  ↓
Capture Engine Runtime
  ↓
OCR Runtime
  ↓
DocumentClassificationRuntimePort
  ↓
Canonical Execution Orchestrator
  ↓
Classification Provider Adapter (referência estrutural)
  ↓
Provider futuro (referência apenas)
```

---

## 4. Componentes

| Artefato | Responsabilidade |
|----------|------------------|
| `DocumentClassificationRuntimePort` | Contrato único de coordenação de classificação |
| `DefaultDocumentClassificationRuntimeAdapter` | Bridge Orchestrator + OCR Runtime + Provider Adapter reference |
| `MockDocumentClassificationRuntimeAdapter` | Homologação / isolamento de contrato |
| `InMemoryDocumentClassificationRuntimeStore` | Estado in-process de sessões |
| `DocumentClassificationRuntimeFactory` | Materializa o adapter pedido |
| `createDocumentClassificationRuntimePort` (Provider) | Entry point de composição |
| Modelos canônicos | Session / Request / Result / Identity / Metadata / Capabilities / Configuration / Reference |

---

## 5. Integração de produto

O bridge oficial de captura (`registerCaptureDocumentIntakeBridge`) continua chamando apenas
`getEnterpriseRuntime().registerCaptureDocumentIntake(...)`.

O Enterprise Runtime delega a `CaptureEngineRuntimePort.registerCapture`, que após OCR
coordena estruturalmente via `DocumentClassificationRuntimePort.coordinateClassification`.

Nenhuma tela, API HTTP ou migration é alterada. Nenhuma classificação real é executada.

---

## 6. Teste

```bash
npm run enterprise:document-classification-runtime:test
```

---

## 7. Relação com DIP-03 / DIP-05

- DIP-03 (OCR Runtime) permanece o hop estrutural anterior na cadeia.
- DIP-05 (Storage Manager Runtime) está fora de escopo desta sprint.

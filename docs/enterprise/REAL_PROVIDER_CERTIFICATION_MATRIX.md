# Real Provider Certification Matrix

| Campo     | Valor                       |
| --------- | --------------------------- |
| Projeto   | MedicFlow-AI                |
| Baseline  | Enterprise Runtime v1.0     |
| Atualizado| Sprint A8-03                |

---

## Matriz de certificação dos providers reais

| Capability          | Provider ID | Adapter                                  | Versão | Discovery | Activation | Production | Current Stage |
| ------------------- | ----------- | ---------------------------------------- | ------ | --------- | ---------- | ---------- | ------------- |
| OCR                 | `azure`     | Azure Document Intelligence              | 1.0.0  | ✅        | ✅         | ✅         | Production    |
| Document Extraction | `real-tiss` | RealTissDocumentExtractionRuntimeAdapter | 1.0.0  | ✅        | ✅         | ✅         | Production    |
| Validation          | `real-tiss` | RealTissValidationRuntimeAdapter         | 1.0.0  | ✅        | ✅         | ✅         | Production    |
| XML Validation      | —           | —                                        | —      | ✅        | —          | —          | Discovery     |
| Enrichment          | `real-tiss` | RealTissAutoFillRuntimeAdapter           | 1.0.0  | ✅        | ✅         | ✅         | Production    |
| XML Generation      | `real-tiss` | RealTissXMLTISSRuntimeAdapter            | 1.0.0  | ✅        | ✅         | ✅         | Production    |
| **Batch**           | `real-tiss` | **RealTissBatchRuntimeAdapter**          | **1.0.0** | **✅** | **✅**     | **✅**     | **Production**|
| **Protocol**        | `real-tiss` | **RealTissProtocolRuntimeAdapter**       | **1.0.0** | **✅** | **✅**     | **✅**     | **Production**|
| **Persistence**     | `real-tiss` | **RealTissPersistenceRuntimeAdapter**    | **1.0.0** | **✅** | **✅**     | **✅**     | **Production**|
| Audit               | —           | —                                        | —      | ✅        | —          | —          | Discovery     |
| Completed           | —           | —                                        | —      | ✅        | —          | —          | Discovery     |

---

## Legenda

- **✅** — Etapa concluída e aprovada.
- **—** — Etapa ainda não iniciada / não aplicável no momento.

## Current Stage

- **Discovery** — capability mapeada, sem provider real ativado.
- **Activation** — provider real ativo, mas ainda sem Production Certification.
- **Production** — provider real certificado em produção.

## Enterprise End-to-End Certification (A8-E2E-01)

Pipeline completo certificado via `getEnterpriseRuntime()`:

```
OCR → Parser → Validation → Enrichment → XML → Batch → Protocol → Persistence
```

- Nenhum provider novo adicionado.
- Todos os providers listados na matriz acima foram reutilizados.
- Nenhum Runtime, Port, Gateway, Pipeline ou Composition Root foi criado.

## Notas

- Nenhuma etapa de Activation/Production pode ocorrer sem a respectiva etapa de Discovery.
- Todas as certificações atuais reutilizam exclusivamente a arquitetura Enterprise congelada (Baseline v1.0).
- A certificação `real-tiss` do **Batch** foi concluída na Sprint **A6-03** sem alterar a arquitetura congelada.
- A certificação `real-tiss` do **Protocol** foi concluída na Sprint **A7-03** sem alterar `EnterpriseRuntime`, Ports, Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Pipeline, Foundations ou Composition Root.
- A ativação `real-tiss` do **Persistence** foi concluída na Sprint **A8-02** sem alterar `EnterpriseRuntime`, `PersistentQueueRuntimePort`, `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability`, `Pipeline`, `Foundations` ou `Composition Root`.

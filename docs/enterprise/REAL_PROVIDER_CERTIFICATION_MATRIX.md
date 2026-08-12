# Real Provider Certification Matrix

| Campo     | Valor                       |
| --------- | --------------------------- |
| Projeto   | MedicFlow-AI                |
| Baseline  | Enterprise Runtime v1.0     |
| Atualizado| Sprint A6-03                |

---

## Matriz de certificação dos providers reais

| Capability          | Provider ID | Adapter                                  | Versão | Discovery | Activation | Production |
| ------------------- | ----------- | ---------------------------------------- | ------ | --------- | ---------- | ---------- |
| OCR                 | `azure`     | Azure Document Intelligence              | 1.0.0  | ✅        | ✅         | ✅         |
| Document Extraction | `real-tiss` | RealTissDocumentExtractionRuntimeAdapter | 1.0.0  | ✅        | ✅         | ✅         |
| Validation          | `real-tiss` | RealTissValidationRuntimeAdapter         | 1.0.0  | ✅        | ✅         | ✅         |
| XML Validation      | —           | —                                        | —      | ✅        | —          | —          |
| Enrichment          | `real-tiss` | RealTissAutoFillRuntimeAdapter           | 1.0.0  | ✅        | ✅         | ✅         |
| XML Generation      | `real-tiss` | RealTissXMLTISSRuntimeAdapter            | 1.0.0  | ✅        | ✅         | ✅         |
| **Batch**           | `real-tiss` | **RealTissBatchRuntimeAdapter**          | **1.0.0** | **✅** | **✅**     | **✅**     |
| Protocol            | —           | —                                        | —      | ✅        | —          | —          |
| Persistence         | —           | —                                        | —      | ✅        | —          | —          |
| Audit               | —           | —                                        | —      | ✅        | —          | —          |
| Completed           | —           | —                                        | —      | ✅        | —          | —          |

---

## Legenda

- **✅** — Etapa concluída e aprovada.
- **—** — Etapa ainda não iniciada / não aplicável no momento.

## Notas

- Nenhuma etapa de Activation/Production pode ocorrer sem a respectiva etapa de Discovery.
- Todas as certificações atuais reutilizam exclusivamente a arquitetura Enterprise congelada (Baseline v1.0).
- A certificação `real-tiss` do **Batch** foi concluída na Sprint **A6-03** sem alterar `EnterpriseRuntime`, Ports, Queue, Worker, Scheduler, Retry, Dead Letter, Observability, Pipeline, Foundations ou Composition Root.

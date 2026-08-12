# Enrichment Real Discovery

| Campo       | Valor                                                         |
| ----------- | ------------------------------------------------------------- |
| Sprint      | A4-01 — Enrichment Real Discovery                             |
| Projeto     | MedicFlow-AI                                                  |
| Baseline    | `docs/enterprise/ENTERPRISE_RUNTIME_BASELINE_V1.md`           |
| Arquitetura | `docs/enterprise/ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md` |
| Status      | Discovery                                                     |

---

## 1. Resumo

A fundação do **Enterprise Auto-Fill Runtime** (F3-CAP-12) já está estruturada. A presente sprint mapeia o que é necessário para ativar o **Enrichment Real** sem alterar `src`, `Runtime`, `EnterpriseRuntime`, `Ports`, `Gateways`, `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability`, `Pipeline` ou `Foundations`.

Nenhuma alteração arquitetural foi realizada. O `Baseline Enterprise v1.0` permanece preservado.

---

## 2. Arquitetura atual do Enrichment

### 2.1 Entrypoint único

```
Produto
  └── getEnterpriseRuntime()
        └── DefaultEnterpriseRuntime
              └── getAutoFillRuntimePort()
                    └── AutoFillRuntimePort
                          └── DefaultAutoFillRuntimeAdapter
                                └── InMemoryAutoFillRuntimeStore
```

- `getEnterpriseRuntime()` é o único ponto de entrada do produto.
- `EnterpriseRuntime.getAutoFillRuntimePort()` retorna o `AutoFillRuntimePort` oficial.
- A factory `createAutoFillRuntimePort()` materializa o adapter via `AutoFillRuntimeFactory` + `AutoFillRuntimeRegistry`.

### 2.2 Fluxo operacional TISS-RUNTIME-02B

```
Job VALIDATED (enterprise-tiss queue)
  └── WorkerQueueConsumer
        └── processTissEnrichmentJob()
              └── getAutoFillRuntimePort()
                    └── prepareAutoFill()
                    └── getResult()
              └── QueueRuntimePort.enqueue() → Job ENRICHED
```

- `processTissValidatedEnriched()` é o entrypoint de orquestração.
- `processTissEnrichmentJob()` é o handler executado pelo Worker.
- Reutiliza `QueueRuntimePort`, `WorkerRuntimePort`, `SchedulerRuntimePort`, `ObservabilityRuntimePort`, `AutoFillRuntimePort`, `Retry` e `Dead Letter`.
- **NÃO executa XML / Lote / Protocolo / Persistência / Auditoria.**
- `xmlExecuted` permanece `false` em todos os resultados.

### 2.3 Composition root

- `src/lib/enterprise/runtime/create-enterprise-runtime.ts` — singleton `getEnterpriseRuntime()`.
- `src/lib/enterprise/runtime/enterprise-runtime.ts` — `DefaultEnterpriseRuntime` injeta `autoFillRuntimePort` nas dependências de outros runtimes (TISSMapping, Audit, Validation, Quality, XML, etc.) sem consumo funcional.

---

## 3. AutoFillRuntimePort auditado

### 3.1 Port

- `src/lib/enterprise/auto-fill-runtime/ports/auto-fill-runtime-port.ts`
- Contrato: `prepareAutoFill`, `getResult`, `stats`, `health`, `capabilities`, `providerInfo`.
- Todos os métodos são estruturais; **não preenchem guias, não geram XML, não escrevem arquivos**.

### 3.2 Tipos canônicos

- `src/lib/enterprise/auto-fill-runtime/ports/types.ts`
- Define `AutoFillRuntimeProviderId`, `AutoFillRuntimeHealth`, `AutoFillRuntimeCapabilities`, `AutoFillRuntimeEnterpriseDeps`, `PrepareAutoFillInput`, `GetAutoFillResultInput`, etc.
- Todas as flags `*Implemented` são literalmente `false` na fundação.

### 3.3 Adapters

| Adapter                            | Provider ID             | Arquivo                                         | Observação                                          |
| ---------------------------------- | ----------------------- | ----------------------------------------------- | --------------------------------------------------- |
| `MockAutoFillRuntimeAdapter`       | `mock`, `test`          | `adapters/mock-auto-fill-runtime-adapter.ts`    | Determinístico, in-process, sem preenchimento real. |
| `DefaultAutoFillRuntimeAdapter`    | `default`, `enterprise` | `adapters/default-auto-fill-runtime-adapter.ts` | Adapter oficial F3-CAP-12; estrutural.              |
| `EnterpriseAutoFillRuntimeAdapter` | `enterprise`            | `adapters/default-auto-fill-runtime-adapter.ts` | Alias de `DefaultAutoFillRuntimeAdapter`.           |

### 3.4 Factory

- `src/lib/enterprise/auto-fill-runtime/factory/auto-fill-runtime-factory.ts`
- Cria `mock`, `test`, `default`, `enterprise`.
- Providers desconhecidos falham explicitamente.

### 3.5 Registry

- `src/lib/enterprise/auto-fill-runtime/registry/auto-fill-runtime-registry.ts`
- `BUILTIN_AUTO_FILL_RUNTIME_PROVIDER_COUNT = 4`
- Registrados: `mock`, `test`, `default`, `enterprise`.

### 3.6 Provider

- `src/lib/enterprise/auto-fill-runtime/providers/create-auto-fill-runtime-port.ts`
- `createAutoFillRuntimePort(options)` respeita o registry.
- `getAutoFillRuntimePort()` é o helper de composition root.

### 3.7 Store

- `src/lib/enterprise/auto-fill-runtime/store/in-memory-auto-fill-runtime-store.ts`
- Store in-process, sem banco, sem persistência.

---

## 4. Providers encontrados

| Provider ID  | Tipo       | Status | Funcionalidade real         |
| ------------ | ---------- | ------ | --------------------------- |
| `mock`       | Mock       | Ready  | Não — estrutural.           |
| `test`       | Mock       | Ready  | Não — alias de mock.        |
| `default`    | Foundation | Ready  | Não — alias de enterprise.  |
| `enterprise` | Foundation | Ready  | Não — estrutural F3-CAP-12. |

**Provider real ainda não existe.** O catálogo `docs/enterprise/REAL_PROVIDER_REGISTRY.md` marca **Enrichment** como `Discovery`.

---

## 5. Provider recomendado

**Provider ID:** `real-tiss`

**Adapter proposto:** `RealTissAutoFillRuntimeAdapter`

**Padrão:** o mesmo adotado em A3-02 para Validation:

- Criar `RealTissAutoFillRuntimeAdapter` em `src/lib/enterprise/auto-fill-runtime/adapters/real-tiss-auto-fill-runtime-adapter.ts`.
- Implementar `AutoFillRuntimePort`.
- Usar `DefaultAutoFillRuntimeAdapter` como delegate para `openJob/closeJob/submitRequest/registerDocument/stats` (se aplicável) e realizar o preenchimento real em `prepareAutoFill` / `getResult`.
- Consumir `TISSMappingRuntimePort` para obter o mapeamento canônico do guia.
- Consumir `ValidationResult` (proveniente da etapa anterior) para decidir quais campos estão aptos a ser preenchidos.
- Preencher campos de guia (`AutoFillGuide` / `AutoFillSession`) sem gerar XML.
- Adicionar `real-tiss` ao `AutoFillRuntimeProviderId`.
- Registrar no `AutoFillRuntimeFactory` e `AutoFillRuntimeRegistry`.
- Atualizar `docs/enterprise/REAL_PROVIDER_REGISTRY.md` para `Ativo`.

**Por que `real-tiss`?**

- O nome segue a convenção já estabelecida por `RealTissDocumentExtractionRuntimeAdapter` e `RealTissValidationRuntimeAdapter`.
- Indica que o preenchimento/autofill é feito com conhecimento das regras TISS (tipo de guia, operadora, campos obrigatórios).

---

## 6. Estratégia de ativação

### 6.1 A4-02 — Enrichment Real Activation

1. Criar `RealTissAutoFillRuntimeAdapter` seguindo o contrato `AutoFillRuntimePort`.
2. Expandir `AutoFillRuntimeProviderId` com `real-tiss`.
3. Adicionar `case "real-tiss"` na `AutoFillRuntimeFactory`.
4. Adicionar registro no `AutoFillRuntimeRegistry`.
5. Exportar `RealTissAutoFillRuntimeAdapter` em `src/lib/enterprise/auto-fill-runtime/index.ts`.
6. **Não alterar** `processTissEnrichmentJob`, `processTissValidatedEnriched`, `DefaultEnterpriseRuntime`, `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`.
7. A escolha do provider ativo pode ser feita via `AutoFillRuntimeOptions.provider: "real-tiss"` no composition root, quando solicitado.

### 6.2 A4-03 — Enrichment Production Certification

- Documento válido → `ENRICHED` com preenchimento real.
- Documento inválido / inconsistente → `nack` ou `nack-error`.
- Retry e Dead Letter via Worker/Queue existentes.
- Carga e latência.
- Observability: `health`, `providerInfo`, `telemetry`, `latencyMs`, `attempts`, `cancelled`.
- `xmlExecuted = false` e demais flags corretas.
- Atualizar `REAL_PROVIDER_REGISTRY.md` para `Certified`.

---

## 7. Evidência de preservação arquitetural

| Verificação                                                             | Resultado                                                                                                                          |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `getEnterpriseRuntime` único entrypoint                                 | 174 ocorrências em `src/`; nenhum bypass.                                                                                          |
| Nenhum Runtime paralelo                                                 | Apenas `DefaultEnterpriseRuntime` e seus Ports oficiais.                                                                           |
| Nenhum Gateway paralelo                                                 | `AutoFillRuntimePort` é o único acesso.                                                                                            |
| Nenhum Pipeline paralelo                                                | `processTissValidatedEnriched` e `processTissEnrichmentJob` usam `QueueRuntimePort` + `WorkerRuntimePort` + `AutoFillRuntimePort`. |
| Nenhum Dual Path                                                        | `DefaultEnterpriseRuntime` instancia `autoFillRuntimePort` em composition root; produto não importa adapters concretos.            |
| `XMLRuntimePort` não é acessado no Enrichment                           | `processTissEnrichmentJob.ts` não importa XML. `xmlExecuted = false`.                                                              |
| `processTissEnrichmentJob` e `processTissValidatedEnriched` inalterados | Nenhuma mudança realizada.                                                                                                         |

---

## 8. Evidência de XML NÃO executado

- `processTissEnrichmentJob` retorna `xmlExecuted: false` em **todos** os ramos (`ok`, `nack`, `nack-error`).
- `processTissValidatedEnriched` retorna `xmlExecuted: false` em **todos** os ramos.
- `processTissEnrichedXmlGenerated` (próxima fase) é quem ativará `XML`.
- Não há importação de `XMLRuntimePort` ou `XMLTISSRuntimePort` em `process-tiss-enrichment-job.ts` nem `process-tiss-validated-enriched.ts`.

---

## 9. Dependências externas

O `DefaultAutoFillRuntimeAdapter` declara `AutoFillRuntimeEnterpriseDeps` para shape-check em `health()` (sem consumo funcional):

- `getTISSMappingRuntimePort`
- `getAuditRuntimePort`
- `getValidationRuntimePort`
- `getDocumentExtractionRuntimePort`
- `getDocumentClassificationRuntimePort`
- `getOCRRuntimePort`
- `getAIOrchestrationRuntimePort`
- `getIntelligentCaptureRuntimePort`
- `getScannerRuntimePort`
- `getWatchFolderRuntimePort`
- `getUploadRuntimePort`

Para o Enrichment real, as dependências funcionais mínimas provavelmente serão:

- `TISSMappingRuntimePort` (mapeamento canônico do guia).
- `ValidationRuntimePort` / `ValidationResult` (campos validados).
- `DocumentExtractionRuntimePort` (campos extraídos, se necessário).
- `AuditRuntimePort` (futuro, para auditoria).

---

## 10. Riscos

1. **Regras TISS por operadora:** cada operadora pode exigir mapeamentos distintos; sem `TISSMappingRuntime` maduro, o preenchimento pode ser incompleto.
2. **Tipos de guia:** `consulta`, `honorários`, `internação`, `odontológica`, `SPADT`, etc., possuem campos específicos.
3. **Ciclo com Validation:** o Enrichment deve respeitar `ValidationResult` (rejected → não prossegue; pending-review → enriquecimento mínimo).
4. **Ausência de XML:** o adapter real deve preencher apenas metadados canônicos; XML é responsabilidade da fase 03A.
5. **Performance:** preenchimento com regras requer carga testada antes de produção.

---

## 11. Critérios de ativação

- [ ] `RealTissAutoFillRuntimeAdapter` implementa `AutoFillRuntimePort` sem alterar o Port.
- [ ] Provider `real-tiss` registrado em Factory, Registry e `AutoFillRuntimeProviderId`.
- [ ] Nenhuma alteração em `processTissEnrichmentJob` / `processTissValidatedEnriched`.
- [ ] `xmlExecuted = false` mantido.
- [ ] `getEnterpriseRuntime()` continua sendo o único entrypoint.
- [ ] Testes de ativação passam (`build`, `tsc`, `lint`, `smoke`).

---

## 12. Critérios de certificação

- [ ] Documento válido → `ENRICHED` com preenchimento real.
- [ ] Documento inválido / inconsistente → rejeição correta.
- [ ] Retry e Dead Letter preservados.
- [ ] Observability: `health`, `providerInfo`, `telemetry` com `latencyMs`, `attempts`, `cancelled`.
- [ ] Carga e latência medidas.
- [ ] `enrichmentExecuted = true`; `xmlExecuted = false`; demais flags corretas.
- [ ] `REAL_PROVIDER_REGISTRY.md` atualizado para `Certified`.

---

**Conclusão obrigatória:** O Enrichment Runtime foi completamente mapeado. Nenhuma alteração arquitetural foi realizada. O Baseline Enterprise permanece preservado.

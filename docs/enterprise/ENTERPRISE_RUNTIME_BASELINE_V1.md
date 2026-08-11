# Enterprise Runtime Baseline v1.0

| Campo | Valor |
|-------|-------|
| Baseline | `enterprise-runtime-baseline-v1.0` |
| Branch | `feat/epc-24e-enterprise-runtime-final-cutover` |
| Commit de referência | `9ec30ed` |
| Tag anotada | `enterprise-runtime-baseline-v1.0` (`d6ce41fb`) |
| Certificação | `ARC-26` |
| Status | **Congelado** |

---

## 1. Arquitetura certificada

A arquitetura Enterprise Runtime do MedicFlow-AI foi certificada na Sprint `ARC-26` e publicada como baseline oficial. A referência permanente é [`ARC26_ENTERPRISE_RUNTIME_FINAL_CERTIFICATION.md`](./ARC26_ENTERPRISE_RUNTIME_FINAL_CERTIFICATION.md).

---

## 2. Pipeline operacional oficial

```text
Produto
  ↓
getEnterpriseRuntime()
  ↓
SchedulerRuntimePort
  ↓
WorkerRuntimePort
  ↓
QueueRuntimePort
  ↓
Dead Letter
  ↓
Observability
```

---

## 3. Pipeline funcional oficial

```text
RECEIVED
  ↓
OCR_COMPLETED
  ↓
PARSED
  ↓
VALIDATED
  ↓
ENRICHED
  ↓
XML_GENERATED
  ↓
BATCH_CREATED
  ↓
PROTOCOL_SENT
  ↓
PERSISTED
  ↓
AUDITED
  ↓
COMPLETED  (terminal — sem reenfileiramento)
```

---

## 4. Baseline congelado

A partir deste baseline:

- A arquitetura acima é a **única referência obrigatória** para evoluções do MedicFlow-AI.
- Nenhum novo pipeline, gateway, runtime ou composition root paralelo pode ser introduzido sem registro no [`ARCHITECTURAL_EXCEPTION_REGISTER.md`](./ARCHITECTURAL_EXCEPTION_REGISTER.md).
- O entrypoint permanece sendo `getEnterpriseRuntime()`.
- O ciclo `RECEIVED → COMPLETED` é a **única cadeia funcional TISS homologada**.

---

## 5. Próxima fase: Integrações Reais

As próximas fases de evolução deverão integrar backends, provedores e serviços reais **por trás dos Ports já certificados**, sem criar novos pipelines, novos entrypoints ou novos Runtimes. Cada integração deve respeitar:

- `ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`
- `ARC26_ENTERPRISE_RUNTIME_FINAL_CERTIFICATION.md`
- `OPER_INF_ROADMAP.md`
- `TISS_RUNTIME_DISCOVERY.md`

---

## 6. Referências

- [`ARC26_ENTERPRISE_RUNTIME_FINAL_CERTIFICATION.md`](./ARC26_ENTERPRISE_RUNTIME_FINAL_CERTIFICATION.md)
- [`ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md`](./ENTERPRISE_RUNTIME_OFFICIAL_ARCHITECTURE.md)
- [`TISS_RUNTIME_DISCOVERY.md`](./TISS_RUNTIME_DISCOVERY.md)
- [`OPER_INF_ROADMAP.md`](./OPER_INF_ROADMAP.md)

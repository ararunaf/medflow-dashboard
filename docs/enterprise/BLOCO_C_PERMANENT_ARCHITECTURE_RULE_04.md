# Regra Permanente do BLOCO C — Observability by Design (RULE_04)

**Status:** Vigente a partir da Sprint C-02A (2026-08-04)  
**Escopo:** Todos os Runtimes do BLOCO C — Integração Corporativa  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE.md)  
**Documento irmão:** [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_02.md)  
**Documento de arquitetura:** [`C02_XML_VALIDATION_RUNTIME_ARCHITECTURE.md`](./C02_XML_VALIDATION_RUNTIME_ARCHITECTURE.md)

---

## Regra

Os Runtimes do BLOCO C são **observáveis por desenho** (*Observability by Design*).

Por contrato estrutural, cada Runtime deverá prever campos de envelope operacional para rastreabilidade futura:

| Campo estrutural | Propósito |
|------------------|-----------|
| `operationId` | Identificador da operação |
| `correlationId` | Correlação entre operações / cadeia |
| `startedAt` | Início estrutural da execução |
| `finishedAt` | Fim estrutural da execução |
| `executionStatus` | Status estrutural da execução |
| `executionDuration` | Duração estrutural |
| `processedItems` | Contagem estrutural de itens processados |
| `warnings` | Avisos estruturais |
| `errors` | Erros estruturais |
| `traceMetadata` | Metadados estruturais de rastreio |

---

## Limites explícitos (C-02A)

Esta regra registra **somente a arquitetura**.

Nesta Sprint e no estado atual do BLOCO C:

- **não existe observabilidade funcional**;
- **não existe telemetry**;
- **não existe tracing**;
- **não existe logging específico** de Runtime do BLOCO C;
- **não existe** exportação para OpenTelemetry, Datadog, Sentry ou equivalentes;
- existe apenas a **preparação arquitetural** (contrato estrutural / campos previstos).

Implementação funcional de observabilidade **não** faz parte desta Sprint e **não** deve ser introduzida silenciosamente em Sprints de Foundation.

---

## Consequências arquiteturais

| Princípio | Aplicação |
|-----------|-----------|
| Observability by Design | Envelope estrutural previsto em todos os Runtimes do BLOCO C |
| Sem telemetria prematura | Nenhum sink, exporter ou collector nesta Foundation |
| Sem tracing funcional | `traceMetadata` é contrato estrutural, não pipeline de trace |
| Sem logging específico | Logs de produto / INF-04 permanecem fora do escopo desta regra |
| Separação de blocos | Observabilidade de infraestrutura (Phase B) ≠ envelope estrutural do BLOCO C |

---

## Vigência

Esta regra é **permanente** para todo o BLOCO C. Sprints futuras (C-03 em diante) devem respeitá-la sem exceção silenciosa.

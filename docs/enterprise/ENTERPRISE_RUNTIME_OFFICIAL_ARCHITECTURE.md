# ENTERPRISE RUNTIME — Official Architecture

| Campo | Valor |
|-------|-------|
| Sprint | ARC-25 — Official Architecture Freeze |
| Projeto | MedicFlow-AI |
| Data | 2026-08-11 |
| Natureza | Documentação permanente (sem alteração de código) |
| Status | **CONGELADA — referência obrigatória** |
| Entrypoint único | `getEnterpriseRuntime()` |
| Pipeline oficial | Enterprise Canonical Runtime Pipeline |

---

## 1. Declaração oficial

Este documento é a **arquitetura oficial permanente** do MedicFlow-AI.

A partir de ARC-25:

1. Existe **um único pipeline oficial**.
2. O **Enterprise Runtime** é o único composition root operacional.
3. Foundations 4–7 estão **congeladas**.
4. A cadeia operacional Queue → Worker → Scheduler → Dead Letter → Observability está **homologada**.
5. Toda evolução futura **deve** obedecer este documento.

Qualquer desvio exige entrada no [`ARCHITECTURAL_EXCEPTION_REGISTER.md`](./ARCHITECTURAL_EXCEPTION_REGISTER.md).

---

## 2. Arquitetura oficial

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

### 2.1 Leitura canônica da cadeia

| Camada | Papel |
|--------|-------|
| **Produto** | UI / Server Functions / consumers — nunca instanciam Adapters Enterprise concretos |
| **`getEnterpriseRuntime()`** | Composition root único; única porta de entrada operacional |
| **SchedulerRuntimePort** | Decide **quando** acionar o Worker |
| **WorkerRuntimePort** | Executa consumo operacional via Queue |
| **QueueRuntimePort** | Persistência e entrega de mensagens |
| **Dead Letter** | Armazenamento definitivo de falhas (via contrato interno `DeadLetterRuntimePort` → `QueueRuntimePort`) |
| **Observability** | Coleta e exposição somente-leitura (métricas, health, diagnostics) — nunca altera o fluxo |

### 2.2 Pipeline oficial único

O **Enterprise Canonical Runtime Pipeline**, acessado exclusivamente via `getEnterpriseRuntime()`, é o único pipeline documental/operacional oficial do MedicFlow-AI (cutover EPC-24E; Dual Path AER-GA03-A1 **Resolvida**).

Não existe segundo pipeline oficial. Não existe Dual Path permanente.

Documentos irmãos:

- [`ENTERPRISE_RUNTIME_CONVERGENCE_RULE.md`](./ENTERPRISE_RUNTIME_CONVERGENCE_RULE.md)
- [`EPC24E_ENTERPRISE_RUNTIME_FINAL_CUTOVER.md`](./EPC24E_ENTERPRISE_RUNTIME_FINAL_CUTOVER.md)
- [`OPER_INF_ROADMAP.md`](./OPER_INF_ROADMAP.md)

---

## 3. Enterprise Runtime

### 3.1 Responsabilidade

O Enterprise Runtime:

- Compõe Ports e Adapters oficiais
- Expõe a superfície operacional via Ports
- Coordena o pipeline canônico
- É o **único** ponto autorizado de composição

O Enterprise Runtime **não**:

- Embute regra de negócio especializada
- Autoriza bypass de Ports
- Cria pipelines paralelos
- Expõe Adapters concretos ao Produto

### 3.2 Composition root

```text
Produto / Gateways ViaEnterprise
        ↓
resolveCaptureEnterpriseRuntime() ≡ getEnterpriseRuntime()
        ↓
Ports oficiais (DIP / Bloco C / INF / TISS / …)
        ↓
Adapters (implementação atrás dos Ports)
```

---

## 4. Componentes congelados

| Componente | Status | Implicação |
|------------|--------|------------|
| **Foundations 4–7** | CONGELADAS | Sem alteração estrutural; evolução só por Sprint oficial autorizada |
| **Enterprise Runtime** | CONGELADO | Composition root estável; sem Runtime paralelo |
| **Pipeline oficial** | CONGELADO | Único caminho operacional; sem Dual Path |

Foundations 4–7 cobrem a base estrutural INF já certificada (Queue, Worker, Scheduler, Observability foundations e runtimes associados), sobre a qual OPER-INF ativou o plano operacional sem nova arquitetura.

---

## 5. Componentes operacionais (homologados)

| Componente | Port / contrato | Status | Responsabilidade |
|------------|-----------------|--------|------------------|
| **Queue** | `QueueRuntimePort` | ✓ Homologado (OPER-INF-Q) | Backend persistente de filas |
| **Worker** | `WorkerRuntimePort` → `QueueRuntimePort` | ✓ Homologado (OPER-INF-W) | Polling, claim, lock, ACK/NACK, heartbeat, shutdown |
| **Scheduler** | `SchedulerRuntimePort` → `WorkerRuntimePort` | ✓ Homologado (OPER-INF-S) | Agendamento temporal; aciona Worker |
| **Dead Letter** | `DeadLetterRuntimePort` → `QueueRuntimePort` | ✓ Homologado (OPER-INF-D) | Armazenamento definitivo; sem decisão de retry |
| **Observability** | `ObservabilityRuntimePort` (leitura dos Ports) | ✓ Homologado (OPER-INF-O) | Métricas, health, diagnostics; sem interferência no fluxo |

### 5.1 Fluxo operacional oficial

```text
getEnterpriseRuntime()
  → SchedulerRuntimePort
    → WorkerRuntimePort
      → QueueRuntimePort
        → Backend Persistente
        → DeadLetterRuntimePort (contrato interno)
          → QueueRuntimePort (isolamento enterprise-dead-letter)
  → ObservabilityRuntimePort (somente leitura)
```

### 5.2 Próximas ativações (não arquitetura)

| Sprint | Status |
|--------|--------|
| **OPER-INF-R** | ✓ Homologado — Retry operacional (decisão de reenvio via Ports existentes) |
| **TISS-RUNTIME-01D** | ✓ Discovery funcional TISS — [`TISS_RUNTIME_DISCOVERY.md`](./TISS_RUNTIME_DISCOVERY.md) |
| **TISS-RUNTIME-01A** | ✓ Entrada operacional do boletim — Job TISS RECEIVED via `QueueRuntimePort` |
| **TISS-RUNTIME-01B** | ✓ OCR operacional no Worker — Job RECEIVED → OCR → OCR_COMPLETED via Ports existentes |
| **TISS-RUNTIME-01C** | ✓ Parser / Extraction operacional no mesmo pipeline |
| **TISS-RUNTIME-02A** | ✓ Validation operacional no Worker — Job PARSED → Validation → VALIDATED via `ValidationRuntimePort` |
| **TISS-RUNTIME-02B** | ✓ Enrichment operacional no Worker — Job VALIDATED → Enrichment → ENRICHED via `AutoFillRuntimePort` |

---

## 6. Regras permanentes

As regras abaixo são **obrigatórias** para toda evolução futura.

### RULE-20 — Incremental Functional Evolution

Cada Sprint funcional implementa **apenas uma** nova capacidade. Foundations e blocos homologados permanecem intactos. Gates (Build / TypeScript / ESLint / Smoke / Enterprise) antes e depois.

Fonte: [`BLOCO_C_PERMANENT_ARCHITECTURE_RULE_20.md`](./BLOCO_C_PERMANENT_ARCHITECTURE_RULE_20.md)

### RULE-23 — Release Baseline Certification

Nenhuma Sprint seguinte inicia sem **OFFICIAL RELEASE BASELINE** da anterior (GO Técnico + GO Administrativo; Working Tree limpa; push sincronizado; ahead/behind = 0).

Fonte: [`BLOCO_D_PERMANENT_ARCHITECTURE_RULE_23.md`](./BLOCO_D_PERMANENT_ARCHITECTURE_RULE_23.md)

### RULE-25 — Consumo Exclusivo via Port

Capacidades Enterprise são expostas **exclusivamente por Ports**. Produto e módulos externos **não** importam Adapters, Stores ou Engines concretos.

Fonte: [`BLOCO_E_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_E_PERMANENT_ARCHITECTURE_RULE.md) §2.2

### RULE-26 — Incremental Functional Evolution (aplicação contínua)

Cada Sprint ativa **exatamente uma** capability na matriz correspondente. Sem antecipação de capabilities futuras. Sem ampliação silenciosa de escopo.

Fonte: [`BLOCO_E_PERMANENT_ARCHITECTURE_RULE.md`](./BLOCO_E_PERMANENT_ARCHITECTURE_RULE.md) §2.3

---

## 7. Princípios oficiais

| Princípio | Aplicação |
|-----------|-----------|
| **Pipeline único** | Um único caminho operacional via Enterprise Runtime |
| **Port/Adapter** | Contratos estáveis (Ports); implementação substituível (Adapters) |
| **DIP** | Dependência de abstrações (Ports), nunca de concretos |
| **Responsabilidade única** | Cada Runtime/Port faz uma coisa; Scheduler não consome Queue direto; Observability não executa |
| **Composição via Enterprise Runtime** | Todo wiring oficial passa por `getEnterpriseRuntime()` |
| **Implementação atrás dos Ports** | Engines/Adapters são internos; Gateways ViaEnterprise são a superfície autorizada do produto |

---

## 8. Dependências permitidas

```text
Produto
  → getEnterpriseRuntime() / Gateways ViaEnterprise
    → Ports oficiais
      → Adapters / Stores / backends (internos ao módulo Enterprise)

SchedulerRuntimePort → WorkerRuntimePort
WorkerRuntimePort    → QueueRuntimePort
QueueRuntimePort     → DeadLetterRuntimePort (contrato interno)
DeadLetterRuntimePort → QueueRuntimePort (isolamento DLQ)
ObservabilityRuntimePort → leitura de Ports existentes (stats/shape)
```

Permitido:

- Consumir Ports obtidos do Enterprise Runtime
- Substituir Adapters atrás do mesmo Port (Sprint oficial)
- Ativar capacidades OPER-INF / TISS-RUNTIME sobre Ports existentes
- Documentar exceções no AER com plano de fechamento

---

## 9. Dependências proibidas

| Proibição | Motivo |
|-----------|--------|
| Segundo pipeline | Quebra o pipeline único homologado |
| Bypass do Enterprise Runtime | Composition root deixa de ser único |
| Acesso direto às engines | Viola RULE-25 e Port/Adapter |
| Novos Gateways paralelos | Duplica superfície de entrada |
| Novos Ports paralelos | Duplica contrato já congelado |
| Dependências circulares | Corrompe DIP e composição |
| Execução fora do pipeline oficial | Reintroduz Dual Path |

Adicionalmente (cadeia operacional):

- Consumidores **não** acessam filas diretamente — só via `QueueRuntimePort`
- Scheduler **não** aciona Queue direto — só via `WorkerRuntimePort`
- Dead Letter **não** decide retry — só armazenamento definitivo (retry = OPER-INF-R)
- Observability **não** executa regras nem altera o fluxo

---

## 10. Responsabilidades por camada

| Camada | Pode | Não pode |
|--------|------|----------|
| Produto | Chamar Runtime / Gateways | Instanciar Adapters; chamar engines |
| Enterprise Runtime | Compor Ports | Embutir domínio especializado |
| Scheduler | Agendar / acionar Worker | Consumir Queue; regras de negócio |
| Worker | Consumir Queue | Criar pipeline paralelo; Scheduler próprio |
| Queue | Persistir / entregar | Expor fila crua ao produto |
| Dead Letter | Armazenar falhas definitivas | Retry / reprocessamento |
| Observability | Coletar / expor | Executar / alterar fluxo |
| Adapters | Implementar Ports | Ser importados pelo produto |

---

## 11. Congelamento

| Artefato | Estado |
|----------|--------|
| Este documento | **Referência obrigatória permanente** |
| Arquitetura Enterprise | CONGELADA |
| Foundations 4–7 | CONGELADAS |
| Enterprise Runtime | CONGELADO |
| Pipeline oficial | CONGELADO |
| Cadeia operacional Q/W/S/D/O | HOMOLOGADA |

**ARC-25 não altera** `src/`, Runtime, Ports, Gateways, testes nem comportamento. Apenas documenta e congela a arquitetura oficial.

---

## 12. Conclusão

A arquitetura oficial do MedicFlow-AI foi documentada e congelada. O documento passa a ser a referência obrigatória para toda evolução futura do sistema.

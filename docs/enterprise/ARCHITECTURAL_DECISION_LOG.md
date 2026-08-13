# Architectural Decision Log — Enterprise Runtime Baseline v1.1

| Campo      | Valor                       |
| ---------- | --------------------------- |
| Projeto    | MedicFlow-AI                |
| Baseline   | Enterprise Runtime v1.1     |
| Sprint     | A8-ADL-01                   |
| Natureza   | Documental                  |
| Atualizado | Sprint A8-ADL-01            |

---

## 1. Architectural Principles

1. **Single Entrypoint**: toda a orquestração Enterprise passa por `getEnterpriseRuntime()`.
2. **Ports over Adapters**: domínio consome `Ports`, nunca `Adapters` concretos.
3. **Factory + Registry Resolution**: `Providers` e `Adapters` só podem ser materializados pelas factories e registries oficiais.
4. **No Parallel Infrastructure**: `Queue`, `Worker`, `Scheduler`, `Retry`, `Dead Letter`, `Observability` são infraestrutura compartilhada única.
5. **Frozen Pipeline**: o pipeline congelado `OCR → Parser → Validation → Enrichment → XML → Batch → Protocol → Persistence` é o único caminho TISS certificado.
6. **Audit/Completed Decoupled**: `Audit` e `Completed` eram inicialmente capabilities futuras; foram subsequentemente certificados em A9/A10 como addendum à `Baseline v1.1` (ver ADL-A10-01), sem modificar o pipeline congelado.
7. **Security as Cross-Cutting**: `Enterprise Security` atuará como camada transversal, sem modificar a arquitetura congelada.
8. **Explicit Baseline Changes**: nenhuma decisão deste log pode ser alterada sem aprovação formal de uma nova baseline.

---

## 2. Architectural Decisions

### ADL-001 — `getEnterpriseRuntime()` é o único ponto oficial de entrada

**Decisão:**

Toda capability Enterprise deve obter `Runtime`, `Ports` e infraestrutura compartilhada exclusivamente por `getEnterpriseRuntime()`.

**Justificativa:**

- Garante composição única e previsível de adapters.
- Evita acoplamento direto a implementações concretas.
- Centraliza health, observability e configuração.
- Facilita testes e certificações end-to-end.

**Consequências:**

- Nenhum módulo Application pode instanciar `Runtime` ou `Adapter` diretamente.
- `createEnterpriseRuntime` fica restrito a testes e bootstrap.
- Toda função `processTiss*` consome `runtime = getEnterpriseRuntime()`.

**Riscos caso seja violado:**

- Duplicidade de instâncias e estados inconsistentes.
- Bypass de health/observability.
- Impossibilidade de certificar o pipeline end-to-end.
- Criação de caminhos paralelos que quebram a governança Enterprise.

---

### ADL-002 — Todos os RuntimePorts devem ser reutilizados; nenhum Port paralelo poderá existir

**Decisão:**

Nenhum novo `RuntimePort` pode ser criado fora dos Ports já certificados. Toda nova capability reutiliza os Ports existentes.

**Justificativa:**

- Preserva o contrato canônico e a substituibilidade de providers.
- Evita explosão de abstrações paralelas.
- Garante que factories e registries continuem como únicos pontos de criação.

**Consequências:**

- Nova capability de OCR, por exemplo, deve usar `OCRRuntimePort`, nunca um `MyOCRRuntimePort`.
- Estender comportamento ocorre por novos `Providers`/`Adapters` dentro do registry oficial, não por novo Port.

**Riscos caso seja violado:**

- Fragmentação da arquitetura.
- Múltiplos contratos para a mesma capability.
- Quebra do registry/factory e perda de governança.

---

### ADL-003 — Toda resolução de Provider deverá ocorrer exclusivamente via Factory e Registry oficiais

**Decisão:**

Adapters só podem ser obtidos por `createXxxRuntimePort({ provider: "..." })` a partir das factories e registries oficiais.

**Justificativa:**

- Centraliza a descoberta e validação de providers.
- Impede fallback silencioso para implementações não certificadas.
- Mantém o rastreamento de `providerId` em health/capabilities.

**Consequências:**

- Proibido `new RealTiss...()` fora de testes internos de factory.
- Proibido importar `adapters` diretamente no Application/Domain.

**Riscos caso seja violado:**

- Uso de adapters não homologados em produção.
- Bypass de registro e perda de auditoria de provider.
- Violação do Dependency Inversion Principle.

---

### ADL-004 — Adapters concretos nunca poderão ser utilizados diretamente

**Decisão:**

O código de negócio e de orquestração chama apenas `Ports`. `Adapters` são detalhes de implementação internos das factories.

**Justificativa:**

- Separa contrato (Port) de implementação (Adapter).
- Permite trocar provider sem alterar consumidores.
- Mantém o domínio livre de vendor/implementation details.

**Consequências:**

- `processTiss*` chamam `runtime.getXxxRuntimePort().process()`, nunca `new RealTiss...()`.
- Testes de certificação validam `Port`, não adapter.

**Riscos caso seja violado:**

- Acoplamento a implementações específicas.
- Impossibilidade de substituir provider.
- Fuga do registry e factory.

---

### ADL-005 — Nenhuma capability poderá criar Pipeline paralelo

**Decisão:**

O pipeline TISS certificado é único. Não é permitida criação de pipelines paralelos ou alternativos que bypassem os estágios congelados.

**Justificativa:**

- Garante rastreabilidade linear de estados.
- Evite duplicidade, perda de mensagens e loops.
- Preserva a integridade de `previousJobId` e `correlationId`.

**Consequências:**

- Novas capabilities podem adicionar workers a estágios existentes, mas não criar caminhos alternativos.
- Nenhuma transição `PERSISTED → COMPLETED` é permitida sem passar por `Audit`.

**Riscos caso seja violado:**

- Mensagens órfãs e estados inconsistentes.
- Perda de `previousJobId`.
- Falha na certificação end-to-end.

---

### ADL-006 — Queue, Worker, Scheduler, Retry, Dead Letter e Observability são infraestrutura compartilhada e não poderão ser duplicados

**Decisão:**

A infraestrutura operacional (`QueueRuntimePort`, `WorkerRuntimePort`, `SchedulerRuntimePort`, `ObservabilityRuntimePort`, `Retry`, `Dead Letter`) é única e compartilhada por todas as capabilities.

**Justificativa:**

- Garante consistência de transporte, execução, agendamento e observability.
- Evita múltiplos consumers concorrentes sobre o mesmo backend.
- Centraliza DLQ, retry e métricas.

**Consequências:**

- Proibido criar `MyWorker`, `MyQueue` ou `MyScheduler`.
- Toda capability usa `runtime.getQueueRuntimePort()` / `runtime.getWorkerRuntimePort()` / `runtime.getSchedulerRuntimePort()`.

**Riscos caso seja violado:**

- Concorrência e race conditions.
- Múltiplas DLQs perdem a semântica de retry.
- Fragmentação de observability.

---

### ADL-007 — Toda capability futura deverá respeitar a Baseline Enterprise v1.1

**Decisão:**

Qualquer nova capability deve ser implementada dentro dos limites da `Enterprise Runtime Baseline v1.1`: reutilizar `getEnterpriseRuntime()`, Ports, factories, registries e infraestrutura congelada.

**Justificativa:**

- Evita regressão arquitetural acumulada.
- Facilita certificações incrementais.
- Mantém governança e previsibilidade.

**Consequências:**

- Novas capabilities precisam de `git diff` contra a baseline.
- Novos adapters só podem ser adicionados se respeitarem ADL-002, ADL-003 e ADL-004.

**Riscos caso seja violado:**

- Degradação gradual da arquitetura.
- Impossibilidade de certificar novas capabilities.
- Reabertura de gaps já resolvidos.

---

### ADL-008 — Audit e Completed permanecem desacoplados de Persistence

**Decisão:**

`Audit` e `Completed` não fazem parte do pipeline congelado `OCR → Persistence`. Eles serão ativados como capabilities independentes, consumindo `PERSISTED`, mas sem alterar o pipeline certificado.

**Justificativa:**

- Separa responsabilidades: Persistence = garantia de registro; Audit = revisão/assinatura; Completed = encerramento.
- Permite evoluir Auditoria sem risco ao pipeline funcional.
- Evita ciclos e dependências cruzadas entre capabilities.

**Consequências:**

- `processTissProtocolSentPersisted` continua retornando `auditExecuted=false` e `completedExecuted=false`.
- Futuras Sprints `TISS-RUNTIME-05A` e `05B` adicionarão workers próprios após `PERSISTED`.

**Riscos caso seja violado:**

- Mistura de responsabilidades.
- Dificuldade de certificar auditoria isoladamente.
- Possível perda de dados por execução acoplada.

---

### ADL-009 — Segurança Enterprise será um bloco independente e não deverá modificar a arquitetura congelada

**Decisão:**

`Enterprise Security` (`BLOCO S`) atuará como camada transversal: autenticação, autorização, criptografia e auditoria de acesso, sem alterar `Runtime`, `Ports`, `Pipeline` ou `Composition Root` da Baseline v1.1.

**Justificativa:**

- Segurança cross-cutting não deve gerar acoplamento arquitetural.
- Permite certificar segurança sem reabrir baseline.
- Preserva os limites congelados.

**Consequências:**

- Segurança será implementada por interceptadores, policies e tokens externos.
- Nenhum novo `SecurityRuntimePort` será criado dentro da Baseline v1.1.

**Riscos caso seja violado:**

- Acoplamento de regras de segurança à orquestração.
- Dificuldade de evoluir segurança sem impactar funcionalidades.
- Violação do princípio de responsabilidade única.

---

### ADL-A10-01 — Certificação de `Audit` e `Completed` como addendum à Baseline v1.1

**Decisão:**

`Audit` (Sprint A9-03) e `Completed` (Sprint A10-03) foram certificados como **addendum** à `Enterprise Runtime Baseline v1.1`. A certificação reutiliza os Ports, factories, registries, workers, queues, schedulers, retry, dead letter, observability e o ponto único `getEnterpriseRuntime()` já congelados; nenhum componente arquitetural da v1.1 foi modificado.

**Justificativa:**

- A arquitetura congelada da v1.1 já previa a extensão dos estágios `PERSISTED → AUDITED → COMPLETED` sem alterar o pipeline até `PERSISTED`.
- Certificar `Audit` e `Completed` como addendum preserva a governança e o congelamento da baseline, evitando a necessidade de uma nova baseline formal para um estado meramente documental/certificatório.
- Mantém a separação de concerns: `Audit` revisa/audita; `Completed` encerra; nenhuma responsabilidade invade o pipeline funcional já certificado.

**Consequências:**

- O pipeline oficial congelado passa a incluir `PERSISTED → AUDITED → COMPLETED` como addendum certificado.
- Os RuntimePorts `AuditRuntimePort` e `CompletedRuntimePort`, com providers/adapters `real-tiss`, passam ao status `Production Certified` sem criar Ports, Runtimes, Pipelines ou Composition Roots paralelos.
- O `ENTERPRISE_BASELINE_V1_1.md` recebe um `A10 Supplement` claramente delimitado; a seção original do congelamento A8-FREEZE-01 permanece inalterada.
- Uma futura `Baseline v1.2` continua exigindo aprovação formal no ADL.

**Riscos caso seja violado:**

- Confundir o addendum com uma mudança de baseline poderia permitir alterações indiscriminadas na arquitetura congelada.
- Bypass de `getEnterpriseRuntime()` ou criação de novos Ports/Runtimes quebrouria ADL-001 a ADL-004.

---

## 3. Decision Dependency Matrix

| Decisão | Módulos impactados | Riscos | Dependências | Motivo |
|---|---|---|---|---|
| ADL-001 | Todos os módulos Enterprise | Instâncias duplicadas; bypass de health | `DefaultEnterpriseRuntime`, `getEnterpriseRuntime` | Ponto de entrada único |
| ADL-002 | Todos os `*RuntimePort` | Fragmentação de contratos | Factories e Registries | Reutilização e governança |
| ADL-003 | Factories, Registries, Adapters | Uso de providers não certificados | `*RuntimeFactory`, `*RuntimeRegistry` | Resolução controlada |
| ADL-004 | Application, Domain, Tests | Acoplamento a implementações | `*RuntimePort` interfaces | Inversão de dependência |
| ADL-005 | Pipeline TISS, `processTiss*` | Ciclos, mensagens órfãs, perda de estados | `QueueRuntimePort`, `WorkerRuntimePort` | Rastreabilidade linear |
| ADL-006 | INF operational (Queue/Worker/Scheduler/DLQ/Retry/Obs) | Concorrência, DLQs paralelas | `DefaultQueueRuntimeAdapter`, `DefaultWorkerRuntimeAdapter`, etc. | Infraestrutura compartilhada |
| ADL-007 | Todas as futuras Sprints | Regressão arquitetural | `ENTERPRISE_BASELINE_V1_1.md` | Governança evolutiva |
| ADL-008 | `AuditRuntimePort`, `CompletedRuntimePort`, `processTiss*` | Mistura de responsabilidades | Pipeline congelado até `PERSISTED` | Separação de concerns |
| ADL-009 | `BLOCO S — Enterprise Security` | Acoplamento segurança/negócio | Camadas externas de segurança | Cross-cutting concern |

---

## 4. Violation Examples

### 4.1 Criar novo Runtime

**Exemplo proibido:**

```ts
const myRuntime = new MyEnterpriseRuntime();
```

**Por que viola:**

- Substitui o ponto único de acesso `getEnterpriseRuntime()`.
- Cria estado e composição paralela, quebrando ADL-001.

### 4.2 Criar novo Port

**Exemplo proibido:**

```ts
interface MyOCRRuntimePort { process(input): Promise<MyResult>; }
```

**Por que viola:**

- Cria contrato paralelo fora do `OCRRuntimePort` oficial.
- Quebra ADL-002 e impede substituição de provider.

### 4.3 Chamar Adapter diretamente

**Exemplo proibido:**

```ts
import { RealTissPersistenceRuntimeAdapter } from "...";
const adapter = new RealTissPersistenceRuntimeAdapter();
```

**Por que viola:**

- Foge do Port e do Factory/Registry.
- Quebra ADL-003 e ADL-004.

### 4.4 Bypass de `getEnterpriseRuntime()`

**Exemplo proibido:**

```ts
const queue = createQueueRuntimePort();
await queue.enqueue(...);
```

**Por que viola:**

- Cria Port fora do Runtime oficial.
- Perde health, observability e controle de providers. Viola ADL-001.

### 4.5 Criar Pipeline paralelo

**Exemplo proibido:**

```ts
// Processar PERSISTED → COMPLETED sem Audit
const completed = await processCompleted(persisted);
```

**Por que viola:**

- Introduz transição `PERSISTED → COMPLETED` fora do state machine congelado.
- Viola ADL-005 e ADL-008.

### 4.6 Duplicar Queue

**Exemplo proibido:**

```ts
const myQueue = createQueueRuntimePort({ provider: "my-backend" });
```

**Por que viola:**

- Cria transporte paralelo, quebrando ADL-006.
- Pode causar duplicidade, perda de mensagens e DLQ independente.

### 4.7 Duplicar Worker

**Exemplo proibido:**

```ts
const myWorker = createWorkerRuntimePort({ provider: "my-worker" });
```

**Por que viola:**

- Cria executor paralelo, competindo com `WorkerRuntimePort` oficial.
- Viola ADL-006 e pode gerar race conditions.

---

## 5. Future Evolution Rules

1. **Toda nova Sprint** deve apresentar `git diff --stat` e justificar qualquer mudança em `src/`.
2. **Novas capabilities** devem ser implementadas usando `getEnterpriseRuntime()` e Ports existentes.
3. **Novos providers** devem ser registrados no `*RuntimeRegistry` oficial e acessíveis via `Factory`.
4. **Novos adapters** não devem ser expostos fora de suas factories.
5. **O state machine TISS** só pode ser estendido após `PERSISTED` (para `Audit` e `Completed`) e nunca inserir estágios intermediários no meio do pipeline congelado.
6. **Infraestrutura compartilhada** (`Queue`, `Worker`, `Scheduler`, `Retry`, `DLQ`, `Observability`) permanece inalterada.
7. **Novas baselines** (v1.2, v2.0 etc.) devem ser formalmente aprovadas e documentadas antes de modificar qualquer decisão deste log.
8. **Enterprise Security** atuará por interceptadores e policies, sem introduzir novos `Ports`/`Runtimes` na Baseline v1.1.

---

## 6. Referências

- [`ENTERPRISE_BASELINE_V1_1.md`](./ENTERPRISE_BASELINE_V1_1.md) — Baseline congelada oficial.
- [`OPER_INF_ROADMAP.md`](./OPER_INF_ROADMAP.md) — Roadmap de ativação e próximas Sprints.
- [`PRODUCTION_GAP_TRACKER.md`](./PRODUCTION_GAP_TRACKER.md) — Acompanhamento de gaps e pendências.
- [`END_TO_END_ENTERPRISE_CERTIFICATION.md`](./END_TO_END_ENTERPRISE_CERTIFICATION.md) — Certificação do pipeline congelado.

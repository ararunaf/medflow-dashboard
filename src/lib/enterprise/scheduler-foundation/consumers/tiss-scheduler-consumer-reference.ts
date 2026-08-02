/**
 * Referência estrutural obrigatória — futuro consumidor TISS (INF-03).
 *
 * O TISS NÃO utiliza o Scheduler Foundation nesta sprint.
 * Este artefato apenas registra que, futuramente, o TISS
 * utilizará o Scheduler Foundation exclusivamente através do ExecutionSchedulerPort.
 *
 * É PROIBIDO:
 * - integrar TISS real
 * - executar Schedules
 * - utilizar cron / timers
 * - invocar TISS Engines / Mapping / Rule Runtime
 * - alterar módulos TISS
 */

/** Identificador estável da referência estrutural do futuro consumidor TISS. */
export const TISS_SCHEDULER_FOUNDATION_CONSUMER_ID =
  "tiss-future-scheduler-foundation-consumer" as const;

/**
 * Referência estrutural — futuro TISS ↔ ExecutionSchedulerPort.
 * Nenhuma integração real. Nenhuma execução. Nenhum processamento.
 */
export type TissSchedulerFoundationConsumerReference = {
  kind: "tiss-scheduler-foundation-consumer-reference";
  consumerId: typeof TISS_SCHEDULER_FOUNDATION_CONSUMER_ID;
  /** Port oficial que o TISS usará no futuro. */
  portContract: "ExecutionSchedulerPort";
  portRef: "ExecutionSchedulerPort";
  /** Worker Port conhecido exclusivamente via Scheduler Foundation. */
  workerPortContract: "ExecutionWorkerPort";
  /** Declara intenção futura de uso do Scheduler Foundation. */
  willUseSchedulerFoundationViaPort: true;
  /** TISS NÃO utiliza Schedulers nesta sprint. */
  currentlyUsesScheduler: false;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
  enginesInvoked: false;
  tissInvoked: false;
  implementsTiss: false;
  realSchedulerBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

/** Constante canônica da referência estrutural TISS → Scheduler Foundation. */
export const TISS_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE: TissSchedulerFoundationConsumerReference =
  {
    kind: "tiss-scheduler-foundation-consumer-reference",
    consumerId: TISS_SCHEDULER_FOUNDATION_CONSUMER_ID,
    portContract: "ExecutionSchedulerPort",
    portRef: "ExecutionSchedulerPort",
    workerPortContract: "ExecutionWorkerPort",
    willUseSchedulerFoundationViaPort: true,
    currentlyUsesScheduler: false,
    executionPerformed: false,
    scheduleExecuted: false,
    cronUsed: false,
    timersUsed: false,
    jobsDispatched: false,
    workersStarted: false,
    processingPerformed: false,
    enginesInvoked: false,
    tissInvoked: false,
    implementsTiss: false,
    realSchedulerBackend: false,
    structuralReferenceOnly: true,
    notes:
      "INF-03 structural consumer reference — TISS will use ExecutionSchedulerPort in the future; TISS does NOT use Schedulers in this sprint",
  };

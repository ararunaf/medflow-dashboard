/**
 * Referência estrutural obrigatória — futuro consumidor IA (INF-03).
 *
 * A IA NÃO utiliza o Scheduler Foundation nesta sprint.
 * Este artefato apenas registra que, futuramente, a IA
 * utilizará o Scheduler Foundation exclusivamente através do ExecutionSchedulerPort.
 *
 * É PROIBIDO:
 * - integrar IA real
 * - executar Schedules
 * - utilizar cron / timers
 * - invocar AI Auditor / AI Ports
 * - alterar módulos de IA
 */

/** Identificador estável da referência estrutural do futuro consumidor IA. */
export const AI_SCHEDULER_FOUNDATION_CONSUMER_ID =
  "ai-future-scheduler-foundation-consumer" as const;

/**
 * Referência estrutural — futuro IA ↔ ExecutionSchedulerPort.
 * Nenhuma integração real. Nenhuma execução. Nenhum processamento.
 */
export type AiSchedulerFoundationConsumerReference = {
  kind: "ai-scheduler-foundation-consumer-reference";
  consumerId: typeof AI_SCHEDULER_FOUNDATION_CONSUMER_ID;
  /** Port oficial que a IA usará no futuro. */
  portContract: "ExecutionSchedulerPort";
  portRef: "ExecutionSchedulerPort";
  /** Worker Port conhecido exclusivamente via Scheduler Foundation. */
  workerPortContract: "ExecutionWorkerPort";
  /** Declara intenção futura de uso do Scheduler Foundation. */
  willUseSchedulerFoundationViaPort: true;
  /** IA NÃO utiliza Schedulers nesta sprint. */
  currentlyUsesScheduler: false;
  executionPerformed: false;
  scheduleExecuted: false;
  cronUsed: false;
  timersUsed: false;
  jobsDispatched: false;
  workersStarted: false;
  processingPerformed: false;
  enginesInvoked: false;
  aiInvoked: false;
  implementsAi: false;
  realSchedulerBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

/** Constante canônica da referência estrutural IA → Scheduler Foundation. */
export const AI_SCHEDULER_FOUNDATION_CONSUMER_REFERENCE: AiSchedulerFoundationConsumerReference = {
  kind: "ai-scheduler-foundation-consumer-reference",
  consumerId: AI_SCHEDULER_FOUNDATION_CONSUMER_ID,
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
  aiInvoked: false,
  implementsAi: false,
  realSchedulerBackend: false,
  structuralReferenceOnly: true,
  notes:
    "INF-03 structural consumer reference — AI will use ExecutionSchedulerPort in the future; AI does NOT use Schedulers in this sprint",
};

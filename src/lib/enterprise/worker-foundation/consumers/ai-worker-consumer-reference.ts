/**
 * Referência estrutural obrigatória — futuro consumidor IA (INF-02).
 *
 * A IA NÃO utiliza o Worker Foundation nesta sprint.
 * Este artefato apenas registra que, futuramente, a IA
 * utilizará o Worker Foundation exclusivamente através do ExecutionWorkerPort.
 *
 * É PROIBIDO:
 * - integrar IA real
 * - executar Workers
 * - processar mensagens
 * - invocar AI Auditor / AI Ports
 * - alterar módulos de IA
 */

/** Identificador estável da referência estrutural do futuro consumidor IA. */
export const AI_WORKER_FOUNDATION_CONSUMER_ID = "ai-future-worker-foundation-consumer" as const;

/**
 * Referência estrutural — futuro IA ↔ ExecutionWorkerPort.
 * Nenhuma integração real. Nenhuma execução. Nenhum processamento.
 */
export type AiWorkerFoundationConsumerReference = {
  kind: "ai-worker-foundation-consumer-reference";
  consumerId: typeof AI_WORKER_FOUNDATION_CONSUMER_ID;
  /** Port oficial que a IA usará no futuro. */
  portContract: "ExecutionWorkerPort";
  portRef: "ExecutionWorkerPort";
  /** Queue Port conhecido exclusivamente via Worker Foundation. */
  queuePortContract: "ExecutionQueuePort";
  /** Declara intenção futura de uso do Worker Foundation. */
  willUseWorkerFoundationViaPort: true;
  /** IA NÃO utiliza Workers nesta sprint. */
  currentlyUsesWorker: false;
  executionPerformed: false;
  threadsSpawned: false;
  backgroundJobsStarted: false;
  concurrencyEnabled: false;
  messagesConsumed: false;
  processingPerformed: false;
  enginesInvoked: false;
  aiInvoked: false;
  implementsAi: false;
  realWorkerBackend: false;
  structuralReferenceOnly: true;
  notes: string;
};

/** Constante canônica da referência estrutural IA → Worker Foundation. */
export const AI_WORKER_FOUNDATION_CONSUMER_REFERENCE: AiWorkerFoundationConsumerReference = {
  kind: "ai-worker-foundation-consumer-reference",
  consumerId: AI_WORKER_FOUNDATION_CONSUMER_ID,
  portContract: "ExecutionWorkerPort",
  portRef: "ExecutionWorkerPort",
  queuePortContract: "ExecutionQueuePort",
  willUseWorkerFoundationViaPort: true,
  currentlyUsesWorker: false,
  executionPerformed: false,
  threadsSpawned: false,
  backgroundJobsStarted: false,
  concurrencyEnabled: false,
  messagesConsumed: false,
  processingPerformed: false,
  enginesInvoked: false,
  aiInvoked: false,
  implementsAi: false,
  realWorkerBackend: false,
  structuralReferenceOnly: true,
  notes:
    "INF-02 structural consumer reference — AI will use ExecutionWorkerPort in the future; AI does NOT use Workers in this sprint",
};

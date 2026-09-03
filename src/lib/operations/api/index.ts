/**
 * Ponto único de importação das server functions operacionais.
 *
 * Componentes/loaders chamam, por ex.:
 *
 *   import { createScheduleFn } from "@/lib/operations/api";
 *   await createScheduleFn({ data: payload });
 */
export * from "./schedules";
export * from "./shifts";
export * from "./assignments";
export * from "./swaps";
export * from "./availability";
export * from "./institutions";
export * from "./work-groups";
export * from "./shift-matching";
export * from "./attendance";
export * from "./attendance-review";
export * from "./recommendation-feedback";
export * from "./operational-memory";
export * from "./operational-copilot-gpt";
export * from "./operational-action-proposals";
export * from "./operational-execution-sandbox";
export * from "./operational-mutation-execution";
export * from "./operational-orchestration";
export * from "./operational-agents";
export * from "./operational-agent-coordination";
export * from "./operational-adaptive-prioritization";
export * from "./operational-policy-intelligence";
export * from "./operational-strategic-planning";
export * from "./queries";
export * from "./operational-timeline";
export type {
  MutationResult,
  MutationError,
  QueryResult,
  QueryError,
} from "@/lib/server/fn-helpers";

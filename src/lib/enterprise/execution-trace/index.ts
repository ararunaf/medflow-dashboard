/**
 * Enterprise Execution Trace Foundation — Ports & Adapters (EPC-24 Sprint 07).
 *
 * Fluxo oficial:
 *   Application → ExecutionTracePort → ExecutionTraceAdapter
 *     → ExecutionTraceStore → ExecutionTraceFactory
 *     → ExecutionTraceProvider
 *
 * O Trace NÃO escreve logs reais. NÃO envia telemetria.
 * NÃO usa observabilidade externa. NÃO persiste em banco.
 * NÃO executa Engines. Apenas representa estruturalmente o rastreamento.
 *
 * Fluxo de orquestração:
 *   Execution Context
 *     → Execution Trace
 *     → Execution Context atualizado (referência estrutural)
 *
 * EPC-24 Sprint 07: rastreamento estrutural apenas.
 * Nenhum log real. Nenhuma telemetria. Nenhuma persistência real.
 * Nenhuma Engine é invocada.
 */
export type {
  AppendTraceInput,
  AppendTraceResult,
  CreateTraceInput,
  CreateTraceResult,
  ExecutionTrace,
  ExecutionTraceCapabilities,
  ExecutionTraceEntry,
  ExecutionTraceHealth,
  ExecutionTraceMetadata,
  ExecutionTraceNode,
  ExecutionTracePort,
  ExecutionTracePortCapabilities,
  ExecutionTracePortHealth,
  ExecutionTraceProviderId,
  ExecutionTraceProviderOptions,
  ExecutionTraceRecordKind,
  ExecutionTraceReference,
  ExecutionTraceResult,
  ExecutionTraceSnapshot,
  ExecutionTraceStatistics,
  ExecutionTraceStatisticsResult,
  ExecutionTraceStep,
  ExecutionTraceTimeline,
  GetTraceInput,
  GetTraceResult,
  ListTraceEntriesInput,
  ListTraceEntriesResult,
} from "./ports";

export {
  STRUCTURAL_TRACE_CAPABILITY,
  createExecutionTraceId,
  createTraceEntryId,
  createTraceNodeId,
  createTraceSnapshotId,
  createTraceStepId,
  createTraceTimelineId,
  resetAllExecutionTraceIdSequences,
  resetExecutionTraceIdSequence,
  resetTraceEntryIdSequence,
  resetTraceNodeIdSequence,
  resetTraceSnapshotIdSequence,
  resetTraceStepIdSequence,
  resetTraceTimelineIdSequence,
} from "./ports";

export {
  DEFAULT_EXECUTION_TRACE_ADAPTER_ID,
  DEFAULT_EXECUTION_TRACE_VERSION,
  DefaultExecutionTraceAdapter,
  MOCK_EXECUTION_TRACE_ADAPTER_ID,
  MOCK_EXECUTION_TRACE_VERSION,
  MockExecutionTraceAdapter,
  type DefaultExecutionTraceRuntime,
  type MockExecutionTraceAdapterOptions,
} from "./adapters";

export {
  DEFAULT_EXECUTION_TRACE_STORE_ID,
  DefaultExecutionTraceStore,
  type DefaultExecutionTraceStoreOptions,
  type ExecutionTraceStore,
  type StoredExecutionTrace,
} from "./store";

export {
  ExecutionTraceFactory,
  createExecutionTraceFactory,
  type ExecutionTraceFactoryOptions,
} from "./factory";

export { createExecutionTracePort } from "./providers";

export { getExecutionTraceHealthSummary, type ExecutionTraceHealthSummary } from "./demo";
